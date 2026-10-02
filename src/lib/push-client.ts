"use client";

import { getApp, getApps, initializeApp } from "firebase/app";
import { getMessaging, getToken, isSupported } from "firebase/messaging";

import { auth } from "@/lib/firebase/auth";

/**
 * Browser push (Phase 2), client half.
 *
 * Flow: user taps "Enable notifications" -> request permission -> get an FCM
 * token -> POST it to the server, which stores it against the verified user.
 * The server is the only thing that ever sends.
 */

/** Served by the route handler so Firebase config stays in .env.local. */
const SW_URL = "/firebase-messaging-sw";

const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

export type PushSupport =
  | "unsupported"
  | "denied"
  | "default"
  | "granted"
  | "dismissed"
  | "unconfigured";

/** Whether this browser can receive push at all. */
export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/**
 * Reports whether push is available, and why not when it is not.
 *
 * `unconfigured` is separated from `unsupported` on purpose: a missing VAPID key
 * is a deployment mistake, while a missing service worker is a browser fact.
 * They need different fixes and must not look the same in the UI.
 */
export async function getPushSupport(): Promise<PushSupport> {
  if (!isPushSupported()) return "unsupported";
  if (!vapidKey) return "unconfigured";
  if (typeof Notification === "undefined") return "unsupported";

  if (Notification.permission === "denied") return "denied";
  if (Notification.permission === "granted") return "granted";
  return "default";
}

function messagingInstance() {
  // Reuse the app the rest of the client uses so there is one Firebase app
  // instance; a second initializeApp with the same name throws.
  const app = getApps().length > 0 ? getApp() : initializeApp();
  return getMessaging(app);
}

let registrationPromise: Promise<ServiceWorkerRegistration | null> | null = null;

/**
 * Registers the messaging worker at the origin root.
 *
 * The result is memoised: `register()` on an already-registered scope is
 * cheap but not free, and this runs on every navigation.
 */
export function registerMessagingWorker(): Promise<ServiceWorkerRegistration | null> {
  if (registrationPromise) return registrationPromise;

  registrationPromise = navigator.serviceWorker
    .register(SW_URL, { scope: "/" })
    .catch((error: unknown) => {
      console.warn("Messaging service worker registration failed:", error);
      // Reset so a later attempt (e.g. after the user comes online) can retry.
      registrationPromise = null;
      return null;
    });

  return registrationPromise;
}

/**
 * Requests permission and registers this device's token with the server.
 *
 * Must be called from a user gesture. Browsers reject or auto-deny a
 * `requestPermission()` that is not tied to a click, which is why there is no
 * automatic call to this anywhere in the app.
 */
export async function enablePushNotifications(): Promise<{
  ok: boolean;
  reason: PushSupport | "error";
}> {
  if (!vapidKey) return { ok: false, reason: "unconfigured" };

  try {
    // FCM's own feature detection; throws on browsers without IndexedDB or
    // with push disabled at the OS level (Windows notification settings).
    if (!(await isSupported())) return { ok: false, reason: "unsupported" };

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return { ok: false, reason: permission === "denied" ? "denied" : "dismissed" };
    }

    const registration = await registerMessagingWorker();
    if (!registration) return { ok: false, reason: "error" };

    const token = await getToken(messagingInstance(), {
      vapidKey,
      serviceWorkerRegistration: registration,
    });

    if (!token) return { ok: false, reason: "error" };

    await subscribeToken(token);
    return { ok: true, reason: "granted" };
  } catch (error) {
    console.warn("Could not enable push notifications:", error);
    return { ok: false, reason: "error" };
  }
}

/** Stops this device receiving pushes. Does not clear other devices. */
export async function disablePushNotifications(): Promise<boolean> {
  try {
    const registration = await registerMessagingWorker();
    if (registration) {
      const existing = await getToken(messagingInstance(), {
        vapidKey,
        serviceWorkerRegistration: registration,
      });
      if (existing) {
        await unsubscribeToken(existing);
      }
    }
    return true;
  } catch (error) {
    console.warn("Could not disable push notifications:", error);
    return false;
  }
}

/**
 * Re-registers the current token on every authenticated load.
 *
 * FCM tokens rotate (a browser can issue a new one after storage is cleared,
 * and `getToken` may return a fresh value), so re-subscribing on sign-in keeps
 * the server's copy current without asking the user for anything.
 */
export async function syncPushToken(): Promise<void> {
  try {
    if (!vapidKey) return;
    if (Notification.permission !== "granted") return;
    if (!(await isSupported())) return;

    const registration = await registerMessagingWorker();
    if (!registration) return;

    const token = await getToken(messagingInstance(), {
      vapidKey,
      serviceWorkerRegistration: registration,
    });
    if (token) await subscribeToken(token);
  } catch (error) {
    // A failed refresh must never break sign-in.
    console.warn("Push token refresh skipped:", error);
  }
}

async function subscribeToken(token: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;

  const idToken = await user.getIdToken();
  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({
      token,
      platform: navigator.platform || "web",
      userAgent: navigator.userAgent,
    }),
  });

  if (!res.ok) {
    console.warn(`Push token subscribe failed: ${res.status} ${await res.text()}`);
  }
}

async function unsubscribeToken(token: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;

  const idToken = await user.getIdToken();
  const res = await fetch("/api/push/unsubscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ token }),
  });

  if (!res.ok) {
    console.warn(`Push token unsubscribe failed: ${res.status} ${await res.text()}`);
  }
}
