import { createFileRoute } from "@/lib/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { X, Image as ImageIcon, Info, Save, LoaderCircle, CheckCircle2 } from "lucide-react";
import { ShopShell } from "@/components/layout/ShopShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { Shop, ShopPaymentMethod } from "@/types";
import { useMyShop } from "@/lib/useMyShop";

export const Route = createFileRoute("/shop/profile")({
  head: () => ({
    meta: [
      { title: "Shop Profile — XEROXMATE Shop" },
      {
        name: "description",
        content:
          "Update your shop name, contact details, working hours, pickup availability and delivery areas.",
      },
      { property: "og:title", content: "Shop Profile — XEROXMATE Shop" },
      { property: "og:description", content: "How customers see your print shop." },
    ],
  }),
  component: ShopProfile,
});

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_SIZE_MB = 5;

function Required() {
  return <span className="ml-0.5 text-destructive">*</span>;
}

function ShopProfile() {
  const { updateShop } = useStore();
  const storeShop = useMyShop();

  // Edits are held in a local draft and only written to Firestore on Save.
  const [draft, setDraft] = useState<Shop>(storeShop);
  const shop = draft;
  const loadedShopIdRef = useRef(storeShop.id);

  const frontInputRef = useRef<HTMLInputElement>(null);
  const interiorInputRef = useRef<HTMLInputElement>(null);
  const snapshotRef = useRef<Shop>(storeShop);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [verifyingUpi, setVerifyingUpi] = useState(false);

  // Re-sync the draft when a different shop loads (e.g. the own shop arrives
  // asynchronously), while preserving unsaved edits for the same shop.
  useEffect(() => {
    if (loadedShopIdRef.current === storeShop.id) return;
    loadedShopIdRef.current = storeShop.id;
    setDraft(storeShop);
    snapshotRef.current = storeShop;
    setHasChanges(false);
  }, [storeShop]);

  useEffect(() => {
    const s = snapshotRef.current;
    const changed =
      shop.name !== s.name ||
      shop.ownerName !== s.ownerName ||
      shop.ownerPhone !== s.ownerPhone ||
      shop.phone !== s.phone ||
      shop.email !== s.email ||
      shop.workingDaysFrom !== s.workingDaysFrom ||
      shop.workingDaysTo !== s.workingDaysTo ||
      shop.openingTime !== s.openingTime ||
      shop.closingTime !== s.closingTime ||
      shop.addressLine1 !== s.addressLine1 ||
      shop.addressLine2 !== s.addressLine2 ||
      shop.city !== s.city ||
      shop.state !== s.state ||
      shop.zip !== s.zip ||
      shop.country !== s.country ||
      shop.pickup !== s.pickup ||
      shop.delivery.enabled !== s.delivery.enabled ||
      shop.delivery.fee !== s.delivery.fee ||
      shop.delivery.freeAbove !== s.delivery.freeAbove ||
      shop.delivery.etaMinutes !== s.delivery.etaMinutes ||
      JSON.stringify(shop.delivery.areas) !== JSON.stringify(s.delivery.areas) ||
      shop.payments.full !== s.payments.full ||
      shop.payments.advance !== s.payments.advance ||
      shop.payments.cashPickup !== s.payments.cashPickup ||
      shop.payments.cashDelivery !== s.payments.cashDelivery ||
      shop.shopPaymentMethod !== s.shopPaymentMethod ||
      shop.upiId !== s.upiId ||
      shop.upiVerified !== s.upiVerified ||
      shop.bankName !== s.bankName ||
      shop.bankAccountNumber !== s.bankAccountNumber ||
      shop.bankIfsc !== s.bankIfsc ||
      shop.bankBranch !== s.bankBranch ||
      shop.frontImage !== s.frontImage ||
      shop.interiorImage !== s.interiorImage;
    setHasChanges(changed);
  }, [shop]);

  const set = <K extends keyof Shop>(key: K, value: Shop[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const setDelivery = (patch: Partial<Shop["delivery"]>) =>
    set("delivery", { ...shop.delivery, ...patch });

  const setPayments = (patch: Partial<Shop["payments"]>) =>
    set("payments", { ...shop.payments, ...patch });

  function handleImageUpload(file: File, target: "frontImage" | "interiorImage") {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error("Only JPG, PNG, and WEBP images are allowed");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
      toast.error(`Image must be under ${MAX_IMAGE_SIZE_MB} MB`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      set(target, reader.result as string);
      toast.success(target === "frontImage" ? "Front image uploaded" : "Interior image uploaded");
    };
    reader.readAsDataURL(file);
  }

  function handleSave() {
    setSaving(true);

    // Shop Details
    if (!shop.name.trim()) { toast.error("Shop name is required"); setSaving(false); return; }
    if (!shop.ownerName.trim()) { toast.error("Owner name is required"); setSaving(false); return; }
    if (!shop.ownerPhone?.trim()) { toast.error("Owner phone number is required"); setSaving(false); return; }
    if (!shop.phone.trim()) { toast.error("Shop phone number is required"); setSaving(false); return; }
    if (!shop.openingTime || !shop.closingTime) { toast.error("Opening and closing times are required"); setSaving(false); return; }

    // Address
    if (!shop.addressLine1?.trim()) { toast.error("Address Line 1 is required"); setSaving(false); return; }
    if (!shop.city?.trim()) { toast.error("City is required"); setSaving(false); return; }

    // Fulfillment — at least one option required
    if (!shop.pickup && !shop.delivery.enabled) {
      toast.error("Enable at least one fulfillment option (Pickup or Delivery)");
      setSaving(false);
      return;
    }

    // Payment options — at least one option required
    const p = shop.payments;
    if (!p.full && !p.advance && !p.cashPickup && !p.cashDelivery) {
      toast.error("Enable at least one payment option");
      setSaving(false);
      return;
    }

    // Payout method — exactly one required
    if (!shop.shopPaymentMethod) {
      toast.error("Please select a payout method");
      setSaving(false);
      return;
    }
    if (shop.shopPaymentMethod === "upi" && !shop.upiId?.trim()) {
      toast.error("UPI ID is required when UPI is selected");
      setSaving(false);
      return;
    }
    if (shop.shopPaymentMethod === "upi" && shop.upiId?.trim() && !shop.upiVerified) {
      toast.error("Please verify your UPI ID before saving");
      setSaving(false);
      return;
    }
    if (shop.shopPaymentMethod === "bank_transfer") {
      if (!shop.bankName?.trim()) { toast.error("Bank name is required"); setSaving(false); return; }
      if (!shop.bankAccountNumber?.trim()) { toast.error("Account number is required"); setSaving(false); return; }
      if (!shop.bankIfsc?.trim()) { toast.error("IFSC code is required"); setSaving(false); return; }
      if (!shop.bankBranch?.trim()) { toast.error("Branch is required"); setSaving(false); return; }
    }

    // Images
    if (!shop.frontImage) { toast.error("Shop front image is required"); setSaving(false); return; }
    if (!shop.interiorImage) { toast.error("Shop interior image is required"); setSaving(false); return; }

    // Persist the draft to Firestore only now, on Save.
    updateShop(storeShop.id, () => ({ ...draft, id: storeShop.id }));
    snapshotRef.current = draft;
    setHasChanges(false);
    setSaving(false);
    toast.success("Shop profile saved");
  }

  return (
    <ShopShell
      title="Shop Profile"
      subtitle="This is exactly what customers see before choosing your shop."
    >
      <div className="grid gap-6 lg:grid-cols-2 mb-10">
        <div className="space-y-6 md:sticky md:top-4 md:self-start">
          {/* Shop Details — Compulsory for Setup */}
          <div className="card-surface p-5 md:p-6 ">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold">Shop Details</h2>
              <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">Required for Setup</span>
            </div>
            <div className="mt-5 space-y-4">
              <div>
                <Label htmlFor="name">Shop name <Required /></Label>
                <Input
                  id="name"
                  className="mt-1.5"
                  value={shop.name}
                  onChange={(e) => set("name", e.target.value)}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="owner">Owner name <Required /></Label>
                <Input
                  id="owner"
                  className="mt-1.5"
                  value={shop.ownerName}
                  onChange={(e) => set("ownerName", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="ownerPhone">Owner Phone Number <Required /></Label>
                <Input
                  id="ownerPhone"
                  className="mt-1.5"
                  type="tel"
                  value={shop.ownerPhone ?? ""}
                  onChange={(e) => set("ownerPhone", e.target.value)}
                />
              </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="phone">Shop Number <Required /></Label>
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
                <div>
                  <Label htmlFor="workingDaysFrom">Working days from</Label>
                  <select
                    id="workingDaysFrom"
                    className="mt-1.5 w-full rounded-md border bg-background px-3 py-2"
                    value={shop.workingDaysFrom}
                    onChange={(e) => set("workingDaysFrom", e.target.value)}
                  >
                    <option value="Monday">Monday</option>
                    <option value="Tuesday">Tuesday</option>
                    <option value="Wednesday">Wednesday</option>
                    <option value="Thursday">Thursday</option>
                    <option value="Friday">Friday</option>
                    <option value="Saturday">Saturday</option>
                    <option value="Sunday">Sunday</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="workingDaysTo">Working days to</Label>
                  <select
                    id="workingDaysTo"
                    className="mt-1.5 w-full rounded-md border bg-background px-3 py-2"
                    value={shop.workingDaysTo}
                    onChange={(e) => set("workingDaysTo", e.target.value)}
                  >
                    <option value="Monday">Monday</option>
                    <option value="Tuesday">Tuesday</option>
                    <option value="Wednesday">Wednesday</option>
                    <option value="Thursday">Thursday</option>
                    <option value="Friday">Friday</option>
                    <option value="Saturday">Saturday</option>
                    <option value="Sunday">Sunday</option>
                  </select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div><Label htmlFor="opening">Opening time <Required /></Label>
                <Input id="opening" type="time" className="mt-1.5 " value={shop.openingTime ?? ""} onChange={(e) => set("openingTime", e.target.value)} /></div>
                <div>
                  <Label htmlFor="closing">Closing time <Required /></Label>
                  <Input id="closing" type="time" className="mt-1.5" value={shop.closingTime ?? ""} onChange={(e) => set("closingTime", e.target.value)} /></div>
              </div>
            </div>
          </div>
          {/* Structured Address — Compulsory */}
          <div className="card-surface p-5 md:p-6">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold">Shop Address</h2>
              <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">Required for Setup</span>
            </div>
            <div className="mt-5 space-y-4">
              <div>
                <Label htmlFor="addressLine1">Address Line 1 <Required /></Label>
                <Input
                  id="addressLine1"
                  className="mt-1.5"
                  placeholder="Shop / Building number, Street name"
                  value={shop.addressLine1 ?? ""}
                  onChange={(e) => set("addressLine1", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="addressLine2">Area<Required /></Label>
                <Input
                  id="addressLine2"
                  className="mt-1.5"
                  placeholder="Landmark, Area "
                  value={shop.addressLine2 ?? ""}
                  onChange={(e) => set("addressLine2", e.target.value)}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="city">City <Required /></Label>
                  <Input
                    id="city"
                    className="mt-1.5"
                    value={shop.city ?? ""}
                    onChange={(e) => set("city", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="state">State <Required /></Label>
                  <Input
                    id="state"
                    className="mt-1.5"
                    value={shop.state ?? ""}
                    onChange={(e) => set("state", e.target.value)}
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="zip">Pin code <Required /></Label>
                  <Input
                    id="zip"
                    className="mt-1.5"
                    value={shop.zip ?? ""}
                    onChange={(e) => set("zip", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="country">Country <Required /></Label>
                  <Input
                    id="country"
                    className="mt-1.5"
                    value={shop.country ?? "India"}
                    onChange={(e) => set("country", e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Fulfillment — Always shown, at least one option required */}
          <div className="card-surface p-5 md:p-6">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold">Fulfillment</h2>
              <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">Required for Setup</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Select at least one fulfillment method.
            </p>
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
                  <Label className="text-sm font-medium">Delivery Options</Label>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Charge a fee or offer free delivery above a value.
                  </p>
                </div>
                <Switch
                  checked={shop.delivery.enabled}
                  onCheckedChange={(v) => setDelivery({ enabled: v })}
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
                    onChange={(e) => setDelivery({ fee: Number(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="free">Free above (₹)</Label>
                  <Input
                    id="free"
                    type="number"
                    className="mt-1.5"
                    value={shop.delivery.freeAbove ?? 0}
                    onChange={(e) => setDelivery({ freeAbove: Number(e.target.value) || null })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="eta">Delivery ETA</Label>
                  <Input
                    id="eta"
                    className="mt-1.5"
                    value={shop.delivery.etaMinutes}
                    onChange={(e) => setDelivery({ etaMinutes: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="areas">Delivery areas (comma separated)</Label>
                  <Input
                    id="areas"
                    className="mt-1.5"
                    value={shop.delivery.areas.join(", ")}
                    onChange={(e) =>
                      setDelivery({
                        areas: e.target.value.split(",").map((a) => a.trim()).filter(Boolean),
                      })
                    }
                  />
                </div>
              </div>
            )}
          </div>

          {/* Payment Options — Always shown, at least one option required */}
          <div className="card-surface p-5 md:p-6">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold">Payment Options</h2>
              <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">Required for Setup</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Select at least one payment method.
            </p>
            <div className="mt-4 divide-y divide-border">
              {(
                [
                  ["Pay full amount online", "full"],
                  ["Pay advance online", "advance"],
                  ["Pay at pickup", "cashPickup"],
                  ["Cash on delivery", "cashDelivery"],
                ] as const
              ).map(([label, key]) => (
                <div key={key} className="flex items-center justify-between gap-4 py-3">
                  <Label className="text-sm font-medium">{label}</Label>
                  <Switch
                    checked={shop.payments[key]}
                    onCheckedChange={(v) => setPayments({ [key]: v })}
                  />
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-border bg-secondary/50 px-4 py-3">
              <Info className="h-4 w-4 shrink-0 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Advance payment is fixed at <span className="font-semibold text-foreground">50%</span>
              </p>
            </div>
          </div>

          {/* Payout Method — Required for setup */}
          <div className="card-surface p-5 md:p-6">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold">Payout Method</h2>
              <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">Required for Setup</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              How you receive payments from XEROXMATE.
            </p>
            <div className="mt-4 space-y-3">
              {(
                [
                  { value: "upi" as ShopPaymentMethod, label: "UPI" },
                  { value: "bank_transfer" as ShopPaymentMethod, label: "Bank Transfer" },
                ] as const
              ).map((opt) => (
                <label
                  key={opt.value}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors",
                    shop.shopPaymentMethod === opt.value
                      ? "border-primary bg-primary-light"
                      : "border-border hover:bg-secondary",
                  )}
                >
                  <input
                    type="radio"
                    name="shopPaymentMethod"
                    checked={shop.shopPaymentMethod === opt.value}
                    onChange={() => set("shopPaymentMethod", opt.value)}
                    className="h-4 w-4 accent-primary"
                  />
                  <span className="text-sm font-medium">{opt.label}</span>
                </label>
              ))}
            </div>

            {shop.shopPaymentMethod === "upi" && (
              <div className="mt-4">
                <Label htmlFor="upiId">UPI ID <Required /></Label>
                <div className="mt-1.5 flex gap-2">
                  <Input
                    id="upiId"
                    className="flex-1"
                    placeholder="e.g. yourshop@upi"
                    value={shop.upiId ?? ""}
                    onChange={(e) => {
                      set("upiId", e.target.value);
                      if (shop.upiVerified) {
                        set("upiVerified", false);
                      }
                    }}
                  />
                  <Button
                    variant="outline"
                    type="button"
                    disabled={!shop.upiId?.trim() || verifyingUpi || shop.upiVerified}
                    onClick={() => {
                      setVerifyingUpi(true);
                      setTimeout(() => {
                        setVerifyingUpi(false);
                        set("upiVerified", true);
                        toast.success("UPI ID verified");
                      }, 1500);
                    }}
                  >
                    {verifyingUpi ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : shop.upiVerified ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      "Verify"
                    )}
                  </Button>
                </div>
                {shop.upiVerified && (
                  <p className="mt-1.5 text-xs text-green-600">Verified</p>
                )}
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Your UPI ID for receiving payouts.
                </p>
              </div>
            )}

            {shop.shopPaymentMethod === "bank_transfer" && (
              <div className="mt-4 space-y-3">
                <div>
                  <Label htmlFor="bankName">Bank Name <Required /></Label>
                  <Input
                    id="bankName"
                    className="mt-1.5"
                    value={shop.bankName ?? ""}
                    onChange={(e) => set("bankName", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="bankAccount">Account Number <Required /></Label>
                  <Input
                    id="bankAccount"
                    className="mt-1.5"
                    value={shop.bankAccountNumber ?? ""}
                    onChange={(e) => set("bankAccountNumber", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="bankIfsc">IFSC Code <Required /></Label>
                  <Input
                    id="bankIfsc"
                    className="mt-1.5"
                    placeholder="e.g. SBIN0001234"
                    value={shop.bankIfsc ?? ""}
                    onChange={(e) => set("bankIfsc", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="bankBranch">Branch <Required /></Label>
                  <Input
                    id="bankBranch"
                    className="mt-1.5"
                    value={shop.bankBranch ?? ""}
                    onChange={(e) => set("bankBranch", e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Shop Images — Required for setup */}
          <div className="card-surface p-5 md:p-6">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold">Shop Images</h2>
              <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">Required for Setup</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Both images are required. Upload clear photos of your shop.
            </p>

            <div className="mt-4 grid gap-6 sm:grid-cols-2">
              {/* Front Image */}
              <div>
                <Label>Shop Front Image <Required /></Label>
                <p className="mt-1 text-xs text-muted-foreground">Reference: A clear photo of your shop front / board.</p>
                <input
                  ref={frontInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file, "frontImage");
                    e.target.value = "";
                  }}
                />
                {shop.frontImage ? (
                  <div className="relative mt-2 overflow-hidden rounded-lg border border-border">
                    <img
                      src={shop.frontImage}
                      alt="Shop front"
                      className="h-40 w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => set("frontImage", undefined)}
                      className="absolute right-2 top-2 rounded-full bg-background/80 p-1 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => frontInputRef.current?.click()}
                      className="absolute bottom-2 right-2 rounded-md bg-background/80 px-2 py-1 text-xs font-medium hover:bg-background"
                    >
                      Replace
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => frontInputRef.current?.click()}
                    className="mt-2 flex h-40 w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-secondary/30 text-muted-foreground hover:border-primary hover:text-primary"
                  >
                    <ImageIcon className="h-8 w-8" />
                    <span className="mt-2 text-xs font-medium">Upload Front Image</span>
                  </button>
                )}
              </div>

              {/* Interior Image */}
              <div>
                <Label>Shop Interior Image <Required /></Label>
                <p className="mt-1 text-xs text-muted-foreground">Reference: A photo of your shop interior / counter area.</p>
                <input
                  ref={interiorInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file, "interiorImage");
                    e.target.value = "";
                  }}
                />
                {shop.interiorImage ? (
                  <div className="relative mt-2 overflow-hidden rounded-lg border border-border">
                    <img
                      src={shop.interiorImage}
                      alt="Shop interior"
                      className="h-40 w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => set("interiorImage", undefined)}
                      className="absolute right-2 top-2 rounded-full bg-background/80 p-1 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => interiorInputRef.current?.click()}
                      className="absolute bottom-2 right-2 rounded-md bg-background/80 px-2 py-1 text-xs font-medium hover:bg-background"
                    >
                      Replace
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => interiorInputRef.current?.click()}
                    className="mt-2 flex h-40 w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-secondary/30 text-muted-foreground hover:border-primary hover:text-primary"
                  >
                    <ImageIcon className="h-8 w-8" />
                    <span className="mt-2 text-xs font-medium">Upload Interior Image</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
        <p className="text-xs text-muted-foreground">
          {hasChanges ? "You have unsaved changes" : "No changes to save"}
        </p>
        <Button
          onClick={handleSave}
          disabled={!hasChanges || saving}
          className="gap-1.5"
        >
          {saving ? (
            <>
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </ShopShell>
  );
}
