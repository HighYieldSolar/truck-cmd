"use client";

import { useEffect, useState, use } from 'react';
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
  const unwrappedParams = use(params);
  const [isClient, setIsClient] = useState(false);

  // Use effect to confirm we're on client-side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Don't render anything on server-side to avoid hydration mismatches
  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return <CompleteLoadPage params={unwrappedParams} />;
}