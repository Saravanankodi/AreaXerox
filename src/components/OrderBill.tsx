import { useMemo } from "react";
import { calculateDocumentPrices } from "@/lib/pricing";
import { paymentMethodLabel } from "@/lib/labels";
import { useStore } from "@/lib/store";
import type { Order } from "@/types";

export function OrderBill({ order }: { order: Order }) {
  const { shops } = useStore();
  const shop = shops.find((s) => s.id === order.shopId) ?? null;

  const docPrices = useMemo(
    () => calculateDocumentPrices(shop, order.documents, order.config),
    [shop, order.documents, order.config],
  );

  const { paymentMethod, fulfillment, price } = order;

  const isCash = paymentMethod === "cash_pickup" || paymentMethod === "cash_delivery";
  const isAdvance = paymentMethod === "advance";
  const hasBalance = order.balance > 0;

  return (
    <div className="card-surface p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Order Bill</h3>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
          {isCash
            ? fulfillment === "delivery"
              ? "Cash Delivery"
              : "Cash Pickup"
            : paymentMethodLabel[paymentMethod]}
        </span>
      </div>

      <div className="mt-3 space-y-1.5 text-xs">
        {order.documents.map((_, i) => (
          <div key={i} className="flex justify-between">
            <span className="text-muted-foreground">Document {i + 1}</span>
            <span className="font-medium">{inr(docPrices[i]?.total ?? 0)}</span>
          </div>
        ))}

        <div className="flex justify-between">
          <span className="text-muted-foreground">Delivery</span>
          <span className="font-medium">{inr(price.delivery)}</span>
        </div>
      </div>

      <div className="my-2 border-t border-border" />

      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold">Total</span>
        <span className="font-semibold">{inr(price.total)}</span>
      </div>

      <div className="mt-2 space-y-1 text-xs">
        {isAdvance && (
          <>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Paid now</span>
              <span className="font-medium">{inr(order.amountPaid)}</span>
            </div>
            {hasBalance && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Balance due</span>
                <span className="font-medium text-amber-600 dark:text-amber-400">
                  {inr(order.balance)}
                </span>
              </div>
            )}
          </>
        )}

        {!isAdvance && !hasBalance && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Paid in full</span>
            <span className="font-medium">{inr(order.amountPaid || price.total)}</span>
          </div>
        )}

        {!isAdvance && isCash && hasBalance && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              {paymentMethod === "cash_pickup" ? "Pay at pickup" : "Pay on delivery"}
            </span>
            <span className="font-medium">{inr(order.balance)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function inr(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(Math.round((Number.isFinite(amount) ? amount : 0) * 100) / 100);
}
