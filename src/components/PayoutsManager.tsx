import { useEffect, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  Banknote,
  CheckCircle2,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

import { RAZORPAY_CATEGORIES } from "@/lib/razorpay/categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  fetchRazorpayCategories,
  fetchRazorpayOnboardingStatus,
  startRazorpayOnboarding,
  type CategoryOption,
  type OnboardingStartPayload,
} from "@/services/razorpay.service";
import type { RazorpayOnboardingStatus, Shop } from "@/types";

const BUSINESS_TYPES: { value: string; label: string }[] = [
  { value: "proprietorship", label: "Proprietorship" },
  { value: "partnership", label: "Partnership" },
  { value: "private_limited", label: "Private Limited" },
  { value: "public_limited", label: "Public Limited" },
  { value: "limited_liability_partnership", label: "LLP" },
  { value: "trust", label: "Trust" },
  { value: "non_profit", label: "Non-profit" },
  { value: "education", label: "Education" },
  { value: "society", label: "Society" },
  { value: "huf", label: "HUF" },
  { value: "individual", label: "Individual" },
];

const STATUS_COPY: Record<string, string> = {
  not_started: "Payouts are not set up yet.",
  processing: "Your linked account is being processed by Razorpay.",
  under_review: "Razorpay is reviewing your linked account.",
  needs_clarification: "Razorpay needs more details before activating payouts.",
  activated: "Your linked account is active. New orders can be paid out automatically.",
  failed: "Account activation failed. Please review your details and retry.",
};

const PAN_PATTERN = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const IFSC_PATTERN = /^[A-Z]{4}0[A-Z0-9]{6}$/;

type PayoutForm = ReturnType<typeof buildInitialForm>;

function buildInitialForm(shop: Shop) {
  return {
    email: shop.email ?? "",
    phone: shop.phone ?? "",
    contactName: shop.ownerName ?? "",
    legalBusinessName: shop.name ?? "",
    customerFacingBusinessName: shop.name ?? "",
    businessType: "proprietorship",
    category: "",
    subcategory: "",
    street1: shop.address ?? shop.shopAddress ?? "",
    street2: shop.addressLine2 ?? "",
    city: shop.city ?? "",
    state: shop.state ?? "",
    postalCode: shop.zip ?? "",
    pan: "",
    gst: "",
    ownerName: shop.ownerName ?? "",
    ownerEmail: shop.email ?? "",
    ownerPan: "",
    ownerPhone: shop.phone ?? "",
    accountNumber: "",
    ifscCode: "",
    beneficiaryName: shop.name ?? "",
  };
}

