// src/components/dashboard/CompleteLoadPage.js
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { supabase } from '@/lib/supabaseClient';

// Import the form directly
import CompleteLoadForm from '@/components/dashboard/CompleteLoadForm';

// Loading spinner component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen p-8">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
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
        <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
            <h2 className="text-lg font-medium text-yellow-800">
              {!loadId ? "Missing Load ID" : "Error Loading Data"}
            </h2>
            <p className="mt-2 text-sm text-yellow-700">
              {!loadId
                ? "No load ID was provided. Please select a load from the dispatching dashboard."
                : error || "An unexpected error occurred while loading the load details."}
            </p>
            <button
              onClick={() => router.push('/dashboard/dispatching')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Return to Dispatching
            </button>
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