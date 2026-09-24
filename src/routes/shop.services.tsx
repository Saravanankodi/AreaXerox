import { createFileRoute, Link } from "@/lib/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Lock, ArrowRight, Save, LoaderCircle } from "lucide-react";
import { ShopShell } from "@/components/layout/ShopShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { useMyShop } from "@/lib/useMyShop";
import { inr } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import { isShopProfileComplete } from "@/lib/shop-status";
import type { PaperType, ServiceOption } from "@/types";

export const Route = createFileRoute("/shop/services")({
  head: () => ({
    meta: [
      { title: "Print Services & Pricing — XEROXMATE Shop" },
      {
        name: "description",
        content:
          "Turn paper types, colour printing, binding and finishing services on or off and set your own per-page pricing.",
      },
      { property: "og:title", content: "Print Services & Pricing — XEROXMATE Shop" },
      {
        property: "og:description",
        content: "Control exactly what customers can order from your shop.",
      },
    ],
  }),
  component: ShopServices,
});

function ShopServices() {
  const { updateShop } = useStore();
  const shop = useMyShop();

  const profileDone = isShopProfileComplete(shop);

  // Draft state — edits are held locally until the user clicks Save Changes
  const [draftPaperTypes, setDraftPaperTypes] = useState<PaperType[]>(shop.paperTypes);
  const [draftBinding, setDraftBinding] = useState<ServiceOption[]>(shop.binding);
  const [draftAdditional, setDraftAdditional] = useState<ServiceOption[]>(shop.additional);

  const [newPaperName, setNewPaperName] = useState("");
  const [newPaperPrice, setNewPaperPrice] = useState("");
  const [newPaperColorPrice, setNewPaperColorPrice] = useState("");
  const [showNewPaper, setShowNewPaper] = useState(false);

  const [newBindingName, setNewBindingName] = useState("");
  const [newBindingPrice, setNewBindingPrice] = useState("");
  const [showNewBinding, setShowNewBinding] = useState(false);

  const [saving, setSaving] = useState(false);

  // Re-sync drafts when the real shop arrives asynchronously (e.g. navigating
  // straight here before the own-shop listener resolves). Edits already in
  // progress are only ever preserved/overwritten when the shop id changes.
  const syncedShopIdRef = useRef(shop.id);
  useEffect(() => {
    if (syncedShopIdRef.current === shop.id) return;
    syncedShopIdRef.current = shop.id;
    setDraftPaperTypes(shop.paperTypes);
    setDraftBinding(shop.binding);
    setDraftAdditional(shop.additional);
  }, [shop]);

  const hasChanges =
    JSON.stringify(draftPaperTypes) !== JSON.stringify(shop.paperTypes) ||
    JSON.stringify(draftBinding) !== JSON.stringify(shop.binding) ||
    JSON.stringify(draftAdditional) !== JSON.stringify(shop.additional);

  if (!profileDone) {
    return (
      <ShopShell title="Print Services" subtitle="Set up paper types, pricing and finishing options.">
        <div className="card-surface flex flex-col items-center justify-center p-12 text-center">
          <Lock className="h-12 w-12 text-muted-foreground/40" />
          <h3 className="mt-4 text-lg font-semibold">Complete your shop profile first</h3>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            You need to finish setting up your shop profile before configuring printing services.
          </p>
          <Link to="/shop/profile">
            <Button className="mt-6 gap-1.5">
              Complete Shop Profile <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </ShopShell>
    );
  }

  function handleSave() {
    setSaving(true);
    // Simulate brief save delay
    setTimeout(() => {
      updateShop(shop.id, (s) => ({
        ...s,
        paperTypes: draftPaperTypes,
        binding: draftBinding,
        additional: draftAdditional,
      }));
      setSaving(false);
      toast.success("Print services saved");
    }, 300);
  }

  function addCustomPaper() {
    const name = newPaperName.trim();
    const bw = Number(newPaperPrice);
    const color = Number(newPaperColorPrice);
    const bwPrice = Number.isFinite(bw) && bw >= 0 ? bw : 0;
    const colorPrice = Number.isFinite(color) && color >= 0 ? color : 0;
    if (!name) {
      toast.error("Enter a paper type name");
      return;
    }
    if (bw < 0 || color < 0) {
      toast.error("Prices must be non-negative amounts");
      return;
    }
    const id = `custom-paper-${Date.now()}`;
    const newType: PaperType = {
      id,
      name,
      enabled: true,
      bwEnabled: true,
      bwPrice,
      colorEnabled: true,
      colorPrice,
      single: true,
      double: true,
    };
    setDraftPaperTypes((prev) => [...prev, newType]);
    setNewPaperName("");
    setNewPaperPrice("");
    setNewPaperColorPrice("");
    setShowNewPaper(false);
    toast.success(`${name} added (unsaved)`);
  }

  function removeCustomPaper(id: string) {
    setDraftPaperTypes((prev) => prev.filter((p) => p.id !== id));
    toast.success("Paper type removed (unsaved)");
  }

  function addCustomBinding() {
    const name = newBindingName.trim();
    const price = Number(newBindingPrice) || 0;
    if (!name) {
      toast.error("Enter a binding/finishing name");
      return;
    }
    if (price < 0) {
      toast.error("Price must be a non-negative amount");
      return;
    }
    const id = `custom-binding-${Date.now()}`;
    const newOpt: ServiceOption = { id, name, enabled: true, price };
    setDraftBinding((prev) => [...prev, newOpt]);
    setNewBindingName("");
    setNewBindingPrice("");
    setShowNewBinding(false);
    toast.success(`${name} added (unsaved)`);
  }

  function removeCustomBinding(id: string) {
    setDraftBinding((prev) => prev.filter((b) => b.id !== id));
    toast.success("Binding option removed (unsaved)");
  }

  const builtInPaperIds = new Set(["a4", "a3", "a5", "bond", "photo-4", "photo-8"]);
  const builtInBindingIds = new Set(["spiral", "soft", "hard"]);

  return (
    <ShopShell
      title="Print Services"
      subtitle="Everything you switch off here disappears from the customer ordering flow instantly."
    >
      <div className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Paper types & pricing */}
          <div className="card-surface p-5 md:p-6">
            <h2 className="text-base font-semibold">Paper types & pricing</h2>
            <p className="mt-1 text-sm text-muted-foreground">Prices are per page.</p>
            <div className="mt-5 space-y-3">
              {draftPaperTypes.map((p) => (
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
                        setDraftPaperTypes((prev) =>
                          prev.map((x) => (x.id === p.id ? { ...x, enabled: v } : x)),
                        );
                      }}
                    />
                    <div className="flex items-center gap-2">
                      <div>
                        <p className="text-sm font-semibold">{p.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {p.enabled ? "Available to customers" : "Hidden from customers"}
                        </p>
                      </div>
                      {!builtInPaperIds.has(p.id) && (
                        <button
                          type="button"
                          onClick={() => removeCustomPaper(p.id)}
                          className="ml-1 text-muted-foreground hover:text-destructive"
                          title="Remove"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-subtle">B/W PRICE</Label>
                    <Input
                      type="number"
                      className="mt-1.5 w-28"
                      value={p.bwPrice}
                      onChange={(e) =>
                        setDraftPaperTypes((prev) =>
                          prev.map((x) =>
                            x.id === p.id ? { ...x, bwPrice: Math.max(0, Number(e.target.value) || 0) } : x,
                          ),
                        )
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
                        setDraftPaperTypes((prev) =>
                          prev.map((x) =>
                            x.id === p.id ? { ...x, colorPrice: Math.max(0, Number(e.target.value) || 0) } : x,
                          ),
                        )
                      }
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Add New Paper Type */}
            {!showNewPaper ? (
              <Button variant="outline" size="sm" className="mt-4 gap-1.5" onClick={() => setShowNewPaper(true)}>
                + Add new
              </Button>
            ) : (
              <div className="mt-4 rounded-lg border border-border p-4 space-y-3">
                <p className="text-sm font-semibold">New paper type</p>
                <div>
                  <Label htmlFor="newPaperName">Name</Label>
                  <Input
                    id="newPaperName"
                    className="mt-1.5"
                    placeholder="e.g. Executive, Glossy"
                    value={newPaperName}
                    onChange={(e) => setNewPaperName(e.target.value)}
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="newPaperPrice">B/W Price (per page)</Label>
                    <Input
                      id="newPaperPrice"
                      type="number"
                      min="0"
                      className="mt-1.5"
                      value={newPaperPrice}
                      onChange={(e) => setNewPaperPrice(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="newPaperColorPrice">Colour Price (per page)</Label>
                    <Input
                      id="newPaperColorPrice"
                      type="number"
                      min="0"
                      className="mt-1.5"
                      value={newPaperColorPrice}
                      onChange={(e) => setNewPaperColorPrice(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={addCustomPaper}>Add</Button>
                  <Button size="sm" variant="outline" onClick={() => { setShowNewPaper(false); setNewPaperName(""); setNewPaperPrice(""); setNewPaperColorPrice(""); }}>Cancel</Button>
                </div>
              </div>
            )}
          </div>

          {/* Binding & finishing */}
          <div className="card-surface p-5 md:p-6 md:sticky md:top-14 md:self-start">
            <h2 className="text-base font-semibold">Binding & finishing</h2>
            <div className="mt-6 space-y-5">
              {draftBinding.map((b) => (
                <div key={b.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                  <Switch
                    checked={b.enabled}
                    onCheckedChange={(v) =>
                      setDraftBinding((prev) =>
                        prev.map((x) => (x.id === b.id ? { ...x, enabled: v } : x)),
                      )
                    }
                  />
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{b.name}</p>
                    {!builtInBindingIds.has(b.id) && (
                      <button
                        type="button"
                        onClick={() => removeCustomBinding(b.id)}
                        className="text-muted-foreground hover:text-destructive"
                        title="Remove"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <Input
                    type="number"
                    min="0"
                    className="ml-auto w-24"
                    value={b.price}
                    onChange={(e) =>
                      setDraftBinding((prev) =>
                        prev.map((x) =>
                          x.id === b.id ? { ...x, price: Math.max(0, Number(e.target.value) || 0) } : x,
                        ),
                      )
                    }
                  />
                </div>
              ))}
              {draftAdditional.map((a) => (
                <div key={a.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                  <Switch
                    checked={a.enabled}
                    onCheckedChange={(v) =>
                      setDraftAdditional((prev) =>
                        prev.map((x) =>
                          x.id === a.id ? { ...x, enabled: v } : x,
                        ),
                      )
                    }
                  />
                  <div>
                    <p className="text-sm font-medium">{a.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.perPage ? "Charged per page" : "Charged per document set"} · {inr(a.price)}
                    </p>
                  </div>
                  <Input
                    type="number"
                    min="0"
                    className="ml-auto w-24"
                    value={a.price}
                    onChange={(e) =>
                      setDraftAdditional((prev) =>
                        prev.map((x) =>
                          x.id === a.id ? { ...x, price: Math.max(0, Number(e.target.value) || 0) } : x,
                        ),
                      )
                    }
                  />
                </div>
              ))}
            </div>

            {/* Add New Binding/Finishing */}
            {!showNewBinding ? (
              <Button variant="outline" size="sm" className="mt-4 gap-1.5" onClick={() => setShowNewBinding(true)}>
                + Add new
              </Button>
            ) : (
              <div className="mt-4 rounded-lg border border-border p-4 space-y-3">
                <p className="text-sm font-semibold">New binding / finishing</p>
                <div>
                  <Label htmlFor="newBindingName">Name</Label>
                  <Input
                    id="newBindingName"
                    className="mt-1.5"
                    placeholder="e.g. Custom Cover, Booklet"
                    value={newBindingName}
                    onChange={(e) => setNewBindingName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="newBindingPrice">Price (₹)</Label>
                  <Input
                    id="newBindingPrice"
                    type="number"
                    className="mt-1.5"
                    value={newBindingPrice}
                    onChange={(e) => setNewBindingPrice(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={addCustomBinding}>Add</Button>
                  <Button size="sm" variant="outline" onClick={() => { setShowNewBinding(false); setNewBindingName(""); setNewBindingPrice(""); }}>Cancel</Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Save Changes Button — bottom of page */}
        <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
          <p className="text-xs text-muted-foreground">
            {hasChanges ? "You have unsaved changes" : "No changes to save"}
          </p>
          <Button onClick={handleSave} disabled={!hasChanges || saving} className="gap-1.5">
            {saving ? (
              <><LoaderCircle className="h-4 w-4 animate-spin" /> Saving...</>
            ) : (
              <><Save className="h-4 w-4" /> Save Changes</>
            )}
          </Button>
        </div>
      </div>
    </ShopShell>
  );
}
