"use client";

import { Route } from "@/routes/shop.orders";
export default function Page() {
  const Component = Route.options.component!;
  return <Component />;
}
