import { Link, useNavigate } from "@tanstack/react-router";
import { Printer, ShieldCheck, Store, UserRound } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type AccountRole, useAuth } from "@/lib/auth";
import { useStore } from "@/lib/store";

export function AuthPage({ role, mode }: { role: AccountRole; mode: "login" | "signup" }) {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const { updateProfile } = useStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [shopName, setShopName] = useState("");
  const isShop = role === "shopkeeper";
  const isCreate = mode === "signup";
  const destination = isShop ? "/shop" : "/";
  const alternate = isCreate
    ? isShop ? "/auth/shop/login" : "/auth/customer/login"
    : isShop ? "/auth/shop/create-account" : "/auth/customer/create-account";

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.includes("@") || password.length < 8) {
      toast.error("Enter a valid email and a password of at least 8 characters.");
      return;
    }
    if (isCreate && (!name.trim() || (isShop && !shopName.trim()))) {
      toast.error(isShop ? "Add your name and shop name to continue." : "Add your full name to continue.");
      return;
    }
    signIn({
      role,
      email: email.trim().toLowerCase(),
      name: name.trim() || (isShop ? "Shop owner" : email.split("@")[0]!),
      phone: phone.trim() || undefined,
      shopName: isShop ? shopName.trim() || undefined : undefined,
    });
    if (isCreate && !isShop) {
      updateProfile({ name: name.trim(), email: email.trim().toLowerCase(), phone: phone.trim() });
    }
    toast.success(isCreate ? "Account created" : "Welcome back", { description: "Your session is ready." });
    navigate({ to: destination });
  };

  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-2">
      <section className="hidden bg-cover bg-center bg-no-repeat p-12 text-primary-foreground lg:flex lg:flex-col lg:justify-between"
        style={{ backgroundImage: "url('/loginimage.png')" }} >
        {/* <Link to="/" className="flex items-center gap-2 font-bold"><span className="flex h-10 w-10 items-center justify-center rounded-md bg-white/15"><Printer className="h-5 w-5" /></span>Order My Xerox</Link>
        <div className="max-w-md"><span className="inline-flex items-center gap-2 text-sm font-semibold opacity-85">{isShop ? <Store className="h-4 w-4" /> : <UserRound className="h-4 w-4" />}{isShop ? "For print businesses" : "For customers"}</span><h1 className="mt-4 text-4xl font-bold tracking-tight">{isShop ? "Run every print job from one calm workspace." : "Send your print job before you leave home."}</h1><p className="mt-4 text-base opacity-85">{isShop ? "Receive, price, print and complete orders with a clear live queue." : "Upload documents, choose a shop, pay securely and track the job live."}</p></div>
        <p className="inline-flex items-center gap-2 text-sm opacity-80"><ShieldCheck className="h-4 w-4" /> Your account details stay private.</p> */}
      </section>
      <section className="flex items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <Link to="/" className="flex items-center gap-2 font-bold lg:hidden"><span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground"><Printer className="h-5 w-5" /></span>Order My Xerox</Link>
          <p className="mt-10 text-sm font-semibold text-primary">{isShop ? "SHOPKEEPER PORTAL" : "CUSTOMER ACCOUNT"}</p>
          <h1 className="mt-2 text-3xl font-bold">{isCreate ? "Create your account" : "Welcome back"}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{isCreate ? "A few details and you’re ready to go." : "Sign in to continue where you left off."}</p>
          <form className="mt-7 space-y-4" onSubmit={submit}>
            {isCreate && <Field label={isShop ? "Owner name" : "Full name"} value={name} onChange={setName} autoComplete="name" />}
            {isCreate && isShop && <Field label="Shop name" value={shopName} onChange={setShopName} autoComplete="organization" />}
            <Field label="Email address" value={email} onChange={setEmail} type="email" autoComplete="email" />
            {isCreate && <Field label="Mobile number" value={phone} onChange={setPhone} type="tel" autoComplete="tel" />}
            <Field label="Password" value={password} onChange={setPassword} type="password" autoComplete={isCreate ? "new-password" : "current-password"} hint={isCreate ? "Use at least 8 characters." : undefined} />
            <Button type="submit" className="mt-2 w-full" size="lg">{isCreate ? "Create account" : "Sign in"}</Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">{isCreate ? "Already have an account?" : "New to Order My Xerox?"} <Link to={alternate} className="font-semibold text-primary hover:underline">{isCreate ? "Sign in" : "Create an account"}</Link></p>
          <p className="mt-8 border-t border-border pt-5 text-center text-sm text-muted-foreground">{isShop ? "Want to place an order?" : "Own a print shop?"} <Link to={isShop ? "/auth/customer/login" : "/auth/shop/login"} className="font-semibold text-primary hover:underline">Use the {isShop ? "customer" : "shopkeeper"} portal</Link></p>
        </div>
      </section>
    </main>
  );
}

function Field({ label, value, onChange, type = "text", autoComplete, hint }: { label: string; value: string; onChange: (value: string) => void; type?: string | undefined; autoComplete?: string | undefined; hint?: string | undefined }) {
  return <div><Label className="text-xs font-semibold text-subtle">{label}</Label><Input required className="mt-2" type={type} value={value} onChange={(event) => onChange(event.target.value)} autoComplete={autoComplete} />{hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}</div>;
}
