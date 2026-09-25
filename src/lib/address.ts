import type { Shop } from "@/types";

/**
 * Formats a shop's address. Real shops store structured fields
 * (addressLine1/addressLine2/area/city/state/zip), not the legacy
 * aggregate `address` string, so compose from those with fallbacks.
 */
export function formatShopAddress(
  shop: Pick<
    Shop,
    | "address"
    | "shopAddress"
    | "addressLine1"
    | "addressLine2"
    | "area"
    | "city"
    | "state"
    | "zip"
    | "pincode"
  >,
): string {
  const cityState = [shop.city, shop.state].filter(Boolean).join(", ");
  const zip = shop.zip ?? shop.pincode;
  const parts = [
    shop.addressLine1,
    shop.addressLine2,
    shop.area,
    cityState,
    zip,
  ]
    .map((part) => part?.trim() ?? "")
    .filter(Boolean);
  if (parts.length > 0) return parts.join(", ");
  return shop.address ?? shop.shopAddress ?? "";
}