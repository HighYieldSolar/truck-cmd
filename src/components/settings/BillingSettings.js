"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useSubscription } from "@/context/SubscriptionContext";
import Link from "next/link";
import { 
  RefreshCw, 
  CreditCard, 
  CheckCircle, 
  AlertCircle,
  Calendar,
  Clock,
  Download,
  DollarSign,
  ArrowRight,
  FileText,
  Shield
} from "lucide-react";
import StripePortalButton from "@/components/billing/StripePortalButton";

export default function BillingSettings() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  
  // Get subscription context data
  const { 
    subscription, 
    loading: subscriptionLoading, 
    isTrialActive,
    isSubscriptionActive,
    getDaysLeftInTrial
  } = useSubscription();

  // Load user data
  useEffect(() => {
    async function loadUserData() {
      try {
        setLoading(true);
        
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) throw userError;
        
        if (!user) {
          window.location.href = '/login';
          return;
        }
        
        setUser(user);
        
        // Load invoices
        await loadInvoices(user.id);
        
      } catch (error) {
        console.error('Error loading user data:', error);
        setErrorMessage('Failed to load your billing information. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    
    loadUserData();
  }, []);

  // Load invoices from supabase
  const loadInvoices = async (userId) => {
    try {
      setLoadingInvoices(true);
      
      // Fetch invoices from database
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);
        
      if (error) throw error;
      
      setInvoices(data || []);
    } catch (error) {
      console.error('Error loading invoices:', error);
      // Don't set error message for this, just log it
    } finally {
      setLoadingInvoices(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // Function to determine subscription status
  const getSubscriptionStatus = () => {
    if (subscription?.status === 'active' && isSubscriptionActive()) {
      return 'active';
    } else if (subscription?.status === 'trial' && isTrialActive()) {
      return 'trial';
    } else if (subscription?.status === 'canceled') {
      return 'canceled';
    } else {
      return 'inactive';
    }
  };

  // Get status label and color
  const getStatusLabel = () => {
    const status = getSubscriptionStatus();
    
    switch (status) {
      case 'active':
        return { label: 'Active', color: 'text-green-600 bg-green-100' };
      case 'trial':
        return { label: 'Trial', color: 'text-blue-600 bg-blue-100' };
      case 'canceled':
        return { label: 'Canceled', color: 'text-orange-600 bg-orange-100' };
      default:
        return { label: 'Inactive', color: 'text-red-600 bg-red-100' };
    }
  };

  if (loading || subscriptionLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw size={32} className="animate-spin text-blue-600" />
        <span className="ml-2 text-gray-700">Loading billing information...</span>
      </div>
    );
  }

  const statusInfo = getStatusLabel();
  const subscriptionStatus = getSubscriptionStatus();
  const daysLeft = getDaysLeftInTrial ? getDaysLeftInTrial() : 0;

  return (
    <div>
      {/* Success/Error Messages */}
      {successMessage && (
        <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-md">
          <div className="flex items-start">
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3" />
            <span className="text-green-800">{successMessage}</span>
          </div>
        </div>
      )}
      
      {errorMessage && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3" />
            <span className="text-red-800">{errorMessage}</span>
          </div>
        </div>
      )}
      
      {/* Subscription Overview */}
      <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900">Current Plan</h3>
        </div>
        
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <div className="flex items-center">
                <h4 className="text-xl font-semibold text-gray-900 mr-3">
                  {subscription?.plan ? `${subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)} Plan` : 'Free Trial'}
                </h4>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                  {statusInfo.label}
                </span>
              </div>
              
              {subscription?.billing_cycle && (
                <p className="text-gray-600 mt-1">
                  Billed {subscription.billing_cycle === 'yearly' ? 'yearly' : 'monthly'}
                </p>
              )}
              
              {subscriptionStatus === 'trial' && (
                <div className="mt-2">
                  <p className="text-sm text-blue-700">
                    <Clock size={16} className="inline-block mr-1" />
                    {daysLeft} days remaining in your trial
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${Math.max(5, (daysLeft / 7) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              )}
              
              {subscriptionStatus === 'active' && subscription?.current_period_ends_at && (
                <p className="text-sm text-gray-600 mt-2">
                  <Calendar size={16} className="inline-block mr-1" />
                  Next billing date: {formatDate(subscription.current_period_ends_at)}
                </p>
              )}
              
              {subscriptionStatus === 'canceled' && subscription?.current_period_ends_at && (
                <p className="text-sm text-orange-600 mt-2">
                  <Calendar size={16} className="inline-block mr-1" />
                  Access until: {formatDate(subscription.current_period_ends_at)}
                </p>
              )}
            </div>
            
            <div className="mt-4 md:mt-0">
              {subscriptionStatus === 'active' && (
                <StripePortalButton 
                  userId={user.id} 
                  buttonText="Manage Subscription"
                  className="w-full md:w-auto"
                />
              )}
              
              {(subscriptionStatus === 'trial' || subscriptionStatus === 'inactive') && (
                <Link
                  href="/dashboard/billing"
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <CreditCard size={18} className="mr-2" />
                  {subscriptionStatus === 'trial' ? 'Upgrade Plan' : 'Choose a Plan'}
                </Link>
              )}
              
              {subscriptionStatus === 'canceled' && (
                <Link
                  href="/dashboard/billing"
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <CreditCard size={18} className="mr-2" />
                  Renew Subscription
                </Link>
              )}
            </div>
          </div>
          
          {/* Plan features */}
          {subscription?.plan && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h5 className="text-sm font-medium text-gray-700 mb-3">Included in your plan:</h5>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {subscription.plan === 'basic' && [
                  "Basic Invoicing & Dispatching",
                  "Simple Expense Tracking",
                  "Standard Reports",
                  "Single User Account",
                  "Email Support"
                ].map((feature, index) => (
                  <li key={index} className="flex items-center text-sm text-gray-600">
                    <CheckCircle size={16} className="text-green-500 mr-2 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
                
                {subscription.plan === 'premium' && [
                  "Advanced Invoicing & Dispatching",
                  "Comprehensive Expense Tracking",
                  "Advanced Reports & Analytics",
                  "Customer Management System",
                  "Advanced IFTA Calculator",
                  "Priority Email Support"
                ].map((feature, index) => (
                  <li key={index} className="flex items-center text-sm text-gray-600">
                    <CheckCircle size={16} className="text-green-500 mr-2 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
                
                {subscription.plan === 'fleet' && [
                  "All Premium Features",
                  "Fleet Management Tools",
                  "Real-time GPS Tracking",
                  "Team Access (1 User per 2 Trucks)",
                  "Fuel & Load Optimizations",
                  "Priority Phone Support"
                ].map((feature, index) => (
                  <li key={index} className="flex items-center text-sm text-gray-600">
                    <CheckCircle size={16} className="text-green-500 mr-2 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
      
      {/* Payment Methods */}
      <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900">Payment Methods</h3>
        </div>
        
        <div className="p-6">
          {subscriptionStatus === 'active' && (
            <div>
              <div className="flex items-start mb-4">
                <CreditCard size={24} className="text-gray-400 mr-3 flex-shrink-0" />
                <div>
                  <h5 className="font-medium text-gray-900">Payment Method on File</h5>
                  <p className="text-gray-600">
                    {subscription.card_brand && subscription.card_last4 
                      ? `${subscription.card_brand} ending in ${subscription.card_last4}`
                      : 'Visit Stripe portal to view payment method details'
                    }
                  </p>
                </div>
              </div>
              
              <StripePortalButton 
                userId={user.id} 
                buttonText="Update Payment Method"
                className="text-blue-600 hover:text-blue-800 bg-transparent hover:bg-blue-50 border border-blue-300"
              />
            </div>
          )}
          
          {subscriptionStatus !== 'active' && (
            <div className="flex items-start">
              <AlertCircle size={24} className="text-blue-500 mr-3 flex-shrink-0" />
              <div>
                <h5 className="font-medium text-gray-900">No Payment Method on File</h5>
                <p className="text-gray-600 mb-4">
                  You&#39;ll be asked to provide payment details when you subscribe to a plan.
                </p>
                
                <Link
                  href="/dashboard/billing"
                  className="inline-flex items-center text-blue-600 hover:text-blue-800"
                >
                  View subscription plans
                  <ArrowRight size={16} className="ml-1" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Billing History */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900">Billing History</h3>
        </div>
        
        <div className="p-6">
          {loadingInvoices ? (
            <div className="flex justify-center py-8">
              <RefreshCw size={24} className="animate-spin text-blue-600" />
            </div>
          ) : invoices.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invoice
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoices.map((invoice) => (
                    <tr key={invoice.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(invoice.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {invoice.description || `${subscription?.plan || 'Premium'} Plan - ${subscription?.billing_cycle || 'monthly'}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${invoice.amount?.toFixed(2) || '0.00'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          invoice.status === 'paid' ? 'bg-green-100 text-green-800' : 
                          invoice.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-red-100 text-red-800'
                        }`}>
                          {invoice.status?.charAt(0).toUpperCase() + invoice.status?.slice(1) || 'Paid'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          className="text-blue-600 hover:text-blue-900"
                          onClick={() => {/* Download/view invoice logic */}}
                        >
                          <Download size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText size={48} className="mx-auto text-gray-300 mb-4" />
              <h5 className="text-lg font-medium text-gray-900 mb-2">No billing history yet</h5>
              <p className="text-gray-600 mb-4">
                Your invoice history will appear here once you&#39;ve subscribed to a plan.
              </p>
              
              {subscriptionStatus !== 'active' && (
                <Link
                  href="/dashboard/billing"
                  className="inline-flex items-center text-blue-600 hover:text-blue-800"
                >
                  View subscription plans
                  <ArrowRight size={16} className="ml-1" />
                </Link>
              )}
            </div>
          )}
          
          {invoices.length > 0 && (
            <div className="mt-4 text-right">
              <StripePortalButton 
                userId={user.id} 
                buttonText="View All Invoices"
                className="text-blue-600 hover:text-blue-800 bg-transparent hover:bg-blue-50 border border-blue-300"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}