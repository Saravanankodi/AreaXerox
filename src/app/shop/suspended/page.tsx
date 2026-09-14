"use client";

import { Route } from "@/routes/shop.suspended";
export default function Page() {
  const Component = Route.options.component!;
  return <Component />;
}
