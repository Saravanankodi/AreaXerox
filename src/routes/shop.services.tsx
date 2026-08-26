import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { ShopShell } from "@/components/layout/ShopShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useStore } from "@/lib/store";
import { inr } from "@/lib/pricing";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/shop/services")({
  head: () => ({
    meta: [
      { title: "Print Services & Pricing — Order My Xerox Shop" },
      {
        name: "description",
        content:
          "Turn paper types, colour printing, binding and finishing services on or off and set your own per-page pricing.",
      },
      { property: "og:title", content: "Print Services & Pricing — Order My Xerox Shop" },
      {
        property: "og:description",
        content: "Control exactly what customers can order from your shop.",
      },
    ],
  }),
  component: ShopServices,
});

function ShopServices() {
  const { activeShop, updateShop } = useStore();
  const shop = activeShop;

  return (
    <ShopShell
      title="Print Services"
      subtitle="Everything you switch off here disappears from the customer ordering flow instantly."
    >
      <div className="space-y-6">
        <div className="card-surface p-5 md:p-6">
          <h2 className="text-base font-semibold">Paper types & pricing</h2>
          <p className="mt-1 text-sm text-muted-foreground">Prices are per page.</p>
          <div className="mt-5 space-y-3">
            {shop.paperTypes.map((p) => (
              <div
                key={p.id}
                className={cn(
                  "grid gap-4 rounded-lg border border-border p-4 sm:grid-cols-[1fr_auto_auto]",
                  !p.enabled && "bg-secondary/50",
                )}
              >
                <div className="flex items-center gap-3">
                  <Switch
                    checked={p.enabled}
                    onCheckedChange={(v) => {
                      updateShop(shop.id, (s) => ({
                        ...s,
                        paperTypes: s.paperTypes.map((x) =>
                          x.id === p.id ? { ...x, enabled: v } : x,
                        ),
                      }));
                      toast.success(`${p.name} ${v ? "enabled" : "disabled"}`);
                    }}
                  />
                  <div>
                    <p className="text-sm font-semibold">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.enabled ? "Available to customers" : "Hidden from customers"}
                    </p>
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-semibold text-subtle">B/W PRICE</Label>
                  <Input
                    type="number"
                    className="mt-1.5 w-28"
                    value={p.bwPrice}
                    onChange={(e) =>
                      updateShop(shop.id, (s) => ({
                        ...s,
                        paperTypes: s.paperTypes.map((x) =>
                          x.id === p.id ? { ...x, bwPrice: Number(e.target.value) || 0 } : x,
                        ),
                      }))
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-subtle">COLOUR PRICE</Label>
                  <Input
                    type="number"
                    className="mt-1.5 w-28"
                    value={p.colorPrice}
                    onChange={(e) =>
                      updateShop(shop.id, (s) => ({
                        ...s,
                        paperTypes: s.paperTypes.map((x) =>
                          x.id === p.id ? { ...x, colorPrice: Number(e.target.value) || 0 } : x,
                        ),
                      }))
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="card-surface p-5 md:p-6">
            <h2 className="text-base font-semibold">Print capabilities</h2>
            <div className="mt-4 divide-y divide-border">
              {(
                [
                  ["Black & White printing", shop.printTypes.bw, (v: boolean) => ({ printTypes: { ...shop.printTypes, bw: v } })],
                  ["Colour printing", shop.printTypes.color, (v: boolean) => ({ printTypes: { ...shop.printTypes, color: v } })],
                  ["Single side", shop.printSides.single, (v: boolean) => ({ printSides: { ...shop.printSides, single: v } })],
                  ["Double side", shop.printSides.double, (v: boolean) => ({ printSides: { ...shop.printSides, double: v } })],
                  ["Portrait", shop.orientation.portrait, (v: boolean) => ({ orientation: { ...shop.orientation, portrait: v } })],
                  ["Landscape", shop.orientation.landscape, (v: boolean) => ({ orientation: { ...shop.orientation, landscape: v } })],
                ] as const
              ).map(([label, value, patch]) => (
                <div key={label} className="flex items-center justify-between gap-4 py-3">
                  <Label className="text-sm font-medium">{label}</Label>
                  <Switch
                    checked={value}
                    onCheckedChange={(v) => updateShop(shop.id, (s) => ({ ...s, ...patch(v) }))}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="card-surface p-5 md:p-6">
            <h2 className="text-base font-semibold">Binding & finishing</h2>
            <div className="mt-4 space-y-3">
              {shop.binding.map((b) => (
                <div key={b.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                  <Switch
                    checked={b.enabled}
                    onCheckedChange={(v) =>
                      updateShop(shop.id, (s) => ({
                        ...s,
                        binding: s.binding.map((x) => (x.id === b.id ? { ...x, enabled: v } : x)),
                      }))
                    }
                  />
                  <p className="text-sm font-medium">{b.name}</p>
                  <Input
                    type="number"
                    className="ml-auto w-24"
                    value={b.price}
                    onChange={(e) =>
                      updateShop(shop.id, (s) => ({
                        ...s,
                        binding: s.binding.map((x) =>
                          x.id === b.id ? { ...x, price: Number(e.target.value) || 0 } : x,
                        ),
                      }))
                    }
                  />
                </div>
              ))}
              {shop.additional.map((a) => (
                <div key={a.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                  <Switch
                    checked={a.enabled}
                    onCheckedChange={(v) =>
                      updateShop(shop.id, (s) => ({
                        ...s,
                        additional: s.additional.map((x) =>
                          x.id === a.id ? { ...x, enabled: v } : x,
                        ),
                      }))
                    }
                  />
                  <div>
                    <p className="text-sm font-medium">{a.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.perPage ? "Charged per page" : "Charged per copy"} · {inr(a.price)}
                    </p>
                  </div>
                  <Input
                    type="number"
                    className="ml-auto w-24"
                    value={a.price}
                    onChange={(e) =>
                      updateShop(shop.id, (s) => ({
                        ...s,
                        additional: s.additional.map((x) =>
                          x.id === a.id ? { ...x, price: Number(e.target.value) || 0 } : x,
                        ),
                      }))
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ShopShell>
  );
}
