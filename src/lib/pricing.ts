import type { DocumentFile, Fulfillment, PaymentMethod, PriceBreakdown, PrintConfig, Shop } from "@/types";

const money = (amount: number) => Math.round((Number.isFinite(amount) ? amount : 0) * 100) / 100;

export function inr(amount: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: Number.isInteger(amount) ? 0 : 2, maximumFractionDigits: 2 }).format(money(amount));
}

/** Counts unique, valid pages in an order-wide range. Duplicate entries are charged once. */
export function countRangePages(range: string, total: number) {
  const selected = new Set<number>();
  for (const token of range.split(",").map((part) => part.trim()).filter(Boolean)) {
    const match = /^(\d+)(?:\s*-\s*(\d+))?$/.exec(token);
    if (!match) continue;
    const first = Number(match[1]);
    const last = Number(match[2] ?? match[1]);
    if (!Number.isInteger(first) || !Number.isInteger(last) || first < 1 || last < first) continue;
    for (let page = first; page <= Math.min(last, total); page += 1) selected.add(page);
  }
  return selected.size;
}

export function isValidPageRange(range: string, total: number) {
  const tokens = range.split(",").map((part) => part.trim()).filter(Boolean);
  return tokens.length > 0 && tokens.every((token) => {
    const match = /^(\d+)(?:\s*-\s*(\d+))?$/.exec(token);
    if (!match) return false;
    const first = Number(match[1]);
    const last = Number(match[2] ?? match[1]);
    return first >= 1 && last >= first && first <= total;
  }) && countRangePages(range, total) > 0;
}

function selectedPageNumbers(range: string, total: number) {
  const selected = new Set<number>();
  for (const token of range.split(",").map((part) => part.trim()).filter(Boolean)) {
    const match = /^(\d+)(?:\s*-\s*(\d+))?$/.exec(token);
    if (!match) continue;
    const first = Number(match[1]);
    const last = Number(match[2] ?? match[1]);
    if (first < 1 || last < first) continue;
    for (let page = first; page <= Math.min(last, total); page += 1) selected.add(page);
  }
  return selected;
}

/** Per-file subtotal, excluding delivery. These always add up to the order subtotal. */
export function calculateDocumentPrices(shop: Shop | null, docs: DocumentFile[], config: PrintConfig) {
  return docs.map((document) => calculatePrice(shop, [document], document.printConfig ?? config, "pickup"));
}

/** Combines independent file configurations into the payable order amount. */
export function calculateOrderPrice(shop: Shop | null, docs: DocumentFile[], fallbackConfig: PrintConfig, fulfillment: Fulfillment): PriceBreakdown {
  const lines = calculateDocumentPrices(shop, docs, fallbackConfig);
  const subtotal = money(lines.reduce((sum, line) => sum + line.total, 0));
  const delivery = fulfillment === "delivery" && shop?.delivery.enabled
    ? shop.delivery.freeAbove !== null && subtotal >= shop.delivery.freeAbove ? 0 : money(shop.delivery.fee)
    : 0;
  return {
    printing: money(lines.reduce((sum, line) => sum + line.printing, 0)),
    binding: money(lines.reduce((sum, line) => sum + line.binding, 0)),
    services: money(lines.reduce((sum, line) => sum + line.services, 0)),
    delivery,
    discount: 0,
    total: money(subtotal + delivery),
    billablePages: lines.reduce((sum, line) => sum + line.billablePages, 0),
  };
}

export function calculatePrice(shop: Shop | null, docs: DocumentFile[], config: PrintConfig, fulfillment: Fulfillment): PriceBreakdown {
  const empty: PriceBreakdown = { printing: 0, binding: 0, services: 0, delivery: 0, discount: 0, total: 0, billablePages: 0 };
  if (!shop || docs.length === 0) return empty;
  const totalPages = docs.reduce((sum, document) => sum + Math.max(1, Math.floor(document.pages)), 0);
  const selectedPages = config.pageRangeMode === "custom" ? countRangePages(config.pageRange, totalPages) : totalPages;
  if (selectedPages === 0) return empty;
  const selected = config.pageRangeMode === "custom" ? selectedPageNumbers(config.pageRange, totalPages) : null;
  let offset = 0;
  const selectedDocuments = docs.reduce((count, document) => {
    const pages = Math.max(1, Math.floor(document.pages));
    const isIncluded = selected ? [...selected].some((page) => page > offset && page <= offset + pages) : true;
    offset += pages;
    return count + (isIncluded ? 1 : 0);
  }, 0);
  const paper = shop.paperTypes.find((item) => item.id === config.paperTypeId && item.enabled);
  const rate = paper && (config.printType === "color" ? paper.colorEnabled && shop.printTypes.color ? paper.colorPrice : 0 : paper.bwEnabled && shop.printTypes.bw ? paper.bwPrice : 0);
  const copies = Math.max(1, Math.floor(config.copies));
  const billablePages = selectedPages * copies;
  const documentSets = selectedDocuments * copies;
  // Tariffs are per printed page. Double-sided printing affects sheets, not a per-page rate.
  const printing = money(billablePages * (rate || 0));
  const binding = money((shop.binding.find((item) => item.id === config.bindingId && item.enabled)?.price ?? 0) * documentSets);
  const services = money(config.additionalIds.reduce((sum, id) => {
    const option = shop.additional.find((item) => item.id === id && item.enabled);
    return sum + (option ? option.price * (option.perPage ? billablePages : documentSets) : 0);
  }, 0));
  const subtotal = money(printing + binding + services);
  const delivery = fulfillment === "delivery" && shop.delivery.enabled ? (shop.delivery.freeAbove !== null && subtotal >= shop.delivery.freeAbove ? 0 : money(shop.delivery.fee)) : 0;
  return { printing, binding, services, delivery, discount: 0, total: money(subtotal + delivery), billablePages };
}

export function advanceAmount(shop: Shop | null, total: number) {
  if (!shop || !shop.payments.advance) return 0;
  const { advanceType, advanceValue } = shop.payments;
  return Math.min(money(total), money(advanceType === "fixed" ? advanceValue : (total * advanceValue) / 100));
}

export function paymentSplit(shop: Shop | null, total: number, method: PaymentMethod) {
  const safeTotal = money(Math.max(0, total));
  if (method === "full") return { paidNow: safeTotal, balance: 0 };
  if (method === "advance") {
    const paidNow = advanceAmount(shop, safeTotal);
    return { paidNow, balance: money(safeTotal - paidNow) };
  }
  return { paidNow: 0, balance: safeTotal };
}
