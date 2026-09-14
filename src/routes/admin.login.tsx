import { createFileRoute, Link, useNavigate } from "@/lib/navigation";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { signInUser, getAccountByUid, registerNewAccount } from "@/services/auth.service";
import { fetchAllAccounts } from "@/services/admin.service";

export const Route = createFileRoute("/admin/login")({
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const { signIn, refreshSession } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    if (!email.includes("@") || password.length < 8) {
      toast.error("Enter a valid email and password (min 8 chars).");
      setLoading(false);
      return;
    }

    try {
      // First try signing in
      let user;
      try {
        user = await signInUser(email, password);
      } catch (signInErr: any) {
        // If user not found, check if this is the first admin setup
        if (
          signInErr.code === "auth/user-not-found" ||
          signInErr.code === "auth/invalid-credential"
        ) {
          const allAccounts = await fetchAllAccounts();
          const hasAdmin = allAccounts.some((a) => a.role === "admin");
          if (!hasAdmin) {
            // Bootstrap initial admin
            const regRes = await registerNewAccount(email, password, "admin", "Admin");
            if (typeof regRes !== "string") {
              user = regRes.user;
              toast.success("Initial admin account created!");
            } else {
              toast.error(regRes);
              setLoading(false);
              return;
            }
          } else {
            toast.error("Invalid email or password.");
            setLoading(false);
            return;
          }
        } else {
          throw signInErr;
        }
      }

      const account = await getAccountByUid(user.uid);
      if (!account || account.role !== "admin") {
        toast.error("Access denied. Admin privileges required.");
        setLoading(false);
        return;
      }

      signIn({
        accountId: account.id,
        role: "admin",
        email: account.email || user.email || email,
        name: account.name || "Admin",
        registrationStatus: "complete",
        accountStatus: "active",
      });

      await refreshSession();
      toast.success("Welcome, admin");
      navigate({ to: "/admin" });
    } catch (err: any) {
      console.error("Admin login error:", err);
      toast.error(err.message || "Sign in failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5">
      <div className="w-full max-w-sm">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-light">
            <ShieldCheck className="h-7 w-7 text-primary" />
          </div>
          <h1 className="mt-4 text-2xl font-bold">Admin Sign In</h1>
          <p className="mt-1 text-sm text-muted-foreground">XEROXMATE administration panel</p>
        </div>
        <form className="mt-7 space-y-4" onSubmit={submit}>
          <div>
            <Label className="text-xs font-semibold text-subtle">Email</Label>
            <Input
              required
              className="mt-2"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
          <div>
            <Label className="text-xs font-semibold text-subtle">Password</Label>
            <Input
              required
              className="mt-2"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            <p className="mt-1 text-xs text-muted-foreground">Use at least 8 characters.</p>
          </div>
          <Button type="submit" className="mt-2 w-full" size="lg" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          <Link to="/" className="font-semibold text-primary hover:underline">
            Back to home
          </Link>
        </p>
      </div>
    </main>
  );
}
