import type { NextRequest } from "next/server";

import { verifyFirebaseIdToken } from "@/lib/firebase/admin";
import {
  WalletError,
  assertAdmin,
  decideWithdrawal,
  getWithdrawalForAdmin,
  type WithdrawalAction,
} from "@/lib/wallet/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/withdrawals/:id?shopId=...
 *
 * Admin-only. The withdrawal lives in `wallets/{shopId}/withdrawals/{id}`, so
 * `shopId` is required; it may come from the query string.
 */
export async function GET(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const header = request.headers.get("authorization") ?? "";
    const admin = await verifyFirebaseIdToken(
      header.replace(/^Bearer\s+/i, ""),
    );

    await assertAdmin(admin.uid);

    const { id } = await context.params;
    const shopId =
      request.nextUrl.searchParams.get("shopId")?.trim() ?? "";

    if (!shopId) {
      return Response.json(
        { error: "A shop is required." },
        { status: 400 },
      );
    }

    const withdrawal = await getWithdrawalForAdmin(shopId, id);

    if (!withdrawal) {
      return Response.json(
        { error: "Withdrawal not found." },
        { status: 404 },
      );
    }

    return Response.json(withdrawal);
  } catch (error) {
    return toErrorResponse(error);
  }
}

/**
 * PATCH /api/admin/withdrawals/:id
 *
 * Admin-only. Body: { shopId, action, note?, reason?, reference? }.
 * All state changes go through the single canonical transition table.
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const header = request.headers.get("authorization") ?? "";
    const admin = await verifyFirebaseIdToken(
      header.replace(/^Bearer\s+/i, ""),
    );

    await assertAdmin(admin.uid);

    const { id } = await context.params;

    let payload: {
      shopId?: string;
      action?: WithdrawalAction;
      note?: unknown;
      reason?: unknown;
      reference?: unknown;
    };

    try {
      payload = await request.json();
    } catch {
      return Response.json(
        { error: "Invalid JSON body." },
        { status: 400 },
      );
    }

    const shopId =
      typeof payload.shopId === "string"
        ? payload.shopId.trim()
        : "";

    if (!shopId) {
      return Response.json(
        { error: "A shop is required." },
        { status: 400 },
      );
    }

    const result = await decideWithdrawal({
      shopId,
      withdrawalId: id,
      action: payload.action as WithdrawalAction,
      adminUid: admin.uid,
      adminName: admin.email ?? undefined,
      note: payload.note,
      reason: payload.reason,
      reference: payload.reference,
    });

    return Response.json(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}

function toErrorResponse(error: unknown) {
  if (error instanceof WalletError) {
    return Response.json(
      { error: error.message, code: error.status },
      { status: error.status },
    );
  }

  const message =
    error instanceof Error ? error.message : "Unexpected error.";

  if (
    /token|unauthenticated|credential|permission/i.test(message)
  ) {
    return Response.json({ error: message }, { status: 401 });
  }

  console.error("Admin withdrawal action failed:", error);

  return Response.json(
    { error: "Could not process the withdrawal." },
    { status: 500 },
  );
}
