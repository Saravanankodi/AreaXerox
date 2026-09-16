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
  Order,
  OrderDraft,
  OrderStatus,
  Shop,
  ShopkeeperProfile,
  SupportTicket,
} from "@/types";

import { seedAddresses, seedProfile, seedShops } from "./seed";
import { listenToShops, updateShopInFirestore } from "@/lib/firestore/shops";
import { saveShopkeeperProfileToFirestore } from "@/lib/firestore/users";
import {
  createFirestoreOrder,
  updateOrderStatusInFirestore,
  listenToAllOrders,
} from "@/lib/firestore/orders";
import { useAuth } from "@/lib/auth";
import { collectBalanceInDb } from "@/services/order.service";
import {
  saveUserAddress,
  deleteUserAddress,
  updateUserProfile,
  addUserTicket,
} from "@/services/user.service";

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
  shopkeeperProfiles: Record<string, ShopkeeperProfile>;
}

const initialState: AppState = {
  shops: seedShops,
  orders: [],
  addresses: seedAddresses,
  profile: seedProfile,
  tickets: [],
  activeShopId: "",
  pendingDocs: [],
  uploadedFileNames: [],
  orderDraft: null,
  shopkeeperProfiles: {},
};

interface StoreValue extends AppState {
  hydrated: boolean;
  activeShop: Shop;
  setActiveShopId: (id: string) => void;
  updateShop: (shopId: string, updater: (shop: Shop) => Shop) => void;
  placeOrder: (order: Order) => Promise<Order>;
  advanceOrder: (orderId: string, status: OrderStatus) => Promise<void>;
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
  saveShopkeeperProfile: (accountId: string, profile: ShopkeeperProfile) => void;
  getShopkeeperProfile: (accountId: string) => ShopkeeperProfile | undefined;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [state, setState] = useState<AppState>(initialState);
  const [pendingUploadFiles, setPendingUploadFilesState] = useState<File[]>([]);
  const pendingUploadFilesRef = useRef<File[]>([]);
  const uploadedFilesMapRef = useRef<Map<string, File>>(new Map());
  const [hydrated, setHydrated] = useState(false);

  // Subscribe to Shops in Firestore
  useEffect(() => {
    const unsubscribeShops = listenToShops((updatedShops) => {
      setState((s) => ({ ...s, shops: updatedShops }));
    });
    return () => unsubscribeShops();
  }, []);

  // Subscribe to Orders in Firestore (Real-Time updates)
  useEffect(() => {
    const unsubscribeOrders = listenToAllOrders(
      (firestoreOrders) => {
        setState((s) => ({
          ...s,
          orders: firestoreOrders,
        }));
        setHydrated(true);
      },
      (error) => {
        console.warn("Failed to subscribe to orders in Firestore, continuing with hydration:", error);
        setHydrated(true);
      }
    );
    return () => unsubscribeOrders();
  }, []);

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

  const advanceOrder = useCallback(async (orderId: string, status: OrderStatus): Promise<void> => {
    // Persist status change to Firestore, triggering real-time update listeners
    await updateOrderStatusInFirestore(orderId, status);
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
    collectBalanceInDb(orderId, via).catch(console.error);
  }, []);

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
    () =>
      state.shops.find((shop) => shop.id === state.activeShopId) ??
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
      },
    [state.shops, state.activeShopId],
  );

  const value = useMemo<StoreValue>(
    () => ({
      ...state,
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
      saveShopkeeperProfile,
      getShopkeeperProfile,
    }),
    [
      state,
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

export function newOrderId(orders: Order[] = []) {
  const nums = orders
    .map((o) => parseInt(o.id.replace("OMX-", ""), 10))
    .filter((n) => !Number.isNaN(n));
  const next = (nums.length ? Math.max(...nums) : 1000) + 1;
  return `OMX-${next}`;
}
