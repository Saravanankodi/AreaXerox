"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  Address,
  CustomerProfile,
  DocumentFile,
  Notification,
  Order,
  OrderDraft,
  OrderStatus,
  Review,
  Shop,
  ShopApplication,
  ShopkeeperProfile,
  SupportTicket,
} from "@/types";

import { createShop as createShopInDb, listenToShops, updateShopInFirestore } from "@/lib/firestore/shops";
import { saveShopkeeperProfileToFirestore } from "@/lib/firestore/users";
import { collection, doc, getDoc, onSnapshot, query, updateDoc, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  createFirestoreOrder,
  updateOrderStatusInFirestore,
  listenToAllOrders,
  listenToUserOrders,
} from "@/lib/firestore/orders";
import {
  createReviewInDb,
  listenToReviews,
  updateReviewReplyInDb,
} from "@/lib/firestore/reviews";
import { listenToNotifications } from "@/lib/firebase/notifications-client";
import {
  fireAndForget,
  markAllNotificationsReadRemote,
  markNotificationReadRemote,
} from "@/services/notifications.service";
import { useAuth } from "@/lib/auth";
import { collectOrderPayment as collectOrderPaymentApi } from "@/services/wallet.service";
import { nextStatus, orderStatusLabel } from "@/lib/labels";
import {
  getShopkeeperApplication as fetchShopkeeperApplication,
  submitShopkeeperApplication as submitShopkeeperApplicationToDb,
} from "@/services/shopkeeper.service";
import {
  getUserProfile,
  getUserAddresses,
  saveUserAddress,
  deleteUserAddress,
  updateUserProfile,
  addUserTicket,
} from "@/services/user.service";

interface AppState {
  shops: Shop[];
  orders: Order[];
  reviews: Review[];
  notifications: Notification[];
  addresses: Address[];
  profile: CustomerProfile;
  tickets: SupportTicket[];
  shopkeeperApplications: Record<string, ShopApplication>;
  activeShopId: string;
  pendingDocs: DocumentFile[];
  uploadedFileNames: string[];
  orderDraft: OrderDraft | null;
  shopkeeperProfiles: Record<string, ShopkeeperProfile>;
}

const emptyProfile: CustomerProfile = {
  name: "",
  email: "",
  phone: "",
};

const initialState: AppState = {
  shops: [],
  orders: [],
  reviews: [],
  notifications: [],
  addresses: [],
  profile: emptyProfile,
  tickets: [],
  shopkeeperApplications: {},
  activeShopId: "",
  pendingDocs: [],
  uploadedFileNames: [],
  orderDraft: null,
  shopkeeperProfiles: {},
};

// Notifications are a cold-start cache only: Firestore is the source of truth
// and `listenToNotifications` overwrites this on every load. The key is
// suffixed with the account UID because the previous flat key mixed
// notifications from every account that ever used this browser.
const NOTIFICATIONS_STORAGE_KEY = "xeroxmate-notifications-v1";

/** Bound the cache so localStorage cannot grow without limit. */
const MAX_CACHED_NOTIFICATIONS = 50;

function notificationsStorageKey(uid: string): string {
  return `${NOTIFICATIONS_STORAGE_KEY}:${uid}`;
}

/**
 * Mirrors a read-state change into the cached copy.
 *
 * The Firestore listener is authoritative, but writing the cache keeps a
 * reload from flashing unread badges for notifications the user already opened
 * while offline.
 */
function applyReadState(
  notifications: Notification[],
  notificationId: string,
  nextRead: boolean,
): Notification[] {
  return notifications.map((n) => (n.id === notificationId ? { ...n, read: nextRead } : n));
}

function loadPersistedNotifications(uid: string): Notification[] {
  if (typeof window === "undefined" || !uid) return [];
  try {
    // The pre-per-account cache cannot be attributed to this user; drop it.
    window.localStorage.removeItem(NOTIFICATIONS_STORAGE_KEY);
    const raw = window.localStorage.getItem(notificationsStorageKey(uid));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return (parsed as Notification[])
      .filter((n) => n && typeof n.id === "string")
      .slice(0, MAX_CACHED_NOTIFICATIONS);
  } catch {
    return [];
  }
}

