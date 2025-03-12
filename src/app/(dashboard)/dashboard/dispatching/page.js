// src/app/(dashboard)/dashboard/dispatching/page.js
"use client";

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Dynamically import the DispatchingPage component to avoid server/client mismatch
const DispatchingPage = dynamic(() => import('@/components/dashboard/DispatchingPage'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  ),
});

export default function DispatchingRoute() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    }>
      <DispatchingPage />
    </Suspense>
  );
}