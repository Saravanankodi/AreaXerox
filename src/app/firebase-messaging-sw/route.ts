import { NextResponse } from "next/server";

/**
 * Serves the FCM service worker at the origin root.
 *
 * Deliberately a route handler rather than a static file in /public. A static
 * file is served verbatim, so `process.env.NEXT_PUBLIC_*` would be undefined in
 * the worker and FCM would initialise without a config. Generating it here keeps
 * `.env.local` as the single source of truth for Firebase credentials instead
 * of duplicating the web config into a second file that silently drifts.
 *
 * The path has no `.js` extension so Next.js does not treat the segment as a
 * file. That is safe because this app registers the worker itself and passes the
 * resulting registration to `getToken`, so FCM never needs to guess a filename.
 * Scope is `/` because the worker is served from the origin root.
 */

export const runtime = "nodejs";
// Must not be statically optimised, or the injected config would be baked at
// build time and a redeploy would be needed to change credentials.
export const dynamic = "force-dynamic";

function config(): Record<string, string> {
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
  };
}

const WORKER = `/*
 * Firebase Cloud Messaging service worker — generated at /firebase-messaging-sw.
 * Do not edit by hand; the source of truth is this route.
 */

importScripts("https://www.gstatic.com/firebasejs/12.19.0/firebase-messaging-compat.js");

firebase.initializeApp(__CONFIG__);

const messaging = firebase.messaging();

/*
 * Messages delivered while the app is closed.
 *
 * When the payload carries a \`notification\` block the browser auto-displays
 * it and \`onnotificationclick\` handles the tap. Showing it again here would
 * double-post, so this only covers the data-only case.
 */
messaging.onBackgroundMessage((payload) => {
  if (payload.notification) return;

  const data = payload.data || {};
  self.registration.showNotification(data.title || "XEROXMATE", {
    body: data.message || "",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    tag: data.notificationId || "xeroxmate",
    data: data,
  });
});

/*
 * Tap handling.
 *
 * Reuse an open tab via focus/navigate when possible. Opening a second copy of
 * the app while one is already on that page is the usual complaint with naive
 * push implementations.
 */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetPath = (event.notification.data && event.notification.data.url) || "/";
  const targetUrl = new URL(targetPath, self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.startsWith(self.location.origin) && "focus" in client) {
          if ("navigate" in client) {
            return client.navigate(targetUrl).then((navigatedClient) =>
              navigatedClient ? navigatedClient.focus() : client.focus(),
            );
          }
          return client.focus();
        }
      }
      return self.clients.openWindow(targetUrl);
    })
  );
});
`;

export async function GET() {
  return new NextResponse(WORKER.replace("__CONFIG__", JSON.stringify(config())), {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      // The worker must be revalidated so a redeploy takes effect promptly.
      "Cache-Control": "no-cache, no-store, must-revalidate",
      // Worker is served from the origin root, so its default scope is already
      // "/", but state it explicitly in case the path ever moves.
      "Service-Worker-Allowed": "/",
    },
  });
}
