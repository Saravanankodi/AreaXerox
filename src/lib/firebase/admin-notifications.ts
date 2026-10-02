import { getAdminFirestore } from "@/lib/firebase/admin";
import type {
  Notification,
  NotificationPushStatus,
  NotificationRecipientRole,
  NotificationType,
} from "@/types";

/**
 * Server-only notification persistence.
 *
 * Every write here goes through the Admin SDK, which bypasses Firestore
 * security rules. That is deliberate: clients must never be able to author
 * notifications for themselves or anyone else. The public API route
 * (`/api/notifications`) is the single client-facing entry point, and it
 * resolves recipients from Firestore documents before calling into this file.
 */

const NOTIFICATIONS = "notifications";

function notificationsCol(uid: string) {
  return getAdminFirestore().collection("users").doc(uid).collection(NOTIFICATIONS);
}

export interface CreateNotificationInput {
  recipientId: string;
  recipientRole: NotificationRecipientRole;
  type: NotificationType;
  title: string;
  message: string;
  relatedEntityId?: string;
  entityType?: "order" | "review" | "support";
  /**
   * Stable key identifying the underlying business fact, e.g.
   * `order_placed:OMX-1001`. When present it becomes the document ID, so a
   * retried webhook or a double-tap converges on one document instead of
   * spamming the recipient with duplicates.
   */
  dedupeKey?: string;
}

export interface CreateNotificationResult {
  id: string;
  created: boolean;
}

/**
 * Writes one notification document. The Firestore write is the source of truth
 * and is always committed before any push is attempted — a failing FCM call
 * must never roll back or lose the in-app notification.
 */
export async function createNotificationDoc(
  input: CreateNotificationInput,
): Promise<CreateNotificationResult> {
  if (!input.recipientId) {
    throw new Error("createNotificationDoc requires a recipientId.");
  }

  const col = notificationsCol(input.recipientId);
  const id = input.dedupeKey
    ? encodeDedupeKey(input.dedupeKey)
    : col.doc().id;

  const ref = col.doc(id);
  const existing = await ref.get();

  if (existing.exists) {
    // Idempotent replay: the notification is already in the inbox. Report it
    // without resetting `read`, which the user may have already cleared.
    return { id, created: false };
  }

  const now = new Date().toISOString();
  const doc: Omit<Notification, "id"> = {
    recipientId: input.recipientId,
    recipientRole: input.recipientRole,
    type: input.type,
    title: input.title,
    message: input.message,
    ...(input.relatedEntityId ? { relatedEntityId: input.relatedEntityId } : {}),
    ...(input.entityType ? { entityType: input.entityType } : {}),
    read: false,
    createdAt: now,
    // Phase 1 ships the inbox only. `pending` is the honest starting state: the
    // document exists and no push has been attempted yet. Phase 2's worker
    // transitions this to sent / skipped / failed.
    pushStatus: "pending",
    pushAttempts: 0,
    pushLastError: null,
    pushedAt: null,
  };

  await ref.set(doc);
  return { id, created: true };
}

/**
 * Marks a single notification read. The doc ID is validated against the
 * recipient's own collection so a caller cannot address another user's
 * notification even if they guess an ID.
 */
export async function markNotificationRead(uid: string, notificationId: string): Promise<void> {
  if (!notificationId) return;
  const ref = notificationsCol(uid).doc(notificationId);
  await ref.update({ read: true });
}

/** Marks every unread notification for a user as read. */
export async function markAllNotificationsRead(uid: string): Promise<number> {
  const snapshot = await notificationsCol(uid)
    .where("read", "==", false)
    .limit(500)
    .get();

  if (snapshot.empty) return 0;

  const batch = getAdminFirestore().batch();
  snapshot.docs.forEach((doc) => batch.update(doc.ref, { read: true }));
  await batch.commit();

  return snapshot.size;
}

/**
 * Phase 2 hook: records the outcome of a browser push attempt. Kept here (not
 * in the client or route) so the eventual worker has a single place to write
 * delivery state.
 *
 * `pending` is a legitimate outcome, not just the initial state: a partial
 * success (some devices received it, some errored transiently) must be retried,
 * so it stays queued rather than being recorded as sent.
 */
export async function recordPushResult(
  uid: string,
  notificationId: string,
  result: {
    status: NotificationPushStatus;
    attempts: number;
    error?: string | null;
  },
): Promise<void> {
  await notificationsCol(uid).doc(notificationId).update({
    pushStatus: result.status,
    pushAttempts: result.attempts,
    pushLastError: result.error ?? null,
    pushedAt: result.status === "sent" ? new Date().toISOString() : null,
  });
}

/**
 * Firestore document IDs cannot contain `/`, and dedupe keys are built from
 * business identifiers joined by `:`. Percent-encode the separator characters
 * rather than falling back to a random ID, which would silently break
 * idempotency.
 */
function encodeDedupeKey(key: string): string {
  return key.replace(/[^A-Za-z0-9._-]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);
}
