"use client";

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Dynamically import the ELDDashboardPage component to avoid server/client mismatch
const ELDDashboardPage = dynamic(() => import('@/components/eld/ELDDashboardPage'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
    </div>
  ),
});

export default function ELDDashboardRoute() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    }>
      <ELDDashboardPage />
    </Suspense>
  );
}
