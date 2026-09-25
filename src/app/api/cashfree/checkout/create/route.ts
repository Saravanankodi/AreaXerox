import type { NextRequest } from "next/server";
import type { Order } from "@/types";

import {
    computePayoutSplitRupees,
    createCashfreeOrder,
    getCashfreeCredentials,
    getPlatformCommissionPercent,
} from "@/lib/cashfree/server";
import { getAdminFirestore, verifyFirebaseIdToken } from "@/lib/firebase/admin";

export const runtime = "nodejs";

async function readDoc(path: string) {
    const ref = getAdminFirestore().doc(path);
    const snapshot = await ref.get();
    if (!snapshot.exists) return null;
    return { ref, data: snapshot.data() as Record<string, unknown> };
}

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get("authorization") ?? "";
        const user = await verifyFirebaseIdToken(authHeader.replace(/^Bearer\s+/i, ""));

        let body: { orderId?: string };
        try {
            body = (await request.json()) as { orderId?: string };
        } catch {
            return Response.json({ error: "Invalid JSON body." }, { status: 400 });
        }

        const orderId = body.orderId?.trim();
        if (!orderId) {
            return Response.json({ error: "Missing orderId." }, { status: 400 });
        }

        const order = await readDoc(`orders/${orderId}`);
        if (!order) {
            return Response.json({ error: "Order not found." }, { status: 404 });
        }
        const orderData = order.data as unknown as Order;
        if (orderData.customerId && orderData.customerId !== user.uid) {
            return Response.json({ error: "You do not own this order." }, { status: 403 });
        }

        // Only full/advance methods are payable online.
        if (
            orderData.paymentMethod === "cash_pickup" ||
            orderData.paymentMethod === "cash_delivery"
        ) {
            return Response.json({ error: "This order is not payable online." }, { status: 400 });
        }

        // If money captured — nothing to do.
        const alreadyPaid =
            typeof orderData.cashfreePaymentId === "string" ||
            typeof orderData.razorpayPaymentId === "string" ||
            orderData.paymentStatus === "paid";
        if (alreadyPaid) {
            return Response.json({
                orderId,
                cashfreeOrderId: orderData.cashfreeOrderId ?? null,
                amount: orderData.amountPaid,
                paymentStatus: orderData.paymentStatus,
                paid: true,
            });
        }

        /* -----------------------------------------------------
         * AMOUNT RESOLUTION
         * --------------------------------------------------- */
        const total = Math.max(0, orderData.price?.total ?? 0);
        const storedAmount = Math.max(0, orderData.amountPaid ?? 0);
        let payableAmount = orderData.paymentMethod === "full" ? total : storedAmount;
        if (total > 0) payableAmount = Math.min(payableAmount, total);
        payableAmount = Math.max(1.0, payableAmount); // Minimum payable amount ₹1.00

        if (!Number.isFinite(payableAmount) || payableAmount < 1.0) {
            return Response.json(
                { error: "This order has no payable amount." },
                { status: 400 }
            );
        }

        /* -----------------------------------------------------
         * VENDOR PAYOUT SPLIT RESOLUTION (CASHFREE EASY SPLIT)
         * --------------------------------------------------- */
        let vendorSplit: { vendorId: string; amount: number } | undefined;

        if (orderData.shopId) {
            const shopDoc = await readDoc(`shops/${orderData.shopId}`);
            if (shopDoc) {
                const shopData = shopDoc.data as {
                    cashfreeVendorId?: string;
                    payoutEnabled?: boolean;
                };

                if (shopData.cashfreeVendorId && shopData.payoutEnabled) {
                    const commissionPercent = await getPlatformCommissionPercent();
                    const { shopkeeperShare } = computePayoutSplitRupees(
                        payableAmount,
                        commissionPercent
                    );
                    if (shopkeeperShare > 0) {
                        vendorSplit = {
                            vendorId: shopData.cashfreeVendorId,
                            amount: shopkeeperShare,
                        };
                    }
                }
            }
        }

        /* -----------------------------------------------------
         * CREATE CASHFREE ORDER WITH VENDOR SPLIT
         * --------------------------------------------------- */
        const credentials = getCashfreeCredentials();
        const origin = request.headers.get("origin") || request.nextUrl.origin;
        const notifyUrl = `${origin}/api/webhooks/cashfree`;
        const returnUrl = `${origin}/orders/${orderId}?cf_id={order_id}`;

        // Sanitized cashfree order id: OMX_orderId
        const cashfreeOrderId = `OMX_${orderId.replace(/[^a-zA-Z0-9_-]/g, "_")}`.slice(0, 45);

        const cfOrder = await createCashfreeOrder({
            orderId: cashfreeOrderId,
            amount: payableAmount,
            currency: "INR",
            customer: {
                id: user.uid,
                name: orderData.customerName || "Customer",
                email: user.email || undefined,
                phone: orderData.customerPhone || "9999999999",
            },
            vendorSplit,
            note: `Print Order ${orderId}`,
            notifyUrl,
            returnUrl,
        });

        // Save Cashfree Order details server-side
        await order.ref.set(
            {
                cashfreeOrderId: cfOrder.order_id,
                cashfreePaymentSessionId: cfOrder.payment_session_id,
                paymentGateway: "cashfree",
                updatedAt: new Date().toISOString(),
            },
            { merge: true }
        );

        return Response.json({
            orderId,
            cashfreeOrderId: cfOrder.order_id,
            paymentSessionId: cfOrder.payment_session_id,
            environment: credentials.environment,
            amount: payableAmount,
            currency: "INR",
            name: orderData.shopName,
            description: `Order ${orderId}`,
            paymentStatus: orderData.paymentStatus,
        });
    } catch (error: unknown) {
        console.error("Cashfree checkout/create error:", error);
        const msg = error instanceof Error ? error.message : "Could not create Cashfree payment session.";
        return Response.json({ error: msg }, { status: 500 });
    }
}
