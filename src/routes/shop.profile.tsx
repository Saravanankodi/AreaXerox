import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { ShopShell } from "@/components/layout/ShopShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/shop/profile")({
  head: () => ({
    meta: [
      { title: "Shop Profile — XEROXIFY Shop" },
      {
        name: "description",
        content:
          "Update your shop name, contact details, working hours, pickup availability and delivery areas.",
      },
      { property: "og:title", content: "Shop Profile — XEROXIFY Shop" },
      { property: "og:description", content: "How customers see your print shop." },
    ],
  }),
  component: ShopProfile,
});

function ShopProfile() {
  const { activeShop, updateShop } = useStore();
  const shop = activeShop;

  const set = <K extends keyof typeof shop>(key: K, value: (typeof shop)[K]) =>
    updateShop(shop.id, (s) => ({ ...s, [key]: value }));

  return (
    <ShopShell
      title="Shop Profile"
      subtitle="This is exactly what customers see before choosing your shop."
      action={<Button onClick={() => toast.success("Shop profile saved")}>Save changes</Button>}
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card-surface p-5 md:p-6">
          <h2 className="text-base font-semibold">Shop details</h2>
          <div className="mt-5 space-y-4">
            <div>
              <Label htmlFor="name">Shop name</Label>
              <Input
                id="name"
                className="mt-1.5"
                value={shop.name}
                onChange={(e) => set("name", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="owner">Owner name</Label>
              <Input
                id="owner"
                className="mt-1.5"
                value={shop.ownerName}
                onChange={(e) => set("ownerName", e.target.value)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  className="mt-1.5"
                  value={shop.phone}
                  onChange={(e) => set("phone", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  className="mt-1.5"
                  value={shop.email}
                  onChange={(e) => set("email", e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><Label htmlFor="opening">Opening time</Label><Input id="opening" type="time" className="mt-1.5" value={shop.openingTime ?? ""} onChange={(e) => set("openingTime", e.target.value)} /></div>
              <div><Label htmlFor="closing">Closing time</Label><Input id="closing" type="time" className="mt-1.5" value={shop.closingTime ?? ""} onChange={(e) => set("closingTime", e.target.value)} /></div>
            </div>
            <div>
              <Label htmlFor="whatsapp">Shop WhatsApp number</Label>
              <Input
                id="whatsapp"
                className="mt-1.5"
                inputMode="tel"
                placeholder="e.g. +91 98765 43210"
                value={shop.whatsappNumber ?? ""}
                onChange={(e) => set("whatsappNumber", e.target.value)}
              />
              <p className="mt-1.5 text-xs text-muted-foreground">Customers can use this number to open WhatsApp after selecting their files.</p>
            </div>
            <div>
              <Label htmlFor="address">Shop address</Label>
              <Textarea
                id="address"
                className="mt-1.5"
                value={shop.address}
                onChange={(e) => set("address", e.target.value)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="hours">Working hours</Label>
                <Input
                  id="hours"
                  className="mt-1.5"
                  value={shop.hours}
                  onChange={(e) => set("hours", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="prep">Prep time (minutes)</Label>
                <Input
                  id="prep"
                  type="number"
                  className="mt-1.5"
                  value={shop.prepMinutes}
                  onChange={(e) => set("prepMinutes", Number(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card-surface p-5 md:p-6">
            <h2 className="text-base font-semibold">Fulfillment</h2>
            <div className="mt-4 divide-y divide-border">
              <div className="flex items-center justify-between gap-4 py-3">
                <div>
                  <Label className="text-sm font-medium">Accept pickup orders</Label>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Customers collect from your counter.
                  </p>
                </div>
                <Switch checked={shop.pickup} onCheckedChange={(v) => set("pickup", v)} />
              </div>
              <div className="flex items-center justify-between gap-4 py-3">
                <div>
                  <Label className="text-sm font-medium">Offer delivery</Label>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Charge a fee or offer free delivery above a value.
                  </p>
                </div>
                <Switch
                  checked={shop.delivery.enabled}
                  onCheckedChange={(v) => set("delivery", { ...shop.delivery, enabled: v })}
                />
              </div>
            </div>
            {shop.delivery.enabled && (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="fee">Delivery fee (₹)</Label>
                  <Input
                    id="fee"
                    type="number"
                    className="mt-1.5"
                    value={shop.delivery.fee}
                    onChange={(e) =>
                      set("delivery", { ...shop.delivery, fee: Number(e.target.value) || 0 })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="free">Free above (₹)</Label>
                  <Input
                    id="free"
                    type="number"
                    className="mt-1.5"
                    value={shop.delivery.freeAbove ?? 0}
                    onChange={(e) =>
                      set("delivery", {
                        ...shop.delivery,
                        freeAbove: Number(e.target.value) || null,
                      })
                    }
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="eta">Delivery ETA</Label>
                  <Input
                    id="eta"
                    className="mt-1.5"
                    value={shop.delivery.etaMinutes}
                    onChange={(e) =>
                      set("delivery", { ...shop.delivery, etaMinutes: e.target.value })
                    }
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="areas">Delivery areas (comma separated)</Label>
                  <Input
                    id="areas"
                    className="mt-1.5"
                    value={shop.delivery.areas.join(", ")}
                    onChange={(e) =>
                      set("delivery", {
                        ...shop.delivery,
                        areas: e.target.value.split(",").map((a) => a.trim()).filter(Boolean),
                      })
                    }
                  />
                </div>
              </div>
            )}
          </div>

          <div className="card-surface p-5 md:p-6">
            <h2 className="text-base font-semibold">Payment options</h2>
            <div className="mt-4 divide-y divide-border">
              {(
                [
                  ["Pay full amount online", "full"],
                  ["Pay advance online", "advance"],
                  ["Cash at pickup", "cashPickup"],
                  ["Cash on delivery", "cashDelivery"],
                ] as const
              ).map(([label, key]) => (
                <div key={key} className="flex items-center justify-between gap-4 py-3">
                  <Label className="text-sm font-medium">{label}</Label>
                  <Switch
                    checked={shop.payments[key]}
                    onCheckedChange={(v) => set("payments", { ...shop.payments, [key]: v })}
                  />
                </div>
              ))}
            </div>
            <div className="mt-4 max-w-xs"><Label htmlFor="advancePercent">Advance payment (%)</Label><Input id="advancePercent" type="number" min={0} max={100} className="mt-1.5" value={shop.payments.advancePercent} onChange={(e) => set("payments", { ...shop.payments, advancePercent: Math.min(100, Math.max(0, Number(e.target.value) || 0)) })} /><p className="mt-1.5 text-xs text-muted-foreground">Customers pay this percentage upfront when they choose Pay Advance.</p></div>
          </div>
        </div>
      </div>
    </ShopShell>
  );
}
