import type { NextRequest } from "next/server";

import { verifyFirebaseIdToken } from "@/lib/firebase/admin";
import {
  WalletError,
  assertAdmin,
  createWithdrawal,
  decideWithdrawal,
  cancelWithdrawal,
  type WithdrawalAction,
} from "@/lib/wallet/server";

export const runtime = "nodejs";

/**
 * POST /api/wallet/withdrawals
 *
 * The shopkeeper requests a payout.
 */
export async function POST(request: NextRequest) {
  try {
    const header = request.headers.get("authorization") ?? "";
    const user = await verifyFirebaseIdToken(
      header.replace(/^Bearer\s+/i, ""),
    );

    let payload: {
      shopId?: string;
      amount?: unknown;
      note?: unknown;
    };

    try {
      payload = await request.json();
    } catch {
      return bad("Invalid JSON body.", 400);
    }

    const shopId =
      typeof payload.shopId === "string"
        ? payload.shopId.trim()
        : "";

    if (!shopId) {
      return bad("A shop is required.", 400);
    }

    const result = await createWithdrawal({
      shopId,
      uid: user.uid,
      amount: Number(payload.amount),
      note:
        typeof payload.note === "string"
          ? payload.note
          : undefined,
    });

    return Response.json(result, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}


/**
 * PATCH /api/wallet/withdrawals
 *
 * Admin-only.
 *
 * Actions:
 *
 *   approve    pending  -> approved
 *   reject     pending/approved -> rejected
 *   mark_paid  approved -> paid
 *
 * The wallet reservation is handled server-side inside
 * decideWithdrawal().
 */
export async function PATCH(request: NextRequest) {
  try {
    const header = request.headers.get("authorization") ?? "";

    const admin = await verifyFirebaseIdToken(
      header.replace(/^Bearer\s+/i, ""),
    );

    await assertAdmin(admin.uid);

    let payload: {
      shopId?: string;
      withdrawalId?: string;
      action?: WithdrawalAction;
      note?: unknown;
      reason?: unknown;
      reference?: unknown;
    };

    try {
      payload = await request.json();
    } catch {
      return bad("Invalid JSON body.", 400);
    }

    const shopId =
      typeof payload.shopId === "string"
        ? payload.shopId.trim()
        : "";

    const withdrawalId =
      typeof payload.withdrawalId === "string"
        ? payload.withdrawalId.trim()
        : "";

    if (!shopId || !withdrawalId) {
      return bad(
        "A shop and a withdrawal are required.",
        400,
      );
    }

    const result = await decideWithdrawal({
      shopId,
      withdrawalId,
      action: payload.action as WithdrawalAction,
      adminUid: admin.uid,
      adminName: admin.email ?? undefined,
      note:
        typeof payload.note === "string"
          ? payload.note
          : undefined,
      reason:
        typeof payload.reason === "string"
          ? payload.reason
          : undefined,
      reference:
        typeof payload.reference === "string"
          ? payload.reference
          : undefined,
    });

    return Response.json(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}


/**
 * POST /api/wallet/withdrawals/cancel
 *
 * Shopkeeper-only.
 *
 * Cancels their own pending withdrawal and releases the
 * reserved amount back into availableBalance.
 *
 * Cancellation is deliberately separate from the admin PATCH
 * endpoint because the shopkeeper must never be able to
 * approve/reject/mark-paid a withdrawal.
 */
export async function PUT(request: NextRequest) {
  try {
    const header = request.headers.get("authorization") ?? "";

    const user = await verifyFirebaseIdToken(
      header.replace(/^Bearer\s+/i, ""),
    );

    let payload: {
      shopId?: string;
      withdrawalId?: string;
      reason?: unknown;
    };

    try {
      payload = await request.json();
    } catch {
      return bad("Invalid JSON body.", 400);
    }

    const shopId =
      typeof payload.shopId === "string"
        ? payload.shopId.trim()
        : "";

    const withdrawalId =
      typeof payload.withdrawalId === "string"
        ? payload.withdrawalId.trim()
        : "";

    if (!shopId || !withdrawalId) {
      return bad(
        "A shop and a withdrawal are required.",
        400,
      );
    }

    const result = await cancelWithdrawal({
      shopId,
      withdrawalId,
      uid: user.uid,
      reason: payload.reason,
    });

    return Response.json(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}


function bad(message: string, status: number) {
  return Response.json(
    { error: message },
    { status },
  );
}


function toErrorResponse(error: unknown) {
  if (error instanceof WalletError) {
    return bad(error.message, error.status);
  }

  const message =
    error instanceof Error
      ? error.message
      : "Unexpected error.";

  if (
    /token|unauthenticated|credential|permission/i.test(
      message,
    )
  ) {
    return bad(message, 401);
  }

  console.error(
    "Withdrawal request failed:",
    error,
  );

  return bad(
    "Could not process the withdrawal request.",
    500,
  );
}