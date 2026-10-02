"use client";

import { Route } from "@/routes/shop.wallet";
export default function Page() {
  const Component = Route.options.component!;
  return <Component />;
}
