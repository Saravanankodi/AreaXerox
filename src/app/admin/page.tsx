"use client";

import { Route } from "@/routes/admin.index";
export default function Page() {
  const Component = Route.options.component!;
  return <Component />;
}
