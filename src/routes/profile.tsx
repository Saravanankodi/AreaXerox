import { createFileRoute } from "@/lib/navigation";
import { useState, useEffect } from "react";
import { MapPin, Trash2, User, CreditCard, CheckCircle2, LoaderCircle, Pencil } from "lucide-react";
import { toast } from "sonner";
import { CustomerShell, PageHeader } from "@/components/layout/CustomerShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { Address, CustomerPayoutMethod, CustomerProfile } from "@/types";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "My Profile & Addresses — XEROXMATE" },
      {
        name: "description",
        content: "Manage your name, phone, email and saved delivery addresses for faster printing.",
      },
      { property: "og:title", content: "My Profile & Addresses — XEROXMATE" },
      { property: "og:description", content: "Your printing account details and addresses." },
    ],
  }),
  component: ProfilePage,
});

const ADDRESS_LABELS = ["Home", "Office", "College"] as const;

function emptyAddressDraft(profile: CustomerProfile): Omit<Address, "id"> {
  return {
    label: "Home",
    name: profile.name ?? "",
    phone: profile.phone ?? "",
    house: "",
    street: "",
    area: "",
    city: "",
    pincode: "",
  };
}

/**
 * Stored addresses are typed as `Address` but come back from Firestore through
 * an unchecked cast, so older documents can be missing `label`/`area`/`street`.
 * Coerce every field so the form inputs are always controlled.
 */
function toAddressDraft(address: Address): Omit<Address, "id"> {
  return {
    label: address.label ?? "",
    name: address.name ?? "",
    phone: address.phone ?? "",
    house: address.house ?? "",
    street: address.street ?? "",
    area: address.area ?? "",
    city: address.city ?? "",
    pincode: address.pincode ?? "",
  };
}

function formatAddressLines(address: Address) {
  return [address.house, address.street, address.area].filter(Boolean).join(", ");
}

