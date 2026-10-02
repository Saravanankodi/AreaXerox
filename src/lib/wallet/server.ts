/**
 * Server-owned shopkeeper wallet.
 *
 * Every document under `wallets/{shopId}` is written exclusively through this
 * module using the Admin SDK. The browser never reads or writes these paths
 * directly — `firestore.rules` denies them outright — so the ledger can only
 * change when the server accepts an operation that passed an authorization and
 * validation check here.
 *
 * What credits a wallet:
 *   - cash / UPI / card the shopkeeper physically collected for an order, via
 *     `creditFromOrderCollection`
 *
 * What does NOT credit a wallet:
 *   - online gateway payments. Those auto-split straight to the linked bank
 *     account through Razorpay Route `order_splits` and never touch this ledger.
 *
 * Balances are stored as counters rather than derived by aggregating entries:
 * `totalEarned` and `withdrawn` are lifetime sums, and `pendingRequested` is a
 * maintained sum of in-flight withdrawals. `availableBalance` is always derived
 * as `totalEarned - pendingRequested` and is never stored, so it cannot drift.
 *
 * Firestore transaction rule observed throughout: every read happens before
 * every write, and each document is written exactly once per transaction.
 */

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
 * An expected, reportable failure. Carries the HTTP status the route should
 * surface so validation logic can live here rather than being smeared across
 * three route handlers.
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

/** Rounds to 2dp so a value like 100.005 cannot smuggle in a sub-paisa remainder. */
function money(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Normalises anything caller-supplied into a positive amount. Money is stored in
 * rupees; floats are rejected rather than coerced so a missing field is a 400
 * rather than a silent ₹0 collection.
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
 * Proves a shop document belongs to `uid`, reading inside the caller's
 * transaction so ownership cannot change between the check and the write.
 *
 * Ownership comes from the shop document, never from a client-supplied uid and
 * never from `users/{uid}.role` — `firestore.rules` leaves that collection
 * world-writable, so the role field is trivially forgeable.
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
  snapshot: { exists: boolean; id: string; data: () => unknown },
  shopId: string,
  uid: string,
): Promise<OwnedShop> {
  if (!snapshot.exists) throw new WalletError("Shop not found.", 404);

  const shop = { id: snapshot.id, ...(snapshot.data() as object) } as Shop;
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

  return { shop, ownerAccountId: owner };
}

export async function assertShopOwner(shopId: string, uid: string): Promise<OwnedShop> {
  if (!shopId) throw new WalletError("A shop is required.", 400);

  const snapshot = await getAdminFirestore().collection("shops").doc(shopId).get();
  return checkOwnership(snapshot, shopId, uid);
}

/**
 * Requires an `admins/{uid}` document.
 *
 * Deliberately does not fall back to `users/{uid}.role`: that field is writable
 * by any authenticated client today, so trusting it would let anyone self-promote
 * to admin. Once `firestore.rules` locks the `admins` collection down this doc is
 * the only writer, which is what makes it trustworthy.
 */
export async function assertAdmin(uid: string): Promise<void> {
  const snapshot = await getAdminFirestore().collection("admins").doc(uid).get();
  if (!snapshot.exists) {
    throw new WalletError("Admin access required.", 403);
  }
}

/* =========================================================
 * PAYOUT DETAILS
 * ======================================================= */

export function resolvePayoutMethod(shop: Shop): ShopPaymentMethod {
  if (shop.shopPaymentMethod === "upi" && shop.upiId) return "upi";
  if (shop.bankAccountNumber && shop.bankIfsc) return "bank_transfer";
  return shop.shopPaymentMethod ?? "bank_transfer";
}

/**
 * The real, unmasked destination. Used when snapshotting a withdrawal request so
 * an admin can actually execute the transfer, which is why the stored withdrawal
 * keeps the raw values and only API *responses* are masked.
 */
