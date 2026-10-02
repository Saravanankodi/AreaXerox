import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Order, OrderStatus } from "@/types";

export async function placeOrderInDb(order: Order): Promise<void> {
  await setDoc(doc(db, "orders", order.id), {
    ...order,
    updatedAt: new Date().toISOString(),
  });
}

export async function advanceOrderStatusInDb(orderId: string, status: OrderStatus): Promise<void> {
  const docRef = doc(db, "orders", orderId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return;

  const current = snap.data() as Order;
  const at = new Date().toISOString();
  const timeline = [...(current.timeline || []), { status, at }];

  await updateDoc(docRef, {
    status,
    updatedAt: at,
    timeline,
  });
}

/**
 * Settling an order's outstanding balance now runs server-side through
 * `POST /api/orders/collect` (see `@/lib/wallet/server`). It previously wrote
 * `amountPaid` / `balance` / `paymentStatus` straight from the browser, which
 * let any authenticated user mark any order as paid. Do not re-add a client-side
 * equivalent.
 */

export async function getOrderById(orderId: string): Promise<Order | null> {
  const snap = await getDoc(doc(db, "orders", orderId));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Order) : null;
}

export function listenOrders(callback: (orders: Order[]) => void) {
  const colRef = collection(db, "orders");
  return onSnapshot(colRef, (snap) => {
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Order);
    // sort newest first
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    callback(list);
  });
}

export function listenCustomerOrders(customerId: string, callback: (orders: Order[]) => void) {
  const colRef = collection(db, "orders");
  const q = query(colRef, where("customerId", "==", customerId));
  return onSnapshot(q, (snap) => {
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Order);
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    callback(list);
  });
}

export function listenShopOrders(shopId: string, callback: (orders: Order[]) => void) {
  const colRef = collection(db, "orders");
  const q = query(colRef, where("shopId", "==", shopId));
  return onSnapshot(q, (snap) => {
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Order);
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    callback(list);
  });
}

export function generateOrderId(orders: Order[] = []): string {
  const nums = orders
    .map((o) => parseInt(o.id.replace("OMX-", ""), 10))
    .filter((n) => !Number.isNaN(n));
  const next = (nums.length ? Math.max(...nums) : 1000) + 1;
  return `OMX-${next}`;
}
