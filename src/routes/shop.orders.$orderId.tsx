import { createFileRoute, Link } from "@/lib/navigation";
import {
  ArrowLeft,
  Download,
  Eye,
  FileText,
  User,
  Phone,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { OrderBill } from "@/components/OrderBill";
import { OrderTimeline } from "@/components/OrderTimeline";
import { PaymentCollection } from "@/components/shopkeeper/PaymentCollection";
import { ShopShell } from "@/components/layout/ShopShell";
import { useStore } from "@/lib/store";
import { createNotification } from "@/lib/notifications";
import { fulfillmentLabel, nextActionLabel, statusFlow } from "@/lib/labels";
import { cn } from "@/lib/utils";
import type { DocumentFile, OrderStatus } from "@/types";

export const Route = createFileRoute("/shop/orders/$orderId")({
  head: () => ({
    meta: [
      { title: "Order Details — XEROXMATE Shop" },
      {
        name: "description",
        content:
          "View order details, print specifications and track progress.",
      },
      {
        property: "og:title",
        content: "Order Details — XEROXMATE Shop",
      },
      {
        property: "og:description",
        content: "View and process a print order.",
      },
    ],
  }),
  component: ShopOrderDetail,
});

function ShopOrderDetail() {
  const { orderId } = Route.useParams();

  const {
    orders,
    shops,
    advanceOrder,
    addNotification,
    activeShop,
    hydrated,
    getCachedFile,
  } = useStore();

  const order = orders.find((o) => o.id === orderId);

  if (!order) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-muted-foreground">
          {hydrated ? "Order not found." : "Loading order…"}
        </p>

        {hydrated && (
          <Link to="/shop/orders" className="mt-6 inline-block">
            <Button variant="outline">Back to orders</Button>
          </Link>
        )}
      </div>
    );
  }

  const shop = shops.find((s) => s.id === order.shopId);
  const flow = statusFlow(order.fulfillment);
  const currentIndex = flow.indexOf(order.status);

  function isFileUsable(doc: DocumentFile) {
    // Blob URLs are session-local (only the machine that uploaded can open them).
    return !!getCachedFile(doc.id) || (!!doc.cloudinary?.url && !doc.cloudinary.url.startsWith("blob:"));
  }

  function openPreview(doc: DocumentFile) {
    if (doc.cloudinary?.url) {
      if (isFileUsable(doc)) {
        window.open(doc.cloudinary.url, "_blank");
        return;
      }
      toast.error("File not available", {
        description: "This document was uploaded into the customer's browser only.",
      });
      return;
    }
    const file = getCachedFile(doc.id);
    if (file) {
      window.open(URL.createObjectURL(file), "_blank");
      return;
    }
    toast.error("File not available", {
      description: "The original file was not found. It may have been lost on page refresh.",
    });
  }

  function downloadFile(doc: DocumentFile) {
    if (doc.cloudinary?.url) {
      if (isFileUsable(doc)) {
        window.open(doc.cloudinary.url, "_blank");
        toast.success(`Opening ${doc.name}`);
        return;
      }
      toast.error("File not available", {
        description: "This document was uploaded into the customer's browser only.",
      });
      return;
    }
    const file = getCachedFile(doc.id);

    if (!file) {
      toast.error("File not available", {
        description:
          "The original file was not found. It may have been lost on page refresh.",
      });
      return;
    }

    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;
    a.download = doc.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Downloading ${doc.name}`);
  }

  return (
    <ShopShell
      title={`Order ${order.id}`}
      subtitle={`Placed ${new Date(order.createdAt).toLocaleString("en-IN")}`}
    >
      <Link
        to="/shop/orders"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        My orders
      </Link>

      <div className="mb-6">
        <h2 className="text-page-title font-bold">{order.id}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Placed {new Date(order.createdAt).toLocaleString("en-IN")}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        {/* LEFT — ORDER DETAILS */}
        <div className="min-w-0 space-y-6">
          {/* Order Timeline */}
          <div className="card-surface p-5">
            <h3 className="text-sm font-semibold">Order Timeline</h3>
            <div className="mt-4">
              <OrderTimeline
                fulfillment={order.fulfillment}
                status={order.status}
                timeline={order.timeline}
              />
            </div>
          </div>

          {/* Documents */}
          <div className="card-surface p-5">
            <h3 className="text-sm font-semibold">Documents</h3>
            <div className="mt-3 space-y-2">
              {order.documents.map((d) => {
                const hasFile = isFileUsable(d);
                return (
                  <div
                    key={d.id}
                    role="button"
                    tabIndex={0}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-border px-4 py-3 transition-colors hover:bg-secondary/50"
                    onClick={() => openPreview(d)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openPreview(d);
                      }
                    }}
                  >
                    <FileText className="h-4 w-4 shrink-0 text-primary" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{d.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {d.pages} pages · {d.sizeMb} MB
                      </p>
                    </div>
                    <button
                      type="button"
                      aria-label={`Preview ${d.name}`}
                      title="Preview"
                      disabled={!hasFile}
                      className={cn(
                        "shrink-0 rounded-md p-1.5 transition-colors",
                        hasFile
                          ? "text-muted-foreground hover:bg-secondary hover:text-foreground"
                          : "cursor-not-allowed text-muted-foreground/40",
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        openPreview(d);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Download ${d.name}`}
                      title="Download"
                      disabled={!hasFile}
                      className={cn(
                        "shrink-0 rounded-md p-1.5 transition-colors",
                        hasFile
                          ? "text-muted-foreground hover:bg-secondary hover:text-foreground"
                          : "cursor-not-allowed text-muted-foreground/40",
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadFile(d);
                      }}
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Print Specifications */}
          <div>
            <h3 className="text-sm font-semibold">Print specification</h3>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              {order.documents.map((doc, idx) => {
                const docConfig = doc.printConfig ?? order.config;
                const filePaper = shop?.paperTypes.find(
                  (p) => p.id === docConfig.paperTypeId,
                );
                const bindingOption = docConfig.bindingId
                  ? shop?.binding.find((b) => b.id === docConfig.bindingId)
                  : null;
                const additionalOptions = docConfig.additionalIds
                  .map((id) => shop?.additional.find((a) => a.id === id))
                  .filter(
                    (o): o is NonNullable<typeof o> => !!o,
                  );

                const rows: [string, string][] = [
                  ["Paper", filePaper?.name ?? "Paper"],
                  [
                    "Print type",
                    docConfig.printType === "color"
                      ? "Colour"
                      : "Black & White",
                  ],
                  [
                    "Sides",
                    docConfig.side === "double" ? "Front & Back" : "Front Only",
                  ],
                  [
                    "Orientation",
                    docConfig.orientation === "portrait"
                      ? "Portrait"
                      : "Landscape",
                  ],
                  ["Copies", String(docConfig.copies)],
                  [
                    "Pages",
                    docConfig.pageRangeMode === "all"
                      ? "All pages"
                      : docConfig.pageRange || "All pages",
                  ],
                  [
                    "Page layout",
                    `${docConfig.pageLayout ?? 1} Page${(docConfig.pageLayout ?? 1) > 1 ? "s" : ""} / Sheet`,
                  ],
                  ["Binding", bindingOption?.name ?? "None"],
                  [
                    "Extras",
                    additionalOptions.length
                      ? additionalOptions.map((a) => a.name).join(", ")
                      : "None",
                  ],
                  ["Delivery option", fulfillmentLabel[order.fulfillment]],
                ];

                if (doc.pageRange) rows.push(["Range", doc.pageRange]);

                return (
                  <div key={doc.id} className="card-surface p-4">
                    <p className="text-sm font-semibold">
                      Document {idx + 1}
                    </p>
                    <dl className="mt-2 divide-y divide-border text-sm">
                      {rows.map(([k, v]) => (
                        <div key={k} className="flex justify-between gap-4 py-2">
                          <dt className="text-muted-foreground">{k}</dt>
                          <dd className="text-right font-medium">{v}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT — SHOPKEEPER ACTIONS */}
        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          {/* Shopkeeper Actions */}
          <div className="card-surface p-5">
            <h3 className="text-sm font-semibold">Shopkeeper Actions</h3>
            <div className="mt-4 space-y-2">
              {flow.map((status, i) => {
                if (status === "NEW") return null;
                if (order.status === "REJECTED" && status !== "REJECTED") return null;
                if (status === "REJECTED" && order.status !== "REJECTED") return null;

                const label = nextActionLabel(status);

                if (order.status === "COMPLETED" || order.status === "DELIVERED") {
                  if (i === currentIndex) {
                    return (
                      <div
                        key={status}
                        className="rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm font-medium text-success"
                      >
                        Order is {order.status === "DELIVERED" ? "delivered" : "completed"}.
                      </div>
                    );
                  }
                }

                // Steps up to and including the current position are done.
                if (i < currentIndex + 1) {
                  return (
                    <div
                      key={status}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium"
                    >
                      <span className="relative h-6 w-10 shrink-0 rounded-full bg-success/70">
                        <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm translate-x-4" />
                      </span>
                      <span className="text-muted-foreground line-through">{label}</span>
                    </div>
                  );
                }

                // The immediate next step is the shopkeeper's active action.
                if (i === currentIndex + 1) {
                  return (
                    <button
                      key={status}
                      type="button"
                      onClick={() => {
                        advanceOrder(order.id, status);
                        toast.success(`${order.id} → ${label}`);

                        const statusMessages: Record<OrderStatus, string> = {
                          ACCEPTED: "has been accepted",
                          PRINTING: "is now being printed",
                          FINISHING: "is being finished",
                          READY_PICKUP: "is ready for pickup",
                          READY_DELIVERY: "is ready for delivery",
                          OUT_FOR_DELIVERY: "is out for delivery",
                          DELIVERED: "has been delivered",
                          COMPLETED: "has been completed",
                          NEW: "has been placed",
                          REJECTED: "has been rejected",
                        };

                        addNotification(
                          createNotification({
                            recipientId: order.customerPhone,
                            recipientRole: "customer",
                            type: "order_status_changed",
                            title: `Order ${label}`,
                            message: `Your order ${order.id} ${statusMessages[status] ?? `moved to ${status}`} by ${activeShop.name}.`,
                            relatedEntityId: order.id,
                            entityType: "order",
                          }),
                        );
                      }}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors cursor-pointer hover:bg-primary/10"
                    >
                      <span className="relative h-6 w-10 shrink-0 rounded-full bg-primary">
                        <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm translate-x-0" />
                      </span>
                      {label}
                      {order.balance > 0 && (
                        <span className="ml-auto text-[10px] text-muted-foreground">
                          Payment pending
                        </span>
                      )}
                    </button>
                  );
                }

                return (
                  <div
                    key={status}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-muted-foreground opacity-40"
                  >
                    <span className="relative h-6 w-10 shrink-0 rounded-full bg-primary/20">
                      <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm" />
                    </span>
                    {label}
                  </div>
                );
              })}

              {/* Reject Order — only at NEW */}
              {order.status === "NEW" && (
                <button
                  type="button"
                  onClick={() => {
                    advanceOrder(order.id, "REJECTED");
                    toast.error(`${order.id} rejected`);
                    addNotification(
                      createNotification({
                        recipientId: order.customerPhone,
                        recipientRole: "customer",
                        type: "order_rejected",
                        title: "Order Rejected",
                        message: `Your order ${order.id} has been rejected by ${activeShop.name}.`,
                        relatedEntityId: order.id,
                        entityType: "order",
                      }),
                    );
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                >
                  <span className="relative h-6 w-10 shrink-0 rounded-full bg-destructive/60">
                    <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm" />
                  </span>
                  Reject Order
                </button>
              )}

              {/* Rejected */}
              {order.status === "REJECTED" && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
                  Order was rejected.
                </div>
              )}
            </div>
          </div>

          {/* Order Bill */}
          <OrderBill order={order} />

          {/* Payment Collection */}
          <PaymentCollection order={order} />

          {/* Customer Details */}
          <div className="card-surface p-5">
            <h3 className="text-sm font-semibold">Customer Details</h3>
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Customer</p>
                  <p className="text-sm font-medium">
                    {order.customerName || "Customer"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="text-sm font-medium">
                    {order.customerPhone || "—"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">
                    Alternate Phone
                  </p>
                  <p className="text-sm font-medium text-muted-foreground">
                    Not provided
                  </p>
                </div>
              </div>
              {order.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Location</p>
                    <p className="text-sm">
                      {[
                        order.address.house,
                        order.address.street,
                        order.address.area,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                    <p className="text-sm">
                      {[order.address.city, order.address.pincode]
                        .filter(Boolean)
                        .join(" — ")}
                    </p>
                  </div>
                </div>
              )}
              {!order.address && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Location</p>
                    <p className="text-sm text-muted-foreground">
                      Pickup order
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </ShopShell>
  );
}
