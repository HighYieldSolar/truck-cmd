// src/components/subscriptions/TrialBanner.js
import { Clock, X, CreditCard } from "lucide-react";
import Link from "next/link";
import { useSubscription } from "@/context/SubscriptionContext";

export default function TrialBanner() {
  const { subscription, getDaysLeftInTrial } = useSubscription();

  const daysLeft = getDaysLeftInTrial ? getDaysLeftInTrial() : 0;

  const getSubscriptionStatus = () => {
    if (!subscription) return "none";

    if (subscription.status === "active") {
      return "active";
    } else if (subscription.status === "trial") {
      return "trial";
    } else {
      return "expired";
    }
  };

  const subscriptionStatus = getSubscriptionStatus();

  if (subscriptionStatus === "active") {
    return null;
  }

  // Get banner style based on trial status
  const getBannerStyle = (status, days) => {
    if (status === "expired") {
      return "bg-gradient-to-r from-red-600 to-red-500";
    }

    if (days <= 1) {
      return "bg-gradient-to-r from-orange-600 to-orange-500";
    } else if (days <= 3) {
      return "bg-gradient-to-r from-[#007BFF] to-[#00D9FF]";
    } else {
      return "bg-gradient-to-r from-[#007BFF] to-[#00D9FF]";
    }
  };

  if (subscriptionStatus === "active") {
    return null;
  }

  return (
    <div>
      <div className={`${getBannerStyle(subscriptionStatus, daysLeft)} px-4 shadow-md w-full`}>
        <div className="max-w-7xl mx-auto py-2 md:py-3">
          <div className="flex flex-col sm:flex-row items-center justify-between">
            {/* Banner content */}
            <div className="flex items-center justify-center sm:justify-start mb-2 sm:mb-0 w-full sm:w-auto">
              <div className="mr-3 rounded-full bg-white/20 p-1.5">
                <Clock size={18} className="text-white" />
              </div>
              
              <div className="text-white font-medium">
                {subscriptionStatus === "expired" ? (
                  <span className="text-center sm:text-left">
                    Your trial has ended. Subscribe now to continue using all features.
                  </span>
                ) : (
                  <span className="text-center sm:text-left">
                    <span className="hidden sm:inline">You have</span>
                    <span className="font-bold">{daysLeft} {daysLeft === 1 ? 'day' : 'days'}</span> 
                    <span className="hidden sm:inline"> remaining in your free trial</span>
                    <span className="inline sm:hidden"> left in trial</span>
                  </span>
                )}
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="flex items-center space-x-3 w-full sm:w-auto justify-center sm:justify-end">
              <Link
                href="/dashboard/billing"
                className="whitespace-nowrap py-1.5 px-4 rounded-md bg-white text-[#007BFF] hover:bg-blue-50 font-medium text-sm transition-colors flex items-center"
              >
                <CreditCard size={16} className="mr-1.5" />
                {subscriptionStatus === "expired" ? "Subscribe Now" : "Upgrade Plan"}
              </Link>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}