import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useStore } from "@/lib/store";

/**
 * Resolves the shopkeeper's own shop.
 *
 * Priority: session.shopId → shop whose ownerId matches the session accountId
 * (handles legacy accounts created before shopId binding existed) → activeShop.
 *
 * Also self-heals legacy accounts by persisting shopId to Firestore.
 */
export function useMyShop() {
  const { shops, activeShop } = useStore();
  const { session, updateAccount } = useAuth();

  const byShopId = session?.shopId ? shops.find((s) => s.id === session.shopId) : undefined;
  const byOwner =
    session?.role === "shopkeeper" ? shops.find((s) => s.ownerId === session.accountId) : undefined;
  const resolved = byShopId ?? byOwner ?? activeShop;

  // Self-heal legacy accounts (created before shopId binding existed).
  useEffect(() => {
    if (!session || session.role !== "shopkeeper" || session.shopId) return;
    if (byOwner) {
      updateAccount(session.accountId, { shopId: byOwner.id }).catch(console.error);
    }
  }, [session, byOwner, updateAccount]);

  return resolved;
}