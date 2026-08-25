import type {
  DocumentFile,
  Fulfillment,
  PaymentMethod,
  PriceBreakdown,
  PrintConfig,
  Shop,
} from "@/types";

export function inr(amount: number) {
  return `₹${Math.round(amount * 100) / 100}`;
}

export function countRangePages(range: string, total: number) {
  const parts = range.split(",").map((p) => p.trim()).filter(Boolean);
  let count = 0;
  for (const part of parts) {
    const nums = part.split("-").map((n) => parseInt(n, 10));
    const a = nums[0];
    const b = nums[1];
    if (a === undefined || Number.isNaN(a)) continue;
    if (b !== undefined && !Number.isNaN(b)) count += Math.max(0, Math.min(b, total) - a + 1);
    else count += a <= total ? 1 : 0;
  }
  return count;
}

export function calculatePrice(
  shop: Shop | null,
  docs: DocumentFile[],
  config: PrintConfig,
  fulfillment: Fulfillment,
): PriceBreakdown {
  const empty: PriceBreakdown = {
    printing: 0,
    binding: 0,
    services: 0,
    delivery: 0,
    discount: 0,
    total: 0,
    billablePages: 0,
  };
  if (!shop || docs.length === 0) return empty;

  const totalPages = docs.reduce((s, d) => s + d.pages, 0);
  const selectedPages =
    config.pageRangeMode === "custom" && config.pageRange
      ? Math.max(1, countRangePages(config.pageRange, totalPages))
      : totalPages;

  const paper = shop.paperTypes.find((p) => p.id === config.paperTypeId);
  const perPage =
    paper ? (config.printType === "color" ? paper.colorPrice : paper.bwPrice) : 0;

  const copies = Math.max(1, config.copies);
  const billablePages = selectedPages * copies;
  // double side printing gives a small saving on sheets
  const sheetFactor = config.side === "double" ? 0.9 : 1;
  const printing = billablePages * perPage * sheetFactor;

  const bind = shop.binding.find((b) => b.id === config.bindingId && b.enabled);
  const binding = bind ? bind.price * copies : 0;

  let services = 0;
  for (const id of config.additionalIds) {
    const svc = shop.additional.find((s) => s.id === id && s.enabled);
    if (!svc) continue;
    services += svc.perPage ? svc.price * billablePages : svc.price * copies;
  }

  const subtotal = printing + binding + services;
  let delivery = 0;
  if (fulfillment === "delivery" && shop.delivery.enabled) {
    delivery = shop.delivery.fee;
    if (shop.delivery.freeAbove !== null && subtotal >= shop.delivery.freeAbove) delivery = 0;
  }

  const discount = subtotal >= 300 ? Math.round(subtotal * 0.05) : 0;
  const total = Math.max(0, Math.round(subtotal + delivery - discount));

  return {
    printing: Math.round(printing),
    binding: Math.round(binding),
    services: Math.round(services),
    delivery,
    discount,
    total,
    billablePages,
  };
}

export function advanceAmount(shop: Shop | null, total: number) {
  if (!shop) return 0;
  const { advanceType, advanceValue } = shop.payments;
  const raw = advanceType === "fixed" ? advanceValue : (total * advanceValue) / 100;
  return Math.min(total, Math.round(raw));
}

export function paymentSplit(
  shop: Shop | null,
  total: number,
  method: PaymentMethod,
): { paidNow: number; balance: number } {
  if (method === "full") return { paidNow: total, balance: 0 };
  if (method === "advance") {
    const adv = advanceAmount(shop, total);
    return { paidNow: adv, balance: total - adv };
  }
  return { paidNow: 0, balance: total };
}
