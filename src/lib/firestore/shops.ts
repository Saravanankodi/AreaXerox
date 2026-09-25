import {
    addDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    onSnapshot,
    query,
    serverTimestamp,
    where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Shop, AccountStatus } from "@/types";

const SHOPS_COLLECTION = "shops";

/**
 * Creates a new shop document (used when a shopkeeper submits their application).
 * Honors a caller-supplied deterministic id (e.g. `shop-${accountId}`) so the
 * same shopkeeper never creates duplicate shops; falls back to addDoc otherwise.
 * Returns the document ID.
 */
export async function createShop(shop: Omit<Shop, "id"> & { id?: string }): Promise<string> {
    const data = {
        ...shop,
        accountStatus: shop.accountStatus ?? ("pending" as AccountStatus),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };

    if (shop.id) {
        await setDoc(doc(db, SHOPS_COLLECTION, shop.id), data);
        return shop.id;
    }

    const ref = await addDoc(collection(db, SHOPS_COLLECTION), data);
    return ref.id;
}

/**
 * Gets a shop/application by the owner's Firebase UID.
 * Matches against both `ownerAccountId` (current convention) and `ownerId` (legacy).
 */
export async function getShopByOwner(ownerId: string): Promise<Shop | undefined> {
    const q = query(collection(db, SHOPS_COLLECTION), where("ownerAccountId", "==", ownerId));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
        const d = snapshot.docs[0];
        return { id: d.id, ...d.data() } as Shop;
    }

    const legacyQ = query(collection(db, SHOPS_COLLECTION), where("ownerId", "==", ownerId));
    const legacySnapshot = await getDocs(legacyQ);
    if (legacySnapshot.empty) return undefined;
    const d = legacySnapshot.docs[0];
    return { id: d.id, ...d.data() } as Shop;
}

/**
 * Gets a single shop by its document ID.
 */
export async function getShopById(shopId: string): Promise<Shop | undefined> {
    const snapshot = await getDoc(doc(db, SHOPS_COLLECTION, shopId));
    if (!snapshot.exists()) return undefined;
    return { id: snapshot.id, ...snapshot.data() } as Shop;
}

/**
 * Gets all shops (all statuses).
 */
export async function getAllShops(): Promise<Shop[]> {
    const snapshot = await getDocs(collection(db, SHOPS_COLLECTION));
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Shop));
}

/**
 * Gets shops filtered by accountStatus.
 */
export async function getShopsByStatus(status: AccountStatus): Promise<Shop[]> {
    const q = query(collection(db, SHOPS_COLLECTION), where("accountStatus", "==", status));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Shop));
}

/**
 * Updates a shop document (can be a partial patch).
 * Uses an upsert (setDoc + merge) so applying a patch to a shop that is not
 * yet in Firestore creates the document instead of throwing "No document to update".
 */
export async function updateShopInFirestore(
    shopId: string,
    patch: Partial<Omit<Shop, "id">>
): Promise<void> {
    await setDoc(doc(db, SHOPS_COLLECTION, shopId), {
        ...patch,
        updatedAt: serverTimestamp(),
    }, { merge: true });
}

/**
 * Real-time listener — streams only active shops to the store.
 * Falls back to seed data if the collection is empty.
 */
export function listenToShops(
    onUpdate: (shops: Shop[]) => void,
    onError?: (error: Error) => void,
    ): () => void {
    const q = query(
        collection(db, SHOPS_COLLECTION),
        where("accountStatus", "==", "active")
    );

    return onSnapshot(
        q,
        (snapshot) => {
        const shops = snapshot.docs.map(
            (d) => ({ id: d.id, ...d.data() } as Shop)
        );

        onUpdate(shops);
        },
        (error) => {
        console.error("Error in shops listener:", error);
        onError?.(error);
        }
    );
}

/**
 * Real-time listener — streams ALL shops (all statuses) for admin use.
 */
export function listenToAllShops(onUpdate: (shops: Shop[]) => void): () => void {
    return onSnapshot(
        collection(db, SHOPS_COLLECTION),
        (snapshot) => {
            onUpdate(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Shop)));
        },
        (error) => {
            console.error("Error in all-shops listener:", error);
        }
    );
}

