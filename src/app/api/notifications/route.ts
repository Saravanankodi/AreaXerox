import type { NextRequest } from "next/server";

import { getAdminFirestore, verifyFirebaseIdToken } from "@/lib/firebase/admin";
import {
  createNotificationDoc,
  markAllNotificationsRead,
  markNotificationRead,
  recordPushResult,
} from "@/lib/firebase/admin-notifications";
import { sendNotificationPush } from "@/lib/push";
import {
  newOrderNoticeForShop,
  orderStatusNoticeForCustomer,
  reviewNoticeForShop,
  shopOwnerId,
} from "@/lib/notifications-events";
import type { Notification, Order, OrderStatus, Review, Shop } from "@/types";

export const runtime = "nodejs";

/**
 * The client sends a *business event*, never a notification.
 *
 * This is the security boundary of the notification system. A client cannot
 * supply `recipientId`, `title`, or `message`: it names what happened in the
 * domain ("this order was placed", "this review was left") and this handler
 * resolves the recipient from Firestore and renders the copy server-side.
 * Otherwise any authenticated user could forge a notification to any other
 * user.
 */

type EventName = "order_placed" | "order_status_changed" | "review_received";

interface EventPayload {
  event: EventName;
  orderId?: string;
  reviewId?: string;
  status?: OrderStatus;
}

const ORDER_STATUSES: OrderStatus[] = [
  "NEW",
  "ACCEPTED",
  "PRINTING",
  "FINISHING",
  "READY_PICKUP",
  "READY_DELIVERY",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "COMPLETED",
  "REJECTED",
];

function bad(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

async function readOrder(orderId: string): Promise<Order | null> {
  const snap = await getAdminFirestore().collection("orders").doc(orderId).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...(snap.data() as Record<string, unknown>) } as unknown as Order;
}

async function readShop(shopId: string): Promise<Shop | null> {
  const snap = await getAdminFirestore().collection("shops").doc(shopId).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...(snap.data() as Record<string, unknown>) } as unknown as Shop;
}

async function readReview(reviewId: string): Promise<Review | null> {
  const snap = await getAdminFirestore().collection("reviews").doc(reviewId).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...(snap.data() as Record<string, unknown>) } as unknown as Review;
}

/**
 * Ownership check used for order-status events.
 *
 * Deliberately does NOT accept an admin override. `verifyFirebaseIdToken`
 * sources `role` from the user's own `users/{uid}` document, and the current
 * `firestore.rules` grants `allow write: if true` on that document — so any
 * authenticated client can set `role: "admin"` on itself. Trusting `role`
 * here would let that client forge notifications for any order or review.
 * None of these three events are admin-triggered, so nothing is lost.
 */
function callerOwnsShop(
  callerUid: string,
  shop: Pick<Shop, "ownerAccountId" | "ownerId">,
): boolean {
  return shopOwnerId(shop) === callerUid;
}

/**
 * Resolves an event into zero or more notifications, enforcing that the
 * caller is entitled to trigger it.
 */
async function resolveEvent(
  payload: EventPayload,
  callerUid: string,
): Promise<
  | { ok: true; notifications: Parameters<typeof createNotificationDoc>[0][] }
  | { ok: false; error: string; status: number }
> {
  if (payload.event === "order_placed") {
    if (!isNonEmptyString(payload.orderId)) {
      return { ok: false, error: "order_placed requires an orderId.", status: 400 };
    }

    const order = await readOrder(payload.orderId);
    if (!order) return { ok: false, error: "Order not found.", status: 404 };

    // A customer may only announce their own order. Without this check a user
    // could spam any shop by replaying a foreign orderId.
    if (order.customerId !== callerUid) {
      return { ok: false, error: "This order does not belong to you.", status: 403 };
    }

    if (!isNonEmptyString(order.shopId)) {
      return { ok: false, error: "Order has no shop.", status: 422 };
    }

    const shop = await readShop(order.shopId);
    const ownerId = shop ? shopOwnerId(shop) : null;
    if (!ownerId) {
      return { ok: false, error: "Shop has no resolvable owner.", status: 422 };
    }

    return {
      ok: true,
      notifications: [
        {
          ...newOrderNoticeForShop(order),
          recipientId: ownerId,
          recipientRole: "shopkeeper",
          // Idempotent: one "new order" notice per order, forever.
          dedupeKey: `order_placed:${order.id}`,
        },
      ],
    };
  }

  if (payload.event === "order_status_changed") {
    if (!isNonEmptyString(payload.orderId)) {
      return { ok: false, error: "order_status_changed requires an orderId.", status: 400 };
    }
    if (!payload.status || !ORDER_STATUSES.includes(payload.status)) {
      return { ok: false, error: "order_status_changed requires a valid status.", status: 400 };
    }

    const order = await readOrder(payload.orderId);
    if (!order) return { ok: false, error: "Order not found.", status: 404 };

    const shop = await readShop(order.shopId);
    if (!shop || !callerOwnsShop(callerUid, shop)) {
      return { ok: false, error: "You do not own this order's shop.", status: 403 };
    }

    const customerId = order.customerId;
    if (!isNonEmptyString(customerId)) {
      return { ok: false, error: "Order has no customer to notify.", status: 422 };
    }

    return {
      ok: true,
      notifications: [
        {
          ...orderStatusNoticeForCustomer(order, payload.status),
          recipientId: customerId,
          recipientRole: "customer",
          // Keyed on the resulting status, so an A->B->C journey notifies once
          // per status and a repeated transition is a no-op.
          dedupeKey: `order_status:${order.id}:${payload.status}`,
        },
      ],
    };
  }

  if (payload.event === "review_received") {
    if (!isNonEmptyString(payload.reviewId)) {
      return { ok: false, error: "review_received requires a reviewId.", status: 400 };
    }

    const review = await readReview(payload.reviewId);
    if (!review) return { ok: false, error: "Review not found.", status: 404 };

    if (review.customerId !== callerUid) {
      return { ok: false, error: "This review does not belong to you.", status: 403 };
    }

    const shop = await readShop(review.shopId);
    const ownerId = shop ? shopOwnerId(shop) : null;
    if (!ownerId) {
      return { ok: false, error: "Shop has no resolvable owner.", status: 422 };
    }

    return {
      ok: true,
      notifications: [
        {
          ...reviewNoticeForShop(review, shop ?? { name: review.shopName ?? "your shop" }),
          recipientId: ownerId,
          recipientRole: "shopkeeper",
          dedupeKey: `review_received:${review.id}`,
        },
      ],
    };
  }

  return { ok: false, error: `Unsupported event "${payload.event}".`, status: 400 };
}

