"use client";

import { Route } from "@/routes/order";
export default function Page() {
  const Component = Route.options.component!;
  return <Component />;
}
