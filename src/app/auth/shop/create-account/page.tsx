"use client";

import { Route } from "@/routes/auth.shop.create-account";
export default function Page() {
  const Component = Route.options.component!;
  return <Component />;
}
