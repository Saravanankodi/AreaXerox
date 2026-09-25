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

import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";

import {
  doc,
  getDoc,
  getDocs,
  collection,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase";

import type {
  UserAccount,
  AccountRole,
  AccountStatus,
  RegistrationStatus,
} from "@/types";



/* =========================================================
 * SESSION
 * ======================================================= */
export interface AccountSession {
  accountId: string;

  role: AccountRole;

  name: string;
  email: string;
  phone: string;

  shopId?: string;

  shopName?: string;

  registrationStatus: RegistrationStatus;
  accountStatus: AccountStatus;
}



/* =========================================================
 * AUTH CONTEXT
 * ======================================================= */

interface AuthValue {
  ready: boolean;

  session: AccountSession | null;

  signIn: (session: AccountSession) => void;

  signOut: () => Promise<void>;

  getAccount: (
    id: string,
  ) => Promise<UserAccount | undefined>;

  getAllAccounts: () => Promise<UserAccount[]>;

  createAccount: (
    email: string,
    password: string,
    role: AccountRole,
    name: string,
    phone?: string,
  ) => Promise<UserAccount | string>;

  updateAccount: (
    id: string,
    patch: Partial<Omit<UserAccount, "id">>,
  ) => Promise<void>;
}


const AuthContext =
  createContext<AuthValue | null>(null);


/* =========================================================
 * FIRESTORE → USER ACCOUNT
 * ======================================================= */

function userFromFirestore(
  id: string,
  data: Record<string, unknown>,
): UserAccount {
  return {
    id,

    email: String(data.email ?? ""),

    role: data.role as AccountRole,

    name: String(data.name ?? ""),

    phone: String(data.phone ?? ""),

    alternatePhone:
      data.alternatePhone
        ? String(data.alternatePhone)
        : undefined,

    shopId:
      data.shopId
        ? String(data.shopId)
        : undefined,

    registrationStatus:
      data.registrationStatus as RegistrationStatus,

    accountStatus:
      data.accountStatus as AccountStatus,

    createdAt:
      data.createdAt instanceof Date
        ? data.createdAt.toISOString()
        : String(data.createdAt ?? ""),

    updatedAt:
      data.updatedAt instanceof Date
        ? data.updatedAt.toISOString()
        : String(data.updatedAt ?? ""),
  };
}


/* =========================================================
 * GET USER
 *
 * Firestore:
 *
 * users/{uid}
 * ======================================================= */

async function getUserById(
  id: string,
): Promise<UserAccount | undefined> {
  for (const collectionName of ["users", "shopkeepers", "admins"]) {
    try {
      const snapshot = await getDoc(
        doc(db, collectionName, id),
      );

      if (snapshot.exists()) {
        return userFromFirestore(
          snapshot.id,
          snapshot.data(),
        );
      }
    } catch (error) {
      // No access (rules) or a transient network issue on this collection must
      // never abort the whole lookup — move on so an account stored elsewhere
      // can still be resolved.
      console.warn(
        `getUserById: could not read ${collectionName}/${id}:`,
        error,
      );
    }
  }

  return undefined;
}

/**
 * Repair an account document that lost its identity fields (e.g. an old save
 * persisted empty name/phone over it). Fills the gaps from the Firebase auth
 * identity so orders always carry the customer's real name.
 */
export async function healAccountIdentity(
  id: string,
  source: {
    name?: string | null;
    email?: string | null;
    phoneNumber?: string | null;
  },
): Promise<void> {
  try {
    const snapshot = await getDoc(doc(db, "users", id));
    if (!snapshot.exists()) return;

    const data = snapshot.data();
    const email = String(data.email ?? "");
    const nested = data.profile as { name?: string; phone?: string } | undefined;
    const currentName =
      String(data.name ?? "").trim() || nested?.name?.trim() || "";

    const patch: Record<string, string> = {};
    if (!currentName) {
      const candidate =
        source.name?.trim() ||
        (source.email ?? email).split("@")[0].trim() ||
        "";
      if (candidate) patch.name = candidate;
    }
    if (!String(data.phone ?? "").trim() && source.phoneNumber?.trim()) {
      patch.phone = source.phoneNumber.trim();
    }
    if (Object.keys(patch).length > 0) {
      await updateDoc(doc(db, "users", id), patch);
    }
  } catch (error) {
    console.warn("healAccountIdentity failed:", error);
  }
}


/* =========================================================
 * SESSION CACHE
 * ======================================================= */

const SESSION_CACHE_KEY = "omx-session-v1";

function readCachedSession(): AccountSession | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(SESSION_CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as AccountSession;
    if (!parsed || typeof parsed.accountId !== "string") return null;

    return parsed;
  } catch (error) {
    console.warn("Could not read cached session:", error);
    return null;
  }
}

