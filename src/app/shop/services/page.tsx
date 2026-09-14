"use client";

import { Route } from "@/routes/shop.services";
export default function Page() {
  const Component = Route.options.component!;
  return <Component />;
}
