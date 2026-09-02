import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type AccountRole = "customer" | "shopkeeper";

export interface AccountSession {
  role: AccountRole;
  name: string;
  email: string;
  phone?: string | undefined;
  shopName?: string | undefined;
}

interface AuthValue {
  ready: boolean;
  session: AccountSession | null;
  signIn: (session: AccountSession) => void;
  signOut: () => void;
}

const SESSION_KEY = "omx-session-v1";
const AuthContext = createContext<AuthValue | null>(null);

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

  const value = useMemo(() => ({ ready, session, signIn, signOut }), [ready, session, signIn, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
