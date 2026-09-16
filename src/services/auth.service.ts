import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { auth } from "@/lib/firebase/auth";
import { fsGet, fsSet, fsUpdate, db } from "@/lib/firebase/firestore";
import { doc, getDoc } from "firebase/firestore";
import type { Account, AccountRole, AccountStatus, RegistrationStatus } from "@/types";

export interface UserAccountData {
  id: string;
  email: string;
  role: AccountRole;
  registrationStatus: RegistrationStatus;
  accountStatus: AccountStatus;
  name?: string;
  phone?: string;
  shopName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export async function signUpUser(email: string, password: string): Promise<User> {
  const cred = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
  return cred.user;
}

export async function signInUser(email: string, password: string): Promise<User> {
  const cred = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
  return cred.user;
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

export function subscribeToAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Fetch account info from Firestore collections in priority:
 * 1. admins/{uid}
 * 2. shopkeepers/{uid}
 * 3. users/{uid}
 */
export async function getAccountByUid(uid: string): Promise<UserAccountData | null> {
  try {
    // Check admin
    const adminSnap = await getDoc(doc(db, "admins", uid));
    if (adminSnap.exists()) {
      const d = adminSnap.data();
      return {
        id: uid,
        email: d.email || "",
        role: "admin",
        registrationStatus: d.registrationStatus || "complete",
        accountStatus: d.accountStatus || "active",
        name: d.name || "Admin",
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      };
    }

    // Check shopkeeper
    const shopkeeperSnap = await getDoc(doc(db, "shopkeepers", uid));
    if (shopkeeperSnap.exists()) {
      const d = shopkeeperSnap.data();
      return {
        id: uid,
        email: d.email || "",
        role: "shopkeeper",
        registrationStatus: d.registrationStatus || "incomplete",
        accountStatus: d.accountStatus || "pending",
        name: d.shopkeeperProfile?.ownerName || d.shopName || d.name || "Shopkeeper",
        phone: d.shopkeeperProfile?.phone || d.phone,
        shopName: d.shopName,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      };
    }

    // Check customer user
    const userSnap = await getDoc(doc(db, "users", uid));
    if (userSnap.exists()) {
      const d = userSnap.data();
      return {
        id: uid,
        email: d.email || "",
        role: "customer",
        registrationStatus: d.registrationStatus || "complete",
        accountStatus: d.accountStatus || "active",
        name: d.name || d.profile?.name || "Customer",
        phone: d.phone || d.profile?.phone,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      };
    }
  } catch (err) {
    console.error("Error loading account by uid:", err);
  }

  return null;
}

/**
 * Creates Firebase Auth user and writes the corresponding Firestore document.
 */
export async function registerNewAccount(
  email: string,
  password: string,
  role: AccountRole,
  name: string,
  phone?: string,
): Promise<{ account: Account; user: User } | string> {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
    const uid = cred.user.uid;
    const now = new Date().toISOString();

    const account: Account = {
      id: uid,
      email: email.trim().toLowerCase(),
      role,
      registrationStatus: role === "admin" ? "complete" : "incomplete",
      accountStatus: role === "shopkeeper" ? "pending" : "active",
      createdAt: now,
      updatedAt: now,
    };

    if (role === "admin") {
      await fsSet(`admins/${uid}`, {
        id: uid,
        email: email.trim().toLowerCase(),
        name,
        role: "admin",
        registrationStatus: "complete",
        accountStatus: "active",
        createdAt: now,
        updatedAt: now,
      });
    } else if (role === "shopkeeper") {
      await fsSet(`shopkeepers/${uid}`, {
        id: uid,
        accountId: uid,
        email: email.trim().toLowerCase(),
        name,
        phone: phone || "",
        role: "shopkeeper",
        registrationStatus: "incomplete",
        accountStatus: "pending",
        shopkeeperProfile: {
          accountId: uid,
          username: email.split("@")[0] || "shopkeeper",
          ownerName: name,
          phone: phone || "",
          alternatePhone: "",
        },
        createdAt: now,
        updatedAt: now,
      });
    } else {
      // Customer
      await fsSet(`users/${uid}`, {
        id: uid,
        email: email.trim().toLowerCase(),
        name,
        phone: phone || "",
        role: "customer",
        registrationStatus: "incomplete",
        accountStatus: "active",
        createdAt: now,
        updatedAt: now,
      });
    }

    return { account, user: cred.user };
  } catch (err: any) {
    console.error("registerNewAccount error:", err);
    if (err.code === "auth/email-already-in-use") {
      return "An account with this email already exists.";
    }
    if (err.code === "auth/invalid-email") {
      return "The email address is invalid.";
    }
    if (err.code === "auth/weak-password") {
      return "The password is too weak. Please use at least 8 characters.";
    }
    if (err.code === "auth/configuration-not-found") {
      return "Email/Password sign-in is not enabled yet in your Firebase Console. Please go to Firebase Console -> Authentication -> Sign-in method and enable Email/Password.";
    }
    return err.message || "Failed to create account. Please try again.";
  }
}
