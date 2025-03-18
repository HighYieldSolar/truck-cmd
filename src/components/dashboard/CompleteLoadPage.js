"use client";

import React, { Suspense } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import CompleteLoadForm from '@/components/dashboard/CompleteLoadForm';

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen p-8">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
  </div>
);

// Error boundary component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-8">
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md max-w-2xl w-full">
            <h2 className="text-xl font-bold text-red-700 mb-2">Something went wrong</h2>
            <p className="text-red-600">{this.state.error?.message || "An unexpected error occurred"}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function CompleteLoadPage({ params }) {
  // Use React.use() to unwrap the params Promise
  const resolvedParams = React.use(params);
  const loadId = resolvedParams?.id;
  
  if (!loadId) {
    return (
      <DashboardLayout activePage="dispatching">
        <div className="max-w-4xl mx-auto p-8">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
            <h2 className="text-lg font-medium text-yellow-800">Missing Load ID</h2>
            <p className="mt-2 text-sm text-yellow-700">
              No load ID was provided. Please select a load from the dispatching dashboard.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout activePage="dispatching">
      <ErrorBoundary>
        <Suspense fallback={<LoadingSpinner />}>
          <CompleteLoadForm loadId={loadId} />
        </Suspense>
      </ErrorBoundary>
    </DashboardLayout>
  );
}