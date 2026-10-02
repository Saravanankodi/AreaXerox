import type { NextRequest } from "next/server";
import { getAdminFirestore, verifyFirebaseIdToken } from "@/lib/firebase/admin";
import {
    calculateOrderPrice,
    paymentSplit
} from "@/lib/pricing";
import { getRazorpay, rupeeToPaise, getPlatformCommissionPercent, computePayoutSplit } from "@/lib/razorpay/server";
import type { Shop, Fulfillment, PaymentMethod, DocumentFile, PrintConfig, Address } from "@/types";

export const runtime = "nodejs";

type AdminFirestore = ReturnType<typeof getAdminFirestore>;

/**
 * Legacy order ids are `OMX-<4 digits>` (random), so online ids start above that
 * range to stay collision-free while keeping the `OMX-<n>` shape that
 * `generateOrderId` understands.
 */
const FIRST_ONLINE_ORDER_ID = 10_000;

/**
 * Reserves the next `OMX-<n>` id inside a transaction so the sequence stays
 * monotonic and collision-free across concurrent checkouts. The id doubles as
 * the Razorpay receipt, which is how /confirm-payment recognises the draft as
 * its own.
 */
async function nextOrderId(db: AdminFirestore): Promise<string> {
    const ref = db.doc("platform/counters/orders");
    const next = await db.runTransaction(async (tx) => {
        const snapshot = await tx.get(ref);
        const current = Number(snapshot.data()?.value);
        const value = (Number.isFinite(current) ? current : FIRST_ONLINE_ORDER_ID - 1) + 1;
        tx.set(ref, { value }, { merge: true });
        return value;
    });
    return `OMX-${next}`;
}

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get("authorization") ?? "";
        const user = await verifyFirebaseIdToken(authHeader.replace(/^Bearer\s+/i, ""));

        const body = await request.json();
        const {
            shopId,
            documents,
            config,
            fulfillment,
            address,
            paymentMethod, // "full" | "advance"
            notes
        } = body as {
            shopId: string;
            documents: DocumentFile[];
            config: PrintConfig;
            fulfillment: Fulfillment;
            address?: Address | null;
            paymentMethod: PaymentMethod;
            notes?: string;
        };

        if (!shopId || !documents || documents.length === 0 || !config || !paymentMethod) {
            return Response.json({ error: "Missing required order fields." }, { status: 400 });
        }

        if (paymentMethod !== "full" && paymentMethod !== "advance") {
            return Response.json({ error: "Only full and advance online payment methods are supported." }, { status: 400 });
        }

        const db = getAdminFirestore();
        const shopSnapshot = await db.doc(`shops/${shopId}`).get();
        if (!shopSnapshot.exists) {
            return Response.json({ error: "Shop not found." }, { status: 404 });
        }
        const shop = shopSnapshot.data() as Shop;

        // Calculate the authoritative order total. paymentSplit reads the shop's
        // own advance settings, exactly as the client does, so the amount charged
        // here can never disagree with the amount shown at checkout.
        const price = calculateOrderPrice(shop, documents, config, fulfillment);
        const totalPaise = rupeeToPaise(price.total);

        const split = paymentSplit(shop, price.total, paymentMethod);
        const paidPaise = rupeeToPaise(split.paidNow);

        if (totalPaise <= 0 || paidPaise < 100) {
            return Response.json({ error: "Invalid payment amount calculated." }, { status: 400 });
        }

        // Set up payout transfers if applicable
        const payoutEnabled = shop.payoutEnabled === true && !!shop.razorpayAccountId;
        const transfers: { account: string; amount: number; currency: string; notes: Record<string, string> }[] = [];

        // Server-issued order id from a monotonic counter, so two customers can
        // never end up with the same id (and can never overwrite each other).
        const generatedId = await nextOrderId(db);

        if (payoutEnabled) {
            const commissionPercent = await getPlatformCommissionPercent();
            const { shopkeeperPaise } = computePayoutSplit(paidPaise, commissionPercent);
            if (shopkeeperPaise > 0) {
                transfers.push({
                    account: shop.razorpayAccountId as string,
                    amount: shopkeeperPaise,
                    currency: "INR",
                    notes: {
                        platform: "xeroxmate",
                        order: generatedId,
                        shop: shopId.slice(0, 40),
                    },
                });
            }
        }

        // Create Razorpay order
        const razorpay = getRazorpay();
        const rzpOrder = await razorpay.orders.create({
            amount: paidPaise,
            currency: "INR",
            receipt: generatedId.slice(0, 40),
            notes: {
                platform: "xeroxmate",
                order: generatedId.slice(0, 40),
                customer: (user.email ?? "customer").slice(0, 40),
            },
            ...(transfers.length ? { transfers } : {}),
        });

        return Response.json({
            key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? process.env.RAZORPAY_KEY_ID,
            razorpayOrderId: rzpOrder.id,
            amountPaise: paidPaise,
            currency: "INR",
            name: shop.name,
            description: `Order ${generatedId}`,
            prefill: {
                contact: user.phoneNumber,
                email: user.email,
            },
            // Pass the server-calculated order config back to the client so it
            // can be replayed to /confirm-payment. Prices are never trusted from
            // the client: confirm-payment recalculates them from the shop doc.
            orderDraft: {
                id: generatedId,
                shopId,
                documents,
                config,
                fulfillment,
                address,
                paymentMethod,
                notes,
            }
        });
    } catch (error: unknown) {
        console.error("prepare-payment error:", error);
        const message = error instanceof Error ? error.message : "Failed to prepare payment";
        return Response.json({ error: message }, { status: 500 });
    }
}
