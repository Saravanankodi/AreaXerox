import { Link, useNavigate } from "@/lib/navigation";
import { Printer } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type AccountRole, useAuth } from "@/lib/auth";
import { useStore } from "@/lib/store";
import { signInWithGoogle } from "@/lib/auth-google";

export function AuthPage({ role, mode }: { role: AccountRole; mode: "login" | "signup" }) {
  const navigate = useNavigate();
  const { signIn, createAccount, getAllAccounts, updateAccount } = useAuth();
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
      if (!isShop && !name.trim()) {
        toast.error("Add your full name to continue.");
        setLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        toast.error("Passwords do not match.");
        setLoading(false);
        return;
      }

      const displayName = isShop ? email.split("@")[0] ?? "user" : name.trim();
      const result = createAccount(email, password, role, displayName);
      if (typeof result === "string") {
        toast.error(result);
        setLoading(false);
        return;
      }

      signIn({
        accountId: result.id,
        role,
        email: result.email,
        name: displayName,
        registrationStatus: result.registrationStatus,
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
          ? "Set up your shop from the dashboard."
          : "You're all set — start ordering!",
      });

      if (isShop) {
        navigate({ to: "/shop" });
      } else {
        navigate({ to: "/" });
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
      // All shopkeepers go to the dashboard; the dashboard handles onboarding state.
      signIn({
        accountId: account.id,
        role,
        email: account.email,
        name: account.email.split("@")[0] ?? "user",
        registrationStatus: account.registrationStatus,
        accountStatus: account.accountStatus,
      });
      toast.success("Welcome back", { description: "Your session is ready." });
      navigate({ to: "/shop" });
      setLoading(false);
      return;
    }

    if (role === "customer") {
      if (account.registrationStatus === "incomplete") {
        updateAccount(account.id, { registrationStatus: "complete" });
        signIn({
          accountId: account.id,
          role,
          email: account.email,
          name: account.email.split("@")[0] ?? "user",
          registrationStatus: "complete",
          accountStatus: account.accountStatus,
        });
        toast.success("Welcome back", { description: "Your session is ready." });
        navigate({ to: orderDraft ? "/order" : "/" });
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
            {!isShop && isCreate && (
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
          <div className="relative mt-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">or</span>
            </div>
          </div>
          <Button
            variant="outline"
            className="mt-4 w-full"
            size="lg"
            disabled={loading}
            onClick={async () => {
              setLoading(true);
              const result = await signInWithGoogle(role === "admin" ? "customer" : role);
              if (!result.ok || !result.user) {
                toast.error(result.error ?? "Google sign-in failed.");
                setLoading(false);
                return;
              }
              const { user } = result;
              const accounts = getAllAccounts();
              let account = accounts.find(
                (a) => a.email.toLowerCase() === user.email.toLowerCase() && a.role === role,
              );
              if (!account) {
                const created = createAccount(user.email, `google-${user.sub}`, role, user.name);
                if (typeof created === "string") {
                  toast.error(created);
                  setLoading(false);
                  return;
                }
                account = created;
              }
              signIn({
                accountId: account.id,
                role,
                email: account.email,
                name: user.name,
                registrationStatus: account.registrationStatus,
                accountStatus: account.accountStatus,
              });
              if (role === "customer" && account.registrationStatus === "incomplete") {
                updateAccount(account.id, { registrationStatus: "complete" });
                signIn({
                  accountId: account.id,
                  role,
                  email: account.email,
                  name: user.name,
                  registrationStatus: "complete",
                  accountStatus: account.accountStatus,
                });
              }
              if (!isShop) {
                updateProfile({ name: user.name, email: user.email, phone: "" });
              }
              toast.success("Signed in with Google");
              if (isShop) {
                navigate({ to: "/shop" });
              } else {
                navigate({ to: orderDraft ? "/order" : "/" });
              }
              setLoading(false);
            }}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </Button>
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
