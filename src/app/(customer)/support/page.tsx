"use client";

import { Route } from "@/routes/support";
export default function Page() {
  const Component = Route.options.component!;
  return <Component />;
}
