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

import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase";

import {
  useNavigate,
  useRouterState,
} from "@/lib/navigation";

import {
  clearGoogleSignInPortal,
  isGoogleAuthUser,
  takeGoogleSignInPortal,
  type GooglePortalRole,
} from "@/lib/auth-google";

import { toast } from "sonner";

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

  getAccountByEmail: (
    email: string,
    role?: AccountRole,
  ) => Promise<UserAccount | undefined>;

  createAccount: (
    email: string,
    password: string,
    role: AccountRole,
    name: string,
    phone?: string,
  ) => Promise<UserAccount | string>;

  createAccountForAuthUser: (
    uid: string,
    input: {
      email: string;
      name: string;
      role: AccountRole;
      phone?: string;
    },
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

    googleUid:
      data.googleUid
        ? String(data.googleUid)
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
 * shopkeepers/{uid}
 * admins/{uid}
 * ======================================================= */

async function getUserById(
  id: string,
): Promise<UserAccount | undefined> {
  for (const collectionName of [
    "users",
    "shopkeepers",
    "admins",
  ]) {
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
      /*
       * Do not let one inaccessible collection prevent checking
       * the remaining collections.
       */
      console.warn(
        `getUserById: could not read ${collectionName}/${id}:`,
        error,
      );
    }
  }

  return undefined;
}


/* =========================================================
 * HEAL ACCOUNT IDENTITY
 * ======================================================= */

export async function healAccountIdentity(
  id: string,
  source: {
    name?: string | null;
    email?: string | null;
    phoneNumber?: string | null;
  },
): Promise<void> {
  try {
    const snapshot = await getDoc(
      doc(db, "users", id),
    );

    if (!snapshot.exists()) {
      return;
    }

    const data = snapshot.data();

    const email =
      String(data.email ?? "");

    const nested =
      data.profile as
        | {
            name?: string;
            phone?: string;
          }
        | undefined;

    const currentName =
      String(data.name ?? "").trim() ||
      nested?.name?.trim() ||
      "";

    const patch: Record<string, string> = {};

    if (!currentName) {
      const candidate =
        source.name?.trim() ||
        (source.email ?? email)
          .split("@")[0]
          .trim() ||
        "";

      if (candidate) {
        patch.name = candidate;
      }
    }

    if (
      !String(data.phone ?? "").trim() &&
      source.phoneNumber?.trim()
    ) {
      patch.phone =
        source.phoneNumber.trim();
    }

    if (Object.keys(patch).length > 0) {
      await updateDoc(
        doc(db, "users", id),
        patch,
      );
    }
  } catch (error) {
    console.warn(
      "healAccountIdentity failed:",
      error,
    );
  }
}


/* =========================================================
 * ACCOUNT LOOKUP
 * ======================================================= */

async function findUserByEmail(
  email: string,
  role?: AccountRole,
): Promise<UserAccount | undefined> {
  try {
    return await findAccountByEmailStrict(
      email,
      role,
    );
  } catch (error) {
    console.warn(
      "findUserByEmail failed:",
      error,
    );

    return undefined;
  }
}


/* =========================================================
 * STRICT ACCOUNT LOOKUP
 * ======================================================= */

async function findAccountByEmailStrict(
  email: string,
  role?: AccountRole,
): Promise<UserAccount | undefined> {
  const normalizedEmail =
    email.trim().toLowerCase();

  if (!normalizedEmail) {
    return undefined;
  }

  const allMatches: UserAccount[] = [];

  for (const collectionName of [
    "users",
    "shopkeepers",
    "admins",
  ]) {
    const snap = await getDocs(
      query(
        collection(db, collectionName),
        where(
          "email",
          "==",
          normalizedEmail,
        ),
      ),
    );

    for (const docSnap of snap.docs) {
      allMatches.push(
        userFromFirestore(
          docSnap.id,
          docSnap.data(),
        ),
      );
    }
  }

  return role
    ? allMatches.find(
        (account) =>
          account.role === role,
      )
    : allMatches[0];
}


/* =========================================================
 * WRITE ACCOUNT DOCUMENT
 * ======================================================= */