export function PayoutsManager({ shop }: { shop: Shop }) {
  const [categories, setCategories] = useState<CategoryOption[]>(RAZORPAY_CATEGORIES);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const status = (shop.razorpayOnboardingStatus ?? "not_started") as
    | RazorpayOnboardingStatus
    | "not_started";
  const active = status === "activated";

  useEffect(() => {
    fetchRazorpayCategories()
      .then((res) => setCategories(res.categories))
      .catch(() => setCategories(RAZORPAY_CATEGORIES));
  }, []);

  const [form, setForm] = useState<PayoutForm>(() => buildInitialForm(shop));

  // The parent renders us with `key={shop.id}`, so the form always seeds from
  // the current shop and resets when a different shop is viewed.

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      const result = await fetchRazorpayOnboardingStatus(shop.id);
      toast.success(
        result.onboardingStatus === "activated"
          ? "Payouts are active."
          : `Status refreshed: ${STATUS_COPY[result.onboardingStatus]}`
      );
    } catch (error) {
      toast.error((error as Error).message || "Could not refresh payout status.");
    } finally {
      setRefreshing(false);
    }
  };

  const handleSubmit = async () => {
    if (submitting) return;
    if (!form.pan || !form.ownerPan || !form.accountNumber || !form.ifscCode) {
      toast.error("Business PAN, owner PAN and settlement bank details are required.");
      return;
    }
    if (!form.email.trim() || !form.phone.trim()) {
      toast.error("Contact email and phone are required.");
      return;
    }
    if (!PAN_PATTERN.test(form.pan.trim().toUpperCase())) {
      toast.error("Business PAN must be in the format ABCDE1234F.");
      return;
    }
    if (!PAN_PATTERN.test(form.ownerPan.trim().toUpperCase())) {
      toast.error("Owner PAN must be in the format ABCDE1234F.");
      return;
    }
    if (!IFSC_PATTERN.test(form.ifscCode.trim().toUpperCase())) {
      toast.error("IFSC code must be in the format HDFC0001234.");
      return;
    }
    if (!/^\d{9,18}$/.test(form.accountNumber.trim())) {
      toast.error("Account number must be 9–18 digits.");
      return;
    }
    if (form.gst.trim() && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(form.gst.trim().toUpperCase())) {
      toast.error("GST number is not in a valid format.");
      return;
    }
    if (!form.category || !form.subcategory) {
      toast.error("Select a business category and subcategory.");
      return;
    }

    const payload: OnboardingStartPayload = {
      shopId: shop.id,
      email: form.email.trim(),
      phone: form.phone.trim(),
      contactName: form.contactName.trim(),
      legalBusinessName: form.legalBusinessName.trim(),
      customerFacingBusinessName: form.customerFacingBusinessName.trim(),
      businessType: form.businessType,
      category: form.category,
      subcategory: form.subcategory,
      address: {
        street1: form.street1.trim(),
        street2: form.street2.trim() || undefined,
        city: form.city.trim(),
        state: form.state.trim(),
        postalCode: form.postalCode.trim(),
        country: "IN",
      },
      pan: form.pan.trim().toUpperCase(),
      gst: form.gst.trim().toUpperCase() || undefined,
      owner: {
        name: form.ownerName.trim(),
        email: form.ownerEmail.trim(),
        pan: form.ownerPan.trim().toUpperCase(),
        phone: form.ownerPhone.trim(),
      },
      settlement: {
        accountNumber: form.accountNumber.trim(),
        ifscCode: form.ifscCode.trim().toUpperCase(),
        beneficiaryName: form.beneficiaryName.trim(),
      },
    };

    setSubmitting(true);
    toast.loading("Setting up automated payouts with Razorpay…", { id: "payout-onboarding" });
    try {
      await startRazorpayOnboarding(payload);
      toast.success("Payout setup submitted. Razorpay is reviewing your account.", {
        id: "payout-onboarding",
      });
    } catch (error) {
      console.error("Payout onboarding error:", error);
      toast.error((error as Error).message || "Payout setup failed. Please try again.", {
        id: "payout-onboarding",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCategory = categories.find((c) => c.category === form.category);

  return (
    <div className="card-surface p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="inline-flex items-center gap-2 text-base font-semibold">
            <Wallet className="h-4 w-4 text-primary" /> Razorpay Payouts
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Receive your share of every online order as an automated transfer to your bank
            account. XEROXMATE uses Razorpay Route linked accounts for KYC-compliant payouts.
          </p>
        </div>
        {shop.razorpayAccountId && (
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            {refreshing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Refresh status
          </Button>
        )}
      </div>

      {/* STATUS */}
      <div
        className={`mt-5 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
          active
            ? "border-success/30 bg-success-light text-success"
            : "border-amber-300/40 bg-amber-50 text-amber-800"
        }`}
      >
        {active ? (
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
        ) : (
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
        )}
        <div>
          <p className="font-semibold">
            {active ? "Payouts are active" : `Payout status: ${status.replace(/_/g, " ")}`}
          </p>
          <p className="mt-0.5 text-xs opacity-90">{STATUS_COPY[status] ?? STATUS_COPY.not_started}</p>
          {shop.razorpayAccountId && (
            <p className="mt-1 font-mono text-xs opacity-80">Linked account: {shop.razorpayAccountId}</p>
          )}
        </div>
      </div>

      {/* MISSING REQUIREMENTS */}
      {status === "needs_clarification" && shop.razorpayRequirements?.length ? (
        <div className="mt-4 rounded-xl border border-border bg-secondary/40 px-4 py-3 text-sm">
          <p className="font-semibold">Razorpay still needs</p>
          <ul className="mt-2 space-y-1">
            {shop.razorpayRequirements.map((req) => (
              <li key={req.field_reference} className="flex items-start gap-2 text-muted-foreground">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span className="font-mono text-xs">{req.field_reference}</span>
                <span>: {req.status ?? "required"}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {active ? (
        <div className="mt-6 space-y-4 text-sm text-muted-foreground">
          <p className="inline-flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-success" />
            Customers pay the platform and your share is transferred automatically — no manual
            settlement.
          </p>
          <p>
            Linked account bank detail verification is handled by Razorpay. If you change your
            settlement bank account, contact support to update it.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {/* BUSINESS DETAILS */}
          <section>
            <h3 className="text-sm font-semibold text-foreground">Business details</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label="Contact person name (owner)">
                <Input value={form.contactName} onChange={(e) => set("contactName")(e.target.value)} />
              </Field>
              <Field label="Contact email">
                <Input type="email" value={form.email} onChange={(e) => set("email")(e.target.value)} />
              </Field>
              <Field label="Contact phone">
                <Input value={form.phone} onChange={(e) => set("phone")(e.target.value)} />
              </Field>
              <Field label="Legal business name">
                <Input value={form.legalBusinessName} onChange={(e) => set("legalBusinessName")(e.target.value)} />
              </Field>
              <Field label="Business type">
                <Select value={form.businessType} onValueChange={set("businessType")}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BUSINESS_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Category (as per Razorpay)">
                <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v, subcategory: "" }))}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.category} value={c.category}>
                        {c.category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Subcategory">
                <Select value={form.subcategory} onValueChange={set("subcategory")}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Select subcategory" />
                  </SelectTrigger>
                  <SelectContent>
                    {(selectedCategory?.subcategories.length
                      ? selectedCategory.subcategories
                      : ["printing and stationery", "retail stores"]
                    ).map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Business PAN">
                <Input value={form.pan} onChange={(e) => set("pan")(e.target.value)} placeholder="ABCDE1234F" />
              </Field>
              <Field label="GST number (optional)">
                <Input value={form.gst} onChange={(e) => set("gst")(e.target.value)} placeholder="22AAAAA0000A1Z5" />
              </Field>
            </div>
          </section>

          {/* REGISTERED ADDRESS */}
          <section>
            <h3 className="text-sm font-semibold text-foreground">Registered business address</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label="Street line 1">
                <Input value={form.street1} onChange={(e) => set("street1")(e.target.value)} />
              </Field>
              <Field label="Street line 2">
                <Input value={form.street2} onChange={(e) => set("street2")(e.target.value)} />
              </Field>
              <Field label="City">
                <Input value={form.city} onChange={(e) => set("city")(e.target.value)} />
              </Field>
              <Field label="State">
                <Input value={form.state} onChange={(e) => set("state")(e.target.value)} />
              </Field>
              <Field label="PIN code">
                <Input value={form.postalCode} onChange={(e) => set("postalCode")(e.target.value)} />
              </Field>
            </div>
          </section>

          {/* OWNER KYC */}
          <section>
            <h3 className="text-sm font-semibold text-foreground">Owner / stakeholder KYC</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label="Owner name (as per PAN)">
                <Input value={form.ownerName} onChange={(e) => set("ownerName")(e.target.value)} />
              </Field>
              <Field label="Owner PAN">
                <Input value={form.ownerPan} onChange={(e) => set("ownerPan")(e.target.value)} placeholder="ABCDE1234F" />
              </Field>
              <Field label="Owner email">
                <Input type="email" value={form.ownerEmail} onChange={(e) => set("ownerEmail")(e.target.value)} />
              </Field>
            </div>
          </section>

          {/* SETTLEMENT BANK */}
          <section>
            <h3 className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
              <Banknote className="h-4 w-4 text-primary" /> Settlement bank account
            </h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label="Beneficiary name (as per bank)">
                <Input value={form.beneficiaryName} onChange={(e) => set("beneficiaryName")(e.target.value)} />
              </Field>
              <Field label="Account number">
                <Input value={form.accountNumber} onChange={(e) => set("accountNumber")(e.target.value)} inputMode="numeric" />
              </Field>
              <Field label="IFSC code">
                <Input value={form.ifscCode} onChange={(e) => set("ifscCode")(e.target.value)} placeholder="HDFC0001234" />
              </Field>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Your payout share is transferred to this account after each captured payment.
              These details are sent directly to Razorpay and are shown only to you.
            </p>
          </section>

          <Button className="w-full sm:w-auto" size="lg" onClick={handleSubmit} disabled={submitting}>
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
            {submitting ? "Submitting to Razorpay…" : shop.razorpayAccountId ? "Update payout details" : "Set up automated payouts"}
          </Button>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <Label className="text-xs font-semibold text-subtle">{label}</Label>
      <div className="mt-1">{children}</div>
    </div>
  );
}