import { getAdminFirestore, getAdminMessaging } from "@/lib/firebase/admin";
import { listPushTokens, tokenDocId } from "@/lib/firebase/push-tokens";
import type { Notification, NotificationPushStatus } from "@/types";

/**
 * Browser push delivery for a single notification.
 *
 * Invariant: the notification document is already committed to Firestore
 * before this runs. FCM is a delivery transport, not the system of record. If
 * everything here fails — no Admin credentials, an FCM outage, a bad VAPID
 * setup — the in-app inbox is untouched and the notification is simply
 * retried later, because `pushStatus` stays `pending`.
 */

const TOKENS = "fcmTokens";

/** FCM caps a single multicast at 500 registration tokens. */
const MAX_TOKENS_PER_SEND = 500;
/**
 * Admin SDK error codes that mean "this token is permanently dead, stop
 * sending to it". Everything else is transient or environmental and must keep
 * the token so a later retry can still succeed.
 *
 * Verified against `firebase-admin/lib/messaging/messaging-api.d.ts` — the
 * `FirebaseError.code` strings the Admin SDK produces.
 */
const PERMANENT_TOKEN_ERRORS = new Set([
  // The token was deleted on the device, the app was uninstalled, or the
  // FCM registration itself expired. Retrying can never succeed.
  "messaging/registration-token-not-registered",
  // The token is structurally invalid — it was truncated in transit or was
  // never a real FCM token.
  "messaging/invalid-registration-token",
  // The token belongs to a different Firebase project than the one sending.
  // Retrying with the same credentials will never succeed.
  "messaging/invalid-package-name",
]);

/**
 * Errors that indicate a server-side misconfiguration rather than a bad
 * token. These are the ones worth alerting on: no amount of retrying helps
 * until a human fixes a credential or an env var.
 */
const CONFIGURATION_ERRORS = new Set([
  "messaging/mismatched-credential",
  "messaging/third-party-auth-error",
  "messaging/invalid-apns-credentials",
]);

export interface PushOutcome {
  status: NotificationPushStatus;
  attempts: number;
  error?: string | null;
  sent: number;
  failed: number;
  prunedTokens: number;
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

function errorCode(error: unknown): string {
  if (error && typeof error === "object" && "code" in error) {
    return String((error as { code: unknown }).code);
  }
  return "";
}

function errorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return String(error);
}

async function deleteTokens(uid: string, tokens: string[]): Promise<number> {
  if (tokens.length === 0) return 0;

  const fs = getAdminFirestore();
  const col = fs.collection("users").doc(uid).collection(TOKENS);

  // Cap the batch so a burst of stale tokens cannot exceed Firestore's
  // 500-writes-per-batch limit.
  const pruned = await Promise.all(
    chunk(tokens, 400).map(async (group) => {
      const ids = await Promise.all(group.map((token) => tokenDocId(token)));
      const batch = fs.batch();
      ids.forEach((id) => batch.delete(col.doc(id)));
      await batch.commit();
      return group.length;
    }),
  );

  return pruned.reduce((sum, n) => sum + n, 0);
}

/**
 * Sends one notification to every device the recipient has registered.
 *
 * Best-effort by contract: this never throws. A push failure is recorded in
 * the notification's delivery state and surfaced to the caller, but a caller's
 * business action (placing an order, moving a status) must not be undone
 * because a push could not be delivered.
 */
export async function sendNotificationPush(
  uid: string,
  notification: Notification,
): Promise<PushOutcome> {
  const attempts = (notification.pushAttempts ?? 0) + 1;

  let tokens: string[];
  try {
    tokens = await listPushTokens(uid);
  } catch (error) {
    const message = `Could not read push tokens: ${errorMessage(error)}`;
    console.warn(message);
    return { status: "failed", attempts, error: message, sent: 0, failed: 0, prunedTokens: 0 };
  }

  // `skipped`, not `failed`: nothing to deliver to is a terminal state, and
  // must not be retried. A user who has never opted in is not an error.
  if (tokens.length === 0) {
    return { status: "skipped", attempts, error: null, sent: 0, failed: 0, prunedTokens: 0 };
  }

  const dead: string[] = [];
  const configurationErrors: string[] = [];
  let sent = 0;
  let failed = 0;
  let lastError: string | null = null;

  try {
    for (const group of chunk(tokens, MAX_TOKENS_PER_SEND)) {
      const response = await getAdminMessaging().sendEachForMulticast({
        tokens: group,
        notification: {
          title: notification.title,
          body: notification.message,
        },
        data: {
          // FCM data values must be strings. The service worker reads these to
          // deep-link on tap without refetching the notification.
          notificationId: notification.id,
          url: deepLinkFor(notification),
        },
      });

      group.forEach((token, index) => {
        const result = response.responses[index];
        if (result?.success) {
          sent += 1;
          return;
        }

        failed += 1;
        const code = errorCode(result?.error);
        lastError = code || lastError || errorMessage(result?.error);

        if (PERMANENT_TOKEN_ERRORS.has(code)) {
          dead.push(token);
        } else if (CONFIGURATION_ERRORS.has(code)) {
          configurationErrors.push(code);
        }
        // Anything else (internal-error, server-unavailable, quota-exceeded,
        // rate-exceeded) keeps its token: the device is fine, the send was not.
      });
    }
  } catch (error) {
    // A whole-batch failure (Admin credentials, network, FCM outage).
    lastError = `${errorCode(error) || "send-failed"}: ${errorMessage(error)}`;
    failed += tokens.length;
  }

  // Only ever delete tokens FCM explicitly called permanently invalid. A single
  // failed send never justifies dropping a working registration.
  let prunedTokens = 0;
  if (dead.length > 0) {
    try {
      prunedTokens = await deleteTokens(uid, dead);
    } catch (error) {
      console.warn("Could not prune dead push tokens:", error);
    }
  }

  if (configurationErrors.length > 0) {
    console.error(
      `Push configuration error for user ${uid}: ${[...new Set(configurationErrors)].join(", ")}. ` +
        "Check the service account key and the VAPID configuration. Tokens were kept.",
    );
  }

  const status: NotificationPushStatus =
    sent > 0 ? (failed > 0 ? "pending" : "sent") : "failed";

  return { status, attempts, error: lastError, sent, failed, prunedTokens };
}

/**
 * Where tapping the OS notification should land. Mirrors
 * `getNotificationRoute` in `src/lib/notifications.ts`, but returns a plain
 * string because the service worker and FCM data payload need a URL, not a
 * route descriptor.
 */
export function deepLinkFor(notification: Notification): string {
  if (notification.entityType === "order" && notification.relatedEntityId) {
    return notification.recipientRole === "shopkeeper"
      ? `/shop/orders/${notification.relatedEntityId}`
      : `/orders/${notification.relatedEntityId}`;
  }
  if (notification.entityType === "review" && notification.recipientRole === "shopkeeper") {
    return "/shop/reviews";
  }
  if (notification.entityType === "support") {
    return "/support";
  }
  return "/";
}
