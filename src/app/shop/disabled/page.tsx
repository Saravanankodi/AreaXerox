"use client";

import { Route } from "@/routes/shop.disabled";
export default function Page() {
  const Component = Route.options.component!;
  return <Component />;
}
