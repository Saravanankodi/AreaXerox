import { Check } from "lucide-react";
import { orderStatusLabel, statusFlow } from "@/lib/labels";
import { cn } from "@/lib/utils";
import type { Fulfillment, OrderStatus, TimelineEntry } from "@/types";

export function OrderTimeline({
  fulfillment,
  status,
  timeline,
}: {
  fulfillment: Fulfillment;
  status: OrderStatus;
  timeline: TimelineEntry[];
}) {
  const flow = statusFlow(fulfillment);
  const currentIndex = flow.indexOf(status);
  const reached = (s: string) => timeline.some((t) => t.status === s);

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex min-w-[480px] items-start gap-0 px-10">
        {flow.map((s, i) => {
          const entry = timeline.find((t) => t.status === s);
          const isDone = reached(s) && i < currentIndex;
          const isCurrent = s === status;
          return (
            <div key={s} className="flex flex-1 flex-col items-center">
              <div className="flex w-full items-center justify-center">
                {i > 0 && (
                  <span
                    className={cn("h-px flex-1", isDone || isCurrent ? "bg-success" : "bg-border")}
                  />
                )}
                <span
                  className={cn(
                    "z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                    isDone && "border-success bg-success text-success-foreground",
                    isCurrent && "border-primary bg-primary text-primary-foreground",
                    !isDone && !isCurrent && "border-border bg-card text-subtle",
                  )}
                >
                  {isDone ? <Check className="h-4 w-4" /> : i + 1}
                </span>
                {i < flow.length - 1 && (
                  <span className={cn("h-px flex-1", isDone ? "bg-success" : "bg-border")} />
                )}
              </div>
              <p
                className={cn(
                  "mt-2 text-center text-xs font-semibold",
                  !isDone && !isCurrent && "text-muted-foreground",
                )}
              >
                {orderStatusLabel[s]}
              </p>
              <p className="mt-0.5 text-center text-[11px] text-muted-foreground">
                {entry
                  ? new Date(entry.at).toLocaleDateString("en-IN")
                  : isCurrent
                    ? "In progress"
                    : "Pending"}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
