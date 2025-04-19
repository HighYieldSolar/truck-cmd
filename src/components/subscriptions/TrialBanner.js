// src/components/subscriptions/TrialBanner.js
import { useState, useEffect } from "react";
import { Clock, X, CreditCard, ExternalLink } from "lucide-react";
import Link from "next/link";

export default function TrialBanner({ 
  trialEndsAt, 
  onClose, 
  subscriptionStatus = 'trial' 
}) {
  const [daysLeft, setDaysLeft] = useState(0);
  const [showBanner, setShowBanner] = useState(true);
  
  // Calculate days left in trial
  useEffect(() => {
    if (trialEndsAt) {
      const now = new Date();
      const endDate = new Date(trialEndsAt);
      const diffTime = endDate - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setDaysLeft(Math.max(0, diffDays));
    }
  }, [trialEndsAt]);
  
  // Handle close with animation
  const handleClose = () => {
    setShowBanner(false);
    setTimeout(() => {
      if (onClose) onClose();
    }, 300);
  };
  
  // If the subscription is active, don't show the banner
  if (subscriptionStatus === 'active') {
    return null;
  }
  
  // Get banner style based on trial status
  const getBannerStyle = () => {
    if (subscriptionStatus === 'expired') {
      return "bg-gradient-to-r from-red-600 to-red-500";
    }
    
    if (daysLeft <= 1) {
      return "bg-gradient-to-r from-orange-600 to-orange-500";
    } else if (daysLeft <= 3) {
      return "bg-gradient-to-r from-[#007BFF] to-[#00D9FF]";
    } else {
      return "bg-gradient-to-r from-[#007BFF] to-[#00D9FF]";
    }
  };
  
  return (
    <div 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        showBanner ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full'
      }`}
    >
      <div className={`${getBannerStyle()} px-4 shadow-md w-full`}>
        <div className="max-w-7xl mx-auto py-2 md:py-3">
          <div className="flex flex-col sm:flex-row items-center justify-between">
            {/* Banner content */}
            <div className="flex items-center justify-center sm:justify-start mb-2 sm:mb-0 w-full sm:w-auto">
              <div className="mr-3 rounded-full bg-white/20 p-1.5">
                <Clock size={18} className="text-white" />
              </div>
              
              <div className="text-white font-medium">
                {subscriptionStatus === 'expired' ? (
                  <span className="text-center sm:text-left">
                    Your trial has ended. Subscribe now to continue using all features.
                  </span>
                ) : (
                  <span className="text-center sm:text-left">
                    <span className="hidden sm:inline">You have </span>
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
                {subscriptionStatus === 'expired' ? 'Subscribe Now' : 'Upgrade Plan'}
              </Link>
              
              <button
                onClick={handleClose}
                className="text-white/80 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors"
                aria-label="Close trial notification"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}