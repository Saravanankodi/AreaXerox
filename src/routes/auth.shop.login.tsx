import { createFileRoute } from "@/lib/navigation";
import { AuthPage } from "@/components/auth/AuthPage";
export const Route = createFileRoute("/auth/shop/login")({ component: () => <AuthPage role="shopkeeper" mode="login" /> });
