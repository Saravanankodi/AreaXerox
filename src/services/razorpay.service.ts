import { auth } from "@/lib/firebase/auth";
import type {
  RazorpayOnboardingStatus,
  RazorpayRequirement,
} from "@/types";

/* =========================================================
 * AUTH
 * ======================================================= */

async function getFirebaseIdToken(): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error("You must be signed in.");
  return user.getIdToken();
}

async function apiFetch<T>(path: string, body?: unknown): Promise<T> {
  const token = await getFirebaseIdToken();
  const res = await fetch(path, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const message =
      (data as { error?: string } | null)?.error || "Request failed. Please try again.";
    throw new Error(message);
  }

  return data as T;
}

/* =========================================================
 * TYPES
 * ======================================================= */

export interface CheckoutSession {
  orderId: string;
  key_id?: string;
  razorpayOrderId?: string;
  amountPaise: number;
  currency: string;
  name: string;
  description?: string;
  prefill?: { contact?: string; name?: string; email?: string };
  notes?: Record<string, string>;
  paymentStatus?: string;
  paid?: boolean;
  resume?: boolean;
  error?: string;
}

export interface OnboardingStartPayload {
  shopId: string;
  email: string;
  phone: string;
  contactName: string;
  legalBusinessName: string;
  customerFacingBusinessName?: string;
  businessType: string;
  category: string;
  subcategory: string;
  address: {
    street1: string;
    street2?: string;
    city: string;
    state: string;
    postalCode: string;
    country?: string;
  };
  pan?: string;
  gst?: string;
  owner: {
    name: string;
    email: string;
    pan: string;
    phone?: string;
  };
  settlement?: {
    accountNumber: string;
    ifscCode: string;
    beneficiaryName: string;
  };
}

export interface OnboardingStatusResult {
  shopId: string;
  accountId: string | null;
  productId: string | null;
  onboardingStatus: RazorpayOnboardingStatus | "not_started";
  payoutEnabled: boolean;
  requirements: RazorpayRequirement[];
}

export interface CategoryOption {
  category: string;
  subcategories: string[];
}

/* =========================================================
 * CHECKOUT
 * ======================================================= */

export function createCheckoutSession(orderId: string): Promise<CheckoutSession> {
  return apiFetch<CheckoutSession>("/api/razorpay/checkout/create", { orderId });
}

export function verifyCheckoutPayment(params: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}): Promise<{ orderId: string; paymentStatus: string }> {
  return apiFetch<{ orderId: string; paymentStatus: string }>(
    "/api/razorpay/checkout/verify",
    params
  );
}

/* =========================================================
 * ONBOARDING (shops)
 * ======================================================= */

export function startRazorpayOnboarding(
  payload: OnboardingStartPayload
): Promise<OnboardingStatusResult> {
  return apiFetch<OnboardingStatusResult>("/api/razorpay/onboarding/start", payload);
}

export function fetchRazorpayOnboardingStatus(
  shopId: string
): Promise<OnboardingStatusResult> {
  return apiFetch<OnboardingStatusResult>(
    `/api/razorpay/onboarding/status?shopId=${encodeURIComponent(shopId)}`
  );
}

export function fetchRazorpayCategories(): Promise<{ categories: CategoryOption[] }> {
  return apiFetch<{ categories: CategoryOption[] }>("/api/razorpay/categories");
}