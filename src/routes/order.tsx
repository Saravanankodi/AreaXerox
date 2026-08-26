import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Upload,
  FileText,
  Trash2,
  Star,
  Check,
  ChevronLeft,
  ChevronRight,
  Truck,
  Store as StoreIcon,
  Wallet,
  PartyPopper,
} from "lucide-react";
import { toast } from "sonner";
import { CustomerShell } from "@/components/layout/CustomerShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { newOrderId, useStore } from "@/lib/store";
import { advanceAmount, calculatePrice, inr, paymentSplit } from "@/lib/pricing";
import { paymentMethodLabel } from "@/lib/labels";
import type {
  Address,
  DocumentFile,
  Fulfillment,
  Order,
  PaymentMethod,
  PrintConfig,
  Shop,
} from "@/types";

export const Route = createFileRoute("/order")({
  head: () => ({
    meta: [
      { title: "Place a Print Order — Order My Xerox" },
      {
        name: "description",
        content:
          "Upload documents, choose paper, colour, binding and delivery, then pay your way — in one guided flow.",
      },
      { property: "og:title", content: "Place a Print Order — Order My Xerox" },
      {
        property: "og:description",
        content: "A six-step guided flow from upload to confirmed print order.",
      },
    ],
  }),
  component: OrderPage,
});

const STEP_TITLES = [
  "Upload documents",
  "Print options",
  "Choose a shop",
  "Pickup or delivery",
  "Payment",
  "Review & confirm",
];

const defaultConfig: PrintConfig = {
  paperTypeId: "a4",
  printType: "bw",
  side: "single",
  copies: 1,
  pageRangeMode: "all",
  pageRange: "",
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
    <div className="card-surface p-5 md:p-6">
      <h2 className="text-base font-semibold">{title}</h2>
      {hint && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}
      <div className="mt-5">{children}</div>
    </div>
  );
}

function Choice({
  active,
  disabled,
  onClick,
  title,
  meta,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  title: string;
  meta?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "rounded-lg border px-4 py-3 text-left transition-colors",
        active ? "border-primary bg-primary-light" : "border-border bg-card hover:bg-secondary",
        disabled && "cursor-not-allowed opacity-40",
      )}
    >
      <span className="block text-sm font-semibold">{title}</span>
      {meta && <span className="mt-0.5 block text-xs text-muted-foreground">{meta}</span>}
    </button>
  );
}

const SAMPLE_FILES = [
  { name: "Semester-Notes.pdf", pages: 24, sizeMb: 1.8 },
  { name: "Resume.docx", pages: 2, sizeMb: 0.2 },
  { name: "Project-Report.pdf", pages: 48, sizeMb: 4.1 },
  { name: "ID-Proof.jpg", pages: 1, sizeMb: 0.6 },
];

