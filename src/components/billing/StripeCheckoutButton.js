"use client";

import { useState } from 'react';
import { CreditCard, RefreshCw } from 'lucide-react';
import { useTranslation } from "@/context/LanguageContext";

/**
 * A button component that initiates the Stripe checkout flow
 * with idempotency and error handling
 */
export default function StripeCheckoutButton({
  planId,
  billingCycle,
  userId,
  disabled = false,
  buttonText,
  className = "",
  returnUrl = ""
}) {
  const { t } = useTranslation('billing');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [checkoutInitiated, setCheckoutInitiated] = useState(false);

  // Use translated default if no buttonText provided
  const displayButtonText = buttonText || t('checkout.subscribeNow');

  const handleCheckout = async () => {
    if (disabled || loading || checkoutInitiated || !planId || !userId) return;

    try {
      setLoading(true);
      setError(null);
      setCheckoutInitiated(true);

      // Store the user ID in localStorage and sessionStorage for the redirect page to use
      localStorage.setItem('userId', userId);
      sessionStorage.setItem('userId', userId);

      // Generate a unique checkout ID to prevent duplicate checkouts
      const checkoutId = `checkout_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      localStorage.setItem('lastCheckoutId', checkoutId);

      // Create a checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          plan: planId,
          billingCycle,
          checkoutId,
          returnUrl: returnUrl || `${window.location.origin}/dashboard/upgrade/success`
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
      setError(err.message || 'An unknown error occurred during checkout');
      setLoading(false);
      setCheckoutInitiated(false);
      localStorage.removeItem('lastCheckoutId');
    }
  };

  return (
    <div>
      <button
        onClick={handleCheckout}
        disabled={disabled || loading || checkoutInitiated || !planId || !userId}
        className={`w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900 transition-colors ${
          disabled || loading || checkoutInitiated ? 'opacity-50 cursor-not-allowed' : ''
        } ${className}`}
      >
        {loading || checkoutInitiated ? (
          <>
            <RefreshCw size={20} className="animate-spin mr-2" />
            {checkoutInitiated ? t('checkout.redirectingToStripe') : t('checkout.processing')}
          </>
        ) : (
          <>
            <CreditCard size={20} className="mr-2" />
            {displayButtonText}
          </>
        )}
      </button>

      {error && (
        <div className="mt-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded border border-red-200 dark:border-red-800">
          <p className="font-medium">{t('checkout.error')}:</p>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}
