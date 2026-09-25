import { useState } from "react";
import { IndianRupee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStore } from "@/lib/store";
import { inr } from "@/lib/pricing";
import type { Order } from "@/types";

export function PaymentCollection({ order }: { order: Order }) {
  const { collectOrderPayment } = useStore();
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");

  const isFullyPaid = order.paymentMethod === "full" && order.balance <= 0;
  const isAdvance = order.paymentMethod === "advance";
  const isCashPickup = order.paymentMethod === "cash_pickup";
  const isCashDelivery = order.paymentMethod === "cash_delivery";
  const isCash = isCashPickup || isCashDelivery;

  if (isFullyPaid || order.balance <= 0) return null;

  const remaining = order.balance;

  function validate(value: string): boolean {
    setError("");
    const trimmed = value.trim();
    if (!trimmed) {
      setError("Enter an amount to collect.");
      return false;
    }
    const num = Number(trimmed);
    if (!Number.isFinite(num) || num <= 0) {
      setError("Enter a valid positive amount.");
      return false;
    }
    if (num > remaining) {
      setError(`Amount exceeds remaining balance of ${inr(remaining)}.`);
      return false;
    }
    return true;
  }

  function handleSubmit() {
    if (!validate(amount)) return;
    const num = Number(amount.trim());
    collectOrderPayment(order.id, num);
    setAmount("");
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSubmit();
  }

  return (
    <div className="card-surface p-4">
      <h3 className="text-sm font-semibold">Payment Collection</h3>

      {(isAdvance || order.paymentMethod === "full") && (
        <div className="mt-3 space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Order Total</span>
            <span className="font-medium">{inr(order.price.total)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Already Paid</span>
            <span className="font-medium">{inr(order.amountPaid)}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">Remaining</span>
            <span className="font-semibold text-amber-600 dark:text-amber-400">{inr(remaining)}</span>
          </div>
        </div>
      )}

      {isCash && (
        <p className="mt-2 text-xs text-muted-foreground">
          Collect {inr(remaining)} from the customer {isCashPickup ? "at pickup" : "on delivery"}.
        </p>
      )}

      <div className="mt-3 space-y-2">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₹</span>
          <Input
            type="number"
            min="0"
            step="0.01"
            placeholder="Amount"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setError("");
            }}
            onKeyDown={handleKeyDown}
            className="pl-7 text-sm"
          />
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}

        <Button size="sm" className="w-full" onClick={handleSubmit}>
          <IndianRupee className="mr-1 h-3.5 w-3.5" />
          Submit Payment
        </Button>
      </div>
    </div>
  );
}
