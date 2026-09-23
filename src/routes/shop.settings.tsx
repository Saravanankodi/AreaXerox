import { createFileRoute } from "@/lib/navigation";
import { Bell, Power } from "lucide-react";
import { toast } from "sonner";
import { ShopShell } from "@/components/layout/ShopShell";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { PayoutsManager } from "@/components/PayoutsManager";
import { useStore } from "@/lib/store";
import { useMyShop } from "@/lib/useMyShop";

export const Route = createFileRoute("/shop/settings")({
  head: () => ({
    meta: [
      { title: "Shop Settings — XEROXMATE Shop" },
      {
        name: "description",
        content:
          "Pause new orders and choose how you get notified about new print jobs.",
      },
      { property: "og:title", content: "Shop Settings — XEROXMATE Shop" },
      { property: "og:description", content: "Operational controls for your print shop." },
    ],
  }),
  component: ShopSettings,
});

const DEFAULT_NOTIFICATIONS = { sound: true, email: true } as const;

function ShopSettings() {
  const { updateShop } = useStore();
  const shop = useMyShop();

  const acceptingOrders = shop.acceptingOrders ?? true;
  const notifications = shop.settings?.notifications ?? DEFAULT_NOTIFICATIONS;

  const setAcceptingOrders = (value: boolean) => {
    updateShop(shop.id, (s) => ({ ...s, acceptingOrders: value }));
    toast[value ? "success" : "error"](value ? "Shop is now open" : "Shop paused");
  };

  const setNotification = (key: keyof typeof DEFAULT_NOTIFICATIONS, value: boolean) => {
    updateShop(shop.id, (s) => ({
      ...s,
      settings: {
        notifications: {
          ...(s.settings?.notifications ?? DEFAULT_NOTIFICATIONS),
          [key]: value,
        },
      },
    }));
    toast.success(value ? "Notification enabled" : "Notification muted");
  };

  return (
    <ShopShell title="Settings" subtitle="Operational controls for your shop.">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card-surface p-5 md:p-6">
          <h2 className="inline-flex items-center gap-2 text-base font-semibold">
            <Power className="h-4 w-4 text-primary" /> Order intake
          </h2>
          <div className="mt-5 space-y-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label className="text-sm font-medium">Accepting new orders</Label>
                <p className="mt-1 text-sm text-muted-foreground">
                  Turn off to temporarily stop receiving print jobs.
                </p>
              </div>
              <Switch checked={acceptingOrders} onCheckedChange={setAcceptingOrders} />
            </div>
            <p className="text-xs text-muted-foreground">
              When paused, your shop is hidden from the customer ordering page until you turn
              this back on.
            </p>
          </div>
        </div>

        <div className="card-surface p-5 md:p-6">
          <h2 className="inline-flex items-center gap-2 text-base font-semibold">
            <Bell className="h-4 w-4 text-primary" /> Notifications
          </h2>
          <div className="mt-4 divide-y divide-border">
            {(
              [
                ["sound", "Sound alert for new orders"],
                ["email", "Daily summary email"],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="flex items-center justify-between gap-4 py-3">
                <Label className="text-sm font-medium">{label}</Label>
                <Switch
                  checked={notifications[key]}
                  onCheckedChange={(v) => setNotification(key, v)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6">
        {shop ? <PayoutsManager shop={shop} /> : null}
      </div>
    </ShopShell>
  );
}