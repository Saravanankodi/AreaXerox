"use client";

import { Route } from "@/routes/shop.reviews";
export default function Page() {
  const Component = Route.options.component!;
  return <Component />;
}
