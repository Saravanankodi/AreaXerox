import { createFileRoute, Link } from "@/lib/navigation";
import { useState } from "react";
import { FileText, Package } from "lucide-react";
import { toast } from "sonner";
import { CustomerShell, PageHeader } from "@/components/layout/CustomerShell";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PaymentBadge, StatusBadge } from "@/components/StatusBadge";
import { useStore } from "@/lib/store";
import { inr } from "@/lib/pricing";
import { fulfillmentLabel } from "@/lib/labels";
import { cn } from "@/lib/utils";
import type { Order } from "@/types";

export const Route = createFileRoute("/orders/")({
  head: () => ({
    meta: [
      { title: "My Print Orders — XEROXMATE" },
      {
        name: "description",
        content: "Track every print order live: accepted, printing, ready for pickup or delivered.",
      },
      { property: "og:title", content: "My Print Orders — XEROXMATE" },
      { property: "og:description", content: "Live status for all your print orders." },
    ],
  }),
  component: OrdersPage,
});

const TABS = ["Active", "Completed", "All"] as const;

const CANCELLABLE_STATUSES = new Set(["NEW", "ACCEPTED"]);

function OrdersPage() {
  const { orders, cancelOrder } = useStore();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Active");
  const [cancelTarget, setCancelTarget] = useState<Order | null>(null);

  const done = ["COMPLETED", "DELIVERED", "REJECTED"];
  const list = orders.filter((o) =>
    tab === "All" ? true : tab === "Completed" ? done.includes(o.status) : !done.includes(o.status),
  );

  const handleCancel = () => {
    if (!cancelTarget) return;
    const ok = cancelOrder(cancelTarget.id);
    if (ok) {
      toast.success("Order cancelled", { description: `${cancelTarget.id} has been cancelled.` });
    } else {
      toast.error("Could not cancel this order. It may have already been processed.");
    }
    setCancelTarget(null);
  };

  return (
    <CustomerShell>
      <PageHeader
        title="My Orders"
        subtitle="Every order you've placed, with live status from the print shop."
        action={
          <Link to="/order">
            <Button>New print order</Button>
          </Link>
        }
      />

      <div className="container-page">
        <div className="flex gap-2">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                tab === t
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:bg-secondary",
              )}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 pb-16 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((o) => (
            <article key={o.id} className="card-surface flex h-full min-w-0 flex-col p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold">{o.id}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{o.shopName}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={o.status} />
                  <PaymentBadge status={o.paymentStatus} />
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-2">
                  <FileText className="h-4 w-4" /> {o.documents.length} file(s) ·{" "}
                  {o.documents.reduce((s, d) => s + d.pages, 0)} pages
                </span>
                <span className="inline-flex items-center gap-2">
                  <Package className="h-4 w-4" /> {fulfillmentLabel[o.fulfillment]}
                </span>
                <span>{new Date(o.createdAt).toLocaleString("en-IN")}</span>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                <span className="text-sm text-muted-foreground">
                  {o.balance > 0 ? `Balance ${inr(o.balance)} due` : "Fully paid"}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-base font-bold">{inr(o.price.total)}</span>
                  {CANCELLABLE_STATUSES.has(o.status) && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setCancelTarget(o)}
                    >
                      Cancel
                    </Button>
                  )}
                  <Link to="/orders/$orderId" params={{ orderId: o.id }}>
                    <Button size="sm">Track</Button>
                  </Link>
                </div>
              </div>
            </article>
          ))}

          {list.length === 0 && (
            <div className="card-surface p-10 text-center">
              <p className="text-sm font-semibold">No orders here yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Place a print order and it will show up instantly.
              </p>
              <Link to="/order" className="mt-5 inline-block">
                <Button>Start printing</Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      <Dialog open={!!cancelTarget} onOpenChange={(open) => { if (!open) setCancelTarget(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Cancel order?</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel order {cancelTarget?.id}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex flex-row gap-3 sm:flex-row">
            <Button variant="outline" className="flex-1" onClick={() => setCancelTarget(null)}>
              Keep Order
            </Button>
            <Button variant="destructive" className="flex-1" onClick={handleCancel}>
              Cancel Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </CustomerShell>
  );
}
