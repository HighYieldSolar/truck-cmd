"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Image from "next/image";
import { CheckCircle, RefreshCw, Home, FileText, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useSubscription } from "@/context/SubscriptionContext";

export default function SubscriptionSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [planInfo, setPlanInfo] = useState({
    name: "Premium Plan",
    billingCycle: "monthly",
    nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()
  });
  
  // Get the subscription context
  const { refreshSubscription } = useSubscription();
  
  // Use useCallback to avoid recreating this function on every render
  const processCheckout = useCallback(async () => {
    let isMounted = true; // To prevent state updates after unmount
    
    try {
      // Get the session ID from the URL
      const sessionId = searchParams.get('session_id');
      if (!sessionId) {
        router.push('/dashboard/billing');
        return;
      }
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        if (isMounted) setError("Authentication error. Please log in again.");
        return;
      }
      
      // Call our dedicated endpoint to set the subscription to active
      const activateResponse = await fetch('/api/activate-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, sessionId }),
      });
      
      const activateResult = await activateResponse.json();
      console.log("Activation result:", activateResult);
      
      if (!activateResult.success) {
        console.error("Failed to activate subscription:", activateResult.error);
        if (isMounted) setMessage("Your payment was processed, but we had trouble updating your subscription. Please contact support if issues persist.");
      }
      
      // Refresh the subscription context
      refreshSubscription();
      
      // Now get updated subscription data
      const { data: subscriptionData, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();
      
      if (subError) {
        console.error("Error fetching subscription:", subError);
      } else if (subscriptionData) {
        // Update plan information for display
        const planName = subscriptionData.plan 
          ? {
              premium: "Premium Plan", 
              basic: "Basic Plan", 
              fleet: "Fleet Plan"
            }[subscriptionData.plan] || "Premium Plan"
          : "Premium Plan";
          
        if (isMounted) {
          setPlanInfo({
            name: planName,
            billingCycle: subscriptionData.billing_cycle || "monthly",
            nextBillingDate: subscriptionData.current_period_ends_at 
              ? new Date(subscriptionData.current_period_ends_at).toLocaleDateString()
              : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()
          });
        }
      }
      
      // Set dashboard refresh flag
      sessionStorage.setItem('dashboard-refresh-needed', 'true');
      
    } catch (error) {
      console.error("Error in subscription success:", error);
      if (isMounted) setError("An unexpected error occurred. Please contact support.");
    } finally {
      if (isMounted) setLoading(false);
    }
    
    // Return cleanup function that sets isMounted to false
    return () => {
      isMounted = false;
    };
  }, [router, searchParams, refreshSubscription]); // Include all dependencies
  
  // Only run this effect once when the component mounts
  useEffect(() => {
    const cleanup = processCheckout();
    return cleanup;
  }, [processCheckout]); // Only depend on processCheckout which already includes all needed dependencies
  
  if (loading) {
    return (
      <DashboardLayout activePage="billing">
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="flex flex-col items-center">
            <RefreshCw size={40} className="animate-spin text-blue-500 mb-4" />
            <p className="text-lg text-gray-600">Processing your subscription...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  if (error) {
    return (
      <DashboardLayout activePage="billing">
        <div className="max-w-3xl mx-auto mt-12 p-8 bg-white rounded-lg shadow-md">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-6">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h2>
            <p className="text-gray-600 mb-8">{error}</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/dashboard/billing" className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                <FileText className="w-5 h-5 mr-2" />
                Return to Billing
              </Link>
              <Link href="/dashboard" className="inline-flex items-center justify-center px-5 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                <Home className="w-5 h-5 mr-2" />
                Go to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout activePage="billing">
      <div className="max-w-3xl mx-auto mt-12 p-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
            <CheckCircle size={32} className="text-green-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Payment Successful!</h2>
          <p className="text-gray-600 mb-4">Your subscription to {planInfo.name} has been activated.</p>
          
          {message && (
            <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md text-left">
              <div className="flex">
                <AlertCircle className="h-6 w-6 text-yellow-400 mr-3 flex-shrink-0" />
                <p className="text-yellow-700">{message}</p>
              </div>
            </div>
          )}
          
          <div className="bg-gray-50 p-6 rounded-lg mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Subscription Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600">Plan:</span>
                <span className="font-medium text-gray-900">{planInfo.name}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600">Status:</span>
                <span className="font-medium text-green-600">Active</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600">Billing Cycle:</span>
                <span className="font-medium text-gray-900">
                  {planInfo.billingCycle === 'yearly' ? 'Yearly' : 'Monthly'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Next Billing Date:</span>
                <span className="font-medium text-gray-900">{planInfo.nextBillingDate}</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/dashboard" className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
              <Home className="w-5 h-5 mr-2" />
              Go to Dashboard
            </Link>
            <Link href="/dashboard/billing" className="inline-flex items-center justify-center px-5 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              <FileText className="w-5 h-5 mr-2" />
              Manage Subscription
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}