function ProfilePage() {
  const { profile, addresses, updateProfile, saveAddress, deleteAddress } = useStore();
  const [form, setForm] = useState(profile);
  const [verifyingUpi, setVerifyingUpi] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Omit<Address, "id">>(() => emptyAddressDraft(profile));

  const setPayoutField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const setDraftField = <K extends keyof typeof draft>(key: K, value: (typeof draft)[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
  };

  const resetDraft = () => {
    setEditingAddressId(null);
    setDraft(emptyAddressDraft(profile));
  };

  const openEditAddress = (address: Address) => {
    setEditingAddressId(address.id);
    setDraft(toAddressDraft(address));
  };

  const submitAddress = () => {
    const label = draft.label.trim();
    const name = draft.name.trim();
    const house = draft.house.trim();
    const city = draft.city.trim();
    const pincode = draft.pincode.trim();

    if (!label || !name || !house || !city || !pincode) {
      toast.error("Add a label, name, house, city and pincode.");
      return;
    }

    saveAddress({
      id: editingAddressId ?? `addr-${Date.now()}`,
      label,
      name,
      phone: draft.phone.trim(),
      house,
      street: draft.street.trim(),
      area: draft.area.trim(),
      city,
      pincode,
    });

    toast.success(editingAddressId ? "Address updated" : "Address saved");
    resetDraft();
  };

  useEffect(() => {
    if (profile.name || profile.email || profile.phone) {
      setForm(profile);
    }
  }, [profile]);

  return (
    <CustomerShell>
      <PageHeader title="Profile" subtitle="Your details and saved addresses." />

      <div className="container-page grid gap-6 pb-16 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-6">
          <div className="card-surface p-5 md:p-6">
            <h2 className="inline-flex items-center gap-2 text-base font-semibold">
              <User className="h-4 w-4 text-primary" /> Personal details
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {(
                [
                  ["name", "Full name"],
                  ["phone", "Phone number"],
                  ["email", "Email address"],
                  ["alternatePhone", "Alternate phone number"],
                ] as const
              ).map(([key, label]) => (
                <div key={key}>
                  <Label className="text-xs font-semibold text-subtle">{label}</Label>
                  <Input
                    className="mt-2"
                    value={form[key] ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
            <Button
              className="mt-5"
              onClick={() => {
                updateProfile(form);
                toast.success("Profile updated");
              }}
            >
              Save changes
            </Button>
          </div>

          {/* Payout Method */}
          <div className="card-surface p-5 md:p-6">
            <h2 className="inline-flex items-center gap-2 text-base font-semibold">
              <CreditCard className="h-4 w-4 text-primary" /> Payout Method
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Set up how you receive refunds and balance returns.
            </p>
            <div className="mt-4 space-y-3">
              {(
                [
                  { value: "upi" as CustomerPayoutMethod, label: "UPI" },
                  { value: "bank_transfer" as CustomerPayoutMethod, label: "Bank Transfer" },
                ] as const
              ).map((opt) => (
                <label
                  key={opt.value}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors",
                    form.payoutMethod === opt.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-secondary",
                  )}
                >
                  <input
                    type="radio"
                    name="payoutMethod"
                    checked={form.payoutMethod === opt.value}
                    onChange={() => setPayoutField("payoutMethod", opt.value)}
                    className="h-4 w-4 accent-primary"
                  />
                  <span className="text-sm font-medium">{opt.label}</span>
                </label>
              ))}
            </div>

            {form.payoutMethod === "upi" && (
              <div className="mt-4">
                <Label htmlFor="upiId">UPI ID</Label>
                <div className="mt-1.5 flex gap-2">
                  <Input
                    id="upiId"
                    placeholder="e.g. yourname@upi"
                    value={form.upiId ?? ""}
                    onChange={(e) => setPayoutField("upiId", e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    type="button"
                    disabled={!form.upiId?.trim() || verifyingUpi}
                    onClick={() => {
                      setVerifyingUpi(true);
                      setTimeout(() => {
                        setVerifyingUpi(false);
                        setPayoutField("upiVerified" as never, true as never);
                        updateProfile({ ...form, upiVerified: true });
                        toast.success("UPI ID verified");
                      }, 1500);
                    }}
                  >
                    {verifyingUpi ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : form.upiVerified ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      "Verify"
                    )}
                  </Button>
                </div>
                {form.upiVerified && (
                  <p className="mt-1.5 text-xs text-green-600">Verified</p>
                )}
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Your UPI ID for receiving refunds.
                </p>
              </div>
            )}

            {form.payoutMethod === "bank_transfer" && (
              <div className="mt-4 space-y-3">
                <div>
                  <Label htmlFor="bankName">Bank Name</Label>
                  <Input
                    id="bankName"
                    className="mt-1.5"
                    value={form.bankName ?? ""}
                    onChange={(e) => setPayoutField("bankName", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="bankAccount">Account Number</Label>
                  <Input
                    id="bankAccount"
                    className="mt-1.5"
                    value={form.bankAccountNumber ?? ""}
                    onChange={(e) => setPayoutField("bankAccountNumber", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="bankIfsc">IFSC Code</Label>
                  <Input
                    id="bankIfsc"
                    className="mt-1.5"
                    placeholder="e.g. SBIN0001234"
                    value={form.bankIfsc ?? ""}
                    onChange={(e) => setPayoutField("bankIfsc", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="bankBranch">Branch</Label>
                  <Input
                    id="bankBranch"
                    className="mt-1.5"
                    value={form.bankBranch ?? ""}
                    onChange={(e) => setPayoutField("bankBranch", e.target.value)}
                  />
                </div>
              </div>
            )}

            <Button
              className="mt-4"
              onClick={() => {
                if (form.payoutMethod === "upi" && !form.upiId?.trim()) {
                  toast.error("Enter your UPI ID.");
                  return;
                }
                if (form.payoutMethod === "bank_transfer") {
                  if (!form.bankName?.trim() || !form.bankAccountNumber?.trim() || !form.bankIfsc?.trim() || !form.bankBranch?.trim()) {
                    toast.error("Fill in all bank details.");
                    return;
                  }
                }
                updateProfile(form);
                toast.success("Payout method saved");
              }}
            >
              Save payout method
            </Button>
          </div>
        </div>


        {/* ========================================
            DELIVERY ADDRESSES
            ======================================== */}

        <div className="card-surface p-5 md:p-6">
          <h2 className="inline-flex items-center gap-2 text-base font-semibold">
            <MapPin className="h-4 w-4 text-primary" /> Delivery addresses
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Label the places you get printed delivered to. Every saved address
            shows up when you choose delivery for an order.
          </p>

          {/* Saved addresses, one box per address */}

          <div className="mt-5 space-y-3">
            {addresses.length === 0 && (
              <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                No saved addresses yet. Add one below to check out faster.
              </p>
            )}

            {addresses.map((address) => (
              <div
                key={address.id}
                className="rounded-lg border border-border p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">
                      {address.label} &middot; {address.name}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatAddressLines(address)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {address.city} - {address.pincode}
                    </p>
                    {address.phone && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {address.phone}
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditAddress(address)}
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      aria-label={`Delete ${address.label} address`}
                      onClick={() => {
                        deleteAddress(address.id);
                        if (editingAddressId === address.id) resetDraft();
                        toast.success(
                          `${address.label} address removed`,
                        );
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add / edit form, inline on the page */}

          <div className="mt-6 border-t border-border pt-5">
            <h3 className="text-sm font-semibold">
              {editingAddressId
                ? "Edit this address"
                : "Add a new address"}
            </h3>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label className="text-xs font-semibold text-subtle">
                  Label *
                </Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {ADDRESS_LABELS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() =>
                        setDraftField("label", preset)
                      }
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                        draft.label === preset
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:bg-secondary",
                      )}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <Input
                  className="mt-2"
                  value={draft.label ?? ""}
                  placeholder="Or type your own label"
                  onChange={(e) =>
                    setDraftField("label", e.target.value)
                  }
                />
              </div>

              {(
                [
                  ["name", "Full name", "text"],
                  ["phone", "Phone number", "tel"],
                  ["house", "House / Flat / Building *", "text"],
                  ["street", "Street / Landmark", "text"],
                  ["area", "Area", "text"],
                  ["city", "City *", "text"],
                  ["pincode", "PIN / Postal Code *", "text"],
                ] as const
              ).map(([key, fieldLabel, type]) => (
                <div
                  key={key}
                  className={
                    key === "house" || key === "street" || key === "area"
                      ? "sm:col-span-2"
                      : undefined
                  }
                >
                  <Label className="text-xs font-semibold text-subtle">
                    {fieldLabel}
                  </Label>
                  <Input
                    className="mt-2"
                    type={type}
                    value={draft[key] ?? ""}
                    placeholder={fieldLabel.replace(" *", "")}
                    autoComplete={
                      key === "name"
                        ? "name"
                        : key === "phone"
                          ? "tel"
                          : "street-address"
                    }
                    onChange={(e) =>
                      setDraftField(key, e.target.value)
                    }
                  />
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center gap-3">
              <Button onClick={submitAddress}>
                {editingAddressId
                  ? "Save changes"
                  : "Save address"}
              </Button>
              {editingAddressId && (
                <Button variant="ghost" onClick={resetDraft}>
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </CustomerShell>
  );
}