function realDestination(
  shop: Shop,
  method: WithdrawalMethod,
): WithdrawalDestination | null {
  if (method === "upi") {
    return shop.upiId ? { upiId: shop.upiId } : null;
  }
  if (!shop.bankAccountNumber || !shop.bankIfsc) return null;
  return {
    accountNumber: String(shop.bankAccountNumber),
    ifsc: String(shop.bankIfsc),
    // The Shop record has no separate account-holder field, so the owner's name
    // is what an admin needs to type into their banking portal.
    beneficiaryName: shop.ownerName ?? shop.name ?? "",
  };
}

/**
 * The masked destination for display. Never returns a placeholder — showing a
 * shopkeeper an account that is not theirs is worse than showing nothing, which
 * is why this returns `null` rather than an em-dash string when nothing is on
 * file.
 */
export function maskedPayoutDetails(shop: Shop): WithdrawalDestination | null {
  const method: WithdrawalMethod = resolvePayoutMethod(shop) === "upi" ? "upi" : "bank";
  const real = realDestination(shop, method);
  if (!real) return null;
  return maskDestination(real);
}

function maskDestination(destination: WithdrawalDestination): WithdrawalDestination {
  return {
    upiId: destination.upiId,
    accountNumber: destination.accountNumber
      ? maskAccountNumber(destination.accountNumber)
      : undefined,
    ifsc: destination.ifsc ? maskIfsc(destination.ifsc) : undefined,
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
    return Number.isFinite(value) && value > 0 ? value : DEFAULT_MIN_WITHDRAWAL;
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

function zeroWalletDoc(shopId: string, ownerAccountId: string, timestamp: string): WalletDoc {
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

/** Projects the stored counters onto the client-facing summary. */
function toSummary(doc: WalletDoc): WalletSummary {
  return {
    shopId: doc.shopId,
    ownerAccountId: doc.ownerAccountId,
    totalEarned: doc.totalEarned,
    pendingRequested: doc.pendingRequested,
    // Always derived, never stored, so the three numbers cannot disagree.
    availableBalance: Math.max(0, money(doc.totalEarned - doc.pendingRequested)),
    withdrawn: doc.withdrawn,
    ordersCounted: doc.ordersCounted,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function readWalletDoc(shopId: string, data: unknown): WalletDoc {
  const raw = (data ?? {}) as Partial<WalletDoc>;
  return {
    shopId,
    ownerAccountId: String(raw.ownerAccountId ?? ""),
    totalEarned: money(Number(raw.totalEarned) || 0),
    pendingRequested: money(Number(raw.pendingRequested) || 0),
    withdrawn: money(Number(raw.withdrawn) || 0),
    ordersCounted: Number(raw.ordersCounted) || 0,
    createdAt: String(raw.createdAt ?? nowIso()),
    updatedAt: String(raw.updatedAt ?? nowIso()),
  };
}

/* =========================================================
 * READ
 * ======================================================= */

async function readWallet(shopId: string): Promise<WalletDoc | null> {
  const snapshot = await getAdminFirestore().collection("wallets").doc(shopId).get();
  return snapshot.exists ? readWalletDoc(shopId, snapshot.data()) : null;
}

/**
 * Reads a wallet summary. **Strictly read-only** — when the wallet document does
 * not exist yet it returns a zeroed summary computed in memory and writes
 * nothing. The document is created lazily by the first operation that actually
 * moves money, so merely viewing the page never mutates Firestore.
 */
export async function getWalletSummary(
  shopId: string,
  ownerAccountId: string,
): Promise<WalletSummary> {
  const existing = await readWallet(shopId);
  if (!existing) {
    const timestamp = nowIso();
    return toSummary(zeroWalletDoc(shopId, ownerAccountId, timestamp));
  }
  return toSummary(existing);
}

export async function getWalletEntries(shopId: string) {
  const snapshot = await getAdminFirestore()
    .collection("wallets")
    .doc(shopId)
    .collection("entries")
    .orderBy("createdAt", "desc")
    .limit(ENTRIES_PAGE_SIZE)
    .get();

  return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as object) }));
}

/** Withdrawal snapshots come back masked — the shopkeeper does not need the raw account. */
export async function getWithdrawals(shopId: string): Promise<Withdrawal[]> {
  const snapshot = await getAdminFirestore()
    .collection("wallets")
    .doc(shopId)
    .collection("withdrawals")
    .orderBy("requestedAt", "desc")
    .limit(ENTRIES_PAGE_SIZE)
    .get();

  return snapshot.docs.map((d) => {
    const withdrawal = { id: d.id, ...(d.data() as Omit<Withdrawal, "id">) };
    return { ...withdrawal, destination: maskDestination(withdrawal.destination) };
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
 * Records cash / UPI / card the shopkeeper physically took for an order, and
 * credits the wallet in the same transaction as the order update.
 *
 * Doing both in one transaction is the whole point: an order cannot end up marked
 * collected without the matching ledger credit, and vice versa. A double-tap on
 * the button credits once, because the second run finds `balance <= 0`.
 *
 * The credited amount is clamped to the order's outstanding balance, so a client
 * asking for more than is owed cannot inflate the wallet.
 */
export async function creditFromOrderCollection(input: {
  orderId: string;
  amount: number;
  via: PaymentCollectedVia;
  uid: string;
}): Promise<CollectResult> {
  const { orderId, via, uid } = input;
  if (!orderId) throw new WalletError("An order is required.", 400);
  if (!["cash", "upi", "card"].includes(via)) {
    throw new WalletError("Choose how the payment was collected.");
  }
  const requested = toAmount(input.amount);

  const db = getAdminFirestore();

  return db.runTransaction(async (tx) => {
    const orderRef = db.collection("orders").doc(orderId);
    const orderSnap = await tx.get(orderRef);
    if (!orderSnap.exists) throw new WalletError("Order not found.", 404);

    const order = { id: orderSnap.id, ...orderSnap.data() } as Order;
    const { ownerAccountId } = await assertShopOwnerIn(tx, order.shopId, uid);

    const total = money(Number(order.price.total) || 0);
    const balance = money(Number(order.balance) || 0);

    if (balance <= 0) {
      const existing = (await readWallet(order.shopId)) ?? zeroWalletDoc(order.shopId, ownerAccountId, nowIso());
      return { order, credited: 0, summary: toSummary(existing), alreadyCollected: true };
    }

    const walletRef = db.collection("wallets").doc(order.shopId);
    // `ordersCounted` counts distinct orders, not credits, so a partial then final
    // collection is one order. A marker subcollection makes that dedupe atomic
    // without an unbounded id array growing on the wallet document.
    const markerRef = walletRef.collection("creditedOrders").doc(orderId);

    const walletSnap = await tx.get(walletRef);
    const markerSnap = await tx.get(markerRef);

    const current = walletSnap.exists
      ? readWalletDoc(order.shopId, walletSnap.data())
      : zeroWalletDoc(order.shopId, ownerAccountId, nowIso());

    const credited = money(Math.min(requested, balance));
    const paid = money(Math.min(total, (Number(order.amountPaid) || 0) + credited));
    const remaining = money(Math.max(0, total - paid));
    const timestamp = nowIso();
    const isNewOrder = !markerSnap.exists;

    const paymentStatus = remaining <= 0 ? "paid" : "partial";

    const next: WalletDoc = {
      ...current,
      ownerAccountId,
      totalEarned: money(current.totalEarned + credited),
      ordersCounted: current.ordersCounted + (isNewOrder ? 1 : 0),
      updatedAt: timestamp,
    };

    // --- writes: one per document, all after every read ---

    tx.update(orderRef, {
      amountPaid: paid,
      balance: remaining,
      paymentStatus,
      balanceCollectedVia: via,
      updatedAt: timestamp,
    });

    // A plain set, not set-then-update: two writes to one document in a single
    // transaction is not something Firestore accepts.
    tx.set(walletRef, next);

    if (isNewOrder) tx.set(markerRef, { orderId, firstCreditedAt: timestamp });

    tx.create(walletRef.collection("entries").doc(), {
      shopId: order.shopId,
      kind: "credit",
      source: "order_collection",
      amount: credited,
      orderId,
      via,
      note: `Collected ${via} for order ${orderId}`,
      createdAt: timestamp,
    });

    return {
      // Every field the transaction wrote, so the client's optimistic state
      // matches what actually committed rather than the pre-update document.
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
 * Creates a pending withdrawal request and reserves the amount by raising
 * `pendingRequested`, which lowers `availableBalance` until the request is
 * rejected or paid.
 */
export async function createWithdrawal(input: {
  shopId: string;
  uid: string;
  amount: number;
  note?: unknown;
}): Promise<{ withdrawal: Withdrawal; summary: WalletSummary; minWithdrawalAmount: number }> {
  const { shopId, uid } = input;
  if (!shopId) throw new WalletError("A shop is required.", 400);

  const amount = toAmount(input.amount);
  const { shop, ownerAccountId } = await assertShopOwner(shopId, uid);

  const method: WithdrawalMethod = resolvePayoutMethod(shop) === "upi" ? "upi" : "bank";
  const destination = realDestination(shop, method);
  if (!destination) {
    throw new WalletError("Add your bank account or UPI ID in Shop Profile first.", 409);
  }

  const minWithdrawalAmount = await getMinWithdrawalAmount();
  if (amount < minWithdrawalAmount) {
    throw new WalletError(`Minimum withdrawal is ₹${minWithdrawalAmount}.`);
  }

  const db = getAdminFirestore();

  return db.runTransaction(async (tx) => {
    const walletRef = db.collection("wallets").doc(shopId);
    const walletSnap = await tx.get(walletRef);

    const timestamp = nowIso();
    const current = walletSnap.exists
      ? readWalletDoc(shopId, walletSnap.data())
      : zeroWalletDoc(shopId, ownerAccountId, timestamp);

    // Re-checked inside the transaction: the balance can only have moved by
    // another concurrent request, and the whole point of reserving is that two
    // requests cannot both spend the same money.
    const available = Math.max(0, money(current.totalEarned - current.pendingRequested));
    if (available < amount) {
      throw new WalletError(
        `Available balance is ₹${available}. You need ₹${money(amount - available)} more.`,
      );
    }

    const withdrawalRef = walletRef.collection("withdrawals").doc();
    const requestNote = note(input.note);
    const withdrawal: Withdrawal = {
      id: withdrawalRef.id,
      shopId,
      ownerAccountId,
      amount,
      status: "pending",
      method,
      destination,
      // Firestore rejects `undefined` as a document value, so an absent note has
      // to be omitted from the written document rather than set to undefined.
      ...(requestNote ? { note: requestNote } : {}),
      requestedAt: timestamp,
    };

    const next: WalletDoc = {
      ...current,
      pendingRequested: money(current.pendingRequested + amount),
      updatedAt: timestamp,
    };

    tx.set(walletRef, next);
    tx.set(withdrawalRef, withdrawal);

    return {
      // The response echoes a masked destination — the shopkeeper already knows
      // their own account, and nothing requires sending the raw number back.
      withdrawal: { ...withdrawal, destination: maskDestination(destination) },
      summary: toSummary(next),
      minWithdrawalAmount,
    };
  });
}

/* =========================================================
 * WRITE: ADMIN DECISIONS
 * ======================================================= */

export type WithdrawalAction = "approve" | "reject" | "mark_paid";

const TRANSITIONS: Record<
  WithdrawalAction,
  { from: WithdrawalStatus[]; to: WithdrawalStatus }
> = {
  approve: { from: ["pending"], to: "approved" },
  reject: { from: ["pending", "approved"], to: "rejected" },
  mark_paid: { from: ["approved"], to: "paid" },
};

/**
 * Which statuses count as in-flight and therefore reserved against the balance.
 *
 * `approved` is deliberately still in-flight: approving a request records that an
 * admin intends to transfer the money, not that they have done so. Only
 * `mark_paid` releases the reservation and counts towards `withdrawn`. Keeping
 * `paid` a separate explicit step is what stops "approved" from being an
 * unverifiable claim that real money moved.
 */
const IN_FLIGHT: WithdrawalStatus[] = ["pending", "approved"];

/**
 * Applies an admin decision to a withdrawal.
 *
 * Idempotent — re-applying the action a withdrawal is already in is a no-op
 * rather than an error — but an action that would move a withdrawal out of order
 * is rejected with a 409.
 */
export async function decideWithdrawal(input: {
  shopId: string;
  withdrawalId: string;
  action: WithdrawalAction;
  adminUid: string;
  note?: unknown;
}): Promise<{ withdrawal: Withdrawal; summary: WalletSummary }> {
  const { shopId, withdrawalId, action, adminUid } = input;
  if (!shopId || !withdrawalId) {
    throw new WalletError("A shop and a withdrawal are required.", 400);
  }

  await assertAdmin(adminUid);

  const rule = TRANSITIONS[action];
  if (!rule) throw new WalletError("Unknown withdrawal action.", 400);

  const db = getAdminFirestore();

  return db.runTransaction(async (tx) => {
    const walletRef = db.collection("wallets").doc(shopId);
    const withdrawalRef = walletRef.collection("withdrawals").doc(withdrawalId);

    const withdrawalSnap = await tx.get(withdrawalRef);
    if (!withdrawalSnap.exists) throw new WalletError("Withdrawal not found.", 404);

    const withdrawal = withdrawalSnap.data() as Withdrawal;
    const walletSnap = await tx.get(walletRef);
    const timestamp = nowIso();

    const current = walletSnap.exists
      ? readWalletDoc(shopId, walletSnap.data())
      : zeroWalletDoc(shopId, withdrawal.ownerAccountId, timestamp);

    const from = withdrawal.status as WithdrawalStatus;

    if (from === rule.to) {
      return { withdrawal, summary: toSummary(current) };
    }
    if (!rule.from.includes(from)) {
      throw new WalletError(
        `Cannot ${action.replace("_", " ")} a ${from} withdrawal.`,
        409,
      );
    }

    const wasInFlight = IN_FLIGHT.includes(from);
    const isInFlight = IN_FLIGHT.includes(rule.to);

    let next: WalletDoc = { ...current, updatedAt: timestamp };

    if (wasInFlight && !isInFlight) {
      next = {
        ...next,
        pendingRequested: Math.max(0, money(current.pendingRequested - withdrawal.amount)),
      };
    }
    if (rule.to === "paid") {
      next = { ...next, withdrawn: money(current.withdrawn + withdrawal.amount) };
    }

    const decisionNote = note(input.note);
    const updated: Withdrawal = {
      ...withdrawal,
      id: withdrawalId,
      status: rule.to,
      decidedAt: timestamp,
      decidedBy: adminUid,
      ...(decisionNote ? { decisionNote } : {}),
    };

    tx.update(withdrawalRef, {
      status: rule.to,
      decidedAt: timestamp,
      decidedBy: adminUid,
      ...(decisionNote ? { decisionNote } : {}),
    });
    tx.set(walletRef, next);

    if (rule.to === "paid") {
      // The debit only exists once the money has actually moved.
      tx.create(walletRef.collection("entries").doc(), {
        shopId,
        kind: "debit",
        source: "withdrawal",
        amount: withdrawal.amount,
        note: `Withdrawal ${withdrawalId} paid`,
        createdAt: timestamp,
      });
    }

    return { withdrawal: updated, summary: toSummary(next) };
  });
}