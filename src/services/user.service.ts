import {
  collection,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
} from "firebase/firestore";
import { db, fsSet, fsGet, fsUpdate, fsDelete } from "@/lib/firebase/firestore";
import type { Address, CustomerProfile, SupportTicket } from "@/types";

export async function getUserProfile(uid: string): Promise<CustomerProfile | null> {
  const data = await fsGet<any>(`users/${uid}`);
  if (!data) return null;
  return {
    name: data.name || "",
    email: data.email || "",
    phone: data.phone || "",
    alternatePhone: data.alternatePhone || data.alternatephone || "",
  };
}

export async function updateUserProfile(uid: string, profile: CustomerProfile): Promise<void> {
  await fsSet(`users/${uid}`, {
    ...profile,
    updatedAt: new Date().toISOString(),
  });
}

export async function getUserAddresses(uid: string): Promise<Address[]> {
  const colRef = collection(db, `users/${uid}/addresses`);
  const snap = await getDocs(colRef);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Address);
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
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Address));
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
