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
  fetchCashfreeOnboardingStatus,
  startCashfreeOnboarding,
} from "@/services/cashfree.service";
import {
  fetchRazorpayCategories,
  fetchRazorpayOnboardingStatus,
  startRazorpayOnboarding,
  type CategoryOption,
  type OnboardingStartPayload,
} from "@/services/razorpay.service";
import { RAZORPAY_CATEGORIES } from "@/lib/razorpay/categories";
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
  processing: "Your account details are being processed.",
  under_review: "Your vendor account is under review.",
  needs_clarification: "More details are needed before activating payouts.",
  activated: "Your vendor account is active. New orders will be split automatically.",
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
    category: "stationery and printing",
    subcategory: "printing and stationery",
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
    accountNumber: shop.bankAccountNumber ?? "",
    ifscCode: shop.bankIfsc ?? "",
    beneficiaryName: shop.name ?? "",
  };
}

export function PayoutsManager({ shop }: { shop: Shop }) {
  const activeGateway = (
    process.env.NEXT_PUBLIC_PAYMENT_GATEWAY ?? "cashfree"
  ).toLowerCase();

  const [categories, setCategories] = useState<CategoryOption[]>(RAZORPAY_CATEGORIES);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Status calculation for active gateway
  const status =
    activeGateway === "cashfree"
      ? (shop.cashfreeOnboardingStatus ?? (shop.payoutEnabled ? "activated" : "not_started"))
      : ((shop.razorpayOnboardingStatus ?? "not_started") as RazorpayOnboardingStatus);

  const active = shop.payoutEnabled || status === "activated";

  useEffect(() => {
    if (activeGateway === "razorpay") {
      fetchRazorpayCategories()
        .then((res) => setCategories(res.categories))
        .catch(() => setCategories(RAZORPAY_CATEGORIES));
    }
  }, [activeGateway]);

  const [form, setForm] = useState<PayoutForm>(() => buildInitialForm(shop));

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      if (activeGateway === "cashfree") {
        const result = await fetchCashfreeOnboardingStatus(shop.id);
        toast.success(
          result.payoutEnabled
            ? "Cashfree Easy Split payouts are active."
            : `Status refreshed: ${STATUS_COPY[result.onboardingStatus] || result.onboardingStatus}`
        );
      } else {
        const result = await fetchRazorpayOnboardingStatus(shop.id);
        toast.success(
          result.onboardingStatus === "activated"
            ? "Payouts are active."
            : `Status refreshed: ${STATUS_COPY[result.onboardingStatus]}`
        );
      }
    } catch (error) {
      toast.error((error as Error).message || "Could not refresh payout status.");
    } finally {
      setRefreshing(false);
    }
  };

  const handleSubmit = async () => {
    if (submitting) return;

    if (!form.accountNumber.trim() || !form.ifscCode.trim()) {
      toast.error("Settlement bank account number and IFSC code are required.");
      return;
    }
    if (!form.email.trim() || !form.phone.trim()) {
      toast.error("Contact email and phone are required.");
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

    if (form.pan.trim() && !PAN_PATTERN.test(form.pan.trim().toUpperCase())) {
      toast.error("PAN must be in the format ABCDE1234F.");
      return;
    }

    /* -----------------------------------------------------
     * CASHFREE EASY SPLIT ONBOARDING
     * --------------------------------------------------- */
    if (activeGateway === "cashfree") {
      setSubmitting(true);
      toast.loading("Setting up Cashfree Easy Split payouts…", { id: "payout-onboarding" });
      try {
        const res = await startCashfreeOnboarding({
          shopId: shop.id,
          email: form.email.trim(),
          phone: form.phone.trim(),
          contactName: form.contactName.trim() || shop.ownerName,
          legalBusinessName: form.legalBusinessName.trim() || shop.name,
          pan: form.pan.trim().toUpperCase() || undefined,
          bankAccountNumber: form.accountNumber.trim(),
          bankIfsc: form.ifscCode.trim().toUpperCase(),
          accountHolder: form.beneficiaryName.trim() || form.contactName.trim() || shop.name,
        });

        toast.success(
          res.payoutEnabled
            ? "Cashfree Easy Split vendor account activated!"
            : "Cashfree vendor submitted successfully.",
          { id: "payout-onboarding" }
        );
      } catch (error) {
        console.error("Cashfree onboarding error:", error);
        toast.error((error as Error).message || "Payout setup failed. Please try again.", {
          id: "payout-onboarding",
        });
      } finally {
        setSubmitting(false);
      }
      return;
    }

    /* -----------------------------------------------------
     * RAZORPAY ROUTE ONBOARDING
     * --------------------------------------------------- */
    if (!form.pan || !form.ownerPan) {
      toast.error("Business PAN and owner PAN are required for Razorpay Route.");
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
      category: form.category || "stationery and printing",
      subcategory: form.subcategory || "printing and stationery",
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
            <Wallet className="h-4 w-4 text-primary" />{" "}
            {activeGateway === "cashfree" ? "Cashfree Easy Split Payouts" : "Razorpay Payouts"}
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Receive your share of every online order as an automated transfer to your bank account.{" "}
            {activeGateway === "cashfree"
              ? "XEROXMATE uses Cashfree Easy Split vendor payouts for automated settlements."
              : "XEROXMATE uses Razorpay Route linked accounts for KYC-compliant payouts."}
          </p>
        </div>
        {(shop.cashfreeVendorId || shop.razorpayAccountId) && (
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
        className={`mt-5 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${active
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
          {shop.cashfreeVendorId && (
            <p className="mt-1 font-mono text-xs opacity-80">Cashfree Vendor ID: {shop.cashfreeVendorId}</p>
          )}
          {shop.razorpayAccountId && !shop.cashfreeVendorId && (
            <p className="mt-1 font-mono text-xs opacity-80">Linked account: {shop.razorpayAccountId}</p>
          )}
        </div>
      </div>

      {active ? (
        <div className="mt-6 space-y-4 text-sm text-muted-foreground">
          <p className="inline-flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-success" />
            Customers pay online and your share is transferred automatically to your bank account — no manual
            settlement needed.
          </p>
          <p>
            Settlement bank detail verification is handled by{" "}
            {activeGateway === "cashfree" ? "Cashfree Payments" : "Razorpay"}. If you change your bank details, submit the updated account below.
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

              {activeGateway === "razorpay" && (
                <>
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
                </>
              )}

              <Field label="Business PAN (optional)">
                <Input value={form.pan} onChange={(e) => set("pan")(e.target.value)} placeholder="ABCDE1234F" />
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
              Your payout share is transferred directly to this account for each captured online order.
            </p>
          </section>

          <Button className="w-full sm:w-auto" size="lg" onClick={handleSubmit} disabled={submitting}>
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
            {submitting
              ? "Submitting onboarding…"
              : shop.cashfreeVendorId || shop.razorpayAccountId
                ? "Update payout details"
                : "Set up automated payouts"}
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