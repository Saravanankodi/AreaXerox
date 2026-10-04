import { createFileRoute, useNavigate } from "@/lib/navigation";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import {
  sanitizeReturnPath,
  withNext,
} from "@/lib/return-path";

const CUSTOMER_CREATE_ACCOUNT_PATH =
  "/auth/customer/create-account";

export const Route = createFileRoute("/auth/customer/register")({
  component: CustomerRegisterRoute,
});

function SettingUpAccount() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background">
      <p className="text-sm text-muted-foreground">
        Setting up your account…
      </p>
    </main>
  );
}

/**
 * Reads `?next=` through useSearchParams, which bails the route out of
 * prerendering. Next.js requires a Suspense boundary above it or the production
 * build fails, so the route mounts it through here.
 */
function CustomerRegisterRoute() {
  return (
    <Suspense fallback={<SettingUpAccount />}>
      <CustomerRegisterRedirect />
    </Suspense>
  );
}

function CustomerRegisterRedirect() {
  const navigate = useNavigate();
  const { session, ready, signIn, updateAccount } =
    useAuth();

  /*
   * Set by the order access gate when a visitor chooses to register instead of
   * logging in, so they resume the route that asked for the account.
   */
  const returnPath = sanitizeReturnPath(
    useSearchParams().get("next"),
  );

  useEffect(() => {
    /*
     * The session is null until Firebase finishes restoring it, so acting on
     * that alone would bounce a signed-in visitor straight back out.
     */
    if (!ready) {
      return;
    }

    if (!session || session.role !== "customer") {
      navigate({
        to: withNext(
          CUSTOMER_CREATE_ACCOUNT_PATH,
          returnPath,
        ),
        replace: true,
      });

      return;
    }

    if (session.registrationStatus !== "complete") {
      void updateAccount(session.accountId, {
        registrationStatus: "complete",
      });

      signIn({
        ...session,
        registrationStatus: "complete",
      });
    }

    navigate({
      to: returnPath ?? "/",
      replace: true,
    });
  }, [
    ready,
    session,
    signIn,
    updateAccount,
    navigate,
    returnPath,
  ]);

  return <SettingUpAccount />;
}