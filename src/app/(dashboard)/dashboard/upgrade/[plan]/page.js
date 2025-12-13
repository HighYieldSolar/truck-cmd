"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  AddressElement,
  LinkAuthenticationElement,
  useStripe,
  useElements
} from "@stripe/react-stripe-js";
import {
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  Lock,
  Info,
  CreditCard,
  ExternalLink,
  Tag,
  Check,
  X,
  Calendar
} from "lucide-react";
import { useSubscription } from "@/context/SubscriptionContext";

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

// Checkout Form Component
function CheckoutForm({ selectedPlan, billingCycle, planData, onSuccess, onError, userEmail, appliedCoupon, amountDue }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [email, setEmail] = useState(userEmail || "");
  const [billingAddress, setBillingAddress] = useState(null);
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState(null);
  const [validatedCoupon, setValidatedCoupon] = useState(appliedCoupon || null);
  const [couponPricing, setCouponPricing] = useState(null);

  // Validate coupon code
  const handleValidateCoupon = async () => {
    if (!couponCode.trim()) return;

    setCouponLoading(true);
    setCouponError(null);

    try {
      const response = await fetch("/api/validate-coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          couponCode: couponCode.trim(),
          plan: selectedPlan,
          billingCycle: billingCycle
        })
      });

      const data = await response.json();

      if (data.valid) {
        setValidatedCoupon(data.coupon);
        setCouponPricing(data.pricing);
      } else {
        setCouponError(data.error || "Invalid coupon code");
        setValidatedCoupon(null);
        setCouponPricing(null);
      }
    } catch (err) {
      setCouponError("Failed to validate coupon");
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setValidatedCoupon(null);
    setCouponPricing(null);
    setCouponCode("");
    setCouponError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    if (!agreedToTerms) {
      setErrorMessage("Please agree to the terms and conditions.");
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // Get the address from AddressElement
      const addressElement = elements.getElement("address");
      const { complete: addressComplete, value: addressValue } = await addressElement.getValue();

      if (!addressComplete) {
        setErrorMessage("Please complete the billing address.");
        setIsProcessing(false);
        return;
      }

      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/dashboard/upgrade/success`,
          payment_method_data: {
            billing_details: {
              name: addressValue.name,
              email: email,
              address: {
                line1: addressValue.address.line1,
                line2: addressValue.address.line2 || "",
                city: addressValue.address.city,
                state: addressValue.address.state,
                postal_code: addressValue.address.postal_code,
                country: addressValue.address.country,
              }
            }
          }
        },
        redirect: "if_required"
      });

      if (error) {
        setErrorMessage(error.message);
        onError?.(error.message);
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        onSuccess?.();
      }
    } catch (err) {
      setErrorMessage(err.message || "An unexpected error occurred");
      onError?.(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const originalTotal = billingCycle === "yearly" ? planData.yearlyTotal : planData.monthlyPrice;
  const price = billingCycle === "yearly" ? planData.yearlyPrice : planData.monthlyPrice;

  // Calculate final total with coupon discount
  const discountAmount = couponPricing?.discountAmount || 0;
  const finalTotal = couponPricing?.finalPrice ?? (amountDue ?? originalTotal);

  // Calculate next billing date
  const nextBillingDate = new Date();
  if (billingCycle === "yearly") {
    nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
  } else {
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Order Details Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-5 border border-gray-200 dark:border-gray-700">
        <h3 className="text-gray-900 dark:text-white font-medium mb-4">Order details</h3>

        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <div>
              <p className="text-blue-600 dark:text-blue-400 font-medium">{planData.name} plan</p>
              <p className="text-gray-500 dark:text-gray-400 text-xs">Billed {billingCycle}</p>
            </div>
            <span className="text-gray-900 dark:text-white">${originalTotal}</span>
          </div>

          {/* Coupon Code Input */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
            {!validatedCoupon ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Coupon code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleValidateCoupon())}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleValidateCoupon}
                    disabled={couponLoading || !couponCode.trim()}
                    className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 border border-blue-600 dark:border-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {couponLoading ? <RefreshCw size={14} className="animate-spin" /> : "Apply"}
                  </button>
                </div>
                {couponError && (
                  <p className="text-xs text-red-500 dark:text-red-400">{couponError}</p>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <Check size={16} className="text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                      {validatedCoupon.name || validatedCoupon.id}
                    </p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400">
                      {validatedCoupon.discountDisplay} • {validatedCoupon.durationMessage}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={removeCoupon}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Subtotal</span>
              <span className="text-gray-900 dark:text-white">${originalTotal}</span>
            </div>
            {validatedCoupon && discountAmount > 0 && (
              <div className="flex justify-between text-sm mt-2">
                <span className="text-emerald-600 dark:text-emerald-400">Discount ({validatedCoupon.discountDisplay})</span>
                <span className="text-emerald-600 dark:text-emerald-400">-${discountAmount.toFixed(2)}</span>
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
            <div className="flex justify-between">
              <span className="text-gray-900 dark:text-white font-medium">Total due today</span>
              <div className="text-right">
                {validatedCoupon && discountAmount > 0 && (
                  <span className="text-sm text-gray-400 line-through mr-2">${originalTotal}</span>
                )}
                <span className="text-gray-900 dark:text-white font-bold">${finalTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Renewal notice */}
        <div className="mt-4 flex items-start gap-2 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg">
          <Info size={14} className="flex-shrink-0 mt-0.5" />
          <p>
            Your subscription will auto renew on {nextBillingDate.toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "numeric" })}.
            {validatedCoupon?.duration === 'once' ? (
              <> Full price of ${originalTotal}/{billingCycle === "yearly" ? "year" : "month"} + tax applies after discount.</>
            ) : (
              <> You will be charged ${validatedCoupon ? finalTotal.toFixed(2) : originalTotal}/{billingCycle === "yearly" ? "year" : "month"} + tax.</>
            )}
          </p>
        </div>
      </div>

      {/* Payment Method Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-5 border border-gray-200 dark:border-gray-700">
        <h3 className="text-gray-900 dark:text-white font-medium mb-4">Payment method</h3>

        {/* Email for Link integration - enables "Save my info" */}
        <div className="mb-5">
          <LinkAuthenticationElement
            options={{
              defaultValues: {
                email: userEmail || ""
              }
            }}
            onChange={(e) => setEmail(e.value.email)}
          />
        </div>

        {/* Billing Address - Expands as user fills it out */}
        <div className="mb-5">
          <AddressElement
            options={{
              mode: "billing",
              defaultValues: {
                address: { country: "US" }
              },
              fields: {
                phone: "never"
              },
              display: {
                name: "full"
              }
            }}
          />
        </div>

        {/* Card Details */}
        <PaymentElement
          options={{
            fields: {
              billingDetails: "never"
            },
            wallets: {
              applePay: "auto",
              googlePay: "never"
            }
          }}
        />
      </div>

      {/* Terms Checkbox */}
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          id="terms"
          checked={agreedToTerms}
          onChange={(e) => setAgreedToTerms(e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-blue-500 focus:ring-blue-500"
        />
        <label htmlFor="terms" className="text-sm text-gray-600 dark:text-gray-300">
          You agree that Truck Command will charge your card in the amount above now and on a recurring {billingCycle} basis until you cancel in accordance with our{" "}
          <Link href="/terms" className="text-blue-600 dark:text-blue-400 hover:underline">terms</Link>.
          You can cancel at any time in your account settings.
        </label>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-red-500 dark:text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-600 dark:text-red-300">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Subscribe Button */}
      <button
        type="submit"
        disabled={!stripe || isProcessing || !agreedToTerms}
        className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-all flex items-center justify-center gap-2 ${
          isProcessing || !agreedToTerms
            ? "bg-gray-600 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {isProcessing ? (
          <>
            <RefreshCw size={18} className="animate-spin" />
            Processing...
          </>
        ) : (
          "Subscribe"
        )}
      </button>

      <div className="flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
        <Lock size={12} />
        <span>Secured by Stripe</span>
      </div>
    </form>
  );
}

// Main Page Component
export default function UpgradePlanPage() {
  const router = useRouter();
  const params = useParams();
  const planId = params.plan;

  const [loading, setLoading] = useState(true);
  const [clientSecret, setClientSecret] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  // Initialize billing cycle from sessionStorage to maintain state across navigation
  const [billingCycle, setBillingCycle] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem("checkout_billing_cycle") || "monthly";
    }
    return "monthly";
  });
  const [isUpgradeMode, setIsUpgradeMode] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [prorationPreview, setProrationPreview] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [isCanceledAtPeriodEnd, setIsCanceledAtPeriodEnd] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [amountDue, setAmountDue] = useState(null);
  const [upgradeCouponCode, setUpgradeCouponCode] = useState("");
  const [upgradeCouponLoading, setUpgradeCouponLoading] = useState(false);
  const [upgradeCouponError, setUpgradeCouponError] = useState(null);
  const [validatedUpgradeCoupon, setValidatedUpgradeCoupon] = useState(null);

  // Detect dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };

    checkDarkMode();

    // Watch for dark mode changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, []);

  const { user, subscription, isSubscriptionActive } = useSubscription();

  // Ref to prevent double API calls in React Strict Mode
  const intentCreatedRef = useRef(false);
  const currentPlanRef = useRef(null);

  // Plans data
  const plans = {
    basic: {
      id: "basic",
      name: "Basic",
      description: "For owner-operators just getting started",
      monthlyPrice: 20,
      yearlyPrice: 16,
      yearlyTotal: 192,
      savings: 48,
      limits: "1 Truck • 1 Driver • 50 Loads/mo"
    },
    premium: {
      id: "premium",
      name: "Premium",
      description: "For growing owner-operators",
      monthlyPrice: 35,
      yearlyPrice: 28,
      yearlyTotal: 336,
      savings: 84,
      limits: "3 Trucks • 3 Drivers • Unlimited Loads"
    },
    fleet: {
      id: "fleet",
      name: "Fleet",
      description: "For small to medium fleets",
      monthlyPrice: 75,
      yearlyPrice: 60,
      yearlyTotal: 720,
      savings: 180,
      limits: "12 Trucks • 12 Drivers • 6 Team Users"
    }
  };

  const selectedPlan = plans[planId];

  useEffect(() => {
    // Save current plan to session storage for success page
    if (planId) {
      sessionStorage.setItem("checkout_plan", planId);
    }

    // Prevent double API calls in React Strict Mode
    // Use billingCycle state which is already initialized from sessionStorage
    const planKey = `${planId}-${billingCycle}`;
    if (intentCreatedRef.current && currentPlanRef.current === planKey) {
      return;
    }

    if (user && selectedPlan) {
      intentCreatedRef.current = true;
      currentPlanRef.current = planKey;

      // Check if user already has an active subscription with Stripe
      // If so, they need to use the upgrade flow, not checkout
      const hasActiveStripeSubscription =
        isSubscriptionActive &&
        isSubscriptionActive() &&
        subscription?.stripeSubscriptionId;

      if (hasActiveStripeSubscription) {
        // User has active subscription - use upgrade mode
        setIsUpgradeMode(true);
        setLoading(false);
        // Fetch proration preview and payment method
        fetchUpgradePreview(planId, billingCycle);
      } else {
        // User doesn't have active subscription - use checkout flow
        setIsUpgradeMode(false);
        createSubscriptionIntent(planId, billingCycle);
      }
    } else if (!selectedPlan) {
      setErrorMessage("Invalid plan selected");
      setLoading(false);
    }
  }, [user, planId, subscription, isSubscriptionActive, billingCycle]);

  const createSubscriptionIntent = async (plan, cycle, couponCode = null) => {
    try {
      setLoading(true);
      setErrorMessage(null);

      const requestBody = {
        userId: user.id,
        email: user.email,
        plan: plan,
        billingCycle: cycle
      };

      // Add coupon if provided
      if (couponCode) {
        requestBody.couponCode = couponCode;
      }

      const response = await fetch("/api/create-subscription-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create payment intent");
      }

      setClientSecret(data.clientSecret);

      // Store applied coupon and amount due from response
      if (data.appliedCoupon) {
        setAppliedCoupon(data.appliedCoupon);
      }
      if (data.amountDue !== null && data.amountDue !== undefined) {
        setAmountDue(data.amountDue);
      }
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch proration preview and payment method for upgrade mode
  const fetchUpgradePreview = async (plan, cycle) => {
    setLoadingPreview(true);
    try {
      const response = await fetch("/api/preview-upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          newPlan: plan,
          newBillingCycle: cycle
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setProrationPreview(data.proration);
        setPaymentMethod(data.paymentMethod);
        setIsCanceledAtPeriodEnd(data.isCanceledAtPeriodEnd || false);
      }
    } catch (err) {
      console.error("Error fetching upgrade preview:", err);
    } finally {
      setLoadingPreview(false);
    }
  };

  // Validate coupon for upgrade mode
  const handleValidateUpgradeCoupon = async () => {
    if (!upgradeCouponCode.trim()) return;

    setUpgradeCouponLoading(true);
    setUpgradeCouponError(null);

    try {
      const response = await fetch("/api/validate-coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          couponCode: upgradeCouponCode.trim(),
          plan: planId,
          billingCycle: billingCycle
        })
      });

      const data = await response.json();

      if (data.valid) {
        setValidatedUpgradeCoupon(data.coupon);
      } else {
        setUpgradeCouponError(data.error || "Invalid coupon code");
        setValidatedUpgradeCoupon(null);
      }
    } catch (err) {
      setUpgradeCouponError("Failed to validate coupon");
    } finally {
      setUpgradeCouponLoading(false);
    }
  };

  const removeUpgradeCoupon = () => {
    setValidatedUpgradeCoupon(null);
    setUpgradeCouponCode("");
    setUpgradeCouponError(null);
  };

  const handleBillingCycleChange = (newCycle) => {
    setBillingCycle(newCycle);
    sessionStorage.setItem("checkout_billing_cycle", newCycle);
    sessionStorage.setItem("checkout_plan", planId);
    // Reset ref to allow new intent for different cycle
    currentPlanRef.current = `${planId}-${newCycle}`;

    // Clear coupon when changing billing cycle
    setValidatedUpgradeCoupon(null);
    setUpgradeCouponCode("");
    setUpgradeCouponError(null);

    // Only create new intent if NOT in upgrade mode
    if (user && !isUpgradeMode) {
      createSubscriptionIntent(planId, newCycle);
    } else if (isUpgradeMode) {
      // Fetch new proration preview for different cycle
      fetchUpgradePreview(planId, newCycle);
    }
  };

  // Handle upgrade for users with existing active subscriptions
  const handleUpgrade = async () => {
    if (upgrading) return;

    setUpgrading(true);
    setErrorMessage(null);

    try {
      const requestBody = {
        userId: user.id,
        newPlan: planId,
        newBillingCycle: billingCycle
      };

      // Add coupon if validated
      if (validatedUpgradeCoupon) {
        requestBody.couponCode = validatedUpgradeCoupon.id;
      }

      const response = await fetch("/api/update-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to upgrade subscription");
      }

      // Save info for success page
      sessionStorage.setItem("checkout_plan", planId);
      sessionStorage.setItem("checkout_billing_cycle", billingCycle);
      sessionStorage.setItem("upgrade_result", JSON.stringify({
        changeType: data.changeType,
        message: data.message
      }));

      router.push("/dashboard/upgrade/success");
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setUpgrading(false);
    }
  };

  const handleSuccess = () => {
    // Ensure plan info is saved before navigating
    sessionStorage.setItem("checkout_plan", planId);
    sessionStorage.setItem("checkout_billing_cycle", billingCycle);
    router.push("/dashboard/upgrade/success");
  };

  // Stripe appearance - supports light and dark mode
  const appearance = {
    theme: isDarkMode ? "night" : "stripe",
    variables: {
      colorPrimary: "#3b82f6",
      colorBackground: isDarkMode ? "#374151" : "#ffffff",
      colorText: isDarkMode ? "#ffffff" : "#1f2937",
      colorTextSecondary: isDarkMode ? "#9ca3af" : "#6b7280",
      colorDanger: "#ef4444",
      fontFamily: "system-ui, sans-serif",
      borderRadius: "6px",
      spacingUnit: "4px"
    },
    rules: {
      ".Input": {
        backgroundColor: isDarkMode ? "#374151" : "#ffffff",
        border: isDarkMode ? "1px solid #4b5563" : "1px solid #d1d5db",
        color: isDarkMode ? "#ffffff" : "#1f2937",
        padding: "12px",
        lineHeight: "1.4"
      },
      ".Input:focus": {
        border: "1px solid #3b82f6",
        boxShadow: "0 0 0 1px #3b82f6"
      },
      ".Input::placeholder": {
        color: isDarkMode ? "#6b7280" : "#9ca3af"
      },
      ".Label": {
        color: isDarkMode ? "#9ca3af" : "#4b5563",
        fontSize: "14px",
        marginBottom: "8px"
      },
      ".CheckboxInput": {
        backgroundColor: isDarkMode ? "#374151" : "#ffffff",
        borderColor: isDarkMode ? "#4b5563" : "#d1d5db"
      },
      ".CheckboxInput--checked": {
        backgroundColor: "#3b82f6",
        borderColor: "#3b82f6"
      },
      ".CheckboxLabel": {
        color: isDarkMode ? "#d1d5db" : "#374151"
      }
    }
  };

  if (loading || !user) {
    return (
      <DashboardLayout activePage="upgrade">
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center justify-center min-h-screen">
            <div className="flex flex-col items-center">
              <RefreshCw size={40} className="animate-spin text-blue-500 dark:text-blue-400 mb-4" />
              <p className="text-lg text-gray-600 dark:text-gray-300">Loading checkout...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!selectedPlan) {
    return (
      <DashboardLayout activePage="upgrade">
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle size={48} className="text-red-500 dark:text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Invalid Plan</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">The selected plan does not exist.</p>
            <button
              onClick={() => router.push("/dashboard/upgrade")}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              View available plans
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
          </button>

          {/* Plan Title */}
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{selectedPlan.name} plan</h1>

          {/* Billing Cycle Selection - Hide the option that matches user's current subscription */}
          {(() => {
            const currentPlan = subscription?.plan?.toLowerCase();
            const currentBillingCycle = subscription?.billing_cycle || 'monthly';
            const isOnSamePlan = currentPlan === planId;
            const isCurrentMonthly = isOnSamePlan && currentBillingCycle === 'monthly';
            const isCurrentYearly = isOnSamePlan && currentBillingCycle === 'yearly';

            // If user is on same plan, only show the OTHER billing cycle option
            const showMonthly = !isCurrentMonthly;
            const showYearly = !isCurrentYearly;
            const showBothOptions = showMonthly && showYearly;

            return (
              <div className={`grid ${showBothOptions ? 'grid-cols-2' : 'grid-cols-1'} gap-3 mb-6`}>
                {showMonthly && (
                  <button
                    onClick={() => handleBillingCycleChange("monthly")}
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
                    <p className="text-gray-500 dark:text-gray-400 text-xs">${selectedPlan.monthlyPrice}/month + tax</p>
                  </button>
                )}

                {showYearly && (
                  <button
                    onClick={() => handleBillingCycleChange("yearly")}
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
                    <p className="text-gray-500 dark:text-gray-400 text-xs">${selectedPlan.yearlyPrice}/month + tax</p>
                  </button>
                )}
              </div>
            );
          })()}

          {/* Error message */}
          {errorMessage && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400 flex-shrink-0" />
                <p className="text-red-600 dark:text-red-300">{errorMessage}</p>
              </div>
              {!isUpgradeMode && (
                <button
                  onClick={() => createSubscriptionIntent(planId, billingCycle)}
                  className="mt-3 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
                >
                  Try again
                </button>
              )}
            </div>
          )}

          {/* UPGRADE MODE: Show confirmation UI for users with existing subscription */}
          {isUpgradeMode && (
            <div className="space-y-6">
              {/* Order Details Card */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-5 border border-gray-200 dark:border-gray-700">
                <h3 className="text-gray-900 dark:text-white font-medium mb-4">Upgrade details</h3>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Current plan</p>
                      <p className="text-gray-900 dark:text-white font-medium capitalize">{subscription?.plan || "Trial"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-500 dark:text-gray-400">New plan</p>
                      <p className="text-blue-600 dark:text-blue-400 font-medium">{selectedPlan.name}</p>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">New price</span>
                      <span className="text-gray-900 dark:text-white">
                        ${billingCycle === "yearly" ? selectedPlan.yearlyTotal : selectedPlan.monthlyPrice}/{billingCycle === "yearly" ? "year" : "month"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Coupon Code for Upgrades */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-5 border border-gray-200 dark:border-gray-700">
                <h3 className="text-gray-900 dark:text-white font-medium mb-4">Promo code</h3>

                {!validatedUpgradeCoupon ? (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Enter coupon code"
                          value={upgradeCouponCode}
                          onChange={(e) => setUpgradeCouponCode(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleValidateUpgradeCoupon())}
                          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleValidateUpgradeCoupon}
                        disabled={upgradeCouponLoading || !upgradeCouponCode.trim()}
                        className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 border border-blue-600 dark:border-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {upgradeCouponLoading ? <RefreshCw size={14} className="animate-spin" /> : "Apply"}
                      </button>
                    </div>
                    {upgradeCouponError && (
                      <p className="text-xs text-red-500 dark:text-red-400">{upgradeCouponError}</p>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Check size={16} className="text-emerald-600 dark:text-emerald-400" />
                      <div>
                        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                          {validatedUpgradeCoupon.name || validatedUpgradeCoupon.id}
                        </p>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400">
                          {validatedUpgradeCoupon.discountDisplay} • {validatedUpgradeCoupon.durationMessage}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeUpgradeCoupon}
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>

              {/* Cancellation Notice */}
              {isCanceledAtPeriodEnd && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle size={20} className="text-amber-500 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-amber-700 dark:text-amber-300 font-medium mb-1">Cancellation will be reversed</h3>
                      <p className="text-amber-600/80 dark:text-amber-200/70 text-sm">
                        Your subscription is currently set to cancel. By upgrading, your cancellation will be removed and your subscription will continue.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Proration Preview Card */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-5 border border-gray-200 dark:border-gray-700">
                <h3 className="text-gray-900 dark:text-white font-medium mb-4">Amount due today</h3>

                {loadingPreview ? (
                  <div className="flex items-center justify-center py-4">
                    <RefreshCw size={20} className="animate-spin text-blue-500 dark:text-blue-400" />
                    <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">Calculating...</span>
                  </div>
                ) : prorationPreview ? (
                  <div className="space-y-3">
                    {/* Current plan credit */}
                    {prorationPreview.credit > 0 && (
                      <div className="flex justify-between text-sm">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Unused time credit</span>
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            {prorationPreview.daysRemaining} days remaining on {prorationPreview.currentPlan}
                          </p>
                        </div>
                        <span className="text-emerald-600 dark:text-emerald-400">-${prorationPreview.credit.toFixed(2)}</span>
                      </div>
                    )}

                    {/* New plan charge */}
                    {prorationPreview.charge > 0 && (
                      <div className="flex justify-between text-sm">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">{selectedPlan.name} (prorated)</span>
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            Until {prorationPreview.nextBillingDate}
                          </p>
                        </div>
                        <span className="text-gray-900 dark:text-white">${prorationPreview.charge.toFixed(2)}</span>
                      </div>
                    )}

                    {/* Divider and total */}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                      <div className="flex justify-between">
                        <span className="text-gray-900 dark:text-white font-medium">Total due now</span>
                        <span className="text-gray-900 dark:text-white font-bold text-lg">
                          ${prorationPreview.amountDueNow.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Credit balance notice when credit > charge */}
                    {prorationPreview.credit > prorationPreview.charge && prorationPreview.amountDueNow === 0 && (
                      <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3 mt-3">
                        <p className="text-emerald-700 dark:text-emerald-300 text-sm">
                          <span className="font-medium">
                            ${(prorationPreview.credit - prorationPreview.charge).toFixed(2)} credit
                          </span>{" "}
                          will be applied to your future invoices.
                        </p>
                      </div>
                    )}

                    {/* Next billing info */}
                    <div className="text-xs text-gray-500 dark:text-gray-400 pt-2">
                      Then ${billingCycle === "yearly" ? selectedPlan.yearlyTotal : selectedPlan.monthlyPrice}/{billingCycle === "yearly" ? "year" : "month"} starting {prorationPreview.nextBillingDate}
                    </div>

                    {prorationPreview.estimatedOnly && (
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        * Estimated amount. Final charge may vary slightly.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Prorated upgrade charge</span>
                      <span className="text-gray-900 dark:text-white">Calculated at checkout</span>
                    </div>
                    <div className="flex items-start gap-2 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg">
                      <Info size={14} className="flex-shrink-0 mt-0.5" />
                      <p>
                        You'll only pay the difference for the remaining time in your billing period.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Method Card */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-5 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-900 dark:text-white font-medium">Payment method</h3>
                  <button
                    onClick={() => router.push("/dashboard/settings/billing?openPayment=true")}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 flex items-center gap-1"
                  >
                    Change
                    <ExternalLink size={14} />
                  </button>
                </div>

                {loadingPreview ? (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="w-10 h-6 bg-gray-200 dark:bg-gray-600 rounded animate-pulse" />
                    <div className="flex-1">
                      <div className="h-4 w-24 bg-gray-200 dark:bg-gray-600 rounded animate-pulse" />
                    </div>
                  </div>
                ) : paymentMethod ? (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="w-10 h-6 bg-gradient-to-r from-gray-700 to-gray-900 dark:from-gray-500 dark:to-gray-700 rounded flex items-center justify-center">
                      <CreditCard size={14} className="text-white" />
                    </div>
                    <div className="flex-1">
                      {paymentMethod.type === 'card' ? (
                        <>
                          <p className="text-sm text-gray-900 dark:text-white font-medium capitalize">
                            {paymentMethod.brand} •••• {paymentMethod.last4}
                          </p>
                          {paymentMethod.expMonth && paymentMethod.expYear && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Expires {paymentMethod.expMonth}/{paymentMethod.expYear}
                            </p>
                          )}
                        </>
                      ) : paymentMethod.type === 'link' ? (
                        <>
                          <p className="text-sm text-gray-900 dark:text-white font-medium">
                            Link
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {paymentMethod.email}
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-gray-900 dark:text-white font-medium">
                          Payment method on file
                        </p>
                      )}
                    </div>
                    <Lock size={14} className="text-gray-400 dark:text-gray-500" />
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <CreditCard size={20} className="text-gray-400 dark:text-gray-500" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Your saved payment method will be charged
                    </p>
                  </div>
                )}
              </div>

              {/* Upgrade Button */}
              <button
                onClick={handleUpgrade}
                disabled={upgrading || loadingPreview}
                className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-all flex items-center justify-center gap-2 ${
                  upgrading || loadingPreview
                    ? "bg-gray-600 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {upgrading ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    Upgrading...
                  </>
                ) : (
                  <>
                    Upgrade to {selectedPlan.name}
                    {prorationPreview && (
                      <span className="ml-1">• ${prorationPreview.amountDueNow.toFixed(2)}</span>
                    )}
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <Lock size={12} />
                <span>Secured by Stripe</span>
              </div>
            </div>
          )}

          {/* CHECKOUT MODE: Stripe Elements for users without active subscription */}
          {!isUpgradeMode && clientSecret && (
            <Elements stripe={stripePromise} options={{ clientSecret, appearance, loader: "auto" }}>
              <CheckoutForm
                selectedPlan={planId}
                billingCycle={billingCycle}
                planData={selectedPlan}
                onSuccess={handleSuccess}
                onError={(msg) => setErrorMessage(msg)}
                userEmail={user?.email || ""}
                appliedCoupon={appliedCoupon}
                amountDue={amountDue}
              />
            </Elements>
          )}

          {/* Loading state - only for checkout mode */}
          {!isUpgradeMode && !clientSecret && !errorMessage && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-8 border border-gray-200 dark:border-gray-700">
              <div className="flex flex-col items-center">
                <RefreshCw size={24} className="animate-spin text-blue-500 dark:text-blue-400 mb-3" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">Preparing payment form...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
