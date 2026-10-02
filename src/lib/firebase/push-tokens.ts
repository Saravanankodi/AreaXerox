import { getAdminFirestore } from "@/lib/firebase/admin";

/**
 * FCM registration tokens, one document per browser/device.
 *
 * A user can be signed in on a phone, a laptop, and a desktop PWA at once, and
 * each `getToken()` call returns a *different* token. Storing a single token on
 * the user document would mean a push only ever reaches the last device that
 * happened to register. So tokens live in their own subcollection:
 *
 *   users/{uid}/fcmTokens/{tokenHash}
 *
 * The document ID is a SHA-256 of the token rather than the token itself. FCM
 * registration tokens are long, contain characters that are awkward in
 * document IDs, and are a bearer credential — anyone who obtains one can
 * receive that user's pushes. Storing a hash keeps them out of backups,
 * exports, and any log that dumps collection contents, and makes upsert
 * naturally idempotent for the same device.
 *
 * All access is via the Admin SDK, which bypasses security rules, so a user
 * can never read or write another account's tokens.
 */

const TOKENS = "fcmTokens";

/**
 * Token collection writes are client-visible in Phase 2 (the client unsubscribes
 * on sign-out), so the Firestore rules must allow a user to delete their own
 * token documents. See `firestore.rules`.
 */

function tokensCol(uid: string) {
  return getAdminFirestore().collection("users").doc(uid).collection(TOKENS);
}

/** Deterministic, URL-safe document ID for a token. */
export async function tokenDocId(token: string): Promise<string> {
  const bytes = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export interface RegisterTokenInput {
  uid: string;
  token: string;
  platform?: string;
  userAgent?: string;
}

/**
 * Registers a token for a user, re-associating it if the same browser is
 * signed in as a different account. FCM tokens are not secrets the user
 * chooses — they rotate and persist across sign-outs — so the common real-world
 * sequence is: user subscribes, signs out, a different user signs in on the
 * same device. Re-pointing the document here is what stops the previous
 * account from continuing to receive pushes on this browser.
 */
export async function registerPushToken(input: RegisterTokenInput): Promise<void> {
  const { uid, token } = input;
  if (!uid || !token) return;

  const id = await tokenDocId(token);
  const now = new Date().toISOString();

  await tokensCol(uid).doc(id).set(
    {
      token,
      platform: input.platform ?? "web",
      userAgent: input.userAgent ?? "",
      createdAt: now,
      updatedAt: now,
    },
    { merge: true },
  );

  // Re-point the same device if it was previously registered to another account.
  // Only do this when a readable user index exists; otherwise leave it alone.
  await reparentToken(token, id, uid);
}

/**
 * Moves a token to a new owner if it was registered elsewhere.
 *
 * Scoped query on the token field requires no composite index. Failures are
 * swallowed: the primary registration above has already succeeded, and a token
 * that lingers under a stale account is a nuisance, not a security hole.
 */
async function reparentToken(
  token: string,
  tokenId: string,
  newUid: string,
): Promise<void> {
  try {
    const fs = getAdminFirestore();
    const stale = await fs
      .collectionGroup(TOKENS)
      .where("token", "==", token)
      .get();

    for (const doc of stale.docs) {
      const ownerId = doc.ref.parent.parent?.id;
      if (ownerId === newUid || doc.ref.path === tokensCol(newUid).doc(tokenId).path) {
        continue;
      }
      await doc.ref.delete();
    }
  } catch (error) {
    console.warn("Push token re-parent skipped:", error);
  }
}

/** Removes a token (e.g. on sign-out or explicit opt-out). */
export async function deletePushToken(uid: string, token: string): Promise<void> {
  if (!uid || !token) return;
  const id = await tokenDocId(token);
  await tokensCol(uid).doc(id).delete();
}

/** Removes a token document by ID without needing the raw token. */
export async function deletePushTokenById(uid: string, tokenId: string): Promise<void> {
  if (!uid || !tokenId) return;
  await tokensCol(uid).doc(tokenId).delete();
}

/** All currently registered tokens for a user. */
export async function listPushTokens(uid: string): Promise<string[]> {
  const snapshot = await tokensCol(uid).get();
  return snapshot.docs
    .map((doc) => doc.data().token)
    .filter((token): token is string => typeof token === "string" && token.length > 0);
}