function persistNotifications(uid: string, notifications: Notification[]): void {
  if (typeof window === "undefined" || !uid) return;
  try {
    window.localStorage.setItem(
      notificationsStorageKey(uid),
      JSON.stringify(notifications.slice(0, MAX_CACHED_NOTIFICATIONS)),
    );
  } catch {
    // Quota exceeded or storage disabled — the inbox still works from Firestore.
  }
}

interface StoreValue extends AppState {
  hydrated: boolean;
  activeShop: Shop;
  setActiveShopId: (id: string) => void;
  updateShop: (shopId: string, updater: (shop: Shop) => Shop) => void;
  placeOrder: (order: Order) => Promise<Order>;
  advanceOrder: (orderId: string, status: OrderStatus) => Promise<void>;
  collectBalance: (orderId: string, via: "cash" | "upi" | "card") => Promise<void>;
  saveAddress: (address: Address) => void;
  deleteAddress: (id: string) => void;
  updateProfile: (profile: CustomerProfile) => void;
  addTicket: (ticket: SupportTicket) => void;
  setPendingDocs: (docs: DocumentFile[]) => void;
  clearPendingDocs: () => void;
  setUploadedFileNames: (names: string[]) => void;
  pendingUploadFiles: File[];
  setPendingUploadFiles: (files: File[]) => void;
  consumePendingUploadFiles: () => File[];
  saveOrderDraft: (draft: OrderDraft) => void;
  clearOrderDraft: () => void;
  cacheFile: (id: string, file: File) => void;
  getCachedFile: (id: string) => File | undefined;
  removeCachedFile: (id: string) => void;
  saveShopkeeperProfile: (accountId: string, profile: ShopkeeperProfile) => void;
  getShopkeeperProfile: (accountId: string) => ShopkeeperProfile | undefined;
  createShop: (shop: Omit<Shop, "id">) => Promise<string>;
  submitShopkeeperApplication: (application: ShopApplication) => void;
  getShopkeeperApplication: (accountId: string) => ShopApplication | undefined;
  addReview: (review: Review) => Promise<void>;
  addNotification: (notification: Notification) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  getUnreadCount: (recipientId: string) => number;
  cancelOrder: (orderId: string) => boolean;
  collectOrderPayment: (
    orderId: string,
    amount: number,
    via?: "cash" | "upi" | "card",
  ) => Promise<void>;
  replyToReview: (reviewId: string, text: string) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

let backfillRunning = false;

/**
 * One-time repair for orders placed with an empty customer name/phone (e.g.
 * created before the profile fallback existed). Resolves the customer's
 * account doc (users/{customerId}) and patches the order so the shopkeeper
 * always sees who placed it.
 */
async function backfillMissingOrderCustomers(orders: Order[]) {
  if (backfillRunning) return;
  const dirty = orders.filter(
    (o) => !!o.customerId && (!o.customerName?.trim() || !o.customerPhone?.trim()),
  );
  if (!dirty.length) return;
  backfillRunning = true;
  try {
    const resolved = new Map<string, { name: string; phone: string } | null>();
    for (const order of dirty) {
      const uid = order.customerId;
      if (uid == null) continue;
      if (!resolved.has(uid)) {
        try {
          const snapshot = await getDoc(doc(db, "users", uid));
          const data = snapshot.exists() ? snapshot.data() : null;
          const nested = data?.profile as { name?: string; phone?: string } | undefined;
          resolved.set(
            uid,
            data
              ? {
                  name: String(data.name ?? nested?.name ?? ""),
                  phone: String(data.phone ?? nested?.phone ?? ""),
                }
              : null,
          );
        } catch {
          resolved.set(uid, null);
        }
      }
      const info = resolved.get(uid);
      const name = order.customerName?.trim() || info?.name?.trim() || "Customer";
      const phone = order.customerPhone?.trim() || info?.phone?.trim() || "";
      if (name === order.customerName && phone === order.customerPhone) continue;
      await updateDoc(doc(db, "orders", order.id), { customerName: name, customerPhone: phone });
    }
  } catch (error) {
    console.warn("Order customer backfill failed:", error);
  } finally {
    backfillRunning = false;
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [state, setState] = useState<AppState>(initialState);
  const [pendingUploadFiles, setPendingUploadFilesState] = useState<File[]>([]);
  const pendingUploadFilesRef = useRef<File[]>([]);
  const uploadedFilesMapRef = useRef<Map<string, File>>(new Map());
  const [ordersLoaded, setOrdersLoaded] = useState(false);
  // Account the current `state.orders` snapshot belongs to, so switching
  // accounts in the same tab never renders the previous user's orders.
  const [ordersOwner, setOrdersOwner] = useState<string | null>(null);
  // Account the current `state.notifications` snapshot belongs to, so switching
  // accounts in the same tab never renders the previous user's inbox. Mirrors
  // `ordersOwner` above: gate on ownership rather than clearing inside the
  // effect, which would trigger a cascading render.
  const [notificationsOwner, setNotificationsOwner] = useState<string | null>(null);

  // Notification inbox. Firestore is the source of truth; localStorage is only
  // a cold-start cache that fills in if the listener cannot connect.
  useEffect(() => {
    const uid = session?.accountId;
    // No account means no inbox. `notificationsOwner` stays at its previous
    // value, but the gate below already hides the list from a signed-out user.
    if (!uid) return;

    const unsubscribe = listenToNotifications(
      uid,
      (notifications) => {
        setNotificationsOwner(uid);
        setState((s) => ({ ...s, notifications }));
      },
      (error) => {
        console.warn("Notifications listener failed:", error);
        setNotificationsOwner(uid);
        setState((s) =>
          s.notifications.length ? s : { ...s, notifications: loadPersistedNotifications(uid) },
        );
      },
    );

    return () => unsubscribe();
    // `setNotificationsOwner` is a stable state setter; the account is the only
    // thing that should re-subscribe.
  }, [session?.accountId]);

  // Hide the inbox entirely while it belongs to a different account than the
  // one signed in now, so the previous user's alerts never flash on screen.
  const notifications = useMemo(
    () =>
      !session?.accountId || notificationsOwner === session.accountId ? state.notifications : [],
    [state.notifications, notificationsOwner, session],
  );

  // Mirror the inbox into the per-account cache for the next cold start.
  useEffect(() => {
    if (!session?.accountId || notificationsOwner !== session.accountId) return;
    persistNotifications(session.accountId, state.notifications);
  }, [session?.accountId, notificationsOwner, state.notifications]);

  // Subscribe to Shops in Firestore
  useEffect(() => {
    const unsubscribeShops = listenToShops(
      (updatedShops) => {
        setState((s) => ({ ...s, shops: updatedShops }));
      },
      (error) => {
        console.error("Shops Firestore listener failed:", error);
      }
    );

    return () => unsubscribeShops();
  }, []);


  // Subscribe to the shopkeeper's OWN shop (all statuses) so their pending
  // shop shows on the dashboard before admin approval. The shops listener
  // above only streams `active` shops, which would hide a pending one.
  useEffect(() => {
    if (session?.role !== "shopkeeper" || !session.accountId) return;
    const q = query(
      collection(db, "shops"),
      where("ownerAccountId", "==", session.accountId),
    );
    const unsubscribeMine = onSnapshot(
      q,
      (snapshot) => {
        const mine = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Shop);
        if (!mine.length) return;
        const mineIds = new Set(mine.map((s) => s.id));
        setState((s) => ({
          ...s,
          shops: [...s.shops.filter((shop) => !mineIds.has(shop.id)), ...mine],
        }));
      },
      (error) => {
        console.error("Failed to listen to own shops:", error);
      },
    );

    return () => unsubscribeMine();
  }, [session?.accountId, session?.role]);


  // Subscribe to Orders in Firestore (Real-Time updates)
  //
  // A customer only ever subscribes to their own orders, so the store never
  // holds another customer's orders and the shopkeeper order pages keep their
  // full-collection view.
  useEffect(() => {
    if (!session?.accountId) return;

    // Recorded against every snapshot, whichever subscription produced it, so a
    // later sign-in cannot keep rendering the previous account's orders.
    const scope = session.accountId;

    const onUpdate = (firestoreOrders: Order[]) => {
      setOrdersOwner(scope);
      setState((s) => ({
        ...s,
        orders: firestoreOrders,
      }));
      setOrdersLoaded(true);
      void backfillMissingOrderCustomers(firestoreOrders);
    };

    const onError = (error: unknown) => {
      console.warn("Failed to subscribe to orders in Firestore, continuing with hydration:", error);
      setOrdersLoaded(true);
    };

    const unsubscribeOrders =
      session.role === "customer"
        ? listenToUserOrders(
          scope,
          onUpdate,
          onError,
        )
        : listenToAllOrders(onUpdate, onError);

    return () => unsubscribeOrders();
  }, [session?.accountId, session?.role]);

  const orders = useMemo(
    () =>
      ordersOwner === null || ordersOwner === session?.accountId
        ? state.orders
        : [],
    [state.orders, ordersOwner, session?.accountId],
  );

  // Without an account there is no order subscription to wait for, so the
  // order pages are never stuck on their loading state.
  const hydrated = ordersLoaded || !session?.accountId;

  // Subscribe to Reviews in Firestore so shopkeepers see persisted customer reviews.
  useEffect(() => {
    const unsubscribeReviews = listenToReviews(
      (firestoreReviews) => {
        setState((s) => ({ ...s, reviews: firestoreReviews }));
      },
      (error) => {
        console.warn("Reviews listener failed:", error);
      }
    );
    return () => unsubscribeReviews();
  }, []);

  // Hydrate the current shopkeeper's application (used synchronously during render).
  useEffect(() => {
    if (!session?.accountId) return;
    fetchShopkeeperApplication(session.accountId)
      .then((app) => {
        if (app) {
          setState((s) => ({
            ...s,
            shopkeeperApplications: { ...s.shopkeeperApplications, [session.accountId]: app },
          }));
        }
      })
      .catch(console.error);
  }, [session?.accountId]);

  // Hydrate the signed-in customer's profile and saved addresses from Firestore
  // so the order flow shows real data (never demo/seed data).
  useEffect(() => {
    if (!session?.accountId || session.role !== "customer") return;

    let cancelled = false;

    getUserProfile(session.accountId)
      .then((p) => {
        if (cancelled || !p) return;
        setState((s) => ({ ...s, profile: { ...s.profile, ...p } }));
      })
      .catch(console.error);

    getUserAddresses(session.accountId)
      .then((list) => {
        if (cancelled) return;
        setState((s) => ({ ...s, addresses: list }));
      })
      .catch(console.error);

    return () => {
      cancelled = true;
    };
  }, [session?.accountId, session?.role]);

  const updateShop = useCallback((shopId: string, updater: (shop: Shop) => Shop) => {
    setState((s) => {
      const currentShop = s.shops.find((shop) => shop.id === shopId);
      if (!currentShop) return s;
      const updated = updater(currentShop);
      updateShopInFirestore(shopId, updated).catch(console.error);
      return {
        ...s,
        shops: s.shops.map((shop) => (shop.id === shopId ? updated : shop)),
      };
    });
  }, []);

  const placeOrder = useCallback(async (order: Order): Promise<Order> => {
    // Persist directly to Firestore
    const created = await createFirestoreOrder(order);
    setState((s) => ({ ...s, orderDraft: null }));
    return created;
  }, []);

  const advanceOrder = useCallback(
    async (orderId: string, status: OrderStatus): Promise<void> => {
      const order = state.orders.find((o) => o.id === orderId);
      if (!order) throw new Error(`Order ${orderId} not found.`);

      if (status === "REJECTED") {
        if (order.status !== "NEW" && order.status !== "ACCEPTED") {
          throw new Error(
            `An order ${orderStatusLabel[order.status].toLowerCase()} can no longer be rejected.`,
          );
        }
      } else {
        const expected = nextStatus(order.status, order.fulfillment);
        if (status !== expected) {
          throw new Error(
            expected
              ? `Next step for this order is "${orderStatusLabel[expected]}".`
              : "This order has already reached the final step.",
          );
        }
      }

      await updateOrderStatusInFirestore(orderId, status);
    },
    [state.orders],
  );

/**
   * Collects whatever is outstanding on an order.
   *
   * Both collection paths now go through `/api/orders/collect`, which verifies
   * shop ownership, clamps the amount to the real balance, and credits the wallet
   * in the same transaction. Neither updates local state optimistically any
   * more: a rejected call (not the owner, already collected, offline) would
   * otherwise leave the shopkeeper looking at a payment that was never recorded.
   */
  const collectBalance = useCallback(async (orderId: string, via: "cash" | "upi" | "card") => {
    const order = state.orders.find((o) => o.id === orderId);
    if (!order || order.balance <= 0) return;

    const result = await collectOrderPaymentApi({ orderId, amount: order.balance, via });

    setState((s) => ({
      ...s,
      orders: s.orders.map((o) => (o.id === orderId ? result.order : o)),
    }));
  }, [state.orders]);

  const saveAddress = useCallback(
    (address: Address) => {
      setState((s) => ({
        ...s,
        addresses: s.addresses.some((a) => a.id === address.id)
          ? s.addresses.map((a) => (a.id === address.id ? address : a))
          : [...s.addresses, address],
      }));
      if (session?.accountId) {
        saveUserAddress(session.accountId, address).catch(console.error);
      }
    },
    [session],
  );

  const deleteAddress = useCallback(
    (id: string) => {
      setState((s) => ({ ...s, addresses: s.addresses.filter((a) => a.id !== id) }));
      if (session?.accountId) {
        deleteUserAddress(session.accountId, id).catch(console.error);
      }
    },
    [session],
  );

  const updateProfile = useCallback(
    (profile: CustomerProfile) => {
      setState((s) => ({ ...s, profile }));
      if (session?.accountId) {
        updateUserProfile(session.accountId, profile).catch(console.error);
      }
    },
    [session],
  );

  const addTicket = useCallback(
    (ticket: SupportTicket) => {
      setState((s) => ({ ...s, tickets: [ticket, ...s.tickets] }));
      if (session?.accountId) {
        addUserTicket(session.accountId, ticket).catch(console.error);
      }
    },
    [session],
  );

  const setPendingDocs = useCallback((docs: DocumentFile[]) => {
    setState((s) => ({ ...s, pendingDocs: docs }));
  }, []);

  const clearPendingDocs = useCallback(() => {
    setState((s) => ({ ...s, pendingDocs: [] }));
  }, []);

  const setUploadedFileNames = useCallback((names: string[]) => {
    setState((s) => ({ ...s, uploadedFileNames: names }));
  }, []);

  const saveOrderDraft = useCallback((draft: OrderDraft) => {
    setState((s) => ({ ...s, orderDraft: draft }));
  }, []);

  const clearOrderDraft = useCallback(() => {
    setState((s) => ({ ...s, orderDraft: null }));
  }, []);

  const setPendingUploadFiles = useCallback((files: File[]) => {
    pendingUploadFilesRef.current = files;
    setPendingUploadFilesState(files);
  }, []);

  const consumePendingUploadFiles = useCallback(() => {
    const files = pendingUploadFilesRef.current;
    pendingUploadFilesRef.current = [];
    setPendingUploadFilesState([]);
    return files;
  }, []);

  const cacheFile = useCallback((id: string, file: File) => {
    uploadedFilesMapRef.current.set(id, file);
  }, []);

  const getCachedFile = useCallback((id: string) => {
    return uploadedFilesMapRef.current.get(id);
  }, []);

  const removeCachedFile = useCallback((id: string) => {
    uploadedFilesMapRef.current.delete(id);
  }, []);

  const createShop = useCallback((shop: Omit<Shop, "id">) => {
    return createShopInDb(shop).then((id) => {
      const created: Shop = {
        ...shop,
        id,
        accountStatus: "pending",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setState((s) =>
        s.shops.some((x) => x.id === id) ? s : { ...s, shops: [...s.shops, created] },
      );
      return id;
    });
  }, []);

  const submitShopkeeperApplication = useCallback((application: ShopApplication) => {
    if (application.accountId) {
      setState((s) => ({
        ...s,
        shopkeeperApplications: {
          ...s.shopkeeperApplications,
          [application.accountId as string]: application,
        },
      }));
    }
    submitShopkeeperApplicationToDb(application).catch(console.error);
  }, []);

  const getShopkeeperApplication = useCallback(
    (accountId: string) => {
      return state.shopkeeperApplications[accountId];
    },
    [state.shopkeeperApplications],
  );

  /**
   * Optimistically adds the review, then persists it. The returned promise
   * resolves once Firestore has committed, so callers that notify a third
   * party (the shop) can do so after the document actually exists — otherwise
   * the server-side event resolver would 404 on its own read.
   */
  const addReview = useCallback(async (review: Review): Promise<void> => {
    setState((s) => ({
      ...s,
      reviews: s.reviews.some((r) => r.id === review.id)
        ? s.reviews.map((r) => (r.id === review.id ? review : r))
        : [review, ...s.reviews],
    }));
    await createReviewInDb(review);
  }, []);

  /**
   * Notifications are created server-side from business events (see
   * `src/services/notifications.service.ts`). This setter remains only as an
   * escape hatch for locally-synthesised UI and must not be used to notify
   * another user — the server rejects forged recipients at the API boundary.
   */
  const addNotification = useCallback((notification: Notification) => {
    setState((s) => ({
      ...s,
      notifications: [notification, ...s.notifications],
    }));
  }, []);

  // Read state is written optimistically so the badge responds immediately,
  // then persisted via the API route, which scopes the update to the verified
  // caller. A failed write is reverted on the next Firestore snapshot.
  const markNotificationRead = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      notifications: applyReadState(s.notifications, id, true),
    }));
    fireAndForget(() => markNotificationReadRemote(id), "mark read");
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setState((s) => ({
      ...s,
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
    }));
    fireAndForget(() => markAllNotificationsReadRemote(), "mark all read");
  }, []);

  const getUnreadCount = useCallback(
    (recipientId: string) => {
      return state.notifications.filter((n) => n.recipientId === recipientId && !n.read).length;
    },
    [state.notifications],
  );

  const cancelOrder = useCallback(
    (orderId: string): boolean => {
      const order = state.orders.find((o) => o.id === orderId);
      if (!order || !["NEW", "ACCEPTED"].includes(order.status)) return false;
      setState((s) => ({
        ...s,
        orders: s.orders.map((o) =>
          o.id === orderId
            ? { ...o, status: "REJECTED", updatedAt: new Date().toISOString() }
            : o,
        ),
      }));
      updateOrderStatusInFirestore(orderId, "REJECTED").catch(console.error);
      return true;
    },
    [state.orders],
  );

  const collectOrderPayment = useCallback(
    async (orderId: string, amount: number, via: "cash" | "upi" | "card" = "cash") => {
      const order = state.orders.find((o) => o.id === orderId);
      if (!order || order.balance <= 0) return;

      const result = await collectOrderPaymentApi({ orderId, amount, via });

      setState((s) => ({
        ...s,
        orders: s.orders.map((o) => (o.id === orderId ? result.order : o)),
      }));
    },
    [state.orders],
  );

  const replyToReview = useCallback((reviewId: string, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setState((s) => ({
      ...s,
      reviews: s.reviews.map((r) =>
        r.id === reviewId ? { ...r, reply: trimmed, updatedAt: new Date().toISOString() } : r,
      ),
    }));
    updateReviewReplyInDb(reviewId, trimmed).catch(console.error);
  }, []);

  const saveShopkeeperProfile = useCallback((accountId: string, profile: ShopkeeperProfile) => {
    setState((s) => ({
      ...s,
      shopkeeperProfiles: { ...s.shopkeeperProfiles, [accountId]: profile },
    }));
    saveShopkeeperProfileToFirestore(accountId, profile).catch(console.error);
  }, []);

  const getShopkeeperProfile = useCallback(
    (accountId: string) => {
      return state.shopkeeperProfiles[accountId];
    },
    [state.shopkeeperProfiles],
  );

  const setActiveShopId = useCallback((id: string) => {
    setState((s) => ({ ...s, activeShopId: id }));
  }, []);

  const activeShop = useMemo<Shop>(
    () => {
      // Shopkeepers must resolve to their OWN shop (any status), never a seed shop.
      if (session?.role === "shopkeeper" && session.accountId) {
        const own =
          state.shops.find(
            (shop) =>
              shop.ownerAccountId === session.accountId ||
              shop.ownerId === session.accountId ||
              shop.id === session.shopId,
          ) ?? state.shops.find((shop) => shop.id === session.shopId);
        if (own) return own;
      }

      return state.shops.find((shop) => shop.id === state.activeShopId) ??
        state.shops[0] ??
        {
        id: "",
        name: "",
        ownerName: "",
        phone: "",
        email: "",
        address: "",
        rating: 0,
        prepMinutes: 0,
        pickup: false,
        paperTypes: [],
        printTypes: { bw: true, color: false },
        printSides: { single: true, double: false },
        orientation: { portrait: true, landscape: false },
        binding: [],
        additional: [],
        delivery: { enabled: false, fee: 0, freeAbove: null, etaMinutes: "", areas: [] },
        payments: { full: true, advance: false, cashPickup: false, cashDelivery: false, advancePercent: 50 },
      };
    },
    [state.shops, state.activeShopId, session],
  );

  const value = useMemo<StoreValue>(
    () => ({
      ...state,
      notifications,
      orders,
      hydrated,
      activeShop,
      setActiveShopId,
      updateShop,
      placeOrder,
      advanceOrder,
      collectBalance,
      saveAddress,
      deleteAddress,
      updateProfile,
      addTicket,
      setPendingDocs,
      clearPendingDocs,
      setUploadedFileNames,
      pendingUploadFiles,
      setPendingUploadFiles,
      consumePendingUploadFiles,
      saveOrderDraft,
      clearOrderDraft,
      cacheFile,
      getCachedFile,
      removeCachedFile,
      saveShopkeeperProfile,
      getShopkeeperProfile,
      createShop,
      submitShopkeeperApplication,
      getShopkeeperApplication,
      addReview,
      addNotification,
      markNotificationRead,
      markAllNotificationsRead,
      getUnreadCount,
      cancelOrder,
      collectOrderPayment,
      replyToReview,
    }),
    [
      state,
      notifications,
      orders,
      hydrated,
      activeShop,
      setActiveShopId,
      updateShop,
      placeOrder,
      advanceOrder,
      collectBalance,
      saveAddress,
      deleteAddress,
      updateProfile,
      addTicket,
      setPendingDocs,
      clearPendingDocs,
      setUploadedFileNames,
      pendingUploadFiles,
      setPendingUploadFiles,
      consumePendingUploadFiles,
      saveOrderDraft,
      clearOrderDraft,
      cacheFile,
      getCachedFile,
      removeCachedFile,
      saveShopkeeperProfile,
      getShopkeeperProfile,
      createShop,
      submitShopkeeperApplication,
      getShopkeeperApplication,
      addReview,
      addNotification,
      markNotificationRead,
      markAllNotificationsRead,
      getUnreadCount,
      cancelOrder,
      collectOrderPayment,
      replyToReview,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}

export function newOrderId(orders: Order[] = []) {
  const nums = orders
    .map((o) => parseInt(o.id.replace("OMX-", ""), 10))
    .filter((n) => !Number.isNaN(n));
  const next = (nums.length ? Math.max(...nums) : 1000) + 1;
  return `OMX-${next}`;
}
