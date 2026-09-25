import { useState } from "react";
import { CreditCard, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "@/lib/navigation";
import { inr } from "@/lib/pricing";
import { openRazorpayCheckout } from "@/lib/razorpay/checkout";
import {
  createCheckoutSession,
  verifyCheckoutPayment,
} from "@/services/razorpay.service";
import type { Order } from "@/types";

/**
 * "Pay now" card for orders placed with an online-capable payment method
 * (full / advance). Hidden once the Razorpay capture lands, and only shown to
 * the order's own customer.
 */
export function PayNowCard({ order }: { order: Order }) {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const onlineCapable =
    order.paymentMethod === "full" || order.paymentMethod === "advance";
  const captured = !!order.razorpayPaymentId || !!order.razorpaySignature;
  const isOwner =
    session?.role === "customer" && !!session.accountId && session.accountId === order.customerId;

  if (!onlineCapable || captured || !isOwner) return null;

  const handlePay = async () => {
    if (busy) return;
    setBusy(true);

    try {
      const sessionData = await createCheckoutSession(order.id);

      if (sessionData.paid) {
        toast.success("This order was already paid.");
        navigate({ to: "/orders/$orderId", params: { orderId: order.id } });
        return;
      }
      if (!sessionData.key_id || !sessionData.razorpayOrderId) {
        throw new Error(sessionData.error ?? "Could not start an online payment.");
      }

      await openRazorpayCheckout({
        key: sessionData.key_id,
        amount: sessionData.amountPaise,
        currency: sessionData.currency || "INR",
        name: sessionData.name || order.shopName,
        description: sessionData.description || `Order ${order.id}`,
        order_id: sessionData.razorpayOrderId,
        prefill: sessionData.prefill,
        theme: { color: "#2f6f4f" },
        handler: async (response) => {
          try {
            await verifyCheckoutPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            toast.success("Payment received. Thank you!");
            navigate({ to: "/orders/$orderId", params: { orderId: order.id } });
          } catch (error) {
            console.error("Payment verification error:", error);
            toast.error(
              (error as Error).message || "Payment could not be verified yet.",
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