import Razorpay from "razorpay";

import type { RazorpayOnboardingStatus, RazorpayRequirement } from "@/types";

/* =========================================================
 * CONFIG
 * ======================================================= */

const RAZORPAY_API_BASE = "https://api.razorpay.com";

const razorpayRef: { current: Razorpay | null } = { current: null };

export function getRazorpay(): Razorpay {
  if (razorpayRef.current) return razorpayRef.current;

  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    throw new Error(
      "Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env.local."
    );
  }

  razorpayRef.current = new Razorpay({ key_id, key_secret });
  return razorpayRef.current;
}

export function getRazorpayCredentials() {
  return {
    key_id: process.env.RAZORPAY_KEY_ID ?? "",
    key_secret: process.env.RAZORPAY_KEY_SECRET ?? "",
  };
}

export function getRazorpayWebhookSecret(): string {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error(
      "Razorpay webhook secret is missing. Add RAZORPAY_WEBHOOK_SECRET to .env.local."
    );
  }
  return secret;
}

/**
 * Platform commission applied to online payments before the shopkeeper's
 * Route transfer is created. e.g. `15` = 15%.
 */
export async function getPlatformCommissionPercent(): Promise<number> {
  const env = Number(process.env.PLATFORM_COMMISSION_PERCENT);
  const fallback = Number.isFinite(env) && env > 0 ? env : 15;

  try {
    const { getAdminFirestore } = await import("@/lib/firebase/admin");
    const snapshot = await getAdminFirestore().collection("platform").doc("settings").get();
    const value = snapshot.exists ? Number(snapshot.data()?.commissionPercent) : NaN;
    return Number.isFinite(value) && value >= 0 ? value : fallback;
  } catch {
    return fallback;
  }
}

/* =========================================================
 * MONEY HELPERS
 * ======================================================= */

export function rupeeToPaise(rupees: number): number {
  return Math.round((Number.isFinite(rupees) ? rupees : 0) * 100);
}

export function paiseToRupee(paise: number): number {
  return Math.round((Number.isFinite(paise) ? paise : 0)) / 100;
}

export interface PayoutSplit {
  /** Kept by the platform account on every captured online payment. */
  platformFeePaise: number;
  /** Transferred to the shopkeeper's linked account (less than the captured amount). */
  shopkeeperPaise: number;
}

/**
 * Splits a captured online payment between the platform (commission) and the
 * shopkeeper (Route transfer). Razorpay invalidates any Route transfer whose
 * amount equals the captured amount, so the platform always keeps at least
 * ₹0.01 (1 paise).
 */
export function computePayoutSplit(paidPaise: number, commissionPercent: number): PayoutSplit {
  const total = Math.max(0, Math.round(paidPaise));
  const percent = Math.min(100, Math.max(0, commissionPercent || 0));

  const platformFeePaise = Math.max(1, Math.round((total * percent) / 100));
  const shopkeeperPaise = Math.max(0, total - platformFeePaise);

  return { platformFeePaise, shopkeeperPaise };
}

/* =========================================================
 * RAW API CLIENT
 *
 * Used for endpoints the SDK does not wrap (categories-config).
 * ======================================================= */

export async function razorpayApiFetch<T>(
  path: string,
  options: { method?: string; body?: unknown } = {}
): Promise<T> {
  const { key_id, key_secret } = getRazorpayCredentials();
  const auth = "Basic " + Buffer.from(`${key_id}:${key_secret}`).toString("base64");

  const res = await fetch(`${RAZORPAY_API_BASE}${path}`, {
    method: options.method ?? "GET",
    headers: {
      Authorization: auth,
      "Content-Type": "application/json",
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const error = new Error(
      `Razorpay API error ${res.status}: ${JSON.stringify(data)?.slice(0, 500)}`
    ) as Error & { status?: number; body?: unknown };
    error.status = res.status;
    error.body = data;
    throw error;
  }

  return data as T;
}

/* =========================================================
 * STATUS MAPPING
 * ======================================================= */

export function mapActivationStatus(status?: string): RazorpayOnboardingStatus {
  switch (status) {
    case "activated":
      return "activated";
    case "needs_clarification":
      return "needs_clarification";
    case "under_review":
      return "under_review";
    case "pending":
      return "processing";
    default:
      // "requested" / "failed" / unknown
      return (status ?? "") === "failed" ? "failed" : "processing";
  }
}

export function toRequirements(
  requirements?: { field_reference?: string; reason_code?: string; status?: string }[]
): RazorpayRequirement[] {
  if (!Array.isArray(requirements)) return [];
  return requirements
    .filter((r) => r && typeof r.field_reference === "string")
    .map((r) => ({
      field_reference: r.field_reference as string,
      reason_code: r.reason_code,
      status: (r.status as RazorpayRequirement["status"]) ?? "required",
    }));
}

/* =========================================================
 * MASKING HELPERS (UI-safe display of stored data)
 * ======================================================= */

export function maskPan(pan?: string): string {
  const value = (pan ?? "").trim().toUpperCase();
  if (value.length < 8) return value;
  return `${value.slice(0, 2)}XXXXX${value.slice(-2)}`;
}

export function maskAccountNumber(accountNumber?: string | number): string {
  const value = String(accountNumber ?? "").trim();
  if (value.length < 4) return "****";
  return `•••• ${value.slice(-4)}`;
}

export function maskIfsc(ifsc?: string): string {
  const value = String(ifsc ?? "").trim().toUpperCase();
  if (value.length <= 4) return value;
  return `${value.slice(0, 4)}••••`;
}