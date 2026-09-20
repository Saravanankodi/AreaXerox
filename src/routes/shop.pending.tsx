import { createFileRoute, useNavigate } from "@/lib/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/shop/pending")({
  component: ShopPendingPage,
});

function ShopPendingPage() {
  const navigate = useNavigate();
  const { session } = useAuth();

  useEffect(() => {
    // Redirect all shopkeepers to the dashboard — the dashboard handles onboarding state.
    if (session && session.role === "shopkeeper") {
      navigate({ to: "/shop", replace: true });
    } else {
      navigate({ to: "/auth/shop/login", replace: true });
    }
  }, [session, navigate]);

  return null;
}
