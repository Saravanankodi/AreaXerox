"use client";

import { Route } from "@/routes/orders.$orderId";
export default function Page() {
  const Component = Route.options.component!;
  return <Component />;
}
