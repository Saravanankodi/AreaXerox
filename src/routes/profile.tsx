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
import type { CustomerPayoutMethod } from "@/types";

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

function ProfilePage() {
  const { profile, addresses, updateProfile, saveAddress, deleteAddress } = useStore();
  const [form, setForm] = useState(profile);
  const [verifyingUpi, setVerifyingUpi] = useState(false);
  const [editingAddress, setEditingAddress] = useState(false);

  const firstAddress = addresses[0] ?? null;

  const [addrForm, setAddrForm] = useState({
    addressLine1: profile.addressLine1 ?? firstAddress?.house ?? "",
    addressLine2: profile.addressLine2 ?? firstAddress?.street ?? "",
    city: profile.city ?? firstAddress?.city ?? "",
    state: profile.state ?? "",
    zip: profile.zip ?? firstAddress?.pincode ?? "",
    country: profile.country ?? "India",
  });

  const setPayoutField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const setAddrField = <K extends keyof typeof addrForm>(key: K, value: (typeof addrForm)[K]) => {
    setAddrForm((a) => ({ ...a, [key]: value }));
  };

  const saveAddressFields = () => {
    if (!addrForm.addressLine1.trim() || !addrForm.city.trim() || !addrForm.state.trim() || !addrForm.zip.trim() || !addrForm.country.trim()) {
      toast.error("Fill in all required address fields.");
      return;
    }
    updateProfile({
      ...form,
      addressLine1: addrForm.addressLine1.trim(),
      addressLine2: addrForm.addressLine2.trim(),
      city: addrForm.city.trim(),
      state: addrForm.state.trim(),
      zip: addrForm.zip.trim(),
      country: addrForm.country.trim(),
    });
    if (firstAddress) {
      saveAddress({
        ...firstAddress,
        house: addrForm.addressLine1.trim(),
        street: addrForm.addressLine2.trim(),
        city: addrForm.city.trim(),
        pincode: addrForm.zip.trim(),
      });
    } else {
      saveAddress({
        id: `addr-${Date.now()}`,
        label: "Home",
        name: form.name,
        phone: form.phone,
        house: addrForm.addressLine1.trim(),
        street: addrForm.addressLine2.trim(),
        area: "",
        city: addrForm.city.trim(),
        pincode: addrForm.zip.trim(),
      });
    }
    setEditingAddress(false);
    toast.success("Address saved");
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
                    value={form[key]}
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

        <div className="card-surface p-5 md:p-6">
          <div className="flex items-center justify-between">
            <h2 className="inline-flex items-center gap-2 text-base font-semibold">
              <MapPin className="h-4 w-4 text-primary" /> Delivery addresses
            </h2>
            {firstAddress && !editingAddress && (
              <Button variant="outline" size="sm" onClick={() => setEditingAddress(true)}>
                <Pencil className="h-4 w-4" /> Edit
              </Button>
            )}
          </div>

          <div className="mt-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label className="text-xs font-semibold text-subtle">Address Line 1 *</Label>
                <Input
                  className="mt-2"
                  value={addrForm.addressLine1}
                  onChange={(e) => setAddrField("addressLine1", e.target.value)}
                  placeholder="House / Flat / Building"
                />
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs font-semibold text-subtle">Area </Label>
                <Input
                  className="mt-2"
                  value={addrForm.addressLine2}
                  onChange={(e) => setAddrField("addressLine2", e.target.value)}
                  placeholder="Street / Landmark"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold text-subtle">City *</Label>
                <Input
                  className="mt-2"
                  value={addrForm.city}
                  onChange={(e) => setAddrField("city", e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs font-semibold text-subtle">State *</Label>
                <Input
                  className="mt-2"
                  value={addrForm.state}
                  onChange={(e) => setAddrField("state", e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs font-semibold text-subtle">ZIP / Postal Code *</Label>
                <Input
                  className="mt-2"
                  value={addrForm.zip}
                  onChange={(e) => setAddrField("zip", e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs font-semibold text-subtle">Country *</Label>
                <Input
                  className="mt-2"
                  value={addrForm.country}
                  onChange={(e) => setAddrField("country", e.target.value)}
                />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <Button onClick={saveAddressFields}>Save address</Button>
              {firstAddress && (
                <Button
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={() => {
                    deleteAddress(firstAddress.id);
                    toast.success("Address removed");
                    setAddrForm({
                      addressLine1: "",
                      addressLine2: "",
                      city: "",
                      state: "",
                      zip: "",
                      country: "India",
                    });
                    setEditingAddress(false);
                  }}
                >
                  <Trash2 className="h-4 w-4" /> Remove
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </CustomerShell>
  );
}
