import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Check, Clock, FileText, MapPin, Phone, Store } from "lucide-react";
import { CustomerShell } from "@/components/layout/CustomerShell";
import { Button } from "@/components/ui/button";
import { PaymentBadge, StatusBadge } from "@/components/StatusBadge";
import { useStore } from "@/lib/store";
import { inr } from "@/lib/pricing";
import {
  customerStatusCopy,
  fulfillmentLabel,
  orderStatusLabel,
  paymentMethodLabel,
  statusFlow,
} from "@/lib/labels";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/orders/$orderId")({
  head: () => ({
    meta: [
      { title: "Order Details — Order My Xerox" },
      {
        name: "description",
        content: "Live timeline, print specification, payment breakdown and shop details for your order.",
      },
      { property: "og:title", content: "Order Details — Order My Xerox" },
      { property: "og:description", content: "Follow your print order step by step." },
    ],
  }),
  component: OrderDetail,
});

function OrderDetail() {
  const { orderId } = Route.useParams();
  const { orders, shops, hydrated } = useStore();
  const order = orders.find((o) => o.id === orderId);

  if (!order) {
    return (
      <CustomerShell>
        <div className="container-page py-20 text-center">
          <h1 className="text-page-title font-bold">
            {hydrated ? "Order not found" : "Loading order…"}
          </h1>
          {hydrated && (
            <Link to="/orders" className="mt-6 inline-block">
              <Button variant="outline">Back to my orders</Button>
            </Link>
          )}
        </div>
      </CustomerShell>
    );
  }

  const shop = shops.find((s) => s.id === order.shopId);
  const flow = statusFlow(order.fulfillment);
  const currentIndex = flow.indexOf(order.status);
  const reached = (s: string) => order.timeline.some((t) => t.status === s);

  return (
    <CustomerShell>
      <div className="container-page py-8 md:py-12">
        <Link to="/orders" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> My orders
        </Link>

        <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-page-title font-bold">{order.id}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Placed {new Date(order.createdAt).toLocaleString("en-IN")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={order.status} />
            <PaymentBadge status={order.paymentStatus} />
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-primary/20 bg-primary-light px-4 py-3 text-sm font-medium text-primary">
          {customerStatusCopy[order.status]}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="space-y-6">
            <div className="card-surface p-5 md:p-6">
              <h2 className="text-base font-semibold">Order timeline</h2>
              <ol className="mt-5 space-y-0">
                {flow.map((s, i) => {
                  const entry = order.timeline.find((t) => t.status === s);
                  const isDone = reached(s) && i < currentIndex;
                  const isCurrent = s === order.status;
                  return (
                    <li key={s} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <span
                          className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold",
                            isDone && "border-success bg-success text-success-foreground",
                            isCurrent && "border-primary bg-primary text-primary-foreground",
                            !isDone && !isCurrent && "border-border bg-card text-subtle",
                          )}
                        >
                          {isDone ? <Check className="h-4 w-4" /> : i + 1}
                        </span>
                        {i < flow.length - 1 && (
                          <span
                            className={cn(
                              "w-px flex-1",
                              isDone ? "bg-success" : "bg-border",
                            )}
                          />
                        )}
                      </div>
                      <div className="pb-6">
                        <p
                          className={cn(
                            "text-sm font-semibold",
                            !isDone && !isCurrent && "text-muted-foreground",
                          )}
                        >
                          {orderStatusLabel[s]}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {entry
                            ? new Date(entry.at).toLocaleString("en-IN")
                            : isCurrent
                              ? "In progress"
                              : "Pending"}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>

            <div className="card-surface p-5 md:p-6">
              <h2 className="text-base font-semibold">Documents</h2>
              <div className="mt-4 space-y-3">
                {order.documents.map((d) => (
                  <div
                    key={d.id}
                    className="flex items-center gap-3 rounded-lg border border-border px-4 py-3"
                  >
                    <FileText className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">{d.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {d.pages} pages · {d.sizeMb} MB
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card-surface p-5 md:p-6">
              <h2 className="text-base font-semibold">Print specification</h2>
              <dl className="mt-4 divide-y divide-border text-sm">
                {(
                  [
                    ["Paper", order.configLabels.paper],
                    ["Print type", order.configLabels.printType],
                    ["Sides", order.configLabels.side],
                    ["Orientation", order.configLabels.orientation],
                    ["Copies", String(order.config.copies)],
                    [
                      "Pages",
                      order.config.pageRangeMode === "all"
                        ? "All pages"
                        : order.config.pageRange || "All pages",
                    ],
                    ["Binding", order.configLabels.binding],
                    [
                      "Extras",
                      order.configLabels.additional.length
                        ? order.configLabels.additional.join(", ")
                        : "None",
                    ],
                    ["Fulfilment", fulfillmentLabel[order.fulfillment]],
                  ] as const
                ).map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-6 py-2.5">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="text-right font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <div className="card-surface p-5">
              <h2 className="text-base font-semibold">Payment</h2>
              <dl className="mt-4 space-y-2 text-sm">
                <Row label="Printing" value={inr(order.price.printing)} />
                <Row label="Binding" value={inr(order.price.binding)} />
                <Row label="Extras" value={inr(order.price.services)} />
                <Row label="Delivery" value={inr(order.price.delivery)} />
                {order.price.discount > 0 && (
                  <Row label="Discount" value={`− ${inr(order.price.discount)}`} />
                )}
              </dl>
              <div className="mt-4 flex justify-between border-t border-border pt-4">
                <span className="text-sm font-semibold">Total</span>
                <span className="text-xl font-bold">{inr(order.price.total)}</span>
              </div>
              <div className="mt-4 space-y-1.5 rounded-lg bg-secondary p-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Method</span>
                  <span className="font-semibold">{paymentMethodLabel[order.paymentMethod]}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Paid</span>
                  <span className="font-semibold">{inr(order.amountPaid)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Balance</span>
                  <span className="font-semibold">{inr(order.balance)}</span>
                </div>
              </div>
              {order.balance > 0 && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Balance of {inr(order.balance)} is collected at{" "}
                  {order.fulfillment === "pickup" ? "pickup" : "delivery"}.
                </p>
              )}
            </div>

            {shop && (
              <div className="card-surface p-5">
                <h2 className="text-base font-semibold">Print shop</h2>
                <p className="mt-3 inline-flex items-center gap-2 text-sm font-medium">
                  <Store className="h-4 w-4 text-primary" /> {shop.name}
                </p>
                <p className="mt-2 inline-flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0" /> {shop.address}
                </p>
                <p className="mt-2 inline-flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" /> {shop.phone}
                </p>
                <p className="mt-2 inline-flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" /> {shop.hours}
                </p>
              </div>
            )}

            {order.address && (
              <div className="card-surface p-5">
                <h2 className="text-base font-semibold">Delivery address</h2>
                <p className="mt-3 text-sm font-medium">{order.address.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {order.address.house}, {order.address.street}, {order.address.area},{" "}
                  {order.address.city} - {order.address.pincode}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{order.address.phone}</p>
              </div>
            )}

            <Link to="/support">
              <Button variant="outline" className="w-full">
                Need help with this order?
              </Button>
            </Link>
          </aside>
        </div>
      </div>
    </CustomerShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
