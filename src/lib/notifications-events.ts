import { inr } from "@/lib/pricing";
import type { Order, OrderStatus, Shop } from "@/types";

/**
 * Pure notification copy + routing rules.
 *
 * This module is deliberately free of I/O. It takes already-loaded domain
 * documents and returns what should be sent and to whom. The route handler
 * (which can read Firestore) does the loading; this file owns the policy, so
 * "what copy does a customer get when an order is rejected" has exactly one
 * answer in the codebase and is unit-testable without Firebase.
 */

const CUSTOMER_STATUS_COPY: Record<OrderStatus, string> = {
  NEW: "Waiting for the shop to accept your order.",
  ACCEPTED: "The shop accepted your order and will start printing shortly.",
  PRINTING: "Your documents are being printed right now.",
  FINISHING: "Binding and finishing work is in progress.",
  READY_PICKUP: "Your order is ready. Collect it from the shop.",
  READY_DELIVERY: "Your order is packed and waiting for the delivery partner.",
  OUT_FOR_DELIVERY: "Your order is out for delivery.",
  DELIVERED: "Your order was delivered. Thank you!",
  COMPLETED: "Order completed. Thank you!",
  REJECTED: "The shop could not take this order.",
};

/** Short customer-facing headline for a status transition. */
const STATUS_HEADLINE: Record<OrderStatus, string> = {
  NEW: "Order placed",
  ACCEPTED: "Order accepted",
  PRINTING: "Printing started",
  FINISHING: "Finishing your work",
  READY_PICKUP: "Ready for pickup",
  READY_DELIVERY: "Ready for delivery",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Order delivered",
  COMPLETED: "Order completed",
  REJECTED: "Order rejected",
};

function customerNameOf(order: Order): string {
  return order.customerName?.trim() || "a customer";
}

function pageCountOf(order: Order): number {
  const fromFiles = (order.documents ?? []).reduce(
    (sum, file) => sum + (file.pages ?? 0),
    0,
  );
  return fromFiles > 0 ? fromFiles : order.price?.billablePages ?? 0;
}

function fileSummary(order: Order): string {
  const count = order.documents?.length ?? 0;
  if (count === 0) return "an order";
  if (count === 1) return "1 document";
  return `${count} documents`;
}

export interface NewOrderNotice {
  recipientId: string;
  recipientRole: "shopkeeper";
  type: "order_placed";
  title: string;
  message: string;
  relatedEntityId: string;
  entityType: "order";
}

export interface OrderStatusNotice {
  recipientId: string;
  recipientRole: "customer";
  type: "order_accepted" | "order_rejected" | "order_status_changed";
  title: string;
  message: string;
  relatedEntityId: string;
  entityType: "order";
}

export interface ReviewNotice {
  recipientId: string;
  recipientRole: "shopkeeper";
  type: "review_received";
  title: string;
  message: string;
  relatedEntityId: string;
  entityType: "review";
}

/** Copy for a customer when the shop moves their order to `status`. */
export function orderStatusNoticeForCustomer(
  order: Order,
  status: OrderStatus,
): Omit<OrderStatusNotice, "recipientId" | "recipientRole"> {
  const type =
    status === "ACCEPTED"
      ? "order_accepted"
      : status === "REJECTED"
        ? "order_rejected"
        : "order_status_changed";

  return {
    type,
    title: STATUS_HEADLINE[status],
    message: CUSTOMER_STATUS_COPY[status],
    relatedEntityId: order.id,
    entityType: "order",
  };
}

/** Copy for a shop owner when a new order lands. */
export function newOrderNoticeForShop(
  order: Order,
): Omit<NewOrderNotice, "recipientId" | "recipientRole"> {
  const pages = pageCountOf(order);
  const pagePart = pages > 0 ? ` · ${pages} page${pages === 1 ? "" : "s"}` : "";

  return {
    type: "order_placed",
    title: `New order ${order.id}`,
    message: `${customerNameOf(order)} placed ${fileSummary(order)}${pagePart} · ${inr(order.price?.total ?? 0)}`,
    relatedEntityId: order.id,
    entityType: "order",
  };
}

/** Copy for a shop owner when a customer leaves a review. */
export function reviewNoticeForShop(
  review: { id: string; rating?: number; description?: string },
  shop: Pick<Shop, "name">,
): Omit<ReviewNotice, "recipientId" | "recipientRole"> {
  const stars = review.rating ?? 0;
  const comment = review.description?.trim();

  return {
    type: "review_received",
    title: `New ${stars}-star review`,
    message: comment
      ? comment.slice(0, 160)
      : `A customer left a ${stars}-star review for ${shop.name}.`,
    relatedEntityId: review.id,
    entityType: "review",
  };
}

/** Owner UID for a shop, tolerating the legacy `ownerId` field. */
export function shopOwnerId(shop: Pick<Shop, "ownerAccountId" | "ownerId">): string | null {
  return shop.ownerAccountId ?? shop.ownerId ?? null;
}
