import type { NextRequest } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";

import { getRazorpayCredentials } from "@/lib/razorpay/server";
import { getAdminFirestore, verifyFirebaseIdToken } from "@/lib/firebase/admin";

export const runtime = "nodejs";

function verifySignature(payload: string, signature: string, secret: string): boolean {
  const expected = createHmac("sha256", secret).update(payload).digest();
  const provided = Buffer.from(signature, "hex");
  return provided.length === expected.length && timingSafeEqual(provided, expected);
}

interface OrderSnap {
  id?: string;
  customerId?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  paymentStatus?: string;
  amountPaid: number;
  balance: number;
  razorpaySignature?: string;
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization") ?? "";
    await verifyFirebaseIdToken(authHeader.replace(/^Bearer\s+/i, ""));

    let body: {
      razorpay_order_id?: string;
      razorpay_payment_id?: string;
      razorpay_signature?: string;
    };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return Response.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return Response.json(
        { error: "razorpay_order_id, razorpay_payment_id and razorpay_signature are required." },
        { status: 400 }
      );
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
    const orderSnapshot = await db
      .collection("orders")
      .where("razorpayOrderId", "==", razorpay_order_id)
      .limit(1)
      .get();

    if (orderSnapshot.empty) {
      return Response.json({ error: "No order matches this payment." }, { status: 404 });
    }

    const doc = orderSnapshot.docs[0];
    const orderData = doc.data() as unknown as OrderSnap;
    const now = new Date().toISOString();

    // Idempotency: if the same payment was already verified, report success again.
    if (orderData.razorpayPaymentId === razorpay_payment_id) {
      return Response.json({
        orderId: doc.id,
        paymentStatus: "paid",
        razorpayPaymentId: razorpay_payment_id,
        idempotent: true,
      });
    }

    const paymentStatus = orderData.balance > 0 ? "partial" : "paid";
    const patch: Record<string, unknown> = {
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      paymentStatus,
      settlementStatus: "pending",
      updatedAt: now,
    };

    await doc.ref.set(patch, { merge: true });

    return Response.json({
      orderId: doc.id,
      paymentStatus,
      razorpayPaymentId: razorpay_payment_id,
    });
  } catch (error: unknown) {
    console.error("Razorpay checkout/verify error:", error);
    return Response.json({ error: "Payment verification failed." }, { status: 500 });
  }
}