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
import type { Address, CustomerProfile, Order, OrderStatus, Shop, SupportTicket } from "@/types";
import { seedAddresses, seedOrders, seedProfile, seedShops } from "./seed";

const STORAGE_KEY = "omx-state-v1";

interface AppState {
  shops: Shop[];
  orders: Order[];
  addresses: Address[];
  profile: CustomerProfile;
  tickets: SupportTicket[];
  activeShopId: string;
}

const initialState: AppState = {
  shops: seedShops,
  orders: seedOrders,
  addresses: seedAddresses,
  profile: seedProfile,
  tickets: [],
  activeShopId: seedShops[0]!.id,
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
  pendingUploadFiles: File[];
  setPendingUploadFiles: (files: File[]) => void;
  consumePendingUploadFiles: () => File[];
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);
  const [pendingUploadFiles, setPendingUploadFilesState] = useState<File[]>([]);
  const pendingUploadFilesRef = useRef<File[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState({ ...initialState, ...(JSON.parse(raw) as AppState) });
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
    setState((s) => ({ ...s, orders: [order, ...s.orders] }));
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
      pendingUploadFiles,
      setPendingUploadFiles,
      consumePendingUploadFiles,
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
      pendingUploadFiles,
      setPendingUploadFiles,
      consumePendingUploadFiles,
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
