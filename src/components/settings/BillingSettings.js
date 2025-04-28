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
  Shield,
  CreditCard as CardIcon,
  Zap,
  X,
  ExternalLink,
  ChevronRight,
  ChevronUp,
  ChevronDown
} from "lucide-react";
import StripePortalButton from "@/components/billing/StripePortalButton";

export default function BillingSettings() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [showAllInvoices, setShowAllInvoices] = useState(false);
  const [expandedSection, setExpandedSection] = useState("subscription");
  
  // Get subscription context data
  const { 
    subscription, 
    loading: subscriptionLoading, 
    isTrialActive,
    isSubscriptionActive,
    getDaysLeftInTrial,
    refreshSubscription
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
        .limit(10);
        
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

  // Toggle section expand/collapse
  const toggleSection = (section) => {
    if (expandedSection === section) {
      setExpandedSection(null);
    } else {
      setExpandedSection(section);
    }
  };

  const handleRefreshSubscription = () => {
    refreshSubscription();
    setSuccessMessage("Subscription information refreshed");
    setTimeout(() => setSuccessMessage(null), 3000);
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

  // Get pricing info based on plan
  const getPlanDetails = () => {
    const plan = subscription?.plan || 'premium';
    
    switch(plan) {
      case 'basic':
        return {
          name: 'Basic Plan',
          monthlyPrice: '$19',
          yearlyPrice: '$16',
          yearlyTotal: '$192',
          features: [
            "Basic Invoicing & Dispatching",
            "Simple Expense Tracking",
            "Standard Reports",
            "Single User Account",
            "Email Support"
          ]
        };
      case 'fleet':
        return {
          name: 'Fleet Plan',
          monthlyPrice: '$69',
          yearlyPrice: '$55',
          yearlyTotal: '$660',
          features: [
            "All Premium Features",
            "Fleet Management Tools",
            "Real-time GPS Tracking",
            "Team Access (1 User per 2 Trucks)",
            "Fuel & Load Optimizations",
            "Priority Phone Support"
          ]
        };
      default: // premium
        return {
          name: 'Premium Plan',
          monthlyPrice: '$39',
          yearlyPrice: '$33',
          yearlyTotal: '$396',
          features: [
            "Advanced Invoicing & Dispatching",
            "Comprehensive Expense Tracking",
            "Advanced Reports & Analytics",
            "Customer Management System",
            "Advanced IFTA Calculator",
            "Priority Email Support"
          ]
        };
    }
  };

  const planDetails = getPlanDetails();

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
      
      {/* Subscription Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Billing & Subscription</h2>
        
        <div className="mt-3 md:mt-0 flex items-center space-x-3">
          <button
            onClick={handleRefreshSubscription}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <RefreshCw size={16} className="mr-1.5" />
            Refresh
          </button>
          
          <Link
            href="/dashboard/billing"
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <CreditCard size={16} className="mr-1.5" />
            View All Plans
          </Link>
        </div>
      </div>
      
      {/* Current Subscription Section */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden mb-6">
        <div 
          className="flex items-center justify-between px-6 py-4 border-b border-gray-200 cursor-pointer"
          onClick={() => toggleSection('subscription')}
        >
          <div className="flex items-center">
            <Zap size={20} className="text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Current Subscription</h3>
          </div>
          <div className="flex items-center space-x-3">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
            {expandedSection === 'subscription' ? 
              <ChevronUp size={20} className="text-gray-500" /> : 
              <ChevronDown size={20} className="text-gray-500" />
            }
          </div>
        </div>
        
        {expandedSection === 'subscription' && (
          <div className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
              <div>
                <div className="flex items-center">
                  <h4 className="text-xl font-semibold text-gray-900 mr-2">{planDetails.name}</h4>
                </div>
                <p className="text-gray-600 mt-1">
                  {subscription?.billing_cycle === 'yearly' 
                    ? `${planDetails.yearlyPrice}/month (billed annually at ${planDetails.yearlyTotal})` 
                    : `${planDetails.monthlyPrice}/month (billed monthly)`}
                </p>
                
                {subscriptionStatus === 'trial' && (
                  <div className="mt-3">
                    <div className="flex items-center text-blue-700">
                      <Clock size={16} className="mr-1.5" />
                      <span className="font-medium">{daysLeft} days left in your trial</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${Math.max(5, (daysLeft / 7) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                
                {subscriptionStatus === 'active' && subscription?.current_period_ends_at && (
                  <div className="mt-3 flex items-center text-gray-600">
                    <Calendar size={16} className="mr-1.5" />
                    <span>Next billing date: <span className="font-medium">{formatDate(subscription.current_period_ends_at)}</span></span>
                  </div>
                )}
                
                {subscriptionStatus === 'canceled' && subscription?.current_period_ends_at && (
                  <div className="mt-3 flex items-center text-orange-600">
                    <Calendar size={16} className="mr-1.5" />
                    <span>Access until: <span className="font-medium">{formatDate(subscription.current_period_ends_at)}</span></span>
                  </div>
                )}
              </div>

              <div className="mt-4 md:mt-0 flex flex-col md:items-end space-y-3">
                {subscriptionStatus === 'active' && (
                  <>
                    <StripePortalButton 
                      userId={user.id} 
                      buttonText="Manage Subscription"
                      className="w-full md:w-auto"
                    />
                    <span className="text-xs text-gray-500">Change plan, billing cycle, or cancel</span>
                  </>
                )}
                
                {(subscriptionStatus === 'trial' || subscriptionStatus === 'inactive') && (
                  <>
                    <Link
                      href="/dashboard/billing"
                      className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors w-full md:w-auto"
                    >
                      <CreditCard size={18} className="mr-2" />
                      {subscriptionStatus === 'trial' ? 'Upgrade Plan' : 'Choose a Plan'}
                    </Link>
                    <span className="text-xs text-gray-500">
                      {subscriptionStatus === 'trial' 
                        ? 'Upgrade now to continue using all features' 
                        : 'Subscribe to access premium features'
                      }
                    </span>
                  </>
                )}
                
                {subscriptionStatus === 'canceled' && (
                  <>
                    <Link
                      href="/dashboard/billing"
                      className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors w-full md:w-auto"
                    >
                      <Zap size={18} className="mr-2" />
                      Renew Subscription
                    </Link>
                    <span className="text-xs text-gray-500">Your plan will expire soon</span>
                  </>
                )}
              </div>
            </div>
            
            {/* Plan features */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h5 className="text-sm font-medium text-gray-700 mb-3">Included in your plan:</h5>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {planDetails.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-sm text-gray-600">
                    <CheckCircle size={16} className="text-green-500 mr-2 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              
              {(subscriptionStatus === 'trial' || subscriptionStatus === 'active') && (
                <div className="mt-6 flex justify-center">
                  <Link 
                    href="/dashboard/billing" 
                    className="inline-flex items-center text-blue-600 hover:text-blue-800"
                  >
                    Compare all plans
                    <ChevronRight size={16} className="ml-1" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Payment Method Section */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden mb-6">
        <div 
          className="flex items-center justify-between px-6 py-4 border-b border-gray-200 cursor-pointer"
          onClick={() => toggleSection('payment')}
        >
          <div className="flex items-center">
            <CardIcon size={20} className="text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Payment Method</h3>
          </div>
          {expandedSection === 'payment' ? 
            <ChevronUp size={20} className="text-gray-500" /> : 
            <ChevronDown size={20} className="text-gray-500" />
          }
        </div>
        
        {expandedSection === 'payment' && (
          <div className="p-6">
            {subscriptionStatus === 'active' ? (
              <div>
                <div className="flex items-start mb-6">
                  <div className="w-12 h-8 bg-gray-100 rounded border border-gray-200 flex items-center justify-center text-gray-700 font-bold text-sm mr-4">
                    {subscription.card_brand || 'CARD'}
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-900">Payment Card</h5>
                    <p className="text-gray-600">
                      {subscription.card_brand && subscription.card_last4 
                        ? `${subscription.card_brand} ending in ${subscription.card_last4}`
                        : 'Visit Stripe portal to view payment method details'
                      }
                    </p>
                    {subscription.card_exp_month && subscription.card_exp_year && (
                      <p className="text-sm text-gray-500 mt-1">
                        Expires {subscription.card_exp_month}/{subscription.card_exp_year}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-3">
                  <StripePortalButton 
                    userId={user.id} 
                    buttonText="Update Payment Method"
                    className="text-blue-600 hover:text-blue-800 bg-white hover:bg-blue-50 border border-blue-300 w-full md:w-auto"
                  />
                  
                  <StripePortalButton 
                    userId={user.id} 
                    buttonText="Manage Billing Information"
                    className="text-gray-700 hover:text-gray-900 bg-white hover:bg-gray-50 border border-gray-300 w-full md:w-auto"
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-start">
                <div className="flex-shrink-0 mr-3">
                  {subscriptionStatus === 'trial' ? (
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <Clock size={20} className="text-blue-600" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                      <CardIcon size={20} className="text-gray-500" />
                    </div>
                  )}
                </div>
                <div>
                  <h5 className="font-medium text-gray-900 mb-1">
                    {subscriptionStatus === 'trial' 
                      ? 'No payment method required yet' 
                      : 'No payment method on file'
                    }
                  </h5>
                  <p className="text-gray-600 mb-4">
                    {subscriptionStatus === 'trial' 
                      ? `You'll be asked to provide payment details when your trial ends in ${daysLeft} days.` 
                      : 'You\'ll be asked to provide payment details when you subscribe to a plan.'
                    }
                  </p>
                  
                  <Link
                    href="/dashboard/billing"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    <ExternalLink size={16} className="mr-1.5" />
                    View Plans & Pricing
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Billing History Section */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        <div 
          className="flex items-center justify-between px-6 py-4 border-b border-gray-200 cursor-pointer"
          onClick={() => toggleSection('history')}
        >
          <div className="flex items-center">
            <FileText size={20} className="text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Billing History</h3>
          </div>
          {expandedSection === 'history' ? 
            <ChevronUp size={20} className="text-gray-500" /> : 
            <ChevronDown size={20} className="text-gray-500" />
          }
        </div>
        
        {expandedSection === 'history' && (
          <div className="p-6">
            {loadingInvoices ? (
              <div className="flex justify-center py-8">
                <RefreshCw size={24} className="animate-spin text-blue-600" />
              </div>
            ) : invoices.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Invoice
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {invoices.slice(0, showAllInvoices ? invoices.length : 5).map((invoice) => (
                        <tr key={invoice.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(invoice.created_at)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {invoice.description || `${subscription?.plan || 'Premium'} Plan - ${subscription?.billing_cycle || 'monthly'}`}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                            ${invoice.amount?.toFixed(2) || '0.00'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              invoice.status === 'paid' ? 'bg-green-100 text-green-800' : 
                              invoice.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                              'bg-red-100 text-red-800'
                            }`}>
                              {invoice.status?.charAt(0).toUpperCase() + invoice.status?.slice(1) || 'Paid'}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                            <button 
                              className="text-blue-600 hover:text-blue-900 p-1"
                              aria-label="Download invoice"
                              title="Download invoice"
                            >
                              <Download size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {invoices.length > 5 && (
                  <div className="mt-4 text-center">
                    <button
                      onClick={() => setShowAllInvoices(!showAllInvoices)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      {showAllInvoices ? 'Show less' : `Show all ${invoices.length} invoices`}
                    </button>
                  </div>
                )}
                
                <div className="mt-6 flex justify-center">
                  <StripePortalButton 
                    userId={user.id} 
                    buttonText="View All Billing History"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  />
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <FileText size={48} className="mx-auto text-gray-300 mb-4" />
                <h5 className="text-lg font-medium text-gray-900 mb-2">No billing history yet</h5>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Your invoice history will appear here once you&#39;ve subscribed to a plan or made a payment.
                </p>
                
                <Link
                  href="/dashboard/billing"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  <CreditCard size={16} className="mr-1.5" />
                  View Subscription Plans
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Help Section */}
      <div className="mt-6 bg-blue-50 rounded-lg p-6 border border-blue-100">
        <div className="flex">
          <div className="flex-shrink-0">
            <Shield size={24} className="text-blue-600" />
          </div>
          <div className="ml-4">
            <h4 className="text-lg font-medium text-blue-900">Need help with billing?</h4>
            <p className="text-blue-700 mt-1">Our support team is available to assist you with any billing questions.</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link 
                href="/contact" 
                className="inline-flex items-center px-4 py-2 border border-blue-300 rounded-md text-sm font-medium text-blue-700 bg-white hover:bg-blue-50"
              >
                Contact Support
              </Link>
              <Link 
                href="/faq" 
                className="inline-flex items-center px-4 py-2 border border-blue-300 rounded-md text-sm font-medium text-blue-700 bg-white hover:bg-blue-50"
              >
                Billing FAQ
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}