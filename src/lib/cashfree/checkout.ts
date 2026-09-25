/* Client-side Cashfree JS SDK V3 integration.
 * Loads the Cashfree SDK lazily and opens a payment modal/redirect for an
 * order session created by POST /api/cashfree/checkout/create.
 */

declare global {
    interface Window {
        Cashfree?: (options: { mode: "sandbox" | "production" }) => CashfreeInstance;
    }
}

export interface CashfreeInstance {
    checkout(options: {
        paymentSessionId: string;
        redirectTarget?: "_modal" | "_self" | "_blank" | HTMLElement;
    }): Promise<{
        error?: {
            message?: string;
            code?: string;
        };
        redirect?: boolean;
        paymentDetails?: {
            paymentMessage?: string;
        };
    }>;
}

const CASHFREE_LOADER_URL = "https://sdk.cashfree.com/js/v3/cashfree.js";
let loaderPromise: Promise<void> | null = null;

export function loadCashfreeSDK(): Promise<void> {
    if (typeof window !== "undefined" && window.Cashfree) {
        return Promise.resolve();
    }
    if (loaderPromise) return loaderPromise;

    loaderPromise = new Promise<void>((resolve, reject) => {
        const existing = document.querySelector<HTMLScriptElement>(
            `script[src="${CASHFREE_LOADER_URL}"]`
        );
        const script =
            existing ??
            (() => {
                const created = document.createElement("script");
                created.src = CASHFREE_LOADER_URL;
                document.head.appendChild(created);
                return created;
            })();

        script.onload = () => resolve();
        script.onerror = () => {
            loaderPromise = null;
            reject(new Error("Failed to load the Cashfree checkout SDK."));
        };
    });

    return loaderPromise;
}

export interface OpenCashfreeCheckoutOptions {
    paymentSessionId: string;
    environment?: "sandbox" | "production";
    redirectTarget?: "_modal" | "_self" | "_blank";
}

export async function openCashfreeCheckout(options: OpenCashfreeCheckoutOptions) {
    await loadCashfreeSDK();
    if (typeof window === "undefined" || !window.Cashfree) {
        throw new Error("Cashfree Checkout SDK is unavailable.");
    }

    const mode = options.environment || "sandbox";
    const cashfree = window.Cashfree({ mode });

    return cashfree.checkout({
        paymentSessionId: options.paymentSessionId,
        redirectTarget: options.redirectTarget || "_modal",
    });
}
