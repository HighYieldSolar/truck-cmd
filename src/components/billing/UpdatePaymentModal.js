"use client";

import { useState, useEffect } from "react";
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
  X,
  CreditCard,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Lock,
  Link as LinkIcon
} from "lucide-react";

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

// Payment Form Component
function PaymentForm({ onSuccess, onError, onCancel, userEmail }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [email, setEmail] = useState(userEmail || "");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // Get the address from AddressElement
      const addressElement = elements.getElement("address");
      let billingDetails = { email };

      if (addressElement) {
        const { complete: addressComplete, value: addressValue } = await addressElement.getValue();

        if (!addressComplete) {
          setError("Please complete the billing address.");
          setProcessing(false);
          return;
        }

        billingDetails = {
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
        };
      }

      const { error: submitError, setupIntent } = await stripe.confirmSetup({
        elements,
        confirmParams: {
          return_url: window.location.href,
          payment_method_data: {
            billing_details: billingDetails
          }
        },
        redirect: "if_required"
      });

      if (submitError) {
        setError(submitError.message);
        onError(submitError.message);
      } else if (setupIntent && setupIntent.status === "succeeded") {
        onSuccess(setupIntent.payment_method);
      }
    } catch (err) {
      const userMessage = 'Failed to update payment method. Please try again or contact support.';
      setError(userMessage);
      onError(userMessage);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Email for Link integration */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Email
        </label>
        <LinkAuthenticationElement
          options={{
            defaultValues: {
              email: userEmail || ""
            }
          }}
          onChange={(e) => setEmail(e.value.email)}
        />
      </div>

      {/* Billing Address */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Billing address
        </label>
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

      {/* Payment Method */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Payment method
        </label>
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

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={processing}
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors disabled:opacity-50 text-sm"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || processing}
          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
        >
          {processing ? (
            <>
              <RefreshCw size={16} className="animate-spin" />
              Updating...
            </>
          ) : (
            <>
              <Lock size={14} />
              Update Payment
            </>
          )}
        </button>
      </div>

      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
        <Lock size={12} />
        <span>Secured by Stripe</span>
      </div>
    </form>
  );
}

// Main Modal Component
export default function UpdatePaymentModal({
  isOpen,
  onClose,
  userId,
  currentPaymentMethod,
  onUpdate
}) {
  const [clientSecret, setClientSecret] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [customerEmail, setCustomerEmail] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

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

  // Fetch SetupIntent when modal opens
  useEffect(() => {
    if (isOpen && userId) {
      fetchSetupIntent();
    }

    // Reset state when modal closes
    if (!isOpen) {
      setClientSecret(null);
      setError(null);
      setSuccess(false);
      setCustomerEmail(null);
    }
  }, [isOpen, userId]);

  const fetchSetupIntent = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/create-setup-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId })
      });

      const data = await response.json();

      if (response.ok && data.clientSecret) {
        setClientSecret(data.clientSecret);
        setCustomerEmail(data.customerEmail || null);
      } else {
        setError(data.error || "Failed to initialize payment form");
      }
    } catch (err) {
      setError("Failed to connect to payment service");
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = async (paymentMethodId) => {
    // Update the default payment method
    try {
      const response = await fetch("/api/update-payment-method", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, paymentMethodId })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(true);
        if (onUpdate) {
          onUpdate(data.paymentMethod);
        }
        // Close modal after a brief delay
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError(data.error || "Failed to update payment method");
      }
    } catch (err) {
      setError("Failed to save payment method");
    }
  };

  const handleError = (message) => {
    setError(message);
  };

  if (!isOpen) return null;

  // Stripe appearance - supports light and dark mode
  const appearance = {
    theme: isDarkMode ? "night" : "stripe",
    variables: {
      colorPrimary: "#2563eb",
      colorBackground: isDarkMode ? "#374151" : "#ffffff",
      colorText: isDarkMode ? "#ffffff" : "#1f2937",
      colorTextSecondary: isDarkMode ? "#9ca3af" : "#6b7280",
      colorDanger: "#dc2626",
      fontFamily: "system-ui, sans-serif",
      borderRadius: "8px"
    },
    rules: {
      ".Input": {
        backgroundColor: isDarkMode ? "#374151" : "#ffffff",
        border: isDarkMode ? "1px solid #4b5563" : "1px solid #d1d5db",
        color: isDarkMode ? "#ffffff" : "#1f2937",
        lineHeight: "1.4"
      },
      ".Input:focus": {
        borderColor: "#2563eb",
        boxShadow: "0 0 0 1px #2563eb"
      },
      ".Input::placeholder": {
        color: isDarkMode ? "#6b7280" : "#9ca3af"
      },
      ".Label": {
        color: isDarkMode ? "#9ca3af" : "#4b5563"
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md max-h-[90vh] bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
              <CreditCard size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Update Payment Method
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Enter your new payment details
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Current Payment Method */}
          {currentPaymentMethod && !success && (
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Current payment method</p>
              <div className="flex items-center gap-3">
                {currentPaymentMethod.type === 'link' ? (
                  <>
                    <div className="w-10 h-6 bg-[#00D66F] rounded flex items-center justify-center">
                      <LinkIcon size={14} className="text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Link</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {currentPaymentMethod.email}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-10 h-6 bg-gradient-to-r from-gray-700 to-gray-900 dark:from-gray-500 dark:to-gray-700 rounded flex items-center justify-center">
                      <CreditCard size={14} className="text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                        {currentPaymentMethod.card?.brand || 'Card'} •••• {currentPaymentMethod.card?.last4}
                      </p>
                      {currentPaymentMethod.card?.exp_month && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Expires {currentPaymentMethod.card.exp_month}/{currentPaymentMethod.card.exp_year}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Success State */}
          {success && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Payment Method Updated
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Your new payment method has been saved successfully.
              </p>
            </div>
          )}

          {/* Loading State */}
          {loading && !success && (
            <div className="flex flex-col items-center justify-center py-12">
              <RefreshCw size={32} className="animate-spin text-blue-600 dark:text-blue-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Loading payment form...</p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && !success && !clientSecret && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={32} className="text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Something went wrong
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
              <button
                onClick={fetchSetupIntent}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Payment Form */}
          {clientSecret && !loading && !success && (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance,
                loader: "auto"
              }}
            >
              <PaymentForm
                onSuccess={handleSuccess}
                onError={handleError}
                onCancel={onClose}
                userEmail={customerEmail || currentPaymentMethod?.email}
              />
            </Elements>
          )}
        </div>
      </div>
    </div>
  );
}
