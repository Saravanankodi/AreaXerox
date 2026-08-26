import { createFileRoute, Link } from "@tanstack/react-router";
import { IndianRupee, ClipboardList, Clock, TrendingUp } from "lucide-react";
import { ShopShell } from "@/components/layout/ShopShell";
import { Button } from "@/components/ui/button";
import { StatusBadge, PaymentBadge } from "@/components/StatusBadge";
import { useStore } from "@/lib/store";
import { inr } from "@/lib/pricing";
import { fulfillmentLabel } from "@/lib/labels";

export const Route = createFileRoute("/shop/")({
  head: () => ({
    meta: [
      { title: "Shop Dashboard — Order My Xerox" },
      {
        name: "description",
        content: "Today's print orders, revenue, pending balances and queue status for your shop.",
      },
      { property: "og:title", content: "Shop Dashboard — Order My Xerox" },
      { property: "og:description", content: "Run your print shop from one screen." },
    ],
  }),
  component: ShopDashboard,
});

function ShopDashboard() {
  const { orders, activeShop } = useStore();
  const mine = orders.filter((o) => o.shopId === activeShop.id);
  const active = mine.filter(
    (o) => !["COMPLETED", "DELIVERED", "REJECTED"].includes(o.status),
  );
  const revenue = mine.reduce((s, o) => s + o.amountPaid, 0);
  const pending = mine.reduce((s, o) => s + o.balance, 0);

  const stats = [
    { label: "Active orders", value: String(active.length), icon: ClipboardList },
    { label: "New requests", value: String(mine.filter((o) => o.status === "NEW").length), icon: Clock },
    { label: "Collected", value: inr(revenue), icon: IndianRupee },
    { label: "Balance pending", value: inr(pending), icon: TrendingUp },
  ];

  return (
    <ShopShell
      title="Dashboard"
      subtitle={`${activeShop.name} · ${activeShop.hours}`}
      action={
        <Link to="/shop/orders">
          <Button>Manage orders</Button>
        </Link>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card-surface p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <s.icon className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-3 text-2xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="card-surface mt-6 p-5 md:p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Live queue</h2>
          <Link to="/shop/orders" className="text-sm font-medium text-primary hover:underline">
            View all
          </Link>
        </div>
        <div className="mt-5 space-y-3">
          {active.slice(0, 6).map((o) => (
            <div
              key={o.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-4"
            >
              <div>
                <p className="text-sm font-bold">{o.id}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {o.customerName} · {fulfillmentLabel[o.fulfillment]} ·{" "}
                  {o.documents.reduce((s, d) => s + d.pages, 0)} pages
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={o.status} />
                <PaymentBadge status={o.paymentStatus} />
                <span className="text-sm font-semibold">{inr(o.price.total)}</span>
              </div>
            </div>
          ))}
          {active.length === 0 && (
            <p className="text-sm text-muted-foreground">No active orders right now.</p>
          )}
        </div>
      </div>
    </ShopShell>
  );
}
