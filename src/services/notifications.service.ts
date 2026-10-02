import { auth } from "@/lib/firebase/auth";
import type { OrderStatus } from "@/types";

/**
 * Client entry point for the notification system.
 *
 * Call sites declare a *business event* — "an order was placed", "this order
 * changed status", "a review was left". The server resolves the recipient and
 * writes the copy, so no client can address a notification at another user.
 *
 * Notification delivery is fire-and-forget by design: a failed event must
 * never block or roll back the business action that triggered it.
 */

async function getFirebaseIdToken(): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error("You must be signed in.");
  return user.getIdToken();
}

async function request<T>(path: string, init: RequestInit): Promise<T> {
  const token = await getFirebaseIdToken();
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init.headers ?? {}),
    },
  });

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const message =
      (data as { error?: string } | null)?.error ?? "Notification request failed.";
    throw new Error(message);
  }

  return data as T;
}

export type NotificationEvent =
  | { event: "order_placed"; orderId: string }
  | { event: "order_status_changed"; orderId: string; status: OrderStatus }
  | { event: "review_received"; reviewId: string };

export async function sendNotificationEvent(payload: NotificationEvent): Promise<void> {
  await request<{ created: number }>("/api/notifications", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/** Notifies the shop that a new order landed. Call after the order is created. */
export async function notifyOrderPlaced(orderId: string): Promise<void> {
  await sendNotificationEvent({ event: "order_placed", orderId });
}

/** Notifies the customer that their order moved. Call after the status write. */
export async function notifyOrderStatusChanged(
  orderId: string,
  status: OrderStatus,
): Promise<void> {
  await sendNotificationEvent({ event: "order_status_changed", orderId, status });
}

/** Notifies the shop that a customer left a review. Call after the review write. */
export async function notifyReviewReceived(reviewId: string): Promise<void> {
  await sendNotificationEvent({ event: "review_received", reviewId });
}

export async function markNotificationReadRemote(notificationId: string): Promise<void> {
  await request<{ updated: number }>("/api/notifications", {
    method: "PATCH",
    body: JSON.stringify({ notificationId }),
  });
}

export async function markAllNotificationsReadRemote(): Promise<void> {
  await request<{ updated: number }>("/api/notifications", {
    method: "PATCH",
    body: JSON.stringify({ all: true }),
  });
}

/**
 * Fire-and-forget wrapper for use at the end of a business action.
 *
 * Never throws: a notification outage must not surface as a failed order
 * placement or a stuck spinner on the shop's order board.
 */
export function fireAndForget(action: () => Promise<unknown>, context: string): void {
  void action().catch((error: unknown) => {
    console.warn(`Notification (${context}) failed:`, error);
  });
}
