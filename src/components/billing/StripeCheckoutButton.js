"use client";

import { useState } from 'react';
import { CreditCard, RefreshCw } from 'lucide-react';

/**
 * An improved button component that initiates the Stripe checkout flow
 * with added idempotency and error handling
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
  const [checkoutInitiated, setCheckoutInitiated] = useState(false);

  const handleCheckout = async () => {
    // Prevent multiple clicks or processing when already in progress
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
      
      console.log('Initiating checkout with:', { planId, billingCycle, userId, checkoutId });
      
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
          returnUrl: `${window.location.origin}/dashboard/billing/success` // This is the line to change
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
      
      // Save additional information to help with recovery if needed
      sessionStorage.setItem('checkout_timestamp', Date.now().toString());
      sessionStorage.setItem('checkout_plan', planId);
      sessionStorage.setItem('checkout_billing_cycle', billingCycle);
      
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
      setCheckoutInitiated(false);
      
      // Clear any stored checkout data on error
      localStorage.removeItem('lastCheckoutId');
    }
  };

  return (
    <div>
      <button
        onClick={handleCheckout}
        disabled={disabled || loading || checkoutInitiated || !planId || !userId}
        className={`w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
          disabled || loading || checkoutInitiated ? 'opacity-50 cursor-not-allowed' : ''
        } ${className}`}
      >
        {loading || checkoutInitiated ? (
          <>
            <RefreshCw size={20} className="animate-spin mr-2" />
            {checkoutInitiated ? 'Redirecting to Stripe...' : 'Processing...'}
          </>
        ) : (
          <>
            <CreditCard size={20} className="mr-2" />
            {buttonText}
          </>
        )}
      </button>
      
      {error && (
        <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
          <p className="font-medium">Error:</p>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}