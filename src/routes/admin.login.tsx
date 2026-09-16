import { createFileRoute, Link, useNavigate } from "@/lib/navigation";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { signInUser, getAccountByUid, registerNewAccount } from "@/services/auth.service";

export const Route = createFileRoute("/admin/login")({
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
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
      // Try to sign in with Firebase Auth
      const user = await signInUser(email, password);
      const accountData = await getAccountByUid(user.uid);

      if (!accountData || accountData.role !== "admin") {
        // No admin account exists yet — register one
        const result = await registerNewAccount(email, password, "admin", "Admin", "");
        if (typeof result === "string") {
          toast.error(result);
          setLoading(false);
          return;
        }

        // Fetch the newly created account
        const newAccount = await getAccountByUid(result.user.uid);
        if (!newAccount) {
          toast.error("Failed to create admin account.");
          setLoading(false);
          return;
        }

        signIn({
          accountId: newAccount.id,
          role: "admin",
          email: newAccount.email,
          name: newAccount.name || "Admin",
          phone: newAccount.phone || "",
          registrationStatus: "complete",
          accountStatus: "active",
        });
      } else {
        signIn({
          accountId: accountData.id,
          role: accountData.role,
          email: accountData.email,
          name: accountData.name || "Admin",
          phone: accountData.phone || "",
          registrationStatus: accountData.registrationStatus,
          accountStatus: accountData.accountStatus,
        });
      }

      toast.success("Welcome, admin");
      navigate({ to: "/admin" });
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Admin login failed.");
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
