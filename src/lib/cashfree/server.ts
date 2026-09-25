import crypto from "node:crypto";
import { getAdminFirestore } from "@/lib/firebase/admin";

/* =========================================================
 * CASHFREE PG CONFIG & UTILITIES
 * ======================================================= */

export interface CashfreeCredentials {
    appId: string;
    secretKey: string;
    environment: "sandbox" | "production";
    baseUrl: string;
    gateway: "cashfree" | "razorpay";
}

export function getCashfreeCredentials(): CashfreeCredentials {
    const appId = (
        process.env.CASHFREE_APP_ID ??
        process.env.CASHFREE_CLIENT_ID ??
        process.env.NEXT_PUBLIC_CASHFREE_APP_ID ??
        ""
    ).trim();
    const secretKey = (process.env.CASHFREE_SECRET_KEY ?? "").trim();
    const rawEnv = (
        process.env.CASHFREE_ENVIRONMENT ??
        process.env.NEXT_PUBLIC_CASHFREE_ENVIRONMENT ??
        "sandbox"
    ).trim().toLowerCase();

    const environment: "sandbox" | "production" = rawEnv === "production" ? "production" : "sandbox";
    const baseUrl =
        environment === "production"
            ? "https://api.cashfree.com/pg"
            : "https://sandbox.cashfree.com/pg";

    const gateway = (
        process.env.PAYMENT_GATEWAY ??
        process.env.NEXT_PUBLIC_PAYMENT_GATEWAY ??
        "cashfree"
    ).trim().toLowerCase() as "cashfree" | "razorpay";

    return { appId, secretKey, environment, baseUrl, gateway };
}

export function getActivePaymentGateway(): "cashfree" | "razorpay" {
    const { gateway, appId } = getCashfreeCredentials();
    if (gateway === "razorpay") return "razorpay";
    // If Cashfree is configured or gateway is cashfree, default to cashfree
    if (appId || gateway === "cashfree") return "cashfree";
    return "razorpay";
}

/* =========================================================
 * COMMISSION & PAYOUT CALCULATIONS
 * ======================================================= */

export async function getPlatformCommissionPercent(): Promise<number> {
    const envVal = process.env.PLATFORM_COMMISSION_PERCENT;
    if (envVal !== undefined && !Number.isNaN(Number(envVal))) {
        return Math.max(0, Math.min(100, Number(envVal)));
    }

    try {
        const snap = await getAdminFirestore().doc("platform/settings").get();
        if (snap.exists) {
            const data = snap.data() as { commissionPercent?: number };
            if (typeof data?.commissionPercent === "number" && !Number.isNaN(data.commissionPercent)) {
                return Math.max(0, Math.min(100, data.commissionPercent));
            }
        }
    } catch (err) {
        console.warn("Failed to fetch platform commission setting:", err);
    }

    return 15; // Default 15%
}

export function computePayoutSplitRupees(
    totalRupees: number,
    commissionPercent: number
): { platformFee: number; shopkeeperShare: number } {
    const total = Math.max(0, totalRupees);
    const percent = Math.min(100, Math.max(0, commissionPercent || 0));

    const platformFee = Math.max(0, Number(((total * percent) / 100).toFixed(2)));
    const shopkeeperShare = Math.max(0, Number((total - platformFee).toFixed(2)));

    return { platformFee, shopkeeperShare };
}

/* =========================================================
 * RAW API CLIENT
 * ======================================================= */

