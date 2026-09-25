import { useState } from "react";
import { CreditCard, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { openCashfreeCheckout } from "@/lib/cashfree/checkout";
import { useNavigate } from "@/lib/navigation";
import { inr } from "@/lib/pricing";
import { openRazorpayCheckout } from "@/lib/razorpay/checkout";
import {
  createUnifiedCheckoutSession,
  verifyCashfreeCheckoutPayment,
  verifyRazorpayCheckoutPayment,
} from "@/services/payment.service";
import type { Order } from "@/types";

/**
 * "Pay now" card for orders placed with an online-capable payment method
 * (full / advance). Hidden once the payment capture lands, and only shown to
 * the order's own customer.
 */
export function PayNowCard({ order }: { order: Order }) {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const onlineCapable =
    order.paymentMethod === "full" || order.paymentMethod === "advance";
  const captured =
    !!order.cashfreePaymentId ||
    !!order.razorpayPaymentId ||
    !!order.razorpaySignature ||
    order.paymentStatus === "paid";

  const isOwner =
    session?.role === "customer" && !!session.accountId && session.accountId === order.customerId;

  if (!onlineCapable || captured || !isOwner) return null;

  const handlePay = async () => {
    if (busy) return;
    setBusy(true);

    try {
      const sessionData = await createUnifiedCheckoutSession(order.id);

      if (sessionData.paid) {
        toast.success("This order was already paid.");
        navigate({ to: "/orders/$orderId", params: { orderId: order.id } });
        return;
      }

      /* -----------------------------------------------------
       * CASHFREE CHECKOUT FLOW
       * --------------------------------------------------- */
      if (sessionData.gateway === "cashfree") {
        if (!sessionData.paymentSessionId || !sessionData.cashfreeOrderId) {
          throw new Error("Could not start a Cashfree payment session.");
        }

        const res = await openCashfreeCheckout({
          paymentSessionId: sessionData.paymentSessionId,
          environment: sessionData.environment || "sandbox",
          redirectTarget: "_modal",
        });

        if (res?.error) {
          console.warn("Cashfree checkout popup error/dismiss:", res.error);
        }

        // Verify payment server-side with Cashfree API regardless of browser signal
        try {
          await verifyCashfreeCheckoutPayment({
            orderId: order.id,
            cashfreeOrderId: sessionData.cashfreeOrderId,
          });
          toast.success("Payment received. Thank you!");
          navigate({ to: "/orders/$orderId", params: { orderId: order.id } });
        } catch (error) {
          const errMessage = (error as Error).message || "";
          if (errMessage.includes("not completed")) {
            toast.info("Payment was cancelled or is pending.");
          } else {
            console.error("Cashfree verification error:", error);
            toast.error(errMessage || "Payment verification pending.");
          }
        } finally {
          setBusy(false);
        }
        return;
      }

      /* -----------------------------------------------------
       * RAZORPAY CHECKOUT FLOW (FALLBACK / HISTORICAL)
       * --------------------------------------------------- */
      if (!sessionData.key_id || !sessionData.razorpayOrderId) {
        throw new Error("Could not start a Razorpay payment session.");
      }

      await openRazorpayCheckout({
        key: sessionData.key_id,
        amount: Math.round(sessionData.amount * 100),
        currency: sessionData.currency || "INR",
        name: sessionData.name || order.shopName,
        description: sessionData.description || `Order ${order.id}`,
        order_id: sessionData.razorpayOrderId,
        prefill: sessionData.prefill,
        theme: { color: "#2f6f4f" },
        handler: async (response) => {
          try {
            await verifyRazorpayCheckoutPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            toast.success("Payment received. Thank you!");
            navigate({ to: "/orders/$orderId", params: { orderId: order.id } });
          } catch (error) {
            console.error("Payment verification error:", error);
            toast.error(
              (error as Error).message || "Payment could not be verified yet."
            );
          } finally {
            setBusy(false);
          }
        },
        modal: { ondismiss: () => setBusy(false) },
      });
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error((error as Error).message || "Could not start an online payment.");
      setBusy(false);
    }
  };

  return (
    <div className="card-surface p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <CreditCard className="h-4 w-4 text-primary" /> Pay online
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Complete the payment of{" "}
            <span className="font-semibold text-foreground">
              {inr(order.amountPaid)}
            </span>{" "}
            for {order.id} through UPI, card or net-banking.
          </p>
        </div>
      </div>

      <Button className="mt-4 w-full" size="lg" onClick={handlePay} disabled={busy}>
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {busy ? "Opening secure checkout…" : `Pay ${inr(order.amountPaid)}`}
      </Button>
    </div>
  );
}