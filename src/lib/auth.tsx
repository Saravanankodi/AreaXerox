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
  const snapshot = await getDoc(
    doc(db, "users", id),
  );

  if (!snapshot.exists()) {
    return undefined;
  }

  return userFromFirestore(
    snapshot.id,
    snapshot.data(),
  );
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
              setSession(null);
              setReady(true);
              return;
            }

            const account =
              await getUserById(user.uid);

            if (!account) {
              console.error(
                "Firebase user exists but Firestore user does not exist.",
              );

              await firebaseSignOut(auth);

              setSession(null);

              return;
            }

            setSession({
              accountId: account.id,
              role: account.role,

              name: account.name,
              email: account.email,
              phone: account.phone,

              shopId: account.shopId,

              registrationStatus: account.registrationStatus,
              accountStatus: account.accountStatus,
            });
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
    },
    [],
  );


  /* =======================================================
   * SIGN OUT
   * ===================================================== */

  const signOut = useCallback(
    async () => {
      await firebaseSignOut(auth);

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


            return {
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
