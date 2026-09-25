import { auth } from "@/lib/firebase/auth";

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

export interface CashfreeCheckoutSession {
    orderId: string;
    cashfreeOrderId: string;
    paymentSessionId: string;
    environment: "sandbox" | "production";
    amount: number;
    currency: string;
    name: string;
    description?: string;
    paymentStatus?: string;
    paid?: boolean;
}

export interface CashfreeOnboardingInput {
    shopId: string;
    email: string;
    phone: string;
    contactName?: string;
    legalBusinessName?: string;
    pan?: string;
    bankAccountNumber: string;
    bankIfsc: string;
    accountHolder?: string;
}

export interface CashfreeOnboardingStatusResponse {
    shopId: string;
    vendorId?: string;
    status?: string;
    onboardingStatus: "not_started" | "processing" | "activated" | "failed";
    payoutEnabled: boolean;
}

export function createCashfreeCheckoutSession(orderId: string): Promise<CashfreeCheckoutSession> {
    return apiFetch<CashfreeCheckoutSession>("/api/cashfree/checkout/create", { orderId });
}

export function verifyCashfreeCheckoutPayment(params: {
    orderId: string;
    cashfreeOrderId?: string;
}): Promise<{ orderId: string; paymentStatus: string; cashfreePaymentId: string }> {
    return apiFetch<{ orderId: string; paymentStatus: string; cashfreePaymentId: string }>(
        "/api/cashfree/checkout/verify",
        params
    );
}

export function startCashfreeOnboarding(
    input: CashfreeOnboardingInput
): Promise<CashfreeOnboardingStatusResponse> {
    return apiFetch<CashfreeOnboardingStatusResponse>("/api/cashfree/onboarding/start", input);
}

export function fetchCashfreeOnboardingStatus(
    shopId: string
): Promise<CashfreeOnboardingStatusResponse> {
    return apiFetch<CashfreeOnboardingStatusResponse>(
        `/api/cashfree/onboarding/status?shopId=${encodeURIComponent(shopId)}`
    );
}
