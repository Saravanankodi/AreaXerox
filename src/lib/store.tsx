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
  Account,
  Address,
  CustomerProfile,
  DocumentFile,
  Order,
  OrderDraft,
  OrderStatus,
  Shop,
  ShopApplication,
  ShopkeeperProfile,
  SupportTicket,
} from "@/types";
import { seedAddresses, seedOrders, seedProfile, seedShops } from "./seed";

const STORAGE_KEY = "omx-state-v1";

interface AppState {
  shops: Shop[];
  orders: Order[];
  addresses: Address[];
  profile: CustomerProfile;
  tickets: SupportTicket[];
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
  tickets: [],
  activeShopId: seedShops[0]!.id,
  pendingDocs: [],
  uploadedFileNames: [],
  orderDraft: null,
  shopkeeperApplications: [],
  shopkeeperProfiles: {},
};

interface StoreValue extends AppState {
  hydrated: boolean;
  activeShop: Shop;
  updateShop: (shopId: string, updater: (shop: Shop) => Shop) => void;
  placeOrder: (order: Order) => void;
  advanceOrder: (orderId: string, status: OrderStatus) => void;
  collectBalance: (orderId: string, via: "cash" | "upi" | "card") => void;
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
  submitShopkeeperApplication: (application: ShopApplication) => void;
  updateShopkeeperApplication: (id: string, patch: Partial<ShopApplication>) => void;
  getShopkeeperApplication: (accountId: string) => ShopApplication | undefined;
  saveShopkeeperProfile: (accountId: string, profile: ShopkeeperProfile) => void;
  getShopkeeperProfile: (accountId: string) => ShopkeeperProfile | undefined;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);
  const [pendingUploadFiles, setPendingUploadFilesState] = useState<File[]>([]);
  const pendingUploadFilesRef = useRef<File[]>([]);
  const uploadedFilesMapRef = useRef<Map<string, File>>(new Map());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as AppState;
        // Merge shops: seed is the source of truth for the list; user modifications are preserved.
        const savedById = new Map(saved.shops.map((s) => [s.id, s]));
        const merged = initialState.shops.map((seed) => savedById.get(seed.id) ?? seed);
        setState({ ...initialState, ...saved, shops: merged });
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

  const value = useMemo<StoreValue>(
    () => ({
      ...state,
      hydrated,
      activeShop: state.shops.find((s) => s.id === state.activeShopId) ?? state.shops[0]!,
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
      submitShopkeeperApplication,
      updateShopkeeperApplication,
      getShopkeeperApplication,
      saveShopkeeperProfile,
      getShopkeeperProfile,
    }),
    [
      state,
      hydrated,
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
      submitShopkeeperApplication,
      updateShopkeeperApplication,
      getShopkeeperApplication,
      saveShopkeeperProfile,
      getShopkeeperProfile,
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
    .map((o) => parseInt(o.id.replace("OMX-", ""), 10))
    .filter((n) => !Number.isNaN(n));
  const next = (nums.length ? Math.max(...nums) : 1000) + 1;
  return `OMX-${next}`;
}
