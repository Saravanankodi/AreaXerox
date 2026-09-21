import { createFileRoute, Link, useNavigate } from "@/lib/navigation";
import { AlertTriangle } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useEffect } from "react";

export const Route = createFileRoute("/shop/suspended")({
  component: ShopSuspendedPage,
});

function ShopSuspendedPage() {
  const navigate = useNavigate();
  const { session, signOut, ready } = useAuth();

  useEffect(() => {
    if (!ready) return;
    if (!session || session.role !== "shopkeeper") {
      navigate({ to: "/auth/shop/login" });
      return;
    }
    if (session.accountStatus === "active") {
      navigate({ to: "/shop" });
    }
  }, [session, navigate, ready]);

  if (!ready || !session || session.role !== "shopkeeper" || session.accountStatus === "active") {
    return null;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5">
      <div className="max-w-md text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-warning-light">
          <AlertTriangle className="h-8 w-8 text-warning" />
        </div>
        <h1 className="mt-6 text-2xl font-bold">Account suspended</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Your shopkeeper account has been suspended. Please contact support for assistance.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/support"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Contact support
          </Link>
          <button
            onClick={() => {
              signOut();
              navigate({ to: "/" });
            }}
            className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-secondary"
          >
            Sign out
          </button>
        </div>
      </div>
    </main>
  );
}
