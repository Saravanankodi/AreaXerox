import {
    addDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    onSnapshot,
    query,
    serverTimestamp,
    where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { seedShops } from "@/lib/seed";
import type { Shop, AccountStatus } from "@/types";

const SHOPS_COLLECTION = "shops";

/**
 * Ensures the shops collection is seeded with default active shops
 * if it has no active shops yet.
 */
export async function seedShopsIfEmpty(): Promise<Shop[]> {
    try {
        const snapshot = await getDocs(
            query(collection(db, SHOPS_COLLECTION), where("accountStatus", "==", "active"))
        );
        if (!snapshot.empty) {
            return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Shop));
        }
        console.log("Seeding initial shops to Firestore...");
        const seeded: Shop[] = [];
        for (const shop of seedShops) {
            const shopRef = doc(db, SHOPS_COLLECTION, shop.id);
            const shopData = { ...shop, accountStatus: "active" as AccountStatus };
            await setDoc(shopRef, shopData);
            seeded.push(shopData);
        }
        return seeded;
    } catch (error) {
        console.error("Error seeding shops:", error);
        return seedShops;
    }
}

/**
 * Creates a new shop document (used when a shopkeeper submits their application).
 * Returns the new document ID.
 */
export async function createShop(shop: Omit<Shop, "id">): Promise<string> {
    const ref = await addDoc(collection(db, SHOPS_COLLECTION), {
        ...shop,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    return ref.id;
}

/**
 * Gets a shop/application by the owner's Firebase UID.
 */
export async function getShopByOwner(ownerId: string): Promise<Shop | undefined> {
    const q = query(collection(db, SHOPS_COLLECTION), where("ownerId", "==", ownerId));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return undefined;
    const d = snapshot.docs[0];
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
 */
export async function updateShopInFirestore(
    shopId: string,
    patch: Partial<Omit<Shop, "id">>
): Promise<void> {
    await updateDoc(doc(db, SHOPS_COLLECTION, shopId), {
        ...patch,
        updatedAt: serverTimestamp(),
    });
}

/**
 * Real-time listener — streams only active shops to the store.
 * Falls back to seed data if the collection is empty.
 */
export function listenToShops(onUpdate: (shops: Shop[]) => void): () => void {
    const q = query(collection(db, SHOPS_COLLECTION), where("accountStatus", "==", "active"));
    return onSnapshot(
        q,
        async (snapshot) => {
            if (snapshot.empty) {
                const seeded = await seedShopsIfEmpty();
                onUpdate(seeded);
            } else {
                onUpdate(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Shop)));
            }
        },
        (error) => {
            console.error("Error in shops listener:", error);
            onUpdate(seedShops);
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

