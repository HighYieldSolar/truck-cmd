"use client";

import { useState } from 'react';
import { Settings, RefreshCw } from 'lucide-react';

/**
 * A button that redirects to the Stripe Customer Portal for subscription management
 */
export default function StripePortalButton({
  userId,
  disabled = false,
  buttonText = "Manage Subscription",
  className = ""
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handlePortalRedirect = async () => {
    if (disabled || loading || !userId) return;

    try {
      setLoading(true);
      setError(null);

      // Create a portal session
      const response = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          returnUrl: window.location.href
        }),
      });

      const { url, error: responseError } = await response.json();

      if (responseError) {
        throw new Error(responseError);
      }

      // Redirect to Stripe Customer Portal
      window.location.href = url;

    } catch (err) {
      setError('Unable to access billing portal. Please try again or contact support.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handlePortalRedirect}
        disabled={disabled || loading || !userId}
        className={`flex items-center justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900 transition-colors ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        } ${className}`}
      >
        {loading ? (
          <>
            <RefreshCw size={16} className="animate-spin mr-2" />
            Loading...
          </>
        ) : (
          <>
            <Settings size={16} className="mr-2" />
            {buttonText}
          </>
        )}
      </button>

      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
