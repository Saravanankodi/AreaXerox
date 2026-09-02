import { createFileRoute } from "@tanstack/react-router";
import { AuthPage } from "@/components/auth/AuthPage";
export const Route = createFileRoute("/auth/customer/create-account")({ component: () => <AuthPage role="customer" mode="signup" /> });
