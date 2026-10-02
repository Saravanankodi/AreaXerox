import type { NextRequest } from "next/server";
import { getAdminFirestore, verifyFirebaseIdToken } from "@/lib/firebase/admin";
import {
    calculateOrderPrice,
    paymentSplit
} from "@/lib/pricing";
import { getRazorpay, getRazorpayCredentials, rupeeToPaise } from "@/lib/razorpay/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { Order, Shop, DocumentFile, PrintConfig, Fulfillment, Address, PaymentMethod } from "@/types";

export const runtime = "nodejs";

function verifySignature(payload: string, signature: string, secret: string): boolean {
    const expected = createHmac("sha256", secret).update(payload).digest();
    const provided = Buffer.from(signature, "hex");
    return provided.length === expected.length && timingSafeEqual(provided, expected);
}

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get("authorization") ?? "";
        const user = await verifyFirebaseIdToken(authHeader.replace(/^Bearer\s+/i, ""));

        const body = await request.json();
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            orderDraft
        } = body as {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
            orderDraft: {
                id: string;
                shopId: string;
                documents: DocumentFile[];
                config: PrintConfig;
                fulfillment: Fulfillment;
                address?: Address | null;
                paymentMethod: PaymentMethod;
                notes?: string;
            };
        };

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderDraft) {
            return Response.json({ error: "Missing required fields." }, { status: 400 });
        }

        const {
            id: orderId,
            shopId,
            documents,
            config,
            fulfillment,
            address,
            paymentMethod,
            notes
        } = orderDraft;

        if (!orderId || !shopId || !Array.isArray(documents) || documents.length === 0 || !config || !fulfillment || !paymentMethod) {
            return Response.json({ error: "Invalid order draft." }, { status: 400 });
        }

        const { key_secret } = getRazorpayCredentials();
        if (!verifySignature(
            `${razorpay_order_id}|${razorpay_payment_id}`,
            razorpay_signature,
            key_secret
        )) {
            return Response.json({ error: "Invalid payment signature." }, { status: 400 });
        }

        const db = getAdminFirestore();

        // Idempotency check: see if an order is already created with this razorpay_order_id
        const existingSnap = await db.collection("orders").where("razorpayOrderId", "==", razorpay_order_id).limit(1).get();
        if (!existingSnap.empty) {
            const existingDoc = existingSnap.docs[0];
            return Response.json({
                orderId: existingDoc.id,
                paymentStatus: existingDoc.data().paymentStatus
            });
        }

        // The draft round-trips through the browser, so never trust its id on its
        // own: the receipt on the Razorpay order is what /prepare-payment issued
        // for this checkout. Without this check any customer could aim a valid
        // payment at another customer's order document.
        const razorpayOrder = await getRazorpay().orders.fetch(razorpay_order_id);
        if (razorpayOrder.receipt !== orderId) {
            return Response.json({ error: "Payment does not match this order." }, { status: 400 });
        }

        const shopSnapshot = await db.doc(`shops/${shopId}`).get();
        if (!shopSnapshot.exists) {
            return Response.json({ error: "Shop not found." }, { status: 404 });
        }
        const shop = shopSnapshot.data() as Shop;

        // Recalculate everything from the shop document, then require the amount
        // Razorpay actually charged to match it, so a tampered draft cannot
        // change what was paid.
        const price = calculateOrderPrice(shop, documents, config, fulfillment);
        const split = paymentSplit(shop, price.total, paymentMethod);

        if (Number(razorpayOrder.amount) !== rupeeToPaise(split.paidNow)) {
            return Response.json({ error: "Payment amount does not match the order total." }, { status: 400 });
        }

        // Guard the write itself: an id is only ours if nothing is stored there.
        const targetDoc = db.doc(`orders/${orderId}`);
        if ((await targetDoc.get()).exists) {
            return Response.json({ error: "Order already exists." }, { status: 409 });
        }

        const now = new Date().toISOString();
        const primaryConfig = documents[0]?.printConfig ?? config;
        const primaryPaper = shop.paperTypes.find((item) => item.id === primaryConfig.paperTypeId);

        // Resolve user data if missing
        let customerName = "Customer";
        let customerPhone = "";
        try {
            const userDoc = await db.doc(`users/${user.uid}`).get();
            if (userDoc.exists) {
                const u = userDoc.data();
                if (u) {
                    customerName = String(u.name || u.profile?.name || "Customer");
                    customerPhone = String(u.phone || u.profile?.phone || "");
                }
            }
        } catch { }

        const order: Order = {
            id: orderId,
            customerId: user.uid,
            customerName,
            customerPhone,
            shopId: shop.id,
            shopName: shop.name,
            documents,
            config: primaryConfig,
            configLabels: {
                paper: primaryPaper?.name ?? "A4 Paper",
                printType: primaryConfig.printType === "bw" ? "Black & White" : "Colour",
                side: primaryConfig.side === "single" ? "Single Side" : "Double Side",
                orientation: primaryConfig.orientation === "portrait" ? "Portrait" : "Landscape",
                binding: shop.binding.find((b) => b.id === primaryConfig.bindingId)?.name ?? "None",
                additional: primaryConfig.additionalIds
                    .map((id) => shop.additional.find((a) => a.id === id)?.name)
                    .filter((n): n is string => !!n),
            },
            fulfillment,
            address: fulfillment === "delivery" ? address || null : null,
            notes: notes?.trim() || undefined,
            price,
            paymentMethod,
            amountPaid: split.paidNow,
            balance: split.balance,
            paymentStatus: split.paidNow === 0 ? "unpaid" : split.balance === 0 ? "paid" : "partial",
            status: "NEW",
            createdAt: now,
            updatedAt: now,
            timeline: [{ status: "NEW", at: now }],
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            razorpaySignature: razorpay_signature,
            paymentGateway: "razorpay",
            // payment.captured usually reaches the webhook before the browser
            // calls this route, so mark the payout as pending here as well and
            // let the webhook's transfer events advance it.
            settlementStatus: "pending",
            razorpayPayoutStatus: shop.payoutEnabled === true && !!shop.razorpayAccountId ? "pending" : undefined,
        };

        await targetDoc.set(order);

        return Response.json({
            orderId,
            paymentStatus: order.paymentStatus
        });
    } catch (error: unknown) {
        console.error("confirm-payment error:", error);
        const message = error instanceof Error ? error.message : "Failed to confirm payment";
        return Response.json({ error: message }, { status: 500 });
    }
}
