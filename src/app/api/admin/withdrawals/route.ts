import type { NextRequest } from "next/server";

import {
  getAdminFirestore,
  verifyFirebaseIdToken,
} from "@/lib/firebase/admin";
import { shopOwnerId } from "@/lib/notifications-events";
import {
  WalletError,
  assertAdmin,
  createWithdrawal,
  getWalletSummary,
  listWithdrawalsForAdmin,
} from "@/lib/wallet/server";
import type { Shop } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/withdrawals?shopId=...
 *
 * Admin-only. Returns every withdrawal across every shop, newest first, with
 * masked payout destinations. When `shopId` is supplied the wallet summary is
 * included so the caller does not need a second round trip.
 *
 * Authentication: a Firebase ID token belonging to a user with an
 * `admins/{uid}` document. The admin dashboard mints one server-to-server.
 */
export async function GET(request: NextRequest) {
  try {
    const header = request.headers.get("authorization") ?? "";
    const admin = await verifyFirebaseIdToken(
      header.replace(/^Bearer\s+/i, ""),
    );

    await assertAdmin(admin.uid);

    const withdrawals = await listWithdrawalsForAdmin();

    const shopId =
      request.nextUrl.searchParams.get("shopId")?.trim() ?? "";

    const summary = shopId
      ? await getWalletSummary(shopId, "")
      : null;

    return Response.json({ withdrawals, summary });
  } catch (error) {
    return toErrorResponse(error);
  }
}

/**
 * POST /api/admin/withdrawals
 *
 * Admin-only. Creates a withdrawal on behalf of a shop (the dashboard's
 * "New Payout Request" action). The request is stamped with the shop's owner
 * uid so the canonical ownership checks still hold.
 */
export async function POST(request: NextRequest) {
  try {
    const header = request.headers.get("authorization") ?? "";
    const admin = await verifyFirebaseIdToken(
      header.replace(/^Bearer\s+/i, ""),
    );

    await assertAdmin(admin.uid);

    let payload: {
      shopId?: string;
      amount?: unknown;
      note?: unknown;
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

    const shopSnap = await getAdminFirestore()
      .collection("shops")
      .doc(shopId)
      .get();

    if (!shopSnap.exists) {
      throw new WalletError("Shop not found.", 404);
    }

    const shop = {
      id: shopSnap.id,
      ...(shopSnap.data() as object),
    } as Shop;

    const owner = shopOwnerId(shop);

    if (!owner) {
      throw new WalletError(
        "This shop has no owner recorded.",
        409,
      );
    }

    const result = await createWithdrawal({
      shopId,
      uid: owner,
      amount: Number(payload.amount),
      note: payload.note,
    });

    return Response.json(result, { status: 201 });
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

  console.error("Admin withdrawals list failed:", error);

  return Response.json(
    { error: "Could not load withdrawals." },
    { status: 500 },
  );
}
