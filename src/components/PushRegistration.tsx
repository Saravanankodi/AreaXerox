"use client";

import { useEffect } from "react";

import { useAuth } from "@/lib/auth";
import { syncPushToken } from "@/lib/push-client";

/**
 * Keeps this device's FCM token registered against the signed-in account.
 *
 * FCM tokens are not stable: they rotate when browser storage is cleared, and
 * `getToken` can legitimately return a new value at any time. Re-syncing on
 * every sign-in means the server's copy stays current without ever prompting the
 * user again — permission is only ever requested from an explicit click.
 *
 * Deliberately does nothing when the user has not granted permission, so a
 * service worker is never registered for someone who declined.
 */
export function PushRegistration() {
  const { session } = useAuth();

  useEffect(() => {
    if (!session?.accountId) return;
    void syncPushToken();
  }, [session?.accountId]);

  return null;
}
