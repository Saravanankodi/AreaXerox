import { createFileRoute, Link } from "@/lib/navigation";
import { useEffect } from "react";
import {
  IndianRupee,
  ClipboardList,
  Clock,
  TrendingUp,
  CheckCircle2,
  Circle,
  XCircle,
  Lock,
  ArrowRight,
  Info,
} from "lucide-react";
import { ShopShell } from "@/components/layout/ShopShell";
import { Button } from "@/components/ui/button";
import { StatusBadge, PaymentBadge } from "@/components/StatusBadge";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { inr } from "@/lib/pricing";
import { fulfillmentLabel } from "@/lib/labels";
import { getShopOnboardingState } from "@/lib/onboarding";
import { cn } from "@/lib/utils";
import type { Shop } from "@/types";

export const Route = createFileRoute("/shop/")({
  head: () => ({
    meta: [
      { title: "Shop Dashboard — XEROXMATE" },
      {
        name: "description",
        content: "Today's print orders, revenue, pending balances and queue status for your shop.",
      },
      { property: "og:title", content: "Shop Dashboard — XEROXMATE" },
      { property: "og:description", content: "Run your print shop from one screen." },
    ],
  }),
  component: ShopDashboard,
});

function ShopDashboard() {
  const { orders, activeShop, createShop, updateShop, submitShopkeeperApplication, getShopkeeperApplication, shops } =
    useStore();
  const { session } = useAuth();

  const application = getShopkeeperApplication(session?.accountId ?? "");
  const onboarding = getShopOnboardingState(activeShop, activeShop.accountStatus);

  // Create Shop record if the shopkeeper doesn't have one yet.
  useEffect(() => {
    if (!session || session.role !== "shopkeeper") return;
    const existingShop = shops.find((s) => s.ownerAccountId === session.accountId);
    if (existingShop) return;
    const newShop: Shop = {
      id: `shop-${session.accountId}`,
      name: application?.shopName ?? session.shopName ?? session.email.split("@")[0] ?? "My Shop",
      ownerName: application?.shopkeeperProfile.ownerName ?? session.name ?? "",
      ownerPhone: application?.shopkeeperProfile.phone ?? session.phone ?? "",
      phone: session.phone ?? "",
      email: session.email,
      address: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      zip: "",
      country: "India",
      hours: "",
      rating: 0,
      distanceKm: 0,
      prepMinutes: 20,
      pickup: false,
      paperTypes: [
        { id: "a4", name: "A4 Paper", enabled: false, bwEnabled: true, bwPrice: 0, colorEnabled: true, colorPrice: 0, single: true, double: true },
        { id: "a3", name: "A3 Paper", enabled: false, bwEnabled: true, bwPrice: 0, colorEnabled: true, colorPrice: 0, single: true, double: true },
        { id: "a5", name: "A5 Paper", enabled: false, bwEnabled: true, bwPrice: 0, colorEnabled: true, colorPrice: 0, single: true, double: true },
        { id: "bond", name: "Bond Sheet", enabled: false, bwEnabled: true, bwPrice: 0, colorEnabled: true, colorPrice: 0, single: true, double: true },
        { id: "photo-4", name: "Photo — 4 Photos", enabled: false, bwEnabled: false, bwPrice: 0, colorEnabled: true, colorPrice: 0, single: true, double: true },
        { id: "photo-8", name: "Photo — 8 Photos", enabled: false, bwEnabled: false, bwPrice: 0, colorEnabled: true, colorPrice: 0, single: true, double: true },
      ],
      printTypes: { bw: false, color: false },
      printSides: { single: true, double: true },
      orientation: { portrait: true, landscape: true },
      binding: [
        { id: "spiral", name: "Spiral Binding", enabled: false, price: 0 },
        { id: "soft", name: "Soft Binding", enabled: false, price: 0 },
        { id: "hard", name: "Hard Binding", enabled: false, price: 0 },
      ],
      additional: [
        { id: "lamination", name: "Lamination", enabled: false, price: 0, perPage: true },
        { id: "stapling", name: "Stapling", enabled: false, price: 0 },
      ],
      delivery: { enabled: false, fee: 0, freeAbove: null, etaMinutes: "", areas: [] },
      payments: { full: true, advance: false, cashPickup: false, cashDelivery: false, advancePercent: 30 },
      ownerAccountId: session.accountId,
    };
    createShop(newShop);
  }, [session, shops, activeShop.id, createShop, application]);

  function handleCheckIn() {
    if (activeShop.isOpen || !isSetupComplete) return;
    updateShop(activeShop.id, (s) => ({ ...s, isOpen: true, lastCheckInAt: new Date().toISOString() }));
  }

  function handleCheckOut() {
    if (!activeShop.isOpen || !isSetupComplete) return;
    updateShop(activeShop.id, (s) => ({ ...s, isOpen: false, lastCheckOutAt: new Date().toISOString() }));
  }

  function handleRequestApproval() {
    if (!session || !onboarding.canRequestApproval) return;
    const now = new Date().toISOString();
    const app = {
      id: application?.id ?? `app-${Date.now()}`,
      accountId: session.accountId,
      shopkeeperProfile: {
        accountId: session.accountId,
        username: session.email.split("@")[0] ?? "shopkeeper",
        ownerName: activeShop.ownerName,
        phone: activeShop.phone,
        alternatePhone: "",
      },
      shopName: activeShop.name,
      shopAddress: activeShop.addressLine1 ?? activeShop.address,
      area: "",
      city: "",
      state: "",
      pincode: "",
      shopDescription: "",
      shopImages: [],
      services: {
        a4: activeShop.paperTypes.some((p) => p.id === "a4" && p.enabled),
        a3: activeShop.paperTypes.some((p) => p.id === "a3" && p.enabled),
        bondSheet: activeShop.paperTypes.some((p) => p.id === "bond" && p.enabled),
        photoSheet: activeShop.paperTypes.some((p) => (p.id === "photo-4" || p.id === "photo-8") && p.enabled),
        bw: activeShop.paperTypes.some((p) => p.enabled && p.bwEnabled),
        colour: activeShop.paperTypes.some((p) => p.enabled && p.colorEnabled),
        pickup: activeShop.pickup,
        delivery: activeShop.delivery.enabled,
        deliveryFee: activeShop.delivery.fee,
        businessHoursFrom: activeShop.openingTime ?? "09:00",
        businessHoursTo: activeShop.closingTime ?? "21:00",
        workingDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
      },
      accountStatus: "pending" as const,
      createdAt: application?.createdAt ?? now,
      updatedAt: now,
    };
    submitShopkeeperApplication(app);
    updateShop(activeShop.id, (s) => ({ ...s, accountStatus: "pending" }));
  }

  const mine = orders.filter((o) => o.shopId === activeShop.id);
  const active = mine
    .filter((o) => !["COMPLETED", "DELIVERED", "REJECTED"].includes(o.status))
    .sort((a, b) => {
      const ta = new Date(a.createdAt).getTime();
      const tb = new Date(b.createdAt).getTime();
      if (ta !== tb) return ta - tb;
      return a.id.localeCompare(b.id);
    });
  const revenue = mine.reduce((s, o) => s + o.amountPaid, 0);
  const pendingBalance = mine.reduce((s, o) => s + o.balance, 0);

  const stats = [
    { label: "Active orders", value: String(active.length), icon: ClipboardList },
    { label: "New requests", value: String(mine.filter((o) => o.status === "NEW").length), icon: Clock },
    { label: "Collected", value: inr(revenue), icon: IndianRupee },
    { label: "Balance pending", value: inr(pendingBalance), icon: TrendingUp },
  ];

  function stageIcon(status: string) {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />;
      case "current":
        return <Circle className="h-5 w-5 shrink-0 fill-primary text-primary" />;
      case "locked":
        return <Lock className="h-5 w-5 shrink-0 text-muted-foreground/40" />;
      case "rejected":
        return <XCircle className="h-5 w-5 shrink-0 text-destructive" />;
      default:
        return <Circle className="h-5 w-5 shrink-0 text-muted-foreground/40" />;
    }
  }

  const isApproved = !activeShop.accountStatus || activeShop.accountStatus === "active";
  const isSetupComplete = onboarding.profileComplete && onboarding.servicesComplete && isApproved;

  return (
    <ShopShell
      title="Dashboard"
      subtitle={`${activeShop.name} · ${activeShop.hours || "No hours set"}`}
      action={
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "flex items-center gap-1.5 text-xs font-semibold",
              activeShop.isOpen ? "text-success" : "text-muted-foreground",
            )}
          >
            <span className={cn("inline-block h-2 w-2 rounded-full", activeShop.isOpen ? "bg-success" : "bg-muted-foreground/40")} />
            {activeShop.isOpen ? "Open" : "Closed"}
          </span>
          {!isSetupComplete ? (
            <Button variant="outline" size="sm" disabled className="opacity-50">
              Check In
            </Button>
          ) : activeShop.isOpen ? (
            <Button variant="destructive" size="sm" onClick={handleCheckOut}>
              Check Out
            </Button>
          ) : (
            <Button variant="default" size="sm" className="bg-success hover:bg-success/90" onClick={handleCheckIn}>
              Check In
            </Button>
          )}
        </div>
      }
    >
      {/* Approval & Setup — only visible before approval */}
      {!isApproved && (
        <>
          {/* Approval Status Popup */}
          {!onboarding.rejected && !onboarding.approved && !onboarding.approvalRequested && (
            <div className="mb-6 rounded-lg border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-start gap-3">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div>
                  <p className="text-sm font-semibold">Complete your shop setup</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Complete your Shop Profile and Print Services first. Once you submit your request, XEROXMATE will review and approve your shop.
                  </p>
                </div>
              </div>
            </div>
          )}
          {!onboarding.rejected && !onboarding.approved && onboarding.approvalRequested && (
            <div className="mb-6 rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4">
              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-yellow-600" />
                <div>
                  <p className="text-sm font-semibold">Approval pending</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Your request has been submitted. XEROXMATE will review and approve your shop shortly.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Onboarding Timeline */}
          <div className="card-surface  mb-6 p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Setup your shop</h2>
              <span className="text-xs text-muted-foreground">
                {onboarding.completedCount} of {onboarding.totalCount} completed
              </span>
            </div>

            {/* Progress bar */}
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${onboarding.progressPercent}%` }}
              />
            </div>

            {/* Desktop: horizontal timeline */}
            <div className="mt-5 hidden sm:flex sm:items-center sm:ps-[10%] sm:gap-0">
              {onboarding.stages.map((stage, i) => (
                <div key={stage.key} className="flex flex-1 items-start">
                  <div className="flex flex-col items-center">
                    {stageIcon(stage.status)}
                    <p
                      className={cn(
                        "mt-1.5 max-w-[110px] text-center text-[11px] font-medium leading-tight",
                        stage.status === "completed" && "text-success",
                        stage.status === "current" && "text-primary",
                        stage.status === "locked" && "text-muted-foreground/50",
                        stage.status === "rejected" && "text-destructive",
                      )}
                    >
                      {stage.label}
                    </p>
                    <p
                      className={cn(
                        "mt-0.5 max-w-[110px] text-center text-[10px] leading-tight",
                        stage.status === "completed" && "text-success/70",
                        stage.status === "current" && "text-primary/70",
                        stage.status === "locked" && "text-muted-foreground/40",
                        stage.status === "rejected" && "text-destructive/70",
                      )}
                    >
                      {stage.statusText}
                    </p>
                  </div>
                  {i < onboarding.stages.length - 1 && (
                    <div
                      className={cn(
                        "mx-1 mt-2.5 h-px flex-1",
                        stage.status === "completed" ? "bg-success" : "bg-border",
                      )}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Mobile: vertical timeline */}
            <div className="mt-4 space-y-0 sm:hidden">
              {onboarding.stages.map((stage, i) => (
                <div key={stage.key} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    {stageIcon(stage.status)}
                    {i < onboarding.stages.length - 1 && (
                      <div className={cn("h-5 w-px", stage.status === "completed" ? "bg-success" : "bg-border")} />
                    )}
                  </div>
                  <div className="pb-3">
                    <p
                      className={cn(
                        "text-sm font-medium",
                        stage.status === "completed" && "text-success",
                        stage.status === "current" && "text-primary",
                        stage.status === "locked" && "text-muted-foreground/50",
                        stage.status === "rejected" && "text-destructive",
                      )}
                    >
                      {stage.label}
                    </p>
                    <p
                      className={cn(
                        "text-xs",
                        stage.status === "completed" && "text-success/70",
                        stage.status === "current" && "text-primary/70",
                        stage.status === "locked" && "text-muted-foreground/40",
                        stage.status === "rejected" && "text-destructive/70",
                      )}
                    >
                      {stage.statusText}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Rejection reason */}
            {onboarding.rejected && application?.rejectionReason && (
              <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
                <p className="font-semibold text-destructive">Rejection reason</p>
                <p className="mt-1 text-muted-foreground">{application.rejectionReason}</p>
              </div>
            )}

            {/* CTA */}
            <div className="mt-6 flex items-center justify-center">
              {onboarding.rejected && (
                <Button onClick={handleRequestApproval}>
                  Update & Resubmit <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              )}
              {!onboarding.rejected && !onboarding.profileComplete && (
                <Link to="/shop/profile">
                  <Button>
                    Complete Shop Profile <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Button>
                </Link>
              )}
              {!onboarding.rejected && onboarding.profileComplete && !onboarding.servicesComplete && (
                <Link to="/shop/services">
                  <Button>
                    Complete Print Services <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Button>
                </Link>
              )}
              {!onboarding.rejected && onboarding.canRequestApproval && (
                <Button onClick={handleRequestApproval}>
                  Request Approval <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              )}
              {!onboarding.rejected && onboarding.approvalRequested && !onboarding.approved && (
                <p className="text-sm text-muted-foreground">Waiting for admin approval…</p>
              )}
            </div>
          </div>
        </>
      )}

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
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

      {/* Live Order */}
      <div className="card-surface mt-6 p-5 md:p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Live Order</h2>
          <Link to="/shop/orders" className="text-sm font-medium text-primary hover:underline">
            View all
          </Link>
        </div>
        <div className="mt-5 space-y-3">
          {active.slice(0, 6).map((o, idx) => (
            <div
              key={o.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-4"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  #{idx + 1}
                </span>
                <div>
                  <p className="text-sm font-bold">{o.id}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {o.customerName} · {fulfillmentLabel[o.fulfillment]} ·{" "}
                    {o.documents.reduce((s, d) => s + d.pages, 0)} pages
                  </p>
                </div>
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
