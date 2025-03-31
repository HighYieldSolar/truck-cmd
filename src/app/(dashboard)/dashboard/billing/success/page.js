"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Image from "next/image";
import { CheckCircle, RefreshCw, Home, FileText, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function SubscriptionSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  
  useEffect(() => {
    async function validateCheckout() {
      try {
        // Get the session ID from the URL
        const sessionId = searchParams.get('session_id');
        console.log('Session ID from URL:', sessionId);
        
        if (!sessionId) {
          console.log('No session ID found, redirecting to billing page');
          router.push('/dashboard/billing');
          return;
        }
        
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error('User authentication error:', userError);
          throw userError;
        }
        
        if (!user) {
          console.error('No authenticated user found');
          router.push('/login');
          return;
        }
        
        console.log('User authenticated:', user.id);
        
        // Fetch subscription data with detailed error handling
        console.log('Fetching subscription data for user:', user.id);
        const subscriptionRequest = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id);
          
        if (subscriptionRequest.error) {
          console.error('Detailed subscription error:', subscriptionRequest.error);
          console.error('Error code:', subscriptionRequest.error.code);
          console.error('Error message:', subscriptionRequest.error.message);
          console.error('Error details:', subscriptionRequest.error.details);
        } else {
          console.log('Subscription query succeeded, data:', subscriptionRequest.data);
        }
        
        const { data: subscriptionData, error: subError } = subscriptionRequest;
        
        if (subError || !subscriptionData || subscriptionData.length === 0) {
          console.error('Error fetching subscription or no data found:', subError);
          
          // Try to manually update the subscription
          console.log('Attempting manual subscription update...');
          const updated = await updateSubscriptionManually(user.id, sessionId);
          
          if (!updated) {
            console.log('Manual update failed, setting fallback subscription');
            // Set fallback subscription data as the stripe payment was successful
            setSubscription({
              status: 'active',
              plan: 'premium', // Default to premium
              billing_cycle: 'monthly', // Default to monthly
              current_period_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            });
            
            setMessage("Your payment was successful! However, we encountered an issue updating your account. Please refresh this page or contact support if you don't see your subscription reflected soon.");
            setLoading(false);
            return;
          }
          
          // Retry fetching the subscription after manual update
          console.log('Manual update succeeded, retrying subscription fetch');
          const { data: retryData, error: retryError } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();
            
          if (retryError || !retryData) {
            console.error('Error after manual update or no data found:', retryError);
            setError('Could not find your subscription. Please contact support.');
            setLoading(false);
            return;
          }
          
          console.log('Retry fetch succeeded, data:', retryData);
          setSubscription(retryData);
          setLoading(false);
          return;
        }
        
        // If we found multiple subscription records, use the most recently updated one
        const subData = Array.isArray(subscriptionData) 
          ? subscriptionData.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))[0]
          : subscriptionData;
          
        console.log('Subscription data found:', subData);
        setSubscription(subData);
      } catch (error) {
        console.error('Error validating checkout:', error);
        setError('An error occurred. Please contact support.');
      } finally {
        setLoading(false);
      }
    }
    
    validateCheckout();
  }, [router, searchParams]);
  
  // Manual update function for when webhooks haven't processed yet
  async function updateSubscriptionManually(userId, sessionId) {
    try {
      console.log('Manually updating subscription for user:', userId);
      
      // First check if a subscription exists
      const { data: existingSubscription, error: checkError } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('user_id', userId);
        
      if (checkError) {
        console.error('Error checking existing subscription:', checkError);
      }
      
      // Verify the session with Stripe or use defaults
      let plan = 'premium';
      let billingCycle = 'monthly';
      let currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      
      try {
        const response = await fetch('/api/verify-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sessionId }),
        });
        
        if (response.ok) {
          const verification = await response.json();
          if (verification.valid) {
            plan = verification.plan;
            billingCycle = verification.billingCycle;
            currentPeriodEnd = verification.currentPeriodEnd;
          }
        }
      } catch (err) {
        console.error('Session verification failed, using defaults:', err);
        // Continue with defaults
      }
      
      if (!existingSubscription || existingSubscription.length === 0) {
        console.log('No subscription found, creating new one');
        
        // Create new subscription record
        const { data, error } = await supabase
          .from('subscriptions')
          .insert({
            user_id: userId,
            status: 'active',
            plan: plan,
            billing_cycle: billingCycle,
            checkout_session_id: sessionId,
            current_period_ends_at: currentPeriodEnd,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          
        if (error) {
          console.error('Error creating subscription:', error);
          return false;
        }
      } else {
        console.log('Updating existing subscription');
        
        // Update existing subscription
        const { error } = await supabase
          .from('subscriptions')
          .update({
            status: 'active',
            plan: plan,
            billing_cycle: billingCycle,
            checkout_session_id: sessionId,
            current_period_ends_at: currentPeriodEnd,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);
          
        if (error) {
          console.error('Error updating subscription:', error);
          return false;
        }
      }
      
      return true;
    } catch (err) {
      console.error('Exception during manual subscription update:', err);
      return false;
    }
  }
  
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
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(); // Fallback to 30 days
  
  return (
    <DashboardLayout activePage="billing">
      <div className="max-w-3xl mx-auto mt-12 p-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
            <CheckCircle size={32} className="text-green-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Payment Successful!</h2>
          <p className="text-gray-600 mb-4">Your subscription to {planName} has been activated.</p>
          
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