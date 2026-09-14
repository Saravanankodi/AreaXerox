"use client";

import { Route } from "@/routes/shop.rejected";
export default function Page() {
  const Component = Route.options.component!;
  return <Component />;
}
