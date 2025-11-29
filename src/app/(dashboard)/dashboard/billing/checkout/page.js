"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  CheckCircle,
  AlertCircle,
  RefreshCw,
  CreditCard,
  ChevronLeft,
  Lock,
  ShieldCheck,
  Shield
} from "lucide-react";
import { useSubscription } from "@/context/SubscriptionContext";

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Get subscription context for user info
  const { user } = useSubscription();

  // Get plan and billing cycle from URL params
  const [planId, setPlanId] = useState("");
  const [billingCycle, setBillingCycle] = useState("yearly");

  // Plans data - matches API route and billing page pricing
  const plans = {
    basic: {
      id: "basic",
      name: "Basic Plan",
      description: "Perfect for owner-operators with 1 truck",
      monthlyPrice: 20,
      yearlyPrice: 16,
      yearlyTotal: 192,
      savings: 48,
      features: [
        "Basic Invoicing & Dispatching",
        "Simple Expense Tracking",
        "Standard Reports",
        "Single User Account",
        "Email Support"
      ]
    },
    premium: {
      id: "premium",
      name: "Premium Plan",
      description: "Ideal for owner-operators with 1-2 trucks",
      monthlyPrice: 35,
      yearlyPrice: 28,
      yearlyTotal: 336,
      savings: 84,
      features: [
        "Advanced Invoicing & Dispatching",
        "Comprehensive Expense Tracking",
        "Advanced Reports & Analytics",
        "Customer Management System",
        "Advanced IFTA Calculator",
        "Priority Email Support"
      ]
    },
    fleet: {
      id: "fleet",
      name: "Fleet Plan",
      description: "For small fleets with 3-8 trucks",
      monthlyPrice: 75,
      yearlyPrice: 60,
      yearlyTotal: 720,
      savings: 180,
      features: [
        "All Premium Features",
        "Fleet Management Tools",
        "Real-time GPS Tracking",
        "Team Access (1 User per 2 Trucks)",
        "Fuel & Load Optimizations",
        "Priority Phone Support"
      ]
    }
  };

  // Load data from URL params
  useEffect(() => {
    const plan = searchParams.get("plan") || "premium";
    const cycle = searchParams.get("cycle") || "yearly";

    setPlanId(plan);
    setBillingCycle(cycle);

    if (user) {
      setLoading(false);
    }
  }, [searchParams, user]);

  // Handle checkout process
  const handleCheckout = async () => {
    if (!user || !planId || processingPayment) return;

    try {
      setProcessingPayment(true);
      setErrorMessage(null);

      // Store user ID in localStorage for the success page
      localStorage.setItem('userId', user.id);
      sessionStorage.setItem('userId', user.id);

      // Create checkout ID to prevent duplicates
      const checkoutId = `checkout_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      localStorage.setItem('lastCheckoutId', checkoutId);

      // Call API to create Stripe checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          plan: planId,
          billingCycle,
          checkoutId,
          returnUrl: `${window.location.origin}/dashboard/billing/success`
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Server error: ${response.status}`);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      if (!data.url) {
        throw new Error('No checkout URL returned from server');
      }

      // Save additional information to help with recovery if needed
      sessionStorage.setItem('checkout_timestamp', Date.now().toString());
      sessionStorage.setItem('checkout_plan', planId);
      sessionStorage.setItem('checkout_billing_cycle', billingCycle);

      // Redirect to Stripe Checkout
      window.location.href = data.url;

    } catch (err) {
      setErrorMessage(err.message || 'An unknown error occurred during checkout');
      setProcessingPayment(false);
      localStorage.removeItem('lastCheckoutId');
    }
  };

  // Get the selected plan details
  const selectedPlan = plans[planId] || plans.premium;

  // Calculate pricing based on selected plan and billing cycle
  const planPrice = billingCycle === 'yearly' ? selectedPlan.yearlyPrice : selectedPlan.monthlyPrice;
  const totalAmount = billingCycle === 'yearly' ? selectedPlan.yearlyTotal : selectedPlan.monthlyPrice;
  const billingText = billingCycle === 'yearly' ? 'year' : 'month';

  // Loading state
  if (loading) {
    return (
      <DashboardLayout activePage="billing">
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
          <div className="flex items-center justify-center min-h-screen">
            <div className="flex flex-col items-center">
              <RefreshCw size={40} className="animate-spin text-blue-600 dark:text-blue-400 mb-4" />
              <p className="text-lg text-gray-700 dark:text-gray-300">Loading checkout details...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activePage="billing">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200 py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-700 dark:to-blue-600 rounded-xl shadow-lg p-6 mb-8">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <CreditCard className="h-6 w-6" />
              Complete Your Order
            </h1>
            <p className="text-blue-100 mt-1">Review your order and proceed to payment</p>
          </div>

          {/* Error message */}
          {errorMessage && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400 mr-3 flex-shrink-0" />
                <p className="text-red-800 dark:text-red-200">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left side: Order Summary */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-200">
                <div className="p-6">
                  {/* Back button */}
                  <div className="mb-6">
                    <button
                      onClick={() => router.push('/dashboard/billing')}
                      className="flex items-center text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      <ChevronLeft size={18} className="mr-1" />
                      Back to Plans
                    </button>
                  </div>

                  {/* Selected Plan Details */}
                  <div className="flex flex-col md:flex-row gap-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg mb-8">
                    <div className="md:w-3/5">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{selectedPlan.name}</h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">{selectedPlan.description}</p>

                      <div className="space-y-2">
                        {selectedPlan.features.slice(0, 4).map((feature, index) => (
                          <div key={index} className="flex items-start">
                            <CheckCircle size={16} className="text-emerald-500 dark:text-emerald-400 mr-2 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700 dark:text-gray-300 text-sm">{feature}</span>
                          </div>
                        ))}
                        {selectedPlan.features.length > 4 && (
                          <div className="text-blue-600 dark:text-blue-400 text-sm font-medium">
                            +{selectedPlan.features.length - 4} more features
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="md:w-2/5 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                      <div className="flex justify-between mb-4">
                        <span className="text-gray-700 dark:text-gray-300">Plan</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">{selectedPlan.name}</span>
                      </div>

                      <div className="flex justify-between mb-4">
                        <span className="text-gray-700 dark:text-gray-300">Billing</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100 capitalize">{billingCycle}</span>
                      </div>

                      <div className="flex justify-between mb-2">
                        <span className="text-gray-700 dark:text-gray-300">Price</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">${planPrice}/month</span>
                      </div>

                      {billingCycle === 'yearly' && (
                        <div className="flex justify-between mb-4 text-sm">
                          <span className="text-emerald-600 dark:text-emerald-400">Annual Savings</span>
                          <span className="font-medium text-emerald-600 dark:text-emerald-400">${selectedPlan.savings}</span>
                        </div>
                      )}

                      <div className="border-t border-gray-200 dark:border-gray-600 pt-4 mt-2">
                        <div className="flex justify-between">
                          <span className="text-gray-900 dark:text-gray-100 font-semibold">Total today</span>
                          <span className="text-xl font-bold text-gray-900 dark:text-gray-100">${totalAmount}</span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Billed {billingCycle === 'yearly' ? 'annually' : 'monthly'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Payment method details */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Billing Information</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      You&#39;ll be redirected to our secure payment processor to complete your purchase.
                    </p>

                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-4">
                      <Lock size={16} className="text-gray-500 dark:text-gray-400 mr-2" />
                      <span>Your payment information is encrypted and secure</span>
                    </div>

                    <div className="flex items-center mb-4">
                      <div className="flex space-x-2">
                        <div className="w-12 h-8 bg-blue-100 dark:bg-blue-900/30 rounded flex items-center justify-center text-blue-800 dark:text-blue-300 font-bold text-sm">VISA</div>
                        <div className="w-12 h-8 bg-blue-100 dark:bg-blue-900/30 rounded flex items-center justify-center text-blue-800 dark:text-blue-300 font-bold text-sm">MC</div>
                        <div className="w-12 h-8 bg-blue-100 dark:bg-blue-900/30 rounded flex items-center justify-center text-blue-800 dark:text-blue-300 font-bold text-sm">AMEX</div>
                      </div>
                    </div>
                  </div>

                  {/* Terms and policies */}
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-6 mb-6">
                    <p className="mb-2">
                      By clicking &quot;Complete Checkout&quot;, you agree to our{" "}
                      <Link href="/terms" className="text-blue-600 dark:text-blue-400 hover:underline">Terms of Service</Link>{" "}
                      and{" "}
                      <Link href="/privacy" className="text-blue-600 dark:text-blue-400 hover:underline">Privacy Policy</Link>.
                    </p>
                    <p>
                      You can cancel your subscription at any time from your account settings.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side: Order details and checkout button */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-4 sticky top-6 transition-colors duration-200">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Order Summary</h3>

                <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600 dark:text-gray-400">{selectedPlan.name}</span>
                    <span className="text-gray-900 dark:text-gray-100">${planPrice}/mo</span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Billing</span>
                    <span className="text-gray-900 dark:text-gray-100 capitalize">{billingCycle}</span>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-900 dark:text-gray-100 font-semibold">Total due today</span>
                    <span className="text-xl font-bold text-gray-900 dark:text-gray-100">${totalAmount}</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    You&#39;ll be charged ${totalAmount} for your first {billingText}.
                  </p>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={processingPayment}
                  className={`w-full py-3 px-4 rounded-lg text-white font-medium flex items-center justify-center transition-colors ${
                    processingPayment
                      ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
                  }`}
                >
                  {processingPayment ? (
                    <>
                      <RefreshCw size={20} className="animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard size={20} className="mr-2" />
                      Complete Checkout
                    </>
                  )}
                </button>

                <div className="mt-4 flex items-center justify-center text-sm text-gray-600 dark:text-gray-400">
                  <ShieldCheck size={16} className="text-emerald-500 dark:text-emerald-400 mr-1" />
                  <span>30-day money back guarantee</span>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800 transition-colors duration-200">
                <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2 flex items-center">
                  <Shield size={16} className="mr-2" />
                  100% Secure Checkout
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Your payment information is processed securely through our payment provider. We never store your credit card details.
                </p>
              </div>
            </div>
          </div>

          {/* Help section */}
          <div className="mt-12 text-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Need help?</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Our team is available to answer any questions</p>
            <div className="flex justify-center space-x-4">
              <Link
                href="/contact"
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Contact Support
              </Link>
              <Link
                href="/faq"
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                FAQ
              </Link>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
