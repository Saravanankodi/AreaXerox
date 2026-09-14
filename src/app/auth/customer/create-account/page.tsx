"use client";

import { Route } from "@/routes/auth.customer.create-account";
export default function Page() {
  const Component = Route.options.component!;
  return <Component />;
}
