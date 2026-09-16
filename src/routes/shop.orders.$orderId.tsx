import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@/lib/navigation";
import { ArrowLeft, Download, FileText, Eye, User, Phone, MapPin } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { OrderTimeline } from "@/components/OrderTimeline";
import { ShopShell } from "@/components/layout/ShopShell";
import { useStore } from "@/lib/store";
import { fulfillmentLabel, nextActionLabel, statusFlow } from "@/lib/labels";
import { cn } from "@/lib/utils";
import type { DocumentFile } from "@/types";

export const Route = createFileRoute("/shop/orders/$orderId")({
  head: () => ({
    meta: [
      { title: "Order Details — XEROXMATE Shop" },
      {
        name: "description",
        content: "View order details, print specifications and track progress.",
      },
      { property: "og:title", content: "Order Details — XEROXMATE Shop" },
      { property: "og:description", content: "View and process a print order." },
    ],
  }),
  component: ShopOrderDetail,
});

function ShopOrderDetail() {
  const { orderId } = Route.useParams();
  const { orders, shops, advanceOrder, hydrated, getCachedFile } = useStore();
  const order = orders.find((o) => o.id === orderId);

  const [previewDocument, setPreviewDocument] = useState<DocumentFile | null>(null);
  const [previewFile, setPreviewFile] = useState<File | undefined>(undefined);

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
  const futureActions = flow.slice(currentIndex + 1);

  function openPreview(doc: DocumentFile) {
    if (doc.cloudinary?.url) {
      window.open(doc.cloudinary.url, "_blank");
      return;
    }
    setPreviewFile(getCachedFile(doc.id));
    setPreviewDocument(doc);
  }

  function downloadFile(doc: DocumentFile) {
    if (doc.cloudinary?.url) {
      window.open(doc.cloudinary.url, "_blank");
      toast.success(`Opening ${doc.name}`);
      return;
    }
    const file = getCachedFile(doc.id);
    if (!file) {
      toast.error("File not available", {
        description: "The original file was not found locally.",
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
    <ShopShell title={`Order ${order.id}`} subtitle={`Placed ${new Date(order.createdAt).toLocaleString("en-IN")}`}>
      <Link
        to="/shop/orders"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> My orders
      </Link>

      <div className="mb-6">
        <h2 className="text-page-title font-bold">{order.id}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Placed {new Date(order.createdAt).toLocaleString("en-IN")}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        {/* LEFT — ORDER DETAILS */}
        <div className="space-y-6 min-w-0">
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
                const file = getCachedFile(d.id);
                const hasFile = !!file || !!d.cloudinary?.url;
                return (
                  <div
                    key={d.id}
                    className="flex items-center gap-3 rounded-lg border border-border px-4 py-3"
                  >
                    <FileText className="h-4 w-4 shrink-0 text-primary" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{d.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {d.pages} pages · {d.sizeMb} MB
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        className={cn(
                          "rounded-md p-1.5 hover:bg-secondary",
                          hasFile
                            ? "text-muted-foreground hover:text-foreground"
                            : "cursor-not-allowed text-muted-foreground/40",
                        )}
                        title={hasFile ? "Preview document" : "File not available"}
                        disabled={!hasFile}
                        onClick={() => openPreview(d)}
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className={cn(
                          "rounded-md p-1.5 hover:bg-secondary",
                          hasFile
                            ? "text-muted-foreground hover:text-foreground"
                            : "cursor-not-allowed text-muted-foreground/40",
                        )}
                        title={hasFile ? "Download document" : "File not available"}
                        disabled={!hasFile}
                        onClick={() => downloadFile(d)}
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
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
                  ["Orientation", docConfig.orientation === "portrait" ? "Portrait" : "Landscape"],
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
                return (
                  <div key={doc.id} className="card-surface p-4">
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

        {/* RIGHT — SHOPKEEPER ACTIONS */}
        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <div className="card-surface p-5">
            <h3 className="text-sm font-semibold">Shopkeeper Actions</h3>
            <div className="mt-4 space-y-3">
              {futureActions.length > 0 &&
                futureActions.map((status, i) => {
                  const isNext = i === 0;
                  const label = nextActionLabel(status);
                  return (
                    <button
                      key={status}
                      type="button"
                      disabled={!isNext}
                      onClick={() => {
                        advanceOrder(order.id, status);
                        toast.success(`${order.id} → ${label}`);
                      }}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors",
                        isNext
                          ? "hover:bg-primary/10 cursor-pointer"
                          : "text-foreground cursor-pointer opacity-80 hover:bg-secondary/50",
                      )}
                    >
                      <span
                        className={cn(
                          "relative h-6 w-10 shrink-0 rounded-full transition-colors",
                          isNext ? "bg-primary" : "bg-primary/70",
                        )}
                      >
                        <span
                          className={cn(
                            "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
                            isNext && "translate-x-0",
                          )}
                        />
                      </span>
                      {label}
                    </button>
                  );
                })}

              {order.status === "NEW" && (
                <button
                  type="button"
                  onClick={() => {
                    advanceOrder(order.id, "REJECTED");
                    toast.error(`${order.id} rejected`);
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                >
                  <span className="relative h-6 w-10 shrink-0 rounded-full bg-destructive/60">
                    <span className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm" />
                  </span>
                  Reject Order
                </button>
              )}

              {futureActions.length === 0 &&
                order.status !== "NEW" &&
                order.status !== "REJECTED" && (
                  <div className="rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm font-medium text-success">
                    Order is {order.status === "DELIVERED" ? "delivered" : "completed"}.
                  </div>
                )}

              {order.status === "REJECTED" && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
                  Order was rejected.
                </div>
              )}
            </div>
          </div>

          {/* Customer Details */}
          <div className="card-surface p-5">
            <h3 className="text-sm font-semibold">Customer Details</h3>
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Customer</p>
                  <p className="text-sm font-medium">{order.customerName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="text-sm font-medium">{order.customerPhone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Alternate Phone</p>
                  <p className="text-sm font-medium text-muted-foreground">Not provided</p>
                </div>
              </div>
              {order.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Location</p>
                    <p className="text-sm">
                      {[order.address.house, order.address.street, order.address.area]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                    <p className="text-sm">
                      {[order.address.city, order.address.pincode].filter(Boolean).join(" — ")}
                    </p>
                  </div>
                </div>
              )}
              {!order.address && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Location</p>
                    <p className="text-sm text-muted-foreground">Pickup order</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* Document Preview Dialog */}
      <Dialog
        open={!!previewDocument}
        onOpenChange={(open) => {
          if (!open) {
            setPreviewDocument(null);
            setPreviewFile(undefined);
          }
        }}
      >
        <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="pr-8 wrap-break-word">
              {previewDocument?.name ?? "Document preview"}
            </DialogTitle>
            <DialogDescription>
              {previewDocument
                ? `${previewDocument.pages} page${previewDocument.pages === 1 ? "" : "s"} · ${previewDocument.sizeMb} MB`
                : ""}
            </DialogDescription>
          </DialogHeader>
          {previewFile?.type.startsWith("image/") && (
            <DocumentImagePreview file={previewFile} name={previewDocument?.name} />
          )}
          {(previewFile?.type === "application/pdf" ||
            previewDocument?.name.toLowerCase().endsWith(".pdf")) && (
              <DocumentPdfPreview file={previewFile} name={previewDocument?.name} />
            )}
          {!previewFile && (
            <div className="rounded-lg border border-dashed border-border bg-secondary/50 p-6 text-center">
              <FileText className="mx-auto h-8 w-8 text-primary" />
              <p className="mt-3 text-sm font-semibold">Preview is not available</p>
              <p className="mt-1 text-xs text-muted-foreground">
                The original file is not available. It may have been lost on page refresh.
              </p>
            </div>
          )}
          {previewFile &&
            !previewFile.type.startsWith("image/") &&
            previewFile.type !== "application/pdf" &&
            !previewDocument?.name.toLowerCase().endsWith(".pdf") && (
              <div className="rounded-lg border border-dashed border-border bg-secondary/50 p-6 text-center">
                <FileText className="mx-auto h-8 w-8 text-primary" />
                <p className="mt-3 text-sm font-semibold">
                  Preview is not available for this file type
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {previewFile.type || "Unknown file type"} · {previewDocument?.sizeMb ?? 0} MB
                </p>
              </div>
            )}
        </DialogContent>
      </Dialog>
    </ShopShell>
  );
}

function DocumentImagePreview({ file, name }: { file: File; name: string | undefined }) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  useEffect(() => {
    const url = URL.createObjectURL(file);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  if (!objectUrl) return null;
  return (
    <img
      src={objectUrl}
      alt={`Preview of ${name ?? "document"}`}
      className="mx-auto max-h-[68vh] w-auto max-w-full rounded-md object-contain"
    />
  );
}

function DocumentPdfPreview({ file, name }: { file: File | undefined; name: string | undefined }) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!file) {
      setObjectUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  if (!objectUrl) return null;
  return (
    <iframe
      src={objectUrl}
      title={`Preview of ${name ?? "document"}`}
      className="h-[62vh] w-full rounded-md border border-border"
    />
  );
}
