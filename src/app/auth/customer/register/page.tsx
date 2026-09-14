"use client";

import { Route } from "@/routes/auth.customer.register";
export default function Page() {
  const Component = Route.options.component!;
  return <Component />;
}
