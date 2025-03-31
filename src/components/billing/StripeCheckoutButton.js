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
      
      console.log('Initiating checkout with:', { planId, billingCycle, userId });
      
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
          returnUrl: window.location.origin
        }),
      });
      
      // Log response status for debugging
      console.log('Response status:', response.status);
      
      // Parse the response
      const data = await response.json();
      console.log('Checkout response:', data);
      
      // Check for errors
      if (!response.ok) {
        throw new Error(data.error || `Server error: ${response.status}`);
      }
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      if (!data.url) {
        throw new Error('No checkout URL returned from server');
      }
      
      // Redirect to Stripe Checkout
      console.log('Redirecting to:', data.url);
      window.location.href = data.url;
      
    } catch (err) {
      console.error('Error initiating checkout:', err);
      
      // Detailed error logging
      if (err.response) {
        console.error('Response data:', err.response.data);
        console.error('Response status:', err.response.status);
      }
      
      setError(err.message || 'An unknown error occurred during checkout');
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