// src/components/subscriptions/TrialBanner.js
import { useState, useEffect } from "react";
import { Clock, X, CreditCard, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useSubscription } from "@/context/SubscriptionContext";

export default function TrialBanner() {
  const { subscription, isTrialActive, isSubscriptionActive, getDaysLeftInTrial } = useSubscription();
  const [dismissed, setDismissed] = useState(false);

  // If banner was dismissed recently, don't show it
  useEffect(() => {
    const isDismissed = localStorage.getItem('trialBannerDismissed');
    const dismissedTime = parseInt(isDismissed || '0');
    
    // Show again after 4 hours
    if (dismissedTime && (Date.now() - dismissedTime < 4 * 60 * 60 * 1000)) {
      setDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('trialBannerDismissed', Date.now().toString());
  };

  const daysLeft = getDaysLeftInTrial ? getDaysLeftInTrial() : 0;

  // If user has active subscription, no need for banner
  if (isSubscriptionActive() || dismissed) {
    return null;
  }

  // Get the appropriate banner styles and messages
  const getBannerStyle = () => {
    if (!isTrialActive()) {
      return "bg-red-600"; // Expired
    }
    
    if (daysLeft <= 1) {
      return "bg-orange-600"; // Last day
    } else if (daysLeft <= 3) {
      return "bg-yellow-600"; // Getting close
    } else {
      return "bg-blue-600"; // Plenty of time
    }
  };

  return (
    <div className={`${getBannerStyle()} text-white px-4 py-3 shadow-md w-full`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between">
          {/* Banner content */}
          <div className="flex items-center justify-center sm:justify-start mb-2 sm:mb-0 w-full sm:w-auto">
            {!isTrialActive() ? (
              <>
                <AlertTriangle size={20} className="mr-3" />
                <span className="font-medium">
                  Your free trial has ended. Subscribe now to regain access to all features.
                </span>
              </>
            ) : (
              <>
                <Clock size={20} className="mr-3" />
                <span className="font-medium">
                  {daysLeft === 1 ? 'Last day' : `${daysLeft} days left`} in your free trial
                  {daysLeft <= 3 && '. Act now to avoid losing access.'}
                </span>
              </>
            )}
          </div>
          
          {/* Action buttons */}
          <div className="flex items-center space-x-3 w-full sm:w-auto justify-center sm:justify-end">
            <Link
              href="/dashboard/upgrade"
              className="whitespace-nowrap py-1.5 px-4 rounded-md bg-white text-blue-700 hover:bg-blue-50 font-medium text-sm transition-colors flex items-center"
            >
              <CreditCard size={16} className="mr-1.5" />
              {!isTrialActive() ? "Subscribe Now" : "Upgrade Plan"}
            </Link>
            
            <button
              onClick={handleDismiss}
              className="p-1.5 rounded-full hover:bg-white/10"
              aria-label="Dismiss"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}