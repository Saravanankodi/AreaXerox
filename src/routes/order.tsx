import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  FileText,
  Trash2,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Phone,
  Store as StoreIcon,
  Truck,
  Wallet,
  PartyPopper,
  Eye,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { CustomerShell } from "@/components/layout/CustomerShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DocumentUploadCard } from "@/components/home/DocumentUploadCard";
import { cn } from "@/lib/utils";
import { newOrderId, useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { calculateDocumentPrices, calculateOrderPrice, inr, paymentSplit } from "@/lib/pricing";
import { detectPageCount } from "@/lib/document-pages";
import { paymentMethodLabel } from "@/lib/labels";
import { ACCEPTED_UPLOAD_TYPES, isSupportedUpload } from "@/lib/upload-config";
import type {
  Address,
  DocumentFile,
  Fulfillment,
  Orientation,
  Order,
  PaymentMethod,
  PrintConfig,
  Shop,
} from "@/types";

export const Route = createFileRoute("/order")({
  head: () => ({
    meta: [
      { title: "Place a Print Order — XEROXMATE" },
      {
        name: "description",
        content:
          "Upload documents, choose paper, colour, binding and delivery, then pay your way — in one guided flow.",
      },
      { property: "og:title", content: "Place a Print Order — XEROXMATE" },
      {
        property: "og:description",
        content: "A six-step guided flow from upload to confirmed print order.",
      },
    ],
  }),
  component: OrderPage,
});

const STEP_TITLES = [
  "Upload + specifications",
  "Select shop",
  "Pickup / delivery",
  "Payment + preview",
];

const defaultConfig: PrintConfig = {
  paperTypeId: "a4",
  printType: "bw",
  side: "single",
  copies: 1,
  pageRangeMode: "all",
  pageRange: "",
  pageLayout: 1,
  orientation: "portrait",
  bindingId: null,
  additionalIds: [],
};

function StepRail({ step }: { step: number }) {
  return (
    <ol className="flex flex-wrap gap-2">
      {STEP_TITLES.map((title, i) => {
        const state = i === step ? "current" : i < step ? "done" : "todo";
        return (
          <li
            key={title}
            className={cn(
              "flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-semibold",
              state === "current" && "border-primary bg-primary-light text-primary",
              state === "done" && "border-success/30 bg-success-light text-success",
              state === "todo" && "border-border bg-card text-muted-foreground",
            )}
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full border border-current text-[10px]">
              {state === "done" ? <Check className="h-3 w-3" /> : i + 1}
            </span>
            <span className="hidden sm:inline">{title}</span>
          </li>
        );
      })}
    </ol>
  );
}

function SectionCard({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="md:card-surface p-5 md:px-6 md:py-4">
      <h2 className="text-base font-semibold">{title}</h2>
      {hint && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}
      <div className="mt-5">{children}</div>
    </div>
  );
}

/** Physical sheets from quantity, duplex format, and n-up layout. Colour does not change sheet count. */
function printedPaperCount(pages: number, config: PrintConfig) {
  const copies = Math.max(1, Math.floor(config.copies));
  const layout = config.pageLayout ?? 1;
  const pageCount = Math.max(1, Math.floor(pages));
  const impressions = Math.ceil(pageCount / layout);
  const sheetsPerCopy = config.side === "double" ? Math.ceil(impressions / 2) : impressions;
  return sheetsPerCopy * copies;
}

function FilePrintOptions({
  document,
  index,
  shop,
  fallback,
  onSelect,
  onChange,
  onInstructionsChange,
  onPreview,
  onRemove,
}: {
  document: DocumentFile;
  index: number;
  shop: Shop;
  fallback: PrintConfig;
  onSelect: () => void;
  onChange: (updater: (config: PrintConfig) => PrintConfig) => void;
  onInstructionsChange: (value: string) => void;
  onPreview: () => void;
  onRemove: () => void;
}) {
  const config = document.printConfig ?? fallback;
  const pageLayout = config.pageLayout ?? 1;
  const papers = printedPaperCount(document.pages, config);
  const enabledPapers = shop.paperTypes.filter((paper) => paper.enabled);
  return (
    <article onClick={onSelect} className="card-surface min-w-0 cursor-pointer overflow-hidden">
      <div className="flex items-start justify-between gap-3 border-b border-border bg-secondary/50 px-4 py-3">
        <div className="flex min-w-0 items-start gap-2">
          <FileText className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div className="min-w-0">
            <span className="inline-flex rounded-md bg-primary-light px-2 py-0.5 text-[11px] font-semibold text-primary">
              Document {index + 1}
            </span>
            <p className="mt-1.5 truncate text-sm font-semibold">{document.name}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {document.detectingPages
                ? "Detecting pages..."
                : `${document.pages} page${document.pages === 1 ? "" : "s"} · ${document.sizeMb} MB · ${
                    document.pageCountDetected ? "Detected automatically" : "Confirm page count"
                  }`}
            </p>
            <p className="mt-1 text-xs font-semibold text-foreground">
              {document.detectingPages
                ? "Detecting..."
                : `${papers} ${papers === 1 ? "paper" : "papers"}`}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-10 w-10"
            onClick={(event) => {
              event.stopPropagation();
              onPreview();
            }}
            aria-label={`Preview ${document.name}`}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onRemove();
            }}
            className="rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            aria-label={`Remove ${document.name}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="order-doc-card-details">
        <div className="order-doc-card-details-inner">
          <div className="grid grid-cols-2 gap-3 p-4 min-[420px]:grid-cols-2">
            <SelectControl
              label="Paper type"
              value={config.paperTypeId}
              onChange={(value) => onChange((current) => ({ ...current, paperTypeId: value }))}
            >
              {enabledPapers.map((paper) => (
                <option key={paper.id} value={paper.id}>
                  {paper.name}
                </option>
              ))}
            </SelectControl>
            <div>
              <Label className="text-xs font-semibold text-subtle">QUANTITY</Label>
              <div className="mt-1.5 flex h-9 overflow-hidden rounded-md border border-input bg-card">
                <button
                  type="button"
                  className="w-10 text-base hover:bg-secondary"
                  onClick={() =>
                    onChange((current) => ({ ...current, copies: Math.max(1, current.copies - 1) }))
                  }
                >
                  −
                </button>
                <span className="flex flex-1 items-center justify-center border-x border-input text-xs font-semibold">
                  {config.copies}
                </span>
                <button
                  type="button"
                  className="w-10 text-base hover:bg-secondary"
                  onClick={() =>
                    onChange((current) => ({ ...current, copies: current.copies + 1 }))
                  }
                >
                  +
                </button>
              </div>
            </div>
            <SelectControl
              label="Colour"
              value={config.printType}
              onChange={(value) =>
                onChange((current) => ({
                  ...current,
                  printType: value as PrintConfig["printType"],
                }))
              }
            >
              <option value="bw">Black & White</option>
              {shop.printTypes.color && <option value="color">Colour</option>}
            </SelectControl>
            <SelectControl
              label="Format"
              value={config.side}
              onChange={(value) =>
                onChange((current) => ({ ...current, side: value as PrintConfig["side"] }))
              }
            >
              <option value="single">Front only</option>
              {shop.printSides.double && <option value="double">Front & back</option>}
            </SelectControl>
            <SelectControl
              label="Page layout"
              value={String(pageLayout)}
              onChange={(value) =>
                onChange((current) => ({ ...current, pageLayout: Number(value) as 1 | 2 | 4 }))
              }
            >
              <option value="1">1 Page / Sheet</option>
              <option value="2">2 Pages / Sheet</option>
              <option value="4">4 Pages / Sheet</option>
            </SelectControl>
            <SelectControl
              label="Binding"
              value={config.bindingId ?? "none"}
              onChange={(value) =>
                onChange((current) => ({ ...current, bindingId: value === "none" ? null : value }))
              }
            >
              <option value="none">No binding</option>
              {shop.binding
                .filter((option) => option.enabled)
                .map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name} · {inr(option.price)}
                  </option>
                ))}
            </SelectControl>
            <SelectControl
              label="Lamination / extras"
              value={config.additionalIds[0] ?? "none"}
              onChange={(value) =>
                onChange((current) => ({
                  ...current,
                  additionalIds: value === "none" ? [] : [value],
                }))
              }
            >
              <option value="none">No extra service</option>
              {shop.additional
                .filter((option) => option.enabled)
                .map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name} · {inr(option.price)} {option.perPage ? "/ page" : "/ set"}
                  </option>
                ))}
            </SelectControl>
            <SelectControl
              label="Orientation"
              value={config.orientation}
              onChange={(value) =>
                onChange((current) => ({
                  ...current,
                  orientation: value as Orientation,
                }))
              }
            >
              <option value="portrait">Portrait</option>
              <option value="landscape">Landscape</option>
            </SelectControl>
            <div className="min-[420px]:col-span-2">
              <Label className="text-xs font-semibold text-subtle">
                SPECIAL INSTRUCTIONS (OPTIONAL)
              </Label>
              <Input
                className="mt-1.5 h-9 text-xs"
                placeholder="e.g. staple at top-left"
                value={document.instructions ?? ""}
                onChange={(event) => onInstructionsChange(event.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
      {/* <div className="flex items-center justify-between border-t border-dashed border-border px-4 py-3 text-sm"><span className="text-muted-foreground">{inr(quote.printing / Math.max(1, quote.billablePages))} per printed page · {quote.billablePages} pages</span><span className="font-bold">File total {inr(quote.total)}</span></div> */}
    </article>
  );
}

