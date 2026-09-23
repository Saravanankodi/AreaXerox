import { createFileRoute, Link } from "@/lib/navigation";
import { ArrowLeft, Clock, Download, FileText, MapPin, Phone, Store } from "lucide-react";
import { toast } from "sonner";
import { CustomerShell } from "@/components/layout/CustomerShell";
import { Button } from "@/components/ui/button";
import { OrderTimeline } from "@/components/OrderTimeline";
import { ReviewCard } from "@/components/ReviewCard";
import { PaymentBadge, StatusBadge } from "@/components/StatusBadge";
import { OnlinePaymentState } from "@/components/OnlinePaymentState";
import { PayNowCard } from "@/components/PayNowCard";
import { useStore } from "@/lib/store";
import { calculateDocumentPrices, inr } from "@/lib/pricing";
import { customerStatusCopy, fulfillmentLabel } from "@/lib/labels";
import { formatShopAddress } from "@/lib/address";
import type { DocumentFile } from "@/types";

export const Route = createFileRoute("/orders/$orderId")({
  head: () => ({
    meta: [
      { title: "Order Details — XEROXMATE" },
      {
        name: "description",
        content:
          "Live timeline, print specification, payment breakdown and shop details for your order.",
      },
      { property: "og:title", content: "Order Details — XEROXMATE" },
      { property: "og:description", content: "Follow your print order step by step." },
    ],
  }),
  component: OrderDetail,
});

