import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { ShopkeeperProfile } from "@/types";

const USERS_COLLECTION = "users";
const SHOPKEEPER_PROFILE_PATH = "profile/shopkeeper";

/**
 * Saves a shopkeeper's profile to Firestore.
 *
 * Firestore:
 * users/{uid}/profile/shopkeeper
 */
export async function saveShopkeeperProfileToFirestore(
    accountId: string,
    profile: ShopkeeperProfile
): Promise<void> {
    await setDoc(doc(db, USERS_COLLECTION, accountId, SHOPKEEPER_PROFILE_PATH), profile);
}

/**
 * Fetches a shopkeeper's profile from Firestore.
 *
 * Firestore:
 * users/{uid}/profile/shopkeeper
 */
export async function getShopkeeperProfileFromFirestore(
    accountId: string
): Promise<ShopkeeperProfile | undefined> {
    const snapshot = await getDoc(doc(db, USERS_COLLECTION, accountId, SHOPKEEPER_PROFILE_PATH));
    if (!snapshot.exists()) return undefined;
    return snapshot.data() as ShopkeeperProfile;
}