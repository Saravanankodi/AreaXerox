import { createFileRoute } from "@/lib/navigation";
import { AuthPage } from "@/components/auth/AuthPage";
export const Route = createFileRoute("/auth/shop/create-account")({ component: () => <AuthPage role="shopkeeper" mode="signup" /> });
