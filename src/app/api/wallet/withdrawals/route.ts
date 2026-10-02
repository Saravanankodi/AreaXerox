import type { NextRequest } from "next/server";

import { verifyFirebaseIdToken } from "@/lib/firebase/admin";
import {
  WalletError,
  assertAdmin,
  createWithdrawal,
  decideWithdrawal,
  type WithdrawalAction,
} from "@/lib/wallet/server";

export const runtime = "nodejs";

/**
 * POST /api/wallet/withdrawals
 *
 * The shopkeeper requests a payout. Raises `pendingRequested` in the same
 * transaction that writes the request, so the amount is reserved immediately and
 * cannot be requested twice while the first is still in flight.
 */
export async function POST(request: NextRequest) {
  try {
    const header = request.headers.get("authorization") ?? "";
    const user = await verifyFirebaseIdToken(header.replace(/^Bearer\s+/i, ""));

    let payload: { shopId?: string; amount?: unknown; note?: unknown };
    try {
      payload = await request.json();
    } catch {
      return bad("Invalid JSON body.", 400);
    }

    const shopId = typeof payload.shopId === "string" ? payload.shopId.trim() : "";
    if (!shopId) return bad("A shop is required.", 400);

    const result = await createWithdrawal({
      shopId,
      uid: user.uid,
      amount: Number(payload.amount),
      note: typeof payload.note === "string" ? payload.note : undefined,
    });

    return Response.json(result, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}

/**
 * PATCH /api/wallet/withdrawals
 *
 * Admin-only. Authorization is an `admins/{uid}` document, deliberately not
 * `users/{uid}.role` — the latter is writable by any authenticated client today.
 *
 * Three distinct actions rather than a status field:
 *   approve   pending  -> approved  (intent to pay; balance stays reserved)
 *   reject    *_       -> rejected  (reservation released)
 *   mark_paid approved -> paid      (money moved; reservation released)
 *
 * Splitting "approved" from "paid" is deliberate. Collapsing them would let a
 * single tap mark money as withdrawn with no transfer behind it; keeping them
 * apart makes the transfer an explicit, separately audited act. Note this still
 * does not *prove* a transfer happened — that remains out of scope.
 */
export async function PATCH(request: NextRequest) {
  try {
    const header = request.headers.get("authorization") ?? "";
    const admin = await verifyFirebaseIdToken(header.replace(/^Bearer\s+/i, ""));
    await assertAdmin(admin.uid);

    let payload: {
      shopId?: string;
      withdrawalId?: string;
      action?: WithdrawalAction;
      note?: unknown;
    };
    try {
      payload = await request.json();
    } catch {
      return bad("Invalid JSON body.", 400);
    }

    const shopId = typeof payload.shopId === "string" ? payload.shopId.trim() : "";
    const withdrawalId =
      typeof payload.withdrawalId === "string" ? payload.withdrawalId.trim() : "";
    if (!shopId || !withdrawalId) {
      return bad("A shop and a withdrawal are required.", 400);
    }

    const result = await decideWithdrawal({
      shopId,
      withdrawalId,
      action: payload.action as WithdrawalAction,
      adminUid: admin.uid,
      note: typeof payload.note === "string" ? payload.note : undefined,
    });

    return Response.json(result);
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

  console.error("Withdrawal request failed:", error);
  return bad("Could not process the withdrawal request.", 500);
}