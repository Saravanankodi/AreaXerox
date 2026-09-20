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
import { seedAddresses, seedOrders, seedProfile, seedShops } from "./seed";
import {
  demoReviews,
  demoNotifications,
  demoTickets,
  demoShopkeeperApplications,
  demoShopkeeperProfiles,
} from "./demo";
import { bootstrapDemoAccounts } from "./demo/bootstrap-auth";

const STORAGE_KEY = "omx-state-v1";

interface AppState {
  shops: Shop[];
  orders: Order[];
  addresses: Address[];
  profile: CustomerProfile;
  tickets: SupportTicket[];
  reviews: Review[];
  notifications: Notification[];
  activeShopId: string;
  pendingDocs: DocumentFile[];
  uploadedFileNames: string[];
  orderDraft: OrderDraft | null;
  shopkeeperApplications: ShopApplication[];
  shopkeeperProfiles: Record<string, ShopkeeperProfile>;
}

const initialState: AppState = {
  shops: seedShops,
  orders: seedOrders,
  addresses: seedAddresses,
  profile: seedProfile,
  tickets: demoTickets,
  reviews: demoReviews,
  notifications: demoNotifications,
  activeShopId: seedShops[0]!.id,
  pendingDocs: [],
  uploadedFileNames: [],
  orderDraft: null,
  shopkeeperApplications: demoShopkeeperApplications,
  shopkeeperProfiles: demoShopkeeperProfiles,
};

