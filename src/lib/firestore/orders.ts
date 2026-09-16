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
import type { Order, OrderStatus, TimelineEntry } from "@/types";

const ORDERS_COLLECTION = "orders";

export type CreateOrderInput = Omit<Order, "id" | "createdAt" | "updatedAt" | "timeline"> & {
    id?: string;
};

/**
 * Creates a new order in Firestore.
 */
export async function createFirestoreOrder(input: CreateOrderInput): Promise<Order> {
    const orderId = input.id || `OMX-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString();

    const newOrder: Order = {
        ...input,
        id: orderId,
        createdAt: now,
        updatedAt: now,
        timeline: [
            {
                status: input.status || "NEW",
                at: now,
            },
        ],
    };

    const orderRef = doc(db, ORDERS_COLLECTION, orderId);
    await setDoc(orderRef, newOrder);

    return newOrder;
}

/**
 * Updates an order's status in Firestore and appends a new timeline milestone.
 */
export async function updateOrderStatusInFirestore(
    orderId: string,
    newStatus: OrderStatus
): Promise<void> {
    const orderRef = doc(db, ORDERS_COLLECTION, orderId);
    const snap = await getDoc(orderRef);

    if (!snap.exists()) {
        throw new Error(`Order ${orderId} not found in Firestore.`);
    }

    const currentOrder = snap.data() as Order;
    const now = new Date().toISOString();

    const currentTimeline: TimelineEntry[] = Array.isArray(currentOrder.timeline)
        ? currentOrder.timeline
        : [];

    const updatedTimeline: TimelineEntry[] = [
        ...currentTimeline,
        {
            status: newStatus,
            at: now,
        },
    ];

    await updateDoc(orderRef, {
        status: newStatus,
        updatedAt: now,
        timeline: updatedTimeline,
    });
}

/**
 * Subscribes to real-time order updates for a specific customer.
 */
export function listenToUserOrders(
    customerId: string,
    onUpdate: (orders: Order[]) => void
): () => void {
    const ordersRef = collection(db, ORDERS_COLLECTION);
    const q = query(ordersRef, where("customerId", "==", customerId));

    return onSnapshot(
        q,
        (snapshot) => {
            const orders = snapshot.docs.map((doc) => doc.data() as Order);
            // Sort newest first
            orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            onUpdate(orders);
        },
        (error) => {
            console.error("Error in listenToUserOrders:", error);
        }
    );
}

/**
 * Subscribes to real-time order updates for a specific shopkeeper's shop.
 */
export function listenToShopOrders(
    shopId: string,
    onUpdate: (orders: Order[]) => void
): () => void {
    const ordersRef = collection(db, ORDERS_COLLECTION);
    const q = query(ordersRef, where("shopId", "==", shopId));

    return onSnapshot(
        q,
        (snapshot) => {
            const orders = snapshot.docs.map((doc) => doc.data() as Order);
            orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            onUpdate(orders);
        },
        (error) => {
            console.error("Error in listenToShopOrders:", error);
        }
    );
}

/**
 * Subscribes to real-time updates for all orders in Firestore (for overview / admin).
 */
export function listenToAllOrders(
    onUpdate: (orders: Order[]) => void,
    onError?: (error: unknown) => void
): () => void {
    const ordersRef = collection(db, ORDERS_COLLECTION);

    return onSnapshot(
        ordersRef,
        (snapshot) => {
            const orders = snapshot.docs.map((doc) => doc.data() as Order);
            orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            onUpdate(orders);
        },
        (error) => {
            console.warn("Warning in listenToAllOrders:", error);
            if (onError) onError(error);
        }
    );
}

/**
 * Subscribes to real-time updates for a single order by orderId.
 */
export function listenToSingleOrder(
    orderId: string,
    onUpdate: (order: Order | null) => void
): () => void {
    const orderRef = doc(db, ORDERS_COLLECTION, orderId);

    return onSnapshot(
        orderRef,
        (docSnap) => {
            if (docSnap.exists()) {
                onUpdate(docSnap.data() as Order);
            } else {
                onUpdate(null);
            }
        },
        (error) => {
            console.error(`Error in listenToSingleOrder (${orderId}):`, error);
        }
    );
}
