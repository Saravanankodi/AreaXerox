import type { NextRequest } from "next/server";

import { verifyFirebaseIdToken } from "@/lib/firebase/admin";
import {
  WalletError,
  assertShopOwner,
  getMinWithdrawalAmount,
  getWalletEntries,
  getWalletSummary,
  getWithdrawals,
  maskedPayoutDetails,
  resolvePayoutMethod,
} from "@/lib/wallet/server";
import type { WalletEntry } from "@/types";

export const runtime = "nodejs";

/**
 * GET /api/wallet?shopId=...
 *
 * **Strictly read-only.** A shop that has never been credited has no wallet
 * document, and this handler returns a zeroed summary computed in memory rather
 * than creating one. The document is created lazily by the first operation that
 * actually moves money, so simply viewing the page never mutates Firestore.
 */
export async function GET(request: NextRequest) {
  try {
    const header = request.headers.get("authorization") ?? "";
    const user = await verifyFirebaseIdToken(header.replace(/^Bearer\s+/i, ""));

    const shopId = request.nextUrl.searchParams.get("shopId")?.trim();
    if (!shopId) return bad("A shop is required.", 400);

    const { shop, ownerAccountId } = await assertShopOwner(shopId, user.uid);

    const [summary, entries, withdrawals, minWithdrawalAmount] = await Promise.all([
      getWalletSummary(shopId, ownerAccountId),
      getWalletEntries(shopId),
      getWithdrawals(shopId),
      getMinWithdrawalAmount(),
    ]);

    return Response.json({
      summary,
      entries: entries as WalletEntry[],
      withdrawals,
      minWithdrawalAmount,
      payoutMethod: resolvePayoutMethod(shop),
      payoutDetails: maskedPayoutDetails(shop),
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}

function bad(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

/**
 * Expected failures (not the owner, bad amount, bad shop) are surfaced verbatim
 * so the shopkeeper sees something actionable. Token and infrastructure failures
 * are not — reporting a Firestore timeout as a validation error would send the
 * client into a pointless retry loop and hide a real outage.
 */
function toErrorResponse(error: unknown) {
  if (error instanceof WalletError) {
    return bad(error.message, error.status);
  }

  const message = error instanceof Error ? error.message : "Unexpected error.";
  if (/token|unauthenticated|credential|permission/i.test(message)) {
    return bad(message, 401);
  }

  console.error("Wallet GET failed:", error);
  return bad("Could not load your wallet.", 500);
}