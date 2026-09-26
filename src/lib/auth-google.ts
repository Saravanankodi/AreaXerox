/**
 * Google authentication service boundary.
 *
 * Google sign-in is delegated to Firebase Authentication, which already owns
 * the OAuth client, the authorized-domain list and the Google account linking.
 * The rest of the app imports from here — never from a third-party Google SDK
 * directly — so the implementation can be swapped without touching consumers.
 */

import {
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";

import { auth } from "@/lib/firebase";

export interface GoogleAuthUser {
  uid: string;
  email: string;
  name: string;
}

export interface GoogleAuthResult {
  ok: boolean;
  user?: GoogleAuthUser;
  error?: string;
  cancelled: boolean;
}

const CANCELLED_CODES = new Set([
  "auth/popup-closed-by-user",
  "auth/cancelled-popup-request",
]);

const ERROR_MESSAGES: Record<string, string> = {
  "auth/popup-blocked":
    "Your browser blocked the Google popup. Allow popups for this site and try again.",
  "auth/unauthorized-domain":
    "This domain is not authorised for Google sign-in. Add it in Firebase → Authentication → Settings → Authorized domains.",
  "auth/operation-not-allowed":
    "Google sign-in is switched off in the Firebase console. Enable the Google provider.",
  "auth/account-exists-with-different-credential":
    "An account already exists with this email using a different sign-in method.",
  "auth/network-request-failed":
    "Network error. Please check your connection.",
  "auth/too-many-requests":
    "Too many attempts. Please wait a moment and try again.",
  "auth/web-storage-unsupported":
    "This browser blocks the storage Google sign-in needs. Enable site data or try another browser.",
};

function authErrorCode(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error
  ) {
    return String(
      (error as { code?: unknown }).code,
    );
  }

  return "";
}

export function describeGoogleAuthError(
  error: unknown,
): string {
  return (
    ERROR_MESSAGES[authErrorCode(error)] ??
    "Unable to sign in with Google. Please try again."
  );
}

/**
 * Open the Google account chooser and sign in with the selected identity.
 *
 * On success the Firebase session belongs to the returned uid, so the caller
 * must key the Firestore account document on `user.uid` — never on the email.
 */
export async function signInWithGoogle(): Promise<GoogleAuthResult> {
  const provider = new GoogleAuthProvider();

  provider.setCustomParameters({
    prompt: "select_account",
  });

  try {
    const credential = await signInWithPopup(
      auth,
      provider,
    );

    const firebaseUser = credential.user;
    const email = firebaseUser.email ?? "";

    if (!email) {
      await auth.signOut();

      return {
        ok: false,
        cancelled: false,
        error:
          "Your Google account did not share an email address. Sign in with email and password instead.",
      };
    }

    return {
      ok: true,
      cancelled: false,
      user: {
        uid: firebaseUser.uid,
        email: email.trim().toLowerCase(),
        name:
          firebaseUser.displayName?.trim() ||
          email.split("@")[0] ||
          "Google User",
      },
    };
  } catch (error: unknown) {
    console.error(
      "Google sign-in error:",
      error,
    );

    return {
      ok: false,
      cancelled: CANCELLED_CODES.has(
        authErrorCode(error),
      ),
      error: describeGoogleAuthError(error),
    };
  }
}
