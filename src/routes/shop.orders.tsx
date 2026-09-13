import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { FileText, Phone, Truck, User, XCircle } from "lucide-react";
import { toast } from "sonner";
import { ShopShell } from "@/components/layout/ShopShell";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { inr } from "@/lib/pricing";
import { fulfillmentLabel } from "@/lib/labels";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/shop/orders")({
  head: () => ({
    meta: [
      { title: "Orders — XEROXMATE Shop" },
      {
        name: "description",
        content: "Process print jobs and collect payments.",
      },
      { property: "og:title", content: "Orders — XEROXMATE Shop" },
      { property: "og:description", content: "Process print jobs and collect payments." },
    ],
  }),
  component: ShopOrders,
});

const TABS = ["New", "In progress", "Completed"] as const;
type Tab = (typeof TABS)[number];

const IN_PROGRESS_STATUSES = [
  "ACCEPTED",
  "PRINTING",
  "FINISHING",
  "READY_PICKUP",
  "READY_DELIVERY",
  "OUT_FOR_DELIVERY",
] as const;

const COMPLETED_STATUSES = ["COMPLETED", "DELIVERED"] as const;

function ShopOrders() {
  const { orders, activeShop, advanceOrder } = useStore();
  const [tab, setTab] = useState<Tab>("New");
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isChildActive = pathname !== "/shop/orders";

  if (isChildActive) {
    return (
      <ShopShell title="Orders" subtitle="Process print jobs and collect payments.">
        <Outlet />
      </ShopShell>
    );
  }

  const mine = orders.filter((o) => o.shopId === activeShop.id);

  const newOrders = mine.filter((o) => o.status === "NEW");
  const inProgressOrders = mine.filter((o) =>
    (IN_PROGRESS_STATUSES as readonly string[]).includes(o.status),
  );
  const completedOrders = mine.filter((o) =>
    (COMPLETED_STATUSES as readonly string[]).includes(o.status),
  );

  const activeList =
    tab === "New" ? newOrders : tab === "In progress" ? inProgressOrders : completedOrders;

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
        {tab === "New" &&
          newOrders.map((o) => (
            <div key={o.id} className="card-surface p-5">
              {/* Header: Order ID + Total Amount */}
              <div className="flex items-start justify-between gap-4">
                <p className="text-base font-bold">Order #{o.id}</p>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Total Amount</p>
                  <p className="text-xl font-bold">{inr(o.price.total)}</p>
                </div>
              </div>

              {/* Customer + Phone row */}
              <div className="mt-4 flex flex-wrap items-start gap-6 text-sm">
                <div className="flex items-start gap-2">
                  <User className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Customer</p>
                    <p className="font-medium">{o.customerName}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Phone</p>
                    <p className="font-medium">{o.customerPhone}</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 ">
                {/* Files */}
                <div className="mt-4 flex items-start gap-2 text-sm">
                  <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Files</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {o.documents.map((d) => (
                        <span
                          key={d.id}
                          className="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-xs font-medium"
                        >
                          {d.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Accept / Reject buttons */}
                <div className="mt-5 flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      advanceOrder(o.id, "REJECTED");
                      toast.error(`${o.id} rejected`);
                    }}
                  >
                    <XCircle className="h-4 w-4" /> Reject
                  </Button>
                  <Button
                    onClick={() => {
                      advanceOrder(o.id, "ACCEPTED");
                      toast.success(`${o.id} accepted`);
                    }}
                  >
                    Accept
                  </Button>
                </div>
              </div>
            </div>
          ))}

        {tab === "In progress" &&
          inProgressOrders.map((o) => {
            const totalPages = o.documents.reduce((s, d) => s + d.pages, 0);
            return (
              <div key={o.id} className="card-surface p-5">
                {/* Header: Order ID + Total Amount */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Link
                      to="/shop/orders/$orderId"
                      params={{ orderId: o.id }}
                      className="text-base font-bold hover:underline"
                    >
                      Order #{o.id}
                    </Link>
                    <p className="mt-1 text-sm text-muted-foreground">{o.customerName}</p>
                  </div>
                  <span className="text-lg font-bold whitespace-nowrap">{inr(o.price.total)}</span>
                </div>
                <div className=" flex justify-between items-center gap-4 md:gap-6">
                  <div>
                    {/* File/page info + Pickup/Delivery */}
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <FileText className="h-4 w-4" /> {o.documents.length} file(s) · {totalPages}{" "}
                        pages
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Truck className="h-4 w-4" /> {fulfillmentLabel[o.fulfillment]}
                      </span>
                    </div>

                    {/* Date */}
                    <p className="mt-2 text-xs text-muted-foreground">
                      {new Date(o.createdAt).toLocaleString("en-IN")}
                    </p>
                  </div>

                  {/* Track Order button */}

                  <Link to="/shop/orders/$orderId" params={{ orderId: o.id }}>
                    <Button variant="outline" size="sm">
                      Track Order
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}

        {tab === "Completed" &&
          completedOrders.map((o) => {
            const totalPages = o.documents.reduce((s, d) => s + d.pages, 0);
            return (
              <div key={o.id} className="card-surface p-5">
                {/* Header: Order ID + Total Amount */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Link
                      to="/shop/orders/$orderId"
                      params={{ orderId: o.id }}
                      className="text-base font-bold hover:underline"
                    >
                      Order #{o.id}
                    </Link>
                    <p className="mt-1 text-sm text-muted-foreground">{o.customerName}</p>
                  </div>
                  <span className="text-lg font-bold whitespace-nowrap">{inr(o.price.total)}</span>
                </div>
                <div className=" flex justify-between items-center gap-4 md:gap-6">
                  <div>
                    {/* File/page info + Pickup/Delivery */}
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <FileText className="h-4 w-4" /> {o.documents.length} file(s) · {totalPages}{" "}
                        pages
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Truck className="h-4 w-4" /> {fulfillmentLabel[o.fulfillment]}
                      </span>
                    </div>

                    {/* Date */}
                    <p className="mt-2 text-xs text-muted-foreground">
                      {new Date(o.createdAt).toLocaleString("en-IN")}
                    </p>
                  </div>
                  {/* Track Order button */}
                  <Link to="/shop/orders/$orderId" params={{ orderId: o.id }}>
                    <Button variant="outline" size="sm">
                      Track Order
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}

        {activeList.length === 0 && (
          <div className="card-surface p-10 text-center text-sm text-muted-foreground">
            {tab === "New" && "No new orders to review."}
            {tab === "In progress" && "No orders in progress."}
            {tab === "Completed" && "No completed orders."}
          </div>
        )}
      </div>
    </ShopShell>
  );
}
