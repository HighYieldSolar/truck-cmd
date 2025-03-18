"use client";

import { Suspense } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the CompleteLoadPage component to ensure client-side rendering
const CompleteLoadPage = dynamic(() => import('@/components/dashboard/CompleteLoadPage'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  ),
});

export default function CompleteLoadRoute({ params }) {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    }>
      <CompleteLoadPage params={Promise.resolve(params)} />
    </Suspense>
  );
}