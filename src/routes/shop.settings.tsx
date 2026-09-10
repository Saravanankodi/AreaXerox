import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bell, Power, Printer } from "lucide-react";
import { toast } from "sonner";
import { ShopShell } from "@/components/layout/ShopShell";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/shop/settings")({
  head: () => ({
    meta: [
      { title: "Shop Settings — XEROXIFY Shop" },
      {
        name: "description",
        content:
          "Pause new orders, set daily order limits and choose how you get notified about new print jobs.",
      },
      { property: "og:title", content: "Shop Settings — XEROXIFY Shop" },
      { property: "og:description", content: "Operational controls for your print shop." },
    ],
  }),
  component: ShopSettings,
});

function ShopSettings() {
  const [open, setOpen] = useState(true);
  const [limit, setLimit] = useState(40);
  const [notify, setNotify] = useState<Record<string, boolean>>({
    sound: true,
    sms: false,
    email: true,
  });

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
              <Switch
                checked={open}
                onCheckedChange={(v) => {
                  setOpen(v);
                  toast[v ? "success" : "error"](v ? "Shop is now open" : "Shop paused");
                }}
              />
            </div>
            <div>
              <Label htmlFor="limit">Daily order limit</Label>
              <Input
                id="limit"
                type="number"
                className="mt-1.5 w-32"
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value) || 0)}
              />
              <p className="mt-1.5 text-sm text-muted-foreground">
                New orders pause automatically once you hit this number.
              </p>
            </div>
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
                ["sms", "SMS to shop phone"],
                ["email", "Daily summary email"],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="flex items-center justify-between gap-4 py-3">
                <Label className="text-sm font-medium">{label}</Label>
                <Switch
                  checked={notify[key] ?? false}
                  onCheckedChange={(v) => setNotify((s) => ({ ...s, [key]: v }))}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="card-surface p-5 md:p-6 lg:col-span-2">
          <h2 className="inline-flex items-center gap-2 text-base font-semibold">
            <Printer className="h-4 w-4 text-primary" /> Printers
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Connect a local printer to send jobs directly from the order screen.
          </p>
          <Button
            variant="outline"
            className="mt-5"
            onClick={() => toast.success("Printer connection is not available in this demo")}
          >
            Connect a printer
          </Button>
        </div>
      </div>
    </ShopShell>
  );
}
