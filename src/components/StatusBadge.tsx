import { cn } from "@/lib/utils";
import { orderStatusLabel, paymentStatusLabel } from "@/lib/labels";
import type { OrderStatus, PaymentStatus } from "@/types";

const tone: Record<OrderStatus, string> = {
  NEW: "bg-warning-light text-warning border-warning/40",
  ACCEPTED: "bg-primary-light text-primary border-primary/25",
  PRINTING: "bg-primary-light text-primary border-primary/25",
  FINISHING: "bg-primary-light text-primary border-primary/25",
  READY_PICKUP: "bg-success-light text-success border-success/30",
  READY_DELIVERY: "bg-success-light text-success border-success/30",
  OUT_FOR_DELIVERY: "bg-primary-light text-primary border-primary/25",
  DELIVERED: "bg-success-light text-success border-success/30",
  COMPLETED: "bg-success-light text-success border-success/30",
  REJECTED: "bg-destructive/10 text-destructive border-destructive/25",
};

export function StatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-semibold",
        tone[status],
        className,
      )}
    >
      {orderStatusLabel[status]}
    </span>
  );
}

const payTone: Record<PaymentStatus, string> = {
  unpaid: "bg-destructive/10 text-destructive border-destructive/25",
  partial: "bg-warning-light text-warning-foreground border-warning/40",
  paid: "bg-success-light text-success border-success/30",
  failed: "bg-destructive/10 text-destructive border-destructive/25",
  refunded: "bg-muted text-muted-foreground border-border",
};

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-semibold",
        payTone[status],
      )}
    >
      {paymentStatusLabel[status]}
    </span>
  );
}
