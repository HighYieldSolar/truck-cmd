"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useSubscription } from "@/context/SubscriptionContext";
import {
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  Check,
  X,
  AlertTriangle,
  ArrowDown,
  Calendar
} from "lucide-react";

export default function DowngradePlanPage() {
  const router = useRouter();
  const params = useParams();
  const targetPlanId = params.plan;

  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [success, setSuccess] = useState(false);
  const [downgradeDetails, setDowngradeDetails] = useState(null);
  const [isCanceledAtPeriodEnd, setIsCanceledAtPeriodEnd] = useState(false);
  const [billingCycle, setBillingCycle] = useState("monthly");

  // Ref to persist success state across re-renders from subscription refresh
  const successRef = useRef(false);

  const {
    user,
    subscription,
    loading: subscriptionLoading,
    isSubscriptionActive,
    refreshSubscription
  } = useSubscription();

  // Check for persisted success state on mount (handles page remounts)
  useEffect(() => {
    const savedDowngrade = sessionStorage.getItem('downgrade-success');
    if (savedDowngrade) {
      try {
        const parsed = JSON.parse(savedDowngrade);
        // Only restore if it's for the same plan and within last 5 minutes
        if (parsed.targetPlan === targetPlanId && Date.now() - parsed.timestamp < 300000) {
          setSuccess(true);
          successRef.current = true;
          setDowngradeDetails(parsed);
          // Restore billing cycle if available
          if (parsed.billingCycle) {
            setBillingCycle(parsed.billingCycle);
          }
        } else {
          // Clear stale data
          sessionStorage.removeItem('downgrade-success');
        }
      } catch (e) {
        sessionStorage.removeItem('downgrade-success');
      }
    }
  }, [targetPlanId]);

  // Check if subscription is set to cancel and initialize billing cycle
  useEffect(() => {
    if (subscription?.cancel_at_period_end) {
      setIsCanceledAtPeriodEnd(true);
    }

    // For same-plan downgrades (yearly → monthly), always set to monthly
    const currentPlanFromSub = subscription?.plan?.toLowerCase();
    const currentCycleFromSub = subscription?.billing_cycle || "monthly";

    if (currentPlanFromSub === targetPlanId && currentCycleFromSub === "yearly") {
      // This is a billing cycle downgrade - pre-select monthly
      setBillingCycle("monthly");
    } else {
      // Initialize billing cycle: prefer sessionStorage (from upgrade page selection), then current subscription
      const savedCycle = sessionStorage.getItem('checkout_billing_cycle');
      if (savedCycle) {
        setBillingCycle(savedCycle);
      } else if (subscription?.billing_cycle) {
        setBillingCycle(subscription.billing_cycle);
      }
    }
  }, [subscription, targetPlanId]);

  // Plans data
  const plans = {
    basic: {
      id: "basic",
      name: "Basic",
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
      lostFeatures: {
        premium: [
          "Compliance tracking & alerts",
          "IFTA Calculator",
          "State Mileage Tracker",
          "Unlimited loads & invoices",
          "Unlimited customers",
          "Fuel receipt uploads"
        ],
        fleet: [
          "All Premium features",
          "Maintenance scheduling",
          "Advanced fleet reports",
          "SMS notifications",
          "Team user access",
          "Priority phone support"
        ]
      }
    },
    premium: {
      id: "premium",
      name: "Premium",
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
        "Unlimited customers"
      ],
      lostFeatures: {
        fleet: [
          "Maintenance scheduling",
          "Advanced fleet reports",
          "SMS notifications",
          "Team user access (6 users)",
          "Priority phone support",
          "CSV & Excel exports"
        ]
      }
    },
    fleet: {
      id: "fleet",
      name: "Fleet",
      monthlyPrice: 75,
      yearlyPrice: 60,
      yearlyTotal: 720,
      savings: 180,
      limits: "10 Trucks • 6 Team Users • Unlimited Everything",
      features: [
        "Everything in Premium, plus:",
        "Maintenance scheduling",
        "Advanced fleet reports",
        "SMS notifications",
        "Team user access (6 users)",
        "Priority phone support",
        "CSV & Excel exports"
      ],
      lostFeatures: {} // No features lost for billing cycle changes
    }
  };

  const currentPlan = subscription?.plan?.toLowerCase();
  const targetPlan = plans[targetPlanId];
  const hasActiveSubscription = isSubscriptionActive && isSubscriptionActive();

  // Calculate what features will be lost
  const getLostFeatures = () => {
    if (!targetPlan || !currentPlan) return [];
    return targetPlan.lostFeatures?.[currentPlan] || [];
  };

  const lostFeatures = getLostFeatures();

  // Get billing period end date
  const getBillingPeriodEnd = () => {
    if (subscription?.current_period_ends_at) {
      return new Date(subscription.current_period_ends_at).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric"
      });
    }
    return "the end of your current billing period";
  };

  const handleDowngrade = async () => {
    if (!user || !targetPlanId || processing) return;

    setProcessing(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/update-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          newPlan: targetPlanId,
          newBillingCycle: billingCycle
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to schedule downgrade");
      }

      setSuccess(true);
      successRef.current = true;

      // Persist success state to sessionStorage so it survives re-renders from subscription refresh
      sessionStorage.setItem('downgrade-success', JSON.stringify({
        targetPlan: targetPlanId,
        timestamp: Date.now(),
        effectiveDate: getBillingPeriodEnd(),
        billingCycle: billingCycle
      }));

      // Refresh subscription data in background
      setTimeout(() => {
        refreshSubscription();
      }, 1000);

    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setProcessing(false);
    }
  };

  // Validate downgrade
  // A valid downgrade is:
  // 1. Moving to a lower tier plan (e.g., Premium → Basic)
  // 2. Same plan but switching from yearly to monthly billing (losing the discount)
  const planOrder = ["basic", "premium", "fleet"];
  const currentBillingCycle = subscription?.billing_cycle || "monthly";

  const isValidDowngrade = () => {
    const currentIndex = planOrder.indexOf(currentPlan);
    const targetIndex = planOrder.indexOf(targetPlanId);

    // Lower tier plan is always a valid downgrade
    if (targetIndex < currentIndex && targetIndex >= 0) {
      return true;
    }

    // Same plan but switching from yearly to monthly is a valid downgrade
    if (targetIndex === currentIndex && targetIndex >= 0) {
      // Only valid if currently on yearly and switching to monthly
      return currentBillingCycle === "yearly" && billingCycle === "monthly";
    }

    return false;
  };

  // Check if this is a same-plan billing cycle change
  const isBillingCycleDowngrade = () => {
    const currentIndex = planOrder.indexOf(currentPlan);
    const targetIndex = planOrder.indexOf(targetPlanId);
    return targetIndex === currentIndex && currentBillingCycle === "yearly" && billingCycle === "monthly";
  };

  // Get effective date from sessionStorage or calculate it
  const getEffectiveDate = () => {
    if (downgradeDetails?.effectiveDate) {
      return downgradeDetails.effectiveDate;
    }
    return getBillingPeriodEnd();
  };

  // Handle navigation away from success page
  const handleBackToPlans = () => {
    sessionStorage.removeItem('downgrade-success');
    router.push("/dashboard/upgrade");
  };

  // Success state - check this FIRST before any other conditions
  // This prevents the success view from being lost when subscription refreshes
  if (success || successRef.current) {
    // Get target plan info - use targetPlanId from params since targetPlan might be undefined during subscription refresh
    const successTargetPlan = plans[targetPlanId] || { name: targetPlanId, monthlyPrice: 0, yearlyPrice: 0, yearlyTotal: 0 };
    const nextChargeAmount = billingCycle === "yearly" ? successTargetPlan.yearlyTotal : successTargetPlan.monthlyPrice;

    return (
      <DashboardLayout activePage="upgrade">
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check size={32} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Downgrade Scheduled</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Your plan will change to {successTargetPlan.name} on {getEffectiveDate()}.
              You'll keep all your current features until then.
            </p>
            <div className="bg-gray-100 dark:bg-gray-700/50 rounded-lg p-4 mb-6 text-left space-y-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                  <ArrowDown size={16} className="text-blue-500 dark:text-blue-400" />
                  <span>New plan</span>
                </div>
                <span className="text-gray-900 dark:text-white font-medium">{successTargetPlan.name}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                  <Calendar size={16} className="text-blue-500 dark:text-blue-400" />
                  <span>Billing cycle</span>
                </div>
                <span className="text-gray-900 dark:text-white font-medium capitalize">{billingCycle}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                  <Calendar size={16} className="text-blue-500 dark:text-blue-400" />
                  <span>Effective date</span>
                </div>
                <span className="text-gray-900 dark:text-white font-medium">{getEffectiveDate()}</span>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-600 pt-3 mt-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-900 dark:text-white font-medium">Next billing charge</span>
                  <div className="text-right">
                    <span className="text-lg font-bold text-gray-900 dark:text-white">${nextChargeAmount}</span>
                    <span className="text-gray-500 dark:text-gray-400 text-xs ml-1">
                      /{billingCycle === "yearly" ? "year" : "month"}
                    </span>
                  </div>
                </div>
                {billingCycle === "yearly" && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 text-right mt-1">
                    ${successTargetPlan.yearlyPrice}/mo equivalent
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={handleBackToPlans}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
            >
              Back to plans
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Show loading only if not in success state
  if (subscriptionLoading) {
    return (
      <DashboardLayout activePage="upgrade">
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center justify-center min-h-screen">
            <RefreshCw size={40} className="animate-spin text-blue-500 dark:text-blue-400" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Not a valid downgrade - only check if not in success state
  if (!hasActiveSubscription || !isValidDowngrade() || !targetPlan) {
    return (
      <DashboardLayout activePage="upgrade">
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center max-w-md">
            <AlertCircle size={48} className="text-red-500 dark:text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Invalid Downgrade</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {!hasActiveSubscription
                ? "You don't have an active subscription to downgrade."
                : "This is not a valid downgrade option for your current plan."}
            </p>
            <button
              onClick={() => router.push("/dashboard/upgrade")}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              Back to plans
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activePage="upgrade">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-lg mx-auto px-4">
          {/* Back Button */}
          <button
            onClick={() => router.push("/dashboard/upgrade")}
            className="flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
          >
            <ChevronLeft size={20} />
            <span className="ml-1">Back to plans</span>
          </button>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <ArrowDown size={32} className="text-blue-500 dark:text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {isBillingCycleDowngrade()
                ? `Switch ${targetPlan.name} to Monthly`
                : `Downgrade to ${targetPlan.name}`}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {isBillingCycleDowngrade()
                ? "Your billing will change at the end of your current billing period"
                : "Your plan will change at the end of your current billing period"}
            </p>
          </div>

          {/* Billing Cycle Selection - Hide for billing cycle downgrades since they're specifically switching to monthly */}
          {!isBillingCycleDowngrade() && (
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`relative p-4 rounded-lg border-2 text-left transition-all ${
                  billingCycle === "monthly"
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                    : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                <div className={`w-4 h-4 rounded-full border-2 mb-2 flex items-center justify-center ${
                  billingCycle === "monthly" ? "border-blue-500" : "border-gray-400 dark:border-gray-500"
                }`}>
                  {billingCycle === "monthly" && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                </div>
                <p className="text-gray-900 dark:text-white font-medium text-sm">Monthly billing</p>
                <p className="text-gray-500 dark:text-gray-400 text-xs">${targetPlan.monthlyPrice}/month</p>
              </button>

              <button
                onClick={() => setBillingCycle("yearly")}
                className={`relative p-4 rounded-lg border-2 text-left transition-all ${
                  billingCycle === "yearly"
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                    : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                <span className="absolute top-2 right-2 text-xs bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                  Save 20%
                </span>
                <div className={`w-4 h-4 rounded-full border-2 mb-2 flex items-center justify-center ${
                  billingCycle === "yearly" ? "border-blue-500" : "border-gray-400 dark:border-gray-500"
                }`}>
                  {billingCycle === "yearly" && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                </div>
                <p className="text-gray-900 dark:text-white font-medium text-sm">Yearly billing</p>
                <p className="text-gray-500 dark:text-gray-400 text-xs">${targetPlan.yearlyPrice}/month</p>
              </button>
            </div>
          )}

          {/* Cancellation Notice */}
          {isCanceledAtPeriodEnd && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle size={20} className="text-amber-500 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-amber-700 dark:text-amber-300 font-medium mb-1">Cancellation will be reversed</h3>
                  <p className="text-amber-600/80 dark:text-amber-200/70 text-sm">
                    Your subscription is currently set to cancel. By downgrading instead, your cancellation will be removed and your subscription will continue on the lower plan.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Warning Card - Only show for tier downgrades, not billing cycle changes */}
          {!isBillingCycleDowngrade() && lostFeatures.length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-600 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertTriangle size={20} className="text-gray-500 dark:text-gray-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-gray-700 dark:text-gray-300 font-medium mb-1">Features you'll lose</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    After downgrading, you won't have access to these features:
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Billing Cycle Change Notice */}
          {isBillingCycleDowngrade() && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertTriangle size={20} className="text-amber-500 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-amber-700 dark:text-amber-300 font-medium mb-1">Switching to monthly billing</h3>
                  <p className="text-amber-600/80 dark:text-amber-200/70 text-sm">
                    You'll lose your 20% annual discount and pay ${targetPlan.monthlyPrice}/month instead of ${targetPlan.yearlyPrice}/month.
                    Your features will remain the same.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Lost Features List - Only show for tier downgrades */}
          {!isBillingCycleDowngrade() && lostFeatures.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 mb-6">
              <ul className="space-y-3">
                {lostFeatures.map((feature, index) => (
                  <li key={index} className="flex items-start text-sm">
                    <X size={16} className="text-red-500 dark:text-red-400 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600 dark:text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* New Plan Details */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 mb-6">
            <h3 className="text-gray-900 dark:text-white font-medium mb-3">Your new plan details</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Plan</span>
                <span className="text-gray-900 dark:text-white">{targetPlan.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Billing</span>
                <span className="text-gray-900 dark:text-white capitalize">{billingCycle}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Limits</span>
                <span className="text-blue-600 dark:text-blue-400 text-xs">{targetPlan.limits}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Effective date</span>
                <span className="text-gray-900 dark:text-white">{getBillingPeriodEnd()}</span>
              </div>

              {/* Next Billing Charge - Highlighted */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-gray-900 dark:text-white font-medium">Next billing charge</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">On {getBillingPeriodEnd()}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-bold text-gray-900 dark:text-white">
                      ${billingCycle === "yearly" ? targetPlan.yearlyTotal : targetPlan.monthlyPrice}
                    </span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {billingCycle === "yearly" ? "per year" : "per month"}
                    </p>
                  </div>
                </div>
                {billingCycle === "yearly" && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 text-right mt-1">
                    That's ${targetPlan.yearlyPrice}/mo — save ${targetPlan.savings}/year
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Info Notice */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/50 rounded-lg p-4 mb-6">
            <p className="text-blue-700 dark:text-blue-300 text-sm">
              You'll keep access to all your current features until {getBillingPeriodEnd()}.
              No prorated refund will be issued for the current billing period.
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2">
                <AlertCircle size={16} className="text-red-500 dark:text-red-400 flex-shrink-0" />
                <p className="text-red-600 dark:text-red-300 text-sm">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleDowngrade}
              disabled={processing}
              className={`w-full py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                processing
                  ? "bg-gray-300 dark:bg-gray-600 cursor-not-allowed text-gray-500 dark:text-gray-400"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              {processing ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <ArrowDown size={18} />
                  Confirm Downgrade
                </>
              )}
            </button>

            <button
              onClick={() => router.push("/dashboard/upgrade")}
              className="w-full py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-colors"
            >
              Keep Current Plan
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
