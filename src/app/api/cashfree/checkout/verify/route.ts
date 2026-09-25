import type { NextRequest } from "next/server";
import type { Order } from "@/types";

import {
    fetchCashfreeOrder,
    fetchCashfreeOrderPayments,
} from "@/lib/cashfree/server";
import { getAdminFirestore, verifyFirebaseIdToken } from "@/lib/firebase/admin";

export const runtime = "nodejs";

interface VerifyRequestBody {
    orderId?: string;
    cashfreeOrderId?: string;
}

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get("authorization") ?? "";
        const user = await verifyFirebaseIdToken(authHeader.replace(/^Bearer\s+/i, ""));

        let body: VerifyRequestBody;
        try {
            body = (await request.json()) as VerifyRequestBody;
        } catch {
            return Response.json({ error: "Invalid JSON body." }, { status: 400 });
        }

        const { orderId, cashfreeOrderId } = body;
        if (!orderId && !cashfreeOrderId) {
            return Response.json(
                { error: "orderId or cashfreeOrderId is required." },
                { status: 400 }
            );
        }

        const db = getAdminFirestore();

        // Query order document from Firestore
        let docRef = orderId ? db.collection("orders").doc(orderId) : null;
        let docSnap = docRef ? await docRef.get() : null;

        if (!docSnap || !docSnap.exists) {
            if (cashfreeOrderId) {
                const querySnap = await db
                    .collection("orders")
                    .where("cashfreeOrderId", "==", cashfreeOrderId)
                    .limit(1)
                    .get();
                if (!querySnap.empty) {
                    docSnap = querySnap.docs[0];
                    docRef = docSnap.ref;
                }
            }
        }

        if (!docSnap || !docSnap.exists || !docRef) {
            return Response.json({ error: "Order not found." }, { status: 404 });
        }

        const orderData = docSnap.data() as unknown as Order;

        // Ownership check
        if (orderData.customerId && orderData.customerId !== user.uid) {
            return Response.json({ error: "You do not own this order." }, { status: 403 });
        }

        const targetCfOrderId = cashfreeOrderId || orderData.cashfreeOrderId;
        if (!targetCfOrderId) {
            return Response.json(
                { error: "No Cashfree payment session found for this order." },
                { status: 400 }
            );
        }

        /* -----------------------------------------------------
         * SERVER-SIDE VERIFICATION VIA CASHFREE API
         * --------------------------------------------------- */
        const cfOrder = await fetchCashfreeOrder(targetCfOrderId);

        // Fetch payment transactions for this order
        const payments = await fetchCashfreeOrderPayments(targetCfOrderId).catch(() => []);
        const successPayment = payments.find((p) => p.payment_status === "SUCCESS");

        const isPaidOnCashfree = cfOrder.order_status === "PAID" || !!successPayment;

        if (!isPaidOnCashfree) {
            return Response.json(
                {
                    error: `Payment is not completed. Cashfree status: ${cfOrder.order_status}`,
                    cashfreeStatus: cfOrder.order_status,
                },
                { status: 400 }
            );
        }

        /* -----------------------------------------------------
         * AMOUNT TAMPERING / INTEGRITY CHECK
         * --------------------------------------------------- */
        const expectedTotal = Math.max(0, orderData.price?.total ?? 0);
        const expectedStored = Math.max(0, orderData.amountPaid ?? 0);
        let expectedPayable =
            orderData.paymentMethod === "full" ? expectedTotal : expectedStored;
        if (expectedTotal > 0) expectedPayable = Math.min(expectedPayable, expectedTotal);
        expectedPayable = Math.max(1.0, expectedPayable);

        // Check if Cashfree captured amount is significantly less than expected (allowing 1 paisa rounding diff)
        if (cfOrder.order_amount < expectedPayable - 0.05) {
            console.error(
                `Amount mismatch for order ${docSnap.id}: expected ${expectedPayable}, got ${cfOrder.order_amount}`
            );
            return Response.json(
                { error: "Payment amount mismatch detected." },
                { status: 400 }
            );
        }

        const cfPaymentId = successPayment?.cf_payment_id || `cf_pay_${targetCfOrderId}`;
        const now = new Date().toISOString();

        // Idempotency check: already verified
        if (orderData.cashfreePaymentId === cfPaymentId && orderData.paymentStatus === "paid") {
            return Response.json({
                orderId: docSnap.id,
                paymentStatus: "paid",
                cashfreePaymentId: cfPaymentId,
                idempotent: true,
            });
        }

        const paymentStatus = orderData.balance > 0 ? "partial" : "paid";
        const patch: Record<string, unknown> = {
            cashfreePaymentId: cfPaymentId,
            cashfreeOrderId: targetCfOrderId,
            paymentStatus,
            paymentGateway: "cashfree",
            settlementStatus: "pending",
            updatedAt: now,
        };

        await docRef.set(patch, { merge: true });

        return Response.json({
            orderId: docSnap.id,
            paymentStatus,
            cashfreePaymentId: cfPaymentId,
        });
    } catch (error: unknown) {
        console.error("Cashfree checkout/verify error:", error);
        const msg = error instanceof Error ? error.message : "Payment verification failed.";
        return Response.json({ error: msg }, { status: 500 });
    }
}
