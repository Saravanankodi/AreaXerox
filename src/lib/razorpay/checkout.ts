/* Client-side Razorpay Checkout integration.
 *
 * Loads the Razorpay checkout script lazily and opens a payment modal for an
 * order session created by POST /api/razorpay/checkout/create.
 */

declare global {
  interface Window {
    Razorpay?: {
      new (options: RazorpayCheckoutOptions): RazorpayCheckout;
    };
  }
}

export interface RazorpayCheckoutOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  prefill?: {
    contact?: string;
    name?: string;
    email?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
  };
  handler: (response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
  modal?: {
    ondismiss?: () => void;
  };
}

export interface RazorpayCheckout {
  open(): void;
  close(): void;
}

const RAZORPAY_LOADER_URL = "https://checkout.razorpay.com/v1/checkout.js";
let loaderPromise: Promise<void> | null = null;

export function loadRazorpayCheckout(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  if (loaderPromise) return loaderPromise;

  loaderPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${RAZORPAY_LOADER_URL}"]`
    );
    const script =
      existing ??
      (() => {
        const created = document.createElement("script");
        created.src = RAZORPAY_LOADER_URL;
        document.head.appendChild(created);
        return created;
      })();

    script.onload = () => resolve();
    script.onerror = () => {
      loaderPromise = null;
      reject(new Error("Failed to load the Razorpay checkout library."));
    };
  });

  return loaderPromise;
}

export function isRazorpayCheckoutAvailable() {
  return typeof window !== "undefined" && !!window.Razorpay;
}

export async function openRazorpayCheckout(options: RazorpayCheckoutOptions) {
  await loadRazorpayCheckout();
  if (!window.Razorpay) {
    throw new Error("Razorpay checkout is unavailable.");
  }
  const instance = new window.Razorpay(options);
  instance.open();
  return instance;
}