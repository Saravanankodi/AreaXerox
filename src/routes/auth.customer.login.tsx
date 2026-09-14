import { createFileRoute } from "@/lib/navigation";
import { AuthPage } from "@/components/auth/AuthPage";
export const Route = createFileRoute("/auth/customer/login")({ component: () => <AuthPage role="customer" mode="login" /> });
