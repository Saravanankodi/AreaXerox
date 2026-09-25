import { BadgeCheck, Clock, Sparkles } from "lucide-react";

import type { Order } from "@/types";

/**
 * Renders the online (Razorpay) capture state for an order, separate from the
 * legacy `paymentStatus` "paid at pickup" semantics. Shows nothing for COD.
 */
export function OnlinePaymentState({
  order,
  className,
}: {
  order: Order;
  className?: string;
}) {
  const capable = order.paymentMethod === "full" || order.paymentMethod === "advance";
  if (!capable) return null;

  const captured = !!order.razorpayPaymentId || !!order.razorpaySignature;
  const inFlight = !!order.razorpayOrderId && !captured;

  const base = "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium";
  const outer = className ? `${base} ${className}` : base;

  if (captured) {
    return (
      <span className={`${outer} border-success/30 bg-success-light text-success`}>
        <BadgeCheck className="h-3.5 w-3.5" /> Paid online
      </span>
    );
  }
  if (inFlight) {
    return (
      <span className={`${outer} border-amber-300/40 bg-amber-50 text-amber-700`}>
        <Clock className="h-3.5 w-3.5" /> Online payment pending
      </span>
    );
  }
  return (
    <span className={`${outer} border-primary/20 bg-primary-light text-primary`}>
      <Sparkles className="h-3.5 w-3.5" /> Online payment ready
    </span>
  );
}