import {
    createCashfreeCheckoutSession,
    verifyCashfreeCheckoutPayment,
    type CashfreeCheckoutSession,
} from "@/services/cashfree.service";
import {
    createCheckoutSession as createRazorpayCheckoutSession,
    verifyCheckoutPayment as verifyRazorpayCheckoutPayment,
    type CheckoutSession as RazorpayCheckoutSession,
} from "@/services/razorpay.service";

export type PaymentGatewayType = "cashfree" | "razorpay";

export function getClientPaymentGateway(): PaymentGatewayType {
    const envGateway = (
        process.env.NEXT_PUBLIC_PAYMENT_GATEWAY ?? "cashfree"
    ).toLowerCase();
    if (envGateway === "razorpay") return "razorpay";
    return "cashfree";
}

export interface UnifiedCheckoutSession {
    gateway: PaymentGatewayType;
    orderId: string;
    paid?: boolean;

    // Cashfree specifics
    cashfreeOrderId?: string;
    paymentSessionId?: string;
    environment?: "sandbox" | "production";

    // Razorpay specifics
    key_id?: string;
    razorpayOrderId?: string;

    // General metadata
    amount: number; // In Rupees
    currency: string;
    name: string;
    description?: string;
    prefill?: { contact?: string; name?: string; email?: string };
}

/**
 * Creates a payment checkout session using the configured gateway (Cashfree or Razorpay).
 */
export async function createUnifiedCheckoutSession(
    orderId: string,
    forceGateway?: PaymentGatewayType
): Promise<UnifiedCheckoutSession> {
    const gateway = forceGateway || getClientPaymentGateway();

    if (gateway === "razorpay") {
        const rzp = await createRazorpayCheckoutSession(orderId);
        return {
            gateway: "razorpay",
            orderId: rzp.orderId,
            paid: rzp.paid,
            key_id: rzp.key_id,
            razorpayOrderId: rzp.razorpayOrderId,
            amount: rzp.amountPaise / 100,
            currency: rzp.currency || "INR",
            name: rzp.name,
            description: rzp.description,
            prefill: rzp.prefill,
        };
    }

    // Default: Cashfree
    const cf = await createCashfreeCheckoutSession(orderId);
    return {
        gateway: "cashfree",
        orderId: cf.orderId,
        paid: cf.paid,
        cashfreeOrderId: cf.cashfreeOrderId,
        paymentSessionId: cf.paymentSessionId,
        environment: cf.environment,
        amount: cf.amount,
        currency: cf.currency,
        name: cf.name,
        description: cf.description,
    };
}

export { verifyCashfreeCheckoutPayment, verifyRazorpayCheckoutPayment };
