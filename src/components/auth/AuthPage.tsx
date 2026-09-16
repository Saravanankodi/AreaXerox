"use client";

import { Link, useNavigate } from "@/lib/navigation";
import { Printer } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useAuth } from "@/lib/auth";

import { useStore } from "@/lib/store";

import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { AccountRole } from "@/types";

export function AuthPage({
  role,
  mode,
}: {
  role: AccountRole;
  mode: "login" | "signup";
}) {
  const navigate = useNavigate();

  const {
    signIn,
    createAccount,
    getAccount,
  } = useAuth();

  const { orderDraft } = useStore();

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

  const submit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (loading) return;

    setLoading(true);

    try {
      const normalizedEmail = email
        .trim()
        .toLowerCase();

      const normalizedName = name.trim();
      const normalizedPhone = phone.trim();

      /*
       * ==========================================
       * BASIC VALIDATION
       * ==========================================
       */

      if (
        !normalizedEmail ||
        !normalizedEmail.includes("@")
      ) {
        toast.error(
          "Please enter a valid email address.",
        );
        return;
      }

      if (password.length < 8) {
        toast.error(
          "Password must be at least 8 characters.",
        );
        return;
      }

      /*
       * ==========================================
       * SIGN UP
       * ==========================================
       */

      if (isCreate) {
        if (!normalizedName) {
          toast.error(
            "Add your full name to continue.",
          );
          return;
        }

        if (!normalizedPhone) {
          toast.error(
            "Add your mobile number to continue.",
          );
          return;
        }

        if (password !== confirmPassword) {
          toast.error("Passwords do not match.");
          return;
        }

        const result = await createAccount(
          normalizedEmail,
          password,
          role,
          normalizedName,
          normalizedPhone,
        );

        /*
         * createAccount() returns an error message
         * when Firebase account creation fails.
         */
        if (typeof result === "string") {
          toast.error(result);
          return;
        }

        toast.success("Account created", {
          description: isShop
            ? "Complete your shop registration to continue."
            : "Complete your profile to continue.",
        });

        if (isShop) {
          navigate({
            to: "/auth/shop/register",
          });
        } else {
          navigate({
            to: "/auth/customer/register",
          });
        }

        return;
      }

      /*
       * ==========================================
       * LOGIN
       * ==========================================
       */

      let credential;

      try {
        credential =
          await signInWithEmailAndPassword(
            auth,
            normalizedEmail,
            password,
          );
      } catch (error: unknown) {
        console.error(
          "Firebase login error:",
          error,
        );

        if (
          typeof error === "object" &&
          error !== null &&
          "code" in error
        ) {
          const code = String(
            (error as { code?: unknown }).code,
          );

          switch (code) {
            case "auth/invalid-credential":
            case "auth/wrong-password":
            case "auth/user-not-found":
              toast.error(
                "Invalid email or password.",
              );
              return;

            case "auth/invalid-email":
              toast.error(
                "Please enter a valid email address.",
              );
              return;

            case "auth/user-disabled":
              toast.error(
                "This account has been disabled.",
              );
              return;

            case "auth/too-many-requests":
              toast.error(
                "Too many login attempts. Please try again later.",
              );
              return;

            case "auth/network-request-failed":
              toast.error(
                "Network error. Please check your connection.",
              );
              return;

            default:
              toast.error(
                "Unable to sign in. Please try again.",
              );
              return;
          }
        }

        toast.error(
          "Unable to sign in. Please try again.",
        );

        return;
      }

      /*
       * ==========================================
       * GET FIRESTORE ACCOUNT
       * ==========================================
       */

      const account = await getAccount(
        credential.user.uid,
      );

      if (!account) {
        toast.error(
          "Your account profile could not be found.",
        );

        await auth.signOut();

        return;
      }

      /*
       * ==========================================
       * CHECK ROLE
       * ==========================================
       */

      if (account.role !== role) {
        toast.error(
          `This account is registered as a ${account.role}.`,
        );

        await auth.signOut();

        return;
      }

      /*
       * ==========================================
       * SHOPKEEPER ACCESS CONTROL
       * ==========================================
       */

      if (role === "shopkeeper") {
        /*
         * Registration is incomplete.
         */
        if (
          account.registrationStatus ===
          "incomplete"
        ) {
          signIn({
            accountId: account.id,
            role: account.role,
            email: account.email,
            name:
              account.name ||
              credential.user.displayName ||
              account.email.split("@")[0] ||
              "Shopkeeper",
            phone: account.phone ?? "",
            registrationStatus:
              account.registrationStatus,
            accountStatus:
              account.accountStatus,
          });

          toast.info(
            "Complete your shop registration to continue.",
          );

          navigate({
            to: "/auth/shop/register",
          });

          return;
        }

        /*
         * Waiting for admin approval.
         */
        if (
          account.accountStatus === "pending"
        ) {
          signIn({
            accountId: account.id,
            role: account.role,
            email: account.email,
            name:
              account.name ||
              credential.user.displayName ||
              account.email.split("@")[0] ||
              "Shopkeeper",
            phone: account.phone ?? "",
            registrationStatus:
              account.registrationStatus,
            accountStatus: "pending",
          });

          toast.info(
            "Your shop is waiting for admin approval.",
          );

          navigate({
            to: "/shop/pending",
          });

          return;
        }

        /*
         * Application rejected.
         */
        if (
          account.accountStatus === "rejected"
        ) {
          signIn({
            accountId: account.id,
            role: account.role,
            email: account.email,
            name:
              account.name ||
              credential.user.displayName ||
              account.email.split("@")[0] ||
              "Shopkeeper",
            phone: account.phone ?? "",
            registrationStatus:
              account.registrationStatus,
            accountStatus: "rejected",
          });

          toast.error(
            "Your shop application was rejected.",
          );

          navigate({
            to: "/shop/rejected",
          });

          return;
        }

        /*
         * Account suspended.
         */
        if (
          account.accountStatus === "suspended"
        ) {
          signIn({
            accountId: account.id,
            role: account.role,
            email: account.email,
            name:
              account.name ||
              credential.user.displayName ||
              account.email.split("@")[0] ||
              "Shopkeeper",
            phone: account.phone ?? "",
            registrationStatus:
              account.registrationStatus,
            accountStatus: "suspended",
          });

          toast.error(
            "Your shopkeeper account has been suspended.",
          );

          navigate({
            to: "/shop/suspended",
          });

          return;
        }

        /*
         * Account disabled.
         */
        if (
          account.accountStatus === "disabled"
        ) {
          signIn({
            accountId: account.id,
            role: account.role,
            email: account.email,
            name:
              account.name ||
              credential.user.displayName ||
              account.email.split("@")[0] ||
              "Shopkeeper",
            phone: account.phone ?? "",
            registrationStatus:
              account.registrationStatus,
            accountStatus: "disabled",
          });

          toast.error(
            "Your shopkeeper account has been disabled.",
          );

          navigate({
            to: "/shop/disabled",
          });

          return;
        }
      }

      /*
       * ==========================================
       * CUSTOMER ACCESS CONTROL
       * ==========================================
       */

      if (role === "customer") {
        /*
         * Customer registration/profile incomplete.
         */
        if (
          account.registrationStatus ===
          "incomplete"
        ) {
          signIn({
            accountId: account.id,
            role: account.role,
            email: account.email,
            name:
              account.name ||
              credential.user.displayName ||
              account.email.split("@")[0] ||
              "Customer",
            phone: account.phone ?? "",
            registrationStatus:
              account.registrationStatus,
            accountStatus:
              account.accountStatus,
          });

          toast.info(
            "Complete your profile to continue.",
          );

          navigate({
            to: "/auth/customer/register",
          });

          return;
        }

        /*
         * Customer account disabled.
         */
        if (
          account.accountStatus === "disabled"
        ) {
          toast.error(
            "Your account has been disabled.",
          );

          await auth.signOut();

          return;
        }

        /*
         * Customer account suspended.
         */
        if (
          account.accountStatus === "suspended"
        ) {
          toast.error(
            "Your account has been suspended.",
          );

          await auth.signOut();

          return;
        }
      }

      /*
       * ==========================================
       * NORMAL LOGIN
       * ==========================================
       */

      signIn({
        accountId: account.id,
        role: account.role,
        email: account.email,
        name:
          account.name ||
          credential.user.displayName ||
          account.email.split("@")[0] ||
          "User",
        phone: account.phone ?? "",
        registrationStatus:
          account.registrationStatus,
        accountStatus:
          account.accountStatus,
      });

      toast.success("Welcome back", {
        description: "Your session is ready.",
      });

      /*
       * Shopkeepers go to shop dashboard.
       *
       * Customers return to an existing order
       * when an order draft exists.
       */
      navigate({
        to: isShop
          ? "/shop"
          : orderDraft
            ? "/order"
            : "/",
      });
    } catch (error) {
      console.error(
        "Authentication error:",
        error,
      );

      toast.error(
        "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-2">
      {/* ========================================
          LEFT IMAGE PANEL
          ======================================== */}

      <section
        className="hidden bg-cover bg-center bg-no-repeat p-12 text-primary-foreground lg:flex lg:flex-col lg:justify-between"
        style={{
          backgroundImage:
            "url('/loginimage.png')",
        }}
      />

      {/* ========================================
          AUTH FORM
          ======================================== */}

      <section className="flex items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}

          <Link
            to="/"
            className="flex items-center gap-2 font-bold lg:hidden"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Printer className="h-5 w-5" />
            </span>

            XEROXMATE
          </Link>

          {/* Portal label */}

          <p className="mt-10 text-sm font-semibold text-primary">
            {isShop
              ? "SHOPKEEPER PORTAL"
              : "CUSTOMER ACCOUNT"}
          </p>

          {/* Heading */}

          <h1 className="mt-2 text-3xl font-bold">
            {isCreate
              ? "Create your account"
              : "Welcome back"}
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            {isCreate
              ? "A few details and you're ready to go."
              : "Sign in to continue where you left off."}
          </p>

          {/* Form */}

          <form
            className="mt-7 space-y-4"
            onSubmit={submit}
          >
            {/* Name */}

            {isCreate && (
              <Field
                label="Full name"
                value={name}
                onChange={setName}
                autoComplete="name"
              />
            )}

            {/* Email */}

            <Field
              label="Email address"
              value={email}
              onChange={setEmail}
              type="email"
              autoComplete="email"
            />

            {/* Phone */}

            {isCreate && (
              <Field
                label="Mobile number"
                value={phone}
                onChange={setPhone}
                type="tel"
                autoComplete="tel"
              />
            )}

            {/* Password */}

            <Field
              label="Password"
              value={password}
              onChange={setPassword}
              type="password"
              autoComplete={
                isCreate
                  ? "new-password"
                  : "current-password"
              }
              hint={
                isCreate
                  ? "Use at least 8 characters."
                  : undefined
              }
            />

            {/* Confirm password */}

            {isCreate && (
              <Field
                label="Confirm password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                type="password"
                autoComplete="new-password"
              />
            )}

            {/* Submit */}

            <Button
              type="submit"
              className="mt-2 w-full"
              size="lg"
              disabled={loading}
            >
              {loading
                ? "Please wait..."
                : isCreate
                  ? "Create account"
                  : "Sign in"}
            </Button>
          </form>

          {/* Login / signup switch */}

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isCreate
              ? "Already have an account?"
              : "New to Order The Xerox?"}{" "}

            <Link
              to={alternate}
              className="font-semibold text-primary hover:underline"
            >
              {isCreate
                ? "Sign in"
                : "Create an account"}
            </Link>
          </p>

          {/* Portal switch */}

          <p className="mt-8 border-t border-border pt-5 text-center text-sm text-muted-foreground">
            {isShop
              ? "Want to place an order?"
              : "Own a print shop?"}{" "}

            <Link
              to={
                isShop
                  ? "/auth/customer/login"
                  : "/auth/shop/login"
              }
              className="font-semibold text-primary hover:underline"
            >
              Use the{" "}
              {isShop
                ? "customer"
                : "shopkeeper"}{" "}
              portal
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}

/*
 * ==========================================
 * REUSABLE FORM FIELD
 * ==========================================
 */

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
  type?: string;
  autoComplete?: string;
  hint?: string;
}) {
  return (
    <div>
      <Label className="text-xs font-semibold text-subtle">
        {label}
      </Label>

      <Input
        required
        className="mt-2"
        type={type}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        autoComplete={autoComplete}
      />

      {hint && (
        <p className="mt-1 text-xs text-muted-foreground">
          {hint}
        </p>
      )}
    </div>
  );
}
