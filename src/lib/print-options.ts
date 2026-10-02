import type { PrintConfig, Shop } from "@/types";
import { isShopVisibleToCustomers } from "@/lib/shop-status";

/** A paper type offered by at least one visible shop, priced at the lowest rate found. */
export interface PaperOption {
  id: string;
  name: string;
  bwEnabled: boolean;
  bwPrice: number;
  colorEnabled: boolean;
  colorPrice: number;
  shopCount: number;
}

/** A binding / extra service offered by at least one visible shop. */
export interface ServiceOptionSummary {
  id: string;
  name: string;
  price: number;
  perPage: boolean;
  shopCount: number;
}

/** Union of every print option offered across all customer-visible shops. */
export interface PrintOptionsCatalog {
  paperTypes: PaperOption[];
  binding: ServiceOptionSummary[];
  additional: ServiceOptionSummary[];
  colorAvailable: boolean;
  doubleSidedAvailable: boolean;
  landscapeAvailable: boolean;
}

const EMPTY_CATALOG: PrintOptionsCatalog = {
  paperTypes: [],
  binding: [],
  additional: [],
  colorAvailable: false,
  doubleSidedAvailable: false,
  landscapeAvailable: false,
};

const lowest = (current: number, price: number) =>
  current < 0 || (price >= 0 && price < current) ? price : current;

/**
 * Builds one catalogue from every customer-visible shop so the customer can pick
 * any option first and let the shop list narrow down to the shops that support it.
 */
export function buildPrintOptionsCatalog(shops: Shop[]): PrintOptionsCatalog {
  const visible = shops.filter(isShopVisibleToCustomers);
  if (!visible.length) return EMPTY_CATALOG;

  const papers = new Map<string, PaperOption>();
  const bindings = new Map<string, ServiceOptionSummary>();
  const extras = new Map<string, ServiceOptionSummary>();
  let doubleSidedAvailable = false;
  let landscapeAvailable = false;

  for (const shop of visible) {
    if (shop.printSides?.double) doubleSidedAvailable = true;
    if (shop.orientation?.landscape) landscapeAvailable = true;

    for (const paper of shop.paperTypes ?? []) {
      if (!paper.enabled) continue;
      const existing = papers.get(paper.id);
      if (existing) {
        existing.shopCount += 1;
        existing.bwEnabled = existing.bwEnabled || paper.bwEnabled;
        existing.colorEnabled = existing.colorEnabled || paper.colorEnabled;
        existing.bwPrice = lowest(existing.bwPrice, paper.bwPrice);
        existing.colorPrice = lowest(existing.colorPrice, paper.colorPrice);
        continue;
      }
      papers.set(paper.id, {
        id: paper.id,
        name: paper.name,
        bwEnabled: paper.bwEnabled,
        bwPrice: paper.bwPrice,
        colorEnabled: paper.colorEnabled,
        colorPrice: paper.colorPrice,
        shopCount: 1,
      });
    }

    for (const option of shop.binding ?? []) {
      if (!option.enabled || option.id === "none") continue;
      const existing = bindings.get(option.id);
      if (existing) {
        existing.shopCount += 1;
        existing.price = lowest(existing.price, option.price);
        continue;
      }
      bindings.set(option.id, {
        id: option.id,
        name: option.name,
        price: option.price,
        perPage: Boolean(option.perPage),
        shopCount: 1,
      });
    }

    for (const option of shop.additional ?? []) {
      if (!option.enabled || option.id === "none") continue;
      const existing = extras.get(option.id);
      if (existing) {
        existing.shopCount += 1;
        existing.price = lowest(existing.price, option.price);
        continue;
      }
      extras.set(option.id, {
        id: option.id,
        name: option.name,
        price: option.price,
        perPage: Boolean(option.perPage),
        shopCount: 1,
      });
    }
  }

  const paperTypes = [...papers.values()].filter(
    (paper) => paper.bwEnabled || paper.colorEnabled,
  );
  return {
    paperTypes,
    binding: [...bindings.values()].sort((a, b) => a.price - b.price),
    additional: [...extras.values()].sort((a, b) => a.price - b.price),
    colorAvailable: paperTypes.some((paper) => paper.colorEnabled),
    doubleSidedAvailable,
    landscapeAvailable,
  };
}

/** True when the shop can actually print exactly this configuration. */
export function shopSupportsConfig(shop: Shop, config: PrintConfig): boolean {
  if (!isShopVisibleToCustomers(shop)) return false;
  const paper = shop.paperTypes?.find((item) => item.id === config.paperTypeId && item.enabled);
  if (!paper) return false;
  if (config.printType === "color" ? !paper.colorEnabled : !paper.bwEnabled) return false;
  if (config.side === "double" && !shop.printSides?.double) return false;
  if (config.orientation === "landscape" && !shop.orientation?.landscape) return false;
  if (
    config.bindingId &&
    !shop.binding?.some((option) => option.id === config.bindingId && option.enabled)
  )
    return false;
  if (
    config.additionalIds.some(
      (id) => !shop.additional?.some((option) => option.id === id && option.enabled),
    )
  )
    return false;
  return true;
}

/** Every shop that supports all of the given configurations. */
export function shopsMatchingConfigs(shops: Shop[], configs: PrintConfig[]): Shop[] {
  return shops.filter((shop) => configs.every((config) => shopSupportsConfig(shop, config)));
}

/**
 * Keeps a saved configuration inside the shared catalogue so a selection can never
 * point at an option no shop offers (which would leave the customer with no shops).
 */
export function resolvePrintConfig(
  config: PrintConfig,
  catalog: PrintOptionsCatalog,
): PrintConfig {
  if (!catalog.paperTypes.length) return config;
  const paper =
    catalog.paperTypes.find((item) => item.id === config.paperTypeId) ??
    catalog.paperTypes.find((item) => item.bwEnabled) ??
    catalog.paperTypes[0];
  const printType =
    config.printType === "color"
      ? paper.colorEnabled
        ? "color"
        : "bw"
      : paper.bwEnabled
        ? "bw"
        : paper.colorEnabled
          ? "color"
          : config.printType;
  const bindingId = catalog.binding.some((option) => option.id === config.bindingId)
    ? config.bindingId
    : null;
  const additionalIds = config.additionalIds.filter((id) =>
    catalog.additional.some((option) => option.id === id),
  );
  const side = config.side === "double" && !catalog.doubleSidedAvailable ? "single" : config.side;
  const orientation =
    config.orientation === "landscape" && !catalog.landscapeAvailable ? "portrait" : config.orientation;
  if (
    paper.id === config.paperTypeId &&
    printType === config.printType &&
    bindingId === config.bindingId &&
    side === config.side &&
    orientation === config.orientation &&
    additionalIds.length === config.additionalIds.length
  )
    return config;
  return { ...config, paperTypeId: paper.id, printType, side, orientation, bindingId, additionalIds };
}