async function authenticate(request: NextRequest) {
  const header = request.headers.get("authorization") ?? "";
  return verifyFirebaseIdToken(header.replace(/^Bearer\s+/i, ""));
}

/**
 * Token verification failures are expected (expired sessions, clients that
 * forgot the header) and must be a 401. Everything else — a Firestore timeout,
 * a missing Admin credential, a quota error — is a server fault, and reporting
 * it as 401 would send callers into a pointless re-auth loop.
 */
function toErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Unexpected error.";

  if (/token|unauthenticated|credential|permission/i.test(message)) {
    return bad(message, 401);
  }

  console.error("Notifications route failed:", error);
  return bad("Could not process the notification request.", 500);
}

/** POST — create one or more notifications from a business event. */
export async function POST(request: NextRequest) {
  try {
    const user = await authenticate(request);

    let payload: EventPayload;
    try {
      payload = (await request.json()) as EventPayload;
    } catch {
      return bad("Invalid JSON body.", 400);
    }

    const resolved = await resolveEvent(payload, user.uid);
    if (!resolved.ok) return bad(resolved.error, resolved.status);

    const results = [];
    for (const notification of resolved.notifications) {
      // Firestore first, always. The inbox is the system of record; a push is
      // an attempt to notify, not the notification itself.
      const { id, created } = await createNotificationDoc(notification);
      results.push({ id, created, ...(await deliverPush(notification.recipientId, id)) });
    }

    return Response.json(
      { created: results.filter((r) => r.created).length, results },
      { status: 201 },
    );
  } catch (error) {
    return toErrorResponse(error);
  }
}

/**
 * Attempts browser push for a just-written notification and records the result.
 *
 * Runs after the document is committed and never propagates a failure: the
 * notification is already durable, and `pushStatus` is left as `pending` for
 * the Phase 2.5 worker to retry.
 */
async function deliverPush(
  recipientId: string,
  notificationId: string,
): Promise<{ pushStatus: string; pushSent: number; pushError: string | null }> {
  try {
    const fs = getAdminFirestore();
    const snapshot = await fs
      .collection("users")
      .doc(recipientId)
      .collection("notifications")
      .doc(notificationId)
      .get();

    if (!snapshot.exists) {
      return { pushStatus: "pending", pushSent: 0, pushError: null };
    }

    const notification = { id: snapshot.id, ...snapshot.data() } as Notification;
    const outcome = await sendNotificationPush(recipientId, notification);

    await recordPushResult(recipientId, notificationId, {
      status: outcome.status,
      attempts: outcome.attempts,
      error: outcome.error ?? null,
    });

    return { pushStatus: outcome.status, pushSent: outcome.sent, pushError: outcome.error ?? null };
  } catch (error) {
    // Never let a push problem surface as a failed notification creation.
    console.warn("Push delivery failed:", error);
    return { pushStatus: "pending", pushSent: 0, pushError: null };
  }
}

/** PATCH — mark one notification, or every notification, as read. */
export async function PATCH(request: NextRequest) {
  try {
    const user = await authenticate(request);

    let body: { notificationId?: string; all?: boolean };
    try {
      body = (await request.json()) as { notificationId?: string; all?: boolean };
    } catch {
      return bad("Invalid JSON body.", 400);
    }

    // The recipient is always the verified caller, so a user can only ever
    // clear their own notifications regardless of what they send.
    if (body.all) {
      const updated = await markAllNotificationsRead(user.uid);
      return Response.json({ updated });
    }

    if (!isNonEmptyString(body.notificationId)) {
      return bad("Provide notificationId, or set all: true.", 400);
    }

    await markNotificationRead(user.uid, body.notificationId);
    return Response.json({ updated: 1 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
