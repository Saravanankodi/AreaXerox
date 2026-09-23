import type { NextRequest } from "next/server";
import type { Order, Shop } from "@/types";

import { computePayoutSplit, getRazorpay, getPlatformCommissionPercent, rupeeToPaise } from "@/lib/razorpay/server";
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
    if (orderData.customerId !== user.uid) {
      return Response.json({ error: "You do not own this order." }, { status: 403 });
    }

    // Only full/advance methods are payable online.
    if (orderData.paymentMethod === "cash_pickup" || orderData.paymentMethod === "cash_delivery") {
      return Response.json({ error: "This order is not payable online." }, { status: 400 });
    }

    // Money captured on Razorpay — nothing to do.
    const alreadyPaid =
      typeof orderData.razorpayPaymentId === "string" || !!orderData.razorpaySignature;
    if (alreadyPaid) {
      return Response.json({
        orderId,
        razorpayOrderId: orderData.razorpayOrderId ?? null,
        amountPaise: rupeeToPaise(orderData.amountPaid),
        paymentStatus: orderData.paymentStatus,
        paid: true,
      });
    }

    // Resume an in-flight checkout instead of creating a duplicate order.
    if (orderData.razorpayOrderId) {
      return Response.json({
        orderId,
        razorpayOrderId: orderData.razorpayOrderId,
        amountPaise: rupeeToPaise(orderData.amountPaid),
        currency: "INR",
        name: orderData.shopName,
        paymentStatus: orderData.paymentStatus,
        prefill: { contact: orderData.customerPhone, name: orderData.customerName },
        resume: true,
      });
    }

    /* -----------------------------------------------------
     * SERVER-SIDE AMOUNT RESOLUTION
     * --------------------------------------------------- */
    const shop = await readDoc(`shops/${orderData.shopId}`);
    const totalPaise = rupeeToPaise(orderData.price?.total ?? 0);

    // The charge was fixed when the order was created (split.paidNow from the
    // confirm step). We clamp to [₹1, total] so an empty/edited doc can't be
    // used to capture a free payment or overpay.
    const stored = Math.max(0, Math.round(orderData.amountPaid ?? 0) * 100);
    let paidPaise = orderData.paymentMethod === "full" ? totalPaise : stored;
    if (totalPaise > 0) paidPaise = Math.min(paidPaise, totalPaise);
    paidPaise = Math.max(100, paidPaise); // Razorpay minimum order amount: ₹1.00

    if (!Number.isFinite(paidPaise) || paidPaise < 100) {
      return Response.json(
        { error: "This order has no payable amount." },
        { status: 400 }
      );
    }

    const shopData = shop?.data as unknown as Shop | undefined;
    const payoutEnabled = shopData?.payoutEnabled === true && !!shopData?.razorpayAccountId;
    const transfers: { account: string; amount: number; currency: string; notes: Record<string, string> }[] = [];
    if (payoutEnabled && shopData) {
      const commissionPercent = await getPlatformCommissionPercent();
      const { shopkeeperPaise } = computePayoutSplit(paidPaise, commissionPercent);
      if (shopkeeperPaise > 0) {
        transfers.push({
          account: shopData.razorpayAccountId as string,
          amount: shopkeeperPaise,
          currency: "INR",
          notes: {
            platform: "xeroxmate",
            order: orderId.slice(0, 40),
            shop: orderData.shopId.slice(0, 40),
          },
        });
      }
    }

    /* -----------------------------------------------------
     * CREATE RAZORPAY ORDER
     * --------------------------------------------------- */
    const razorpay = getRazorpay();
    const rzpOrder = await razorpay.orders.create({
      amount: paidPaise,
      currency: "INR",
      receipt: orderId.slice(0, 40),
      notes: {
        platform: "xeroxmate",
        order: orderId.slice(0, 40),
        customer: (user.email ?? "customer").slice(0, 40),
      },
      ...(transfers.length ? { transfers } : {}),
    });

    // Persist the Razorpay order id server-side only.
    await order.ref.set(
      {
        razorpayOrderId: rzpOrder.id,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    return Response.json({
      orderId,
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? process.env.RAZORPAY_KEY_ID,
      razorpayOrderId: rzpOrder.id,
      amountPaise: paidPaise,
      currency: "INR",
      name: orderData.shopName,
      description: `Order ${orderId}`,
      prefill: {
        contact: orderData.customerPhone,
        name: orderData.customerName,
      },
      notes: {
        platform: "xeroxmate",
        order: orderId,
      },
    });
  } catch (error: unknown) {
    console.error("Razorpay checkout/create error:", error);
    return Response.json(
      { error: (error as Error).message || "Could not create a payment session." },
      { status: 500 }
    );
  }
}