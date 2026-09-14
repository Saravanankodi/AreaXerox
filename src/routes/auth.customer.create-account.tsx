import { createFileRoute } from "@/lib/navigation";
import { AuthPage } from "@/components/auth/AuthPage";
export const Route = createFileRoute("/auth/customer/create-account")({ component: () => <AuthPage role="customer" mode="signup" /> });
