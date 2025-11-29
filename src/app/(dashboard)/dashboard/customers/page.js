"use client";

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Dynamically import the CustomersPage component to avoid server/client mismatch
const CustomersPage = dynamic(() => import('@/components/customers/CustomersPage'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  ),
});

export default function CustomersPageWrapper() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    }>
      <CustomersPage />
    </Suspense>
  );
}