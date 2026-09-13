import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Home, Package } from "lucide-react";
import { CustomerShell } from "@/components/layout/CustomerShell";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { inr } from "@/lib/pricing";

export const Route = createFileRoute("/order-confirmation/$orderId")({
  head: () => ({
    meta: [
      { title: "Order Placed — XEROXMATE" },
      {
        name: "description",
        content: "Your print order has been placed successfully.",
      },
      { property: "og:title", content: "Order Placed — XEROXMATE" },
      {
        property: "og:description",
        content: "Your print order has been placed successfully.",
      },
    ],
  }),
  component: OrderConfirmation,
});

function OrderConfirmation() {
  const { orderId } = Route.useParams();
  const { orders, hydrated } = useStore();
  const order = orders.find((o) => o.id === orderId);

  if (!order) {
    return (
      <CustomerShell>
        <div className="container-page py-20 text-center">
          <h1 className="text-page-title font-bold">{hydrated ? "Order not found" : "Loading…"}</h1>
          {hydrated && (
            <Link to="/" className="mt-6 inline-block">
              <Button>Go to Home</Button>
            </Link>
          )}
        </div>
      </CustomerShell>
    );
  }

  return (
    <CustomerShell>
      <div className=" container-page flex min-h-[calc(100vh-200px)] items-center justify-center ">
        <div className="card-surface m-6 p-6 w-full max-w-md text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success-light text-success">
            <CheckCircle2 className="h-9 w-9" />
          </span>

          <h1 className="mt-6 text-2xl font-bold">Order placed</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            <span className="font-semibold text-foreground">{order.shopName}</span> has received
            your order. You'll see live updates as they print it.
          </p>

          <div className="mx-auto mt-8 w-full max-w-xs space-y-3 rounded-xl border bg-card px-5 py-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Order ID</span>
              <span className="font-semibold">{order.id}</span>
            </div>
            <div className="border-t border-border" />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Paid now</span>
              <span className="font-semibold">{inr(order.amountPaid)}</span>
            </div>
            <div className="border-t border-border" />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Balance</span>
              <span className="font-semibold">{inr(order.balance)}</span>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3">
            <Link to="/orders/$orderId" params={{ orderId: order.id }}>
              <Button className="w-full" size="lg">
                <Package className="mr-2 h-4 w-4" /> Track this order
              </Button>
            </Link>
            <Link to="/">
              <Button variant="outline" className="w-full" size="lg">
                <Home className="mr-2 h-4 w-4" /> Go to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </CustomerShell>
  );
}
