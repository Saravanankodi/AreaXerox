"use client";

import { Route } from "@/routes/shop.profile";
export default function Page() {
  const Component = Route.options.component!;
  return <Component />;
}
