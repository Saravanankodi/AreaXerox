import type { Shop } from "@/types";

export function isShopProfileComplete(shop: Shop): boolean {
  if (!shop.name.trim()) return false;
  if (!shop.ownerName.trim()) return false;
  if (!shop.ownerPhone?.trim()) return false;
  if (!shop.phone.trim()) return false;
  if (!shop.openingTime || !shop.closingTime) return false;

  // Structured address — at minimum addressLine1 and city must be filled.
  if (!shop.addressLine1?.trim()) return false;
  if (!shop.city?.trim()) return false;

  // Payout method — exactly one must be selected with full details.
  if (!shop.shopPaymentMethod) return false;
  if (shop.shopPaymentMethod === "upi" && !shop.upiId?.trim()) return false;
  if (
    shop.shopPaymentMethod === "bank_transfer" &&
    (!shop.bankName?.trim() ||
      !shop.bankAccountNumber?.trim() ||
      !shop.bankIfsc?.trim() ||
      !shop.bankBranch?.trim())
  )
    return false;

  // Both images compulsory.
  if (!shop.frontImage || !shop.interiorImage) return false;

  // Fulfillment — at least one option must be selected.
  if (!shop.pickup && !shop.delivery.enabled) return false;

  // Payment options — at least one must be selected.
  const p = shop.payments;
  if (!p.full && !p.advance && !p.cashPickup && !p.cashDelivery) return false;

  return true;
}

/** Validate the fulfillment section. Returns null when valid, or an error message. */
export function validateFulfillment(shop: Shop): string | null {
  if (!shop.pickup && !shop.delivery.enabled) {
    return "Enable at least one fulfillment option (Pickup or Delivery).";
  }
  return null;
}

/** Validate the payment options section. Returns null when valid, or an error message. */
export function validatePaymentOptions(shop: Shop): string | null {
  const p = shop.payments;
  if (!p.full && !p.advance && !p.cashPickup && !p.cashDelivery) {
    return "Enable at least one payment option.";
  }
  return null;
}

export function isPrintingServicesComplete(shop: Shop): boolean {
  const hasPaper = shop.paperTypes.some((p) => p.enabled);
  return hasPaper;
}

export function canRequestApproval(shop: Shop): boolean {
  return isShopProfileComplete(shop) && isPrintingServicesComplete(shop);
}

export function isShopApproved(shop: Shop): boolean {
  return !shop.accountStatus || shop.accountStatus === "active";
}

export function isShopVisibleToCustomers(shop: Shop): boolean {
  if (!isShopApproved(shop)) return false;
  if (!isShopProfileComplete(shop)) return false;
  if (!isPrintingServicesComplete(shop)) return false;
  return true;
}
