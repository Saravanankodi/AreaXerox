import { createFileRoute, useNavigate } from "@/lib/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/auth/shop/register")({
  component: ShopRegisterRedirect,
});

function ShopRegisterRedirect() {
  const navigate = useNavigate();
  const { session, ready } = useAuth();

  useEffect(() => {
    if (!ready) return;
    if (session && session.role === "shopkeeper") {
      navigate({ to: "/shop", replace: true });
    } else {
      navigate({ to: "/auth/shop/login", replace: true });
    }
  }, [session, navigate, ready]);

  return null;
}
