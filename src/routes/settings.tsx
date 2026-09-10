import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bell, Lock, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { CustomerShell, PageHeader } from "@/components/layout/CustomerShell";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Account Settings — XEROXIFY" },
      {
        name: "description",
        content: "Control order notifications, privacy of your uploaded files and account preferences.",
      },
      { property: "og:title", content: "Account Settings — XEROXIFY" },
      { property: "og:description", content: "Notification and privacy preferences." },
    ],
  }),
  component: SettingsPage,
});

const PREFS = [
  { id: "status", label: "Order status updates", copy: "Get notified as your order moves forward." },
  { id: "offers", label: "Offers from nearby shops", copy: "Occasional discounts and bundle deals." },
  { id: "delivery", label: "Delivery alerts", copy: "Know when your delivery partner is nearby." },
  { id: "receipts", label: "Email receipts", copy: "A copy of every payment sent to your inbox." },
];

function SettingsPage() {
  const [on, setOn] = useState<Record<string, boolean>>({
    status: true,
    offers: false,
    delivery: true,
    receipts: true,
  });

  return (
    <CustomerShell>
      <PageHeader title="Settings" subtitle="Notifications, privacy and account controls." />

      <div className="container-page max-w-3xl space-y-6 pb-16">
        <div className="card-surface p-5 md:p-6">
          <h2 className="inline-flex items-center gap-2 text-base font-semibold">
            <Bell className="h-4 w-4 text-primary" /> Notifications
          </h2>
          <div className="mt-5 divide-y divide-border">
            {PREFS.map((p) => (
              <div key={p.id} className="flex items-start justify-between gap-6 py-4">
                <div>
                  <Label className="text-sm font-medium">{p.label}</Label>
                  <p className="mt-1 text-sm text-muted-foreground">{p.copy}</p>
                </div>
                <Switch
                  checked={on[p.id] ?? false}
                  onCheckedChange={(v) => {
                    setOn((s) => ({ ...s, [p.id]: v }));
                    toast.success(`${p.label} ${v ? "enabled" : "disabled"}`);
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="card-surface p-5 md:p-6">
          <h2 className="inline-flex items-center gap-2 text-base font-semibold">
            <Lock className="h-4 w-4 text-primary" /> Document privacy
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Uploaded files are shared only with the shop you select and are deleted automatically
            once the order is completed. Shops can never download your files again after that.
          </p>
          <Button
            variant="outline"
            className="mt-5"
            onClick={() => toast.success("All completed-order files cleared")}
          >
            <Trash2 className="h-4 w-4" /> Clear stored files now
          </Button>
        </div>

        <div className="card-surface border-destructive/30 p-5 md:p-6">
          <h2 className="text-base font-semibold text-destructive">Danger zone</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Deleting your account removes your order history and saved addresses permanently.
          </p>
          <Button
            variant="destructive"
            className="mt-5"
            onClick={() => toast.error("Account deletion is disabled in this demo")}
          >
            Delete my account
          </Button>
        </div>
      </div>
    </CustomerShell>
  );
}
