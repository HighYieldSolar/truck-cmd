"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useSubscription } from "@/context/SubscriptionContext";
import { useTranslation } from "@/context/LanguageContext";
import Link from "next/link";
import CancellationModal from "@/components/billing/CancellationModal";
import UpdatePaymentModal from "@/components/billing/UpdatePaymentModal";
import {
  RefreshCw,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Calendar,
  Clock,
  ArrowRight,
  FileText,
  Shield,
  CreditCard as CardIcon,
  Zap,
  ExternalLink,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Settings,
  AlertTriangle,
  Link as LinkIcon,
  Pencil
} from "lucide-react";

export default function BillingSettings() {
  const { t } = useTranslation('settings');
  const searchParams = useSearchParams();
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
  const [reactivating, setReactivating] = useState(false);
  const [showCancellationModal, setShowCancellationModal] = useState(false);
  const [showUpdatePaymentModal, setShowUpdatePaymentModal] = useState(false);

  // Handle openPayment query parameter to auto-open payment method section
  useEffect(() => {
    const openPayment = searchParams.get('openPayment');
    if (openPayment === 'true') {
      setExpandedSection('payment');
      setShowUpdatePaymentModal(true);
    }
  }, [searchParams]);

  // Get subscription context data
  const {
    subscription,
    loading: subscriptionLoading,
    isTrialActive,
    isSubscriptionActive,
    getDaysLeftInTrial,
    refreshSubscription
  } = useSubscription();

  // Updated pricing structure to match tierConfig.js
  const getPlanDetails = (plan) => {
    const planData = {
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
        ]
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

    return planData[plan] || planData.basic;
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

        // Load billing history for any user (shows past invoices even after cancellation)
        // Only load payment method if subscription is active
        await loadBillingHistory(user.id);

        if (subscription?.status === 'active') {
          await loadPaymentMethod(user.id);
        }

      } catch (error) {
        setErrorMessage(t('billing.messages.loadFailed'));
      } finally {
        setLoading(false);
      }
    }

    if (!subscriptionLoading) {
      loadUserData();
    }
  }, [subscription, subscriptionLoading, t]);

  // Load billing history from Stripe
  const loadBillingHistory = async (userId) => {
    try {
      setLoadingBilling(true);

      // Get the current session for authorization
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        console.log('No session found for billing history fetch');
        return;
      }

      const response = await fetch('/api/get-billing-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ userId }),
      });

      const result = await response.json();

      if (result.success) {
        setBillingHistory(result.invoices || []);
      }
    } catch (error) {
      // Silent fail - billing history is not critical
    } finally {
      setLoadingBilling(false);
    }
  };

  // Load payment method from Stripe
  const loadPaymentMethod = async (userId) => {
    try {
      setLoadingPayment(true);

      // Get the current session for authorization
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        console.log('No session found for payment method fetch');
        return;
      }

      const response = await fetch('/api/get-payment-method', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ userId }),
      });

      const result = await response.json();

      if (result.success) {
        setPaymentMethod(result.paymentMethod);
      }
    } catch (error) {
      // Silent fail - payment method info is not critical
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
      // Check if subscription is scheduled for cancellation
      if (subscription?.cancel_at_period_end) {
        return 'canceled';
      }
      return 'active';
    } else if (subscription?.status === 'trialing' && isTrialActive()) {
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
      active: { label: 'Active', color: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/50' },
      trial: { label: 'Trial', color: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/50' },
      canceled: { label: 'Canceled', color: 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/50' },
      inactive: { label: 'Inactive', color: 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/50' }
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

    // Always refresh billing history (shows past invoices even after cancellation)
    await loadBillingHistory(user.id);

    // Only refresh payment method if subscription is active
    if (subscription?.status === 'active') {
      await loadPaymentMethod(user.id);
    }

    setSuccessMessage(t('billing.messages.refreshSuccess'));
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Handle Stripe portal access
  const handleStripePortal = async () => {
    try {
      // Get the current session for authorization
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setErrorMessage(t('billing.messages.portalSignIn'));
        return;
      }

      const response = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          userId: user.id,
          returnUrl: `${window.location.origin}/dashboard/settings/billing`
        }),
      });

      const result = await response.json();

      if (result.url) {
        window.location.href = result.url;
      } else {
        setErrorMessage(t('billing.messages.portalError'));
      }
    } catch (error) {
      setErrorMessage(t('billing.messages.portalError'));
    }
  };

  // Handle subscription cancellation
  const handleCancelSubscription = async (cancellationData) => {
    try {
      setCanceling(true);
      setShowCancellationModal(false);

      // Get the current session for authorization
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setErrorMessage(t('billing.messages.cancelSignIn'));
        return;
      }

      const response = await fetch('/api/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          userId: user.id,
          reason: cancellationData.reason,
          feedback: cancellationData.feedback
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccessMessage(t('billing.messages.cancelSuccess'));
        refreshSubscription();
      } else {
        setErrorMessage(result.error || t('billing.messages.cancelFailed'));
      }
    } catch (error) {
      setErrorMessage(t('billing.messages.cancelFailed'));
    } finally {
      setCanceling(false);
    }
  };

  // Handle subscription reactivation (undo cancellation)
  const handleReactivateSubscription = async () => {
    try {
      setReactivating(true);

      // Get the current session for authorization
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setErrorMessage(t('billing.messages.reactivateSignIn'));
        return;
      }

      const response = await fetch('/api/reactivate-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ userId: user.id }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccessMessage(t('billing.messages.reactivateSuccess'));
        refreshSubscription();
      } else {
        setErrorMessage(result.error || t('billing.messages.reactivateFailed'));
      }
    } catch (error) {
      setErrorMessage(t('billing.messages.reactivateFailed'));
    } finally {
      setReactivating(false);
    }
  };

  if (loading || subscriptionLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw size={32} className="animate-spin text-blue-600 dark:text-blue-400" />
        <span className="ml-2 text-gray-700 dark:text-gray-300">{t('billing.loading')}</span>
      </div>
    );
  }

  const statusInfo = getStatusLabel();
  const subscriptionStatus = getSubscriptionStatus();
  const daysLeft = getDaysLeftInTrial ? getDaysLeftInTrial() : 0;
  const planDetails = getPlanDetails(subscription?.plan);

  return (
    <div className="dark:text-white">
      {/* Success/Error Messages */}
      {successMessage && (
        <div className="mb-6 bg-green-50 dark:bg-green-900/30 border-l-4 border-green-500 p-4 rounded-md">
          <div className="flex items-start">
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3" />
            <span className="text-green-800 dark:text-green-300">{successMessage}</span>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 p-4 rounded-md">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3" />
            <span className="text-red-800 dark:text-red-300">{errorMessage}</span>
          </div>
        </div>
      )}


      {/* Current Subscription Section */}
      <div className="bg-white dark:bg-gray-700/30 rounded-lg shadow-md border border-gray-200 dark:border-gray-600 overflow-hidden mb-6">
        <div
          className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          onClick={() => toggleSection('subscription')}
        >
          <div className="flex items-center">
            <Zap size={18} className="text-blue-600 dark:text-blue-400 mr-2" />
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">{t('billing.subscription.title')}</h3>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
              {subscriptionStatus === 'trial' ? t('billing.status.freeTrial') : t(`billing.status.${subscriptionStatus}`)}
            </span>
            {expandedSection === 'subscription' ?
              <ChevronUp size={18} className="text-gray-500 dark:text-gray-400" /> :
              <ChevronDown size={18} className="text-gray-500 dark:text-gray-400" />
            }
          </div>
        </div>

        {expandedSection === 'subscription' && (
          <div className="p-4">
            {/* Trial State - Show special trial UI */}
            {subscriptionStatus === 'trial' && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                      <Clock size={18} className="mr-2 text-blue-500" />
                      {subscription?.plan === 'premium-trial' ? 'Premium Trial' : t('billing.subscription.freeTrial')}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {subscription?.plan === 'premium-trial'
                        ? 'Full access to Premium features'
                        : t('billing.subscription.fullAccess')}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{daysLeft}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">{t('billing.subscription.daysLeft')}</span>
                  </div>
                </div>

                <div className="w-full bg-blue-100 dark:bg-blue-900/50 rounded-full h-2 mb-3">
                  <div
                    className="bg-blue-500 dark:bg-blue-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.max(5, (daysLeft / 30) * 100)}%` }}
                  ></div>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {t('billing.subscription.upgradePrompt')}
                  </p>
                  <Link
                    href="/dashboard/upgrade"
                    className="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white text-sm font-medium rounded-md transition-colors"
                  >
                    <Zap size={14} className="mr-1.5" />
                    {t('billing.actions.upgrade')}
                  </Link>
                </div>
              </div>
            )}

            {/* Active/Canceled Subscription State */}
            {(subscriptionStatus === 'active' || subscriptionStatus === 'canceled') && (
              <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center mb-1 flex-wrap gap-2">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{planDetails.name}</h4>
                    {planDetails.id === 'premium' && !subscription?.scheduled_plan && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-400">
                        {t('billing.plans.premium.popular')}
                      </span>
                    )}
                    {subscription?.scheduled_plan && subscription.scheduled_plan !== subscription?.plan && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400">
                        <ArrowRight size={12} className="mr-1" />
                        {subscription.scheduled_plan.charAt(0).toUpperCase() + subscription.scheduled_plan.slice(1)} {t('billing.nextPeriod')}
                      </span>
                    )}
                    {!subscription?.scheduled_plan && subscription?.scheduled_billing_cycle && subscription.scheduled_billing_cycle !== subscription?.billing_cycle && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400">
                        <ArrowRight size={12} className="mr-1" />
                        {subscription.scheduled_billing_cycle.charAt(0).toUpperCase() + subscription.scheduled_billing_cycle.slice(1)} {t('billing.nextPeriod')}
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{planDetails.description}</p>

                  {/* Resource limits badge */}
                  {planDetails.limits && (
                    <div className="inline-flex items-center px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full mb-2">
                      {planDetails.limits}
                    </div>
                  )}

                  <div className="flex items-baseline">
                    <span className="text-xl font-bold text-gray-900 dark:text-white">
                      ${subscription?.billing_cycle === 'yearly' ? planDetails.yearlyPrice : planDetails.monthlyPrice}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 ml-1 text-sm">{t('billing.pricing.perMonth')}</span>
                    {subscription?.billing_cycle === 'yearly' && (
                      <span className="ml-2 text-xs text-green-600 dark:text-green-400 font-medium">
                        {t('billing.pricing.save')} ${planDetails.savings}{t('billing.pricing.perYear')}
                      </span>
                    )}
                  </div>

                  {subscription?.billing_cycle === 'yearly' && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {t('billing.pricing.billedAnnually')} ${planDetails.yearlyTotal}
                    </p>
                  )}
                </div>

                {/* Action buttons */}
                <div className="mt-4 xl:mt-0 xl:ml-4 flex flex-col space-y-2 xl:items-end">
                  {subscriptionStatus === 'active' && (
                    <>
                      <Link
                        href="/dashboard/upgrade"
                        className="inline-flex items-center justify-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 transition-colors"
                      >
                        <Zap size={14} className="mr-1.5" />
                        {t('billing.actions.changePlan')}
                      </Link>
                      <button
                        onClick={() => setShowCancellationModal(true)}
                        disabled={canceling}
                        className="inline-flex items-center justify-center px-3 py-1.5 text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors disabled:opacity-50"
                      >
                        {t('billing.actions.cancelSubscription')}
                      </button>
                    </>
                  )}
                  {subscriptionStatus === 'canceled' && (
                    <>
                      <button
                        onClick={handleReactivateSubscription}
                        disabled={reactivating}
                        className="inline-flex items-center justify-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 transition-colors disabled:opacity-50"
                      >
                        {reactivating ? (
                          <>
                            <RefreshCw size={14} className="mr-1.5 animate-spin" />
                            {t('billing.actions.reactivating')}
                          </>
                        ) : (
                          <>
                            <CheckCircle size={14} className="mr-1.5" />
                            {t('billing.actions.keepMyPlan')}
                          </>
                        )}
                      </button>
                      <Link
                        href="/dashboard/upgrade"
                        className="inline-flex items-center justify-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-transparent hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <Zap size={14} className="mr-1.5" />
                        {t('billing.actions.changePlan')}
                      </Link>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Inactive State */}
            {subscriptionStatus === 'inactive' && (
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{t('billing.subscription.noActivePlan')}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('billing.subscription.subscribePrompt')}</p>
                </div>
                <Link
                  href="/dashboard/upgrade"
                  className="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white text-sm font-medium rounded-md transition-colors"
                >
                  <CreditCard size={14} className="mr-1.5" />
                  {t('billing.actions.viewPlans')}
                </Link>
              </div>
            )}

            {/* Scheduled Plan/Billing Change Notice */}
            {((subscription?.scheduled_plan && subscription.scheduled_plan !== subscription?.plan) ||
              (subscription?.scheduled_billing_cycle && subscription.scheduled_billing_cycle !== subscription?.billing_cycle)) && (
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-start">
                  <Calendar size={16} className="text-blue-600 dark:text-blue-400 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      {subscription?.scheduled_plan && subscription.scheduled_plan !== subscription?.plan
                        ? t('billing.scheduledChanges.planChange')
                        : t('billing.scheduledChanges.billingChange')}
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-0.5">
                      {subscription?.scheduled_plan && subscription.scheduled_plan !== subscription?.plan ? (
                        <>
                          {t('billing.scheduledChanges.planWillChange')} <span className="font-semibold capitalize">{subscription.scheduled_plan}</span>
                          {subscription?.scheduled_billing_cycle && subscription.scheduled_billing_cycle !== subscription?.billing_cycle && (
                            <> ({subscription.scheduled_billing_cycle} billing)</>
                          )}
                          {' '}{t('billing.scheduledChanges.on')} {formatDate(subscription.current_period_ends_at)}
                        </>
                      ) : (
                        <>
                          {t('billing.scheduledChanges.billingWillSwitch')} <span className="font-semibold capitalize">{subscription.scheduled_billing_cycle}</span> {t('billing.scheduledChanges.on')} {formatDate(subscription.current_period_ends_at)}
                        </>
                      )}
                    </p>
                    <Link
                      href="/dashboard/upgrade"
                      className="inline-flex items-center text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mt-2 transition-colors"
                    >
                      {t('billing.scheduledChanges.changePlanLink')}
                      <ChevronRight size={12} className="ml-0.5" />
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Status alerts - more compact */}
            {subscriptionStatus === 'active' && subscription?.current_period_ends_at && !subscription?.scheduled_plan && (
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-3">
                <Calendar size={14} className="mr-1.5" />
                <span>{t('billing.nextBilling')}: <span className="font-medium text-gray-700 dark:text-gray-300">{formatDate(subscription.current_period_ends_at)}</span></span>
              </div>
            )}

            {subscriptionStatus === 'canceled' && subscription?.current_period_ends_at && (
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-md p-3 mb-3">
                <div className="flex items-start text-sm text-orange-700 dark:text-orange-300">
                  <AlertTriangle size={14} className="mr-1.5 flex-shrink-0 mt-0.5" />
                  <div>
                    <span>{t('billing.endDate')} <span className="font-medium">{formatDate(subscription.current_period_ends_at)}</span></span>
                    <p className="text-xs mt-1 text-orange-600 dark:text-orange-400">{t('billing.keepPlanPrompt')}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Plan Features */}
            {(subscriptionStatus === 'active' || subscriptionStatus === 'canceled') && (
              <div className="pt-3 border-t border-gray-200 dark:border-gray-600">
                <h5 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{t('billing.includedFeatures')}</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                  {planDetails.features.map((feature, index) => (
                    <div key={index} className="flex items-center text-xs text-gray-600 dark:text-gray-300">
                      <CheckCircle size={12} className="text-green-500 dark:text-green-400 mr-1.5 flex-shrink-0" />
                      {feature}
                    </div>
                  ))}
                </div>
                <Link
                  href="/dashboard/upgrade"
                  className="inline-flex items-center text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mt-2 transition-colors"
                >
                  {t('billing.compareAllPlans')}
                  <ChevronRight size={12} className="ml-0.5" />
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Payment Method Section */}
      <div className="bg-white dark:bg-gray-700/30 rounded-lg shadow-md border border-gray-200 dark:border-gray-600 overflow-hidden mb-6">
        <div
          className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          onClick={() => toggleSection('payment')}
        >
          <div className="flex items-center">
            <CardIcon size={18} className="text-blue-600 dark:text-blue-400 mr-2" />
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">{t('billing.paymentMethod.title')}</h3>
          </div>
          {expandedSection === 'payment' ?
            <ChevronUp size={18} className="text-gray-500 dark:text-gray-400" /> :
            <ChevronDown size={18} className="text-gray-500 dark:text-gray-400" />
          }
        </div>

        {expandedSection === 'payment' && (
          <div className="p-4">
            {loadingPayment ? (
              <div className="flex justify-center py-8">
                <RefreshCw size={24} className="animate-spin text-blue-600 dark:text-blue-400" />
              </div>
            ) : subscriptionStatus === 'active' ? (
              <div>
                {/* Payment Method Display */}
                <div className="flex items-start justify-between mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div className="flex items-start">
                    {/* Payment Method Icon */}
                    {paymentMethod?.type === 'link' ? (
                      <div className="w-12 h-8 bg-[#00D66F] rounded flex items-center justify-center mr-4 shadow-sm">
                        <LinkIcon size={16} className="text-white" />
                      </div>
                    ) : (
                      <div className="w-12 h-8 bg-gradient-to-r from-gray-700 to-gray-900 dark:from-gray-500 dark:to-gray-700 rounded flex items-center justify-center mr-4 shadow-sm">
                        <CreditCard size={16} className="text-white" />
                      </div>
                    )}

                    {/* Payment Method Details */}
                    <div className="flex-1">
                      {paymentMethod?.type === 'link' ? (
                        <>
                          <h5 className="font-medium text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                            {t('billing.paymentMethod.stripeLink')}
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400">
                              {t('billing.paymentMethod.expressCheckout')}
                            </span>
                          </h5>
                          <p className="text-gray-600 dark:text-gray-300 text-sm">
                            {paymentMethod.email}
                          </p>
                          <div className="mt-2 flex items-center text-sm">
                            <div className="flex items-center text-green-600 dark:text-green-400">
                              <CheckCircle size={14} className="mr-1" />
                              <span className="text-xs">{t('billing.paymentMethod.connected')}</span>
                            </div>
                          </div>
                        </>
                      ) : paymentMethod?.type === 'card' ? (
                        <>
                          <h5 className="font-medium text-gray-900 dark:text-white mb-1 capitalize">
                            {paymentMethod.card?.brand || t('billing.paymentMethod.creditCard')}
                          </h5>
                          <p className="text-gray-600 dark:text-gray-300 text-sm">
                            •••• •••• •••• {paymentMethod.card?.last4 || '••••'}
                          </p>
                          {paymentMethod.card?.exp_month && paymentMethod.card?.exp_year && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {t('billing.paymentMethod.expires')} {paymentMethod.card.exp_month.toString().padStart(2, '0')}/{paymentMethod.card.exp_year}
                            </p>
                          )}
                          <div className="mt-2 flex items-center gap-3 text-sm">
                            <div className="flex items-center text-green-600 dark:text-green-400">
                              <CheckCircle size={14} className="mr-1" />
                              <span className="text-xs">{t('billing.paymentMethod.verified')}</span>
                            </div>
                            {paymentMethod.card?.funding && (
                              <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                                {paymentMethod.card.funding} {t('billing.paymentMethod.card')}
                              </span>
                            )}
                          </div>
                        </>
                      ) : (
                        <>
                          <h5 className="font-medium text-gray-900 dark:text-white mb-1">{t('billing.paymentMethod.title')}</h5>
                          <p className="text-gray-600 dark:text-gray-300 text-sm">
                            {subscription?.card_last_four
                              ? `•••• •••• •••• ${subscription.card_last_four}`
                              : t('billing.paymentMethod.paymentOnFile')
                            }
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Update Button */}
                  <button
                    onClick={() => setShowUpdatePaymentModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors"
                  >
                    <Pencil size={14} />
                    {t('billing.paymentMethod.update')}
                  </button>
                </div>

              </div>
            ) : (
              <div className="flex items-start">
                <div className="flex-shrink-0 mr-4">
                  {subscriptionStatus === 'trial' ? (
                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                      <Clock size={24} className="text-blue-600 dark:text-blue-400" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                      <CardIcon size={24} className="text-gray-500 dark:text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h5 className="font-medium text-gray-900 dark:text-white mb-2">
                    {subscriptionStatus === 'trial'
                      ? t('billing.paymentMethod.noPaymentRequired')
                      : t('billing.paymentMethod.noPaymentOnFile')
                    }
                  </h5>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    {subscriptionStatus === 'trial'
                      ? `${t('billing.paymentMethod.trialPaymentPrompt')} ${daysLeft} ${t('billing.paymentMethod.days')}.`
                      : t('billing.paymentMethod.subscribePaymentPrompt')
                    }
                  </p>

                  <Link
                    href="/dashboard/upgrade"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-transparent hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <ExternalLink size={16} className="mr-2" />
                    {t('billing.paymentMethod.viewPlansAndPricing')}
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Billing History Section */}
      <div className="bg-white dark:bg-gray-700/30 rounded-lg shadow-md border border-gray-200 dark:border-gray-600 overflow-hidden mb-6">
        <div
          className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          onClick={() => toggleSection('history')}
        >
          <div className="flex items-center">
            <FileText size={18} className="text-blue-600 dark:text-blue-400 mr-2" />
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">{t('billing.history.title')}</h3>
          </div>
          {expandedSection === 'history' ?
            <ChevronUp size={18} className="text-gray-500 dark:text-gray-400" /> :
            <ChevronDown size={18} className="text-gray-500 dark:text-gray-400" />
          }
        </div>

        {expandedSection === 'history' && (
          <div className="p-4">
            {loadingBilling ? (
              <div className="flex justify-center py-8">
                <RefreshCw size={24} className="animate-spin text-blue-600 dark:text-blue-400" />
              </div>
            ) : billingHistory.length > 0 ? (
              <>
                {/* Mobile Card Layout */}
                <div className="md:hidden space-y-3">
                  {billingHistory.slice(0, showAllHistory ? billingHistory.length : 5).map((invoice) => (
                    <div
                      key={invoice.id}
                      className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
                    >
                      {/* Top row: Amount and Status */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-lg font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(invoice.amount_paid || invoice.total)}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          invoice.status === 'paid' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400' :
                          invoice.status === 'open' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-400' :
                          invoice.status === 'draft' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' :
                          'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400'
                        }`}>
                          {invoice.status?.charAt(0).toUpperCase() + invoice.status?.slice(1) || 'Paid'}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                        {invoice.description || `${planDetails.name} - ${subscription?.billing_cycle || 'monthly'}`}
                      </p>

                      {/* Date */}
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                        {formatDate(invoice.created)}
                        {invoice.period_start && invoice.period_end && (
                          <span className="block mt-0.5">
                            {t('billing.history.servicePeriod')}: {formatDate(invoice.period_start)} - {formatDate(invoice.period_end)}
                          </span>
                        )}
                      </p>

                      {/* Invoice Link */}
                      {invoice.hosted_invoice_url && (
                        <a
                          href={invoice.hosted_invoice_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline transition-colors"
                        >
                          {t('billing.history.viewInvoice') || 'View Invoice'}
                          <ExternalLink size={14} className="ml-1" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>

                {/* Desktop Table Layout */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-600">
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          {t('billing.history.date')}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          {t('billing.history.description')}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          {t('billing.history.amount')}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          {t('billing.history.status')}
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          {t('billing.history.invoice')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                      {billingHistory.slice(0, showAllHistory ? billingHistory.length : 5).map((invoice) => (
                        <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                            {formatDate(invoice.created)}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">
                            <div className="font-medium">{invoice.description || `${planDetails.name} - ${subscription?.billing_cycle || 'monthly'}`}</div>
                            {invoice.period_start && invoice.period_end && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {t('billing.history.servicePeriod')}: {formatDate(invoice.period_start)} - {formatDate(invoice.period_end)}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {formatCurrency(invoice.amount_paid || invoice.total)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${invoice.status === 'paid' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400' :
                              invoice.status === 'open' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-400' :
                                invoice.status === 'draft' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' :
                                  'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400'
                              }`}>
                              {invoice.status?.charAt(0).toUpperCase() + invoice.status?.slice(1) || 'Paid'}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {invoice.hosted_invoice_url && (
                              <a
                                href={invoice.hosted_invoice_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline transition-colors"
                              >
                                {t('billing.history.invoice')}
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
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium transition-colors"
                    >
                      {showAllHistory ? t('billing.history.showLess') : `${t('billing.history.showAll')} ${billingHistory.length} ${t('billing.history.invoices')}`}
                    </button>
                  </div>
                )}

                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-600 flex justify-center">
                  <button
                    onClick={handleStripePortal}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-transparent hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <ExternalLink size={16} className="mr-2" />
                    {t('billing.history.viewCompleteHistory')}
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <FileText size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                <h5 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{t('billing.history.noHistoryYet')}</h5>
                <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md mx-auto">
                  {t('billing.history.historyPrompt')}
                </p>

                {subscriptionStatus === 'trial' ? (
                  <Link
                    href="/dashboard/upgrade"
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors"
                  >
                    <CreditCard size={16} className="mr-2" />
                    {t('billing.history.upgradeYourPlan')}
                  </Link>
                ) : (
                  <Link
                    href="/dashboard/upgrade"
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors"
                  >
                    <CreditCard size={16} className="mr-2" />
                    {t('billing.history.viewSubscriptionPlans')}
                  </Link>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Support Section */}
      <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-6 border border-blue-100 dark:border-blue-800">
        <div className="flex">
          <div className="flex-shrink-0">
            <Shield size={24} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div className="ml-4 flex-1">
            <h4 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-2">{t('billing.support.title')}</h4>
            <p className="text-blue-700 dark:text-blue-300 mb-4">
              {t('billing.support.description')}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/contact"
                className="inline-flex items-center px-4 py-2 border border-blue-300 dark:border-blue-600 rounded-md text-sm font-medium text-blue-700 dark:text-blue-300 bg-white dark:bg-transparent hover:bg-blue-50 dark:hover:bg-blue-900/50 transition-colors"
              >
                <ExternalLink size={16} className="mr-2" />
                {t('billing.support.contactSupport')}
              </Link>
              <Link
                href="/faq"
                className="inline-flex items-center px-4 py-2 border border-blue-300 dark:border-blue-600 rounded-md text-sm font-medium text-blue-700 dark:text-blue-300 bg-white dark:bg-transparent hover:bg-blue-50 dark:hover:bg-blue-900/50 transition-colors"
              >
                <FileText size={16} className="mr-2" />
                {t('billing.support.billingFAQ')}
              </Link>
              <Link
                href="/terms"
                className="inline-flex items-center px-4 py-2 border border-blue-300 dark:border-blue-600 rounded-md text-sm font-medium text-blue-700 dark:text-blue-300 bg-white dark:bg-transparent hover:bg-blue-50 dark:hover:bg-blue-900/50 transition-colors"
              >
                <FileText size={16} className="mr-2" />
                {t('billing.support.termsOfService')}
              </Link>
              {subscriptionStatus === 'active' && (
                <button
                  onClick={handleStripePortal}
                  className="inline-flex items-center px-4 py-2 border border-blue-300 dark:border-blue-600 rounded-md text-sm font-medium text-blue-700 dark:text-blue-300 bg-white dark:bg-transparent hover:bg-blue-50 dark:hover:bg-blue-900/50 transition-colors"
                >
                  <Settings size={16} className="mr-2" />
                  {t('billing.support.billingPortal')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cancellation Modal */}
      <CancellationModal
        isOpen={showCancellationModal}
        onClose={() => setShowCancellationModal(false)}
        onConfirm={handleCancelSubscription}
        endDate={formatDate(subscription?.current_period_ends_at)}
      />

      {/* Update Payment Method Modal */}
      <UpdatePaymentModal
        isOpen={showUpdatePaymentModal}
        onClose={() => setShowUpdatePaymentModal(false)}
        userId={user?.id}
        currentPaymentMethod={paymentMethod}
        onUpdate={(newPaymentMethod) => {
          setPaymentMethod(newPaymentMethod);
          setSuccessMessage(t('billing.messages.paymentUpdated'));
          setTimeout(() => setSuccessMessage(null), 3000);
        }}
      />
    </div>
  );
}
