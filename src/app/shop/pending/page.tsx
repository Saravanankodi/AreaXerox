"use client";

import { Route } from "@/routes/shop.pending";
export default function Page() {
  const Component = Route.options.component!;
  return <Component />;
}
