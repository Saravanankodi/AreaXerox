"use client";

import { Route } from "@/routes/orders.index";
export default function Page() {
  const Component = Route.options.component!;
  return <Component />;
}
