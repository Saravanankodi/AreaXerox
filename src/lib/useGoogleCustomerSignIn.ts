"use client";

import { useCallback, useState } from "react";

import { toast } from "sonner";

import {
  beginGoogleSignIn,
  describeGoogleAuthError,
  isGoogleAuthCancelled,
} from "@/lib/auth-google";

/**
 * Google sign-in for the customer portal entry points (home page and order
 * page).
 *
 * Google's account chooser opens in a popup, so the page stays mounted and
 * `AuthProvider` writes the `users/{uid}` profile and establishes the session
 * from its own auth listener — which is also what admits the customer through
 * the route guards. The caller's own UI reacts to the resulting session.
 */
export function useGoogleCustomerSignIn() {
  const [loading, setLoading] =
    useState(false);

  const signInAsCustomer =
    useCallback(async (): Promise<boolean> => {
      if (loading) return false;

      setLoading(true);

      try {
        const credential =
          await beginGoogleSignIn("customer");

        return credential !== null;
      } catch (error) {
        if (!isGoogleAuthCancelled(error)) {
          console.error(
            "Google sign-in failed:",
            error,
          );

          toast.error(
            describeGoogleAuthError(error),
          );
        }

        return false;
      } finally {
        setLoading(false);
      }
    }, [loading]);

  return {
    loading,
    signInAsCustomer,
  };
}