export async function cashfreeApiFetch<T>(
    path: string,
    options: { method?: string; body?: unknown } = {}
): Promise<T> {
    const { appId, secretKey, baseUrl } = getCashfreeCredentials();

    if (!appId || !secretKey) {
        throw new Error(
            "Cashfree is not configured. Add CASHFREE_APP_ID and CASHFREE_SECRET_KEY to environment variables."
        );
    }

    const url = `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
    const res = await fetch(url, {
        method: options.method ?? "GET",
        headers: {
            "x-api-version": "2023-08-01",
            "x-client-id": appId,
            "x-client-secret": secretKey,
            "Content-Type": "application/json",
            Accept: "application/json",
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
        const errorBody = data as { message?: string; code?: string; type?: string } | null;
        const msg = errorBody?.message || `Cashfree API HTTP ${res.status}`;
        const err = new Error(msg) as Error & { status?: number; code?: string; body?: unknown };
        err.status = res.status;
        err.code = errorBody?.code;
        err.body = data;
        throw err;
    }

    return data as T;
}

/* =========================================================
 * CASHFREE TYPES & API METHODS
 * ======================================================= */

export interface CreateCashfreeOrderParams {
    orderId: string;
    amount: number; // In Rupees (e.g. 150.50)
    currency?: string;
    customer: {
        id: string;
        name: string;
        email?: string;
        phone: string;
    };
    vendorSplit?: {
        vendorId: string;
        amount: number;
    };
    note?: string;
    notifyUrl?: string;
    returnUrl?: string;
}

export interface CashfreeOrderResponse {
    cf_order_id: string;
    order_id: string;
    entity: string;
    order_currency: string;
    order_amount: number;
    order_status: "PAID" | "ACTIVE" | "EXPIRED" | "TERMINATED";
    payment_session_id: string;
    order_expiry_time?: string;
    customer_details: {
        customer_id: string;
        customer_name: string;
        customer_email: string;
        customer_phone: string;
    };
    order_meta?: {
        return_url?: string;
        notify_url?: string;
    };
}

export interface CashfreePaymentEntity {
    cf_payment_id: string;
    order_id: string;
    entity: string;
    payment_currency: string;
    payment_amount: number;
    payment_status: "SUCCESS" | "FAILED" | "PENDING" | "USER_DROPPED" | "CANCELLED";
    payment_message?: string;
    payment_time?: string;
    payment_completion_time?: string;
    payment_group?: string;
    payment_method?: Record<string, unknown>;
    bank_reference?: string;
}

/**
 * Creates an order session on Cashfree with optional vendor split instruction.
 */
export async function createCashfreeOrder(
    params: CreateCashfreeOrderParams
): Promise<CashfreeOrderResponse> {
    const safePhone = params.customer.phone.replace(/\D/g, "").slice(-10) || "9999999999";
    const safeEmail = params.customer.email?.trim() || "customer@example.com";
    const safeName = params.customer.name.trim() || "Customer";
    const safeCustomerId = params.customer.id.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 40);

    // Ensure order_id satisfies Cashfree's allowed format (alphanumeric, _, -, max 50 chars)
    const safeOrderId = params.orderId.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 50);

    const body: Record<string, unknown> = {
        order_id: safeOrderId,
        order_amount: Number(params.amount.toFixed(2)),
        order_currency: params.currency || "INR",
        customer_details: {
            customer_id: safeCustomerId,
            customer_name: safeName,
            customer_email: safeEmail,
            customer_phone: safePhone,
        },
        order_note: params.note ? params.note.slice(0, 100) : `Order ${params.orderId}`,
        order_meta: {
            ...(params.notifyUrl ? { notify_url: params.notifyUrl } : {}),
            ...(params.returnUrl ? { return_url: params.returnUrl } : {}),
        },
    };

    // Add Easy Split vendor split instruction if vendor ID and split amount exist
    if (params.vendorSplit && params.vendorSplit.vendorId && params.vendorSplit.amount > 0) {
        const safeVendorId = params.vendorSplit.vendorId.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 45);
        const splitAmount = Math.min(params.amount, Number(params.vendorSplit.amount.toFixed(2)));

        body.order_splits = [
            {
                vendor_id: safeVendorId,
                amount: splitAmount,
            },
        ];
    }

    return cashfreeApiFetch<CashfreeOrderResponse>("/orders", {
        method: "POST",
        body,
    });
}

/**
 * Fetches order details directly from Cashfree server-side API.
 */
export async function fetchCashfreeOrder(cashfreeOrderId: string): Promise<CashfreeOrderResponse> {
    return cashfreeApiFetch<CashfreeOrderResponse>(`/orders/${encodeURIComponent(cashfreeOrderId)}`);
}

/**
 * Fetches payments associated with a Cashfree order.
 */
export async function fetchCashfreeOrderPayments(
    cashfreeOrderId: string
): Promise<CashfreePaymentEntity[]> {
    return cashfreeApiFetch<CashfreePaymentEntity[]>(
        `/orders/${encodeURIComponent(cashfreeOrderId)}/payments`
    );
}

/* =========================================================
 * CASHFREE EASY SPLIT VENDOR MANAGEMENT
 * ======================================================= */

export interface CreateCashfreeVendorParams {
    vendorId: string;
    name: string;
    email: string;
    phone: string;
    bankDetails: {
        accountNumber: string;
        ifsc: string;
        accountHolder: string;
    };
    kycDetails?: {
        pan?: string;
        businessType?: string;
    };
}

export interface CashfreeVendorEntity {
    vendor_id: string;
    name: string;
    email: string;
    phone: string;
    status: "ACTIVE" | "PENDING" | "SUSPENDED" | "INITIATED";
    bank_details?: {
        account_number?: string;
        account_holder?: string;
        ifsc?: string;
    };
}

/**
 * Creates or updates a vendor account on Cashfree Easy Split for automated payouts.
 */
export async function createOrUpdateCashfreeVendor(
    params: CreateCashfreeVendorParams
): Promise<CashfreeVendorEntity> {
    const safeVendorId = params.vendorId.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 45);
    const safePhone = params.phone.replace(/\D/g, "").slice(-10) || "9999999999";
    const safeEmail = params.email.trim() || "shop@example.com";
    const safeName = params.name.trim() || "Vendor";

    const body = {
        vendor_id: safeVendorId,
        name: safeName,
        email: safeEmail,
        phone: safePhone,
        verify_account: true,
        dashboard_access: false,
        bank_details: {
            account_number: params.bankDetails.accountNumber.trim(),
            account_holder: params.bankDetails.accountHolder.trim(),
            ifsc: params.bankDetails.ifsc.trim().toUpperCase(),
        },
        kyc_details: {
            account_type: "INDIVIDUAL",
            business_type: params.kycDetails?.businessType || "PROPRIETORSHIP",
            ...(params.kycDetails?.pan ? { pan: params.kycDetails.pan.trim().toUpperCase() } : {}),
        },
    };

    try {
        return await cashfreeApiFetch<CashfreeVendorEntity>("/vendors", {
            method: "POST",
            body,
        });
    } catch (err: unknown) {
        const status = (err as { status?: number }).status;
        if (status === 404) {
            try {
                return await cashfreeApiFetch<CashfreeVendorEntity>("/easy-split/vendors", {
                    method: "POST",
                    body,
                });
            } catch (innerErr) {
                throw innerErr;
            }
        }
        if (status === 409 || status === 400) {
            try {
                return await cashfreeApiFetch<CashfreeVendorEntity>(
                    `/vendors/${encodeURIComponent(safeVendorId)}`,
                    {
                        method: "PUT",
                        body,
                    }
                );
            } catch {
                return await fetchCashfreeVendor(safeVendorId);
            }
        }
        throw err;
    }
}

/**
 * Fetches a vendor's Cashfree Easy Split onboarding status.
 */
export async function fetchCashfreeVendor(vendorId: string): Promise<CashfreeVendorEntity> {
    const safeVendorId = vendorId.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 45);
    try {
        return await cashfreeApiFetch<CashfreeVendorEntity>(`/vendors/${encodeURIComponent(safeVendorId)}`);
    } catch (err) {
        if ((err as { status?: number }).status === 404) {
            return cashfreeApiFetch<CashfreeVendorEntity>(`/easy-split/vendors/${encodeURIComponent(safeVendorId)}`);
        }
        throw err;
    }
}

/* =========================================================
 * WEBHOOK SIGNATURE VERIFICATION
 * ======================================================= */

/**
 * Verifies the Cashfree webhook HMAC signature (V3 / 2023-08-01 API).
 * Formula: HMAC_SHA256(timestamp + rawBody, secretKey) in Base64
 */
export function verifyCashfreeWebhookSignature(
    rawBody: string,
    timestamp: string,
    signature: string,
    secretKey: string
): boolean {
    if (!signature || !secretKey || !timestamp) return false;

    try {
        const dataToSign = timestamp + rawBody;
        const expected = crypto
            .createHmac("sha256", secretKey)
            .update(dataToSign, "utf8")
            .digest("base64");

        const a = Buffer.from(signature, "utf8");
        const b = Buffer.from(expected, "utf8");
        if (a.length !== b.length) return false;
        return crypto.timingSafeEqual(a, b);
    } catch {
        return false;
    }
}
