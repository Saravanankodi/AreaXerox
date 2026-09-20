import { createFileRoute, useNavigate } from "@/lib/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/auth/customer/register")({
  component: CustomerRegisterRedirect,
});

function CustomerRegisterRedirect() {
  const navigate = useNavigate();
  const { session, signIn, updateAccount } = useAuth();

  useEffect(() => {
    if (!session || session.role !== "customer") {
      navigate({ to: "/auth/customer/login", replace: true });
      return;
    }

    if (session.registrationStatus === "complete") {
      navigate({ to: "/", replace: true });
      return;
    }

    updateAccount(session.accountId, { registrationStatus: "complete" });
    signIn({
      ...session,
      registrationStatus: "complete",
    });
    navigate({ to: "/", replace: true });
  }, [session, signIn, updateAccount, navigate]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background">
      <p className="text-sm text-muted-foreground">Setting up your account…</p>
    </main>
  );
}
