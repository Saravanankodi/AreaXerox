"use client";

import { Route } from "@/routes/auth.customer.login";
export default function Page() {
  const Component = Route.options.component!;
  return <Component />;
}
