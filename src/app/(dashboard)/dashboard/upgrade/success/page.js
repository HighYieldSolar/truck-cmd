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
  const { user, refreshSubscription, subscription } = useSubscription();
  const processedRef = useRef(false);
  const userIdRef = useRef(null);

  // Plans data for display
  const plans = {
    basic: { name: "Basic", monthlyPrice: 20, yearlyPrice: 16, yearlyTotal: 192, limits: "1 Truck • 1 Driver • 50 Loads/mo" },
    premium: { name: "Premium", monthlyPrice: 35, yearlyPrice: 28, yearlyTotal: 336, limits: "3 Trucks • 3 Drivers • Unlimited Loads" },
    fleet: { name: "Fleet", monthlyPrice: 75, yearlyPrice: 60, yearlyTotal: 720, limits: "12 Trucks • 12 Drivers • 6 Team Users" }
  };

  useEffect(() => {
    // Wait for user to be available
    if (!user?.id) return;

    // Prevent multiple executions - check both ref and if we already processed this user
    if (processedRef.current && userIdRef.current === user.id) return;

    // Also check session storage for processed flag to prevent loops across remounts
    const alreadyProcessed = sessionStorage.getItem('success-page-processed');
    if (alreadyProcessed === user.id) {
      setLoading(false);
      // Restore subscription details from session storage if available
      const savedDetails = sessionStorage.getItem('success-subscription-details');
      if (savedDetails) {
        try {
          setSubscriptionDetails(JSON.parse(savedDetails));
        } catch (e) {
          console.error('Error parsing saved details:', e);
        }
      }
      return;
    }

    // Mark as processing
    processedRef.current = true;
    userIdRef.current = user.id;

    async function processPayment() {
      try {
        console.log('Processing payment for user:', user.id);

        // Check for upgrade result (from /api/update-subscription flow)
        const upgradeResultStr = sessionStorage.getItem('upgrade_result');
        if (upgradeResultStr) {
          await handleUpgradeResult(user.id, upgradeResultStr);
          return;
        }

        // Check for different scenarios
        const sessionId = searchParams.get('session_id');
        const paymentIntent = searchParams.get('payment_intent');
        const redirectStatus = searchParams.get('redirect_status');

        // Handle embedded checkout (most common)
        if (!sessionId || (paymentIntent && redirectStatus === 'succeeded')) {
          await handleEmbeddedCheckoutSuccess(user.id);
          return;
        }

        // Handle old Stripe Checkout session flow
        if (sessionId) {
          await handleStripeCheckoutSuccess(sessionId);
          return;
        }

        // Fallback
        await handleEmbeddedCheckoutSuccess(user.id);

      } catch (err) {
        console.error('Payment processing error:', err);
        setError(err.message || "An error occurred while activating your subscription");
        setLoading(false);
      }
    }

    processPayment();
  }, [user?.id]); // Only re-run when user ID changes

  // Handle direct upgrade result (no payment processing needed)
  const handleUpgradeResult = async (userId, upgradeResultStr) => {
    try {
      const upgradeResult = JSON.parse(upgradeResultStr);
      const savedPlan = sessionStorage.getItem('checkout_plan') || 'premium';
      const savedCycle = sessionStorage.getItem('checkout_billing_cycle') || 'monthly';

      const planData = plans[savedPlan] || plans.premium;
      const isYearly = savedCycle === 'yearly';

      // Calculate next billing date
      const nextBillingDate = new Date();
      if (isYearly) {
        nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
      } else {
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
      }

      const details = {
        plan: planData.name,
        limits: planData.limits,
        billingCycle: savedCycle,
        nextPaymentDate: nextBillingDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        amount: isYearly ? `$${planData.yearlyTotal}/year` : `$${planData.monthlyPrice}/month`,
        status: "active",
        upgradeMessage: upgradeResult.message
      };

      setSubscriptionDetails(details);

      // Clean up session storage
      sessionStorage.removeItem('upgrade_result');
      sessionStorage.removeItem('checkout_plan');
      sessionStorage.removeItem('checkout_billing_cycle');
      sessionStorage.setItem('dashboard-refresh-needed', 'true');
      sessionStorage.setItem('success-page-processed', userId);
      sessionStorage.setItem('success-subscription-details', JSON.stringify(details));

      setLoading(false);

      // Refresh subscription context in background
      try { refreshSubscription(); } catch (e) { console.error(e); }
    } catch (err) {
      console.error('Error handling upgrade result:', err);
      // Fall back to embedded checkout handling
      await handleEmbeddedCheckoutSuccess(userId);
    }
  };

  // Handle new embedded checkout success
  const handleEmbeddedCheckoutSuccess = async (userId) => {
    try {
      // Get saved plan info from session storage
      const savedPlan = sessionStorage.getItem('checkout_plan') || 'premium';
      const savedCycle = sessionStorage.getItem('checkout_billing_cycle') || 'monthly';

      console.log('Syncing subscription for user:', userId, 'Plan:', savedPlan, 'Cycle:', savedCycle);

      // Sync subscription directly from Stripe with retry logic
      if (userId) {
        let syncResult = null;
        let attempts = 0;
        const maxAttempts = 3;

        // Retry loop - wait and retry if subscription is still incomplete
        while (attempts < maxAttempts) {
          attempts++;

          // Wait before syncing (longer on each retry)
          const waitTime = attempts === 1 ? 2000 : 3000;
          console.log(`Attempt ${attempts}: Waiting ${waitTime}ms for Stripe to process...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));

          try {
            const syncResponse = await fetch('/api/sync-subscription', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: userId })
            });

            syncResult = await syncResponse.json();
            console.log(`Attempt ${attempts} sync result:`, syncResult);

            // If subscription is active, we're done
            if (syncResult.success && syncResult.subscription?.status === 'active') {
              console.log('Subscription is active, proceeding');
              break;
            }

            // If incomplete and we have retries left, wait and try again
            if (syncResult.success && syncResult.subscription?.status === 'incomplete' && attempts < maxAttempts) {
              console.log('Subscription still incomplete, will retry...');
              continue;
            }

            // If we got success with any status on last attempt, use it
            if (syncResult.success && syncResult.subscription) {
              break;
            }
          } catch (syncErr) {
            console.error(`Attempt ${attempts} sync error:`, syncErr);
            if (attempts >= maxAttempts) throw syncErr;
          }
        }

        if (syncResult?.success && syncResult?.subscription) {
          const sub = syncResult.subscription;
          const planKey = sub.plan || savedPlan;
          const planData = plans[planKey] || plans.premium;
          const isYearly = sub.billingCycle === 'yearly';

          const details = {
            plan: planData.name,
            limits: planData.limits,
            billingCycle: sub.billingCycle,
            nextPaymentDate: new Date(sub.currentPeriodEnd).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }),
            amount: isYearly ? `$${planData.yearlyTotal}/year` : `$${planData.monthlyPrice}/month`,
            status: sub.status
          };

          setSubscriptionDetails(details);

          // Clean up and mark as processed
          sessionStorage.removeItem('checkout_plan');
          sessionStorage.removeItem('checkout_billing_cycle');
          sessionStorage.setItem('dashboard-refresh-needed', 'true');
          sessionStorage.setItem('success-page-processed', userId);
          sessionStorage.setItem('success-subscription-details', JSON.stringify(details));

          setLoading(false);

          // Refresh context in background (non-blocking)
          try { refreshSubscription(); } catch (e) { console.error(e); }
          return;
        }
      } else {
        console.log('No userId provided, using fallback');
      }

      // Fallback: use session storage data
      const planData = plans[savedPlan] || plans.premium;
      const isYearly = savedCycle === 'yearly';

      const nextBillingDate = new Date();
      if (isYearly) {
        nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
      } else {
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
      }

      const details = {
        plan: planData.name,
        limits: planData.limits,
        billingCycle: savedCycle,
        nextPaymentDate: nextBillingDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        amount: isYearly ? `$${planData.yearlyTotal}/year` : `$${planData.monthlyPrice}/month`,
        status: "active"
      };

      setSubscriptionDetails(details);

      // Clean up and mark as processed
      sessionStorage.removeItem('checkout_plan');
      sessionStorage.removeItem('checkout_billing_cycle');
      sessionStorage.setItem('dashboard-refresh-needed', 'true');
      sessionStorage.setItem('success-page-processed', userId);
      sessionStorage.setItem('success-subscription-details', JSON.stringify(details));

      setLoading(false);

      // Refresh context in background (non-blocking)
      try { refreshSubscription(); } catch (e) { console.error(e); }
    } catch (err) {
      console.error('Error in handleEmbeddedCheckoutSuccess:', err);
      // Don't throw - show success anyway since payment likely succeeded
      setLoading(false);
    }
  };

  // Handle old Stripe Checkout session success
  const handleStripeCheckoutSuccess = async (sessionId) => {
    const userId = user?.id || localStorage.getItem('userId') || sessionStorage.getItem('userId');

    if (!userId) {
      throw new Error("User ID is missing. Please return to the billing page and try again.");
    }

    // Check if already processed
    const processedSessionId = sessionStorage.getItem('payment-success-processed');
    if (processedSessionId === sessionId) {
      const savedPlan = sessionStorage.getItem('checkout_plan') || 'premium';
      const savedCycle = sessionStorage.getItem('checkout_billing_cycle') || 'yearly';
      const planData = plans[savedPlan] || plans.premium;
      const isYearly = savedCycle === 'yearly';

      setSubscriptionDetails({
        plan: planData.name,
        limits: planData.limits,
        billingCycle: savedCycle,
        nextPaymentDate: isYearly ? "One year from today" : "One month from today",
        amount: isYearly ? `$${planData.yearlyTotal}` : `$${planData.monthlyPrice}/mo`,
        status: "active"
      });
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

    if (!activateResult.success && !activateResult.alreadyProcessed) {
      throw new Error(activateResult.error || 'Failed to activate subscription');
    }

    // Set subscription details
    const planKey = (verifyResult.plan || 'premium').toLowerCase();
    const planData = plans[planKey] || plans.premium;
    const isYearly = verifyResult.billingCycle === 'yearly';

    setSubscriptionDetails({
      plan: planData.name,
      limits: planData.limits,
      billingCycle: verifyResult.billingCycle || 'yearly',
      nextPaymentDate: verifyResult.currentPeriodEnd
        ? new Date(verifyResult.currentPeriodEnd).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
        : isYearly ? "One year from today" : "One month from today",
      amount: isYearly ? `$${planData.yearlyTotal}` : `$${planData.monthlyPrice}/mo`,
      status: "active"
    });

    // Refresh and store
    setTimeout(() => refreshSubscription(), 1500);
    sessionStorage.setItem('dashboard-refresh-needed', 'true');
    sessionStorage.setItem('payment-success-processed', sessionId);

    setLoading(false);
  };

  if (loading) {
    return (
      <DashboardLayout activePage="upgrade">
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center justify-center min-h-screen">
            <div className="max-w-md mx-auto p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 text-center">
              <RefreshCw size={48} className="animate-spin text-blue-500 dark:text-blue-400 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Processing Your Payment</h2>
              <p className="text-gray-600 dark:text-gray-400">Please wait while we confirm your subscription...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout activePage="upgrade">
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
          <div className="max-w-md mx-auto p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 text-red-500 dark:text-red-400 mb-4">
                <AlertCircle size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Payment Processing Error</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8">{error}</p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link
                  href="/dashboard/upgrade"
                  className="inline-flex items-center justify-center px-5 py-3 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  Return to Plans
                </Link>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center px-5 py-3 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
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
    <DashboardLayout activePage="upgrade">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-lg mx-auto w-full">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 p-6 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white text-emerald-600 mb-4">
                <CheckCircle size={32} />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2 flex items-center justify-center gap-2">
                <Sparkles className="h-5 w-5" />
                Payment Successful!
              </h2>
              <p className="text-emerald-100">Your subscription has been activated</p>
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
                <div className="bg-gray-100 dark:bg-gray-700/50 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Subscription Details</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 dark:text-gray-400">Plan</span>
                      <span className="font-medium text-gray-900 dark:text-white">{subscriptionDetails.plan}</span>
                    </div>
                    {subscriptionDetails.limits && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 dark:text-gray-400">Includes</span>
                        <span className="inline-flex items-center px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 text-xs font-medium rounded-full">
                          {subscriptionDetails.limits}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 dark:text-gray-400">Billing</span>
                      <span className="font-medium text-gray-900 dark:text-white capitalize">{subscriptionDetails.billingCycle}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 dark:text-gray-400">Amount</span>
                      <span className="font-medium text-gray-900 dark:text-white">{subscriptionDetails.amount}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 dark:text-gray-400">Status</span>
                      <span className="font-medium text-emerald-600 dark:text-emerald-400 capitalize flex items-center">
                        <CheckCircle size={14} className="mr-1" />
                        {subscriptionDetails.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 dark:text-gray-400">Next Payment</span>
                      <span className="font-medium text-gray-900 dark:text-white">{subscriptionDetails.nextPaymentDate}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mb-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">What happens next?</h3>
                <div className="space-y-4">
                  <div className="flex">
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mr-3 text-sm font-semibold">
                      1
                    </div>
                    <p className="text-gray-600 dark:text-gray-300">
                      You now have full access to all features included in your plan.
                    </p>
                  </div>
                  <div className="flex">
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mr-3 text-sm font-semibold">
                      2
                    </div>
                    <p className="text-gray-600 dark:text-gray-300">
                      A confirmation email with your receipt has been sent.
                    </p>
                  </div>
                  <div className="flex">
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mr-3 text-sm font-semibold">
                      3
                    </div>
                    <p className="text-gray-600 dark:text-gray-300">
                      Manage your subscription anytime from account settings.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <Link
                  href="/dashboard"
                  className="w-full sm:w-auto flex-1 inline-flex items-center justify-center px-5 py-3 text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  <Home size={18} className="mr-2" />
                  Go to Dashboard
                </Link>
                <Link
                  href="/dashboard/settings/billing"
                  className="w-full sm:w-auto flex-1 inline-flex items-center justify-center px-5 py-3 border border-gray-200 dark:border-gray-600 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <CreditCard size={18} className="mr-2" />
                  View Subscription
                </Link>
              </div>
            </div>
          </div>

          {/* Support info */}
          <div className="mt-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">
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
