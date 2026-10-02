import {
  collection,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  type DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Address, CustomerProfile, SupportTicket } from "@/types";

/**
 * Address documents are typed as `Address`, but Firestore data is unvalidated:
 * documents written by older versions of the app can be missing `label`, `area`
 * or `street`. Coerce the address fields so consumers (profile form inputs,
 * order pickers, order details) never receive `undefined` for a required
 * field, which would otherwise make React inputs flip from uncontrolled to
 * controlled mid-edit.
 */
function normalizeAddress(id: string, data: DocumentData): Address {
  const str = (value: unknown) => (typeof value === "string" ? value : "");

  return {
    id,
    label: str(data.label),
    name: str(data.name),
    phone: str(data.phone),
    house: str(data.house),
    street: str(data.street),
    area: str(data.area),
    city: str(data.city),
    pincode: str(data.pincode),
    // Left as-is: serverTimestamp() writes Timestamp objects, not strings.
    createdAt: data.createdAt as string | undefined,
    updatedAt: data.updatedAt as string | undefined,
  };
}

export async function getUserProfile(
  uid: string,
): Promise<CustomerProfile | null> {
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    return null;
  }

  const data = snap.data();

  return {
    name: data.name || "",
    email: data.email || "",
    phone: data.phone || "",
    alternatePhone:
      data.alternatePhone ||
      data.alternatephone ||
      "",
  };
}

export async function updateUserProfile(
  uid: string,
  profile: CustomerProfile,
): Promise<void> {
  // Never persist empty identity fields over a real profile.
  // An empty save must not wipe existing name/phone/email.
  const clean: Record<string, string> = {};

  for (const [key, value] of Object.entries(profile)) {
    if (
      typeof value === "string" &&
      value.trim() !== ""
    ) {
      clean[key] = value.trim();
    }
  }

  const userRef = doc(db, "users", uid);

  await setDoc(userRef, clean, {
    merge: true,
  });
}


export async function getUserAddresses(uid: string): Promise<Address[]> {
  const colRef = collection(db, `users/${uid}/addresses`);
  const snap = await getDocs(colRef);
  return snap.docs.map((d) => normalizeAddress(d.id, d.data()));
}

export async function saveUserAddress(uid: string, address: Address): Promise<void> {
  const docRef = doc(db, `users/${uid}/addresses`, address.id);
  await setDoc(docRef, address, { merge: true });
}

export async function deleteUserAddress(uid: string, addressId: string): Promise<void> {
  const docRef = doc(db, `users/${uid}/addresses`, addressId);
  await deleteDoc(docRef);
}

export function listenUserAddresses(uid: string, callback: (addresses: Address[]) => void) {
  const colRef = collection(db, `users/${uid}/addresses`);
  return onSnapshot(colRef, (snap) => {
    callback(snap.docs.map((d) => normalizeAddress(d.id, d.data())));
  });
}

export async function getUserTickets(uid: string): Promise<SupportTicket[]> {
  const colRef = collection(db, `users/${uid}/tickets`);
  const snap = await getDocs(colRef);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as SupportTicket);
}

export async function addUserTicket(uid: string, ticket: SupportTicket): Promise<void> {
  const docRef = doc(db, `users/${uid}/tickets`, ticket.id);
  await setDoc(docRef, ticket, { merge: true });
  // Also save in global tickets collection for admin viewing
  const globalRef = doc(db, "supportTickets", ticket.id);
  await setDoc(globalRef, { ...ticket, customerId: uid }, { merge: true });
}

export function listenUserTickets(uid: string, callback: (tickets: SupportTicket[]) => void) {
  const colRef = collection(db, `users/${uid}/tickets`);
  return onSnapshot(colRef, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as SupportTicket));
  });
}
