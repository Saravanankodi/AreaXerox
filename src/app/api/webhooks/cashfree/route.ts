import type { NextRequest } from "next/server";
import {
    getCashfreeCredentials,
    verifyCashfreeWebhookSignature,
} from "@/lib/cashfree/server";
import { getAdminFirestore } from "@/lib/firebase/admin";

export const runtime = "nodejs";

interface CashfreeWebhookPayload {
    type?: string;
    event?: string;
    event_time?: string;
    data?: {
        order?: {
            order_id?: string;
            order_amount?: number;
            order_currency?: string;
        };
        payment?: {
            cf_payment_id?: string | number;
            payment_status?: string;
            payment_amount?: number;
            payment_currency?: string;
            payment_message?: string;
            payment_group?: string;
        };
        customer_details?: {
            customer_id?: string;
            customer_name?: string;
            customer_email?: string;
            customer_phone?: string;
        };
    };
}

export async function GET() {
    return Response.json({
        status: "active",
        service: "Cashfree Webhook Endpoint",
        timestamp: new Date().toISOString(),
    });
}

export async function POST(request: NextRequest) {
    const rawBody = await request.text();
    const signature =
        request.headers.get("x-webhook-signature") ??
        request.headers.get("signature") ??
        "";
    const timestamp =
        request.headers.get("x-webhook-timestamp") ??
        request.headers.get("timestamp") ??
        "";

    // Check if request is a test ping from Cashfree Dashboard
    const isTestPing =
        !rawBody.trim() ||
        signature === "test" ||
        signature === "dummy" ||
        rawBody.toLowerCase().includes("test") ||
        request.headers.get("user-agent")?.toLowerCase().includes("cashfree");

    let payload: CashfreeWebhookPayload = {};
    try {
        if (rawBody.trim()) {
            payload = JSON.parse(rawBody);
        }
    } catch {
        if (isTestPing) {
            return Response.json({ ok: true, status: "test_ping_acknowledged" }, { status: 200 });
        }
        return Response.json({ error: "Invalid JSON payload." }, { status: 400 });
    }

    const eventType = payload.type ?? payload.event ?? "";

    // Acknowledge Cashfree dashboard test requests immediately with 200 OK
    if (
        isTestPing ||
        eventType.toLowerCase().includes("test") ||
        (!signature && !timestamp)
    ) {
        return Response.json(
            { ok: true, message: "Cashfree test webhook acknowledged successfully." },
            { status: 200 }
        );
    }

    const { secretKey } = getCashfreeCredentials();

    if (!secretKey) {
        console.error("Cashfree webhook received but CASHFREE_SECRET_KEY is not configured.");
        return Response.json({ error: "Webhook not configured." }, { status: 500 });
    }

    // Verify HMAC signature for live production webhooks
    const isValid = verifyCashfreeWebhookSignature(rawBody, timestamp, signature, secretKey);
    if (!isValid) {
        console.warn("Cashfree webhook signature mismatch.");
        return Response.json({ error: "Invalid signature." }, { status: 400 });
    }

    const db = getAdminFirestore();

    try {
        if (eventType === "PAYMENT_SUCCESS_WEBHOOK") {
            const orderInfo = payload.data?.order;
            const paymentInfo = payload.data?.payment;

            const cashfreeOrderId = orderInfo?.order_id;
            const cfPaymentId = paymentInfo?.cf_payment_id
                ? String(paymentInfo.cf_payment_id)
                : null;

            if (!cashfreeOrderId) {
                return Response.json({ ok: true, ignored: "no order_id" });
            }

            // Look up order in Firestore by cashfreeOrderId or direct order id
            let orderSnapshot = await db
                .collection("orders")
                .where("cashfreeOrderId", "==", cashfreeOrderId)
                .limit(1)
                .get();

            let doc = orderSnapshot.docs[0];

            if (!doc) {
                // Fallback: try removing 'OMX_' prefix if present
                const strippedId = cashfreeOrderId.replace(/^OMX_/, "");
                const docRef = db.collection("orders").doc(strippedId);
                const snap = await docRef.get();
                if (snap.exists) {
                    doc = snap as unknown as typeof doc;
                }
            }

            if (!doc || !doc.exists) {
                console.warn(`Cashfree webhook: Order not found for ${cashfreeOrderId}`);
                return Response.json({ ok: true, ignored: "order_not_found" });
            }

            const orderData = doc.data() as {
                balance?: number;
                cashfreePaymentId?: string;
                paymentStatus?: string;
            };

            // Idempotent: re-delivery of the same webhook must not overwrite
            if (
                cfPaymentId &&
                orderData.cashfreePaymentId === cfPaymentId &&
                orderData.paymentStatus === "paid"
            ) {
                return Response.json({ ok: true, ignored: "already_verified" });
            }

            const patch: Record<string, unknown> = {
                cashfreePaymentId: cfPaymentId || `cf_pay_${cashfreeOrderId}`,
                cashfreeOrderId,
                paymentGateway: "cashfree",
                settlementStatus: "pending",
                updatedAt: new Date().toISOString(),
            };

            if (orderData.balance === undefined || orderData.balance === 0) {
                patch.paymentStatus = "paid";
            }

            await doc.ref.set(patch, { merge: true });

            return Response.json({ ok: true, event: eventType });
        }

        if (
            eventType === "PAYMENT_FAILED_WEBHOOK" ||
            eventType === "PAYMENT_USER_DROPPED_WEBHOOK"
        ) {
            const orderInfo = payload.data?.order;
            console.info(`Cashfree payment failed/dropped for order ${orderInfo?.order_id}`);
            return Response.json({ ok: true, event: eventType });
        }

        // Unhandled or informational events acknowledged safely
        return Response.json({ ok: true, ignored: "unsupported_event" });
    } catch (error: unknown) {
        console.error("Cashfree webhook processing error:", error);
        return Response.json({ error: "Webhook processing failed." }, { status: 500 });
    }
}
