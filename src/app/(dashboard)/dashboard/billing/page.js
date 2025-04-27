"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import DashboardLayout from "@/components/layout/DashboardLayout";
import BillingToggle from "@/components/pricing/BillingToggle";
import PlanCard from "@/components/pricing/PlanCard";
import TrialBanner from "@/components/subscriptions/TrialBanner";
import StripeCheckoutButton from "@/components/billing/StripeCheckoutButton";
import StripePortalButton from "@/components/billing/StripePortalButton";
import { AlertCircle, CheckCircle, CreditCard, RefreshCw } from "lucide-react";
import Image from "next/image";

export default function BillingDashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [trialEndsAt, setTrialEndsAt] = useState(null);
  const [billingCycle, setBillingCycle] = useState('yearly');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Memoize plans data to prevent recreation on each render
  const plans = useMemo(() => ({
    basic: {
      name: "Basic Plan",
      description: "For owner-operators with 1 truck",
      price: 19,
      yearlyPrice: 16,
      features: [
        { included: true, text: "Basic Invoicing & Dispatching" },
        { included: true, text: "Simple Expense Tracking" },
        { included: true, text: "Standard Reports" },
        { included: true, text: "Single User Account" },
        { included: false, text: "Advanced IFTA Tools" },
        { included: false, text: "Load Optimization" }
      ]
    },
    premium: {
      name: "Premium Plan",
      description: "For owner-operators with 1-2 trucks",
      price: 39,
      yearlyPrice: 33,
      features: [
        { included: true, text: "Advanced Invoicing & Dispatching" },
        { included: true, text: "Comprehensive Expense Tracking" },
        { included: true, text: "Advanced Reports & Analytics" },
        { included: true, text: "Customer Management System" },
        { included: true, text: "Advanced IFTA Calculator" },
        { included: true, text: "Priority Email Support" }
      ],
      highlighted: true
    },
    fleet: {
      name: "Fleet Plan",
      description: "For small fleets with 3-8 trucks",
      price: 69,
      yearlyPrice: 55,
      features: [
        { included: true, text: "All Premium Features" },
        { included: true, text: "Fleet Management Tools" },
        { included: true, text: "Real-time GPS Tracking" },
        { included: true, text: "Team Access (1 User per 2 Trucks)" },
        { included: true, text: "Fuel & Load Optimizations" }
      ]
    }
  }), []);

  // Check user and fetch subscription data
  useEffect(() => {
    async function loadUserAndSubscription() {
      try {
        // Check for success or canceled params from Stripe redirect
        const sessionId = searchParams.get('session_id');
        const canceled = searchParams.get('canceled');
        
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) throw userError;
        
        if (!user) {
          router.push('/login');
          return;
        }
        
        setUser(user);
        
        // Fetch subscription data from your database
        const { data: subscription, error: subError } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .single();
          
        if (subError && subError.code !== 'PGRST116') { // PGRST116 is "No rows returned" error
          console.error('Error fetching subscription:', subError);
        }
        
        // Set subscription status based on data
        if (subscription) {
          setSubscriptionStatus(subscription.status);
          if (subscription.trial_ends_at) {
            setTrialEndsAt(subscription.trial_ends_at);
          }
          
          // Set the selected plan from the subscription
          if (subscription.plan) {
            setSelectedPlan(subscription.plan);
          }
          
          // Show success message if redirected from successful Stripe checkout
          if (sessionId && subscription.status === 'active') {
            setSuccessMessage(`Successfully subscribed to the ${subscription.plan ? plans[subscription.plan].name : 'Premium Plan'}!`);
          }
        } else {
          // If no subscription record, calculate trial end date from user registration
          // Typically 7 days from creation, which we can get from user metadata
          const createdAt = new Date(user.created_at);
          const trialEndDate = new Date(createdAt);
          trialEndDate.setDate(trialEndDate.getDate() + 7);
          setTrialEndsAt(trialEndDate.toISOString());
          setSubscriptionStatus('trial');
          
          // Create a subscription record for the user in trial status
          // Only do this if there's no existing record
          try {
            await supabase
              .from('subscriptions')
              .insert([{
                user_id: user.id,
                status: 'trial',
                trial_ends_at: trialEndDate.toISOString(),
                created_at: new Date().toISOString()
              }]);
          } catch (err) {
            console.error('Error creating trial subscription record:', err);
          }
        }
        
        // Show error if payment was canceled
        if (canceled) {
          setErrorMessage("Payment was canceled. Please try again when you&apos;re ready.");
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadUserAndSubscription();
  }, [router, searchParams, plans]);

  // Handle plan selection
  const handleSelectPlan = (planKey) => {
    setSelectedPlan(planKey);
    setShowPaymentForm(true);
    
    // Scroll to payment form
    setTimeout(() => {
      const paymentFormElement = document.getElementById('payment-form');
      if (paymentFormElement) {
        paymentFormElement.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  // Handle payment submission
  const handlePayment = async (paymentDetails) => {
    if (!selectedPlan) {
      setErrorMessage("Please select a plan before submitting payment.");
      return;
    }
    
    try {
      setProcessingPayment(true);
      setErrorMessage(null);
      
      // Create a Stripe checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          plan: selectedPlan,
          billingCycle: billingCycle,
          returnUrl: window.location.origin + '/dashboard/billing'
        }),
      });
      
      const { url, error: apiError } = await response.json();
      
      if (apiError) {
        throw new Error(apiError);
      }
      
      // Redirect to Stripe Checkout
      window.location.href = url;
      
    } catch (error) {
      console.error('Error processing payment:', error);
      setErrorMessage(`Payment processing failed: ${error.message}`);
      setProcessingPayment(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <DashboardLayout activePage="billing">
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="flex flex-col items-center">
            <RefreshCw size={40} className="animate-spin text-blue-500 mb-4" />
            <p className="text-lg text-gray-600">Loading subscription details...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activePage="billing">
      <div className="bg-gray-100 min-h-[calc(100vh-64px)] py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header section */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Subscription Management</h1>
            {subscriptionStatus === 'active' ? (
              <p className="mt-4 text-lg text-black">
                You&apos;re currently on the {selectedPlan ? plans[selectedPlan].name : 'Premium'} plan.
              </p>
            ) : subscriptionStatus === 'trial' ? (
              <p className="mt-4 text-lg text-black">
                Your free trial ends on {new Date(trialEndsAt).toLocaleDateString()}. Choose a plan to continue using Truck Command.
              </p>
            ) : (
              <p className="mt-4 text-lg text-black">
                Choose a plan to get started with Truck Command.
              </p>
            )}
          </div>

          {/* Success/Error Messages */}
          {successMessage && (
            <div className="mb-6 bg-green-50 border-l-4 border-green-400 p-4 rounded-md">
              <div className="flex">
                <CheckCircle className="h-6 w-6 text-green-400 mr-3" />
                <p className="text-green-700">{successMessage}</p>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
              <div className="flex">
                <AlertCircle className="h-6 w-6 text-red-400 mr-3" />
                <p className="text-red-700">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Current subscription status card if active */}
          {subscriptionStatus === 'active' && (
            <div className="bg-white rounded-lg shadow-lg mb-8 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-400 text-white px-6 py-4">
                <h2 className="text-xl font-semibold">Current Subscription</h2>
              </div>
              <div className="p-6">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Premium Plan</h3>
                    <p className="text-gray-600">Billed {billingCycle === 'yearly' ? 'yearly' : 'monthly'}</p>
                    <div className="mt-2 flex items-center">
                      <CreditCard size={18} className="text-green-500 mr-2" />
                      <span className="text-green-600 font-medium">Active subscription</span>
                    </div>
                  </div>
                  <div className="mt-4 md:mt-0 text-right">
                    <p className="text-sm text-gray-500">Next billing date</p>
                    <p className="text-gray-900 font-medium">
                      {new Date(trialEndsAt).toLocaleDateString()}
                    </p>
                    <StripePortalButton
                      userId={user.id}
                      buttonText="Manage Payment Methods"
                      className="mt-3"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Billing toggle */}
          <div className="text-center mb-8">
            <BillingToggle billingCycle={billingCycle} setBillingCycle={setBillingCycle} />
          </div>

          {/* Plan Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {/* Basic Plan */}
            <div onClick={() => handleSelectPlan('basic')} className="cursor-pointer">
              <PlanCard 
                name={plans.basic.name}
                description={plans.basic.description}
                price={plans.basic.price}
                yearlyPrice={plans.basic.yearlyPrice}
                billingCycle={billingCycle}
                features={plans.basic.features}
                ctaText={subscriptionStatus === 'active' ? 'Current Plan' : 'Select Plan'}
                ctaLink="#"
                freeTrial={false}
              />
            </div>
            
            {/* Premium Plan */}
            <div onClick={() => handleSelectPlan('premium')} className="cursor-pointer">
              <PlanCard 
                name={plans.premium.name}
                description={plans.premium.description}
                price={plans.premium.price}
                yearlyPrice={plans.premium.yearlyPrice}
                billingCycle={billingCycle}
                features={plans.premium.features}
                highlighted={true}
                ctaText={subscriptionStatus === 'active' ? 'Current Plan' : 'Select Plan'}
                ctaLink="#"
                freeTrial={false}
              />
            </div>
            
            {/* Fleet Plan */}
            <div onClick={() => handleSelectPlan('fleet')} className="cursor-pointer">
              <PlanCard 
                name={plans.fleet.name}
                description={plans.fleet.description}
                price={plans.fleet.price}
                yearlyPrice={plans.fleet.yearlyPrice}
                billingCycle={billingCycle}
                features={plans.fleet.features}
                ctaText={subscriptionStatus === 'active' ? 'Current Plan' : 'Select Plan'}
                ctaLink="#"
                freeTrial={false}
              />
            </div>
          </div>

          {/* Payment Form */}
          {showPaymentForm && (
            <div id="payment-form" className="bg-white rounded-lg shadow-lg overflow-hidden mb-12 animate-fadeIn">
              <div className="bg-gradient-to-r from-blue-600 to-blue-400 text-white px-6 py-4">
                <h2 className="text-xl font-semibold">Complete Your Subscription</h2>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-center mb-6">
                  <Image src="/images/TC.png" alt="Truck Command Logo" width={80} height={80} />
                </div>
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Order Summary</h3>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-900 font-medium">{plans[selectedPlan].name}</span>
                    <span className="text-gray-900">
                      ${billingCycle === 'yearly' ? 
                        plans[selectedPlan].yearlyPrice : 
                        plans[selectedPlan].price
                      }/month
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-sm text-gray-800 font-medium">Billing Cycle</span>
                    <span className="capitalize text-gray-900">{billingCycle}</span>
                  </div>
                  <div className="flex justify-between py-2 font-medium text-lg">
                    <span className="text-gray-900">Total Due Today</span>
                    <span className="text-gray-900">
                      ${billingCycle === 'yearly' ? 
                        (plans[selectedPlan].yearlyPrice * 12).toFixed(2) : 
                        plans[selectedPlan].price.toFixed(2)
                      }
                    </span>
                  </div>
                </div>
                
                <div className="mt-8">
                  <StripeCheckoutButton 
                    planId={selectedPlan}
                    billingCycle={billingCycle}
                    userId={user.id}
                    buttonText="Proceed to Checkout"
                    disabled={processingPayment}
                  />
                </div>
                
                <div className="mt-6 text-center text-sm text-gray-500">
                  <p>You can cancel or change your subscription YUR at any time from your dashboard.</p>
                  <p className="mt-2">Need help? Contact our support team.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}