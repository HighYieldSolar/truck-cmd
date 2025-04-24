"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { CheckCircle, RefreshCw, Home, FileText, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function SubscriptionSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  
  // Use a state variable to store the session ID to avoid dependency issues
  const [sessionId] = useState(() => searchParams.get('session_id'));
  
  // Process checkout only once - using sessionId from state to avoid re-renders
  useEffect(() => {
    // Always set a safety timeout
    const timeoutId = setTimeout(() => {
      setLoading(false); // Force exit loading state after 15 seconds
    }, 15000);
    
    let isMounted = true;
    
    async function processPayment() {
      try {
        if (!sessionId) {
          if (isMounted) {
            setError("Session ID is missing. Please try again.");
            setLoading(false);
          }
          return;
        }
        
        console.log("Processing payment confirmation with session ID:", sessionId);
        
        // Get userId from storage
        const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
        
        if (!userId) {
          if (isMounted) {
            setError("User ID is missing. Please return to the billing page and try again.");
            setLoading(false);
          }
          return;
        }
        
        // Simplified call to activate subscription with minimal data
        const response = await fetch('/api/activate-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            sessionId
          }),
        });
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        const result = await response.json();
        console.log("Activation result:", result);
        
        if (result.alreadyProcessed) {
          console.log("This session was already processed");
        }
        
        if (!result.success) {
          throw new Error(result.error || "Failed to activate subscription");
        }
        
        // Mark that the dashboard should be refreshed when navigating there
        sessionStorage.setItem('dashboard-refresh-needed', 'true');
        
      } catch (err) {
        console.error("Error processing payment:", err);
        if (isMounted) {
          setError(err.message || "An error occurred while activating your subscription");
        }
      } finally {
        // Always exit loading state
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    
    // Run the payment processing function
    processPayment();
    
    // Cleanup function
    return () => {
      clearTimeout(timeoutId);
      isMounted = false;
    };
  }, [sessionId]); // Add sessionId as a dependency
  
  if (loading) {
    return (
      <DashboardLayout activePage="billing">
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="flex flex-col items-center">
            <RefreshCw size={40} className="animate-spin text-blue-500 mb-4" />
            <p className="text-lg text-gray-600">Processing your payment...</p>
            <p className="text-sm text-gray-500 mt-2">This will only take a moment</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  if (error) {
    return (
      <DashboardLayout activePage="billing">
        <div className="max-w-xl mx-auto mt-12 p-6 bg-white rounded-lg shadow-md">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Payment Processing Error</h2>
            <p className="text-gray-600 mb-8">{error}</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/dashboard/billing" className="inline-flex items-center justify-center px-5 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                Return to Billing
              </Link>
              <Link href="/dashboard" className="inline-flex items-center justify-center px-5 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                Go to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  // Success state
  return (
    <DashboardLayout activePage="billing">
      <div className="max-w-xl mx-auto mt-12 p-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Payment Successful!</h2>
          <p className="text-gray-600 mb-6">
            Your subscription has been activated successfully.
          </p>
          
          {message && (
            <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md text-left">
              <p className="text-yellow-700">{message}</p>
            </div>
          )}
          
          <div className="space-y-3 bg-gray-50 p-4 rounded-md mx-auto max-w-md mb-8">
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className="font-medium text-green-600">Active</span>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 justify-center">
            <Link href="/dashboard" className="inline-flex items-center justify-center px-5 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
              <Home size={18} className="mr-2" />
              Go to Dashboard
            </Link>
            <Link href="/dashboard/billing" className="inline-flex items-center justify-center px-5 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50">
              <FileText size={18} className="mr-2" />
              Manage Subscription
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}