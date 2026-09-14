"use client";

import { Route } from "@/routes/profile";
export default function Page() {
  const Component = Route.options.component!;
  return <Component />;
}
