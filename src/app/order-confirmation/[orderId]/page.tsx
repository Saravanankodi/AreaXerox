"use client";

import { Route } from "@/routes/order-confirmation.$orderId";
export default function Page() {
  const Component = Route.options.component!;
  return <Component />;
}
