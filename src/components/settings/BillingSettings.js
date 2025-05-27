"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useSubscription } from "@/context/SubscriptionContext";
import Link from "next/link";
import {
  RefreshCw,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Calendar,
  Clock,
  Download,
  DollarSign,
  ArrowRight,
  FileText,
  Shield,
  CreditCard as CardIcon,
  Zap,
  X,
  ExternalLink,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Settings,
  AlertTriangle
} from "lucide-react";

export default function BillingSettings() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [billingHistory, setBillingHistory] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [loadingBilling, setLoadingBilling] = useState(false);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [expandedSection, setExpandedSection] = useState("subscription");
  const [canceling, setCanceling] = useState(false);

  // Get subscription context data
  const {
    subscription,
    loading: subscriptionLoading,
    isTrialActive,
    isSubscriptionActive,
    getDaysLeftInTrial,
    refreshSubscription
  } = useSubscription();

  // Updated pricing structure to match billing dashboard
  const getPlanDetails = (plan) => {
    const planData = {
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

    return planData[plan] || planData.premium;
  };

  // Load user data and subscription details
  useEffect(() => {
    async function loadUserData() {
      try {
        setLoading(true);

        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError) throw userError;

        if (!user) {
          window.location.href = '/login';
          return;
        }

        setUser(user);

        // Load additional billing data if user has active subscription
        if (subscription?.status === 'active') {
          await Promise.all([
            loadBillingHistory(user.id),
            loadPaymentMethod(user.id)
          ]);
        }

      } catch (error) {
        console.error('Error loading user data:', error);
        setErrorMessage('Failed to load your billing information. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    if (!subscriptionLoading) {
      loadUserData();
    }
  }, [subscription, subscriptionLoading]);

  // Load billing history from Stripe
  const loadBillingHistory = async (userId) => {
    try {
      setLoadingBilling(true);

      const response = await fetch('/api/get-billing-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      const result = await response.json();

      if (result.success) {
        setBillingHistory(result.invoices || []);
      } else {
        console.error('Error loading billing history:', result.error);
      }
    } catch (error) {
      console.error('Error loading billing history:', error);
    } finally {
      setLoadingBilling(false);
    }
  };

  // Load payment method from Stripe
  const loadPaymentMethod = async (userId) => {
    try {
      setLoadingPayment(true);

      const response = await fetch('/api/get-payment-method', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      const result = await response.json();

      if (result.success) {
        setPaymentMethod(result.paymentMethod);
      } else {
        console.error('Error loading payment method:', result.error);
      }
    } catch (error) {
      console.error('Error loading payment method:', error);
    } finally {
      setLoadingPayment(false);
    }
  };

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';

    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  // Format currency helper
  const formatCurrency = (amount) => {
    if (typeof amount !== 'number') return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount / 100); // Stripe amounts are in cents
  };

  // Get subscription status
  const getSubscriptionStatus = () => {
    if (subscription?.status === 'active' && isSubscriptionActive()) {
      return 'active';
    } else if (subscription?.status === 'trial' && isTrialActive()) {
      return 'trial';
    } else if (subscription?.status === 'canceled') {
      return 'canceled';
    } else {
      return 'inactive';
    }
  };

  // Get status styling
  const getStatusLabel = () => {
    const status = getSubscriptionStatus();

    const statusMap = {
      active: { label: 'Active', color: 'text-green-600 bg-green-100' },
      trial: { label: 'Trial', color: 'text-blue-600 bg-blue-100' },
      canceled: { label: 'Canceled', color: 'text-orange-600 bg-orange-100' },
      inactive: { label: 'Inactive', color: 'text-red-600 bg-red-100' }
    };

    return statusMap[status] || statusMap.inactive;
  };

  // Toggle section expand/collapse
  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  // Handle subscription refresh
  const handleRefreshSubscription = async () => {
    refreshSubscription();

    if (subscription?.status === 'active') {
      await Promise.all([
        loadBillingHistory(user.id),
        loadPaymentMethod(user.id)
      ]);
    }

    setSuccessMessage("Subscription information refreshed successfully");
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Handle Stripe portal access
  const handleStripePortal = async () => {
    try {
      const response = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          returnUrl: `${window.location.origin}/dashboard/settings/billing`
        }),
      });

      const result = await response.json();

      if (result.url) {
        window.location.href = result.url;
      } else {
        setErrorMessage('Unable to open billing portal. Please try again.');
      }
    } catch (error) {
      console.error('Error opening Stripe portal:', error);
      setErrorMessage('Unable to open billing portal. Please try again.');
    }
  };

  // Handle subscription cancellation
  const handleCancelSubscription = async () => {
    if (!window.confirm('Are you sure you want to cancel your subscription? You will still have access until the end of your current billing period.')) {
      return;
    }

    try {
      setCanceling(true);

      const response = await fetch('/api/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccessMessage('Your subscription has been canceled. You will retain access until the end of your current billing period.');
        refreshSubscription();
      } else {
        setErrorMessage(result.error || 'Failed to cancel subscription. Please try again.');
      }
    } catch (error) {
      console.error('Error canceling subscription:', error);
      setErrorMessage('Failed to cancel subscription. Please try again.');
    } finally {
      setCanceling(false);
    }
  };

  if (loading || subscriptionLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw size={32} className="animate-spin text-blue-600" />
        <span className="ml-2 text-gray-700">Loading billing information...</span>
      </div>
    );
  }

  const statusInfo = getStatusLabel();
  const subscriptionStatus = getSubscriptionStatus();
  const daysLeft = getDaysLeftInTrial ? getDaysLeftInTrial() : 0;
  const planDetails = getPlanDetails(subscription?.plan);

  return (
    <div>
      {/* Success/Error Messages */}
      {successMessage && (
        <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-md">
          <div className="flex items-start">
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3" />
            <span className="text-green-800">{successMessage}</span>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3" />
            <span className="text-red-800">{errorMessage}</span>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-400 rounded-lg shadow-sm p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <h2 className="text-2xl font-bold text-white">Billing & Subscription</h2>

          <div className="mt-3 md:mt-0 flex items-center space-x-3">
            <button
              onClick={handleRefreshSubscription}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <RefreshCw size={16} className="mr-1.5" />
              Refresh
            </button>

            <Link
              href="/dashboard/billing"
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              <CreditCard size={16} className="mr-1.5" />
              View All Plans
            </Link>
          </div>
        </div>
      </div>

      {/* Current Subscription Section */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden mb-6">
        <div
          className="flex items-center justify-between px-6 py-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => toggleSection('subscription')}
        >
          <div className="flex items-center">
            <Zap size={20} className="text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Current Subscription</h3>
          </div>
          <div className="flex items-center space-x-3">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
            {expandedSection === 'subscription' ?
              <ChevronUp size={20} className="text-gray-500" /> :
              <ChevronDown size={20} className="text-gray-500" />
            }
          </div>
        </div>

        {expandedSection === 'subscription' && (
          <div className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-6">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <h4 className="text-xl font-semibold text-gray-900">{planDetails.name}</h4>
                  {planDetails.id === 'premium' && (
                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                      Popular
                    </span>
                  )}
                </div>

                <p className="text-gray-600 mb-2">{planDetails.description}</p>

                <div className="flex items-baseline mb-3">
                  <span className="text-2xl font-bold text-gray-900">
                    ${subscription?.billing_cycle === 'yearly' ? planDetails.yearlyPrice : planDetails.monthlyPrice}
                  </span>
                  <span className="text-gray-600 ml-1">/month</span>
                  {subscription?.billing_cycle === 'yearly' && (
                    <span className="ml-2 text-sm text-green-600 font-medium">
                      Save ${planDetails.savings}/year
                    </span>
                  )}
                </div>

                {subscription?.billing_cycle === 'yearly' && (
                  <p className="text-sm text-gray-600 mb-4">
                    Billed annually at ${planDetails.yearlyTotal}
                  </p>
                )}

                {/* Status-specific information */}
                {subscriptionStatus === 'trial' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center text-blue-700 mb-2">
                      <Clock size={16} className="mr-1.5" />
                      <span className="font-medium">{daysLeft} days left in your trial</span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.max(5, (daysLeft / 7) * 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-blue-600">
                      Upgrade now to continue using all features without interruption.
                    </p>
                  </div>
                )}

                {subscriptionStatus === 'active' && subscription?.current_period_ends_at && (
                  <div className="flex items-center text-gray-600 mb-4">
                    <Calendar size={16} className="mr-1.5" />
                    <span>Next billing date: <span className="font-medium">{formatDate(subscription.current_period_ends_at)}</span></span>
                  </div>
                )}

                {subscriptionStatus === 'canceled' && subscription?.current_period_ends_at && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center text-orange-700 mb-2">
                      <AlertTriangle size={16} className="mr-1.5" />
                      <span className="font-medium">Subscription Canceled</span>
                    </div>
                    <p className="text-sm text-orange-600">
                      You will retain access until <span className="font-medium">{formatDate(subscription.current_period_ends_at)}</span>
                    </p>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="mt-6 lg:mt-0 lg:ml-6 flex flex-col space-y-3 lg:items-end">
                {subscriptionStatus === 'active' && (
                  <>
                    <button
                      onClick={handleStripePortal}
                      className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors w-full lg:w-auto"
                    >
                      <Settings size={18} className="mr-2" />
                      Manage Subscription
                    </button>

                    <button
                      onClick={handleCancelSubscription}
                      disabled={canceling}
                      className="inline-flex items-center justify-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 transition-colors w-full lg:w-auto disabled:opacity-50"
                    >
                      {canceling ? (
                        <RefreshCw size={18} className="mr-2 animate-spin" />
                      ) : (
                        <X size={18} className="mr-2" />
                      )}
                      Cancel Subscription
                    </button>

                    <span className="text-xs text-gray-500 text-center lg:text-right">
                      Change plan, billing cycle, or payment method
                    </span>
                  </>
                )}

                {(subscriptionStatus === 'trial' || subscriptionStatus === 'inactive') && (
                  <>
                    <Link
                      href="/dashboard/billing"
                      className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors w-full lg:w-auto"
                    >
                      <CreditCard size={18} className="mr-2" />
                      {subscriptionStatus === 'trial' ? 'Upgrade Plan' : 'Choose a Plan'}
                    </Link>
                    <span className="text-xs text-gray-500 text-center lg:text-right">
                      {subscriptionStatus === 'trial'
                        ? 'Upgrade now to continue using all features'
                        : 'Subscribe to access premium features'
                      }
                    </span>
                  </>
                )}

                {subscriptionStatus === 'canceled' && (
                  <>
                    <Link
                      href="/dashboard/billing"
                      className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors w-full lg:w-auto"
                    >
                      <Zap size={18} className="mr-2" />
                      Renew Subscription
                    </Link>
                    <span className="text-xs text-gray-500 text-center lg:text-right">Your plan will expire soon</span>
                  </>
                )}
              </div>
            </div>

            {/* Plan Features */}
            <div className="pt-6 border-t border-gray-200">
              <h5 className="text-sm font-medium text-gray-700 mb-3">Included in your plan:</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-6">
                {planDetails.features.map((feature, index) => (
                  <div key={index} className="flex items-center text-sm text-gray-600">
                    <CheckCircle size={16} className="text-green-500 mr-2 flex-shrink-0" />
                    {feature}
                  </div>
                ))}
              </div>

              <div className="flex justify-center">
                <Link
                  href="/dashboard/billing"
                  className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
                >
                  Compare all plans
                  <ChevronRight size={16} className="ml-1" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Payment Method Section */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden mb-6">
        <div
          className="flex items-center justify-between px-6 py-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => toggleSection('payment')}
        >
          <div className="flex items-center">
            <CardIcon size={20} className="text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Payment Method</h3>
          </div>
          {expandedSection === 'payment' ?
            <ChevronUp size={20} className="text-gray-500" /> :
            <ChevronDown size={20} className="text-gray-500" />
          }
        </div>

        {expandedSection === 'payment' && (
          <div className="p-6">
            {loadingPayment ? (
              <div className="flex justify-center py-8">
                <RefreshCw size={24} className="animate-spin text-blue-600" />
              </div>
            ) : subscriptionStatus === 'active' ? (
              <div>
                {paymentMethod ? (
                  <div className="flex items-start mb-6">
                    <div className="w-12 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded border border-gray-200 flex items-center justify-center text-white font-bold text-xs mr-4 shadow-sm">
                      {paymentMethod.card?.brand?.toUpperCase().slice(0, 4) || 'CARD'}
                    </div>
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-900 mb-1">
                        {paymentMethod.card?.brand?.charAt(0).toUpperCase() + paymentMethod.card?.brand?.slice(1) || 'Credit Card'}
                      </h5>
                      <p className="text-gray-600 mb-1">
                        •••• •••• •••• {paymentMethod.card?.last4 || subscription?.card_last_four || '••••'}
                      </p>
                      {paymentMethod.card?.exp_month && paymentMethod.card?.exp_year && (
                        <p className="text-sm text-gray-500">
                          Expires {paymentMethod.card.exp_month.toString().padStart(2, '0')}/{paymentMethod.card.exp_year}
                        </p>
                      )}
                      <div className="mt-2 flex items-center text-sm">
                        <div className="flex items-center text-green-600">
                          <CheckCircle size={16} className="mr-1" />
                          <span>Verified</span>
                        </div>
                        {paymentMethod.card?.funding && (
                          <span className="ml-3 text-gray-500 capitalize">{paymentMethod.card.funding} card</span>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start mb-6">
                    <div className="w-12 h-8 bg-gray-100 rounded border border-gray-200 flex items-center justify-center text-gray-500 font-bold text-xs mr-4">
                      CARD
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-900 mb-1">Payment Card</h5>
                      <p className="text-gray-600">
                        {subscription?.card_last_four
                          ? `•••• •••• •••• ${subscription.card_last_four}`
                          : 'Visit billing portal to view payment method details'
                        }
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    onClick={handleStripePortal}
                    className="inline-flex items-center justify-center px-4 py-2 border border-blue-300 rounded-md shadow-sm text-sm font-medium text-blue-700 bg-white hover:bg-blue-50 transition-colors"
                  >
                    <CreditCard size={16} className="mr-2" />
                    Update Payment Method
                  </button>

                  <button
                    onClick={handleStripePortal}
                    className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    <Settings size={16} className="mr-2" />
                    Billing Address
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start">
                <div className="flex-shrink-0 mr-4">
                  {subscriptionStatus === 'trial' ? (
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <Clock size={24} className="text-blue-600" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                      <CardIcon size={24} className="text-gray-500" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h5 className="font-medium text-gray-900 mb-2">
                    {subscriptionStatus === 'trial'
                      ? 'No payment method required yet'
                      : 'No payment method on file'
                    }
                  </h5>
                  <p className="text-gray-600 mb-4">
                    {subscriptionStatus === 'trial'
                      ? `You'll be asked to provide payment details when your trial ends in ${daysLeft} days.`
                      : 'You\'ll need to add a payment method when you subscribe to a plan.'
                    }
                  </p>

                  <Link
                    href="/dashboard/billing"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    <ExternalLink size={16} className="mr-2" />
                    View Plans & Pricing
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Billing History Section */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden mb-6">
        <div
          className="flex items-center justify-between px-6 py-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => toggleSection('history')}
        >
          <div className="flex items-center">
            <FileText size={20} className="text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Billing History</h3>
          </div>
          {expandedSection === 'history' ?
            <ChevronUp size={20} className="text-gray-500" /> :
            <ChevronDown size={20} className="text-gray-500" />
          }
        </div>

        {expandedSection === 'history' && (
          <div className="p-6">
            {loadingBilling ? (
              <div className="flex justify-center py-8">
                <RefreshCw size={24} className="animate-spin text-blue-600" />
              </div>
            ) : billingHistory.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Invoice
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {billingHistory.slice(0, showAllHistory ? billingHistory.length : 5).map((invoice) => (
                        <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                            {formatDate(invoice.created)}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-900">
                            <div className="font-medium">{invoice.description || `${planDetails.name} - ${subscription?.billing_cycle || 'monthly'}`}</div>
                            {invoice.period_start && invoice.period_end && (
                              <div className="text-xs text-gray-500 mt-1">
                                Service period: {formatDate(invoice.period_start)} - {formatDate(invoice.period_end)}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatCurrency(invoice.amount_paid || invoice.total)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                              invoice.status === 'open' ? 'bg-yellow-100 text-yellow-800' :
                                invoice.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                                  'bg-red-100 text-red-800'
                              }`}>
                              {invoice.status?.charAt(0).toUpperCase() + invoice.status?.slice(1) || 'Paid'}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {invoice.invoice_pdf && (
                              <a
                                href={invoice.invoice_pdf}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-900 transition-colors p-1"
                                title="Download invoice PDF"
                              >
                                <Download size={16} />
                              </a>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {billingHistory.length > 5 && (
                  <div className="mt-6 text-center">
                    <button
                      onClick={() => setShowAllHistory(!showAllHistory)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                    >
                      {showAllHistory ? 'Show less' : `Show all ${billingHistory.length} invoices`}
                    </button>
                  </div>
                )}

                <div className="mt-6 pt-6 border-t border-gray-200 flex justify-center">
                  <button
                    onClick={handleStripePortal}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    <ExternalLink size={16} className="mr-2" />
                    View Complete Billing History
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <FileText size={48} className="mx-auto text-gray-300 mb-4" />
                <h5 className="text-lg font-medium text-gray-900 mb-2">No billing history yet</h5>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Your invoice history will appear here once you&#39;ve subscribed to a plan and made payments.
                </p>

                {subscriptionStatus === 'trial' ? (
                  <Link
                    href="/dashboard/billing"
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                  >
                    <CreditCard size={16} className="mr-2" />
                    Upgrade Your Plan
                  </Link>
                ) : (
                  <Link
                    href="/dashboard/billing"
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                  >
                    <CreditCard size={16} className="mr-2" />
                    View Subscription Plans
                  </Link>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Support Section */}
      <div className="bg-blue-50 rounded-lg p-6 border border-blue-100">
        <div className="flex">
          <div className="flex-shrink-0">
            <Shield size={24} className="text-blue-600" />
          </div>
          <div className="ml-4 flex-1">
            <h4 className="text-lg font-medium text-blue-900 mb-2">Need help with billing?</h4>
            <p className="text-blue-700 mb-4">
              Our support team is available to assist you with any billing questions or concerns.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/contact"
                className="inline-flex items-center px-4 py-2 border border-blue-300 rounded-md text-sm font-medium text-blue-700 bg-white hover:bg-blue-50 transition-colors"
              >
                <ExternalLink size={16} className="mr-2" />
                Contact Support
              </Link>
              <Link
                href="/faq"
                className="inline-flex items-center px-4 py-2 border border-blue-300 rounded-md text-sm font-medium text-blue-700 bg-white hover:bg-blue-50 transition-colors"
              >
                <FileText size={16} className="mr-2" />
                Billing FAQ
              </Link>
              {subscriptionStatus === 'active' && (
                <button
                  onClick={handleStripePortal}
                  className="inline-flex items-center px-4 py-2 border border-blue-300 rounded-md text-sm font-medium text-blue-700 bg-white hover:bg-blue-50 transition-colors"
                >
                  <Settings size={16} className="mr-2" />
                  Billing Portal
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}