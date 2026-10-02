"use client";

import { useCallback, useEffect, useState } from "react";
import { BellRing, Smartphone } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  disablePushNotifications,
  enablePushNotifications,
  getPushSupport,
  type PushSupport,
} from "@/lib/push-client";

/**
 * Opt-in control for browser push.
 *
 * Permission is only ever requested from this button, never on page load:
 * browsers reject or silently auto-deny a `requestPermission()` that is not
 * attached to a user gesture, and prompting on arrival trains people to block.
 */
export function PushNotificationsSetting() {
  const [support, setSupport] = useState<PushSupport | "loading">("loading");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setSupport(await getPushSupport());
  }, []);

  useEffect(() => {
    let cancelled = false;
    // Resolved asynchronously so this is not a synchronous setState in the
    // effect body.
    getPushSupport().then((result) => {
      if (!cancelled) setSupport(result);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleEnable() {
    setBusy(true);
    try {
      const result = await enablePushNotifications();
      if (result.ok) {
        toast.success("Browser notifications enabled");
      } else if (result.reason === "denied") {
        toast.error("Notifications are blocked in your browser settings");
      } else if (result.reason === "dismissed") {
        toast.message("No changes made");
      } else if (result.reason === "unconfigured") {
        toast.error("Push is not configured on this deployment");
      } else {
        toast.error("Could not enable notifications on this device");
      }
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function handleDisable() {
    setBusy(true);
    try {
      const ok = await disablePushNotifications();
      if (ok) toast.success("Browser notifications disabled on this device");
      else toast.error("Could not disable notifications on this device");
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card-surface p-5 md:p-6">
      <h2 className="inline-flex items-center gap-2 text-base font-semibold">
        <BellRing className="h-4 w-4 text-primary" /> Browser notifications
      </h2>
      <p className="mt-3 text-sm text-muted-foreground">
        Get an alert on this device when an order is placed or its status changes, even when the
        app is closed. Alerts are only sent for this browser.
      </p>

      <div className="mt-5">{renderBody()}</div>
    </div>
  );

  function renderBody() {
    if (support === "loading") {
      return <p className="text-sm text-muted-foreground">Checking this device…</p>;
    }

    if (support === "unconfigured") {
      return (
        <p className="text-sm text-muted-foreground">
          Push is not configured on this deployment. An administrator needs to set{" "}
          <code className="text-xs">NEXT_PUBLIC_FIREBASE_VAPID_KEY</code> before browser
          notifications can be enabled.
        </p>
      );
    }

    if (support === "unsupported") {
      return (
        <p className="text-sm text-muted-foreground">
          This browser cannot receive push notifications. In-app alerts still work normally.
        </p>
      );
    }

    if (support === "denied") {
      return (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Notifications are blocked for this site. Re-enable them in your browser&apos;s site
            settings, then reload this page.
          </p>
        </div>
      );
    }

    if (support === "granted") {
      return (
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" onClick={handleDisable} disabled={busy}>
            {busy ? "Working…" : "Disable on this device"}
          </Button>
          <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <Smartphone className="h-3.5 w-3.5" /> Enabled
          </span>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <Button onClick={handleEnable} disabled={busy}>
          {busy ? "Enabling…" : "Enable notifications"}
        </Button>
        <p className="inline-flex items-start gap-1.5 text-xs text-muted-foreground">
          <Smartphone className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          On iPhone and iPad, add XEROXMATE to your home screen first, then open it from there —
          Apple does not allow push in a normal browser tab.
        </p>
      </div>
    );
  }
}
