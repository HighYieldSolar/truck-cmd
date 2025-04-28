"use client";

import { useState } from 'react';
import { RefreshCw, ArrowRight, CheckCircle } from 'lucide-react';

export default function ChangePlanComponent({ 
  userId, 
  currentPlan,
  currentInterval 
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Plans configuration
  const plans = {
    basic: {
      name: "Basic Plan",
      monthlyPrice: 20,
      yearlyPrice: 16,
      features: ["Basic Invoicing", "Simple Expense Tracking", "Standard Reports"]
    },
    premium: {
      name: "Premium Plan",
      monthlyPrice: 35,
      yearlyPrice: 28,
      features: ["Advanced Invoicing", "Comprehensive Tracking", "Advanced Analytics", "IFTA Tools"]
    },
    fleet: {
      name: "Fleet Plan",
      monthlyPrice: 70,
      yearlyPrice: 56,
      features: ["All Premium Features", "Fleet Management", "GPS Tracking", "Team Access"]
    }
  };

  const handleChangePlan = async (plan, interval) => {
    // If selecting the same plan and interval, do nothing
    if (plan === currentPlan && interval === currentInterval) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Call Stripe Portal with update_subscription mode
      const response = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          returnUrl: window.location.href,
          mode: 'update_subscription'
        }),
      });
      
      const { url, error: responseError } = await response.json();
      
      if (responseError) {
        throw new Error(responseError);
      }
      
      // Redirect to Stripe Portal
      window.location.href = url;
      
    } catch (err) {
      console.error('Error changing plan:', err);
      setError(err.message || 'Failed to redirect to billing portal');
      setLoading(false);
    }
  };

  // Is current plan
  const isCurrentPlan = (plan, interval) => {
    return plan === currentPlan && interval === currentInterval;
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-4">
        <h2 className="text-xl font-bold text-white">Change Your Plan</h2>
      </div>
      
      <div className="p-6">
        {error && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <p className="text-red-700">{error}</p>
          </div>
        )}
        
        {success && (
          <div className="mb-4 bg-green-50 border-l-4 border-green-500 p-4 rounded flex items-start">
            <CheckCircle className="text-green-500 mr-2 flex-shrink-0 mt-0.5" size={18} />
            <p className="text-green-700">{success}</p>
          </div>
        )}
        
        <div className="space-y-4">
          <div className="flex justify-center mb-6">
            <div className="inline-flex rounded-md shadow-sm">
              <button
                type="button"
                className={`px-4 py-2 text-sm font-medium ${
                  currentInterval === 'monthly' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                } border border-gray-300 rounded-l-lg`}
                disabled={loading}
              >
                Monthly
              </button>
              <button
                type="button"
                className={`px-4 py-2 text-sm font-medium ${
                  currentInterval === 'yearly' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                } border border-gray-300 border-l-0 rounded-r-lg`}
                disabled={loading}
              >
                Yearly (Save 20%)
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(plans).map(([planId, plan]) => (
              <div 
                key={planId}
                className={`border rounded-lg p-4 ${
                  isCurrentPlan(planId, currentInterval) 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                } cursor-pointer transition-all`}
                onClick={() => handleChangePlan(planId, currentInterval)}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900">{plan.name}</h3>
                  {isCurrentPlan(planId, currentInterval) && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      Current
                    </span>
                  )}
                </div>
                <p className="text-2xl font-bold text-gray-900 mb-2">
                  ${currentInterval === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice}
                  <span className="text-sm font-normal text-gray-500">/mo</span>
                </p>
                <ul className="mt-4 space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-sm text-gray-600">
                      <CheckCircle size={14} className="text-green-500 mr-2 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleChangePlan(planId, currentInterval)}
                  disabled={loading || isCurrentPlan(planId, currentInterval)}
                  className={`mt-4 w-full py-2 px-4 rounded-md ${
                    isCurrentPlan(planId, currentInterval)
                      ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  } transition-colors flex items-center justify-center`}
                >
                  {loading ? (
                    <RefreshCw size={16} className="animate-spin mr-2" />
                  ) : null}
                  {isCurrentPlan(planId, currentInterval) 
                    ? 'Current Plan' 
                    : 'Switch Plan'
                  }
                  {!isCurrentPlan(planId, currentInterval) && !loading && (
                    <ArrowRight size={16} className="ml-2" />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
        
        <div className="mt-6 text-sm text-gray-500">
          <p>* Plan changes take effect immediately. When upgrading, you&apos;ll be charged the prorated amount for the remaining billing period. When downgrading, you&apos;ll receive credit for your next billing cycle.</p>
        </div>
      </div>
    </div>
  );
}