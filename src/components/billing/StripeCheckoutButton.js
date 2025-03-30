"use client";

import { useState } from 'react';
import { CreditCard, RefreshCw } from 'lucide-react';

/**
 * A button component that initiates the Stripe checkout flow
 * 
 * @param {Object} props
 * @param {string} props.planId - ID of the selected plan
 * @param {string} props.billingCycle - 'monthly' or 'yearly'
 * @param {string} props.userId - User ID for the customer
 * @param {boolean} props.disabled - Whether the button is disabled
 * @param {string} props.buttonText - Text to display on the button
 * @param {string} props.className - Additional CSS classes
 */
export default function StripeCheckoutButton({
  planId,
  billingCycle,
  userId,
  disabled = false,
  buttonText = "Subscribe Now",
  className = ""
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCheckout = async () => {
    if (disabled || loading || !planId || !userId) return;
    
    try {
      setLoading(true);
      setError(null);
      
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
          returnUrl: window.location.origin + '/dashboard/billing'
        }),
      });
      
      const { url, error: responseError } = await response.json();
      
      if (responseError) {
        throw new Error(responseError);
      }
      
      // Redirect to Stripe Checkout
      window.location.href = url;
      
    } catch (err) {
      console.error('Error initiating checkout:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleCheckout}
        disabled={disabled || loading || !planId || !userId}
        className={`w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        } ${className}`}
      >
        {loading ? (
          <>
            <RefreshCw size={20} className="animate-spin mr-2" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard size={20} className="mr-2" />
            {buttonText}
          </>
        )}
      </button>
      
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}