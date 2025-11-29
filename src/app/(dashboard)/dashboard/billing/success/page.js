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
  ArrowRight,
  CreditCard,
  Sparkles
} from "lucide-react";
import { useSubscription } from "@/context/SubscriptionContext";

export default function SuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [subscriptionDetails, setSubscriptionDetails] = useState(null);
  const { refreshSubscription } = useSubscription();
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;

    async function processPayment() {
      try {
        processedRef.current = true;

        const sessionId = searchParams.get('session_id');

        if (!sessionId) {
          setError("Session ID is missing. Please try again.");
          setLoading(false);
          return;
        }

        const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');

        if (!userId) {
          setError("User ID is missing. Please return to the billing page and try again.");
          setLoading(false);
          return;
        }

        // Verify the session with Stripe
        const verifyResponse = await fetch('/api/verify-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, userId }),
        });

        const verifyResult = await verifyResponse.json();

        if (!verifyResult.valid) {
          throw new Error(verifyResult.error || 'Payment verification failed');
        }

        // Activate the subscription in our database
        const activateResponse = await fetch('/api/activate-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            sessionId,
            verificationData: verifyResult
          }),
        });

        const activateResult = await activateResponse.json();

        if (!activateResult.success) {
          if (activateResult.alreadyProcessed) {
            // Session was already processed - that's okay
          } else {
            throw new Error(activateResult.error || 'Failed to activate subscription');
          }
        }

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
            : "One year from today",
          amount: verifyResult.billingCycle === 'yearly'
            ? `$${verifyResult.yearlyTotal || 336}`
            : `$${verifyResult.monthlyPrice || 35}/mo`,
          status: "active"
        });

        // Refresh the subscription context to update UI
        setTimeout(() => {
          refreshSubscription();
        }, 1500);

        sessionStorage.setItem('dashboard-refresh-needed', 'true');
        sessionStorage.setItem('payment-success-processed', sessionId);

        setLoading(false);
      } catch (err) {
        setError(err.message || "An error occurred while activating your subscription");
        setLoading(false);
        processedRef.current = false;
      }
    }

    const processedSessionId = sessionStorage.getItem('payment-success-processed');
    const currentSessionId = searchParams.get('session_id');

    if (processedSessionId === currentSessionId) {
      setLoading(false);
      setSubscriptionDetails({
        plan: 'Premium Plan',
        billingCycle: 'yearly',
        nextPaymentDate: "One year from today",
        amount: '$336',
        status: "active"
      });
      return;
    }

    processPayment();
  }, []);

  if (loading) {
    return (
      <DashboardLayout activePage="billing">
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
          <div className="flex items-center justify-center min-h-screen">
            <div className="max-w-md mx-auto p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 text-center transition-colors duration-200">
              <RefreshCw size={48} className="animate-spin text-blue-600 dark:text-blue-400 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Processing Your Payment</h2>
              <p className="text-gray-600 dark:text-gray-400">Please wait while we confirm your subscription...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout activePage="billing">
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200 flex items-center justify-center p-4">
          <div className="max-w-md mx-auto p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 transition-colors duration-200">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 text-red-500 dark:text-red-400 mb-4">
                <AlertCircle size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Payment Processing Error</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8">{error}</p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link
                  href="/dashboard/billing"
                  className="inline-flex items-center justify-center px-5 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors"
                >
                  Return to Billing
                </Link>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center px-5 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200 flex items-center justify-center p-4">
        <div className="max-w-lg mx-auto w-full">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-400 dark:from-emerald-600 dark:to-emerald-500 p-6 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/90 dark:bg-white text-emerald-500 dark:text-emerald-600 mb-4">
                <CheckCircle size={32} />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2 flex items-center justify-center gap-2">
                <Sparkles className="h-5 w-5" />
                Payment Successful!
              </h2>
              <p className="text-emerald-100">Your subscription has been activated successfully</p>
            </div>

            {/* Content */}
            <div className="p-8">
              <div className="mb-8">
                <Image
                  src="/images/tc-name-tp-bg.png"
                  alt="Truck Command Logo"
                  width={150}
                  height={40}
                  className="h-10 mx-auto dark:invert"
                />
              </div>

              {subscriptionDetails && (
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6 mb-6 transition-colors duration-200">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Subscription Details</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Plan</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{subscriptionDetails.plan}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Billing Cycle</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100 capitalize">{subscriptionDetails.billingCycle}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Amount</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{subscriptionDetails.amount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Status</span>
                      <span className="font-medium text-emerald-600 dark:text-emerald-400 capitalize flex items-center">
                        <CheckCircle size={14} className="mr-1" />
                        {subscriptionDetails.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Next Payment</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{subscriptionDetails.nextPaymentDate}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mb-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">What happens next?</h3>
                <div className="space-y-4">
                  <div className="flex">
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mr-3 text-sm font-semibold">
                      1
                    </div>
                    <div>
                      <p className="text-gray-800 dark:text-gray-200">
                        You now have full access to all Truck Command features included in your subscription.
                      </p>
                    </div>
                  </div>

                  <div className="flex">
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mr-3 text-sm font-semibold">
                      2
                    </div>
                    <div>
                      <p className="text-gray-800 dark:text-gray-200">
                        We&apos;ve sent a confirmation email with your receipt and subscription details.
                      </p>
                    </div>
                  </div>

                  <div className="flex">
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mr-3 text-sm font-semibold">
                      3
                    </div>
                    <div>
                      <p className="text-gray-800 dark:text-gray-200">
                        You can manage your subscription at any time from your account settings.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <Link
                  href="/dashboard"
                  className="w-full sm:w-auto flex-1 inline-flex items-center justify-center px-5 py-3 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors"
                >
                  <Home size={18} className="mr-2" />
                  Go to Dashboard
                </Link>
                <Link
                  href="/dashboard/settings/billing"
                  className="w-full sm:w-auto flex-1 inline-flex items-center justify-center px-5 py-3 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg shadow-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <CreditCard size={18} className="mr-2" />
                  View Subscription
                </Link>
              </div>
            </div>
          </div>

          {/* Support info */}
          <div className="mt-8 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              Need help?{" "}
              <Link href="/contact" className="text-blue-600 dark:text-blue-400 hover:underline">
                Contact our support team
              </Link>
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
