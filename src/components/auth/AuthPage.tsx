import { Link, useNavigate } from "@/lib/navigation";
import { Printer, ShieldCheck } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type AccountRole, useAuth } from "@/lib/auth";
import { useStore } from "@/lib/store";

export function AuthPage({ role, mode }: { role: AccountRole; mode: "login" | "signup" }) {
  const navigate = useNavigate();
  const { signIn, createAccount, getAllAccounts } = useAuth();
  const { updateProfile, orderDraft } = useStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const isShop = role === "shopkeeper";
  const isCreate = mode === "signup";
  const alternate = isCreate
    ? isShop
      ? "/auth/shop/login"
      : "/auth/customer/login"
    : isShop
      ? "/auth/shop/create-account"
      : "/auth/customer/create-account";

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    if (!email.includes("@") || password.length < 8) {
      toast.error("Enter a valid email and a password of at least 8 characters.");
      setLoading(false);
      return;
    }

    if (isCreate) {
      if (!name.trim()) {
        toast.error("Add your full name to continue.");
        setLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        toast.error("Passwords do not match.");
        setLoading(false);
        return;
      }

      const result = createAccount(email, password, role, name.trim());
      if (typeof result === "string") {
        toast.error(result);
        setLoading(false);
        return;
      }

      signIn({
        accountId: result.id,
        role,
        email: result.email,
        name: name.trim(),
        registrationStatus: "incomplete",
        accountStatus: result.accountStatus,
        phone: phone.trim() || undefined,
      });

      if (!isShop) {
        updateProfile({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
        });
      }

      toast.success("Account created", {
        description: isShop
          ? "Complete your shop registration to continue."
          : "Complete your profile to continue.",
      });

      if (isShop) {
        navigate({ to: "/auth/shop/register" });
      } else {
        navigate({ to: "/auth/customer/register" });
      }
      setLoading(false);
      return;
    }

    // Login flow
    const accounts = getAllAccounts();
    const account = accounts.find(
      (a) => a.email.toLowerCase() === email.trim().toLowerCase() && a.role === role,
    );

    if (!account) {
      toast.error("No account found with this email.");
      setLoading(false);
      return;
    }

    // Simple password check (demo only)
    const hashFn = (pw: string) => {
      let hash = 0;
      for (let i = 0; i < pw.length; i++) {
        const char = pw.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0;
      }
      return `h_${Math.abs(hash).toString(36)}_${pw.length}`;
    };

    if (account.passwordHash !== hashFn(password)) {
      toast.error("Incorrect password.");
      setLoading(false);
      return;
    }

    // Check access rights
    if (role === "shopkeeper") {
      if (account.registrationStatus === "incomplete") {
        signIn({
          accountId: account.id,
          role,
          email: account.email,
          name: account.email.split("@")[0] ?? "user",
          registrationStatus: "incomplete",
          accountStatus: account.accountStatus,
        });
        toast.info("Complete your shop registration to continue.");
        navigate({ to: "/auth/shop/register" });
        setLoading(false);
        return;
      }
      if (account.accountStatus === "pending") {
        signIn({
          accountId: account.id,
          role,
          email: account.email,
          name: account.email.split("@")[0] ?? "user",
          registrationStatus: account.registrationStatus,
          accountStatus: "pending",
        });
        navigate({ to: "/shop/pending" });
        setLoading(false);
        return;
      }
      if (account.accountStatus === "rejected") {
        signIn({
          accountId: account.id,
          role,
          email: account.email,
          name: account.email.split("@")[0] ?? "user",
          registrationStatus: account.registrationStatus,
          accountStatus: "rejected",
        });
        navigate({ to: "/shop/rejected" });
        setLoading(false);
        return;
      }
      if (account.accountStatus === "suspended") {
        signIn({
          accountId: account.id,
          role,
          email: account.email,
          name: account.email.split("@")[0] ?? "user",
          registrationStatus: account.registrationStatus,
          accountStatus: "suspended",
        });
        navigate({ to: "/shop/suspended" });
        setLoading(false);
        return;
      }
      if (account.accountStatus === "disabled") {
        signIn({
          accountId: account.id,
          role,
          email: account.email,
          name: account.email.split("@")[0] ?? "user",
          registrationStatus: account.registrationStatus,
          accountStatus: "disabled",
        });
        navigate({ to: "/shop/disabled" });
        setLoading(false);
        return;
      }
    }

    if (role === "customer") {
      if (account.registrationStatus === "incomplete") {
        signIn({
          accountId: account.id,
          role,
          email: account.email,
          name: account.email.split("@")[0] ?? "user",
          registrationStatus: "incomplete",
          accountStatus: account.accountStatus,
        });
        toast.info("Complete your profile to continue.");
        navigate({ to: "/auth/customer/register" });
        setLoading(false);
        return;
      }
    }

    signIn({
      accountId: account.id,
      role,
      email: account.email,
      name: account.email.split("@")[0] ?? "user",
      registrationStatus: account.registrationStatus,
      accountStatus: account.accountStatus,
    });
    toast.success("Welcome back", { description: "Your session is ready." });
    navigate({ to: isShop ? "/shop" : orderDraft ? "/order" : "/" });
    setLoading(false);
  };

  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-2">
      <section
        className="hidden bg-cover bg-center bg-no-repeat p-12 text-primary-foreground lg:flex lg:flex-col lg:justify-between"
        style={{ backgroundImage: "url('/loginimage.png')" }}
      />
      <section className="flex items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <Link to="/" className="flex items-center gap-2 font-bold lg:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Printer className="h-5 w-5" />
            </span>
            XEROXMATE
          </Link>
          <p className="mt-10 text-sm font-semibold text-primary">
            {isShop ? "SHOPKEEPER PORTAL" : "CUSTOMER ACCOUNT"}
          </p>
          <h1 className="mt-2 text-3xl font-bold">
            {isCreate ? "Create your account" : "Welcome back"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isCreate
              ? "A few details and you're ready to go."
              : "Sign in to continue where you left off."}
          </p>
          <form className="mt-7 space-y-4" onSubmit={submit}>
            {isCreate && (
              <Field label="Full name" value={name} onChange={setName} autoComplete="name" />
            )}
            <Field
              label="Email address"
              value={email}
              onChange={setEmail}
              type="email"
              autoComplete="email"
            />
            {isCreate && (
              <Field
                label="Mobile number"
                value={phone}
                onChange={setPhone}
                type="tel"
                autoComplete="tel"
              />
            )}
            <Field
              label="Password"
              value={password}
              onChange={setPassword}
              type="password"
              autoComplete={isCreate ? "new-password" : "current-password"}
              hint={isCreate ? "Use at least 8 characters." : undefined}
            />
            {isCreate && (
              <Field
                label="Confirm password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                type="password"
                autoComplete="new-password"
              />
            )}
            <Button type="submit" className="mt-2 w-full" size="lg" disabled={loading}>
              {loading ? "Please wait..." : isCreate ? "Create account" : "Sign in"}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isCreate ? "Already have an account?" : "New to Order The Xerox?"}{" "}
            <Link to={alternate} className="font-semibold text-primary hover:underline">
              {isCreate ? "Sign in" : "Create an account"}
            </Link>
          </p>
          <p className="mt-8 border-t border-border pt-5 text-center text-sm text-muted-foreground">
            {isShop ? "Want to place an order?" : "Own a print shop?"}{" "}
            <Link
              to={isShop ? "/auth/customer/login" : "/auth/shop/login"}
              className="font-semibold text-primary hover:underline"
            >
              Use the {isShop ? "customer" : "shopkeeper"} portal
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string | undefined;
  autoComplete?: string | undefined;
  hint?: string | undefined;
}) {
  return (
    <div>
      <Label className="text-xs font-semibold text-subtle">{label}</Label>
      <Input
        required
        className="mt-2"
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
      />
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
