import type { Transaction } from "firebase-admin/firestore";

import { getAdminFirestore } from "@/lib/firebase/admin";
import { shopOwnerId } from "@/lib/notifications-events";
import { maskAccountNumber, maskIfsc } from "@/lib/razorpay/server";
import type {
  Order,
  PaymentCollectedVia,
  Shop,
  ShopPaymentMethod,
  WalletSummary,
  Withdrawal,
  WithdrawalDestination,
  WithdrawalMethod,
  WithdrawalStatus,
} from "@/types";

export const DEFAULT_MIN_WITHDRAWAL = 100;

const ENTRIES_PAGE_SIZE = 50;

/**
 * Statuses that reserve wallet balance. Everything else is terminal and has
 * released the reservation (or, for `paid`, converted it into `withdrawn`).
 */
const IN_FLIGHT: WithdrawalStatus[] = [
  "pending",
  "under_review",
  "approved",
  "processing",
];

/**
 * An expected, reportable failure.
 */
export class WalletError extends Error {
  readonly status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "WalletError";
    this.status = status;
  }
}

/* =========================================================
 * SMALL HELPERS
 * ======================================================= */

function nowIso(): string {
  return new Date().toISOString();
}

/**
 * Round money to 2 decimal places.
 */
function money(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Normalise caller-supplied amount into a positive amount.
 */
function toAmount(value: unknown): number {
  const num = Number(value);

  if (!Number.isFinite(num) || num <= 0) {
    throw new WalletError("Enter a valid amount greater than zero.");
  }

  return money(num);
}

function note(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;

  const trimmed = value.trim().slice(0, 280);

  return trimmed.length ? trimmed : undefined;
}

/* =========================================================
 * OWNERSHIP + AUTHORIZATION
 * ======================================================= */

export interface OwnedShop {
  shop: Shop;
  ownerAccountId: string;
}

/**
 * Proves a shop document belongs to `uid`.
 */
async function assertShopOwnerIn(
  tx: Transaction,
  shopId: string,
  uid: string,
): Promise<OwnedShop> {
  const snapshot = await tx.get(
    getAdminFirestore().collection("shops").doc(shopId),
  );

  return checkOwnership(snapshot, shopId, uid);
}

async function checkOwnership(
  snapshot: {
    exists: boolean;
    id: string;
    data: () => unknown;
  },
  shopId: string,
  uid: string,
): Promise<OwnedShop> {
  if (!snapshot.exists) {
    throw new WalletError("Shop not found.", 404);
  }

  const shop = {
    id: snapshot.id,
    ...(snapshot.data() as object),
  } as Shop;

  const owner = shopOwnerId(shop);

  if (!owner) {
    throw new WalletError(
      "This shop has no owner recorded. Run tmp/verify-data-integrity.mjs.",
      409,
    );
  }

  if (owner !== uid) {
    throw new WalletError("You do not own this shop.", 403);
  }

  return {
    shop,
    ownerAccountId: owner,
  };
}

export async function assertShopOwner(
  shopId: string,
  uid: string,
): Promise<OwnedShop> {
  if (!shopId) {
    throw new WalletError("A shop is required.", 400);
  }

  const snapshot = await getAdminFirestore()
    .collection("shops")
    .doc(shopId)
    .get();

  return checkOwnership(snapshot, shopId, uid);
}

/**
 * Requires an `admins/{uid}` document.
 */
export async function assertAdmin(uid: string): Promise<void> {
  const snapshot = await getAdminFirestore()
    .collection("admins")
    .doc(uid)
    .get();

  if (!snapshot.exists) {
    throw new WalletError("Admin access required.", 403);
  }
}

/* =========================================================
 * PAYOUT DETAILS
 * ======================================================= */

export function resolvePayoutMethod(shop: Shop): ShopPaymentMethod {
  if (shop.shopPaymentMethod === "upi" && shop.upiId) {
    return "upi";
  }

  if (shop.bankAccountNumber && shop.bankIfsc) {
    return "bank_transfer";
  }

  return shop.shopPaymentMethod ?? "bank_transfer";
}

/**
 * Real payout destination.
 *
 * Used internally when creating a withdrawal snapshot.
 */
function realDestination(
  shop: Shop,
  method: WithdrawalMethod,
): WithdrawalDestination | null {
  if (method === "upi") {
    return shop.upiId
      ? {
          upiId: shop.upiId,
        }
      : null;
  }

  if (!shop.bankAccountNumber || !shop.bankIfsc) {
    return null;
  }

  return {
    accountNumber: String(shop.bankAccountNumber),
    ifsc: String(shop.bankIfsc),
    beneficiaryName: shop.ownerName ?? shop.name ?? "",
  };
}

/**
 * Masked payout destination for API responses.
 */
export function maskedPayoutDetails(
  shop: Shop,
): WithdrawalDestination | null {
  const method: WithdrawalMethod =
    resolvePayoutMethod(shop) === "upi" ? "upi" : "bank";

  const real = realDestination(shop, method);

  if (!real) {
    return null;
  }

  return maskDestination(real);
}

function maskDestination(
  destination: WithdrawalDestination,
): WithdrawalDestination {
  return {
    upiId: destination.upiId,

    accountNumber: destination.accountNumber
      ? maskAccountNumber(destination.accountNumber)
      : undefined,

    ifsc: destination.ifsc
      ? maskIfsc(destination.ifsc)
      : undefined,

    beneficiaryName: destination.beneficiaryName,
  };
}

/* =========================================================
 * PLATFORM SETTINGS
 * ======================================================= */

export async function getMinWithdrawalAmount(): Promise<number> {
  try {
    const snapshot = await getAdminFirestore()
      .collection("platform")
      .doc("settings")
      .get();

    const value = Number(snapshot.data()?.minWithdrawalAmount);

    return Number.isFinite(value) && value > 0
      ? value
      : DEFAULT_MIN_WITHDRAWAL;
  } catch {
    return DEFAULT_MIN_WITHDRAWAL;
  }
}

/* =========================================================
 * WALLET DOCUMENT SHAPE
 * ======================================================= */

interface WalletDoc {
  shopId: string;
  ownerAccountId: string;
  totalEarned: number;
  pendingRequested: number;
  withdrawn: number;
  ordersCounted: number;
  createdAt: string;
  updatedAt: string;
}

function zeroWalletDoc(
  shopId: string,
  ownerAccountId: string,
  timestamp: string,
): WalletDoc {
  return {
    shopId,
    ownerAccountId,
    totalEarned: 0,
    pendingRequested: 0,
    withdrawn: 0,
    ordersCounted: 0,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

/**
 * Projects stored counters onto the client-facing summary.
 */
function toSummary(doc: WalletDoc): WalletSummary {
  return {
    shopId: doc.shopId,
    ownerAccountId: doc.ownerAccountId,
    totalEarned: doc.totalEarned,
    pendingRequested: doc.pendingRequested,

    availableBalance: Math.max(
      0,
      money(
        doc.totalEarned -
          doc.pendingRequested -
          doc.withdrawn,
      ),
    ),

    withdrawn: doc.withdrawn,
    ordersCounted: doc.ordersCounted,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function readWalletDoc(
  shopId: string,
  data: unknown,
): WalletDoc {
  const raw = (data ?? {}) as Partial<WalletDoc>;

  return {
    shopId,

    ownerAccountId: String(
      raw.ownerAccountId ?? "",
    ),

    totalEarned: money(
      Number(raw.totalEarned) || 0,
    ),

    pendingRequested: money(
      Number(raw.pendingRequested) || 0,
    ),

    withdrawn: money(
      Number(raw.withdrawn) || 0,
    ),

    ordersCounted:
      Number(raw.ordersCounted) || 0,

    createdAt: String(
      raw.createdAt ?? nowIso(),
    ),

    updatedAt: String(
      raw.updatedAt ?? nowIso(),
    ),
  };
}

/* =========================================================
 * READ
 * ======================================================= */

async function readWallet(
  shopId: string,
): Promise<WalletDoc | null> {
  const snapshot = await getAdminFirestore()
    .collection("wallets")
    .doc(shopId)
    .get();

  return snapshot.exists
    ? readWalletDoc(shopId, snapshot.data())
    : null;
}

/**
 * Read-only wallet summary.
 */
export async function getWalletSummary(
  shopId: string,
  ownerAccountId: string,
): Promise<WalletSummary> {
  const existing = await readWallet(shopId);

  if (!existing) {
    const timestamp = nowIso();

    return toSummary(
      zeroWalletDoc(
        shopId,
        ownerAccountId,
        timestamp,
      ),
    );
  }

  return toSummary(existing);
}

export async function getWalletEntries(
  shopId: string,
) {
  const snapshot = await getAdminFirestore()
    .collection("wallets")
    .doc(shopId)
    .collection("entries")
    .orderBy("createdAt", "desc")
    .limit(ENTRIES_PAGE_SIZE)
    .get();

  return snapshot.docs.map((d) => ({
    id: d.id,
    ...(d.data() as object),
  }));
}

/**
 * Withdrawal snapshots come back masked.
 */
export async function getWithdrawals(
  shopId: string,
): Promise<Withdrawal[]> {
  const snapshot = await getAdminFirestore()
    .collection("wallets")
    .doc(shopId)
    .collection("withdrawals")
    .orderBy("requestedAt", "desc")
    .limit(ENTRIES_PAGE_SIZE)
    .get();

  return snapshot.docs.map((d) => {
    const withdrawal = {
      id: d.id,
      ...(d.data() as Omit<Withdrawal, "id">),
    };

    return {
      ...withdrawal,
      destination: maskDestination(
        withdrawal.destination,
      ),
    };
  });
}

/* =========================================================
 * WRITE: ORDER COLLECTION
 * ======================================================= */

export interface CollectResult {
  order: Order;
  credited: number;
  summary: WalletSummary;
  alreadyCollected: boolean;
}

/**
 * Records cash / UPI / card physically collected for an order.
 */
export async function creditFromOrderCollection(
  input: {
    orderId: string;
    amount: number;
    via: PaymentCollectedVia;
    uid: string;
  },
): Promise<CollectResult> {
  const {
    orderId,
    via,
    uid,
  } = input;

  if (!orderId) {
    throw new WalletError(
      "An order is required.",
      400,
    );
  }

  if (!["cash", "upi", "card"].includes(via)) {
    throw new WalletError(
      "Choose how the payment was collected.",
    );
  }

  const requested = toAmount(input.amount);

  const db = getAdminFirestore();

  return db.runTransaction(async (tx) => {
    const orderRef = db
      .collection("orders")
      .doc(orderId);

    const orderSnap = await tx.get(orderRef);

    if (!orderSnap.exists) {
      throw new WalletError(
        "Order not found.",
        404,
      );
    }

    const order = {
      id: orderSnap.id,
      ...orderSnap.data(),
    } as Order;

    const { ownerAccountId } =
      await assertShopOwnerIn(
        tx,
        order.shopId,
        uid,
      );

    const total = money(
      Number(order.price.total) || 0,
    );

    const balance = money(
      Number(order.balance) || 0,
    );

    if (balance <= 0) {
      const existing =
        (await readWallet(order.shopId)) ??
        zeroWalletDoc(
          order.shopId,
          ownerAccountId,
          nowIso(),
        );

      return {
        order,
        credited: 0,
        summary: toSummary(existing),
        alreadyCollected: true,
      };
    }

    const walletRef = db
      .collection("wallets")
      .doc(order.shopId);

    const markerRef = walletRef
      .collection("creditedOrders")
      .doc(orderId);

    const walletSnap = await tx.get(
      walletRef,
    );

    const markerSnap = await tx.get(
      markerRef,
    );

    const current = walletSnap.exists
      ? readWalletDoc(
          order.shopId,
          walletSnap.data(),
        )
      : zeroWalletDoc(
          order.shopId,
          ownerAccountId,
          nowIso(),
        );

    const credited = money(
      Math.min(requested, balance),
    );

    const paid = money(
      Math.min(
        total,
        (Number(order.amountPaid) || 0) +
          credited,
      ),
    );

    const remaining = money(
      Math.max(0, total - paid),
    );

    const timestamp = nowIso();

    const isNewOrder =
      !markerSnap.exists;

    const paymentStatus =
      remaining <= 0
        ? "paid"
        : "partial";

    const next: WalletDoc = {
      ...current,

      ownerAccountId,

      totalEarned: money(
        current.totalEarned +
          credited,
      ),

      ordersCounted:
        current.ordersCounted +
        (isNewOrder ? 1 : 0),

      updatedAt: timestamp,
    };

    tx.update(orderRef, {
      amountPaid: paid,
      balance: remaining,
      paymentStatus,
      balanceCollectedVia: via,
      updatedAt: timestamp,
    });

    tx.set(walletRef, next);

    if (isNewOrder) {
      tx.set(markerRef, {
        orderId,
        firstCreditedAt: timestamp,
      });
    }

    tx.create(
      walletRef
        .collection("entries")
        .doc(),
      {
        shopId: order.shopId,
        kind: "credit",
        source: "order_collection",
        amount: credited,
        orderId,
        via,
        note: `Collected ${via} for order ${orderId}`,
        createdAt: timestamp,
      },
    );

    return {
      order: {
        ...order,
        amountPaid: paid,
        balance: remaining,
        paymentStatus,
        balanceCollectedVia: via,
        updatedAt: timestamp,
      } as Order,

      credited,

      summary: toSummary(next),

      alreadyCollected: false,
    };
  });
}

/* =========================================================
 * WRITE: WITHDRAWAL REQUESTS
 * ======================================================= */

/**
 * Creates a pending withdrawal request.
 *
 * The amount is immediately reserved by increasing
 * `pendingRequested`.
 */
export async function createWithdrawal(
  input: {
    shopId: string;
    uid: string;
    amount: number;
    note?: unknown;
  },
): Promise<{
  withdrawal: Withdrawal;
  summary: WalletSummary;
  minWithdrawalAmount: number;
}> {
  const {
    shopId,
    uid,
  } = input;

  if (!shopId) {
    throw new WalletError(
      "A shop is required.",
      400,
    );
  }

  const amount = toAmount(
    input.amount,
  );

  const {
    shop,
    ownerAccountId,
  } = await assertShopOwner(
    shopId,
    uid,
  );

  const method: WithdrawalMethod =
    resolvePayoutMethod(shop) === "upi"
      ? "upi"
      : "bank";

  const destination =
    realDestination(
      shop,
      method,
    );

  if (!destination) {
    throw new WalletError(
      "Add your bank account or UPI ID in Shop Profile first.",
      409,
    );
  }

  const minWithdrawalAmount =
    await getMinWithdrawalAmount();

  if (amount < minWithdrawalAmount) {
    throw new WalletError(
      `Minimum withdrawal is ₹${minWithdrawalAmount}.`,
    );
  }

  const db = getAdminFirestore();

  return db.runTransaction(async (tx) => {
    const walletRef = db
      .collection("wallets")
      .doc(shopId);

    const walletSnap =
      await tx.get(walletRef);

    const timestamp = nowIso();

    const current = walletSnap.exists
      ? readWalletDoc(
          shopId,
          walletSnap.data(),
        )
      : zeroWalletDoc(
          shopId,
          ownerAccountId,
          timestamp,
        );

    const available =
      Math.max(
        0,
        money(
          current.totalEarned -
            current.pendingRequested -
            current.withdrawn,
        ),
      );

    if (available < amount) {
      throw new WalletError(
        `Available balance is ₹${available}. You need ₹${money(
          amount - available,
        )} more.`,
      );
    }

    /*
     * Only one in-flight request per wallet. Without this guard the amount is
     * reserved twice while the wallet counter (and the admin view) assumes a
     * single reservation.
     */
    const openSnap = await tx.get(
      walletRef
        .collection("withdrawals")
        .where("status", "in", IN_FLIGHT),
    );

    if (!openSnap.empty) {
      throw new WalletError(
        "You already have a withdrawal in progress.",
        409,
      );
    }

    const withdrawalRef =
      walletRef
        .collection("withdrawals")
        .doc();

    const requestNote =
      note(input.note);

    const withdrawal: Withdrawal = {
      id: withdrawalRef.id,

      shopId,

      ownerAccountId,

      amount,

      status: "pending",

      method,

      destination,

      ...(requestNote
        ? { note: requestNote }
        : {}),

      requestedAt: timestamp,

      timeline: [
        {
          status: "pending",
          at: timestamp,
          by: uid,
          note: "Requested by shopkeeper.",
        },
      ],
    };

    const next: WalletDoc = {
      ...current,

      pendingRequested: money(
        current.pendingRequested +
          amount,
      ),

      updatedAt: timestamp,
    };

    tx.set(
      walletRef,
      next,
    );

    tx.set(
      withdrawalRef,
      withdrawal,
    );

    return {
      withdrawal: {
        ...withdrawal,

        destination:
          maskDestination(
            destination,
          ),
      },

      summary:
        toSummary(next),

      minWithdrawalAmount,
    };
  });
}

/* =========================================================
 * WRITE: SHOPKEEPER CANCELLATION
 * ======================================================= */

/**
 * Allows the shopkeeper to cancel their own pending withdrawal.
 *
 * IMPORTANT:
 *
 * pending -> rejected
 *
 * The reserved amount is released by decreasing
 * `pendingRequested`.
 *
 * A shopkeeper cannot cancel an approved withdrawal.
 * Once approved, the admin-controlled payout process owns
 * the request.
 *
 * No debit ledger entry is created because no money was paid.
 */
export async function cancelWithdrawal(
  input: {
    shopId: string;
    withdrawalId: string;
    uid: string;
    reason?: unknown;
  },
): Promise<{
  withdrawal: Withdrawal;
  summary: WalletSummary;
}> {
  const {
    shopId,
    withdrawalId,
    uid,
  } = input;

  if (!shopId || !withdrawalId) {
    throw new WalletError(
      "A shop and a withdrawal are required.",
      400,
    );
  }

  const db = getAdminFirestore();

  return db.runTransaction(async (tx) => {
    const walletRef = db
      .collection("wallets")
      .doc(shopId);

    const withdrawalRef =
      walletRef
        .collection("withdrawals")
        .doc(withdrawalId);

    /*
     * Read withdrawal first.
     */
    const withdrawalSnap =
      await tx.get(withdrawalRef);

    if (!withdrawalSnap.exists) {
      throw new WalletError(
        "Withdrawal not found.",
        404,
      );
    }

    const withdrawal = {
      id: withdrawalSnap.id,
      ...(withdrawalSnap.data() as Omit<
        Withdrawal,
        "id"
      >),
    } as Withdrawal;

    /*
     * Read and verify shop ownership inside
     * the same transaction.
     */
    const {
      ownerAccountId,
    } = await assertShopOwnerIn(
      tx,
      shopId,
      uid,
    );

    /*
     * Extra ownership check so a malformed or
     * migrated withdrawal cannot be cancelled
     * by the wrong owner.
     */
    if (
      withdrawal.ownerAccountId !==
      ownerAccountId
    ) {
      throw new WalletError(
        "You do not own this withdrawal.",
        403,
      );
    }

    /*
     * A shopkeeper may cancel their own request while it is still pending or
     * under review. Once an admin has approved/processed it, the admin-owned
     * payout process takes over and the shopkeeper can no longer cancel.
     */
    if (
      withdrawal.status !== "pending" &&
      withdrawal.status !== "under_review"
    ) {
      throw new WalletError(
        "Only pending withdrawals can be cancelled.",
        409,
      );
    }

    /*
     * Read wallet after withdrawal.
     */
    const walletSnap =
      await tx.get(walletRef);

    const timestamp = nowIso();

    const current = walletSnap.exists
      ? readWalletDoc(
          shopId,
          walletSnap.data(),
        )
      : zeroWalletDoc(
          shopId,
          ownerAccountId,
          timestamp,
        );

    /*
     * Release the reservation.
     */
    const next: WalletDoc = {
      ...current,

      pendingRequested: Math.max(
        0,
        money(
          current.pendingRequested -
            withdrawal.amount,
        ),
      ),

      updatedAt: timestamp,
    };

    const cancellationReason =
      note(input.reason) ?? "Cancelled by shopkeeper.";

    const timelineEntry = {
      status: "cancelled" as const,
      at: timestamp,
      by: uid,
      note: cancellationReason,
    };

    const updated: Withdrawal = {
      ...withdrawal,

      id: withdrawalId,

      status: "cancelled",

      decidedAt: timestamp,

      decidedBy: uid,

      decisionNote: cancellationReason,

      cancellationReason,

      cancelledAt: timestamp,

      timeline: [
        ...(withdrawal.timeline ?? []),
        timelineEntry,
      ],
    };

    /*
     * Exactly one write to withdrawal.
     */
    tx.update(
      withdrawalRef,
      {
        status: "cancelled",
        decidedAt: timestamp,
        decidedBy: uid,
        decisionNote: cancellationReason,
        cancellationReason,
        cancelledAt: timestamp,
        timeline: updated.timeline,
      },
    );

    /*
     * Exactly one write to wallet.
     */
    tx.set(
      walletRef,
      next,
    );

    /*
     * No debit entry:
     *
     * The money was never paid out.
     * We only release the reservation.
     */
    return {
      withdrawal: {
        ...updated,

        destination:
          maskDestination(
            withdrawal.destination,
          ),
      },

      summary:
        toSummary(next),
    };
  });
}

/* =========================================================
 * WRITE: ADMIN DECISIONS
 * ======================================================= */

/**
 * Canonical admin actions.
 *
 * `mark_paid` is the legacy name for `complete` and is kept so the existing
 * shop/admin API contract keeps working; both land on `paid`.
 */
export type WithdrawalAction =
  | "hold"
  | "approve"
  | "process"
  | "complete"
  | "mark_paid"
  | "reject"
  | "fail"
  | "cancel"
  | "add_note";

interface TransitionRule {
  from: WithdrawalStatus[];
  to: WithdrawalStatus;
}

/**
 * The single authoritative lifecycle table. Every status change goes through
 * here; nothing else may write `wallets/{shopId}/withdrawals`.
 */
const TRANSITIONS: Partial<Record<WithdrawalAction, TransitionRule>> = {
  hold: {
    from: ["pending", "approved"],
    to: "under_review",
  },

  approve: {
    from: ["pending", "under_review"],
    to: "approved",
  },

  process: {
    from: ["approved"],
    to: "processing",
  },

  complete: {
    from: ["approved", "processing"],
    to: "paid",
  },

  mark_paid: {
    from: ["approved", "processing"],
    to: "paid",
  },

  reject: {
    from: ["pending", "under_review", "approved"],
    to: "rejected",
  },

  fail: {
    from: ["approved", "processing"],
    to: "failed",
  },

  cancel: {
    from: ["pending", "under_review"],
    to: "cancelled",
  },
};

/**
 * Applies an admin decision to a withdrawal.
 */
export async function decideWithdrawal(
  input: {
    shopId: string;
    withdrawalId: string;
    action: WithdrawalAction;
    adminUid: string;
    adminName?: string;
    note?: unknown;
    reason?: unknown;
    reference?: unknown;
  },
): Promise<{
  withdrawal: Withdrawal;
  summary: WalletSummary;
}> {
  const {
    shopId,
    withdrawalId,
    action,
    adminUid,
  } = input;

  if (!shopId || !withdrawalId) {
    throw new WalletError(
      "A shop and a withdrawal are required.",
      400,
    );
  }

  await assertAdmin(
    adminUid,
  );

  const rule =
    TRANSITIONS[action];

  if (action !== "add_note" && !rule) {
    throw new WalletError(
      "Unknown withdrawal action.",
      400,
    );
  }

  const db =
    getAdminFirestore();

  return db.runTransaction(
    async (tx) => {
      const walletRef =
        db
          .collection("wallets")
          .doc(shopId);

      const withdrawalRef =
        walletRef
          .collection("withdrawals")
          .doc(withdrawalId);

      /*
       * Read withdrawal.
       */
      const withdrawalSnap =
        await tx.get(
          withdrawalRef,
        );

      if (!withdrawalSnap.exists) {
        throw new WalletError(
          "Withdrawal not found.",
          404,
        );
      }

      const withdrawal = {
        id: withdrawalSnap.id,
        ...(withdrawalSnap.data() as Omit<Withdrawal, "id">),
      } as Withdrawal;

      /*
       * Read wallet.
       */
      const walletSnap =
        await tx.get(
          walletRef,
        );

      const timestamp =
        nowIso();

      const current =
        walletSnap.exists
          ? readWalletDoc(
              shopId,
              walletSnap.data(),
            )
          : zeroWalletDoc(
              shopId,
              withdrawal.ownerAccountId,
              timestamp,
            );

      const from =
        withdrawal.status as WithdrawalStatus;

      const by =
        input.adminName?.trim() || adminUid;

      const decisionNote =
        note(input.note);

      const reason =
        note(input.reason);

      const reference =
        note(input.reference);

      const timeline = [
        ...(withdrawal.timeline ?? []),
      ];

      /*
       * `add_note` never changes status; it only appends to the audit trail.
       */
      if (action === "add_note") {
        const updated: Withdrawal = {
          ...withdrawal,
          adminNote:
            decisionNote ?? withdrawal.adminNote,
          timeline: [
            ...timeline,
            {
              status: from,
              at: timestamp,
              by,
              note: decisionNote ?? "Admin note added.",
            },
          ],
        };

        tx.update(withdrawalRef, {
          adminNote: updated.adminNote,
          timeline: updated.timeline,
        });

        return {
          withdrawal: updated,
          summary: toSummary(current),
        };
      }

      if (!rule) {
        throw new WalletError(
          "Unknown withdrawal action.",
          400,
        );
      }

      const to = rule.to;

      /*
       * Idempotent: approving an already-approved withdrawal, completing an
       * already-paid one, etc. returns the current state without re-moving any
       * money.
       */
      if (from === to) {
        return {
          withdrawal,
          summary: toSummary(current),
        };
      }

      /*
       * Prevent invalid state transitions.
       */
      if (!rule.from.includes(from)) {
        throw new WalletError(
          `Cannot ${action.replace(
            "_",
            " ",
          )} a ${from} withdrawal.`,
          409,
        );
      }

      const wasInFlight =
        IN_FLIGHT.includes(from);

      const isInFlight =
        IN_FLIGHT.includes(to);

      let next: WalletDoc = {
        ...current,
        updatedAt: timestamp,
      };

      /*
       * Leaving the in-flight set releases the reservation exactly once.
       */
      if (wasInFlight && !isInFlight) {
        next = {
          ...next,
          pendingRequested: Math.max(
            0,
            money(
              current.pendingRequested -
                withdrawal.amount,
            ),
          ),
        };
      }

      /*
       * Only a completed payout increases lifetime `withdrawn`. The gross
       * amount is recorded (the platform does not withhold commission from
       * the shopkeeper wallet).
       */
      if (to === "paid") {
        next = {
          ...next,
          withdrawn: money(
            current.withdrawn +
              withdrawal.amount,
          ),
        };
      }

      const timelineEntry = {
        status: to,
        at: timestamp,
        by,
        ...(decisionNote ? { note: decisionNote } : {}),
        ...(reason ? { note: reason } : {}),
        ...(reference ? { reference } : {}),
      };

      const updated: Withdrawal = {
        ...withdrawal,
        id: withdrawalId,
        status: to,
        decidedAt: timestamp,
        decidedBy: adminUid,
        timeline: [...timeline, timelineEntry],
        ...(decisionNote ? { decisionNote } : {}),
        ...(reason ? { rejectReason: reason } : {}),
        ...(to === "paid"
          ? {
              paidAt: timestamp,
              ...(reference
                ? {
                    transactionReference: reference,
                    payoutReference: reference,
                  }
                : {}),
            }
          : {}),
        ...(to === "cancelled"
          ? { cancelledAt: timestamp }
          : {}),
      };

      /*
       * Update withdrawal once.
       */
      tx.update(withdrawalRef, {
        status: to,
        decidedAt: timestamp,
        decidedBy: adminUid,
        timeline: updated.timeline,
        ...(decisionNote ? { decisionNote } : {}),
        ...(reason ? { rejectReason: reason } : {}),
        ...(to === "paid"
          ? {
              paidAt: timestamp,
              ...(reference
                ? {
                    transactionReference: reference,
                    payoutReference: reference,
                  }
                : {}),
            }
          : {}),
        ...(to === "cancelled"
          ? { cancelledAt: timestamp }
          : {}),
      });

      /*
       * Update wallet once.
       */
      tx.set(walletRef, next);

      /*
       * A debit ledger entry exists only when the withdrawal is actually paid.
       */
      if (to === "paid") {
        tx.create(
          walletRef
            .collection("entries")
            .doc(),
          {
            shopId,
            kind: "debit",
            source: "withdrawal",
            amount: withdrawal.amount,
            note: `Withdrawal ${withdrawalId} paid`,
            createdAt: timestamp,
          },
        );
      }

      return {
        withdrawal: updated,
        summary: toSummary(next),
      };
    },
  );
}
/* =========================================================
 * READ: ADMIN VIEW
 * ======================================================= */

/**
 * Every withdrawal across every shop, newest first.
 *
 * Uses a collection-group read so the admin dashboard never fans out per
 * wallet. No composite index is required because ordering happens in memory
 * (a collection-group read only needs the automatic `__name__` index).
 */
export async function listWithdrawalsForAdmin(): Promise<Withdrawal[]> {
  const snapshot = await getAdminFirestore()
    .collectionGroup("withdrawals")
    .get();

  return snapshot.docs
    .map((d) => {
      const withdrawal = {
        id: d.id,
        ...(d.data() as Omit<Withdrawal, "id">),
      } as Withdrawal;

      const shopId =
        withdrawal.shopId ||
        d.ref.parent.parent?.id ||
        "";

      return {
        ...withdrawal,
        shopId,
        destination: maskDestination(withdrawal.destination),
      };
    })
    .sort(
      (a, b) =>
        new Date(b.requestedAt).getTime() -
        new Date(a.requestedAt).getTime(),
    );
}

/**
 * A single withdrawal for an admin. `shopId` is required because the record
 * lives in a subcollection; the masked destination is returned as stored.
 */
export async function getWithdrawalForAdmin(
  shopId: string,
  withdrawalId: string,
): Promise<Withdrawal | null> {
  if (!shopId || !withdrawalId) return null;

  const snapshot = await getAdminFirestore()
    .collection("wallets")
    .doc(shopId)
    .collection("withdrawals")
    .doc(withdrawalId)
    .get();

  if (!snapshot.exists) return null;

  const withdrawal = {
    id: snapshot.id,
    ...(snapshot.data() as Omit<Withdrawal, "id">),
  } as Withdrawal;

  return {
    ...withdrawal,
    destination: maskDestination(withdrawal.destination),
  };
}

export async function completeOrderAndCreditWallet(input: {
  orderId: string;
  uid: string;
}): Promise<{
  order: Order;
  credited: number;
  summary: WalletSummary;
  alreadyCredited: boolean;
}> {
  const { orderId, uid } = input;

  if (!orderId) {
    throw new WalletError("An order is required.", 400);
  }

  const db = getAdminFirestore();

  return db.runTransaction(async (tx) => {
    const orderRef = db.collection("orders").doc(orderId);

    const orderSnap = await tx.get(orderRef);

    if (!orderSnap.exists) {
      throw new WalletError("Order not found.", 404);
    }

    const order = {
      id: orderSnap.id,
      ...orderSnap.data(),
    } as Order;

    const { ownerAccountId } = await assertShopOwnerIn(
      tx,
      order.shopId,
      uid,
    );

    if (order.status === "COMPLETED") {
      // We still check the wallet marker below so this operation is idempotent.
    }

    const walletRef = db
      .collection("wallets")
      .doc(order.shopId);

    const markerRef = walletRef
      .collection("creditedOrders")
      .doc(orderId);

    const walletSnap = await tx.get(walletRef);
    const markerSnap = await tx.get(markerRef);

    const timestamp = nowIso();

    const current = walletSnap.exists
      ? readWalletDoc(order.shopId, walletSnap.data())
      : zeroWalletDoc(
          order.shopId,
          ownerAccountId,
          timestamp,
        );

    /*
     * Already credited:
     * don't add the money again.
     */
    if (markerSnap.exists) {
      return {
        order,
        credited: 0,
        summary: toSummary(current),
        alreadyCredited: true,
      };
    }

    /*
     * The wallet receives the amount actually collected
     * for this order.
     *
     * If the entire order must be paid before completion,
     * `amountPaid` should equal the order total here.
     */
    const total = money(Number(order.price.total) || 0);
    const amountPaid = money(Number(order.amountPaid) || 0);

    if (amountPaid <= 0) {
      throw new WalletError(
        "Cannot complete an order with no payment recorded.",
        409,
      );
    }

    const credited = money(
      Math.min(amountPaid, total),
    );

    const next: WalletDoc = {
      ...current,

      ownerAccountId,

      totalEarned: money(
        current.totalEarned + credited,
      ),

      ordersCounted:
        current.ordersCounted + 1,

      updatedAt: timestamp,
    };

    /*
     * Complete the order.
     */
    tx.update(orderRef, {
      status: "COMPLETED",
      updatedAt: timestamp,
    });

    /*
     * Update wallet.
     */
    tx.set(walletRef, next);

    /*
     * Idempotency marker.
     */
    tx.set(markerRef, {
      orderId,
      amount: credited,
      creditedAt: timestamp,
      source: "order_completion",
    });

    /*
     * Ledger entry.
     */
    tx.create(
      walletRef
        .collection("entries")
        .doc(),
      {
        shopId: order.shopId,
        kind: "credit",
        source: "order_completion",
        amount: credited,
        orderId,
        note: `Order ${orderId} completed`,
        createdAt: timestamp,
      },
    );

    return {
      order: {
        ...order,
        status: "COMPLETED",
        updatedAt: timestamp,
      } as Order,

      credited,

      summary: toSummary(next),

      alreadyCredited: false,
    };
  });
}
