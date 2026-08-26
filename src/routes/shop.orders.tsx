import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { FileText, Wallet, XCircle } from "lucide-react";
import { toast } from "sonner";
import { ShopShell } from "@/components/layout/ShopShell";
import { Button } from "@/components/ui/button";
import { PaymentBadge, StatusBadge } from "@/components/StatusBadge";
import { useStore } from "@/lib/store";
import { inr } from "@/lib/pricing";
import { fulfillmentLabel, nextActionLabel, nextStatus, paymentMethodLabel } from "@/lib/labels";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/shop/orders")({
  head: () => ({
    meta: [
      { title: "Manage Orders — Order My Xerox Shop" },
      {
        name: "description",
        content:
          "Accept print jobs, move them through printing and finishing, and collect pending balances.",
      },
      { property: "og:title", content: "Manage Orders — Order My Xerox Shop" },
      { property: "og:description", content: "Process print jobs from request to completion." },
    ],
  }),
  component: ShopOrders,
});

const TABS = ["New", "In progress", "Ready", "Completed", "All"] as const;

function ShopOrders() {
  const { orders, activeShop, advanceOrder, collectBalance } = useStore();
  const [tab, setTab] = useState<(typeof TABS)[number]>("New");

  const mine = orders.filter((o) => o.shopId === activeShop.id);
  const list = mine.filter((o) => {
    if (tab === "All") return true;
    if (tab === "New") return o.status === "NEW";
    if (tab === "In progress") return ["ACCEPTED", "PRINTING", "FINISHING"].includes(o.status);
    if (tab === "Ready")
      return ["READY_PICKUP", "READY_DELIVERY", "OUT_FOR_DELIVERY"].includes(o.status);
    return ["COMPLETED", "DELIVERED", "REJECTED"].includes(o.status);
  });

  return (
    <ShopShell title="Orders" subtitle="Process print jobs and collect payments.">
      <div className="flex flex-wrap gap-2">
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

      <div className="mt-6 space-y-4">
        {list.map((o) => {
          const next = nextStatus(o.status, o.fulfillment);
          return (
            <div key={o.id} className="card-surface p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold">{o.id}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {o.customerName} · {o.customerPhone}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(o.createdAt).toLocaleString("en-IN")} ·{" "}
                    {fulfillmentLabel[o.fulfillment]}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={o.status} />
                  <PaymentBadge status={o.paymentStatus} />
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-lg bg-secondary p-4">
                  <p className="text-xs font-semibold text-subtle">PRINT SPEC</p>
                  <p className="mt-2 text-sm">
                    {o.configLabels.paper} · {o.configLabels.printType} · {o.configLabels.side} ·{" "}
                    {o.config.copies} copy(ies)
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Binding: {o.configLabels.binding}
                    {o.configLabels.additional.length
                      ? ` · Extras: ${o.configLabels.additional.join(", ")}`
                      : ""}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Pages:{" "}
                    {o.config.pageRangeMode === "all" ? "All" : o.config.pageRange || "All"} ·{" "}
                    {o.price.billablePages} billable
                  </p>
                  <div className="mt-3 space-y-1.5">
                    {o.documents.map((d) => (
                      <p key={d.id} className="inline-flex items-center gap-2 text-xs">
                        <FileText className="h-3.5 w-3.5 text-primary" /> {d.name} ({d.pages}p)
                      </p>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg bg-secondary p-4">
                  <p className="text-xs font-semibold text-subtle">PAYMENT</p>
                  <p className="mt-2 text-sm">
                    {paymentMethodLabel[o.paymentMethod]} · Total {inr(o.price.total)}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Paid {inr(o.amountPaid)} · Balance {inr(o.balance)}
                  </p>
                  {o.address && (
                    <p className="mt-3 text-xs text-muted-foreground">
                      Deliver to: {o.address.house}, {o.address.street}, {o.address.area},{" "}
                      {o.address.city} - {o.address.pincode}
                    </p>
                  )}
                  {o.balance > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(["cash", "upi", "card"] as const).map((via) => (
                        <Button
                          key={via}
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            collectBalance(o.id, via);
                            toast.success(`Balance ${inr(o.balance)} collected via ${via}`);
                          }}
                        >
                          <Wallet className="h-4 w-4" /> Collect via {via.toUpperCase()}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
                {next && (
                  <Button
                    onClick={() => {
                      advanceOrder(o.id, next);
                      toast.success(`${o.id} → ${nextActionLabel(next)}`);
                    }}
                  >
                    {nextActionLabel(next)}
                  </Button>
                )}
                {o.status === "NEW" && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      advanceOrder(o.id, "REJECTED");
                      toast.error(`${o.id} rejected`);
                    }}
                  >
                    <XCircle className="h-4 w-4" /> Reject
                  </Button>
                )}
                {!next && o.status !== "NEW" && (
                  <p className="text-sm text-muted-foreground">This order is closed.</p>
                )}
              </div>
            </div>
          );
        })}

        {list.length === 0 && (
          <div className="card-surface p-10 text-center text-sm text-muted-foreground">
            No orders in this view.
          </div>
        )}
      </div>
    </ShopShell>
  );
}
