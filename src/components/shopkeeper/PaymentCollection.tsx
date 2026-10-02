import { useState } from "react";
import { Banknote, CreditCard, IndianRupee, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { inr } from "@/lib/pricing";
import type { Order, PaymentCollectedVia } from "@/types";

/**
 * How the shopkeeper physically took the money.
 *
 * This is not cosmetic: it is recorded on the ledger entry as `via`, so a cash
 * collection and a card swipe of the same amount are distinguishable later.
 */
const VIA_OPTIONS: Array<{
  value: PaymentCollectedVia;
  label: string;
  icon: typeof Banknote;
}> = [
  { value: "cash", label: "Cash", icon: Banknote },
  { value: "upi", label: "UPI", icon: Smartphone },
  { value: "card", label: "Card", icon: CreditCard },
];

export function PaymentCollection({ order }: { order: Order }) {
  const { collectOrderPayment } = useStore();
  const [amount, setAmount] = useState("");
  const [via, setVia] = useState<PaymentCollectedVia>("cash");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const isFullyPaid = order.paymentMethod === "full" && order.balance <= 0;
  const isAdvance = order.paymentMethod === "advance";
  const isCashPickup = order.paymentMethod === "cash_pickup";
  const isCashDelivery = order.paymentMethod === "cash_delivery";
  const isCash = isCashPickup || isCashDelivery;

  if (isFullyPaid || order.balance <= 0) return null;

  const remaining = order.balance;

  function validate(value: string): number | null {
    const trimmed = value.trim();
    if (!trimmed) {
      setError("Enter an amount to collect.");
      return null;
    }
    const num = Number(trimmed);
    if (!Number.isFinite(num) || num <= 0) {
      setError("Enter a valid positive amount.");
      return null;
    }
    if (num > remaining) {
      setError(`Amount exceeds remaining balance of ${inr(remaining)}.`);
      return null;
    }
    return num;
  }

  async function handleSubmit() {
    setError("");
    const num = validate(amount);
    if (num === null) return;

    setSaving(true);
    try {
      await collectOrderPayment(order.id, num, via);
      setAmount("");
    } catch (e) {
      // The server is the only writer now, so a failure here means the payment
      // genuinely was not recorded. Say so rather than clearing the field.
      setError(e instanceof Error ? e.message : "Could not record the payment.");
    } finally {
      setSaving(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") void handleSubmit();
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
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Collected via
          </label>
          <div className="grid grid-cols-3 gap-2" role="group" aria-label="Collected via">
            {VIA_OPTIONS.map((option) => {
              const Icon = option.icon;
              const active = via === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setVia(option.value)}
                  aria-pressed={active}
                  className={cn(
                    "flex items-center justify-center gap-1.5 rounded-md border px-2 py-2 text-xs font-medium transition-colors",
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground hover:bg-secondary",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

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
            disabled={saving}
            className="pl-7 text-sm"
          />
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}

        <Button size="sm" className="w-full" onClick={() => void handleSubmit()} disabled={saving}>
          <IndianRupee className="mr-1 h-3.5 w-3.5" />
          {saving ? "Recording…" : "Submit Payment"}
        </Button>
      </div>
    </div>
  );
}