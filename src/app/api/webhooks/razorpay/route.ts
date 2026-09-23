import * as crypto from "node:crypto";
import type { NextRequest } from "next/server";

import { mapActivationStatus, toRequirements } from "@/lib/razorpay/server";
import { getRazorpayWebhookSecret } from "@/lib/razorpay/server";
import { getAdminFirestore } from "@/lib/firebase/admin";

export const runtime = "nodejs";

function signatureMatches(body: string, signature: string, secret: string): boolean {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(body, "utf8")
    .digest("hex");

  const a = Buffer.from(signature, "hex");
  const b = Buffer.from(expected, "hex");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

type RazorpayEvent =
  | "payment.captured"
  | "payment.failed"
  | "transfer.processed"
  | "transfer.failed"
  | "product.route.activated"
  | "product.route.needs_clarification"
  | "product.route.under_review"
  | string;

interface WebhookEntity {
  id?: string;
  account_id?: string;
  order_id?: string;
  activation_status?: string;
  amount?: number;
  amount_transferred?: number;
  requirements?: { field_reference?: string; reason_code?: string; status?: string }[];
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";

  let secret = "";
  try {
    secret = getRazorpayWebhookSecret();
  } catch {
    return Response.json({ error: "Webhook not configured." }, { status: 500 });
  }

  if (!signatureMatches(rawBody, signature, secret)) {
    return Response.json({ error: "Invalid signature." }, { status: 400 });
  }

  let payload: {
    event?: RazorpayEvent;
    payload?: {
      payment?: { entity?: WebhookEntity };
      transfer?: { entity?: WebhookEntity };
      order?: { entity?: WebhookEntity };
    };
  };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return Response.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const event: RazorpayEvent = payload.event ?? "";
  const db = getAdminFirestore();

  try {
    if (event === "payment.captured") {
      const entity = payload.payload?.payment?.entity;
      if (!entity?.order_id) {
        return Response.json({ ok: true, ignored: "no order_id" });
      }

      const orderSnapshot = await db
        .collection("orders")
        .where("razorpayOrderId", "==", entity.order_id)
        .limit(1)
        .get();
      const doc = orderSnapshot.docs[0];
      if (!doc) {
        return Response.json({ ok: true, ignored: "order_not_found" });
      }

      const orderData = doc.data() as { balance?: number; razorpayPaymentId?: string };
      // Idempotent: re-delivery of the same webhook must not overwrite a newer verify.
      if (orderData.razorpayPaymentId && orderData.razorpayPaymentId !== entity.id) {
        return Response.json({ ok: true, ignored: "already_verified" });
      }

      const patch: Record<string, unknown> = {
        razorpayPaymentId: entity.id,
        settlementStatus: "pending",
        updatedAt: new Date().toISOString(),
      };
      if (orderData.balance === undefined || orderData.balance === 0) {
        patch.paymentStatus = "paid";
      }
      await doc.ref.set(patch, { merge: true });

      return Response.json({ ok: true, event });
    }

    if (event === "transfer.processed" || event === "transfer.failed") {
      const entity = payload.payload?.transfer?.entity;
      if (!entity?.id) {
        return Response.json({ ok: true, ignored: "no_transfer_id" });
      }

      const bySource = entity.order_id
        ? await db.collection("orders").where("razorpayOrderId", "==", entity.order_id).limit(1).get()
        : null;
      let doc = bySource?.docs[0] ?? null;
      if (!doc) {
        const byTransfer = await db
          .collection("orders")
          .where("razorpayTransferIds", "array-contains", entity.id)
          .limit(1)
          .get();
        doc = byTransfer.docs[0] ?? null;
      }
      if (!doc) {
        return Response.json({ ok: true, ignored: "order_not_found" });
      }

      const orderData = doc.data() as { razorpayTransferIds?: string[] };
      const transferIds = Array.isArray(orderData.razorpayTransferIds)
        ? orderData.razorpayTransferIds
        : [];
      if (transferIds.includes(entity.id)) {
        return Response.json({ ok: true, ignored: "already_recorded" });
      }

      await doc.ref.set(
        {
          razorpayTransferIds: [...transferIds, entity.id],
          razorpayPayoutStatus: event === "transfer.processed" ? "transferred" : "failed",
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      return Response.json({ ok: true, event });
    }

    if (event.startsWith("product.route.")) {
      const entity = payload.payload?.payment?.entity;
      if (!entity?.account_id) {
        return Response.json({ ok: true, ignored: "no_account_id" });
      }

      const shopSnapshot = await db
        .collection("shops")
        .where("razorpayAccountId", "==", entity.account_id)
        .limit(1)
        .get();
      const doc = shopSnapshot.docs[0];
      if (!doc) {
        return Response.json({ ok: true, ignored: "shop_not_found" });
      }

      const status = mapActivationStatus(entity.activation_status);
      await doc.ref.set(
        {
          razorpayProductId: entity.id,
          razorpayOnboardingStatus: status,
          payoutEnabled: status === "activated",
          razorpayRequirements: toRequirements(entity.requirements),
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      return Response.json({ ok: true, event });
    }

    // Acknowledged but intentionally unhandled events.
    return Response.json({ ok: true, ignored: "unsupported_event" });
  } catch (error: unknown) {
    console.error("Razorpay webhook error:", error);
    return Response.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}