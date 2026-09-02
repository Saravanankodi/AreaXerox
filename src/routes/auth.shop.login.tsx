import { createFileRoute } from "@tanstack/react-router";
import { AuthPage } from "@/components/auth/AuthPage";
export const Route = createFileRoute("/auth/shop/login")({ component: () => <AuthPage role="shopkeeper" mode="login" /> });
