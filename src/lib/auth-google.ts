"use client";

import {
  GoogleAuthProvider,
  signInWithPopup,
  type User,
  type UserCredential,
} from "firebase/auth";

import { auth } from "@/lib/firebase";

/* =========================================================

ERROR HELPERS

======================================================= */

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

function authErrorCode(
  error: unknown,
): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error
  ) {
    return String(
      (error as { code?: unknown }).code ?? "",
    );
  }

  return "";
}

export function describeGoogleAuthError(
  error: unknown,
): string {
  const code = authErrorCode(error);

  if (!code) {
    return "Unable to sign in with Google. Please try again.";
  }

  const message =
    ERROR_MESSAGES[code] ??
    "Unable to sign in with Google. Please try again.";

  return `${message} (${code})`;
}

export function isGoogleAuthCancelled(
  error: unknown,
): boolean {
  return CANCELLED_CODES.has(
    authErrorCode(error),
  );
}

/* =========================================================

PORTAL MARKER

The portal marker records which side of the app asked for Google
(`/auth/customer/...` vs `/auth/shop/...`), because a brand new Google
user has no account document yet and `AuthProvider` needs the intended
role to provision one.

The popup flow leaves this page in place, so the marker lives in module
memory and is read by `AuthProvider` the moment Firebase reports the
user. It is mirrored into `sessionStorage` so an interrupted attempt
still resolves on the next load, and `AuthProvider` clears it as soon as
it has handled the sign-in.

======================================================= */

const PENDING_PORTAL_KEY =
  "omx-google-portal";

const PORTAL_MAX_AGE_MS =
  10 * 60 * 1000;

export type GooglePortalRole =
  | "customer"
  | "shopkeeper";

let pendingPortalRole:
  | GooglePortalRole
  | null = null;

export function isGoogleAuthUser(
  user: User | null,
): boolean {
  return (
    user?.providerData.some(
      (info) =>
        info.providerId ===
        "google.com",
    ) ?? false
  );
}

/* =========================================================

BEGIN GOOGLE SIGN-IN

Opens Google's account chooser in a popup window, so the app stays
loaded and the session is established in place.

Resolves with the Firebase credential, or `null` when the visitor closed
the popup without choosing an account.

======================================================= */

export async function beginGoogleSignIn(
  role: GooglePortalRole,
): Promise<UserCredential | null> {
  clearGoogleSignInPortal();

  try {
    sessionStorage.setItem(
      PENDING_PORTAL_KEY,
      JSON.stringify({
        role,
        startedAt: Date.now(),
      }),
    );
  } catch {
    throw new Error(
      "This browser is blocking the storage Google sign-in needs. Enable site data and try again.",
    );
  }

  pendingPortalRole = role;

  const provider =
    new GoogleAuthProvider();

  provider.setCustomParameters({
    prompt: "select_account",
  });

  try {
    return await signInWithPopup(
      auth,
      provider,
    );
  } catch (error: unknown) {
    clearGoogleSignInPortal();
    throw error;
  }
}

/* =========================================================

TAKE PORTAL

======================================================= */

export function takeGoogleSignInPortal():
  | GooglePortalRole
  | null {
  if (pendingPortalRole) {
    const role = pendingPortalRole;

    clearGoogleSignInPortal();

    return role;
  }

  let raw: string | null = null;

  try {
    raw = sessionStorage.getItem(
      PENDING_PORTAL_KEY,
    );
  } catch {
    return null;
  }

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as {
      role?: unknown;
      startedAt?: unknown;
    };

    if (
      parsed.role !== "customer" &&
      parsed.role !== "shopkeeper"
    ) {
      clearGoogleSignInPortal();
      return null;
    }

    if (
      typeof parsed.startedAt !== "number"
    ) {
      clearGoogleSignInPortal();
      return null;
    }

    const age =
      Date.now() - parsed.startedAt;

    if (
      age < 0 ||
      age > PORTAL_MAX_AGE_MS
    ) {
      clearGoogleSignInPortal();
      return null;
    }

    clearGoogleSignInPortal();

    return parsed.role;
  } catch {
    clearGoogleSignInPortal();
    return null;
  }
}

/* =========================================================

CLEAR PORTAL

======================================================= */

export function clearGoogleSignInPortal(): void {
  pendingPortalRole = null;

  try {
    sessionStorage.removeItem(
      PENDING_PORTAL_KEY,
    );
  } catch {
    // Ignore storage errors.
  }
}
