"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

// Dynamically import the fleet page to avoid SSR/CSR mismatch (mapbox + supabase auth).
const FleetPageClient = dynamic(
  () => import("@/components/fleet/FleetPageClient"),
  {
    ssr: false,
    loading: () => <PageSpinner />,
  }
);

export default function FleetRoute() {
  return (
    <Suspense fallback={<PageSpinner />}>
      <FleetPageClient />
    </Suspense>
  );
}

function PageSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-200 border-t-slate-900" />
    </div>
  );
}
