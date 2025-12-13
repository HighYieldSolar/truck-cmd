"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useSubscription } from "@/context/SubscriptionContext";
import {
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  CreditCard,
  Check,
  X,
  Zap,
  Star,
  Shield,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  Loader2,
  Calendar
} from "lucide-react";

export default function UpgradePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  // Initialize billing cycle from sessionStorage to maintain state across navigation
  const [billingCycle, setBillingCycle] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('checkout_billing_cycle') || 'monthly';
    }
    return 'monthly';
  });
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [expandedFaq, setExpandedFaq] = useState(null);

  // Plan change state (kept for loading indicator if needed)
  const [planChangeLoading, setPlanChangeLoading] = useState(false);

  // Get subscription context for user info
  const {
    user,
    subscription,
    loading: subscriptionLoading,
    isSubscriptionActive,
    isTrialActive,
    getDaysLeftInTrial,
    refreshSubscription
  } = useSubscription();

  // Plans data - matches tierConfig.js
  const plans = {
    basic: {
      id: "basic",
      name: "Basic",
      description: "For owner-operators just getting started",
      monthlyPrice: 20,
      yearlyPrice: 16,
      yearlyTotal: 192,
      savings: 48,
      limits: "1 Truck • 1 Driver • 50 Loads/mo",
      features: [
        "Load management & dispatching",
        "Basic invoicing (50/month)",
        "Expense tracking",
        "Customer management (50 max)",
        "Fuel logging",
        "PDF exports",
        "Email support"
      ],
      notIncluded: [
        "Compliance tracking",
        "IFTA Calculator",
        "State Mileage Tracker",
        "Maintenance scheduling"
      ]
    },
    premium: {
      id: "premium",
      name: "Premium",
      description: "For growing owner-operators",
      monthlyPrice: 35,
      yearlyPrice: 28,
      yearlyTotal: 336,
      savings: 84,
      limits: "3 Trucks • 3 Drivers • Unlimited Loads",
      features: [
        "Everything in Basic, plus:",
        "Compliance tracking & alerts",
        "IFTA Calculator",
        "State Mileage Tracker",
        "Unlimited loads & invoices",
        "Unlimited customers",
        "Fuel receipt uploads",
        "Email notifications"
      ],
      notIncluded: [
        "Maintenance scheduling",
        "Fleet reports",
        "SMS notifications"
      ],
      recommended: true
    },
    fleet: {
      id: "fleet",
      name: "Fleet",
      description: "For small to medium fleets",
      monthlyPrice: 75,
      yearlyPrice: 60,
      yearlyTotal: 720,
      savings: 180,
      limits: "12 Trucks • 12 Drivers • 6 Team Users",
      features: [
        "Everything in Premium, plus:",
        "Maintenance scheduling",
        "Advanced fleet reports",
        "SMS notifications",
        "Quiet hours for notifications",
        "CSV & Excel exports",
        "Priority phone support"
      ]
    }
  };

  // FAQ data
  const faqs = [
    {
      question: "Can I change my plan later?",
      answer: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle."
    },
    {
      question: "What forms of payment do you accept?",
      answer: "We accept all major credit cards, including Visa, Mastercard, American Express, and Discover."
    },
    {
      question: "Is there a setup fee?",
      answer: "No, there are no setup fees. You only pay for your subscription plan."
    },
    {
      question: "Can I cancel anytime?",
      answer: "Yes, you can cancel your subscription at any time. You'll have access to your plan until the end of your current billing period."
    }
  ];

  // Load user data
  useEffect(() => {
    if (!subscriptionLoading) {
      setLoading(false);
    }
  }, [subscriptionLoading]);

  // Handle plan selection
  const handleSelectPlan = (planId) => {
    setSelectedPlan(planId);
    // Store checkout info in sessionStorage for success page
    sessionStorage.setItem('checkout_plan', planId);
    sessionStorage.setItem('checkout_billing_cycle', billingCycle);
    router.push(`/dashboard/upgrade/${planId}`);
  };

  // Toggle billing cycle and save to sessionStorage
  const toggleBillingCycle = () => {
    const newCycle = billingCycle === 'monthly' ? 'yearly' : 'monthly';
    setBillingCycle(newCycle);
    sessionStorage.setItem('checkout_billing_cycle', newCycle);
  };

  // Toggle FAQ
  const toggleFaq = (index) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  // Plan order for upgrade/downgrade detection
  const planOrder = ['basic', 'premium', 'fleet'];

  // Get change type (upgrade/downgrade/same)
  const getChangeType = (currentPlan, targetPlan) => {
    const currentIndex = planOrder.indexOf(currentPlan?.toLowerCase());
    const targetIndex = planOrder.indexOf(targetPlan?.toLowerCase());
    if (targetIndex > currentIndex) return 'upgrade';
    if (targetIndex < currentIndex) return 'downgrade';
    return 'same';
  };

  // Check if user has active subscription
  const hasActiveSubscription = isSubscriptionActive && isSubscriptionActive();
  const currentPlan = subscription?.plan?.toLowerCase();
  const currentBillingCycle = subscription?.billing_cycle || 'monthly';

  // Check if this is the exact same plan AND billing cycle
  const isExactCurrentPlan = (planId) => {
    return currentPlan === planId && currentBillingCycle === billingCycle;
  };

  // Check if same plan but different billing cycle
  const isBillingCycleChange = (planId) => {
    return currentPlan === planId && currentBillingCycle !== billingCycle;
  };

  // Handle plan change for existing subscribers
  const handlePlanChange = async (targetPlanId) => {
    if (!hasActiveSubscription) {
      // New subscription - go to upgrade checkout
      sessionStorage.setItem('checkout_plan', targetPlanId);
      sessionStorage.setItem('checkout_billing_cycle', billingCycle);
      router.push(`/dashboard/upgrade/${targetPlanId}`);
      return;
    }

    // Determine if upgrade or downgrade
    const changeType = getChangeType(currentPlan, targetPlanId);

    if (changeType === 'upgrade') {
      // Upgrade - go to upgrade checkout
      sessionStorage.setItem('checkout_plan', targetPlanId);
      sessionStorage.setItem('checkout_billing_cycle', billingCycle);
      router.push(`/dashboard/upgrade/${targetPlanId}`);
    } else if (changeType === 'downgrade') {
      // Downgrade - go to downgrade page (also pass billing cycle)
      sessionStorage.setItem('checkout_billing_cycle', billingCycle);
      router.push(`/dashboard/downgrade/${targetPlanId}`);
    } else if (changeType === 'same' && isBillingCycleChange(targetPlanId)) {
      // Same plan but different billing cycle
      sessionStorage.setItem('checkout_plan', targetPlanId);
      sessionStorage.setItem('checkout_billing_cycle', billingCycle);
      // Yearly is an upgrade (saves money), monthly is a downgrade (costs more per month)
      if (billingCycle === 'yearly') {
        router.push(`/dashboard/upgrade/${targetPlanId}`);
      } else {
        router.push(`/dashboard/downgrade/${targetPlanId}`);
      }
    }
  };

  // Get subscription status info
  const getSubscriptionInfo = () => {
    if (isSubscriptionActive && isSubscriptionActive()) {
      // Check if subscription is pending cancellation
      if (subscription?.cancel_at_period_end) {
        return {
          status: 'canceled',
          label: 'Canceling Soon',
          color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
        };
      }
      // Check if there's a scheduled plan change
      if (subscription?.scheduled_plan && subscription.scheduled_plan !== subscription?.plan) {
        return {
          status: 'scheduled',
          label: `Changing to ${subscription.scheduled_plan.charAt(0).toUpperCase() + subscription.scheduled_plan.slice(1)}`,
          color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
        };
      }
      return {
        status: 'active',
        label: 'Active Subscription',
        color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
      };
    } else if (isTrialActive && isTrialActive()) {
      const daysLeft = getDaysLeftInTrial ? getDaysLeftInTrial() : 0;
      return {
        status: 'trial',
        label: `${daysLeft} days left in trial`,
        color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
      };
    }
    return null;
  };

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return '';
    }
  };

  const subscriptionInfo = getSubscriptionInfo();

  // Show loading state
  if (loading) {
    return (
      <DashboardLayout activePage="upgrade">
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
          <div className="flex items-center justify-center min-h-screen">
            <div className="flex flex-col items-center">
              <RefreshCw size={40} className="animate-spin text-blue-600 dark:text-blue-400 mb-4" />
              <p className="text-lg text-gray-700 dark:text-gray-300">Loading subscription details...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activePage="upgrade">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header with gradient background */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-700 dark:to-blue-600 rounded-xl shadow-lg p-6 mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  <CreditCard className="h-6 w-6" />
                  Choose Your Plan
                </h1>
                <p className="text-blue-100 mt-1">
                  Select the perfect plan for your trucking business. All plans include a 30-day money-back guarantee.
                </p>
              </div>
              {subscriptionInfo && (
                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${subscriptionInfo.color}`}>
                  {subscriptionInfo.status === 'active' && (
                    <CheckCircle className="h-4 w-4 mr-1.5" />
                  )}
                  {subscriptionInfo.status === 'canceled' && (
                    <AlertTriangle className="h-4 w-4 mr-1.5" />
                  )}
                  {subscriptionInfo.status === 'scheduled' && (
                    <ArrowRight className="h-4 w-4 mr-1.5" />
                  )}
                  {subscriptionInfo.status === 'trial' && (
                    <Zap className="h-4 w-4 mr-1.5" />
                  )}
                  {subscriptionInfo.label}
                </span>
              )}
            </div>
          </div>

          {/* Success/error messages */}
          {successMessage && (
            <div className="mb-6 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-emerald-500 dark:text-emerald-400 mr-3 flex-shrink-0" />
                <p className="text-emerald-800 dark:text-emerald-200">{successMessage}</p>
                <button
                  onClick={() => setSuccessMessage(null)}
                  className="ml-auto p-1 text-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-200 rounded transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400 mr-3 flex-shrink-0" />
                <p className="text-red-800 dark:text-red-200">{errorMessage}</p>
                <button
                  onClick={() => setErrorMessage(null)}
                  className="ml-auto p-1 text-red-400 hover:text-red-600 dark:hover:text-red-200 rounded transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Current subscription info box - shows for trial OR active subscription */}
          {(subscriptionInfo) && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6 transition-colors duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                {/* Trial State */}
                {subscriptionInfo.status === 'trial' && (
                  <>
                    <div className="flex items-center">
                      <div className="w-9 h-9 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                        <Zap size={18} className="text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                          Free Trial
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {getDaysLeftInTrial ? getDaysLeftInTrial() : 0} days remaining • Full access to Basic features
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="hidden sm:flex w-24 bg-blue-100 dark:bg-blue-900/50 rounded-full h-1.5">
                        <div
                          className="bg-blue-500 h-1.5 rounded-full"
                          style={{ width: `${Math.max(10, ((getDaysLeftInTrial ? getDaysLeftInTrial() : 0) / 7) * 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Select a plan below to upgrade
                      </span>
                    </div>
                  </>
                )}

                {/* Active Subscription State */}
                {subscriptionInfo.status === 'active' && (
                  <>
                    <div className="flex items-center">
                      <div className="w-9 h-9 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                        <CheckCircle size={18} className="text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 capitalize">
                            {subscription?.plan || 'Premium'} Plan
                          </h3>
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                            Active
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Billed {subscription?.billing_cycle === 'yearly' ? 'annually' : 'monthly'} •
                          ${subscription?.billing_cycle === 'yearly'
                            ? plans[subscription?.plan]?.yearlyPrice || 28
                            : plans[subscription?.plan]?.monthlyPrice || 35}/mo
                        </p>
                      </div>
                    </div>
                    <button
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white text-sm rounded-lg transition-colors flex items-center justify-center font-medium"
                      onClick={() => router.push('/dashboard/settings/billing')}
                    >
                      <CreditCard size={16} className="mr-1.5" />
                      Manage
                    </button>
                  </>
                )}

                {/* Canceled Subscription State */}
                {subscriptionInfo.status === 'canceled' && (
                  <>
                    <div className="flex items-center">
                      <div className="w-9 h-9 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                        <AlertTriangle size={18} className="text-orange-600 dark:text-orange-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 capitalize">
                            {subscription?.plan || 'Premium'} Plan
                          </h3>
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400">
                            Canceling
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Access until {formatDate(subscription?.current_period_ends_at || subscription?.currentPeriodEndsAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white text-sm rounded-lg transition-colors flex items-center justify-center font-medium"
                        onClick={() => router.push('/dashboard/settings/billing')}
                      >
                        <RefreshCw size={16} className="mr-1.5" />
                        Keep My Plan
                      </button>
                      <button
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded-lg transition-colors flex items-center justify-center font-medium"
                        onClick={() => {
                          const plansSection = document.getElementById('plans');
                          if (plansSection) {
                            plansSection.scrollIntoView({ behavior: 'smooth' });
                          }
                        }}
                      >
                        Change Plan
                      </button>
                    </div>
                  </>
                )}

                {/* Scheduled Plan Change State */}
                {subscriptionInfo.status === 'scheduled' && (
                  <>
                    <div className="flex items-center">
                      <div className="w-9 h-9 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                        <Calendar size={18} className="text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 capitalize">
                            {subscription?.plan || 'Premium'} Plan
                          </h3>
                          <ArrowRight size={14} className="text-gray-400" />
                          <span className="text-base font-semibold text-blue-600 dark:text-blue-400 capitalize">
                            {subscription?.scheduled_plan}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Changes on {formatDate(subscription?.current_period_ends_at || subscription?.currentPeriodEndsAt)}
                        </p>
                      </div>
                    </div>
                    <button
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white text-sm rounded-lg transition-colors flex items-center justify-center font-medium"
                      onClick={() => router.push('/dashboard/settings/billing')}
                    >
                      <CreditCard size={16} className="mr-1.5" />
                      Manage
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Billing cycle toggle */}
          <div className="flex flex-col items-center justify-center mb-10" id="plans">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <span className={`text-base font-medium transition-colors ${
                billingCycle === 'monthly'
                  ? 'text-gray-900 dark:text-gray-100'
                  : 'text-gray-500 dark:text-gray-400'
              }`}>
                Monthly
              </span>

              <button
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${
                  billingCycle === 'yearly' ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
                onClick={toggleBillingCycle}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                    billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>

              <span className={`text-base font-medium transition-colors ${
                billingCycle === 'yearly'
                  ? 'text-gray-900 dark:text-gray-100'
                  : 'text-gray-500 dark:text-gray-400'
              }`}>
                Yearly
              </span>
            </div>

            <div className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 px-4 py-1.5 rounded-full text-sm font-medium">
              Save up to 20% with yearly billing
            </div>
          </div>

          {/* Plan cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {Object.values(plans).map((plan) => (
              <div
                key={plan.id}
                className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border-2 overflow-hidden transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1 relative flex flex-col ${
                  selectedPlan === plan.id
                    ? 'border-blue-500 dark:border-blue-400'
                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
                }`}
              >
                {plan.recommended && (
                  <div className="absolute top-4 right-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-orange-500 text-white">
                      <Star className="h-3 w-3 mr-1" />
                      Popular
                    </span>
                  </div>
                )}

                <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-700/30">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">{plan.name}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">{plan.description}</p>

                  {/* Resource limits badge */}
                  {plan.limits && (
                    <div className="inline-flex items-center px-2.5 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full mb-3">
                      {plan.limits}
                    </div>
                  )}

                  <div className="flex items-baseline mb-1">
                    <span className="text-4xl font-bold text-gray-900 dark:text-gray-100">
                      ${billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400 ml-1">/month</span>
                  </div>

                  {billingCycle === 'yearly' && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Billed annually at ${plan.yearlyTotal}
                      <span className="ml-2 text-emerald-600 dark:text-emerald-400 font-medium">Save ${plan.savings}</span>
                    </p>
                  )}

                  {billingCycle === 'monthly' && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Billed monthly
                    </p>
                  )}

                  {/* Dynamic button based on subscription status */}
                  {hasActiveSubscription && isExactCurrentPlan(plan.id) ? (
                    <div className="w-full py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg text-center font-medium flex items-center justify-center">
                      <CheckCircle size={16} className="mr-2" />
                      Current Plan
                    </div>
                  ) : hasActiveSubscription && isBillingCycleChange(plan.id) ? (
                    <button
                      onClick={() => handlePlanChange(plan.id)}
                      className="w-full py-2.5 rounded-lg transition-colors font-medium flex items-center justify-center text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                    >
                      {billingCycle === 'yearly' ? (
                        <>
                          <ArrowUp size={16} className="mr-1.5" />
                          Switch to Yearly
                        </>
                      ) : (
                        <>
                          <ArrowDown size={16} className="mr-1.5" />
                          Switch to Monthly
                        </>
                      )}
                    </button>
                  ) : hasActiveSubscription ? (
                    <button
                      onClick={() => handlePlanChange(plan.id)}
                      className="w-full py-2.5 rounded-lg transition-colors font-medium flex items-center justify-center text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                    >
                      {getChangeType(currentPlan, plan.id) === 'upgrade' ? (
                        <>
                          <ArrowUp size={16} className="mr-1.5" />
                          Upgrade to {plan.name}
                        </>
                      ) : (
                        <>
                          <ArrowDown size={16} className="mr-1.5" />
                          Downgrade to {plan.name}
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={() => handlePlanChange(plan.id)}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg transition-colors font-medium"
                    >
                      Select Plan
                    </button>
                  )}
                </div>

                <div className="p-6 flex-1">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-4">What&apos;s included:</h4>
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Check size={18} className="text-emerald-500 dark:text-emerald-400 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {plan.notIncluded && (
                    <>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mt-6 mb-4">Not included:</h4>
                      <ul className="space-y-3">
                        {plan.notIncluded.map((feature, index) => (
                          <li key={index} className="flex items-start opacity-60">
                            <X size={18} className="text-gray-400 dark:text-gray-500 mr-2 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-600 dark:text-gray-400 text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* FAQ Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-200">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                <HelpCircle className="h-5 w-5 mr-2 text-blue-500 dark:text-blue-400" />
                Frequently Asked Questions
              </h2>
            </div>

            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {faqs.map((faq, index) => (
                <div key={index} className="transition-colors">
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <h3 className="text-base font-medium text-gray-900 dark:text-gray-100">{faq.question}</h3>
                    {expandedFaq === index ? (
                      <ChevronUp className="h-5 w-5 text-gray-500 dark:text-gray-400 flex-shrink-0 ml-4" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-500 dark:text-gray-400 flex-shrink-0 ml-4" />
                    )}
                  </button>
                  {expandedFaq === index && (
                    <div className="px-6 pb-4">
                      <p className="text-gray-600 dark:text-gray-400">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Security badge */}
          <div className="mt-8 text-center">
            <div className="inline-flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-full">
              <Shield className="h-5 w-5 text-emerald-500 dark:text-emerald-400 mr-2" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Secure payment processing powered by Stripe
              </span>
            </div>
          </div>
        </div>
      </div>

    </DashboardLayout>
  );
}
