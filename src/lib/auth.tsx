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
  signIn: (session: AccountSession) => void;
  signOut: () => void;
  /** Raw account from the accounts store (for password, timestamps, etc.) */
  getAccount: (id: string) => Account | undefined;
  getAllAccounts: () => Account[];
  createAccount: (
    email: string,
    password: string,
    role: AccountRole,
    name: string,
  ) => Account | string;
  updateAccount: (id: string, patch: Partial<Account>) => void;
}

const SESSION_KEY = "omx-session-v1";
const ACCOUNTS_KEY = "omx-accounts-v1";
const AuthContext = createContext<AuthValue | null>(null);

// Simple non-crypto hash for demo. In production use Argon2id/ bcrypt server-side.
function hashPassword(pw: string): string {
  let hash = 0;
  for (let i = 0; i < pw.length; i++) {
    const char = pw.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `h_${Math.abs(hash).toString(36)}_${pw.length}`;
}

function loadAccounts(): Account[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    if (raw) return JSON.parse(raw) as Account[];
  } catch {
    /* corrupt */
  }
  return [];
}

function saveAccounts(accounts: Account[]) {
  try {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch {
    /* storage full */
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AccountSession | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(SESSION_KEY);
      if (saved) setSession(JSON.parse(saved) as AccountSession);
    } catch {
      localStorage.removeItem(SESSION_KEY);
    } finally {
      setReady(true);
    }
  }, []);

  const signIn = useCallback((next: AccountSession) => {
    setSession(next);
    localStorage.setItem(SESSION_KEY, JSON.stringify(next));
  }, []);

  const signOut = useCallback(() => {
    setSession(null);
    localStorage.removeItem(SESSION_KEY);
  }, []);

  const getAccount = useCallback((id: string) => {
    return loadAccounts().find((a) => a.id === id);
  }, []);

  const getAllAccounts = useCallback(() => loadAccounts(), []);

  const createAccount = useCallback(
    (email: string, password: string, role: AccountRole, name: string): Account | string => {
      const accounts = loadAccounts();
      const existing = accounts.find((a) => a.email.toLowerCase() === email.toLowerCase());
      if (existing) return "An account with this email already exists.";

      const now = new Date().toISOString();
      const account: Account = {
        id: `acc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        email: email.trim().toLowerCase(),
        passwordHash: hashPassword(password),
        role,
        registrationStatus: role === "customer" ? "incomplete" : "complete",
        accountStatus: "active",
        createdAt: now,
        updatedAt: now,
      };
      accounts.push(account);
      saveAccounts(accounts);
      return account;
    },
    [],
  );

  const updateAccount = useCallback((id: string, patch: Partial<Omit<Account, "id">>) => {
    const accounts = loadAccounts();
    const idx = accounts.findIndex((a) => a.id === id);
    if (idx === -1) return;
    accounts[idx] = {
      ...accounts[idx],
      ...patch,
      updatedAt: new Date().toISOString(),
    } as Account;
    saveAccounts(accounts);
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      ready,
      session,
      signIn,
      signOut,
      getAccount,
      getAllAccounts,
      createAccount,
      updateAccount,
    }),
    [ready, session, signIn, signOut, getAccount, getAllAccounts, createAccount, updateAccount],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
