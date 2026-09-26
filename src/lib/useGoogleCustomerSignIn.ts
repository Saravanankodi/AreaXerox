"use client";

import { useCallback, useState } from "react";

import { toast } from "sonner";

import { auth } from "@/lib/firebase";

import {
  healAccountIdentity,
  useAuth,
} from "@/lib/auth";

import { signInWithGoogle } from "@/lib/auth-google";

/**
 * Google sign-in for the customer portal entry points (home page and
 * order page). Creates the account document on first use so a new Google
 * identity is a valid sign-up, then signs the session in.
 */
export function useGoogleCustomerSignIn() {
  const {
    signIn,
    getAccount,
    getAccountByEmail,
    createAccountForAuthUser,
    updateAccount,
  } = useAuth();

  const [loading, setLoading] =
    useState(false);

  const signInAsCustomer =
    useCallback(async (): Promise<boolean> => {
      if (loading) return false;

      setLoading(true);

      try {
        const result =
          await signInWithGoogle();

        if (
          !result.ok ||
          !result.user
        ) {
          if (!result.cancelled) {
            toast.error(
              result.error ??
                "Unable to sign in with Google. Please try again.",
            );
          }

          return false;
        }

        const googleUser = result.user;

        let account = await getAccount(googleUser.uid);

        if (!account) {
          /*
           * An account that already owns this email is keyed on a
           * different Firebase uid, so signing in here would orphan
           * its orders. Send the customer to their password instead.
           */
          const existing =
            await getAccountByEmail(googleUser.email);

          if (existing) {
            toast.error(
              existing.role === "customer"
                ? "An account with this email already exists. Sign in with your password instead."
                : `This email is registered as a ${existing.role}. Sign in from that portal.`,
            );

            await auth.signOut();

            return false;
          }

          const created =
            await createAccountForAuthUser(
              googleUser.uid,
              {
                email: googleUser.email,
                name: googleUser.name,
                role: "customer",
              },
            );

          if (typeof created === "string") {
            toast.error(created);

            await auth.signOut();

            return false;
          }

          account = created;
        }

        if (account.role !== "customer") {
          toast.error(
            `This account is registered as a ${account.role}.`,
          );

          await auth.signOut();

          return false;
        }

        if (
          account.accountStatus === "disabled" ||
          account.accountStatus === "suspended"
        ) {
          toast.error(
            `Your account has been ${account.accountStatus}.`,
          );

          await auth.signOut();

          return false;
        }

        await healAccountIdentity(
          account.id,
          googleUser,
        );

        /*
         * Google already verified the email, so the profile
         * step is satisfied on a brand new account.
         */
        if (
          account.registrationStatus ===
          "incomplete"
        ) {
          await updateAccount(account.id, {
            registrationStatus: "complete",
          });

          account = {
            ...account,
            registrationStatus: "complete",
          };
        }

        signIn({
          accountId: account.id,
          role: "customer",
          email: account.email,
          name:
            account.name?.trim() ||
            googleUser.name,
          phone: account.phone ?? "",
          registrationStatus:
            account.registrationStatus,
          accountStatus: account.accountStatus,
        });

        toast.success("Signed in with Google");

        return true;
      } catch (error) {
        console.error(
          "Google customer sign-in error:",
          error,
        );

        toast.error(
          "Something went wrong. Please try again.",
        );

        return false;
      } finally {
        setLoading(false);
      }
    }, [
      createAccountForAuthUser,
      getAccount,
      getAccountByEmail,
      loading,
      signIn,
      updateAccount,
    ]);

  return {
    loading,
    signInAsCustomer,
  };
}
