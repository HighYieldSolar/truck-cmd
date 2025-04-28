"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  CreditCard, 
  ChevronLeft,
  Lock,
  ShieldCheck
} from "lucide-react";
import { useSubscription } from "@/context/SubscriptionContext";

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  
  // Get subscription context for user info
  const { user } = useSubscription();
  
  // Get plan and billing cycle from URL params
  const [planId, setPlanId] = useState("");
  const [billingCycle, setBillingCycle] = useState("yearly");

  // Plans data - this would typically come from an API or context
  const plans = {
    basic: {
      id: "basic",
      name: "Basic Plan",
      description: "Perfect for owner-operators with 1 truck",
      monthlyPrice: 19,
      yearlyPrice: 16,
      yearlyTotal: 192,
      savings: 36,
      features: [
        "Basic Invoicing & Dispatching",
        "Simple Expense Tracking",
        "Standard Reports",
        "Single User Account",
        "Email Support"
      ]
    },
    premium: {
      id: "premium",
      name: "Premium Plan",
      description: "Ideal for owner-operators with 1-2 trucks",
      monthlyPrice: 39,
      yearlyPrice: 33,
      yearlyTotal: 396,
      savings: 72,
      features: [
        "Advanced Invoicing & Dispatching",
        "Comprehensive Expense Tracking",
        "Advanced Reports & Analytics",
        "Customer Management System",
        "Advanced IFTA Calculator",
        "Priority Email Support"
      ]
    },
    fleet: {
      id: "fleet",
      name: "Fleet Plan",
      description: "For small fleets with 3-8 trucks",
      monthlyPrice: 69,
      yearlyPrice: 55,
      yearlyTotal: 660,
      savings: 168,
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

  // Load data from URL params
  useEffect(() => {
    // Get URL params
    const plan = searchParams.get("plan") || "premium";
    const cycle = searchParams.get("cycle") || "yearly";

    setPlanId(plan);
    setBillingCycle(cycle);
    
    // Mark loading complete once we have all we need
    if (user) {
      setLoading(false);
    }
  }, [searchParams, user]);

  // Handle checkout process
  const handleCheckout = async () => {
    if (!user || !planId || processingPayment) return;

    try {
      setProcessingPayment(true);
      setErrorMessage(null);

      // Store user ID in localStorage for the success page
      localStorage.setItem('userId', user.id);
      sessionStorage.setItem('userId', user.id);
      
      // Create checkout ID to prevent duplicates
      const checkoutId = `checkout_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      localStorage.setItem('lastCheckoutId', checkoutId);
      
      console.log('Initiating checkout with:', { planId, billingCycle, userId: user.id, checkoutId });

      // Call API to create Stripe checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          plan: planId,
          billingCycle,
          checkoutId,
          returnUrl: `${window.location.origin}/dashboard/billing/success`
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
      
      setErrorMessage(err.message || 'An unknown error occurred during checkout');
      setProcessingPayment(false);
      
      // Clear any stored checkout data on error
      localStorage.removeItem('lastCheckoutId');
    }
  };

  // Get the selected plan details
  const selectedPlan = plans[planId] || plans.premium;
  
  // Calculate pricing based on selected plan and billing cycle
  const planPrice = billingCycle === 'yearly' ? selectedPlan.yearlyPrice : selectedPlan.monthlyPrice;
  const totalAmount = billingCycle === 'yearly' ? selectedPlan.yearlyTotal : selectedPlan.monthlyPrice;
  const billingText = billingCycle === 'yearly' ? 'year' : 'month';

  // Loading state
  if (loading) {
    return (
      <DashboardLayout activePage="billing">
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex flex-col items-center">
            <RefreshCw size={40} className="animate-spin text-blue-600 mb-4" />
            <p className="text-lg text-gray-700">Loading checkout details...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activePage="billing">
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Complete Your Order</h1>
            <p className="text-gray-600 mt-2">Review your order and proceed to payment</p>
          </div>

          {/* Error message */}
          {errorMessage && (
            <div className="mb-8 bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
              <div className="flex">
                <AlertCircle className="h-6 w-6 text-red-500 mr-3 flex-shrink-0" />
                <p className="text-red-700">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left side: Order Summary */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-4">
                <h2 className="text-xl font-semibold">Order Summary</h2>
              </div>
              
              <div className="p-6">
                {/* Back button */}
                <div className="mb-6">
                  <button 
                    onClick={() => router.push('/dashboard/billing')}
                    className="flex items-center text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    <ChevronLeft size={18} className="mr-1" />
                    Back to Plans
                  </button>
                </div>
                
                {/* Selected Plan Details */}
                <div className="flex flex-col md:flex-row gap-6 p-4 border border-gray-200 rounded-lg mb-8">
                  <div className="md:w-3/5">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{selectedPlan.name}</h3>
                    <p className="text-gray-600 mb-4">{selectedPlan.description}</p>
                    
                    <div className="space-y-2">
                      {selectedPlan.features.slice(0, 4).map((feature, index) => (
                        <div key={index} className="flex items-start">
                          <CheckCircle size={16} className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700 text-sm">{feature}</span>
                        </div>
                      ))}
                      {selectedPlan.features.length > 4 && (
                        <div className="text-blue-600 text-sm font-medium">
                          +{selectedPlan.features.length - 4} more features
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="md:w-2/5 bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between mb-4">
                      <span className="text-gray-700">Plan</span>
                      <span className="font-medium text-gray-900">{selectedPlan.name}</span>
                    </div>
                    
                    <div className="flex justify-between mb-4">
                      <span className="text-gray-700">Billing</span>
                      <span className="font-medium text-gray-900 capitalize">{billingCycle}</span>
                    </div>
                    
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-700">Price</span>
                      <span className="font-medium text-gray-900">${planPrice}/month</span>
                    </div>
                    
                    {billingCycle === 'yearly' && (
                      <div className="flex justify-between mb-4 text-sm">
                        <span className="text-green-600">Annual Savings</span>
                        <span className="font-medium text-green-600">${selectedPlan.savings}</span>
                      </div>
                    )}
                    
                    <div className="border-t pt-4 mt-2">
                      <div className="flex justify-between">
                        <span className="text-gray-900 font-semibold">Total today</span>
                        <span className="text-xl font-bold text-gray-900">${totalAmount}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Billed {billingCycle === 'yearly' ? 'annually' : 'monthly'}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Payment method details */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Billing Information</h3>
                  <p className="text-gray-600 mb-4">
                    You&#39;ll be redirected to our secure payment processor to complete your purchase.
                  </p>
                  
                  <div className="flex items-center text-sm text-gray-600 mb-4">
                    <Lock size={16} className="text-gray-500 mr-2" />
                    <span>Your payment information is encrypted and secure</span>
                  </div>
                  
                  <div className="flex items-center mb-4">
                    <div className="flex space-x-2">
                      <div className="w-12 h-8 bg-blue-100 rounded flex items-center justify-center text-blue-800 font-bold text-sm">VISA</div>
                      <div className="w-12 h-8 bg-blue-100 rounded flex items-center justify-center text-blue-800 font-bold text-sm">MC</div>
                      <div className="w-12 h-8 bg-blue-100 rounded flex items-center justify-center text-blue-800 font-bold text-sm">AMEX</div>
                    </div>
                  </div>
                </div>
                
                {/* Terms and policies */}
                <div className="text-sm text-gray-600 mt-6 mb-6">
                  <p className="mb-2">
                    By clicking &quot;Complete Checkout&quot;, you agree to our{" "}
                    <Link href="/terms" className="text-blue-600 hover:underline">Terms of Service</Link>{" "}
                    and{" "}
                    <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>.
                  </p>
                  <p>
                    You can cancel your subscription at any time from your account settings.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Right side: Order details and checkout button */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 mb-4 sticky top-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
                
                <div className="border-b pb-4 mb-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">{selectedPlan.name}</span>
                    <span className="text-gray-900">${planPrice}/mo</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Billing</span>
                    <span className="text-gray-900 capitalize">{billingCycle}</span>
                  </div>
                </div>
                
                <div className="mb-6">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-900 font-semibold">Total due today</span>
                    <span className="text-xl font-bold text-gray-900">${totalAmount}</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    You&#39;ll be charged ${totalAmount} for your first {billingText}.
                  </p>
                </div>
                
                <button
                  onClick={handleCheckout}
                  disabled={processingPayment}
                  className={`w-full py-3 px-4 rounded-md text-white font-medium flex items-center justify-center ${
                    processingPayment ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                  } transition-colors`}
                >
                  {processingPayment ? (
                    <>
                      <RefreshCw size={20} className="animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard size={20} className="mr-2" />
                      Complete Checkout
                    </>
                  )}
                </button>
                
                <div className="mt-4 flex items-center justify-center text-sm text-gray-600">
                  <ShieldCheck size={16} className="text-green-500 mr-1" />
                  <span>30-day money back guarantee</span>
                </div>
              </div>
              
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                <h4 className="font-medium text-blue-800 mb-2 flex items-center">
                  <CheckCircle size={16} className="mr-2" />
                  100% Secure Checkout
                </h4>
                <p className="text-sm text-blue-700">
                  Your payment information is processed securely through our payment provider. We never store your credit card details.
                </p>
              </div>
            </div>
          </div>
          
          {/* Help section */}
          <div className="mt-12 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Need help?</h3>
            <p className="text-gray-600 mb-4">Our team is available to answer any questions</p>
            <div className="flex justify-center space-x-4">
              <Link 
                href="/contact"
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Contact Support
              </Link>
              <Link 
                href="/faq"
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                FAQ
              </Link>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}