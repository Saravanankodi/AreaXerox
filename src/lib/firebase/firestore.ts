import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  onSnapshot as firebaseOnSnapshot,
  serverTimestamp,
  type DocumentData,
  type QueryConstraint,
  type Unsubscribe,
} from "firebase/firestore";
import { firebaseApp } from "./config";

export const db = getFirestore(firebaseApp);
export { serverTimestamp };

// ──────────────────────────────────────────────────────────
// Single-document helpers
// ──────────────────────────────────────────────────────────

export async function fsGet<T>(path: string): Promise<T | null> {
  const snap = await getDoc(doc(db, path));
  return snap.exists() ? (snap.data() as T) : null;
}

export async function fsSet<T extends DocumentData>(path: string, data: T): Promise<void> {
  await setDoc(doc(db, path), { ...data, updatedAt: serverTimestamp() }, { merge: true });
}

export async function fsUpdate(path: string, patch: DocumentData): Promise<void> {
  await updateDoc(doc(db, path), { ...patch, updatedAt: serverTimestamp() });
}

export async function fsDelete(path: string): Promise<void> {
  await deleteDoc(doc(db, path));
}

// ──────────────────────────────────────────────────────────
// Collection helpers
// ──────────────────────────────────────────────────────────

export async function fsAdd<T extends DocumentData>(collectionPath: string, data: T) {
  return addDoc(collection(db, collectionPath), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function fsGetAll<T>(
  collectionPath: string,
  ...constraints: QueryConstraint[]
): Promise<T[]> {
  const q = query(collection(db, collectionPath), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T);
}

// ──────────────────────────────────────────────────────────
// Real-time listener helper
// ──────────────────────────────────────────────────────────

export function fsListen<T>(
  collectionPath: string,
  callback: (items: T[]) => void,
  ...constraints: QueryConstraint[]
): Unsubscribe {
  const q = query(collection(db, collectionPath), ...constraints);
  return firebaseOnSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T));
  });
}

export function fsListenDoc<T>(
  path: string,
  callback: (item: T | null) => void,
): Unsubscribe {
  return firebaseOnSnapshot(doc(db, path), (snap) => {
    callback(snap.exists() ? ({ id: snap.id, ...snap.data() } as T) : null);
  });
}

// Re-export query builders so callers don't have to import from firebase/firestore directly
export { where, query, collection, doc };
