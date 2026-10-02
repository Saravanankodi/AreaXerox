import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import {
  ArrowDownToLine,
  Banknote,
  Clock3,
  ClipboardList,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { createFileRoute, Link } from "@/lib/navigation";
import { ShopShell } from "@/components/layout/ShopShell";
import { Button } from "@/components/ui/button";
import { WithdrawalRequestDialog, formatDestinationLabel } from "@/components/wallet/WithdrawalRequestDialog";
import { WithdrawalStatusBadge } from "@/components/wallet/WithdrawalStatusBadge";
import { useMyShop } from "@/lib/useMyShop";
import { inr } from "@/lib/pricing";
import { walletCollectedViaLabel, walletEntrySourceLabel } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { fetchWallet, type WalletResponse } from "@/services/wallet.service";
import type { WalletEntry, Withdrawal, WithdrawalDestination } from "@/types";

export const Route = createFileRoute("/shop/wallet")({
  head: () => ({
    meta: [
      { title: "Wallet — XEROXMATE Shop" },
      {
        name: "description",
        content: "Track your shop earnings and withdraw your available balance.",
      },
      { property: "og:title", content: "Wallet — XEROXMATE Shop" },
      { property: "og:description", content: "Track your shop earnings and withdraw your balance." },
    ],
  }),
  component: ShopWallet,
});

const TABS = ["Transactions", "Withdrawals"] as const;
type Tab = (typeof TABS)[number];

interface WalletFetchResult {
  shopId: string;
  data: WalletResponse | null;
  error: string | null;
}

function ShopWallet() {
  const shop = useMyShop();
  const [result, setResult] = useState<WalletFetchResult | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [tab, setTab] = useState<Tab>("Transactions");
  const [dialogOpen, setDialogOpen] = useState(false);

  // No synchronous setState here: the effect body only kicks off the request and
  // writes state from the promise callbacks. `loading` is derived instead, so a
  // shopId change re-shows the skeleton without a cascading render.
  useEffect(() => {
    let active = true;

    fetchWallet(shop.id)
      .then((data) => {
        if (active) setResult({ shopId: shop.id, data, error: null });
      })
      .catch((err: unknown) => {
        if (!active) return;
        setResult({
          shopId: shop.id,
          data: null,
          error: err instanceof Error ? err.message : "Unable to load your wallet.",
        });
      });

    return () => {
      active = false;
    };
  }, [shop.id, reloadKey]);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  const stale = result !== null && result.shopId !== shop.id;
  const loading = result === null || stale;
  const wallet = loading ? null : result?.data ?? null;
  const error = loading ? null : result?.error ?? null;

  function handleRequested(request: { withdrawal: Withdrawal; summary: WalletResponse["summary"] }) {
    setResult((current) => {
      if (!current?.data) return current;
      return {
        ...current,
        data: {
          ...current.data,
          summary: request.summary,
          withdrawals: [request.withdrawal, ...current.data.withdrawals],
          // No debit entry yet. A pending request only reserves the balance
          // (pendingRequested); the debit appears once an admin marks it paid.
          // Showing it now would imply money had already left the wallet.
          entries: current.data.entries,
        },
      };
    });
    setTab("Withdrawals");
  }

  const destination = wallet ? formatDestinationLabel(wallet.payoutMethod, wallet.payoutDetails) : null;
  const hasPayoutDetails = Boolean(destination);

  const withdrawDisabledReason = !wallet
    ? undefined
    : !hasPayoutDetails
      ? "Add your bank account or UPI ID in Shop Profile first."
      : wallet.summary.availableBalance < wallet.minWithdrawalAmount
        ? "Your available balance is below the minimum withdrawal amount."
        : undefined;

  const canWithdraw = Boolean(wallet) && hasPayoutDetails && !withdrawDisabledReason;

  const inFlight = wallet
    ? wallet.withdrawals.filter((w) => w.status === "pending" || w.status === "approved")
    : [];

  return (
    <ShopShell
      title="Wallet"
      subtitle="Track your earnings and withdraw your available balance."
      action={
        <Button disabled={!canWithdraw} onClick={() => setDialogOpen(true)}>
          <ArrowDownToLine className="mr-1.5 h-4 w-4" />
          Request withdrawal
        </Button>
      }
    >
      {loading ? (
        <WalletSkeleton />
      ) : error ? (
        <div className="card-surface p-10 text-center">
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" className="mt-4" onClick={reload}>
            Retry
          </Button>
        </div>
      ) : wallet ? (
        <div className="space-y-6">
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total earned"
              value={inr(wallet.summary.totalEarned)}
              icon={Banknote}
            />
            <StatCard
              label="Pending requests"
              value={inr(wallet.summary.pendingRequested)}
              icon={Clock3}
              hint={wallet.summary.pendingRequested > 0 ? "Awaiting approval" : undefined}
            />
            <StatCard
              label="Available balance"
              value={inr(wallet.summary.availableBalance)}
              icon={Wallet}
              emphasis
            />
            <StatCard
              label="Orders credited"
              value={String(wallet.summary.ordersCounted)}
              icon={ClipboardList}
            />
          </div>

          {inFlight.length > 0 && (
            <div className="flex items-center justify-between gap-4 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
              <div className="flex items-start gap-3">
                <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div>
                  <p className="text-sm font-semibold">Withdrawal in progress</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {inFlight.length === 1
                      ? `${inr(inFlight[0]!.amount)} requested on ${format(new Date(inFlight[0]!.requestedAt), "dd MMM yyyy")} is awaiting approval.`
                      : `${inFlight.length} withdrawal requests totalling ${inr(inFlight.reduce((s, w) => s + w.amount, 0))} are awaiting approval.`}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 whitespace-nowrap"
                onClick={() => setTab("Withdrawals")}
              >
                View
              </Button>
            </div>
          )}

          <div className="card-surface p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold">Payout destination</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {destination ?? "No payout details added yet"}
              </p>
            </div>
            {!hasPayoutDetails && (
              <span className="inline-flex w-fit items-center rounded-md border border-warning/40 bg-warning-light px-2.5 py-1 text-xs font-semibold text-warning">
                Details required
              </span>
            )}
            <Link
              to="/shop/profile"
              className="shrink-0 text-sm font-medium text-primary hover:underline"
            >
              Manage
            </Link>
          </div>
        </div>

        {/*
          The withdraw button is disabled without these details, but a disabled
          button with only a `title` tooltip explains nothing on touch devices.
          This notice is the visible, reachable reason — 2 of 7 shops currently
          have no usable payout details and will land here.
        */}
        {!hasPayoutDetails && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-warning/40 bg-warning-light p-4">
            <div className="flex min-w-0 items-start gap-3">
              <Wallet className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
              <div className="min-w-0">
                <p className="text-sm font-semibold">Add your payout details</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Add a bank account or UPI ID to receive withdrawals. Withdrawals stay
                  unavailable until this is done.
                </p>
              </div>
            </div>
            <Button asChild variant="outline" className="shrink-0">
              <Link to="/shop/profile">Add payout details</Link>
            </Button>
          </div>
        )}

          <div className="flex flex-wrap gap-2">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  tab === t
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-muted-foreground hover:bg-secondary",
                )}
              >
                {t}
              </button>
            ))}
          </div>

          {tab === "Transactions" ? (
            <Transactions entries={wallet.entries} />
          ) : (
            <Withdrawals withdrawals={wallet.withdrawals} />
          )}

          <WithdrawalRequestDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            shopId={shop.id}
            wallet={wallet}
            onRequested={handleRequested}
          />
        </div>
      ) : null}
    </ShopShell>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  emphasis,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  hint?: string;
  emphasis?: boolean;
}) {
  return (
    <div className={cn("card-surface p-5", emphasis && "ring-1 ring-primary/20")}>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <Icon className={cn("h-4 w-4", emphasis ? "text-primary" : "text-muted-foreground")} />
      </div>
      <p className="mt-3 text-2xl font-bold">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Transactions({ entries }: { entries: WalletEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="card-surface p-10 text-center">
        <p className="text-sm text-muted-foreground">No transactions yet.</p>
      </div>
    );
  }

  return (
    <div className="card-surface space-y-3 p-5">
      {entries.map((entry) => (
        <div
          key={entry.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-4"
        >
          <div className="min-w-0">
            <p className="text-sm font-semibold">{walletEntrySourceLabel[entry.source]}</p>
            <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground">
              {entry.orderId ? (
                <Link
                  to="/shop/orders/$orderId"
                  params={{ orderId: entry.orderId }}
                  className="font-medium text-primary hover:underline"
                >
                  Order {entry.orderId}
                </Link>
              ) : null}
              {entry.orderId && entry.via ? <span aria-hidden="true">·</span> : null}
              {entry.via ? <span>{walletCollectedViaLabel[entry.via]}</span> : null}
              <span>· {format(new Date(entry.createdAt), "dd MMM yyyy, hh:mm a")}</span>
            </p>
            {entry.note && <p className="mt-1 text-xs text-muted-foreground">{entry.note}</p>}
          </div>
          <span
            className={cn(
              "shrink-0 text-sm font-semibold",
              entry.kind === "credit" ? "text-success" : "text-destructive",
            )}
          >
            {entry.kind === "credit" ? "+" : "−"}
            {inr(entry.amount)}
          </span>
        </div>
      ))}
    </div>
  );
}

function Withdrawals({ withdrawals }: { withdrawals: Withdrawal[] }) {
  if (withdrawals.length === 0) {
    return (
      <div className="card-surface p-10 text-center">
        <p className="text-sm text-muted-foreground">No withdrawal requests yet.</p>
      </div>
    );
  }

  return (
    <div className="card-surface space-y-3 p-5">
      {withdrawals.map((withdrawal) => (
        <div key={withdrawal.id} className="rounded-lg border border-border p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm font-semibold">{inr(withdrawal.amount)}</span>
            <WithdrawalStatusBadge status={withdrawal.status} />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Requested {format(new Date(withdrawal.requestedAt), "dd MMM yyyy, hh:mm a")}
            {withdrawal.decidedAt
              ? ` · decided ${format(new Date(withdrawal.decidedAt), "dd MMM yyyy")}`
              : ""}
          </p>
          {withdrawal.note && <p className="mt-1 text-xs text-muted-foreground">{withdrawal.note}</p>}
          {withdrawal.decisionNote && (
            <p className="mt-1 text-xs text-muted-foreground">{withdrawal.decisionNote}</p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            {snapshotLabel(withdrawal.destination)}
          </p>
        </div>
      ))}
    </div>
  );
}

function snapshotLabel(destination: WithdrawalDestination): string {
  if (destination.upiId) return destination.upiId;
  return [destination.accountNumber, destination.ifsc].filter(Boolean).join(" · ");
}

function WalletSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card-surface p-5">
            <div className="h-4 w-24 animate-pulse rounded bg-secondary" />
            <div className="mt-3 h-7 w-28 animate-pulse rounded bg-secondary" />
          </div>
        ))}
      </div>
      <div className="card-surface p-5">
        <div className="h-4 w-40 animate-pulse rounded bg-secondary" />
        <div className="mt-3 h-4 w-56 animate-pulse rounded bg-secondary" />
      </div>
      <div className="card-surface p-5">
        <div className="h-4 w-32 animate-pulse rounded bg-secondary" />
        <div className="mt-4 h-16 animate-pulse rounded bg-secondary" />
      </div>
    </div>
  );
}
