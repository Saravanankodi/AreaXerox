import { auth } from "@/lib/firebase/auth";
import type {
  Order,
  PaymentCollectedVia,
  ShopPaymentMethod,
  WalletEntry,
  WalletSummary,
  Withdrawal,
  WithdrawalDestination,
} from "@/types";

/* =========================================================
 * AUTH
 * ======================================================= */

async function getFirebaseIdToken(): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error("You must be signed in.");
  return user.getIdToken();
}

async function apiFetch<T>(
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<T> {
  const token = await getFirebaseIdToken();
  const method = init.method ?? "GET";

  const res = await fetch(path, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const message =
      (data as { error?: string } | null)?.error || "Request failed. Please try again.";
    throw new Error(message);
  }

  return data as T;
}

/* =========================================================
 * TYPES
 * ======================================================= */

export interface WalletResponse {
  summary: WalletSummary;
  entries: WalletEntry[];
  withdrawals: Withdrawal[];
  minWithdrawalAmount: number;
  payoutMethod: ShopPaymentMethod;
  /**
   * The shop's *current* payout details, already masked for display.
   *
   * This is deliberately separate from `withdrawals[].destination`, which is a
   * snapshot of what was requested at the time. Never derive the destination a
   * withdrawal would be paid to from a past request, and never fall back to a
   * placeholder: showing a shopkeeper an account that isn't theirs is worse than
   * showing nothing. `null` means no payout details are on file yet.
   */
  payoutDetails: WithdrawalDestination | null;
}

/* =========================================================
 * READ
 * ======================================================= */

export function fetchWallet(shopId: string): Promise<WalletResponse> {
  return apiFetch<WalletResponse>(`/api/wallet?shopId=${encodeURIComponent(shopId)}`);
}

/* =========================================================
 * SHOPKEEPER WRITES
 * ======================================================= */

export function requestWithdrawal(input: {
  shopId: string;
  amount: number;
  note?: string;
}): Promise<{ withdrawal: Withdrawal; summary: WalletSummary }> {
  return apiFetch<{ withdrawal: Withdrawal; summary: WalletSummary }>(
    "/api/wallet/withdrawals",
    { method: "POST", body: { shopId: input.shopId, amount: input.amount, note: input.note } },
  );
}

/**
 * Records cash / UPI / card collected for an order.
 *
 * Goes through `/api/orders/collect` rather than writing the order from the
 * browser: the client cannot own the shop or choose the amount, and the order
 * update and the wallet credit commit in one transaction.
 */
export function collectOrderPayment(input: {
  orderId: string;
  amount: number;
  via: PaymentCollectedVia;
}): Promise<{ order: Order; credited: number; summary: WalletSummary; alreadyCollected: boolean }> {
  return apiFetch("/api/orders/collect", {
    method: "POST",
    body: { orderId: input.orderId, amount: input.amount, via: input.via },
  });
}

/* =========================================================
 * ADMIN
 * ======================================================= */

export type WithdrawalAction = "approve" | "reject" | "mark_paid";

/**
 * Admin-only. There is no admin UI for this yet — the endpoint is API-only until
 * one exists, which is why nothing in the shopkeeper bundle calls it.
 *
 * `approve` and `mark_paid` are separate actions on purpose. Approving records
 * intent to transfer; only `mark_paid` releases the reserved balance and counts
 * the money as withdrawn.
 */
export function decideWithdrawal(input: {
  shopId: string;
  withdrawalId: string;
  action: WithdrawalAction;
  note?: string;
}): Promise<{ withdrawal: Withdrawal; summary: WalletSummary }> {
  return apiFetch<{ withdrawal: Withdrawal; summary: WalletSummary }>(
    "/api/wallet/withdrawals",
    {
      method: "PATCH",
      body: {
        shopId: input.shopId,
        withdrawalId: input.withdrawalId,
        action: input.action,
        note: input.note,
      },
    },
  );
}