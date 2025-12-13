"use client";

import { useState } from "react";
import { AlertTriangle, CreditCard, X, Clock } from "lucide-react";
import UpdatePaymentModal from "./UpdatePaymentModal";

export default function FailedPaymentBanner({
  subscription,
  userId,
  onDismiss
}) {
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Only show for past_due status
  if (!subscription || subscription.status !== 'past_due' || dismissed) {
    return null;
  }

  const failureCount = subscription.payment_failure_count || 1;
  const nextRetry = subscription.next_payment_retry_at
    ? new Date(subscription.next_payment_retry_at)
    : null;

  const handleDismiss = () => {
    setDismissed(true);
    if (onDismiss) {
      onDismiss();
    }
  };

  const handlePaymentUpdate = () => {
    setShowUpdateModal(false);
    // The subscription will be updated via webhook when Stripe retries
  };

  // Calculate urgency based on failure count
  const isUrgent = failureCount >= 3;
  const bgColor = isUrgent
    ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
    : "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800";
  const iconColor = isUrgent
    ? "text-red-600 dark:text-red-400"
    : "text-amber-600 dark:text-amber-400";
  const textColor = isUrgent
    ? "text-red-800 dark:text-red-200"
    : "text-amber-800 dark:text-amber-200";

  return (
    <>
      <div className={`rounded-lg border p-4 mb-4 ${bgColor}`}>
        <div className="flex items-start gap-3">
          <div className={`flex-shrink-0 ${iconColor}`}>
            <AlertTriangle size={20} />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className={`font-semibold ${textColor}`}>
              {isUrgent ? "Action Required: Payment Failed" : "Payment Issue"}
            </h3>

            <p className={`mt-1 text-sm ${textColor} opacity-90`}>
              {failureCount === 1
                ? "We couldn't process your last payment. Please update your payment method to avoid service interruption."
                : `We've tried to process your payment ${failureCount} times without success. Please update your payment method immediately to keep your account active.`
              }
            </p>

            {nextRetry && !isUrgent && (
              <p className={`mt-2 text-xs flex items-center gap-1 ${textColor} opacity-75`}>
                <Clock size={12} />
                Next retry: {nextRetry.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit'
                })}
              </p>
            )}

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => setShowUpdateModal(true)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                  ${isUrgent
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : "bg-amber-600 hover:bg-amber-700 text-white"
                  }`}
              >
                <CreditCard size={16} />
                Update Payment Method
              </button>
            </div>
          </div>

          {!isUrgent && (
            <button
              onClick={handleDismiss}
              className={`flex-shrink-0 p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${iconColor}`}
              aria-label="Dismiss"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      <UpdatePaymentModal
        isOpen={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        userId={userId}
        onUpdate={handlePaymentUpdate}
      />
    </>
  );
}
