import type { NextRequest } from "next/server";

import { verifyFirebaseIdToken } from "@/lib/firebase/admin";
import { WalletError, creditFromOrderCollection } from "@/lib/wallet/server";
import type { PaymentCollectedVia } from "@/types";

export const runtime = "nodejs";

/**
 * POST /api/orders/collect
 *
 * Records cash / UPI / card the shopkeeper physically collected and credits the
 * wallet, in a single Firestore transaction.
 *
 * This endpoint replaces a client-side Firestore write that previously let any
 * authenticated user mark any order as paid for any amount. Now:
 *   - the caller must own the order's shop
 *   - the credited amount is clamped to the order's outstanding balance
 *   - the order update and the ledger credit commit together or not at all
 *
 * Online gateway payments are unaffected and must never be sent here — those
 * auto-split straight to the shopkeeper's bank and never touch the ledger.
 */
export async function POST(request: NextRequest) {
  try {
    const header = request.headers.get("authorization") ?? "";
    const user = await verifyFirebaseIdToken(header.replace(/^Bearer\s+/i, ""));

    let payload: {
      orderId?: string;
      amount?: unknown;
      via?: PaymentCollectedVia;
    };
    try {
      payload = await request.json();
    } catch {
      return bad("Invalid JSON body.", 400);
    }

    const orderId = typeof payload.orderId === "string" ? payload.orderId.trim() : "";
    if (!orderId) return bad("An order is required.", 400);

    const result = await creditFromOrderCollection({
      orderId,
      amount: Number(payload.amount),
      via: payload.via as PaymentCollectedVia,
      uid: user.uid,
    });

    return Response.json(result, { status: result.alreadyCollected ? 200 : 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}

function bad(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

function toErrorResponse(error: unknown) {
  if (error instanceof WalletError) {
    return bad(error.message, error.status);
  }

  const message = error instanceof Error ? error.message : "Unexpected error.";
  if (/token|unauthenticated|credential|permission/i.test(message)) {
    return bad(message, 401);
  }

  console.error("Order collection failed:", error);
  return bad("Could not record the payment.", 500);
}