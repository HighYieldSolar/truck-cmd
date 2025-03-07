"use client";

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Dynamically import the ExpensesPage component to avoid server/client mismatch
const ExpensesPage = dynamic(() => import('@/components/dashboard/ExpensesPage'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  ),
});

export default function ExpensesPageWrapper() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    }>
      <ExpensesPage />
    </Suspense>
  );
}