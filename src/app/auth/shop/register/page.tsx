"use client";

import { Route } from "@/routes/auth.shop.register";
export default function Page() {
  const Component = Route.options.component!;
  return <Component />;
}
