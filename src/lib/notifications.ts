import type { Notification } from "@/types";

/**
 * Deep link for a notification, used by both the in-app bell and the Phase 2
 * service worker.
 *
 * Note there is deliberately no local `createNotification` factory any more.
 * Notification *content* used to be assembled in the browser, which meant any
 * authenticated user could hand-craft one addressed to any other user. Copy
 * and recipients are now resolved server-side from business events — see
 * `src/lib/notifications-events.ts` and `/api/notifications`.
 */
export function getNotificationRoute(
  notification: Notification,
): { to: string; params?: Record<string, string> } | null {
  if (notification.entityType === "order" && notification.relatedEntityId) {
    if (notification.recipientRole === "shopkeeper") {
      return { to: "/shop/orders/$orderId", params: { orderId: notification.relatedEntityId } };
    }
    return { to: "/orders/$orderId", params: { orderId: notification.relatedEntityId } };
  }
  if (notification.entityType === "review") {
    if (notification.recipientRole === "shopkeeper") {
      return { to: "/shop/reviews" };
    }
    return null;
  }
  if (notification.entityType === "support") {
    return { to: "/support" };
  }
  return null;
}
