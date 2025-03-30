"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Image from "next/image";
import { CheckCircle, RefreshCw, Home, FileText } from "lucide-react";
import Link from "next/link";

export default function SubscriptionSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    async function validateCheckout() {
      try {
        // Get the session ID from the URL
        const sessionId = searchParams.get('session_id');
        
        if (!sessionId) {
          // No session ID, redirect to billing page
          router.push('/dashboard/billing');
          return;
        }
        
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          router.push('/login');
          return;
        }
        
        // Fetch subscription data from your database
        const { data: subscriptionData, error: subError } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .single();
          
        if (subError) {
          console.error('Error fetching subscription:', subError);
          setError('Could not find your subscription. Please contact support.');
          setLoading(false);
          return;
        }
        
        setSubscription(subscriptionData);
      } catch (error) {
        console.error('Error validating checkout:', error);
        setError('An error occurred. Please contact support.');
      } finally {
        setLoading(false);
      }
    }
    
    validateCheckout();
  }, [router, searchParams]);
  
  if (loading) {
    return (
      <DashboardLayout>
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
      <DashboardLayout>
        <div className="max-w-3xl mx-auto mt-12 p-8 bg-white rounded-lg shadow-md">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-6">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
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
  
  // Get plan details
  const plans = {
    basic: {
      name: "Basic Plan",
      description: "For owner-operators with 1 truck"
    },
    premium: {
      name: "Premium Plan",
      description: "For owner-operators with 1-2 trucks"
    },
    fleet: {
      name: "Fleet Plan",
      description: "For small fleets with 3-8 trucks"
    }
  };
  
  const planName = subscription?.plan ? plans[subscription.plan]?.name : 'Premium Plan';
  const nextBillingDate = subscription?.current_period_ends_at 
    ? new Date(subscription.current_period_ends_at).toLocaleDateString() 
    : 'N/A';
  
  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto mt-12 p-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
            <CheckCircle size={32} className="text-green-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Payment Successful!</h2>
          <p className="text-gray-600 mb-8">Your subscription to {planName} has been activated.</p>
          
          <div className="bg-gray-50 p-6 rounded-lg mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Subscription Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600">Plan:</span>
                <span className="font-medium text-gray-900">{planName}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600">Status:</span>
                <span className="font-medium text-green-600">Active</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600">Billing Cycle:</span>
                <span className="font-medium text-gray-900">
                  {subscription?.billing_cycle === 'yearly' ? 'Yearly' : 'Monthly'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Next Billing Date:</span>
                <span className="font-medium text-gray-900">{nextBillingDate}</span>
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