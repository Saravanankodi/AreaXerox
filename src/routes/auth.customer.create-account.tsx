import { createFileRoute } from "@/lib/navigation";
import { AuthPageRoute } from "@/components/auth/AuthPage";

export const Route = createFileRoute("/auth/customer/create-account")({
  component: () => <AuthPageRoute role="customer" mode="signup" />,
});
