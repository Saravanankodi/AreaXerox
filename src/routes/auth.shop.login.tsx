import { createFileRoute } from "@/lib/navigation";
import { AuthPageRoute } from "@/components/auth/AuthPage";

export const Route = createFileRoute("/auth/shop/login")({
  component: () => <AuthPageRoute role="shopkeeper" mode="login" />,
});
