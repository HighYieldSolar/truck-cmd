// src/components/dashboard/CompleteLoadPage.js
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { supabase } from '@/lib/supabaseClient';
import { AlertCircle } from 'lucide-react';

// Import the form directly
import CompleteLoadForm from '@/components/dashboard/CompleteLoadForm';

// Loading spinner component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen p-8 bg-gray-50 dark:bg-gray-900">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
      <p className="text-gray-600 dark:text-gray-400">Loading load details...</p>
    </div>
  </div>
);

export default function CompleteLoadPage({ params }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [loadId, setLoadId] = useState(null);
  const [loadDetails, setLoadDetails] = useState(null);
  const [error, setError] = useState(null);

  // Extract the load ID from params
  useEffect(() => {
    // Check if params exists and extract the ID
    if (params && typeof params === 'object') {
      // Handle both Promise and direct object
      const getParams = async () => {
        try {
          // If params is a Promise
          if (params.then && typeof params.then === 'function') {
            const resolvedParams = await params;
            setLoadId(resolvedParams?.id);
          } else {
            // If params is a direct object
            setLoadId(params?.id);
          }
        } catch (err) {
          console.error("Error resolving params:", err);
          setError("Failed to load page parameters");
        }
      };

      getParams();
    } else if (typeof window !== 'undefined') {
      // Fallback to get ID from URL if params is not available
      const pathSegments = window.location.pathname.split('/');
      const idFromPath = pathSegments[pathSegments.length - 1];
      if (idFromPath && idFromPath !== 'complete') {
        setLoadId(idFromPath);
      }
    }
  }, [params]);

  // Fetch load details once we have the ID
  useEffect(() => {
    const fetchLoadDetails = async () => {
      if (!loadId) return;

      try {
        setLoading(true);

        // First check if user is authenticated
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
          router.push('/login');
          return;
        }

        // Fetch the load details
        const { data, error } = await supabase
          .from('loads')
          .select('*')
          .eq('id', loadId)
          .single();

        if (error) throw error;

        if (!data) {
          throw new Error("Load not found");
        }

        // Set the load details
        setLoadDetails(data);
        setError(null);

      } catch (err) {
        console.error("Error fetching load details:", err);
        setError(err.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchLoadDetails();
  }, [loadId, router]);

  // Show loading state
  if (loading) {
    return <LoadingSpinner />;
  }

  // Show error if there's an issue
  if (error || !loadId) {
    return (
      <DashboardLayout activePage="dispatching">
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/40 mx-auto mb-4">
                <AlertCircle size={24} className="text-amber-600 dark:text-amber-400" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 text-center mb-2">
                {!loadId ? "Missing Load ID" : "Error Loading Data"}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
                {!loadId
                  ? "No load ID was provided. Please select a load from the dispatching dashboard."
                  : error || "An unexpected error occurred while loading the load details."}
              </p>
              <button
                onClick={() => router.push('/dashboard/dispatching')}
                className="w-full px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors font-medium"
              >
                Return to Dispatching
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Render the form
  return (
    <DashboardLayout activePage="dispatching">
      <CompleteLoadForm loadId={loadId} loadDetails={loadDetails} />
    </DashboardLayout>
  );
}