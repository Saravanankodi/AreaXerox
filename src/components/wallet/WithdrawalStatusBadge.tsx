import { cn } from "@/lib/utils";
import { withdrawalStatusLabel } from "@/lib/labels";
import type { WithdrawalStatus } from "@/types";

const tone: Record<WithdrawalStatus, string> = {
  pending: "bg-warning-light text-warning border-warning/40",
  under_review: "bg-warning-light text-warning border-warning/40",
  approved: "bg-primary-light text-primary border-primary/25",
  processing: "bg-primary-light text-primary border-primary/25",
  paid: "bg-success-light text-success border-success/30",
  rejected: "bg-destructive/10 text-destructive border-destructive/25",
  cancelled: "bg-muted text-muted-foreground border-border",
  failed: "bg-destructive/10 text-destructive border-destructive/25",
};

export function WithdrawalStatusBadge({
  status,
  className,
}: {
  status: WithdrawalStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-semibold",
        tone[status],
        className,
      )}
    >
      {withdrawalStatusLabel[status]}
    </span>
  );
}
