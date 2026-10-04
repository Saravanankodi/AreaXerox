"use client";

import { Loader2 } from "lucide-react";
import { useCallback, useState, type ReactNode } from "react";

import { AuthRequiredModal } from "@/components/auth/AuthRequiredModal";
import { useAuth } from "@/lib/auth";
import {
  useNavigate,
  useRouterState,
} from "@/lib/navigation";

/**
 * Modal-based access gate for the customer order routes.
 *
 * `useRequireCustomer()` answers the same question by redirecting. That is the
 * right behaviour for a route you cannot do anything without, but an order
 * route is something a visitor browses first and signs into second — sending
 * them to a full-page login form loses the page they were on. This guard keeps
 * them in place, asks, and carries the route across the auth detour as `?next=`.
 *
 * Nothing behind the gate is mounted unless the session says customer, so the
 * protected content is never rendered (nor its store subscriptions started) for
 * a signed-out visitor or a signed-in shopkeeper/admin.
 */
export function OrderAuthGuard({
  children,
}: {
  children: ReactNode;
}) {
  const { session, ready } = useAuth();
  const navigate = useNavigate();

  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  /*
   * Dismissal is recorded against the route it was made on, so navigating to
   * another gated route asks again without an effect to reset the state.
   */
  const [dismissedOn, setDismissedOn] =
    useState<string | null>(null);

  const dismiss = useCallback(() => {
    setDismissedOn(pathname);

    navigate({ to: "/" });
  }, [navigate, pathname]);

  const isCustomer = session?.role === "customer";

  /*
   * Firebase is still restoring the persisted session. Deciding now would flash
   * the gate at a signed-in customer on every hard refresh, so hold the page
   * still until `ready` flips.
   */
  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
        <span className="sr-only">Checking your session…</span>
      </main>
    );
  }

  if (isCustomer) {
    return <>{children}</>;
  }

  return (
    <AuthRequiredModal
      open={dismissedOn !== pathname}
      onOpenChange={(open) => {
        if (!open) dismiss();
      }}
      pathname={pathname}
      signedInRole={session?.role ?? null}
      onContinueBrowsing={dismiss}
    />
  );
}