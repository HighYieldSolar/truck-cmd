"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import DashboardLayout from "@/components/layout/DashboardLayout";
import SubscriptionCard from "@/components/billing/SubscriptionCard";
import ChangePlanComponent from "@/components/billing/ChangePlanComponent";
import PaymentMethodComponent from "@/components/billing/PaymentMethodComponent";
import BillingHistoryComponent from "@/components/billing/BillingHistoryComponent";
import CancelSubscriptionComponent from "@/components/billing/CancelSubscriptionComponent";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AlertCircle, RefreshCw, CreditCard, FileText, Package, X } from "lucide-react";

export default function SubscriptionManagementPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  
  // Fetch user and subscription data
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // Get the current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) throw userError;
        
        if (!user) {
          router.push('/login');
          return;
        }
        
        setUser(user);
        
        // Fetch subscription data
        const { data: subscription, error: subError } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .single();
          
        if (subError && subError.code !== 'PGRST116') { // Not found error
          console.error('Error fetching subscription:', subError);
          setError('Failed to load subscription data. Please try again later.');
        }
        
        setSubscriptionData(subscription || {
          status: 'trial',
          plan: 'premium',
          billing_cycle: 'monthly',
          trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        });
        
      } catch (error) {
        console.error('Error loading user data:', error);
        setError('Failed to load user data. Please try refreshing the page.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [router]);
  
  // Handle refreshing subscription data
  const handleRefreshData = async () => {
    try {
      setLoading(true);
      
      // Fetch subscription data
      const { data: subscription, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();
        
      if (subError && subError.code !== 'PGRST116') {
        console.error('Error refreshing subscription data:', subError);
        setError('Failed to refresh subscription data.');
      } else {
        setSubscriptionData(subscription || {
          status: 'trial',
          plan: 'premium',
          billing_cycle: 'monthly',
          trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        });
        setError(null);
      }
    } catch (err) {
      console.error('Error refreshing data:', err);
      setError('Failed to refresh data. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Loading state
  if (loading) {
    return (
      <DashboardLayout activePage="billing">
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 relative">
              <div className="absolute inset-0 rounded-full border-4 border-blue-200"></div>
              <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
            </div>
            <p className="mt-6 text-lg text-gray-700 font-medium">Loading subscription details...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activePage="billing">
      <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Subscription Management</h1>
          <p className="mt-2 text-gray-600">Manage your plan, payment methods, and billing history.</p>
        </div>
        
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Subscription Card - Always visible at the top */}
        <div className="mb-8">
          <SubscriptionCard 
            subscriptionData={subscriptionData} 
            userId={user?.id}
          />
        </div>
        
        {/* Management Tabs */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 mb-8">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="overview">
                <CreditCard size={16} className="mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="changePlan">
                <Package size={16} className="mr-2" />
                Change Plan
              </TabsTrigger>
              <TabsTrigger value="paymentMethods">
                <CreditCard size={16} className="mr-2" />
                Payment Methods
              </TabsTrigger>
              <TabsTrigger value="billingHistory">
                <FileText size={16} className="mr-2" />
                Billing History
              </TabsTrigger>
              <TabsTrigger value="cancelSubscription">
                <X size={16} className="mr-2" />
                Cancel
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview">
              <div className="p-6 space-y-6">
                <div className="text-gray-600">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Subscription Details</h3>
                  <p className="mb-4">
                    You are currently on the <span className="font-medium text-gray-900">{subscriptionData?.plan ? subscriptionData.plan.charAt(0).toUpperCase() + subscriptionData.plan.slice(1) : 'Premium'} Plan</span> with <span className="font-medium text-gray-900">{subscriptionData?.billing_cycle === 'yearly' ? 'annual' : 'monthly'}</span> billing.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                    <button
                      onClick={() => setActiveTab("changePlan")}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                    >
                      <Package size={16} className="mr-2" />
                      Change Plan
                    </button>
                    <button
                      onClick={() => setActiveTab("paymentMethods")}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                    >
                      <CreditCard size={16} className="mr-2" />
                      Manage Payment Methods
                    </button>
                  </div>
                </div>
                
                <div className="border-t border-gray-200 pt-6 mt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Next Steps</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-start">
                      <span className="flex items-center justify-center h-5 w-5 rounded-full bg-blue-100 text-blue-600 text-xs font-medium mr-2 mt-0.5">1</span>
                      <span>Review your current plan and features</span>
                    </li>
                    <li className="flex items-start">
                      <span className="flex items-center justify-center h-5 w-5 rounded-full bg-blue-100 text-blue-600 text-xs font-medium mr-2 mt-0.5">2</span>
                      <span>Update your payment method or billing information if needed</span>
                    </li>
                    <li className="flex items-start">
                      <span className="flex items-center justify-center h-5 w-5 rounded-full bg-blue-100 text-blue-600 text-xs font-medium mr-2 mt-0.5">3</span>
                      <span>Check your billing history for past invoices</span>
                    </li>
                  </ul>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="changePlan">
              <div className="p-6">
                <ChangePlanComponent 
                  userId={user?.id} 
                  currentPlan={subscriptionData?.plan || 'premium'}
                  currentInterval={subscriptionData?.billing_cycle || 'monthly'}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="paymentMethods">
              <div className="p-6">
                <PaymentMethodComponent userId={user?.id} />
              </div>
            </TabsContent>
            
            <TabsContent value="billingHistory">
              <div className="p-6">
                <BillingHistoryComponent userId={user?.id} />
              </div>
            </TabsContent>
            
            <TabsContent value="cancelSubscription">
              <div className="p-6">
                <CancelSubscriptionComponent 
                  userId={user?.id} 
                  subscriptionData={subscriptionData}
                  onCancel={() => {
                    // Refresh data after cancellation
                    handleRefreshData();
                    // Switch to overview tab
                    setActiveTab("overview");
                  }}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  );
}