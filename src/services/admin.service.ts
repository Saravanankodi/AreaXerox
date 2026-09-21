import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase/firestore";
import type { Account, AccountStatus, ShopApplication } from "@/types";
import { buildShopFromApplication, saveShop } from "./shop.service";
import { getShopByOwner } from "@/lib/firestore/shops";

export async function getAllApplications(): Promise<ShopApplication[]> {
  const colRef = collection(db, "shopApplications");
  const snap = await getDocs(colRef);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ShopApplication);
}

export function listenApplications(callback: (apps: ShopApplication[]) => void) {
  const colRef = collection(db, "shopApplications");
  return onSnapshot(colRef, (snap) => {
    const apps = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ShopApplication);
    apps.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    callback(apps);
  });
}

export async function approveApplication(applicationId: string): Promise<void> {
  const appRef = doc(db, "shopApplications", applicationId);
  const appSnap = await getDoc(appRef);
  if (!appSnap.exists()) {
    throw new Error("Application not found");
  }

  const app = { id: appSnap.id, ...appSnap.data() } as ShopApplication;

  // Update application status
  await updateDoc(appRef, {
    accountStatus: "active",
    updatedAt: new Date().toISOString(),
  });

  // Update shopkeeper doc
  if (app.accountId) {
    const skRef = doc(db, "shopkeepers", app.accountId);
    await updateDoc(skRef, {
      accountStatus: "active",
      registrationStatus: "complete",
      updatedAt: new Date().toISOString(),
    });

    // Keep the account document (users/{accountId}) in sync so the login
    // gate and session restore reflect the approval immediately.
    await updateDoc(doc(db, "users", app.accountId), {
      accountStatus: "active",
      registrationStatus: "complete",
      updatedAt: new Date().toISOString(),
    });

    // Create live Shop record in `shops` collection — reuse an existing shop
    // doc for this owner (created during onboarding) instead of spawning a
    // second, orphaned shop record.
    const shop = buildShopFromApplication(app);
    shop.ownerAccountId = app.accountId;
    shop.ownerId = app.accountId;
    shop.accountStatus = "active" as AccountStatus;
    const existing = await getShopByOwner(app.accountId);
    shop.id = existing?.id ?? app.accountId;
    await saveShop(shop);
  }
}

export async function rejectApplication(applicationId: string, reason: string): Promise<void> {
  const appRef = doc(db, "shopApplications", applicationId);
  const appSnap = await getDoc(appRef);
  if (!appSnap.exists()) {
    throw new Error("Application not found");
  }

  const app = { id: appSnap.id, ...appSnap.data() } as ShopApplication;

  await updateDoc(appRef, {
    accountStatus: "rejected",
    rejectionReason: reason,
    updatedAt: new Date().toISOString(),
  });

  if (app.accountId) {
    const skRef = doc(db, "shopkeepers", app.accountId);
    await updateDoc(skRef, {
      accountStatus: "rejected",
      rejectionReason: reason,
      updatedAt: new Date().toISOString(),
    });

    await updateDoc(doc(db, "users", app.accountId), {
      accountStatus: "rejected",
      rejectionReason: reason,
      updatedAt: new Date().toISOString(),
    });
  }
}

export async function fetchAllAccounts(): Promise<Account[]> {
  const accounts: Account[] = [];

  try {
    const adminSnap = await getDocs(collection(db, "admins"));
    adminSnap.forEach((d) => {
      const data = d.data();
      accounts.push({
        id: d.id,
        email: data.email || "",
        role: "admin",
        registrationStatus: data.registrationStatus || "complete",
        accountStatus: data.accountStatus || "active",
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString(),
      });
    });

    const skSnap = await getDocs(collection(db, "shopkeepers"));
    skSnap.forEach((d) => {
      const data = d.data();
      accounts.push({
        id: d.id,
        email: data.email || "",
        role: "shopkeeper",
        registrationStatus: data.registrationStatus || "incomplete",
        accountStatus: data.accountStatus || "pending",
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString(),
      });
    });

    const userSnap = await getDocs(collection(db, "users"));
    userSnap.forEach((d) => {
      const data = d.data();
      accounts.push({
        id: d.id,
        email: data.email || "",
        role: "customer",
        registrationStatus: data.registrationStatus || "complete",
        accountStatus: data.accountStatus || "active",
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString(),
      });
    });
  } catch (err) {
    console.error("Error fetching all accounts:", err);
  }

  accounts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return accounts;
}