function SelectControl({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <div>
      <Label className="text-xs font-semibold text-subtle">{label.toUpperCase()}</Label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1.5 h-9 w-full rounded-md border border-input bg-card px-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-ring"
      >
        {children}
      </select>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="max-w-[62%] text-right text-xs font-semibold leading-5">{value}</dd>
    </div>
  );
}

function ShopSummaryPanel({
  shop,
  availability,
  docs,
  config,
  fulfillment,
  onContinue,
}: {
  shop: Shop;
  availability: { open: boolean; label: string };
  docs: DocumentFile[];
  config: PrintConfig;
  fulfillment: Fulfillment;
  onContinue: () => void;
}) {
  const docPrices = calculateDocumentPrices(shop, docs, config);

  return (
    <>
      <div className="flex items-start justify-between gap-3 border-b border-border pb-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-subtle">Selected shop</p>
          <h2 className="mt-1 truncate text-lg font-bold">{shop.name}</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {shop.openingTime && shop.closingTime
              ? `${shop.openingTime}–${shop.closingTime}`
              : shop.hours}
          </p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold",
            availability.open
              ? "bg-success-light text-success"
              : "bg-destructive/10 text-destructive",
          )}
        >
          {availability.label}
        </span>
      </div>

      {docs.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-subtle">File costs</p>
          <div className="mt-3 space-y-3">
            {docs.map((document, index) => {
              const fileConfig = document.printConfig ?? config;
              const filePaper = shop.paperTypes.find(
                (item) => item.id === fileConfig.paperTypeId && item.enabled,
              );
              const priceLine = docPrices[index];
              if (!priceLine) return null;

              const bindingOption = fileConfig.bindingId
                ? shop.binding.find((item) => item.id === fileConfig.bindingId && item.enabled)
                : null;
              const additionalOptions = fileConfig.additionalIds
                .map((id) => shop.additional.find((item) => item.id === id && item.enabled))
                .filter((opt): opt is NonNullable<typeof opt> => !!opt);

              const extras: string[] = [];
              if (bindingOption) extras.push(bindingOption.name);
              additionalOptions.forEach((option) => extras.push(option.name));

              return (
                <div key={document.id}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">Document {index + 1}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {document.pages} page{document.pages === 1 ? "" : "s"} · {fileConfig.copies}{" "}
                        copy{fileConfig.copies === 1 ? "" : ""} ·{" "}
                        {fileConfig.printType === "color" ? "Colour" : "B/W"} ·{" "}
                        {filePaper?.name ?? "Paper"} · {fileConfig.side === "double" ? "F&B" : "F"}
                        {extras.length > 0 && ` · ${extras.join(" · ")}`}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold">{inr(priceLine.total)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {(() => {
            const totalPrinting = docPrices.reduce((sum, p) => sum + p.printing, 0);
            const totalBinding = docPrices.reduce((sum, p) => sum + p.binding, 0);
            const totalServices = docPrices.reduce((sum, p) => sum + p.services, 0);
            const finalTotal = totalPrinting + totalBinding + totalServices;
            const hasAny = totalPrinting > 0 || totalBinding > 0 || totalServices > 0;
            if (!hasAny) return null;
            return (
              <div className="mt-3 border-t border-border pt-3 space-y-1 text-xs">
                {totalPrinting > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Priority Amount</span>
                    <span className="font-medium">{inr(totalPrinting)}</span>
                  </div>
                )}
                {totalBinding > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Binding</span>
                    <span className="font-medium">{inr(totalBinding)}</span>
                  </div>
                )}
                {totalServices > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Lamination</span>
                    <span className="font-medium">{inr(totalServices)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-border pt-1 text-sm font-bold">
                  <span>Final total</span>
                  <span>{inr(finalTotal)}</span>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      <div className="mt-5">
        <Button type="button" onClick={onContinue} className="w-full">
          Continue <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </>
  );
}

function DocumentPreviewDialog({
  document,
  file,
  onOpenChange,
}: {
  document: DocumentFile | null;
  file?: File | undefined;
  onOpenChange: (open: boolean) => void;
}) {
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
  const isImage = !!file?.type.startsWith("image/");
  const isPdf = file?.type === "application/pdf" || document?.name.toLowerCase().endsWith(".pdf");
  return (
    <Dialog open={!!document} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="pr-8 break-words">
            {document?.name ?? "Document preview"}
          </DialogTitle>
          <DialogDescription>
            {document
              ? `${document.pages} page${document.pages === 1 ? "" : "s"} · ${document.sizeMb} MB`
              : ""}
          </DialogDescription>
        </DialogHeader>
        {isImage && objectUrl && (
          <img
            src={objectUrl}
            alt={`Preview of ${document?.name ?? "document"}`}
            className="mx-auto max-h-[68vh] w-auto max-w-full rounded-md object-contain"
          />
        )}
        {isPdf && objectUrl && (
          <iframe
            src={objectUrl}
            title={`Preview of ${document?.name ?? "document"}`}
            className="h-[62vh] w-full rounded-md border border-border"
          />
        )}
        {!isImage && !isPdf && (
          <div className="rounded-lg border border-dashed border-border bg-secondary/50 p-6 text-center">
            <FileText className="mx-auto h-8 w-8 text-primary" />
            <p className="mt-3 text-sm font-semibold">
              Preview is not available for this file type
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {file
                ? `${file.type || "Unknown file type"} · ${document?.sizeMb ?? 0} MB`
                : "The original local file is unavailable. Add it again to preview it."}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function shopAvailability(shop: Shop, now = new Date()) {
  if (!shop.openingTime || !shop.closingTime) return { open: true, label: "Open" };
  const toMinutes = (value: string) => {
    const [hours = 0, minutes = 0] = value.split(":").map(Number);
    return hours * 60 + minutes;
  };
  const current = now.getHours() * 60 + now.getMinutes();
  const opening = toMinutes(shop.openingTime);
  const closing = toMinutes(shop.closingTime);
  const open =
    opening <= closing
      ? current >= opening && current < closing
      : current >= opening || current < closing;
  return { open, label: open ? "Open" : "Closed" };
}

function paymentMethodAvailable(shop: Shop, fulfillment: Fulfillment, method: PaymentMethod) {
  if (method === "full") return shop.payments.full;
  if (method === "advance") return shop.payments.advance;
  if (method === "cash_pickup") return fulfillment === "pickup" && shop.payments.cashPickup;
  return fulfillment === "delivery" && shop.payments.cashDelivery;
}

function OrderPage() {
  const navigate = useNavigate();
  const {
    shops,
    orders,
    addresses,
    profile,
    placeOrder,
    saveAddress,
    pendingDocs,
    setPendingDocs,
    clearPendingDocs,
    pendingUploadFiles,
    consumePendingUploadFiles,
    uploadedFileNames,
    setUploadedFileNames,
  } = useStore();
  const { session } = useAuth();

  const [step, setStep] = useState(0);
  const [docs, setDocs] = useState<DocumentFile[]>(pendingDocs);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({});
  const [config, setConfig] = useState<PrintConfig>(defaultConfig);
  const [shopId, setShopId] = useState<string>(shops[0]!.id);
  const [fulfillment, setFulfillment] = useState<Fulfillment>("pickup");
  const [addressId, setAddressId] = useState<string | null>(addresses[0]?.id ?? null);
  const [newAddress, setNewAddress] = useState(false);
  const [draft, setDraft] = useState<Omit<Address, "id">>({
    label: "Home",
    name: profile.name,
    phone: profile.phone,
    house: "",
    street: "",
    area: "",
    city: "Coimbatore",
    pincode: "",
  });
  const [method, setMethod] = useState<PaymentMethod>("full");
  const [notes, setNotes] = useState("");
  const [placed, setPlaced] = useState<Order | null>(null);
  const [previewDocumentId, setPreviewDocumentId] = useState<string | null>(null);
  const [fulfillmentDialogOpen, setFulfillmentDialogOpen] = useState(false);
  const [shopConfirmed, setShopConfirmed] = useState(true);
  const [mobileShopSummaryOpen, setMobileShopSummaryOpen] = useState(false);
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);
  const addMoreFilesRef = useRef<HTMLInputElement>(null);
  const shopScrollRef = useRef<HTMLDivElement>(null);
  const [shopSearch, setShopSearch] = useState("");
  const [shopLocationFilter, setShopLocationFilter] = useState("");
  const [shopSortOrder, setShopSortOrder] = useState("");

  const shop = useMemo<Shop>(
    () => shops.find((s) => s.id === shopId) ?? shops[0]!,
    [shops, shopId],
  );
  const price = useMemo(
    () => calculateOrderPrice(shop, docs, config, fulfillment),
    [shop, docs, config, fulfillment],
  );
  const documentPrices = useMemo(
    () => calculateDocumentPrices(shop, docs, config),
    [shop, docs, config],
  );
  const split = paymentSplit(shop, price.total, method);
  const address = addresses.find((a) => a.id === addressId) ?? null;
  const selectedAvailability = shopAvailability(shop);
  const previewDocument = docs.find((document) => document.id === previewDocumentId) ?? null;
  useEffect(() => {
    if (paymentMethodAvailable(shop, fulfillment, method)) return;
    const replacement = (
      ["full", "advance", "cash_pickup", "cash_delivery"] as PaymentMethod[]
    ).find((candidate) => paymentMethodAvailable(shop, fulfillment, candidate));
    if (replacement) setMethod(replacement);
  }, [fulfillment, method, shop]);

  // Extract unique locations from shop addresses for the location filter.
  const shopLocations = useMemo(() => {
    const parts = new Set<string>();
    for (const s of shops) {
      const addrParts = s.address.split(",").map((p) => p.trim());
      // Use the area/neighborhood part (typically second-to-last before city).
      if (addrParts.length >= 2) {
        const area = addrParts[addrParts.length - 2];
        if (area) parts.add(area.replace(/\s*-\s*\d{6}$/, "").trim());
      }
    }
    return [...parts].sort();
  }, [shops]);

  // Filter and sort shops based on search, location, and sort order.
  const filteredSortedShops = useMemo(() => {
    let result = [...shops];

    // Search filter.
    if (shopSearch.trim()) {
      const q = shopSearch.toLowerCase();
      result = result.filter(
        (s) => s.name.toLowerCase().includes(q) || s.address.toLowerCase().includes(q),
      );
    }

    // Location filter.
    if (shopLocationFilter) {
      result = result.filter((s) =>
        s.address.toLowerCase().includes(shopLocationFilter.toLowerCase()),
      );
    }

    // Sort by total amount.
    if (shopSortOrder === "lowest" || shopSortOrder === "highest") {
      result.sort((a, b) => {
        const totalA = calculateOrderPrice(a, docs, config, fulfillment).total;
        const totalB = calculateOrderPrice(b, docs, config, fulfillment).total;
        return shopSortOrder === "lowest" ? totalA - totalB : totalB - totalA;
      });
    }

    return result;
  }, [shops, shopSearch, shopLocationFilter, shopSortOrder, docs, config, fulfillment]);

  const handleShopScroll = () => {
    // Scroll handler for future enhancements (e.g., updating active dot on scroll).
  };

  const addFiles = async (incoming: File[]) => {
    if (!incoming.length) return;

    // Create document entries immediately with detecting state.
    const pendingDocs = incoming.map((file, index) => {
      const id = `doc-${Date.now()}-${index}`;
      return {
        file,
        document: {
          id,
          name: file.name,
          pages: 0,
          pageCountDetected: false,
          detectingPages: true,
          printConfig: { ...defaultConfig, additionalIds: [] },
          sizeMb: Math.max(0.1, Number((file.size / 1024 / 1024).toFixed(1))),
        },
      };
    });

    // Add to state immediately so the UI shows "Detecting pages..."
    const added = pendingDocs.map((item) => item.document);
    setDocs((current) => [...current, ...added]);
    setActiveDocumentId(added[added.length - 1]?.id ?? null);
    setUploadedFiles((current) => ({
      ...current,
      ...Object.fromEntries(pendingDocs.map((item) => [item.document.id, item.file])),
    }));

    // Detect pages in parallel and update each document as it completes.
    await Promise.all(
      pendingDocs.map(async ({ file, document }) => {
        try {
          const pageInfo = await detectPageCount(file);
          setDocs((current) =>
            current.map((doc) =>
              doc.id === document.id
                ? {
                    ...doc,
                    pages: pageInfo.pages,
                    pageCountDetected: pageInfo.detected,
                    detectingPages: false,
                  }
                : doc,
            ),
          );
        } catch {
          setDocs((current) =>
            current.map((doc) =>
              doc.id === document.id
                ? { ...doc, pages: 1, pageCountDetected: false, detectingPages: false }
                : doc,
            ),
          );
        }
      }),
    );

    // Show final toast after all detections complete.
    const needsReview = pendingDocs.filter((item) => !item.document.pageCountDetected).length;
    toast.success(`${incoming.length} document${incoming.length > 1 ? "s" : ""} added`, {
      description: needsReview
        ? `${needsReview} file${needsReview > 1 ? "s need" : " needs"} page-count review.`
        : "Page counts detected automatically.",
    });
  };

  useEffect(() => {
    if (!pendingUploadFiles.length) return;
    const transferredFiles = consumePendingUploadFiles();
    if (!transferredFiles.length) return;
    void addFiles(transferredFiles);
    // A pending upload is deliberately transient and consumed once on arrival from Home.
  }, [pendingUploadFiles, consumePendingUploadFiles]);

  // Sync docs to store so they persist across navigation/remounts.
  useEffect(() => {
    setPendingDocs(docs);
  }, [docs, setPendingDocs]);

  // Sync uploaded file names so the Upload Document Card can restore its success state.
  useEffect(() => {
    const names = docs.map((d) => d.name);
    const prev = uploadedFileNames;
    if (names.length !== prev.length || names.some((n, i) => n !== prev[i])) {
      setUploadedFileNames(names);
    }
  }, [docs, uploadedFileNames, setUploadedFileNames]);

  const selectShop = (nextShopId: string) => {
    const nextShop = shops.find((candidate) => candidate.id === nextShopId);
    if (!nextShop) return;
    setShopId(nextShopId);
    setShopConfirmed(true);
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches)
      setMobileShopSummaryOpen(true);
    setDocs((all) =>
      all.map((document) => {
        const current = document.printConfig ?? defaultConfig;
        const paperAvailable = nextShop.paperTypes.some(
          (paper) => paper.id === current.paperTypeId && paper.enabled,
        );
        return {
          ...document,
          printConfig: {
            ...current,
            paperTypeId: paperAvailable
              ? current.paperTypeId
              : (nextShop.paperTypes.find((paper) => paper.enabled)?.id ?? current.paperTypeId),
            printType:
              current.printType === "color" && !nextShop.printTypes.color
                ? "bw"
                : current.printType,
            side:
              current.side === "double" && !nextShop.printSides.double ? "single" : current.side,
            orientation:
              current.orientation === "landscape" && !nextShop.orientation.landscape
                ? "portrait"
                : current.orientation,
            bindingId: nextShop.binding.some(
              (option) => option.id === current.bindingId && option.enabled,
            )
              ? current.bindingId
              : null,
            additionalIds: current.additionalIds.filter((id) =>
              nextShop.additional.some((option) => option.id === id && option.enabled),
            ),
          },
        };
      }),
    );
  };

  const paper = shop.paperTypes.find((p) => p.id === config.paperTypeId);

  const canContinue = () => {
    if (step === 0) return docs.length > 0;
    if (step === 1) return shopConfirmed;
    if (step === 2) return fulfillment === "pickup" || !!address;
    if (step === 3)
      return (
        (fulfillment === "pickup" || !!address) && paymentMethodAvailable(shop, fulfillment, method)
      );
    return true;
  };

  const stepBlockReason = () => {
    if (step === 0) return "Add at least one document to continue.";
    if (step === 1) return "Select a shop to continue.";
    if (step === 2) return "Select a delivery address.";
    if (step === 3) return "Choose a payment method accepted by this shop.";
    return "";
  };

  const confirm = () => {
    if (fulfillment === "delivery" && !address) {
      toast.error("Select a delivery address before placing the order.");
      return;
    }
    if (!paymentMethodAvailable(shop, fulfillment, method)) {
      toast.error("Choose a payment method accepted by this shop.");
      return;
    }
    if (session?.role !== "customer") {
      toast.error("Sign in with a customer account before placing an order.");
      navigate({ to: "/auth/customer/login" });
      return;
    }
    const now = new Date().toISOString();
    const primaryConfig = docs[0]?.printConfig ?? config;
    const primaryPaper = shop.paperTypes.find((item) => item.id === primaryConfig.paperTypeId);
    const order: Order = {
      id: newOrderId(orders),
      customerName: profile.name,
      customerPhone: profile.phone,
      shopId: shop.id,
      shopName: shop.name,
      documents: docs,
      config: primaryConfig,
      configLabels: {
        paper: primaryPaper?.name ?? "A4 Paper",
        printType: primaryConfig.printType === "bw" ? "Black & White" : "Colour",
        side: primaryConfig.side === "single" ? "Single Side" : "Double Side",
        orientation: primaryConfig.orientation === "portrait" ? "Portrait" : "Landscape",
        binding: shop.binding.find((b) => b.id === primaryConfig.bindingId)?.name ?? "None",
        additional: primaryConfig.additionalIds
          .map((id) => shop.additional.find((a) => a.id === id)?.name)
          .filter((n): n is string => !!n),
      },
      fulfillment,
      address: fulfillment === "delivery" ? address : null,
      price,
      paymentMethod: method,
      amountPaid: split.paidNow,
      balance: split.balance,
      paymentStatus: split.paidNow === 0 ? "unpaid" : split.balance === 0 ? "paid" : "partial",
      status: "NEW",
      createdAt: now,
      updatedAt: now,
      timeline: [{ status: "NEW", at: now }],
    };
    placeOrder(order);
    clearPendingDocs();
    setUploadedFileNames([]);
    setPlaced(order);
    toast.success("Order placed", { description: `${order.id} sent to ${shop.name}` });
  };

  if (placed) {
    return (
      <CustomerShell>
        <div className="container-page flex min-h-[70vh] items-center justify-center py-12">
          <div className="card-surface w-full max-w-md p-8 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success-light text-success">
              <PartyPopper className="h-7 w-7" />
            </span>
            <h1 className="mt-5 text-2xl font-bold">Order placed</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {placed.shopName} has received your order. You'll see live updates as they print it.
            </p>
            <div className="mt-6 rounded-lg bg-secondary p-4 text-left text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order ID</span>
                <span className="font-semibold">{placed.id}</span>
              </div>
              <div className="mt-2 flex justify-between">
                <span className="text-muted-foreground">Paid now</span>
                <span className="font-semibold">{inr(placed.amountPaid)}</span>
              </div>
              <div className="mt-2 flex justify-between">
                <span className="text-muted-foreground">Balance</span>
                <span className="font-semibold">{inr(placed.balance)}</span>
              </div>
            </div>
            <div className="mt-6 flex flex-col gap-2">
              <Link to="/orders/$orderId" params={{ orderId: placed.id }}>
                <Button className="w-full">Track this order</Button>
              </Link>
              <Button variant="outline" onClick={() => navigate({ to: "/" })}>
                Go to Home
              </Button>
            </div>
          </div>
        </div>
      </CustomerShell>
    );
  }

  return (
    <CustomerShell>
      <div className="container-page py-8 md:py-5">
        {/* <h1 className="text-page-title font-bold">XEROXMATE</h1> */}
        {/* <p className="mt-2 text-sm text-muted-foreground">
          Step {step + 1} of {STEP_TITLES.length} — {STEP_TITLES[step]}
        </p>
        <div className="mt-6">
          <StepRail step={step} />
        </div> */}

        <div className={cn("mt-6 grid gap-6", step === 1 && "md:grid-cols-[1fr_340px]")}>
          <div className="space-y-4">
            {step === 0 && (
              <section className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
                <div
                  className={cn(
                    "md:sticky md:top-6 md:self-start",
                    docs.length > 0 && "hidden md:block",
                  )}
                >
                  <SectionCard
                    title="Upload documents"
                    hint="Add one or more files. You can update each file’s print settings alongside it."
                  >
                    <DocumentUploadCard
                      multiple
                      onFilesSelected={addFiles}
                      onFilesRemoved={() => {
                        setDocs([]);
                        setUploadedFiles({});
                        setActiveDocumentId(null);
                      }}
                      initialFileNames={uploadedFileNames}
                      className="p-0 shadow-none"
                    />
                  </SectionCard>
                </div>
                <SectionCard
                  title="Documents + specifications"
                  hint="Every file has its own print settings and quote."
                >
                  <div className=" space-y-4  ">
                    {docs.map((document, index) => (
                      <FilePrintOptions
                        key={document.id}
                        document={document}
                        index={index}
                        shop={shop}
                        fallback={config}
                        onSelect={() => setActiveDocumentId(document.id)}
                        onChange={(updater) =>
                          setDocs((all) =>
                            all.map((item) =>
                              item.id === document.id
                                ? {
                                    ...item,
                                    printConfig: updater(item.printConfig ?? defaultConfig),
                                  }
                                : item,
                            ),
                          )
                        }
                        onInstructionsChange={(instructions) =>
                          setDocs((all) =>
                            all.map((item) =>
                              item.id === document.id ? { ...item, instructions } : item,
                            ),
                          )
                        }
                        onPreview={() => setPreviewDocumentId(document.id)}
                        onRemove={() => {
                          setDocs((all) => {
                            const next = all.filter((item) => item.id !== document.id);
                            setActiveDocumentId((current) =>
                              current === document.id
                                ? (next[next.length - 1]?.id ?? null)
                                : current,
                            );
                            return next;
                          });
                          setUploadedFiles((all) => {
                            const { [document.id]: _removed, ...rest } = all;
                            return rest;
                          });
                        }}
                      />
                    ))}
                    {!docs.length && (
                      <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                        Upload a document to add its print settings here.
                      </div>
                    )}
                  </div>
                  {docs.length > 0 && (
                    <div className="mt-4 md:hidden">
                      <input
                        ref={addMoreFilesRef}
                        className="sr-only"
                        type="file"
                        accept={ACCEPTED_UPLOAD_TYPES}
                        multiple
                        onChange={(event) => {
                          const selected = Array.from(event.target.files ?? []);
                          event.currentTarget.value = "";
                          const unsupported = selected.find((file) => !isSupportedUpload(file));
                          if (unsupported) {
                            toast.error(`${unsupported.name} is not a supported file type.`);
                            return;
                          }
                          void addFiles(selected);
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => addMoreFilesRef.current?.click()}
                      >
                        <Upload className="h-4 w-4" /> Add Files
                      </Button>
                    </div>
                  )}
                  <div className="mt-5 flex items-center justify-between gap-3 border-t border-border pt-5">
                    <Button variant="outline" onClick={() => setStep(0)} disabled>
                      <ChevronLeft className="h-4 w-4" /> Back
                    </Button>
                    <Button
                      onClick={() => {
                        if (!canContinue()) {
                          toast.error(stepBlockReason());
                          return;
                        }
                        setStep(1);
                      }}
                    >
                      Continue <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </SectionCard>
              </section>
            )}

            {step === 1 && (
              <SectionCard
                title="Select Nearby print shops to Continue"
                hint="Prices update instantly based on the shop you pick."
              >
                {/* Search + Filters */}
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <input
                    type="text"
                    placeholder="Search shops..."
                    value={shopSearch}
                    onChange={(e) => setShopSearch(e.target.value)}
                    className="h-9 flex-1 rounded-md border border-border bg-card px-3 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                  />
                  <select
                    value={shopLocationFilter}
                    onChange={(e) => setShopLocationFilter(e.target.value)}
                    className="h-9 rounded-md border border-border bg-card px-3 text-sm focus:border-primary focus:outline-none"
                  >
                    <option value="">Location</option>
                    {shopLocations.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                  <select
                    value={shopSortOrder}
                    onChange={(e) => setShopSortOrder(e.target.value)}
                    className="h-9 rounded-md border border-border bg-card px-3 text-sm focus:border-primary focus:outline-none"
                  >
                    <option value="">Lowest total amount</option>
                    <option value="lowest">Lowest first</option>
                    <option value="highest">Highest first</option>
                  </select>
                </div>

                {/* Shop cards with vertical dots */}
                <div
                  className="flex gap-3"
                  style={{ maxHeight: "calc(100vh - 320px)", minHeight: "300px" }}
                >
                  {/* Vertical dots indicator */}
                  <div className="hidden w-5 shrink-0 flex-col items-center gap-2 pt-2 sm:flex">
                    {filteredSortedShops.map((s) => (
                      <span
                        key={s.id}
                        className={cn(
                          "block h-2 w-2 shrink-0 rounded-full transition-colors",
                          s.id === shopId ? "bg-primary" : "bg-border",
                        )}
                      />
                    ))}
                  </div>

                  {/* Shop cards */}
                  <div
                    ref={shopScrollRef}
                    className="flex-1 space-y-3 overflow-y-auto scrollbar-hide"
                    onScroll={handleShopScroll}
                  >
                    {filteredSortedShops.length === 0 && (
                      <p className="py-8 text-center text-sm text-muted-foreground">
                        No shops match your search.
                      </p>
                    )}
                    {filteredSortedShops.map((s) => {
                      const active = shopConfirmed && s.id === shopId;
                      const availability = shopAvailability(s);
                      const shopTotal = calculateOrderPrice(s, docs, config, fulfillment).total;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => selectShop(s.id)}
                          className={cn(
                            "w-full rounded-lg border p-4 text-left transition-colors",
                            active
                              ? "border-primary bg-primary-light"
                              : "border-border bg-card hover:bg-secondary",
                          )}
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:gap-4">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold">{s.name}</p>
                              <p className="mt-1 text-xs text-muted-foreground">{s.address}</p>
                              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                                <span className="inline-flex items-center gap-1 rounded-md bg-card px-2 py-1 font-medium">
                                  ★ {s.rating}
                                </span>
                                <span className="rounded-md bg-card px-2 py-1 font-medium">
                                  {s.delivery.enabled ? "Pickup + Delivery" : "Pickup only"}
                                </span>
                              </div>
                            </div>
                            <div className="flex shrink-0 flex-col items-start gap-1.5 sm:items-end">
                              <span
                                className={cn(
                                  "rounded-full px-2.5 py-1 text-xs font-semibold",
                                  availability.open
                                    ? "bg-success-light text-success"
                                    : "bg-destructive/10 text-destructive",
                                )}
                              >
                                {availability.label}
                              </span>
                              <span className="mt-1 inline-block rounded-md border border-border bg-secondary px-2 py-1 text-sm font-semibold text-foreground">
                                Total Amount : {inr(shopTotal)}
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-5 border-t border-border pt-5">
                  <Button variant="outline" onClick={() => setStep(0)}>
                    <ChevronLeft className="h-4 w-4" /> Back
                  </Button>
                </div>
              </SectionCard>
            )}

            <Dialog
              open={fulfillmentDialogOpen}
              onOpenChange={(open) => {
                setFulfillmentDialogOpen(open);
                if (!open && step === 2) setStep(1);
              }}
            >
              <DialogContent className="max-h-[200vh] overflow-y-auto sm:max-w-xl">
                <DialogHeader>
                  <DialogTitle>How would you like to receive your order?</DialogTitle>
                  <DialogDescription>{shop.name}</DialogDescription>
                </DialogHeader>
                <div className="mt-5 grid gap-5 sm:grid-rows-2">
                  <button
                    type="button"
                    onClick={() => setFulfillment("pickup")}
                    className={cn(
                      "rounded-lg border p-4 text-left flex flex-col gap-4 justify-center items-center",
                      fulfillment === "pickup"
                        ? "border-primary bg-primary-light"
                        : "border-border hover:bg-secondary",
                    )}
                  >
                    <StoreIcon className="h-5 w-5 text-primary" />
                    <p className="mt-3 sm:mt-0 text-sm font-semibold">Pickup at shop</p>
                    <p className="text-xs text-muted-foreground">{shop.hours}</p>
                  </button>
                  <button
                    type="button"
                    disabled={!shop.delivery.enabled}
                    onClick={() => setFulfillment("delivery")}
                    className={cn(
                      "rounded-lg border  flex flex-col  gap-4 justify-center items-center",
                      fulfillment === "delivery"
                        ? "border-primary bg-primary-light"
                        : "border-border hover:bg-secondary",
                      !shop.delivery.enabled && "cursor-not-allowed opacity-40",
                    )}
                  >
                    <Truck className="h-5 w-5 text-primary" />
                    <p className="mt-3 sm:mt-0 text-sm font-semibold">Home delivery</p>
                    <p className="text-xs text-muted-foreground">
                      {shop.delivery.enabled
                        ? `2 to 4 hours · ${inr(shop.delivery.fee)} fee${
                            shop.delivery.freeAbove
                              ? ` (free above ${inr(shop.delivery.freeAbove)})`
                              : ""
                          }`
                        : "This shop does not deliver"}
                    </p>
                  </button>
                </div>
                {fulfillment === "delivery" && (
                  <div className="mt-5">
                    <h3 className="text-sm mb-2 font-semibold">Delivery address</h3>
                    <div className="space-y-3">
                      {addresses.map((a) => (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => {
                            setAddressId(a.id);
                            setNewAddress(false);
                          }}
                          className={cn(
                            "w-full rounded-lg border p-4 text-left",
                            addressId === a.id && !newAddress
                              ? "border-primary bg-primary-light"
                              : "border-border hover:bg-secondary",
                          )}
                        >
                          <p className="text-sm font-semibold">
                            {a.label} · {a.name}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {a.house}, {a.street}, {a.area}, {a.city} - {a.pincode}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">{a.phone}</p>
                        </button>
                      ))}
                      <Button variant="outline" onClick={() => setNewAddress((v) => !v)}>
                        {newAddress ? "Cancel" : "Add a new address"}
                      </Button>
                      {newAddress && (
                        <div className="grid gap-3 rounded-lg border border-border p-4 sm:grid-cols-2">
                          {(
                            [
                              ["label", "Label"],
                              ["name", "Full name"],
                              ["phone", "Phone"],
                              ["house", "House / Flat"],
                              ["street", "Street"],
                              ["area", "Area"],
                              ["city", "City"],
                              ["pincode", "Pincode"],
                            ] as const
                          ).map(([key, label]) => (
                            <div key={key}>
                              <Label className="text-xs font-semibold text-subtle">{label}</Label>
                              <Input
                                className="mt-2"
                                value={draft[key]}
                                onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
                              />
                            </div>
                          ))}
                          <div className="sm:col-span-2">
                            <Button
                              onClick={() => {
                                if (!draft.name || !draft.pincode) {
                                  toast.error("Add at least a name and pincode");
                                  return;
                                }
                                const id = `addr-${Date.now()}`;
                                saveAddress({ id, ...draft });
                                setAddressId(id);
                                setNewAddress(false);
                                toast.success("Address saved");
                              }}
                            >
                              Save address
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <div className="mt-5 flex justify-end">
                  <Button
                    onClick={() => {
                      if (fulfillment === "pickup" || address) {
                        setFulfillmentDialogOpen(false);
                        setStep(3);
                      } else toast.error("Select a delivery address first.");
                    }}
                  >
                    Continue
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {step === 3 && (
              <div className="flex flex-col gap-6 lg:flex-row">
                <div className="w-full space-y-6 lg:w-1/2 lg:sticky lg:top-24 lg:self-start">
                  <SectionCard title="Payment method" hint={`Accepted by ${shop.name}`}>
                    <div className="space-y-2 grid-cols-2 gap-3 grid">
                      {(
                        [
                          ["full", paymentMethodAvailable(shop, fulfillment, "full")],
                          ["advance", paymentMethodAvailable(shop, fulfillment, "advance")],
                          ["cash_pickup", paymentMethodAvailable(shop, fulfillment, "cash_pickup")],
                          [
                            "cash_delivery",
                            paymentMethodAvailable(shop, fulfillment, "cash_delivery"),
                          ],
                        ] as const
                      ).map(([key, allowed]) => (
                        <button
                          key={key}
                          type="button"
                          disabled={!allowed}
                          onClick={() => setMethod(key as PaymentMethod)}
                          className={cn(
                            "flex w-full items-start gap-3 rounded-lg border p-4 text-left",
                            method === key
                              ? "border-primary bg-primary-light"
                              : "border-border hover:bg-secondary",
                            !allowed && "cursor-not-allowed opacity-40",
                          )}
                        >
                          <Wallet className="mt-0.5 h-5 w-5 text-primary" />
                          <span>
                            <span className="block text-sm font-semibold">
                              {paymentMethodLabel[key as PaymentMethod]}
                            </span>
                          </span>
                        </button>
                      ))}
                    </div>

                    <div className="mt-5">
                      <Label className="text-xs font-semibold text-subtle">
                        NOTES FOR THE SHOP (OPTIONAL)
                      </Label>
                      <Textarea
                        className="mt-2"
                        rows={3}
                        placeholder="e.g. Print the cover page in colour"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                    </div>
                  </SectionCard>

                  <div className="md:card-surface p-5 md:px-6 md:py-4 flex flex-col gap-2">
                    <h2 className="text-base font-semibold">Print shop</h2>
                    <p className="mt-3 inline-flex items-center gap-2 text-sm font-medium">
                      <StoreIcon className="h-4 w-4 text-primary" /> {shop.name}
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
                </div>

                <div className="w-full lg:w-1/2">
                  <SectionCard title="Review your order" hint="Check everything before confirming.">
                    <div className="mb-5 rounded-lg border border-border bg-secondary/50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-sm font-semibold">File-by-file quote</h3>
                        <span className="text-xs text-muted-foreground">Before delivery</span>
                      </div>
                      <div className="mt-3 divide-y divide-border">
                        {docs.map((document, index) => {
                          const fileConfig = document.printConfig ?? config;
                          const filePaper = shop.paperTypes.find(
                            (item) => item.id === fileConfig.paperTypeId,
                          );
                          return (
                            <div
                              key={document.id}
                              className="flex items-center justify-between gap-4 py-2.5 text-sm"
                            >
                              <div className="min-w-0">
                                <p className="truncate font-medium">{document.name}</p>
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                  {documentPrices[index]?.billablePages ?? 0} printed pages ·{" "}
                                  {fileConfig.copies} copy(ies) ·{" "}
                                  {fileConfig.printType === "bw" ? "B/W" : "Colour"} ·{" "}
                                  {fileConfig.side === "double" ? "Front & back" : "Front only"}
                                </p>
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                  {filePaper?.name ?? "Paper"} ·{" "}
                                  {fileConfig.bindingId
                                    ? shop.binding.find((item) => item.id === fileConfig.bindingId)
                                        ?.name
                                    : "No binding"}
                                  {fileConfig.additionalIds.length
                                    ? ` · ${fileConfig.additionalIds
                                        .map(
                                          (id) =>
                                            shop.additional.find((item) => item.id === id)?.name,
                                        )
                                        .filter(Boolean)
                                        .join(", ")}`
                                    : ""}
                                </p>
                                {document.instructions && (
                                  <p className="mt-1 text-xs text-primary">
                                    Note: {document.instructions}
                                  </p>
                                )}
                              </div>
                              <span className="shrink-0 font-semibold">
                                {inr(documentPrices[index]?.total ?? 0)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <dl className="divide-y divide-border text-sm">
                      {(
                        [
                          ["Shop", shop.name],
                          [
                            "Documents",
                            `${docs.length} file(s) · ${docs.reduce((s, d) => s + d.pages, 0)} pages`,
                          ],
                          [
                            "Delivery Option",
                            fulfillment === "pickup" ? "Pickup at shop" : "Home delivery",
                          ],
                          [
                            "Address",
                            fulfillment === "delivery" && address
                              ? `${address.house}, ${address.street}, ${address.area}, ${address.city} - ${address.pincode}`
                              : "—",
                          ],
                          ["Payment", paymentMethodLabel[method]],
                          ["Notes", notes || "—"],
                        ] as const
                      ).map(([k, v]) => (
                        <div key={k} className="flex justify-between gap-6 py-2.5">
                          <dt className="text-muted-foreground">{k}</dt>
                          <dd className="text-right font-medium capitalize">{v}</dd>
                        </div>
                      ))}
                    </dl>
                    <div className="mt-5 rounded-lg border border-border bg-secondary/50 p-4 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Documents</span>
                        <span className="font-medium">{inr(price.total - price.delivery)}</span>
                      </div>
                      <div className="mt-2 flex justify-between">
                        <span className="text-muted-foreground">Delivery</span>
                        <span className="font-medium">{inr(price.delivery)}</span>
                      </div>
                      <div className="mt-3 flex justify-between border-t border-border pt-3 text-base font-bold">
                        <span>Total</span>
                        <span>{inr(price.total)}</span>
                      </div>
                      {method === "advance" && (
                        <>
                          <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                            <span>Pay Advance now</span>
                            <span>{inr(split.paidNow)}</span>
                          </div>
                          <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                            <span>
                              Remaining on {fulfillment === "pickup" ? "pickup" : "delivery"}
                            </span>
                            <span>{inr(split.balance)}</span>
                          </div>
                        </>
                      )}
                      {method === "cash_pickup" && (
                        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                          <span>Pay at pickup</span>
                          <span>{inr(price.total)}</span>
                        </div>
                      )}
                      {method === "cash_delivery" && (
                        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                          <span>Pay on delivery</span>
                          <span>{inr(price.total)}</span>
                        </div>
                      )}
                      {method === "full" && (
                        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                          <span>Paid in full</span>
                          <span>{inr(price.total)}</span>
                        </div>
                      )}
                    </div>
                    <div className="mt-5 flex items-center justify-between gap-3 border-t border-border pt-5">
                      <Button variant="outline" onClick={() => setStep(1)}>
                        <ChevronLeft className="h-4 w-4" /> Back
                      </Button>
                      <Button onClick={confirm} disabled={docs.length === 0}>
                        Confirm & place order
                      </Button>
                    </div>
                  </SectionCard>
                </div>
              </div>
            )}
          </div>

          {step === 1 && (
            <aside className="sticky top-24 hidden self-start md:block">
              <div className="card-surface p-5">
                {shopConfirmed ? (
                  <ShopSummaryPanel
                    shop={shop}
                    availability={selectedAvailability}
                    docs={docs}
                    config={config}
                    fulfillment={fulfillment}
                    onContinue={() => {
                      setStep(2);
                      setFulfillmentDialogOpen(true);
                    }}
                  />
                ) : (
                  <div className="rounded-lg border border-dashed border-border p-4 text-center">
                    <p className="text-sm font-semibold">Select a shop to continue</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Its live services and prices will appear here.
                    </p>
                  </div>
                )}
              </div>
            </aside>
          )}
        </div>
        <Dialog
          open={mobileShopSummaryOpen && shopConfirmed}
          onOpenChange={setMobileShopSummaryOpen}
        >
          <DialogContent className="max-h-[90vh] overflow-y-auto p-4 sm:max-w-md sm:p-6 md:hidden">
            <DialogHeader>
              <DialogTitle>Selected shop details</DialogTitle>
              <DialogDescription>
                Review pricing before choosing pickup or delivery.
              </DialogDescription>
            </DialogHeader>
            <ShopSummaryPanel
              shop={shop}
              availability={selectedAvailability}
              docs={docs}
              config={config}
              fulfillment={fulfillment}
              onContinue={() => {
                setMobileShopSummaryOpen(false);
                setStep(2);
                setFulfillmentDialogOpen(true);
              }}
            />
          </DialogContent>
        </Dialog>
        <DocumentPreviewDialog
          document={previewDocument}
          file={previewDocument ? uploadedFiles[previewDocument.id] : undefined}
          onOpenChange={(open) => {
            if (!open) setPreviewDocumentId(null);
          }}
        />
      </div>
    </CustomerShell>
  );
}
