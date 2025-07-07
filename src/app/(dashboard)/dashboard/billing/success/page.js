"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Home,
  FileText,
  ArrowRight
} from "lucide-react";
import { useSubscription } from "@/context/SubscriptionContext";

export default function SuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [subscriptionDetails, setSubscriptionDetails] = useState(null);
  const { refreshSubscription } = useSubscription();
  const processedRef = useRef(false); // Prevent multiple processing attempts

  useEffect(() => {
    // Prevent multiple executions
    if (processedRef.current) return;

    async function processPayment() {
      try {
        processedRef.current = true; // Mark as processing

        // Get session ID from URL params
        const sessionId = searchParams.get('session_id');

        if (!sessionId) {
          setError("Session ID is missing. Please try again.");
          setLoading(false);
          return;
        }

        // Get userId from storage
        const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');

        if (!userId) {
          setError("User ID is missing. Please return to the billing page and try again.");
          setLoading(false);
          return;
        }

        console.log(`Processing payment for user ${userId} with session ${sessionId}`);

        // First, verify the session with Stripe
        const verifyResponse = await fetch('/api/verify-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, userId }),
        });

        const verifyResult = await verifyResponse.json();

        if (!verifyResult.valid) {
          throw new Error(verifyResult.error || 'Payment verification failed');
        }

        console.log('Session verified:', verifyResult);

        // Next, activate the subscription in our database
        const activateResponse = await fetch('/api/activate-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            sessionId,
            verificationData: verifyResult // Pass the verification data
          }),
        });

        const activateResult = await activateResponse.json();

        if (!activateResult.success) {
          console.warn('Activation warning:', activateResult.error);
          // If it's already processed, that's actually success
          if (activateResult.alreadyProcessed) {
            console.log('Session was already processed successfully');
          } else {
            // Only throw error for actual failures, not duplicate processing
            throw new Error(activateResult.error || 'Failed to activate subscription');
          }
        }

        console.log('Subscription activation result:', activateResult);

        // Set subscription details from the verification response
        setSubscriptionDetails({
          plan: (verifyResult.plan || 'Premium Plan').charAt(0).toUpperCase() + (verifyResult.plan || 'Premium Plan').slice(1),
          billingCycle: verifyResult.billingCycle || 'yearly',
          nextPaymentDate: verifyResult.currentPeriodEnd
            ? new Date(verifyResult.currentPeriodEnd).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })
            : "April 27, 2026", // Fallback
          amount: verifyResult.billingCycle === 'yearly'
            ? `$${verifyResult.yearlyTotal || 396}`
            : `$${verifyResult.monthlyPrice || 33}/mo`,
          status: "active"
        });

        // Refresh the subscription context to update UI (but with a delay to prevent loops)
        setTimeout(() => {
          console.log('Refreshing subscription context...');
          refreshSubscription();
        }, 1500);

        // Mark that the dashboard should be refreshed when navigating there
        sessionStorage.setItem('dashboard-refresh-needed', 'true');

        // Mark success in sessionStorage to prevent re-processing on page refresh
        sessionStorage.setItem('payment-success-processed', sessionId);

        setLoading(false);
        console.log('Payment processing completed successfully');
      } catch (err) {
        console.error("Error processing payment:", err);
        setError(err.message || "An error occurred while activating your subscription");
        setLoading(false);
        processedRef.current = false; // Reset on error to allow retry
      }
    }

    // Check if we've already successfully processed this session
    const processedSessionId = sessionStorage.getItem('payment-success-processed');
    const currentSessionId = searchParams.get('session_id');

    if (processedSessionId === currentSessionId) {
      console.log('Session already processed successfully, skipping re-processing');
      setLoading(false);
      setSubscriptionDetails({
        plan: 'Premium Plan',
        billingCycle: 'yearly',
        nextPaymentDate: "April 27, 2026",
        amount: '$396',
        status: "active"
      });
      return;
    }

    processPayment();
  }, []); // Remove searchParams and refreshSubscription from dependencies to prevent re-runs

  if (loading) {
    return (
      <DashboardLayout activePage="billing">
        <div className="flex items-center justify-center min-h-screen">
          <div className="max-w-md mx-auto p-8 bg-white rounded-lg shadow-md text-center">
            <RefreshCw size={48} className="animate-spin text-blue-600 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Processing Your Payment</h2>
            <p className="text-gray-600">Please wait while we confirm your subscription...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout activePage="billing">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md mx-auto p-8 bg-white rounded-lg shadow-md">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-500 mb-4">
                <AlertCircle size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Payment Processing Error</h2>
              <p className="text-gray-600 mb-8">{error}</p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link
                  href="/dashboard/billing"
                  className="inline-flex items-center justify-center px-5 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Return to Billing
                </Link>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center px-5 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Go to Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activePage="billing">
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-lg mx-auto">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Header */}
            <div className="bg-green-500 p-6 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white text-green-500 mb-4">
                <CheckCircle size={32} />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Payment Successful!</h2>
              <p className="text-green-100">Your subscription has been activated successfully</p>
            </div>

            {/* Content */}
            <div className="p-8">
              <div className="mb-8">
                <Image
                  src="/images/tc-name-tp-bg.png"
                  alt="Truck Command Logo"
                  width={150}
                  height={40}
                  className="h-10 mx-auto"
                />
              </div>

              {subscriptionDetails && (
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Subscription Details</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Plan</span>
                      <span className="font-medium text-gray-900">{subscriptionDetails.plan}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Billing Cycle</span>
                      <span className="font-medium text-gray-900 capitalize">{subscriptionDetails.billingCycle}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Amount</span>
                      <span className="font-medium text-gray-900">{subscriptionDetails.amount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status</span>
                      <span className="font-medium text-green-600 capitalize">{subscriptionDetails.status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Next Payment</span>
                      <span className="font-medium text-gray-900">{subscriptionDetails.nextPaymentDate}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="border-t pt-6 mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">What happens next?</h3>
                <div className="space-y-4">
                  <div className="flex">
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-3">
                      1
                    </div>
                    <div>
                      <p className="text-gray-800">
                        You now have full access to all Truck Command features included in your subscription.
                      </p>
                    </div>
                  </div>

                  <div className="flex">
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-3">
                      2
                    </div>
                    <div>
                      <p className="text-gray-800">
                        We&apos;ve sent a confirmation email with your receipt and subscription details.
                      </p>
                    </div>
                  </div>

                  <div className="flex">
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-3">
                      3
                    </div>
                    <div>
                      <p className="text-gray-800">
                        You can manage your subscription at any time from your account settings.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <Link
                  href="/dashboard"
                  className="w-full sm:w-auto flex-1 inline-flex items-center justify-center px-5 py-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Home size={18} className="mr-2" />
                  Go to Dashboard
                </Link>
                <Link
                  href="/dashboard/settings/billing"
                  className="w-full sm:w-auto flex-1 inline-flex items-center justify-center px-5 py-3 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
                >
                  <FileText size={18} className="mr-2" />
                  View Subscription Details
                </Link>
              </div>
            </div>
          </div>

          {/* Support info */}
          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Need help? <Link href="/contact" className="text-blue-600 hover:underline">Contact our support team</Link>
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}