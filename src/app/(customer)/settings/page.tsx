"use client";

import { Route } from "@/routes/settings";
export default function Page() {
  const Component = Route.options.component!;
  return <Component />;
}
