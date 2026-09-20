import type { Notification, NotificationType, NotificationRecipientRole } from "@/types";

let counter = 0;

export function createNotification(params: {
  recipientId: string;
  recipientRole: NotificationRecipientRole;
  type: NotificationType;
  title: string;
  message: string;
  relatedEntityId?: string;
  entityType?: "order" | "review" | "support";
}): Notification {
  counter++;
  return {
    id: `notif-${Date.now()}-${counter}`,
    recipientId: params.recipientId,
    recipientRole: params.recipientRole,
    type: params.type,
    title: params.title,
    message: params.message,
    relatedEntityId: params.relatedEntityId,
    entityType: params.entityType,
    read: false,
    createdAt: new Date().toISOString(),
  };
}

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
