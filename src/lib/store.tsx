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
  ShopApplication,
  ShopkeeperProfile,
  SupportTicket,
} from "@/types";
import { useAuth } from "./auth";
import { listenShops, updateShopInDb, saveShop } from "@/services/shop.service";
import {
  listenOrders,
  listenCustomerOrders,
  listenShopOrders,
  placeOrderInDb,
  advanceOrderStatusInDb,
  collectBalanceInDb,
} from "@/services/order.service";
import {
  getUserProfile,
  updateUserProfile,
  listenUserAddresses,
  saveUserAddress,
  deleteUserAddress,
  listenUserTickets,
  addUserTicket,
} from "@/services/user.service";
import {
  listenApplications,
  approveApplication,
  rejectApplication,
} from "@/services/admin.service";
import {
  submitShopkeeperApplication as submitAppInDb,
  updateShopkeeperApplication as updateAppInDb,
  saveShopkeeperProfile as saveProfileInDb,
} from "@/services/shopkeeper.service";

const fallbackShop: Shop = {
  id: "default-shop",
  name: "Print Shop",
  ownerName: "Manager",
  phone: "",
  email: "",
  address: "Local Store",
  hours: "9:00 AM – 9:00 PM",
  rating: 5,
  distanceKm: 1,
  prepMinutes: 20,
  pickup: true,
  paperTypes: [],
  printTypes: { bw: true, color: true },
  printSides: { single: true, double: true },
  orientation: { portrait: true, landscape: true },
  binding: [],
  additional: [],
  delivery: { enabled: true, fee: 30, freeAbove: 200, etaMinutes: "30 min", areas: [] },
  payments: { full: true, advance: true, cashPickup: true, cashDelivery: true, advancePercent: 50 },
};

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

const initialProfile: CustomerProfile = {
  name: "",
  email: "",
  phone: "",
  alternatephone: "",
};

const initialState: AppState = {
  shops: [],
  orders: [],
  addresses: [],
  profile: initialProfile,
  tickets: [],
  activeShopId: "",
  pendingDocs: [],
  uploadedFileNames: [],
  orderDraft: null,
  shopkeeperApplications: [],
  shopkeeperProfiles: {},
};

interface StoreValue extends AppState {
  hydrated: boolean;
  activeShop: Shop;
  setActiveShopId: (id: string) => void;
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
  const { session } = useAuth();
  const [state, setState] = useState<AppState>(initialState);
  const [pendingUploadFiles, setPendingUploadFilesState] = useState<File[]>([]);
  const pendingUploadFilesRef = useRef<File[]>([]);
  const uploadedFilesMapRef = useRef<Map<string, File>>(new Map());
  const [hydrated, setHydrated] = useState(false);

  // 1. Real-time shops listener
  useEffect(() => {
    const unsubShops = listenShops((loadedShops) => {
      setState((prev) => ({
        ...prev,
        shops: loadedShops,
        activeShopId: prev.activeShopId || (loadedShops[0]?.id ?? ""),
      }));
      setHydrated(true);
    });

    return () => unsubShops();
  }, []);

  // 2. Real-time applications listener (for admin and registration status)
  useEffect(() => {
    const unsubApps = listenApplications((apps) => {
      setState((prev) => ({
        ...prev,
        shopkeeperApplications: apps,
      }));
    });

    return () => unsubApps();
  }, []);

  // 3. Real-time orders listener depending on role
  useEffect(() => {
    if (!session) {
      // If not logged in, listen to all orders or none
      const unsub = listenOrders((orders) => {
        setState((prev) => ({ ...prev, orders }));
      });
      return () => unsub();
    }

    let unsub: () => void;
    if (session.role === "admin") {
      unsub = listenOrders((orders) => {
        setState((prev) => ({ ...prev, orders }));
      });
    } else if (session.role === "shopkeeper") {
      unsub = listenOrders((orders) => {
        setState((prev) => ({ ...prev, orders }));
      });
    } else {
      // Customer
      unsub = listenOrders((orders) => {
        const myOrders = orders.filter(
          (o) =>
            o.customerId === session.accountId ||
            (session.email && o.customerName?.toLowerCase() === session.name?.toLowerCase()),
        );
        setState((prev) => ({ ...prev, orders: myOrders.length ? myOrders : orders }));
      });
    }

    return () => unsub();
  }, [session]);

  // 4. User addresses & tickets & profile if logged in
  useEffect(() => {
    if (!session?.accountId) return;

    // Load profile
    getUserProfile(session.accountId).then((prof) => {
      if (prof) {
        setState((prev) => ({ ...prev, profile: prof }));
      } else if (session.email) {
        setState((prev) => ({
          ...prev,
          profile: {
            name: session.name || "",
            email: session.email || "",
            phone: session.phone || "",
            alternatephone: "",
          },
        }));
      }
    });

    // Listen addresses
    const unsubAddresses = listenUserAddresses(session.accountId, (addresses) => {
      setState((prev) => ({ ...prev, addresses }));
    });

    // Listen tickets
    const unsubTickets = listenUserTickets(session.accountId, (tickets) => {
      setState((prev) => ({ ...prev, tickets }));
    });

    return () => {
      unsubAddresses();
      unsubTickets();
    };
  }, [session]);

  // Active shop selection: if shopkeeper, prioritize their own shop
  const activeShop = useMemo<Shop>(() => {
    if (session?.role === "shopkeeper") {
      const myShop = state.shops.find((s) => s.id === session.accountId);
      if (myShop) return myShop;
    }
    const found = state.shops.find((s) => s.id === state.activeShopId);
    return found || state.shops[0] || fallbackShop;
  }, [state.shops, state.activeShopId, session]);

  const setActiveShopId = useCallback((id: string) => {
    setState((s) => ({ ...s, activeShopId: id }));
  }, []);

  const updateShop = useCallback(
    (shopId: string, updater: (shop: Shop) => Shop) => {
      setState((s) => ({
        ...s,
        shops: s.shops.map((shop) => (shop.id === shopId ? updater(shop) : shop)),
      }));
      updateShopInDb(shopId, updater).catch(console.error);
    },
    [],
  );

  const placeOrder = useCallback(
    (order: Order) => {
      const orderWithCustomer: Order = {
        ...order,
        customerId: session?.accountId || order.customerId,
      };
      setState((s) => ({
        ...s,
        orders: [orderWithCustomer, ...s.orders],
        orderDraft: null,
      }));
      placeOrderInDb(orderWithCustomer).catch(console.error);
    },
    [session],
  );

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
    advanceOrderStatusInDb(orderId, status).catch(console.error);
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

  const submitShopkeeperApplication = useCallback(
    (application: ShopApplication) => {
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
      submitAppInDb(application).catch(console.error);
    },
    [],
  );

  const updateShopkeeperApplication = useCallback(
    (id: string, patch: Partial<ShopApplication>) => {
      setState((s) => ({
        ...s,
        shopkeeperApplications: s.shopkeeperApplications.map((a) =>
          a.id === id ? { ...a, ...patch, updatedAt: new Date().toISOString() } : a,
        ),
      }));
      updateAppInDb(id, patch).catch(console.error);
    },
    [],
  );

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
    saveProfileInDb(accountId, profile).catch(console.error);
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
      submitShopkeeperApplication,
      updateShopkeeperApplication,
      getShopkeeperApplication,
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

export function newOrderId(orders: Order[] = []) {
  const nums = orders
    .map((o) => parseInt(o.id.replace("OMX-", ""), 10))
    .filter((n) => !Number.isNaN(n));
  const next = (nums.length ? Math.max(...nums) : 1000) + 1;
  return `OMX-${next}`;
}
