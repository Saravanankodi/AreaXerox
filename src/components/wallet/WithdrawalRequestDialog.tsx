import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { inr } from "@/lib/pricing";
import { requestWithdrawal, type WalletResponse } from "@/services/wallet.service";
import type { Withdrawal } from "@/types";

/**
 * Formatted destination copy, or `null` when the shop has no payout details on
 * file. The caller must not substitute a placeholder: the dialog renders a
 * warning instead so a shopkeeper is never told their money is going to an
 * account that isn't theirs.
 */
export function formatDestinationLabel(
  payoutMethod: WalletResponse["payoutMethod"],
  payoutDetails: WalletResponse["payoutDetails"],
): string | null {
  if (!payoutDetails) return null;
  if (payoutMethod === "upi") return payoutDetails.upiId ?? null;
  const parts = [payoutDetails.accountNumber, payoutDetails.ifsc].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : null;
}

export function WithdrawalRequestDialog({
  open,
  onOpenChange,
  shopId,
  wallet,
  onRequested,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shopId: string;
  wallet: WalletResponse;
  onRequested: (result: { withdrawal: Withdrawal; summary: WalletResponse["summary"] }) => void;
}) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const { minWithdrawalAmount, payoutDetails, payoutMethod } = wallet;
  const available = wallet.summary.availableBalance;
  const destination = formatDestinationLabel(payoutMethod, payoutDetails);

  function validate(value: string): string {
    const trimmed = value.trim();
    if (!trimmed) return "Enter an amount to withdraw.";
    const num = Number(trimmed);
    if (!Number.isFinite(num) || num <= 0) return "Enter a valid amount.";
    if (num < minWithdrawalAmount) return `Minimum withdrawal is ${inr(minWithdrawalAmount)}.`;
    if (num > available) return `Amount exceeds your available balance of ${inr(available)}.`;
    return "";
  }

  const error = validate(amount);
  const canSubmit = !error && !loading && destination !== null;

  async function handleSubmit() {
    if (!canSubmit) return;
    const parsed = Number(amount.trim());

    setLoading(true);
    toast.loading("Requesting withdrawal…", { id: "withdrawal-request" });

    try {
      const result = await requestWithdrawal({ shopId, amount: parsed });
      toast.success("Withdrawal requested", { id: "withdrawal-request" });
      onRequested(result);
      setAmount("");
      onOpenChange(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Unable to request withdrawal.",
        { id: "withdrawal-request" },
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Request withdrawal</DialogTitle>
          <DialogDescription>
            Withdraw your available shop earnings.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div>
            <p className="text-sm text-muted-foreground">Available balance</p>
            <p className="mt-1 text-2xl font-bold">{inr(available)}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Minimum withdrawal: {inr(minWithdrawalAmount)}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="withdrawal-amount">Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                ₹
              </span>
              <Input
                id="withdrawal-amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="Amount"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void handleSubmit();
                }}
                className="pl-7 text-sm"
                disabled={loading}
              />
            </div>
            {error && amount.trim().length > 0 && (
              <p className="text-xs text-destructive">{error}</p>
            )}
          </div>

          <div className="space-y-2">
            {available > 0 && (
              <button
                type="button"
                disabled={loading || available < minWithdrawalAmount}
                className="text-sm font-medium text-primary hover:underline disabled:pointer-events-none disabled:opacity-50"
                onClick={() => setAmount(String(available))}
              >
                Withdraw max ({inr(available)})
              </button>
            )}
            {destination ? (
              <p className="text-xs text-muted-foreground">
                Funds go to {destination} within 1–2 business days.
              </p>
            ) : (
              <p className="text-xs text-destructive">
                Add your bank account or UPI ID in your shop profile before requesting a
                withdrawal.
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="mt-4 flex flex-row gap-3 sm:flex-row">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={!canSubmit}>
            {loading ? "Requesting…" : "Withdraw"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
