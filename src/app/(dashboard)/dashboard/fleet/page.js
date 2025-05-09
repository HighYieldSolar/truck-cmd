"use client";

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Dynamically import the FleetManagementPage component to avoid server/client mismatch
const FleetManagementPage = dynamic(() => import('@/components/fleet/FleetManagementPage'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  ),
});

export default function FleetManagementRoute() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    }>
      <FleetManagementPage />
    </Suspense>
  );
}