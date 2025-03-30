"use client";

// src/components/subscriptions/TrialBanner.js

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, X, Clock } from "lucide-react";
import Link from "next/link";

/**
 * Trial banner component that displays a countdown for the free trial period
 * and prompts users to subscribe
 */
export default function TrialBanner({ 
  trialEndsAt, 
  onClose, 
  isClosable = true,
  subscriptionStatus = "trial" // "trial", "active", "expired", "none" 
}) {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  const [visible, setVisible] = useState(true);

  // Calculate time left in trial
  useEffect(() => {
    if (!trialEndsAt) return;

    const calculateTimeLeft = () => {
      const now = new Date();
      const endDate = new Date(trialEndsAt);
      const difference = endDate - now;

      if (difference <= 0) {
        // Trial has ended
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / (1000 * 60)) % 60),
        seconds: Math.floor((difference / 1000) % 60)
      };
    };

    // Update time left immediately
    setTimeLeft(calculateTimeLeft());

    // Set up interval to update time left every second
    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);

      // Clear interval if trial has ended
      if (newTimeLeft.days === 0 && newTimeLeft.hours === 0 && 
          newTimeLeft.minutes === 0 && newTimeLeft.seconds === 0) {
        clearInterval(timer);
      }
    }, 1000);

    // Clean up interval on unmount
    return () => clearInterval(timer);
  }, [trialEndsAt]);

  const handleClose = () => {
    setVisible(false);
    if (onClose) onClose();
  };

  // Different messages based on subscription status
  const getBannerContent = () => {
    switch (subscriptionStatus) {
      case "active":
        return {
          bgColor: "bg-green-50",
          textColor: "text-green-800",
          borderColor: "border-green-200",
          icon: <AlertCircle size={20} className="text-green-600" />,
          message: "Your subscription is active. Thank you for being a valued customer!",
          ctaText: "Manage Subscription",
          ctaLink: "/dashboard/billing"
        };
      case "expired":
        return {
          bgColor: "bg-red-50",
          textColor: "text-red-800",
          borderColor: "border-red-200",
          icon: <AlertCircle size={20} className="text-red-600" />,
          message: "Your subscription has expired. Please renew to continue using all features.",
          ctaText: "Renew Now",
          ctaLink: "/dashboard/billing"
        };
      case "none":
        return {
          bgColor: "bg-gray-50",
          textColor: "text-gray-800",
          borderColor: "border-gray-200",
          icon: <AlertCircle size={20} className="text-gray-600" />,
          message: "You don't have an active subscription. Subscribe now to access all features.",
          ctaText: "Choose a Plan",
          ctaLink: "/dashboard/billing"
        };
      case "trial":
      default:
        const { days, hours, minutes } = timeLeft;
        const isEnding = days === 0 && hours < 24;
        
        return {
          bgColor: isEnding ? "bg-yellow-50" : "bg-blue-50",
          textColor: isEnding ? "text-yellow-800" : "text-blue-800",
          borderColor: isEnding ? "border-yellow-200" : "border-blue-200",
          icon: <Clock size={20} className={isEnding ? "text-yellow-600" : "text-blue-600"} />,
          message: days > 0 
            ? `Your free trial ends in ${days} days and ${hours} hours.` 
            : hours > 0 
              ? `Your free trial ends in ${hours} hours and ${minutes} minutes.`
              : minutes > 0 
                ? `Your free trial ends in ${minutes} minutes.`
                : "Your free trial has ended.",
          ctaText: "Subscribe Now",
          ctaLink: "/dashboard/billing"
        };
    }
  };

  const content = getBannerContent();

  if (!visible) return null;

  return (
    <div className={`${content.bgColor} p-3 border-b ${content.borderColor}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between flex-wrap">
          <div className="flex-1 flex items-center">
            <span className="flex p-1 rounded-lg">
              {content.icon}
            </span>
            <p className={`ml-3 font-medium ${content.textColor} truncate text-sm`}>
              {content.message}
            </p>
          </div>
          <div className="flex-shrink-0 flex items-center space-x-4">
            <Link
              href={content.ctaLink}
              className="inline-flex items-center px-3 py-1 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              {content.ctaText}
            </Link>
            {isClosable && (
              <button
                type="button"
                className="rounded-md p-1 hover:bg-gray-200"
                onClick={handleClose}
                aria-label="Close banner"
              >
                <X size={18} className="text-gray-600" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}