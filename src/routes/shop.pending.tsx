import { createFileRoute, Link, useNavigate } from "@/lib/navigation";
import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { getShopByOwner } from "@/lib/firestore/shops";
import type { Shop } from "@/types";

export const Route = createFileRoute("/shop/pending")({
  component: ShopPendingPage,
});

function ShopPendingPage() {
  const navigate = useNavigate();
  const { session, signOut, ready } = useAuth();
  const [application, setApplication] = useState<Shop | undefined>();

  useEffect(() => {
    if (!ready) return;
    // Redirect all shopkeepers to the dashboard — the dashboard handles onboarding state.
    if (session && session.role === "shopkeeper") {
      navigate({ to: "/shop", replace: true });
    } else {
      navigate({ to: "/auth/shop/login", replace: true });
      return;
    }
    // Load shop/application from Firestore
    getShopByOwner(session.accountId)
      .then(setApplication)
      .catch(console.error);
  }, [session, navigate, ready]);

  if (!ready) return null;

  if (!session || session.role !== "shopkeeper" || session.accountStatus === "active" || session.accountStatus === "rejected") {
    return null;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5">
      <div className="max-w-md text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-warning-light">
          <Clock className="h-8 w-8 text-warning" />
        </div>
        <h1 className="mt-6 text-2xl font-bold">Application submitted</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Your shopkeeper application is waiting for admin approval.
        </p>
        {application && (
          <div className="mt-5 rounded-lg border border-border p-4 text-left">
            <p className="text-sm font-semibold">{application.shopName}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {application.shopAddress}, {application.city}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Submitted {application.createdAt ? new Date(application.createdAt).toLocaleDateString() : "—"}
            </p>
          </div>
        )}
        <p className="mt-4 text-sm text-muted-foreground">
          Once approved, you can access the Shopkeeper Portal.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => {
              signOut();
              navigate({ to: "/" });
            }}
            className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-secondary"
          >
            Sign out
          </button>
          <Link
            to="/"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