function writeCachedSession(next: AccountSession | null): void {
  if (typeof window === "undefined") return;

  try {
    if (next) {
      window.localStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(next));
    } else {
      window.localStorage.removeItem(SESSION_CACHE_KEY);
    }
  } catch (error) {
    console.warn("Could not write cached session:", error);
  }
}


/* =========================================================
 * AUTH PROVIDER
 * ======================================================= */

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [session, setSession] =
    useState<AccountSession | null>(null);

  const [ready, setReady] =
    useState(false);


  /* =======================================================
   * RESTORE FIREBASE SESSION
   * ===================================================== */

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (user: User | null) => {
          try {
            if (!user) {
              writeCachedSession(null);

              setSession(null);
              setReady(true);

              return;
            }

            let account: UserAccount | undefined;

            try {
              account = await getUserById(user.uid);
            } catch (error) {
              // A Firestore read error (rules/network) must NEVER log the user
              // out — that is what made refreshes bounce users back to login.
              console.error(
                "Session restore account lookup failed:",
                error,
              );
            }

            if (account) {
              // Self-heal: if the Firebase identity carries a name/phone that the
              // account doc never stored, persist it so orders always have real
              // customer details (fixes accounts created before this existed).
              const missingName = !account.name?.trim() && !!user.displayName?.trim();
              const missingPhone = !account.phone?.trim() && !!user.phoneNumber?.trim();
              if (missingName || missingPhone) {
                const patch: Record<string, string> = {};
                if (missingName && user.displayName) {
                  patch.name = user.displayName.trim();
                  account = { ...account, name: patch.name };
                }
                if (missingPhone && user.phoneNumber) {
                  patch.phone = user.phoneNumber.trim();
                  account = { ...account, phone: patch.phone };
                }
                updateDoc(doc(db, "users", account.id), patch).catch(console.warn);
              }

              const restored: AccountSession = {
                accountId: account.id,
                role: account.role,

                name: account.name,
                email: account.email,
                phone: account.phone,

                shopId: account.shopId,

                registrationStatus: account.registrationStatus,
                accountStatus: account.accountStatus,
              };

              setSession(restored);
              writeCachedSession(restored);

              return;
            }

            // Firebase is signed in but no account doc could be resolved.
            // Keep the Firebase session (no destructive sign-out) and reuse
            // the cached session when it belongs to this user, so a refresh
            // does not force a re-login.
            console.warn(
              "Firebase user exists but no Firestore account was resolved for",
              user.uid,
            );

            const cached = readCachedSession();
            setSession(
              cached?.accountId === user.uid ? cached : null,
            );
          } catch (error) {
            console.error(
              "Failed to restore authentication session:",
              error,
            );

            setSession(null);
          } finally {
            setReady(true);
          }
        },
      );

    return unsubscribe;
  }, []);

  /* =======================================================
   * SET SESSION
   *
   * Firebase remains the source of authentication truth.
   * This only updates React state.
   * ===================================================== */

  const signIn = useCallback(
    (next: AccountSession) => {
      setSession(next);
      writeCachedSession(next);
    },
    [],
  );


  /* =======================================================
   * SIGN OUT
   * ===================================================== */

  const signOut = useCallback(
    async () => {
      await firebaseSignOut(auth);

      writeCachedSession(null);
      setSession(null);
    },
    [],
  );


  /* =======================================================
   * GET ACCOUNT
   * ===================================================== */

  const getAccount = useCallback(
    async (id: string) => {
      return getUserById(id);
    },
    [],
  );

  const getAllAccounts = useCallback(async () => {
    try {
      const snap = await getDocs(collection(db, "users"));
      return snap.docs.map((docSnap) => userFromFirestore(docSnap.id, docSnap.data()));
    } catch (err) {
      console.error("Error fetching all accounts:", err);
      return [];
    }
  }, []);


  /* =======================================================
   * CREATE ACCOUNT
   *
   * 1. Firebase Authentication
   * 2. Firestore users/{uid}
   * ===================================================== */

  const createAccount = useCallback(
    async (
      email: string,
      password: string,
      role: AccountRole,
      name: string,
      phone = "",
    ): Promise<UserAccount | string> => {
      try {
        const normalizedEmail =
          email.trim().toLowerCase();

        const normalizedName =
          name.trim();

        const normalizedPhone =
          phone.trim();


        /* -----------------------------------------------
         * 1. CREATE FIREBASE AUTH USER
         * --------------------------------------------- */

        const credential =
          await createUserWithEmailAndPassword(
            auth,
            normalizedEmail,
            password,
          );


        const uid =
          credential.user.uid;


        /* -----------------------------------------------
         * 2. INITIAL ACCOUNT STATE
         * --------------------------------------------- */

        const accountStatus: AccountStatus =
          role === "shopkeeper"
            ? "pending"
            : "active";


        const registrationStatus:
          RegistrationStatus = "incomplete";


        /* -----------------------------------------------
         * 3. USER ACCOUNT OBJECT
         * --------------------------------------------- */

        const account: UserAccount = {
          id: uid,

          email: normalizedEmail,

          role,

          name: normalizedName,

          phone: normalizedPhone,

          registrationStatus,

          accountStatus,

          createdAt:
            new Date().toISOString(),

          updatedAt:
            new Date().toISOString(),
        };


        /* -----------------------------------------------
         * 4. SAVE TO FIRESTORE
         *
         * users/{uid}
         * --------------------------------------------- */

        await setDoc(
          doc(db, "users", uid),
          {
            id: uid,

            email: normalizedEmail,

            role,

            name: normalizedName,

            phone: normalizedPhone,

            registrationStatus,

            accountStatus,

            createdAt:
              serverTimestamp(),

            updatedAt:
              serverTimestamp(),
          },
        );


        /* -----------------------------------------------
         * 5. CREATE REACT SESSION
         * --------------------------------------------- */

        setSession({
          accountId: uid,

          role,

          name: normalizedName,

          email: normalizedEmail,

          phone: normalizedPhone,

          registrationStatus,

          accountStatus,
        });

        writeCachedSession({
          accountId: uid,

          role,

          name: normalizedName,

          email: normalizedEmail,

          phone: normalizedPhone,

          registrationStatus,

          accountStatus,
        });


        return account;
      } catch (error: unknown) {
        console.error(
          "Create account error:",
          error,
        );


        if (
          typeof error === "object" &&
          error !== null &&
          "code" in error
        ) {
          const code =
            String(
              (error as {
                code?: unknown;
              }).code,
            );


          switch (code) {
            case "auth/email-already-in-use":
              return "An account with this email already exists.";

            case "auth/invalid-email":
              return "Please enter a valid email address.";

            case "auth/weak-password":
              return "Password must be at least 8 characters.";

            case "auth/network-request-failed":
              return "Network error. Please check your connection.";

            default:
              break;
          }
        }


        return "Unable to create account. Please try again.";
      }
    },
    [],
  );


  /* =======================================================
   * UPDATE ACCOUNT
   * ===================================================== */

  const updateAccount = useCallback(
    async (
      id: string,
      patch: Partial<Omit<UserAccount, "id">>,
    ) => {
      const userRef =
        doc(db, "users", id);


      await updateDoc(
        userRef,
        {
          ...patch,

          updatedAt:
            serverTimestamp(),
        },
      );


      /* -----------------------------------------------
       * KEEP CURRENT SESSION UPDATED
       * --------------------------------------------- */

      if (
        session?.accountId === id
      ) {
        setSession(
          (current) => {
            if (!current) {
              return current;
            }


            const next: AccountSession = {
              ...current,

              ...(patch.name !== undefined
                ? {
                  name: patch.name,
                }
                : {}),

              ...(patch.email !== undefined
                ? {
                  email: patch.email,
                }
                : {}),

              ...(patch.phone !== undefined
                ? {
                  phone: patch.phone,
                }
                : {}),

              ...(patch.shopId !== undefined
                ? {
                  shopId: patch.shopId,
                }
                : {}),

              ...(patch.role !== undefined
                ? {
                  role: patch.role,
                }
                : {}),

              ...(patch.registrationStatus !==
                undefined
                ? {
                  registrationStatus:
                    patch.registrationStatus,
                }
                : {}),

              ...(patch.accountStatus !==
                undefined
                ? {
                  accountStatus:
                    patch.accountStatus,
                }
                : {}),
            };

            writeCachedSession(next);

            return next;
          },
        );
      }
    },
    [session?.accountId],
  );


  /* =======================================================
   * CONTEXT VALUE
   * ===================================================== */

  const value =
    useMemo<AuthValue>(
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
      [
        ready,

        session,

        signIn,

        signOut,

        getAccount,

        getAllAccounts,

        createAccount,

        updateAccount,
      ],
    );


  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  );
}


/* =========================================================
 * USE AUTH
 * ======================================================= */

export function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider",
    );
  }

  return context;
}
