import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Upload,
  SlidersHorizontal,
  Store,
  Truck,
  CreditCard,
  BellRing,
  Star,
  Clock,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { CustomerShell } from "@/components/layout/CustomerShell";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { useStore } from "@/lib/store";
import { inr } from "@/lib/pricing";

export const Route = createFileRoute("/")({
  component: Index,
});

const steps = [
  { icon: Upload, title: "Upload documents", copy: "PDF, Word or images — as many files as you need." },
  { icon: SlidersHorizontal, title: "Choose print options", copy: "Paper, colour, sides, copies, binding and extras." },
  { icon: Store, title: "Pick a nearby shop", copy: "Compare price, distance and turnaround time." },
  { icon: Truck, title: "Pickup or delivery", copy: "Collect it yourself or get it home-delivered." },
  { icon: CreditCard, title: "Pay your way", copy: "Full, advance, or cash on pickup / delivery." },
  { icon: BellRing, title: "Track live status", copy: "From accepted to printed to delivered." },
];

function Index() {
  const { shops, orders } = useStore();
  const latest = orders[0];

  return (
    <CustomerShell>
      <section className="relative overflow-hidden border-b border-border bg-card">
        <div className="container-page grid items-center gap-12 py-14 md:py-20 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-light px-3 py-1 text-xs font-semibold text-primary">
              <Clock className="h-3.5 w-3.5" /> Ready in as little as 20 minutes
            </span>
            <h1 className="text-hero mt-5 font-extrabold">
              Print smarter.
              <br />
              Skip the queue.
            </h1>
            <p className="mt-5 max-w-xl text-base text-muted-foreground md:text-lg">
              Upload your documents, set exactly how you want them printed, and choose a trusted
              print shop near you. Pick it up or have it delivered — and watch every step happen
              live.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/order">
                <Button size="lg">
                  Order My Xerox <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/orders">
                <Button size="lg" variant="outline">
                  Track an order
                </Button>
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-success" /> Files auto-deleted after printing
              </span>
              <span className="inline-flex items-center gap-2">
                <Star className="h-4 w-4 text-warning" /> 4.8 average shop rating
              </span>
            </div>
          </div>

          <div className="card-surface rounded-xl p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Live order tracking</p>
              {latest && <StatusBadge status={latest.status} />}
            </div>
            {latest ? (
              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-lg font-bold">{latest.id}</p>
                  <p className="text-sm text-muted-foreground">{latest.shopName}</p>
                </div>
                <div className="rounded-lg bg-secondary p-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Documents</span>
                    <span className="font-medium">{latest.documents.length} file(s)</span>
                  </div>
                  <div className="mt-2 flex justify-between">
                    <span className="text-muted-foreground">Fulfilment</span>
                    <span className="font-medium capitalize">{latest.fulfillment}</span>
                  </div>
                  <div className="mt-2 flex justify-between">
                    <span className="text-muted-foreground">Total</span>
                    <span className="font-semibold">{inr(latest.price.total)}</span>
                  </div>
                </div>
                <Link to="/orders/$orderId" params={{ orderId: latest.id }}>
                  <Button variant="outline" className="w-full">
                    View order details
                  </Button>
                </Link>
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                Your first order will appear here.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="container-page py-14 md:py-20">
        <h2 className="text-section-title font-bold">How it works</h2>
        <p className="mt-2 text-sm text-muted-foreground">Six simple steps, no guesswork.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {steps.map((s, i) => (
            <div key={s.title} className="card-surface hover-lift p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary-light text-primary">
                  <s.icon className="h-5 w-5" />
                </span>
                <span className="text-xs font-semibold text-subtle">STEP {i + 1}</span>
              </div>
              <h3 className="mt-4 text-base font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-border bg-card py-14 md:py-20">
        <div className="container-page">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-section-title font-bold">Print shops near you</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Every shop sets its own paper, pricing and services.
              </p>
            </div>
            <Link to="/order">
              <Button variant="outline">Compare all shops</Button>
            </Link>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {shops.map((shop) => (
              <div key={shop.id} className="card-surface hover-lift p-5">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-base font-semibold">{shop.name}</h3>
                  <span className="inline-flex items-center gap-1 text-sm font-semibold">
                    <Star className="h-4 w-4 text-warning" /> {shop.rating}
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{shop.address}</p>
                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-md bg-secondary px-2 py-1 font-medium">
                    {shop.distanceKm} km away
                  </span>
                  <span className="rounded-md bg-secondary px-2 py-1 font-medium">
                    ~{shop.prepMinutes} min prep
                  </span>
                  <span className="rounded-md bg-secondary px-2 py-1 font-medium">
                    {shop.delivery.enabled ? "Delivery available" : "Pickup only"}
                  </span>
                </div>
                <p className="mt-4 text-sm">
                  B/W from{" "}
                  <span className="font-semibold">
                    {inr(Math.min(...shop.paperTypes.filter((p) => p.enabled).map((p) => p.bwPrice)))}
                  </span>{" "}
                  / page
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-14 md:py-20">
        <div className="rounded-xl bg-primary px-6 py-12 text-center text-primary-foreground md:px-12">
          <h2 className="text-section-title font-bold">Your documents, printed today</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm opacity-90">
            No calls, no waiting at the counter. Upload once and let the shop do the rest.
          </p>
          <Link to="/order" className="mt-8 inline-block">
            <Button size="lg" variant="secondary">
              Start a print order
            </Button>
          </Link>
        </div>
      </section>
    </CustomerShell>
  );
}
