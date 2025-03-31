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
    
// In handleCheckout function
try {
  setLoading(true);
  setError(null);
  
  console.log('Submitting checkout with:', { userId, planId, billingCycle });
  
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
  
  // Log the full response for debugging
  console.log('Response status:', response.status);
  
  const data = await response.json();
  console.log('Response data:', data);
  
  if (!response.ok) {
    throw new Error(data.error || `Server error: ${response.status}`);
  }
  
  if (data.error) {
    throw new Error(data.error);
  }
  
  // Redirect to Stripe Checkout
  window.location.href = data.url;
} catch (err) {
  console.error('Error initiating checkout:', err);
  setError(err.message || 'An unknown error occurred');
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