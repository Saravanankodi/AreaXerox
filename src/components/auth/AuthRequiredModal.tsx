"use client";

import { CUSTOMER_LOGIN_PATH, useAuth } from "@/lib/auth";
import { useNavigate } from "@/lib/navigation";
import { withNext } from "@/lib/return-path";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LogIn, UserPlus } from "lucide-react";
import { useState } from "react";
import type { AccountRole } from "@/types";

export const CUSTOMER_REGISTER_PATH =
  "/auth/customer/register";

const ROLE_HOME: Record<AccountRole, string> = {
  customer: "/",
  shopkeeper: "/shop",
  admin: "/",
};

const ROLE_LABEL: Record<AccountRole, string> = {
  customer: "customer",
  shopkeeper: "shopkeeper",
  admin: "admin",
};

interface AuthRequiredModalProps {
  /** Always true while the visitor is blocked; the gate owns it, not a trigger. */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Current route, carried to the auth pages as `?next=`. */
  pathname: string;
  /** Role of the live session, when one exists. */
  signedInRole?: AccountRole | null;
  /** Runs when the visitor dismisses the gate instead of signing in. */
  onContinueBrowsing?: () => void;
}

/**
 * The access gate shown on customer-only routes. It never redirects on its own:
 * it offers the two doors (login / register) and both carry `?next=` so the
 * visitor lands back on the route that turned them away.
 */
export function AuthRequiredModal({
  open,
  onOpenChange,
  pathname,
  signedInRole = null,
  onContinueBrowsing,
}: AuthRequiredModalProps) {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [switching, setSwitching] = useState(false);

  const otherRole =
    signedInRole && signedInRole !== "customer"
      ? signedInRole
      : null;

  const handleLogin = () => {
    navigate({
      to: withNext(CUSTOMER_LOGIN_PATH, pathname),
    });
  };

  const handleRegister = () => {
    navigate({
      to: withNext(CUSTOMER_REGISTER_PATH, pathname),
    });
  };

  /*
   * A shopkeeper or admin cannot be promoted into a customer here, so the only
   * way through is to drop the current session and sign in as a customer. The
   * sign-out has to land before navigating, or the login page would bounce them
   * straight back to their own dashboard.
   */
  const handleSwitchAccount = async () => {
    if (switching) return;

    setSwitching(true);

    await signOut();

    navigate({
      to: withNext(CUSTOMER_LOGIN_PATH, pathname),
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {otherRole
              ? "Customer account required"
              : "Login to continue"}
          </DialogTitle>

          <DialogDescription>
            {otherRole
              ? `You are signed in as a ${ROLE_LABEL[otherRole]}. Orders, addresses and payment history live on a customer account.`
              : "Please login or create an account to continue with your order."}
          </DialogDescription>
        </DialogHeader>

        {otherRole ? (
          <div className="mt-2 flex flex-col gap-3">
            <Button
              size="lg"
              onClick={() => {
                navigate({
                  to: ROLE_HOME[otherRole],
                });
              }}
            >
              {otherRole === "admin"
                ? "Back to dashboard"
                : "Go to my shop"}
            </Button>

            <Button
              variant="outline"
              size="lg"
              disabled={switching}
              onClick={() => void handleSwitchAccount()}
            >
              Use a customer account
            </Button>
          </div>
        ) : (
          <div className="mt-2 flex flex-col gap-3">
            <Button
              size="lg"
              onClick={handleLogin}
            >
              <LogIn />
              Login
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={handleRegister}
            >
              <UserPlus />
              Register
            </Button>
          </div>
        )}

        <DialogFooter className="mt-2">
          <Button
            variant="ghost"
            className="w-full"
            onClick={onContinueBrowsing}
          >
            Continue browsing
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}