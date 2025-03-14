"use client";

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Dynamically import the TrucksPage component to avoid server/client mismatch
const TrucksPage = dynamic(() => import('@/components/fleet/TrucksPage'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  ),
});

export default function TrucksRoute() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    }>
      <TrucksPage />
    </Suspense>
  );
}