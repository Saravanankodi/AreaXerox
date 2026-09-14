import { createFileRoute, Link, useNavigate } from "@/lib/navigation";
import { ShieldCheck, Users, Clock, CheckCircle2, XCircle } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const navigate = useNavigate();
  const { session, getAllAccounts } = useAuth();
  const { shopkeeperApplications } = useStore();

  if (!session || session.role !== "admin") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-5">
        <div className="max-w-md text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-light">
            <ShieldCheck className="h-8 w-8 text-primary" />
          </div>
          <h1 className="mt-6 text-2xl font-bold">Admin access required</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Sign in with an admin account to access this page.
          </p>
          <Link
            to="/admin/login"
            className="mt-6 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Admin sign in
          </Link>
        </div>
      </main>
    );
  }

  const accounts = getAllAccounts();
  const pending = shopkeeperApplications.filter((a) => a.accountStatus === "pending");
  const approved = shopkeeperApplications.filter((a) => a.accountStatus === "active");
  const rejected = shopkeeperApplications.filter((a) => a.accountStatus === "rejected");

  return (
    <main className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="container-page flex items-center justify-between py-5">
          <div>
            <h1 className="text-xl font-bold">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">XEROXMATE administration</p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/" className="text-sm font-medium text-primary hover:underline">
              Customer app
            </Link>
            <Link to="/admin" className="text-sm font-medium text-primary hover:underline">
              Applications
            </Link>
          </div>
        </div>
      </div>

      <div className="container-page py-8">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="card-surface p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Pending</p>
              <Clock className="h-4 w-4 text-warning" />
            </div>
            <p className="mt-3 text-2xl font-bold">{pending.length}</p>
          </div>
          <div className="card-surface p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Approved</p>
              <CheckCircle2 className="h-4 w-4 text-success" />
            </div>
            <p className="mt-3 text-2xl font-bold">{approved.length}</p>
          </div>
          <div className="card-surface p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Rejected</p>
              <XCircle className="h-4 w-4 text-destructive" />
            </div>
            <p className="mt-3 text-2xl font-bold">{rejected.length}</p>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-bold">Shopkeeper Applications</h2>
          <div className="mt-4 space-y-3">
            {shopkeeperApplications.length === 0 && (
              <div className="card-surface p-8 text-center">
                <p className="text-sm text-muted-foreground">No applications yet.</p>
              </div>
            )}
            {shopkeeperApplications.map((app) => (
              <Link
                key={app.id}
                to="/admin/applications/$applicationId"
                params={{ applicationId: app.id }}
                className="card-surface flex items-center justify-between p-5 transition-colors hover:bg-secondary/50"
              >
                <div>
                  <p className="font-semibold">{app.shopName}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {app.shopkeeperProfile.ownerName} · {app.shopkeeperProfile.phone}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {app.shopAddress}, {app.city}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                      app.accountStatus === "pending"
                        ? "bg-warning-light text-warning"
                        : app.accountStatus === "active"
                          ? "bg-success-light text-success"
                          : "bg-destructive/10 text-destructive"
                    }`}
                  >
                    {app.accountStatus.charAt(0).toUpperCase() + app.accountStatus.slice(1)}
                  </span>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(app.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-bold">All Accounts ({accounts.length})</h2>
          <div className="mt-4 space-y-2">
            {accounts.map((acc) => (
              <div key={acc.id} className="card-surface flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium">{acc.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {acc.role} · {acc.registrationStatus} · {acc.accountStatus}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(acc.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
