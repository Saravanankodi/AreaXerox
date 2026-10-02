import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import type { Notification, NotificationPushStatus, NotificationRecipientRole, NotificationType } from "@/types";

/**
 * Client-side read path for the notification inbox.
 *
 * Writes never happen here — the Admin SDK owns creation and delivery state.
 * The client only reads (via `onSnapshot`) and asks the API route to flip
 * `read`, so a user cannot author or tamper with notifications.
 */

const MAX_INBOX_SIZE = 50;

const PUSH_STATUSES: NotificationPushStatus[] = ["pending", "sent", "skipped", "failed"];

const RECIPIENT_ROLES: NotificationRecipientRole[] = ["customer", "shopkeeper", "admin"];

function str(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

/**
 * Coerces an unvalidated Firestore document into a `Notification`.
 *
 * Firestore has no schema, and documents written by older builds (or by hand
 * in the console) will be missing fields. Every field is defensively typed
 * here so a malformed document degrades to a harmless bell entry instead of
 * throwing inside the snapshot listener and killing the subscription.
 */
export function normalizeNotification(
  id: string,
  data: DocumentData,
): Notification {
  const pushStatus = PUSH_STATUSES.includes(data.pushStatus)
    ? (data.pushStatus as NotificationPushStatus)
    : "pending";

  const notification: Notification = {
    id,
    recipientId: str(data.recipientId),
    recipientRole: RECIPIENT_ROLES.includes(data.recipientRole)
      ? (data.recipientRole as NotificationRecipientRole)
      : "customer",
    type: str(data.type, "info") as NotificationType,
    title: str(data.title, "Notification"),
    message: str(data.message),
    read: data.read === true,
    createdAt: str(data.createdAt),
    pushStatus,
    pushAttempts: typeof data.pushAttempts === "number" ? data.pushAttempts : 0,
    pushLastError: typeof data.pushLastError === "string" ? data.pushLastError : null,
    pushedAt: typeof data.pushedAt === "string" ? data.pushedAt : null,
  };

  if (typeof data.relatedEntityId === "string") {
    notification.relatedEntityId = data.relatedEntityId;
  }
  if (typeof data.entityType === "string") {
    notification.entityType = data.entityType as Notification["entityType"];
  }

  return notification;
}

/**
 * Subscribes to a user's notification inbox, newest first.
 *
 * The `limit` bounds both memory and cold-start cache size. Firestore returns
 * documents in ascending key order for a plain `orderBy`, so the newest
 * notification is the last element of the snapshot — it is reversed here so
 * callers can index from 0.
 */
export function listenToNotifications(
  uid: string,
  callback: (notifications: Notification[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const q = query(
    collection(db, "users", uid, "notifications"),
    orderBy("createdAt", "desc"),
    limit(MAX_INBOX_SIZE),
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs
        .map((doc: QueryDocumentSnapshot<DocumentData>) => normalizeNotification(doc.id, doc.data()))
        .filter((notification) => notification.createdAt !== "")
        // Defence in depth: the path already scopes to one user, but never let
        // a document addressed to someone else render in this bell.
        .filter((notification) => !notification.recipientId || notification.recipientId === uid);
      callback(items);
    },
    (error) => {
      onError?.(error);
    },
  );
}
