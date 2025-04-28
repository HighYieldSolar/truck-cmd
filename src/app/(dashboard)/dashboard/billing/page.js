"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  CreditCard, 
  Check
} from "lucide-react";

export default function BillingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [billingCycle, setBillingCycle] = useState('yearly');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState('trial');
  const [trialDaysLeft, setTrialDaysLeft] = useState(7);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Plans data
  const plans = {
    basic: {
      id: "basic",
      name: "Basic Plan",
      description: "Perfect for owner-operators with 1 truck",
      monthlyPrice: 20,
      yearlyPrice: 16,
      yearlyTotal: 192,
      savings: 48,
      features: [
        "Basic Invoicing & Dispatching",
        "Simple Expense Tracking",
        "Standard Reports",
        "Single User Account",
        "Email Support"
      ],
      notIncluded: [
        "Advanced IFTA Tools",
        "Load Optimization",
        "Priority Support"
      ]
    },
    premium: {
      id: "premium",
      name: "Premium Plan",
      description: "Ideal for owner-operators with 1-2 trucks",
      monthlyPrice: 35,
      yearlyPrice: 28,
      yearlyTotal: 336,
      savings: 84,
      features: [
        "Advanced Invoicing & Dispatching",
        "Comprehensive Expense Tracking",
        "Advanced Reports & Analytics",
        "Customer Management System",
        "Advanced IFTA Calculator",
        "Priority Email Support"
      ],
      recommended: true
    },
    fleet: {
      id: "fleet",
      name: "Fleet Plan",
      description: "For small fleets with 3-8 trucks",
      monthlyPrice: 75,
      yearlyPrice: 60,
      yearlyTotal: 720,
      savings: 180,
      features: [
        "All Premium Features",
        "Fleet Management Tools",
        "Real-time GPS Tracking",
        "Team Access (1 User per 2 Trucks)",
        "Fuel & Load Optimizations",
        "Priority Phone Support"
      ]
    }
  };

  // Simulated data loading
  useEffect(() => {
    // In a real application, you would fetch user and subscription data here
    setTimeout(() => {
      setUser({
        id: "user-123",
        email: "user@example.com",
        name: "John Smith"
      });
      setLoading(false);
    }, 1000);
  }, []);

  // Handle plan selection
  const handleSelectPlan = (planId) => {
    setSelectedPlan(planId);
    
    // Navigate to checkout page with selected plan
    router.push(`/dashboard/billing/checkout?plan=${planId}&cycle=${billingCycle}`);
  };

  // Toggle billing cycle
  const toggleBillingCycle = () => {
    setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly');
  };

  // Show loading state
  if (loading) {
    return (
      <DashboardLayout activePage="billing">
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex flex-col items-center">
            <RefreshCw size={40} className="animate-spin text-blue-600 mb-4" />
            <p className="text-lg text-gray-700">Loading subscription details...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activePage="billing">
      <div className="bg-gray-50 min-h-screen pb-12">
        {/* Main content */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Choose Your Plan</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Select the perfect plan for your trucking business. All plans include a 30-day money-back guarantee.
            </p>
          </div>

          {/* Success/error messages */}
          {successMessage && (
            <div className="mb-8 bg-green-50 border-l-4 border-green-500 p-4 rounded-md">
              <div className="flex">
                <CheckCircle className="h-6 w-6 text-green-500 mr-3 flex-shrink-0" />
                <p className="text-green-700">{successMessage}</p>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="mb-8 bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
              <div className="flex">
                <AlertCircle className="h-6 w-6 text-red-500 mr-3 flex-shrink-0" />
                <p className="text-red-700">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Current subscription info (if active) */}
          {subscriptionStatus === 'active' && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-10">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <CheckCircle size={24} className="text-green-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900">Current Subscription</h2>
              </div>
              
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Premium Plan</h3>
                  <p className="text-gray-600">Billed {billingCycle === 'yearly' ? 'yearly' : 'monthly'}</p>
                  <div className="mt-2 flex items-center">
                    <CreditCard size={18} className="text-green-600 mr-2" />
                    <span className="text-green-600 font-medium">Active subscription</span>
                  </div>
                </div>
                
                <div className="mt-4 md:mt-0">
                  <button 
                    className="w-full md:w-auto px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center"
                    onClick={() => router.push('/dashboard/billing/manage')}
                  >
                    <CreditCard size={18} className="mr-2" />
                    Manage Subscription
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Billing cycle toggle */}
          <div className="flex flex-col items-center justify-center mb-12" id="plans">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <span className={`text-base font-medium ${billingCycle === 'monthly' ? 'text-gray-900' : 'text-gray-500'}`}>
                Monthly
              </span>
              
              <button 
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${billingCycle === 'yearly' ? 'bg-blue-600' : 'bg-gray-200'}`}
                onClick={toggleBillingCycle}
              >
                <span 
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-1'}`} 
                />
              </button>
              
              <span className={`text-base font-medium ${billingCycle === 'yearly' ? 'text-gray-900' : 'text-gray-500'}`}>
                Yearly
              </span>
            </div>
            
            <div className="bg-green-100 text-green-800 px-4 py-1 rounded-full text-sm font-medium">
              Save up to 20% with yearly billing
            </div>
          </div>

          {/* Plan cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {/* Basic Plan */}
            <div className={`bg-white rounded-xl shadow-xl overflow-hidden border-2 ${selectedPlan === 'premium' ? 'border-blue-500' : 'border-blue-200'} transition-all duration-300 hover:shadow-2xl transform hover:-translate-y-1 relative`}>
              <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-blue-100">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plans.basic.name}</h3>
                <p className="text-gray-600 mb-4">{plans.basic.description}</p>
                
                <div className="flex items-baseline mb-1">
                  <span className="text-4xl font-bold text-gray-900">
                    ${billingCycle === 'yearly' ? plans.basic.yearlyPrice : plans.basic.monthlyPrice}
                  </span>
                  <span className="text-gray-600 ml-1">/month</span>
                </div>
                
                {billingCycle === 'yearly' && (
                  <p className="text-sm text-gray-600 mb-4">
                    Billed annually at ${plans.basic.yearlyTotal}
                    <span className="ml-2 text-green-600 font-medium">Save ${plans.basic.savings}</span>
                  </p>
                )}
                
                <button
                  onClick={() => handleSelectPlan('basic')}
                  className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
                >
                  Select Plan
                </button>
              </div>
              
              <div className="p-6">
                <h4 className="font-medium text-gray-900 mb-4">What&apos;s included:</h4>
                <ul className="text-black space-y-3">
                  {plans.basic.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check size={18} className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                
                {plans.basic.notIncluded && (
                  <>
                    <h4 className="font-medium text-gray-900 mt-6 mb-4">Not included:</h4>
                    <ul className="text-black space-y-3 opacity-60">
                      {plans.basic.notIncluded.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <span className="mr-2 mt-0.5">✕</span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </div>
            
            {/* Premium Plan - highlighted */}
            <div className={`bg-white rounded-xl shadow-xl overflow-hidden border-2 ${selectedPlan === 'premium' ? 'border-blue-500' : 'border-blue-200'} transition-all duration-300 hover:shadow-2xl transform hover:-translate-y-1 relative`}>
              {plans.premium.recommended && (
                <div className="absolute top-0 right-0">
                  <div className="bg-orange-500 text-white transform rotate-45 text-center text-sm py-1 px-10 translate-x-8 translate-y-6">
                    Popular
                  </div>
                </div>
              )}
              
              <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-blue-100">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plans.premium.name}</h3>
                <p className="text-gray-600 mb-4">{plans.premium.description}</p>
                
                <div className="flex items-baseline mb-1">
                  <span className="text-4xl font-bold text-gray-900">
                    ${billingCycle === 'yearly' ? plans.premium.yearlyPrice : plans.premium.monthlyPrice}
                  </span>
                  <span className="text-gray-600 ml-1">/month</span>
                </div>
                
                {billingCycle === 'yearly' && (
                  <p className="text-sm text-gray-600 mb-4">
                    Billed annually at ${plans.premium.yearlyTotal}
                    <span className="ml-2 text-green-600 font-medium">Save ${plans.premium.savings}</span>
                  </p>
                )}
                
                <button
                  onClick={() => handleSelectPlan('premium')}
                  className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
                >
                  Select Plan
                </button>
              </div>
              
              <div className="p-6">
                <h4 className="font-medium text-gray-900 mb-4">What&apos;s included:</h4>
                <ul className="text-black space-y-3">
                  {plans.premium.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check size={18} className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            {/* Fleet Plan */}
            <div className={`bg-white rounded-xl shadow-xl overflow-hidden border-2 ${selectedPlan === 'premium' ? 'border-blue-500' : 'border-blue-200'} transition-all duration-300 hover:shadow-2xl transform hover:-translate-y-1 relative`}>
              <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-blue-100">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plans.fleet.name}</h3>
                <p className="text-gray-600 mb-4">{plans.fleet.description}</p>
                
                <div className="flex items-baseline mb-1">
                  <span className="text-4xl font-bold text-gray-900">
                    ${billingCycle === 'yearly' ? plans.fleet.yearlyPrice : plans.fleet.monthlyPrice}
                  </span>
                  <span className="text-gray-600 ml-1">/month</span>
                </div>
                
                {billingCycle === 'yearly' && (
                  <p className="text-sm text-gray-600 mb-4">
                    Billed annually at ${plans.fleet.yearlyTotal}
                    <span className="ml-2 text-green-600 font-medium">Save ${plans.fleet.savings}</span>
                  </p>
                )}
                
                <button
                  onClick={() => handleSelectPlan('fleet')}
                  className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
                >
                  Select Plan
                </button>
              </div>
              
              <div className="p-6">
                <h4 className="font-medium text-gray-900 mb-4">What&apos;s included:</h4>
                <ul className="text-black space-y-3">
                  {plans.fleet.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check size={18} className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          
          {/* FAQ Section */}
          <div className="bg-white rounded-lg shadow-md p-8 mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Frequently Asked Questions</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Can I change my plan later?</h3>
                <p className="text-gray-600">Yes, you can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle.</p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">What forms of payment do you accept?</h3>
                <p className="text-gray-600">We accept all major credit cards, including Visa, Mastercard, American Express, and Discover.</p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Is there a setup fee?</h3>
                <p className="text-gray-600">No, there are no setup fees. You only pay for your subscription plan.</p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Can I cancel anytime?</h3>
                <p className="text-gray-600">Yes, you can cancel your subscription at any time. You&apos;ll have access to your plan until the end of your current billing period.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}