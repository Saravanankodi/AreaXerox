import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { db, fsGet, fsSet } from "@/lib/firebase/firestore";
import type { ShopApplication, ShopkeeperProfile } from "@/types";

export async function getShopkeeperApplication(accountId: string): Promise<ShopApplication | null> {
  // Query by accountId from shopApplications
  const q = query(collection(db, "shopApplications"), where("accountId", "==", accountId));
  const snap = await getDocs(q);
  if (!snap.empty) {
    const d = snap.docs[0]!;
    return { id: d.id, ...d.data() } as ShopApplication;
  }
  // Check shopkeepers collection directly
  const skDoc = await getDoc(doc(db, "shopkeepers", accountId));
  if (skDoc.exists()) {
    const data = skDoc.data();
    if (data.application) {
      return data.application as ShopApplication;
    }
  }
  return null;
}

export async function submitShopkeeperApplication(application: ShopApplication): Promise<void> {
  const appId = application.id || `app-${application.accountId}`;
  const appData = {
    ...application,
    id: appId,
    updatedAt: new Date().toISOString(),
  };

  // Save in shopApplications collection
  await setDoc(doc(db, "shopApplications", appId), appData, { merge: true });

  // Update shopkeeper account record
  if (application.accountId) {
    await setDoc(
      doc(db, "shopkeepers", application.accountId),
      {
        accountId: application.accountId,
        registrationStatus: "complete",
        accountStatus: "pending",
        shopName: application.shopName,
        shopAddress: application.shopAddress,
        area: application.area,
        city: application.city,
        state: application.state,
        pincode: application.pincode,
        whatsappNumber: application.whatsappNumber,
        shopDescription: application.shopDescription,
        shopImages: application.shopImages,
        services: application.services,
        shopkeeperProfile: application.shopkeeperProfile,
        applicationId: appId,
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );
  }
}

export async function updateShopkeeperApplication(
  id: string,
  patch: Partial<ShopApplication>,
): Promise<void> {
  const appRef = doc(db, "shopApplications", id);
  await updateDoc(appRef, {
    ...patch,
    updatedAt: new Date().toISOString(),
  });

  // If status changed or other details, sync back to shopkeeper
  const snap = await getDoc(appRef);
  if (snap.exists()) {
    const app = snap.data() as ShopApplication;
    if (app.accountId) {
      const skPatch: any = { updatedAt: new Date().toISOString() };
      if (patch.accountStatus) skPatch.accountStatus = patch.accountStatus;
      if (patch.rejectionReason) skPatch.rejectionReason = patch.rejectionReason;
      await updateDoc(doc(db, "shopkeepers", app.accountId), skPatch);
    }
  }
}

export async function getShopkeeperProfile(accountId: string): Promise<ShopkeeperProfile | null> {
  const snap = await getDoc(doc(db, "shopkeepers", accountId));
  if (snap.exists()) {
    const data = snap.data();
    return (data.shopkeeperProfile as ShopkeeperProfile) || null;
  }
  return null;
}

export async function saveShopkeeperProfile(
  accountId: string,
  profile: ShopkeeperProfile,
): Promise<void> {
  await setDoc(
    doc(db, "shopkeepers", accountId),
    {
      shopkeeperProfile: profile,
      updatedAt: new Date().toISOString(),
    },
    { merge: true },
  );
}
