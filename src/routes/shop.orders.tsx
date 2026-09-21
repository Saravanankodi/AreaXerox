import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@/lib/navigation";
import { useState } from "react";
import { FileText, Truck, XCircle } from "lucide-react";
import { toast } from "sonner";
import { ShopShell } from "@/components/layout/ShopShell";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { useMyShop } from "@/lib/useMyShop";
import { inr } from "@/lib/pricing";
import { fulfillmentLabel } from "@/lib/labels";
import { createNotification } from "@/lib/notifications";
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
  const { orders, advanceOrder, addNotification, activeShop } = useStore();
  const shop = useMyShop();
  const [tab, setTab] = useState<Tab>("New");
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isChildActive = pathname !== "/shop/orders";

  if (isChildActive) {
    return (
      <ShopShell title="Orders" subtitle="Process print jobs and collect payments.">
        <Outlet />
      </ShopShell>
    );
  }

  const mine = orders.filter((o) => o.shopId === shop.id);

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
          newOrders.map((o) => {
            const isDelivery = o.fulfillment === "delivery";
            return (
              <div key={o.id} className="card-surface p-4">
                {/* Desktop: compact horizontal row */}
                <div className="hidden md:block">
                  <div className="flex items-center gap-4 text-sm">
                    {/* Customer */}
                    <div className="min-w-0 flex-[2]">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Customer</p>
                      <p className="mt-0.5 truncate font-semibold">{o.customerName}</p>
                    </div>
                    {/* Phone */}
                    <div className="min-w-0 flex-[1.5]">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Phone</p>
                      <p className="mt-0.5 truncate">{o.customerPhone}</p>
                    </div>
                    {/* Total Files */}
                    <div className="min-w-0 flex-1 text-center">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Total Files</p>
                      <p className="mt-0.5 font-medium">{o.documents.length}</p>
                    </div>
                    {/* Pickup / Delivery */}
                    <div className="min-w-0 flex-[2]">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                        {isDelivery ? "Delivery" : "Pickup"}
                      </p>
                      {isDelivery && o.address ? (
                        <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                          {[o.address.house, o.address.street, o.address.area].filter(Boolean).join(", ")}
                          {", "}
                          {[o.address.city, o.address.pincode].filter(Boolean).join(" — ")}
                        </p>
                      ) : (
                        <p className="mt-0.5 text-xs text-muted-foreground">—</p>
                      )}
                    </div>
                    {/* Amount + Actions */}
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <p className="text-base font-bold">{inr(o.price.total)}</p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            advanceOrder(o.id, "REJECTED");
                            toast.error(`${o.id} rejected`);
                            addNotification(
                              createNotification({
                                recipientId: o.customerPhone,
                                recipientRole: "customer",
                                type: "order_rejected",
                                title: "Order Rejected",
                                message: `Your order ${o.id} has been rejected by ${activeShop.name}.`,
                                relatedEntityId: o.id,
                                entityType: "order",
                              }),
                            );
                          }}
                        >
                          <XCircle className="h-4 w-4" /> Reject
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            advanceOrder(o.id, "ACCEPTED");
                            toast.success(`${o.id} accepted`);
                            addNotification(
                              createNotification({
                                recipientId: o.customerPhone,
                                recipientRole: "customer",
                                type: "order_accepted",
                                title: "Order Accepted",
                                message: `Your order ${o.id} has been accepted by ${activeShop.name}.`,
                                relatedEntityId: o.id,
                                entityType: "order",
                              }),
                            );
                            navigate({ to: "/shop/orders/$orderId", params: { orderId: o.id } });
                          }}
                        >
                          Accept
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mobile: stacked layout */}
                <div className="md:hidden">
                  <div className="space-y-3 text-sm">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Customer</p>
                        <p className="mt-0.5 font-semibold">{o.customerName}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Phone</p>
                        <p className="mt-0.5">{o.customerPhone}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Total Files</p>
                        <p className="mt-0.5 font-medium">{o.documents.length}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Amount</p>
                        <p className="mt-0.5 font-bold">{inr(o.price.total)}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                          {isDelivery ? "Delivery" : "Pickup"}
                        </p>
                        {isDelivery && o.address ? (
                          <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                            {[o.address.house, o.address.street, o.address.area].filter(Boolean).join(", ")}
                            {", "}
                            {[o.address.city, o.address.pincode].filter(Boolean).join(" — ")}
                          </p>
                        ) : (
                          <p className="mt-0.5 text-xs text-muted-foreground">—</p>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          advanceOrder(o.id, "REJECTED");
                          toast.error(`${o.id} rejected`);
                          addNotification(
                            createNotification({
                              recipientId: o.customerPhone,
                              recipientRole: "customer",
                              type: "order_rejected",
                              title: "Order Rejected",
                              message: `Your order ${o.id} has been rejected by ${activeShop.name}.`,
                              relatedEntityId: o.id,
                              entityType: "order",
                            }),
                          );
                        }}
                      >
                        <XCircle className="h-4 w-4" /> Reject
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          advanceOrder(o.id, "ACCEPTED");
                          toast.success(`${o.id} accepted`);
                          addNotification(
                            createNotification({
                              recipientId: o.customerPhone,
                              recipientRole: "customer",
                              type: "order_accepted",
                              title: "Order Accepted",
                              message: `Your order ${o.id} has been accepted by ${activeShop.name}.`,
                              relatedEntityId: o.id,
                              entityType: "order",
                            }),
                          );
                          navigate({ to: "/shop/orders/$orderId", params: { orderId: o.id } });
                        }}
                      >
                        Accept
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

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
                        <FileText className="h-4 w-4" /> {o.documents.length}{" "}
                        {o.documents.length === 1 ? "file" : "files"} · {totalPages}{" "}
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
                        <FileText className="h-4 w-4" /> {o.documents.length}{" "}
                        {o.documents.length === 1 ? "file" : "files"} · {totalPages}{" "}
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
