import { createFileRoute, Link, useNavigate } from "@/lib/navigation";
import { XCircle } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useStore } from "@/lib/store";
import { useEffect } from "react";

export const Route = createFileRoute("/shop/rejected")({
  component: ShopRejectedPage,
});

function ShopRejectedPage() {
  const navigate = useNavigate();
  const { session, signOut } = useAuth();
  const { getShopkeeperApplication } = useStore();

  useEffect(() => {
    if (!session || session.role !== "shopkeeper") {
      navigate({ to: "/auth/shop/login" });
      return;
    }
    if (session.accountStatus === "active") {
      navigate({ to: "/shop" });
      return;
    }
    if (session.accountStatus === "pending") {
      navigate({ to: "/shop/pending" });
    }
  }, [session, navigate]);

  if (!session || session.role !== "shopkeeper" || session.accountStatus === "active" || session.accountStatus === "pending") {
    return null;
  }

  const application = getShopkeeperApplication(session.accountId);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5">
      <div className="max-w-md text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <XCircle className="h-8 w-8 text-destructive" />
        </div>
        <h1 className="mt-6 text-2xl font-bold">Application not approved</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Your shopkeeper application was not approved.
        </p>
        {application?.rejectionReason && (
          <div className="mt-5 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-left">
            <p className="text-xs font-semibold uppercase text-destructive">Reason</p>
            <p className="mt-1 text-sm">{application.rejectionReason}</p>
          </div>
        )}
        <p className="mt-4 text-sm text-muted-foreground">
          You can update your registration and resubmit.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/auth/shop/register"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Update registration
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