function OrderPage() {
  const navigate = useNavigate();
  const { shops, orders, addresses, profile, placeOrder, saveAddress } = useStore();

  const [step, setStep] = useState(0);
  const [docs, setDocs] = useState<DocumentFile[]>([]);
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

  const shop = useMemo<Shop>(() => shops.find((s) => s.id === shopId) ?? shops[0]!, [shops, shopId]);
  const price = useMemo(
    () => calculatePrice(shop, docs, config, fulfillment),
    [shop, docs, config, fulfillment],
  );
  const split = paymentSplit(shop, price.total, method);
  const address = addresses.find((a) => a.id === addressId) ?? null;

  const addFile = () => {
    const sample = SAMPLE_FILES[docs.length % SAMPLE_FILES.length]!;
    setDocs((d) => [
      ...d,
      { id: `doc-${Date.now()}-${d.length}`, name: sample.name, pages: sample.pages, sizeMb: sample.sizeMb },
    ]);
  };

  const paper = shop.paperTypes.find((p) => p.id === config.paperTypeId);

  const canContinue = () => {
    if (step === 0) return docs.length > 0;
    if (step === 1) return !!paper?.enabled;
    if (step === 3) return fulfillment === "pickup" || !!address;
    return true;
  };

  const stepBlockReason = () => {
    if (step === 0) return "Add at least one document to continue.";
    if (step === 1) return "Choose an available paper type.";
    if (step === 3) return "Select a delivery address.";
    return "";
  };

  const confirm = () => {
    const now = new Date().toISOString();
    const order: Order = {
      id: newOrderId(orders),
      customerName: profile.name,
      customerPhone: profile.phone,
      shopId: shop.id,
      shopName: shop.name,
      documents: docs,
      config,
      configLabels: {
        paper: paper?.name ?? "A4 Paper",
        printType: config.printType === "bw" ? "Black & White" : "Colour",
        side: config.side === "single" ? "Single Side" : "Double Side",
        orientation: config.orientation === "portrait" ? "Portrait" : "Landscape",
        binding: shop.binding.find((b) => b.id === config.bindingId)?.name ?? "None",
        additional: config.additionalIds
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
              <Button variant="outline" onClick={() => navigate({ to: "/orders" })}>
                Go to my orders
              </Button>
            </div>
          </div>
        </div>
      </CustomerShell>
    );
  }

  return (
    <CustomerShell>
      <div className="container-page py-8 md:py-12">
        <h1 className="text-page-title font-bold">Order My Xerox</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Step {step + 1} of 6 — {STEP_TITLES[step]}
        </p>
        <div className="mt-6">
          <StepRail step={step} />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="space-y-6">
            {step === 0 && (
              <SectionCard
                title="Your documents"
                hint="Add the files you want printed. Page counts are detected automatically."
              >
                <button
                  type="button"
                  onClick={addFile}
                  className="flex w-full flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border bg-secondary/50 px-6 py-10 text-center transition-colors hover:border-primary hover:bg-primary-light"
                >
                  <Upload className="h-6 w-6 text-primary" />
                  <span className="text-sm font-semibold">Click to add a document</span>
                  <span className="text-xs text-muted-foreground">PDF, DOCX, JPG · up to 25 MB</span>
                </button>

                <div className="mt-5 space-y-3">
                  {docs.map((d) => (
                    <div
                      key={d.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <FileText className="h-5 w-5 shrink-0 text-primary" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{d.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {d.pages} pages · {d.sizeMb} MB
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setDocs((all) => all.filter((x) => x.id !== d.id))}
                        className="rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        aria-label={`Remove ${d.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  {docs.length === 0 && (
                    <p className="text-sm text-muted-foreground">No documents added yet.</p>
                  )}
                </div>
              </SectionCard>
            )}

            {step === 1 && (
              <>
                <SectionCard title="Paper type" hint={`Available at ${shop.name}`}>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {shop.paperTypes.map((p) => (
                      <Choice
                        key={p.id}
                        active={config.paperTypeId === p.id}
                        disabled={!p.enabled}
                        onClick={() => setConfig((c) => ({ ...c, paperTypeId: p.id }))}
                        title={p.name}
                        meta={
                          p.enabled
                            ? `B/W ${inr(p.bwPrice)} · Colour ${inr(p.colorPrice)} per page`
                            : "Not offered by this shop"
                        }
                      />
                    ))}
                  </div>
                </SectionCard>

                <SectionCard title="Print settings">
                  <div className="space-y-5">
                    <div>
                      <Label className="text-xs font-semibold text-subtle">PRINT TYPE</Label>
                      <div className="mt-2 grid gap-3 sm:grid-cols-2">
                        <Choice
                          active={config.printType === "bw"}
                          disabled={!shop.printTypes.bw}
                          onClick={() => setConfig((c) => ({ ...c, printType: "bw" }))}
                          title="Black & White"
                          meta="Best value for notes and reports"
                        />
                        <Choice
                          active={config.printType === "color"}
                          disabled={!shop.printTypes.color}
                          onClick={() => setConfig((c) => ({ ...c, printType: "color" }))}
                          title="Colour"
                          meta="For charts, images and presentations"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs font-semibold text-subtle">SIDES</Label>
                      <div className="mt-2 grid gap-3 sm:grid-cols-2">
                        <Choice
                          active={config.side === "single"}
                          disabled={!shop.printSides.single}
                          onClick={() => setConfig((c) => ({ ...c, side: "single" }))}
                          title="Single side"
                        />
                        <Choice
                          active={config.side === "double"}
                          disabled={!shop.printSides.double}
                          onClick={() => setConfig((c) => ({ ...c, side: "double" }))}
                          title="Double side"
                          meta="Saves paper and cost"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs font-semibold text-subtle">ORIENTATION</Label>
                      <div className="mt-2 grid gap-3 sm:grid-cols-2">
                        <Choice
                          active={config.orientation === "portrait"}
                          disabled={!shop.orientation.portrait}
                          onClick={() => setConfig((c) => ({ ...c, orientation: "portrait" }))}
                          title="Portrait"
                        />
                        <Choice
                          active={config.orientation === "landscape"}
                          disabled={!shop.orientation.landscape}
                          onClick={() => setConfig((c) => ({ ...c, orientation: "landscape" }))}
                          title="Landscape"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="copies" className="text-xs font-semibold text-subtle">
                          COPIES
                        </Label>
                        <Input
                          id="copies"
                          type="number"
                          min={1}
                          value={config.copies}
                          onChange={(e) =>
                            setConfig((c) => ({
                              ...c,
                              copies: Math.max(1, Number(e.target.value) || 1),
                            }))
                          }
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-semibold text-subtle">PAGES</Label>
                        <div className="mt-2 flex gap-2">
                          <Button
                            type="button"
                            variant={config.pageRangeMode === "all" ? "default" : "outline"}
                            onClick={() => setConfig((c) => ({ ...c, pageRangeMode: "all" }))}
                          >
                            All pages
                          </Button>
                          <Button
                            type="button"
                            variant={config.pageRangeMode === "custom" ? "default" : "outline"}
                            onClick={() => setConfig((c) => ({ ...c, pageRangeMode: "custom" }))}
                          >
                            Custom range
                          </Button>
                        </div>
                        {config.pageRangeMode === "custom" && (
                          <Input
                            placeholder="e.g. 1-5, 8, 11-13"
                            value={config.pageRange}
                            onChange={(e) => setConfig((c) => ({ ...c, pageRange: e.target.value }))}
                            className="mt-2"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </SectionCard>

                <SectionCard title="Binding & extras" hint="Optional finishing services">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Choice
                      active={config.bindingId === null}
                      onClick={() => setConfig((c) => ({ ...c, bindingId: null }))}
                      title="No binding"
                    />
                    {shop.binding.map((b) => (
                      <Choice
                        key={b.id}
                        active={config.bindingId === b.id}
                        disabled={!b.enabled}
                        onClick={() => setConfig((c) => ({ ...c, bindingId: b.id }))}
                        title={b.name}
                        meta={b.enabled ? `${inr(b.price)} per copy` : "Not available here"}
                      />
                    ))}
                  </div>

                  <div className="mt-5 space-y-3">
                    {shop.additional.map((a) => (
                      <label
                        key={a.id}
                        className={cn(
                          "flex items-center gap-3 rounded-lg border border-border px-4 py-3",
                          !a.enabled && "opacity-40",
                        )}
                      >
                        <Checkbox
                          checked={config.additionalIds.includes(a.id)}
                          disabled={!a.enabled}
                          onCheckedChange={(v) =>
                            setConfig((c) => ({
                              ...c,
                              additionalIds: v
                                ? [...c.additionalIds, a.id]
                                : c.additionalIds.filter((x) => x !== a.id),
                            }))
                          }
                        />
                        <span className="text-sm font-medium">{a.name}</span>
                        <span className="ml-auto text-sm text-muted-foreground">
                          {inr(a.price)} {a.perPage ? "per page" : "per copy"}
                        </span>
                      </label>
                    ))}
                  </div>
                </SectionCard>
              </>
            )}

            {step === 2 && (
              <SectionCard
                title="Nearby print shops"
                hint="Prices update instantly based on the shop you pick."
              >
                <div className="space-y-3">
                  {shops.map((s) => {
                    const p = calculatePrice(s, docs, config, fulfillment);
                    const active = s.id === shopId;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setShopId(s.id)}
                        className={cn(
                          "w-full rounded-lg border p-4 text-left transition-colors",
                          active
                            ? "border-primary bg-primary-light"
                            : "border-border bg-card hover:bg-secondary",
                        )}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold">{s.name}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{s.address}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-base font-bold">{inr(p.total)}</p>
                            <p className="text-xs text-muted-foreground">estimated total</p>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2 text-xs">
                          <span className="inline-flex items-center gap-1 rounded-md bg-card px-2 py-1 font-medium">
                            <Star className="h-3 w-3 text-warning" /> {s.rating}
                          </span>
                          <span className="rounded-md bg-card px-2 py-1 font-medium">
                            {s.distanceKm} km
                          </span>
                          <span className="rounded-md bg-card px-2 py-1 font-medium">
                            ~{s.prepMinutes} min
                          </span>
                          <span className="rounded-md bg-card px-2 py-1 font-medium">
                            {s.delivery.enabled ? "Pickup + Delivery" : "Pickup only"}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </SectionCard>
            )}

            {step === 3 && (
              <>
                <SectionCard title="How do you want it?" hint={shop.name}>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setFulfillment("pickup")}
                      className={cn(
                        "rounded-lg border p-4 text-left",
                        fulfillment === "pickup"
                          ? "border-primary bg-primary-light"
                          : "border-border hover:bg-secondary",
                      )}
                    >
                      <StoreIcon className="h-5 w-5 text-primary" />
                      <p className="mt-3 text-sm font-semibold">Pickup at shop</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Ready in ~{shop.prepMinutes} minutes · {shop.hours}
                      </p>
                    </button>
                    <button
                      type="button"
                      disabled={!shop.delivery.enabled}
                      onClick={() => setFulfillment("delivery")}
                      className={cn(
                        "rounded-lg border p-4 text-left",
                        fulfillment === "delivery"
                          ? "border-primary bg-primary-light"
                          : "border-border hover:bg-secondary",
                        !shop.delivery.enabled && "cursor-not-allowed opacity-40",
                      )}
                    >
                      <Truck className="h-5 w-5 text-primary" />
                      <p className="mt-3 text-sm font-semibold">Home delivery</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {shop.delivery.enabled
                          ? `${shop.delivery.etaMinutes} · ${inr(shop.delivery.fee)} fee${
                              shop.delivery.freeAbove
                                ? ` (free above ${inr(shop.delivery.freeAbove)})`
                                : ""
                            }`
                          : "This shop does not deliver"}
                      </p>
                    </button>
                  </div>
                </SectionCard>

                {fulfillment === "delivery" && (
                  <SectionCard title="Delivery address">
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
                  </SectionCard>
                )}
              </>
            )}

            {step === 4 && (
              <SectionCard title="Payment method" hint={`Accepted by ${shop.name}`}>
                <div className="space-y-3">
                  {(
                    [
                      ["full", shop.payments.full, `Pay ${inr(price.total)} now`],
                      [
                        "advance",
                        shop.payments.advance,
                        `Pay ${inr(advanceAmount(shop, price.total))} now, rest on ${
                          fulfillment === "pickup" ? "pickup" : "delivery"
                        }`,
                      ],
                      [
                        "cash_pickup",
                        shop.payments.cashPickup && fulfillment === "pickup",
                        "Pay the full amount when you collect",
                      ],
                      [
                        "cash_delivery",
                        shop.payments.cashDelivery && fulfillment === "delivery",
                        "Pay the delivery partner in cash",
                      ],
                    ] as const
                  ).map(([key, allowed, copy]) => (
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
                        <span className="mt-0.5 block text-xs text-muted-foreground">{copy}</span>
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
            )}

            {step === 5 && (
              <SectionCard title="Review your order" hint="Check everything before confirming.">
                <dl className="divide-y divide-border text-sm">
                  {(
                    [
                      ["Shop", shop.name],
                      ["Documents", `${docs.length} file(s) · ${docs.reduce((s, d) => s + d.pages, 0)} pages`],
                      ["Paper", paper?.name ?? "—"],
                      ["Print type", config.printType === "bw" ? "Black & White" : "Colour"],
                      ["Sides", config.side === "single" ? "Single side" : "Double side"],
                      ["Orientation", config.orientation],
                      ["Copies", String(config.copies)],
                      [
                        "Pages",
                        config.pageRangeMode === "all" ? "All pages" : config.pageRange || "All pages",
                      ],
                      [
                        "Binding",
                        shop.binding.find((b) => b.id === config.bindingId)?.name ?? "None",
                      ],
                      [
                        "Extras",
                        config.additionalIds.length
                          ? config.additionalIds
                              .map((id) => shop.additional.find((a) => a.id === id)?.name)
                              .join(", ")
                          : "None",
                      ],
                      ["Fulfilment", fulfillment === "pickup" ? "Pickup at shop" : "Home delivery"],
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
              </SectionCard>
            )}

            <div className="flex items-center justify-between gap-3">
              <Button
                variant="outline"
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={step === 0}
              >
                <ChevronLeft className="h-4 w-4" /> Back
              </Button>
              {step < 5 ? (
                <Button
                  onClick={() => {
                    if (!canContinue()) {
                      toast.error(stepBlockReason());
                      return;
                    }
                    setStep((s) => s + 1);
                  }}
                >
                  Continue <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={confirm} disabled={docs.length === 0}>
                  Confirm & place order
                </Button>
              )}
            </div>
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="card-surface p-5">
              <h2 className="text-base font-semibold">Price summary</h2>
              <p className="mt-1 text-xs text-muted-foreground">{shop.name}</p>
              <dl className="mt-4 space-y-2 text-sm">
                <Row label={`Printing (${price.billablePages} pages)`} value={inr(price.printing)} />
                <Row label="Binding" value={inr(price.binding)} />
                <Row label="Extra services" value={inr(price.services)} />
                <Row label="Delivery" value={inr(price.delivery)} />
                {price.discount > 0 && (
                  <Row label="Discount" value={`− ${inr(price.discount)}`} accent />
                )}
              </dl>
              <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                <span className="text-sm font-semibold">Total</span>
                <span className="text-xl font-bold">{inr(price.total)}</span>
              </div>
              <div className="mt-4 rounded-lg bg-secondary p-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pay now</span>
                  <span className="font-semibold">{inr(split.paidNow)}</span>
                </div>
                <div className="mt-1.5 flex justify-between">
                  <span className="text-muted-foreground">Balance later</span>
                  <span className="font-semibold">{inr(split.balance)}</span>
                </div>
              </div>
              {docs.length === 0 && (
                <p className="mt-4 text-xs text-muted-foreground">
                  Add documents to see live pricing.
                </p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </CustomerShell>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn("font-medium", accent && "text-success")}>{value}</dd>
    </div>
  );
}
