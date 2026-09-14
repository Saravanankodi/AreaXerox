import { createFileRoute, Link, useNavigate } from "@/lib/navigation";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { ShieldCheck, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/admin/login")({
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const { signIn, getAllAccounts, createAccount } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    if (!email.includes("@") || password.length < 8) {
      toast.error("Enter a valid email and password.");
      setLoading(false);
      return;
    }

    // Auto-create admin account if it doesn't exist (demo convenience)
    let accounts = getAllAccounts();
    let adminAccount = accounts.find(
      (a) => a.email.toLowerCase() === email.toLowerCase() && a.role === "admin",
    );

    if (!adminAccount) {
      const result = createAccount(email, password, "admin", "Admin");
      if (typeof result === "string") {
        // Account exists with different role
        toast.error("This email is registered as a non-admin account.");
        setLoading(false);
        return;
      }
      adminAccount = result;
    }

    // Verify password
    const hashFn = (pw: string) => {
      let hash = 0;
      for (let i = 0; i < pw.length; i++) {
        const char = pw.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0;
      }
      return `h_${Math.abs(hash).toString(36)}_${pw.length}`;
    };

    if (adminAccount.passwordHash !== hashFn(password)) {
      toast.error("Incorrect password.");
      setLoading(false);
      return;
    }

    signIn({
      accountId: adminAccount.id,
      role: "admin",
      email: adminAccount.email,
      name: "Admin",
      registrationStatus: "complete",
      accountStatus: "active",
    });
    toast.success("Welcome, admin");
    navigate({ to: "/admin" });
    setLoading(false);
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
        <p className="mt-6 text-center text-xs text-muted-foreground">
          First time? Enter any email and password (min 8 chars) — an admin account will be created
          automatically.
        </p>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          <Link to="/" className="font-semibold text-primary hover:underline">
            Back to home
          </Link>
        </p>
      </div>
    </main>
  );
}
