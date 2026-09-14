import { createFileRoute, Link, useNavigate } from "@/lib/navigation";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Printer, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/auth/customer/register")({
  component: CustomerRegisterPage,
});

function CustomerRegisterPage() {
  const navigate = useNavigate();
  const { session, signIn, updateAccount } = useAuth();
  const { updateProfile } = useStore();
  const [fullName, setFullName] = useState(session?.name ?? "");
  const [phone, setPhone] = useState(session?.phone ?? "");
  const [alternatePhone, setAlternatePhone] = useState("");
  const [loading, setLoading] = useState(false);

  if (!session || session.role !== "customer" || session.registrationStatus === "complete") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-5">
        <div className="card-surface max-w-md p-7 text-center">
          <h1 className="text-xl font-bold">Access required</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in with a customer account to complete registration.
          </p>
          <Link
            to="/auth/customer/login"
            className="mt-5 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Sign in
          </Link>
        </div>
      </main>
    );
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    if (!fullName.trim()) {
      toast.error("Enter your full name.");
      setLoading(false);
      return;
    }
    if (!phone.trim()) {
      toast.error("Enter your phone number.");
      setLoading(false);
      return;
    }

    updateAccount(session.accountId, { registrationStatus: "complete" });
    updateProfile({
      name: fullName.trim(),
      email: session.email,
      phone: phone.trim(),
      ...(alternatePhone.trim() ? { alternatephone: alternatePhone.trim() } : {}),
    });
    signIn({
      ...session,
      name: fullName.trim(),
      phone: phone.trim(),
      registrationStatus: "complete",
    });
    toast.success("Profile completed", {
      description: "You can now place print orders.",
    });
    navigate({ to: "/" });
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
          <div className="mt-10 flex items-center gap-2 text-sm font-semibold text-primary">
            <CheckCircle2 className="h-4 w-4" /> PROFILE SETUP
          </div>
          <h1 className="mt-2 text-3xl font-bold">Complete your profile</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Just a couple more details and you can start placing orders.
          </p>
          <form className="mt-7 space-y-4" onSubmit={submit}>
            <div>
              <Label className="text-xs font-semibold text-subtle">Full name *</Label>
              <Input
                required
                className="mt-2"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoComplete="name"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-subtle">Phone number *</Label>
              <Input
                required
                className="mt-2"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-subtle">
                Alternate phone (optional)
              </Label>
              <Input
                className="mt-2"
                type="tel"
                value={alternatePhone}
                onChange={(e) => setAlternatePhone(e.target.value)}
              />
            </div>
            <Button type="submit" className="mt-2 w-full" size="lg" disabled={loading}>
              {loading ? "Saving..." : "Complete registration"}
            </Button>
          </form>
          <p className="mt-8 border-t border-border pt-5 text-center text-sm text-muted-foreground">
            <Link to="/" className="font-semibold text-primary hover:underline">
              Skip for now
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