async function writeAccountDoc(
  uid: string,
  input: {
    email: string;
    name: string;
    role: AccountRole;
    phone?: string;
  },
): Promise<UserAccount | string> {
  try {
    const normalizedEmail =
      input.email.trim().toLowerCase();

    const normalizedName =
      input.name.trim();

    const normalizedPhone =
      (input.phone ?? "").trim();

    const accountStatus: AccountStatus =
      input.role === "shopkeeper"
        ? "pending"
        : "active";

    const registrationStatus:
      RegistrationStatus =
      "incomplete";

    const now =
      new Date().toISOString();

    const account: UserAccount = {
      id: uid,

      email: normalizedEmail,

      role: input.role,

      name: normalizedName,

      phone: normalizedPhone,

      registrationStatus,

      accountStatus,

      createdAt: now,

      updatedAt: now,
    };

    await setDoc(
      doc(db, "users", uid),
      {
        id: uid,

        email: normalizedEmail,

        role: input.role,

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

    return account;
  } catch (error: unknown) {
    console.error(
      "Create account document error:",
      error,
    );

    return (
      "Unable to create your account. Please try again."
    );
  }
}


/* =========================================================
 * GOOGLE ACCOUNT CREATION RESULT
 * ======================================================= */

type GoogleAccountCreation =
  | {
      ok: true;
      account: UserAccount;
    }
  | {
      ok: false;
      kind: "transient";
      reason: string;
    }
  | {
      ok: false;
      kind: "rejected";
      reason: string;
    };


/* =========================================================
 * CREATE GOOGLE ACCOUNT
 * ======================================================= */

async function createGoogleAccount(
  user: User,
  role: GooglePortalRole,
): Promise<GoogleAccountCreation> {
  const isGoogle =
    user.providerData.some(
      (provider) =>
        provider.providerId ===
        "google.com",
    );

  if (!isGoogle) {
    return {
      ok: false,
      kind: "rejected",
      reason:
        "This sign-in did not come from Google, so no account could be created for it.",
    };
  }

  const email =
    user.email
      ?.trim()
      .toLowerCase();

  if (!email) {
    return {
      ok: false,
      kind: "rejected",
      reason:
        "Google did not share an email address, so no account could be created.",
    };
  }


  /* -------------------------------------------------------
   * CHECK EXISTING ACCOUNT
   * ----------------------------------------------------- */

  let existing:
    | UserAccount
    | undefined;

  try {
    existing =
      await findAccountByEmailStrict(
        email,
      );
  } catch (error) {
    console.error(
      "Could not check for an existing account with this email:",
      error,
    );

    return {
      ok: false,
      kind: "transient",
      reason:
        "Could not reach the database. Check your connection and make sure Firestore is accessible.",
    };
  }


  /* -------------------------------------------------------
   * EXISTING ACCOUNT
   * ----------------------------------------------------- */

  if (existing) {
    if (
      existing.id === user.uid
    ) {
      return {
        ok: true,
        account: existing,
      };
    }

    return {
      ok: false,
      kind: "rejected",
      reason:
        "An account with this email already exists. Sign in with your password instead.",
    };
  }


  /* -------------------------------------------------------
   * CREATE ACCOUNT
   * ----------------------------------------------------- */

  const created =
    await writeAccountDoc(
      user.uid,
      {
        email,

        name:
          user.displayName?.trim() ||
          email.split("@")[0] ||
          "Google User",

        phone:
          user.phoneNumber ??
          undefined,

        role,
      },
    );

  if (typeof created === "string") {
    console.error(
      "Google account provisioning failed:",
      created,
    );

    return {
      ok: false,
      kind: "transient",
      reason: created,
    };
  }


  /* -------------------------------------------------------
   * GOOGLE CUSTOMER = COMPLETE
   * ----------------------------------------------------- */

  if (
    role === "customer" &&
    created.registrationStatus ===
      "incomplete"
  ) {
    try {
      await updateDoc(
        doc(
          db,
          "users",
          created.id,
        ),
        {
          registrationStatus:
            "complete",

          updatedAt:
            serverTimestamp(),
        },
      );
    } catch (error) {
      console.error(
        "Could not complete Google customer registration:",
        error,
      );

      return {
        ok: false,
        kind: "transient",
        reason:
          "Your account was created, but we could not finish registration. Please try again.",
      };
    }

    return {
      ok: true,

      account: {
        ...created,

        registrationStatus:
          "complete",
      },
    };
  }


  /* -------------------------------------------------------
   * SHOPKEEPER REMAINS INCOMPLETE
   * ----------------------------------------------------- */

  return {
    ok: true,
    account: created,
  };
}


/* =========================================================
 * SESSION CACHE
 * ======================================================= */

const SESSION_CACHE_KEY =
  "omx-session-v1";


function readCachedSession():
  AccountSession | null {
  if (
    typeof window ===
    "undefined"
  ) {
    return null;
  }

  try {
    const raw =
      window.localStorage.getItem(
        SESSION_CACHE_KEY,
      );

    if (!raw) {
      return null;
    }

    const parsed =
      JSON.parse(raw) as AccountSession;

    if (
      !parsed ||
      typeof parsed.accountId !==
        "string"
    ) {
      return null;
    }

    return parsed;
  } catch (error) {
    console.warn(
      "Could not read cached session:",
      error,
    );

    return null;
  }
}


function writeCachedSession(
  next: AccountSession | null,
): void {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  try {
    if (next) {
      window.localStorage.setItem(
        SESSION_CACHE_KEY,
        JSON.stringify(next),
      );
    } else {
      window.localStorage.removeItem(
        SESSION_CACHE_KEY,
      );
    }
  } catch (error) {
    console.warn(
      "Could not write cached session:",
      error,
    );
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
    useState<AccountSession | null>(
      null,
    );

  const [ready, setReady] =
    useState(false);

  /*
   * Firebase can initially emit null while persistence is restoring.
   * Do not interpret that as an explicit logout.
   */
  const sawUserRef =
    useRef(false);


  /* =======================================================
   * RESTORE FIREBASE SESSION
   *
   * Google sign-in opens in a popup, so the app is never reloaded and
   * Firebase's own auth listener is the single entry point. It fires for
   * a popup sign-in exactly as it does for a restored session, which is
   * what lets a brand new Google user be provisioned from here.
   * ======================================================= */

useEffect(() => {
let active = true;

/* =====================================================

RESTORE ACCOUNT FROM FIREBASE USER

=================================================== */

const restore = async (
user: User | null,
) => {
try {
  /* -------------------------------------------------
   * NO FIREBASE USER
   * ------------------------------------------------- */

  if (!user) {
    /*
     * Do not clear cached session here.
     *
     * Firebase can emit null while persistence is
     * being restored.
     */
    return;
  }

  sawUserRef.current = true;

  /* -------------------------------------------------
   * FIND ACCOUNT
   * ------------------------------------------------- */

  let account:
    | UserAccount
    | undefined;

  try {
    account =
      await getUserById(
        user.uid,
      );
  } catch (error) {
    console.error(
      "Session restore account lookup failed:",
      error,
    );
  }

  /* -------------------------------------------------
   * ACCOUNT DOES NOT EXIST
   *
   * A Google sign-in for an account that has never been
   * provisioned leaves nothing to look up, so the portal
   * marker written by `beginGoogleSignIn` supplies the
   * role to register against.
   * ------------------------------------------------- */

  if (!account) {
    const role =
      isGoogleAuthUser(user)
        ? takeGoogleSignInPortal()
        : null;

    if (!role) {
      const cached =
        readCachedSession();

      if (
        cached?.accountId ===
        user.uid
      ) {
        setSession(cached);
      }

      return;
    }

    /* ---------------------------------------------
     * GOOGLE ACCOUNT PROVISIONING
     * ------------------------------------------- */

    const creation =
      await createGoogleAccount(
        user,
        role,
      );

    if (creation.ok) {
      account =
        creation.account;
    } else {
      console.warn(
        "Could not create Google account:",
        creation.reason,
      );

      toast.error(
        creation.reason,
      );

      if (
        creation.kind ===
        "transient"
      ) {
        const cached =
          readCachedSession();

        if (
          cached?.accountId ===
          user.uid
        ) {
          setSession(cached);
        }

        return;
      }

      await firebaseSignOut(
        auth,
      );

      writeCachedSession(
        null,
      );

      setSession(null);

      return;
    }
  }

  /* -------------------------------------------------
   * SELF HEAL NAME / PHONE
   * ------------------------------------------------- */

  const missingName =
    !account.name?.trim() &&
    !!user.displayName?.trim();

  const missingPhone =
    !account.phone?.trim() &&
    !!user.phoneNumber?.trim();

  if (
    missingName ||
    missingPhone
  ) {
    const patch:
      Record<string, string> =
      {};

    if (
      missingName &&
      user.displayName
    ) {
      patch.name =
        user.displayName.trim();

      account = {
        ...account,
        name: patch.name,
      };
    }

    if (
      missingPhone &&
      user.phoneNumber
    ) {
      patch.phone =
        user.phoneNumber.trim();

      account = {
        ...account,
        phone: patch.phone,
      };
    }

    updateDoc(
      doc(
        db,
        "users",
        account.id,
      ),
      patch,
    ).catch((error) => {
      console.warn(
        "Could not self-heal account identity:",
        error,
      );
    });
  }

  /* -------------------------------------------------
   * BUILD SESSION
   * ------------------------------------------------- */

  const restored:
    AccountSession = {
    accountId:
      account.id,

    role:
      account.role,

    name:
      account.name,

    email:
      account.email,

    phone:
      account.phone,

    shopId:
      account.shopId,

    registrationStatus:
      account.registrationStatus,

    accountStatus:
      account.accountStatus,
  };

  setSession(restored);

  writeCachedSession(
    restored,
  );
} catch (error) {
  console.error(
    "Failed to restore authentication session:",
    error,
  );

  const cached =
    readCachedSession();

  if (
    user &&
    cached?.accountId ===
      user.uid
  ) {
    setSession(cached);
  }
} finally {
  /*
   * The portal marker only has to survive until the user Firebase just
   * reported has been handled, whether that provisioned a new account or
   * matched an existing one.
   */
  clearGoogleSignInPortal();

  if (active) {
    setReady(true);
  }
}


};

/* =====================================================

AUTH LISTENER

Firebase reports a sign-in from the Google popup exactly like it
reports a restored session, so this is the only place a new user is
picked up.

=================================================== */

const unsubscribe =
onAuthStateChanged(
auth,
(user: User | null) => {
if (!active) {
return;
}

/*
       * Firebase's first emission is the resolution of the initial auth state,
       * not a logout: it is how the SDK reports "initialization finished, and
       * nobody is signed in".
       *
       * It still must not be treated as a logout — `restore(null)` is the path
       * that clears a session, and firing that before a user was ever seen would
       * sign out a visitor who never signed in. But initialization *is* over,
       * so `ready` has to flip here. Leaving it false meant a signed-out visitor
       * never got a resolved auth state at all, and every gate that waits on
       * `ready` — the order access gate in particular — waited forever instead
       * of showing what it had to show.
       */
      if (!user) {
        if (!sawUserRef.current) {
          setReady(true);

          return;
        }

        void restore(null);

        return;
      }

      /*
       * A real user is not resolved yet: `restore` still has to load the account
       * doc, and it flips `ready` in its `finally` once `session` is set. Setting
       * it here would flash the signed-in branch before the session lands.
       */
      void restore(user);
  },
);

return () => {
active = false;
unsubscribe();
};
  },
  [],
);

  /* =======================================================
   * SET SESSION
   * ======================================================= */

  const signIn =
    useCallback(
      (
        next: AccountSession,
      ) => {
        setSession(next);

        writeCachedSession(
          next,
        );
      },
      [],
    );


  /* =======================================================
   * SIGN OUT
   * ======================================================= */

  const signOut =
    useCallback(
      async () => {
        await firebaseSignOut(
          auth,
        );

        writeCachedSession(
          null,
        );

        setSession(null);
      },
      [],
    );


  /* =======================================================
   * GET ACCOUNT
   * ======================================================= */

  const getAccount =
    useCallback(
      async (
        id: string,
      ) => {
        return getUserById(id);
      },
      [],
    );


  /* =======================================================
   * GET ALL ACCOUNTS
   * ======================================================= */

  const getAllAccounts =
    useCallback(
      async () => {
        try {
          const snap =
            await getDocs(
              collection(
                db,
                "users",
              ),
            );

          return snap.docs.map(
            (docSnap) =>
              userFromFirestore(
                docSnap.id,
                docSnap.data(),
              ),
          );
        } catch (error) {
          console.error(
            "Error fetching all accounts:",
            error,
          );

          return [];
        }
      },
      [],
    );


  /* =======================================================
   * GET ACCOUNT BY EMAIL
   * ======================================================= */

  const getAccountByEmail =
    useCallback(
      async (
        email: string,
        role?: AccountRole,
      ): Promise<
        UserAccount | undefined
      > => {
        return findUserByEmail(
          email,
          role,
        );
      },
      [],
    );


  /* =======================================================
   * CREATE ACCOUNT FOR AUTH USER
   * ======================================================= */

  const createAccountForAuthUser =
    useCallback(
      async (
        uid: string,
        input: {
          email: string;
          name: string;
          role: AccountRole;
          phone?: string;
        },
      ): Promise<
        UserAccount | string
      > => {
        const account =
          await writeAccountDoc(
            uid,
            input,
          );

        if (
          typeof account ===
          "string"
        ) {
          return account;
        }


        const next:
          AccountSession = {
          accountId: uid,

          role: input.role,

          name: account.name,

          email: account.email,

          phone: account.phone,

          registrationStatus:
            account.registrationStatus,

          accountStatus:
            account.accountStatus,

          shopId:
            account.shopId,
        };


        setSession(next);

        writeCachedSession(
          next,
        );


        return account;
      },
      [],
    );


  /* =======================================================
   * CREATE EMAIL/PASSWORD ACCOUNT
   * ======================================================= */

  const createAccount =
    useCallback(
      async (
        email: string,
        password: string,
        role: AccountRole,
        name: string,
        phone = "",
      ): Promise<
        UserAccount | string
      > => {
        try {
          const credential =
            await createUserWithEmailAndPassword(
              auth,
              email
                .trim()
                .toLowerCase(),
              password,
            );


          return await createAccountForAuthUser(
            credential.user.uid,
            {
              email,

              name,

              phone,

              role,
            },
          );
        } catch (
          error: unknown
        ) {
          console.error(
            "Create account error:",
            error,
          );


          if (
            typeof error ===
              "object" &&
            error !== null &&
            "code" in error
          ) {
            const code =
              String(
                (
                  error as {
                    code?: unknown;
                  }
                ).code,
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
      [
        createAccountForAuthUser,
      ],
    );


  /* =======================================================
   * UPDATE ACCOUNT
   * ======================================================= */

  const updateAccount =
    useCallback(
      async (
        id: string,
        patch: Partial<
          Omit<UserAccount, "id">
        >,
      ) => {
        const userRef =
          doc(
            db,
            "users",
            id,
          );


        await updateDoc(
          userRef,
          {
            ...patch,

            updatedAt:
              serverTimestamp(),
          },
        );


        if (
          session?.accountId !==
          id
        ) {
          return;
        }


        setSession(
          (current) => {
            if (!current) {
              return current;
            }


            const next:
              AccountSession = {
              ...current,


              ...(patch.name !==
              undefined
                ? {
                    name:
                      patch.name,
                  }
                : {}),


              ...(patch.email !==
              undefined
                ? {
                    email:
                      patch.email,
                  }
                : {}),


              ...(patch.phone !==
              undefined
                ? {
                    phone:
                      patch.phone,
                  }
                : {}),


              ...(patch.shopId !==
              undefined
                ? {
                    shopId:
                      patch.shopId,
                  }
                : {}),


              ...(patch.role !==
              undefined
                ? {
                    role:
                      patch.role,
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


            writeCachedSession(
              next,
            );


            return next;
          },
        );
      },
      [
        session?.accountId,
      ],
    );


  /* =======================================================
   * CONTEXT VALUE
   * ======================================================= */

  const value =
    useMemo<AuthValue>(
      () => ({
        ready,

        session,

        signIn,

        signOut,

        getAccount,

        getAllAccounts,

        getAccountByEmail,

        createAccount,

        createAccountForAuthUser,

        updateAccount,
      }),
      [
        ready,

        session,

        signIn,

        signOut,

        getAccount,

        getAllAccounts,

        getAccountByEmail,

        createAccount,

        createAccountForAuthUser,

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


/* =========================================================
 * CUSTOMER ROUTE GUARD
 * ======================================================= */

export const CUSTOMER_LOGIN_PATH = "/auth/customer/login";

export function useRequireCustomer(): boolean {
  const { session, ready } = useAuth();
  const navigate = useNavigate();

  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  useEffect(() => {
    if (!ready) {
      return;
    }

    // Logged-in customer can continue.
    if (session?.role === "customer") {
      return;
    }

    // Already on login page.
    if (pathname === CUSTOMER_LOGIN_PATH) {
      return;
    }

    // Protect order routes.
    if (
      pathname === "/order" ||
      pathname.startsWith("/order/") ||
      pathname === "/orders" ||
      pathname.startsWith("/orders/")
    ) {
      navigate({
        to: `${CUSTOMER_LOGIN_PATH}?next=${encodeURIComponent(
          pathname,
        )}`,
        replace: true,
      });
    }
  }, [
    ready,
    session?.role,
    pathname,
    navigate,
  ]);

  return (
    ready &&
    session?.role === "customer"
  );
}
