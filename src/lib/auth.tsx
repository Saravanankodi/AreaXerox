"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Account, AccountRole, AccountStatus, RegistrationStatus } from "@/types";
import { auth } from "./firebase/auth";
import { onAuthStateChanged, type User } from "firebase/auth";
import {
  getAccountByUid,
  registerNewAccount,
  logoutUser,
  signInUser,
} from "@/services/auth.service";
import { fetchAllAccounts } from "@/services/admin.service";
import { fsUpdate } from "./firebase/firestore";

export type { AccountRole };

export interface AccountSession {
  accountId: string;
  role: AccountRole;
  name: string;
  email: string;
  registrationStatus: RegistrationStatus;
  accountStatus: AccountStatus;
  phone?: string | undefined;
  shopName?: string | undefined;
}

interface AuthValue {
  ready: boolean;
  session: AccountSession | null;
  currentUser: User | null;
  signIn: (session: AccountSession) => void;
  signOut: () => Promise<void>;
  getAccount: (id: string) => Account | undefined;
  getAllAccounts: () => Account[];
  createAccount: (
    email: string,
    password: string,
    role: AccountRole,
    name: string,
    phone?: string,
  ) => Promise<Account | string>;
  updateAccount: (id: string, patch: Partial<Account>) => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [session, setSession] = useState<AccountSession | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [ready, setReady] = useState(false);

  // Sync all accounts for admin / lookup
  const loadAccounts = useCallback(async () => {
    try {
      const list = await fetchAllAccounts();
      setAccounts(list);
    } catch {
      // ignore
    }
  }, []);

  const refreshSession = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) {
      setSession(null);
      return;
    }
    const acc = await getAccountByUid(user.uid);
    if (acc) {
      setSession({
        accountId: user.uid,
        role: acc.role,
        name: acc.name || user.displayName || user.email?.split("@")[0] || "User",
        email: user.email || acc.email,
        registrationStatus: acc.registrationStatus,
        accountStatus: acc.accountStatus,
        phone: acc.phone,
        shopName: acc.shopName,
      });
    }
    loadAccounts();
  }, [loadAccounts]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const acc = await getAccountByUid(user.uid);
        if (acc) {
          setSession({
            accountId: user.uid,
            role: acc.role,
            name: acc.name || user.displayName || user.email?.split("@")[0] || "User",
            email: user.email || acc.email,
            registrationStatus: acc.registrationStatus,
            accountStatus: acc.accountStatus,
            phone: acc.phone,
            shopName: acc.shopName,
          });
        }
      } else {
        setSession(null);
      }
      setReady(true);
      loadAccounts();
    });

    return () => unsubscribe();
  }, [loadAccounts]);

  const signIn = useCallback((next: AccountSession) => {
    setSession(next);
  }, []);

  const signOut = useCallback(async () => {
    await logoutUser();
    setSession(null);
  }, []);

  const getAccount = useCallback(
    (id: string) => {
      return accounts.find((a) => a.id === id);
    },
    [accounts],
  );

  const getAllAccounts = useCallback(() => accounts, [accounts]);

  const createAccount = useCallback(
    async (
      email: string,
      password: string,
      role: AccountRole,
      name: string,
      phone?: string,
    ): Promise<Account | string> => {
      const res = await registerNewAccount(email, password, role, name, phone);
      if (typeof res === "string") {
        return res;
      }
      await refreshSession();
      return res.account;
    },
    [refreshSession],
  );

  const updateAccount = useCallback(
    async (id: string, patch: Partial<Account>) => {
      try {
        const acc = accounts.find((a) => a.id === id) || (session?.accountId === id ? session : null);
        const role = acc?.role || "customer";
        const collection = role === "admin" ? "admins" : role === "shopkeeper" ? "shopkeepers" : "users";
        await fsUpdate(`${collection}/${id}`, patch);

        setAccounts((prev) =>
          prev.map((a) => (a.id === id ? { ...a, ...patch, updatedAt: new Date().toISOString() } : a)),
        );

        if (session && session.accountId === id) {
          setSession((prev) => (prev ? { ...prev, ...patch } : null));
        }
      } catch (err) {
        console.error("Error updating account:", err);
      }
    },
    [accounts, session],
  );

  const value = useMemo<AuthValue>(
    () => ({
      ready,
      session,
      currentUser,
      signIn,
      signOut,
      getAccount,
      getAllAccounts,
      createAccount,
      updateAccount,
      refreshSession,
    }),
    [
      ready,
      session,
      currentUser,
      signIn,
      signOut,
      getAccount,
      getAllAccounts,
      createAccount,
      updateAccount,
      refreshSession,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
