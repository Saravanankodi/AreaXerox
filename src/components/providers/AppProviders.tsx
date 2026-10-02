"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/lib/auth";
import { StoreProvider } from "@/lib/store";
import { ThemeProvider } from "@/lib/theme";
import { Toaster } from "@/components/ui/sonner";
import { PushRegistration } from "@/components/PushRegistration";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <StoreProvider>
          {children}
          <PushRegistration />
          <Toaster position="top-center" />
        </StoreProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
