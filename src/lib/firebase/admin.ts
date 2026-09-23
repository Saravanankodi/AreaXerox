import {
  cert,
  getApps,
  getApp,
  initializeApp,
  type App,
  type ServiceAccount,
} from "firebase-admin/app";
import { getAuth, type DecodedIdToken } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

import type { AccountRole } from "@/types";

/**
 * Lazily initialised Firebase Admin app.
 *
 * Credentials come from the `FIREBASE_SERVICE_ACCOUNT` env var which should
 * contain the full service-account JSON (escaped) — see README. When it is not
 * available, falls back to Google's Application Default Credentials so local
 * `gcloud auth application-default login` still works.
 */
const appRef: { current: App | null } = { current: null };

function loadServiceAccount(): ServiceAccount | undefined {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) return undefined;

  try {
    return JSON.parse(raw) as ServiceAccount;
  } catch {
    // Not JSON — allow a plain (newline-escaped) private key flow later.
    return undefined;
  }
}

export function getAdminApp(): App {
  if (appRef.current) return appRef.current;

  const existing = getApps();
  if (existing.length > 0) {
    appRef.current = existing[0];
    return existing[0];
  }

  const serviceAccount = loadServiceAccount();
  const app = serviceAccount
    ? initializeApp({ credential: cert(serviceAccount) })
    : initializeApp();

  appRef.current = app;
  return app;
}

export function getAdminFirestore(): Firestore {
  return getFirestore(getAdminApp());
}

export interface VerifiedUser {
  uid: string;
  email?: string;
  phoneNumber?: string;
  role?: AccountRole;
}

/**
 * Verifies a Firebase ID token (sent as `Authorization: Bearer <token>`) and
 * enriches it with the user's Firestore role.
 */
export async function verifyFirebaseIdToken(token: string): Promise<VerifiedUser> {
  if (!token) {
    throw new Error("Missing Firebase ID token.");
  }

  const decoded: DecodedIdToken = await getAuth(getAdminApp()).verifyIdToken(token);

  let role: AccountRole | undefined;
  try {
    const snapshot = await getAdminFirestore()
      .collection("users")
      .doc(decoded.uid)
      .get();
    if (snapshot.exists) {
      const data = snapshot.data();
      if (
        data &&
        ["customer", "shopkeeper", "admin"].includes(String(data.role ?? ""))
      ) {
        role = String(data.role) as AccountRole;
      }
    }
  } catch {
    // Role lookup is best-effort; the verified identity is still usable.
  }

  return {
    uid: decoded.uid,
    email: decoded.email ?? undefined,
    phoneNumber: decoded.phone_number ?? undefined,
    role,
  };
}

/**
 * Convenience: the `getApp` re-export used by unit tests / scripts.
 */
export function adminApp(): App {
  return getApp();
}