function OrderDetail() {
  const { orderId } = Route.useParams();
  const { orders, shops, hydrated, getCachedFile } = useStore();
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
  const docPrices = shop ? calculateDocumentPrices(shop, order.documents, order.config) : [];

  function openDocument(doc: DocumentFile) {
    const file = getCachedFile(doc.id);
    if (!file) {
      toast.error("Document file is not available in this session.");
      return;
    }
    const url = URL.createObjectURL(file);
    window.open(url, "_blank", "noopener,noreferrer");
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  function downloadDocument(doc: DocumentFile) {
    const file = getCachedFile(doc.id);
    if (!file) {
      toast.error("Document file is not available in this session.");
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
    <CustomerShell>
      <div className="container-page py-8 md:py-12">
        <Link
          to="/orders"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
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
            <OnlinePaymentState order={order} />
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-primary/20 bg-primary-light px-4 py-3 text-sm font-medium text-primary">
          {customerStatusCopy[order.status]}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="space-y-6">
            <div className="card-surface p-5 md:p-6">
              <h2 className="text-base font-semibold">Order timeline</h2>
              <div className="mt-5">
                <OrderTimeline
                  fulfillment={order.fulfillment}
                  status={order.status}
                  timeline={order.timeline}
                />
              </div>
            </div>

            <div className="card-surface p-5 md:p-6">
              <h2 className="text-base font-semibold">Documents</h2>
              <div className="mt-4 space-y-3">
                {order.documents.map((d) => (
                  <div
                    key={d.id}
                    role="button"
                    tabIndex={0}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-border px-4 py-3 transition-colors hover:bg-secondary/50"
                    onClick={() => openDocument(d)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openDocument(d);
                      }
                    }}
                  >
                    <FileText className="h-5 w-5 shrink-0 text-primary" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{d.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {d.pages} pages · {d.sizeMb} MB
                      </p>
                    </div>
                    <button
                      type="button"
                      aria-label={`Download ${d.name}`}
                      className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadDocument(d);
                      }}
                    >
                      <Download className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="">
              <h2 className="text-base font-semibold">Print specification</h2>
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                {order.documents.map((doc, idx) => {
                  const docConfig = doc.printConfig ?? order.config;
                  const filePaper = shop?.paperTypes.find((p) => p.id === docConfig.paperTypeId);
                  const bindingOption = docConfig.bindingId
                    ? shop?.binding.find((b) => b.id === docConfig.bindingId)
                    : null;
                  const additionalOptions = docConfig.additionalIds
                    .map((id) => shop?.additional.find((a) => a.id === id))
                    .filter((o): o is NonNullable<typeof o> => !!o);
                  const rows: [string, string][] = [
                    ["Paper", filePaper?.name ?? "Paper"],
                    ["Print type", docConfig.printType === "color" ? "Colour" : "Black & White"],
                    ["Sides", docConfig.side === "double" ? "Front & Back" : "Front Only"],
                    [
                      "Orientation",
                      docConfig.orientation === "portrait" ? "Portrait" : "Landscape",
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
                    ["Delivery Option", fulfillmentLabel[order.fulfillment]],
                  ];
                  if (doc.pageRange) rows.push(["Range", doc.pageRange]);
                  return (
                    <div
                      key={doc.id}
                      className="rounded-lg border border-border bg-secondary/50 p-4"
                    >
                      <p className="text-sm font-semibold">Document {idx + 1}</p>
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

          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <PayNowCard order={order} />

            <div className="card-surface p-5">
              <h2 className="text-base font-semibold">File costs</h2>
              <div className="mt-4 space-y-4 text-sm">
                {order.documents.map((doc, idx) => {
                  const docConfig = doc.printConfig ?? order.config;
                  const filePaper = shop?.paperTypes.find((p) => p.id === docConfig.paperTypeId);
                  const bindingOption = docConfig.bindingId
                    ? shop?.binding.find((b) => b.id === docConfig.bindingId)
                    : null;
                  const additionalOptions = docConfig.additionalIds
                    .map((id) => shop?.additional.find((a) => a.id === id))
                    .filter((o): o is NonNullable<typeof o> => !!o);
                  const extras: string[] = [];
                  if (bindingOption) extras.push(bindingOption.name);
                  additionalOptions.forEach((a) => extras.push(a.name));
                  const priceLine = docPrices[idx];
                  return (
                    <div key={doc.id}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold">Document {idx + 1}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {doc.pages} page{doc.pages === 1 ? "" : "s"} · {docConfig.copies} copy
                            {docConfig.copies === 1 ? "" : ""} ·{" "}
                            {docConfig.printType === "color" ? "Colour" : "B/W"} ·{" "}
                            {filePaper?.name ?? "Paper"}
                            {extras.length > 0 && ` · ${extras.join(" · ")}`}
                          </p>
                        </div>
                        <span className="shrink-0 font-semibold">{inr(priceLine?.total ?? 0)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              {(() => {
                const totalPrinting = docPrices.reduce((s, p) => s + p.printing, 0);
                const totalBinding = docPrices.reduce((s, p) => s + p.binding, 0);
                const totalServices = docPrices.reduce((s, p) => s + p.services, 0);
                const finalTotal = totalPrinting + totalBinding + totalServices;
                const hasAny = totalPrinting > 0 || totalBinding > 0 || totalServices > 0;
                if (!hasAny) return null;
                return (
                  <div className="mt-4 space-y-1.5 border-t border-border pt-4 text-sm">
                    {totalPrinting > 0 && <Row label="Printing" value={inr(totalPrinting)} />}
                    {totalBinding > 0 && <Row label="Binding" value={inr(totalBinding)} />}
                    {totalServices > 0 && <Row label="Extras" value={inr(totalServices)} />}
                    <div className="flex justify-between border-t border-border pt-2">
                      <span className="font-semibold">Final total</span>
                      <span className="text-xl font-bold">{inr(finalTotal)}</span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {shop && <ReviewCard order={order} />}

            {shop && (
              <div className="card-surface p-5">
                <h2 className="text-base font-semibold">Print shop</h2>
                <p className="mt-3 inline-flex items-center gap-2 text-sm font-medium">
                  <Store className="h-4 w-4 text-primary" /> {shop.name}
                </p>
                <p className="mt-2 inline-flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0" /> {formatShopAddress(shop)}
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