interface StoreValue extends AppState {
  hydrated: boolean;
  activeShop: Shop;
  createShop: (shop: Shop) => void;
  updateShop: (shopId: string, updater: (shop: Shop) => Shop) => void;
  placeOrder: (order: Order) => void;
  advanceOrder: (orderId: string, status: OrderStatus) => void;
  cancelOrder: (orderId: string) => boolean;
  collectBalance: (orderId: string, via: "cash" | "upi" | "card") => void;
  collectOrderPayment: (orderId: string, amount: number) => void;
  saveAddress: (address: Address) => void;
  deleteAddress: (id: string) => void;
  updateProfile: (profile: CustomerProfile) => void;
  addTicket: (ticket: SupportTicket) => void;
  addReview: (review: Review) => void;
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
  submitShopkeeperApplication: (application: ShopApplication) => void;
  updateShopkeeperApplication: (id: string, patch: Partial<ShopApplication>) => void;
  getShopkeeperApplication: (accountId: string) => ShopApplication | undefined;
  saveShopkeeperProfile: (accountId: string, profile: ShopkeeperProfile) => void;
  getShopkeeperProfile: (accountId: string) => ShopkeeperProfile | undefined;
  addNotification: (notification: Notification) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: (recipientId: string) => void;
  getUnreadCount: (recipientId: string) => number;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);
  const [pendingUploadFiles, setPendingUploadFilesState] = useState<File[]>([]);
  const pendingUploadFilesRef = useRef<File[]>([]);
  const uploadedFilesMapRef = useRef<Map<string, File>>(new Map());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    bootstrapDemoAccounts();
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as AppState;
        // Seed shops are source of truth. For existing shop IDs, use seed as base
        // and only preserve user-modified fields (non-seed-default values).
        const merged = initialState.shops.map((seed) => {
          const savedShop = saved.shops.find((s) => s.id === seed.id);
          if (!savedShop) return seed;
          // If saved shop is missing critical fields from seed, use seed version
          if (!savedShop.frontImage || !savedShop.interiorImage) return seed;
          return savedShop;
        });
        // For demo data fields, only use saved values if they contain user-created data.
        const reviews = saved.reviews?.length ? saved.reviews : initialState.reviews;
        const notifications = saved.notifications?.length ? saved.notifications : initialState.notifications;
        const tickets = saved.tickets?.length ? saved.tickets : initialState.tickets;
        const shopkeeperApplications = saved.shopkeeperApplications?.length
          ? saved.shopkeeperApplications
          : initialState.shopkeeperApplications;
        const shopkeeperProfiles = saved.shopkeeperProfiles && Object.keys(saved.shopkeeperProfiles).length
          ? saved.shopkeeperProfiles
          : initialState.shopkeeperProfiles;
        setState({
          ...initialState,
          ...saved,
          shops: merged,
          reviews,
          notifications,
          tickets,
          shopkeeperApplications,
          shopkeeperProfiles,
        });
      }
    } catch {
      /* ignore corrupt state */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage full */
    }
  }, [state, hydrated]);

  const createShop = useCallback((shop: Shop) => {
    setState((s) => ({ ...s, shops: [...s.shops, shop], activeShopId: shop.id }));
  }, []);

  const updateShop = useCallback((shopId: string, updater: (shop: Shop) => Shop) => {
    setState((s) => ({
      ...s,
      shops: s.shops.map((shop) => (shop.id === shopId ? updater(shop) : shop)),
    }));
  }, []);

  const placeOrder = useCallback((order: Order) => {
    setState((s) => ({ ...s, orders: [order, ...s.orders], orderDraft: null }));
  }, []);

  const advanceOrder = useCallback((orderId: string, status: OrderStatus) => {
    const at = new Date().toISOString();
    setState((s) => ({
      ...s,
      orders: s.orders.map((o) =>
        o.id === orderId
          ? { ...o, status, updatedAt: at, timeline: [...o.timeline, { status, at }] }
          : o,
      ),
    }));
  }, []);

  const cancelOrder = useCallback((orderId: string): boolean => {
    let cancelled = false;
    const at = new Date().toISOString();
    setState((s) => ({
      ...s,
      orders: s.orders.map((o) => {
        if (o.id !== orderId) return o;
        if (o.status !== "NEW" && o.status !== "ACCEPTED") return o;
        cancelled = true;
        return {
          ...o,
          status: "REJECTED" as OrderStatus,
          updatedAt: at,
          timeline: [...o.timeline, { status: "REJECTED" as OrderStatus, at }],
        };
      }),
    }));
    return cancelled;
  }, []);

  const collectBalance = useCallback((orderId: string, via: "cash" | "upi" | "card") => {
    setState((s) => ({
      ...s,
      orders: s.orders.map((o) =>
        o.id === orderId
          ? {
              ...o,
              amountPaid: o.price.total,
              balance: 0,
              paymentStatus: "paid",
              balanceCollectedVia: via,
              updatedAt: new Date().toISOString(),
            }
          : o,
      ),
    }));
  }, []);

  const collectOrderPayment = useCallback((orderId: string, amount: number) => {
    const safeAmount = Math.round((Number.isFinite(amount) ? amount : 0) * 100) / 100;
    setState((s) => ({
      ...s,
      orders: s.orders.map((o) => {
        if (o.id !== orderId) return o;
        const newAmountPaid = Math.min(o.price.total, o.amountPaid + safeAmount);
        const newBalance = Math.max(0, o.price.total - newAmountPaid);
        const newPaymentStatus = newBalance <= 0 ? "paid" : "partial";
        return {
          ...o,
          amountPaid: newAmountPaid,
          balance: newBalance,
          paymentStatus: newPaymentStatus,
          updatedAt: new Date().toISOString(),
        };
      }),
    }));
  }, []);

  const saveAddress = useCallback((address: Address) => {
    setState((s) => ({
      ...s,
      addresses: s.addresses.some((a) => a.id === address.id)
        ? s.addresses.map((a) => (a.id === address.id ? address : a))
        : [...s.addresses, address],
    }));
  }, []);

  const deleteAddress = useCallback((id: string) => {
    setState((s) => ({ ...s, addresses: s.addresses.filter((a) => a.id !== id) }));
  }, []);

  const updateProfile = useCallback((profile: CustomerProfile) => {
    setState((s) => ({ ...s, profile }));
  }, []);

  const addTicket = useCallback((ticket: SupportTicket) => {
    setState((s) => ({ ...s, tickets: [ticket, ...s.tickets] }));
  }, []);

  const addReview = useCallback((review: Review) => {
    setState((s) => ({ ...s, reviews: [review, ...s.reviews] }));
  }, []);

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

  const submitShopkeeperApplication = useCallback((application: ShopApplication) => {
    setState((s) => {
      const existing = s.shopkeeperApplications.findIndex(
        (a) => a.accountId === application.accountId,
      );
      if (existing >= 0) {
        const apps = [...s.shopkeeperApplications];
        apps[existing] = application;
        return { ...s, shopkeeperApplications: apps };
      }
      return { ...s, shopkeeperApplications: [...s.shopkeeperApplications, application] };
    });
  }, []);

  const updateShopkeeperApplication = useCallback((id: string, patch: Partial<ShopApplication>) => {
    setState((s) => ({
      ...s,
      shopkeeperApplications: s.shopkeeperApplications.map((a) =>
        a.id === id ? { ...a, ...patch, updatedAt: new Date().toISOString() } : a,
      ),
    }));
  }, []);

  const getShopkeeperApplication = useCallback(
    (accountId: string) => {
      return state.shopkeeperApplications.find((a) => a.accountId === accountId);
    },
    [state.shopkeeperApplications],
  );

  const saveShopkeeperProfile = useCallback((accountId: string, profile: ShopkeeperProfile) => {
    setState((s) => ({
      ...s,
      shopkeeperProfiles: { ...s.shopkeeperProfiles, [accountId]: profile },
    }));
  }, []);

  const getShopkeeperProfile = useCallback(
    (accountId: string) => {
      return state.shopkeeperProfiles[accountId];
    },
    [state.shopkeeperProfiles],
  );

  const addNotification = useCallback((notification: Notification) => {
    setState((s) => ({ ...s, notifications: [notification, ...s.notifications] }));
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }));
  }, []);

  const markAllNotificationsRead = useCallback((recipientId: string) => {
    setState((s) => ({
      ...s,
      notifications: s.notifications.map((n) =>
        n.recipientId === recipientId ? { ...n, read: true } : n,
      ),
    }));
  }, []);

  const getUnreadCount = useCallback(
    (recipientId: string) => {
      return state.notifications.filter((n) => n.recipientId === recipientId && !n.read).length;
    },
    [state.notifications],
  );

  const value = useMemo<StoreValue>(
    () => ({
      ...state,
      hydrated,
      activeShop:
        state.shops.find((s) => s.id === state.activeShopId) ??
        state.shops[0]!,
      createShop,
      updateShop,
      placeOrder,
      advanceOrder,
      cancelOrder,
      collectBalance,
      collectOrderPayment,
      saveAddress,
      deleteAddress,
      updateProfile,
      addTicket,
      addReview,
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
      submitShopkeeperApplication,
      updateShopkeeperApplication,
      getShopkeeperApplication,
      saveShopkeeperProfile,
      getShopkeeperProfile,
      addNotification,
      markNotificationRead,
      markAllNotificationsRead,
      getUnreadCount,
    }),
    [
      state,
      hydrated,
      createShop,
      updateShop,
      placeOrder,
      advanceOrder,
      cancelOrder,
      collectBalance,
      collectOrderPayment,
      saveAddress,
      deleteAddress,
      updateProfile,
      addTicket,
      addReview,
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
      submitShopkeeperApplication,
      updateShopkeeperApplication,
      getShopkeeperApplication,
      saveShopkeeperProfile,
      getShopkeeperProfile,
      addNotification,
      markNotificationRead,
      markAllNotificationsRead,
      getUnreadCount,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}

export function newOrderId(orders: Order[]) {
  const nums = orders
    .map((o) => parseInt(o.id.replace("XM-", ""), 10))
    .filter((n) => !Number.isNaN(n));
  const next = (nums.length ? Math.max(...nums) : 1000) + 1;
  return `XM-${next}`;
}
