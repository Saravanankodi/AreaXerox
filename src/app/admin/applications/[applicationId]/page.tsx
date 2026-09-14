"use client";

import { Route } from "@/routes/admin.applications.$applicationId";
export default function Page() {
  const Component = Route.options.component!;
  return <Component />;
}
