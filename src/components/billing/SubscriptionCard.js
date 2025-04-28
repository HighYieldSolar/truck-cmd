"use client";

import { CreditCard, Clock, Calendar, CheckCircle } from 'lucide-react';
import StripePortalButton from './StripePortalButton';

export default function SubscriptionCard({ 
  subscriptionData, 
  userId,
  onUpdate
}) {
  // Format date string
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };
  
  // Get plan name
  const getPlanName = (planId) => {
    const plans = {
      'basic': 'Basic Plan',
      'premium': 'Premium Plan',
      'fleet': 'Fleet Plan'
    };
    return plans[planId] || 'Premium Plan';
  };
  
  // Get interval name
  const getIntervalName = (interval) => {
    return interval === 'yearly' ? 'Annual' : 'Monthly';
  };
  
  // Calculate days remaining in current period
  const getDaysRemaining = (endDate) => {
    if (!endDate) return 0;
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = Math.abs(end - now);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Status badge
  const StatusBadge = ({ status }) => {
    if (status === 'active') {
      return (
        <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle size={12} className="mr-1" />
          Active
        </div>
      );
    } else if (status === 'trial') {
      return (
        <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <Clock size={12} className="mr-1" />
          Trial
        </div>
      );
    } else if (status === 'past_due') {
      return (
        <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <Clock size={12} className="mr-1" />
          Past Due
        </div>
      );
    } else if (status === 'canceled') {
      return (
        <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <Clock size={12} className="mr-1" />
          Canceled
        </div>
      );
    }
    
    return (
      <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        {status || 'Unknown'}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-4 flex justify-between items-center">
        <h2 className="text-xl font-bold text-white flex items-center">
          <CreditCard size={20} className="mr-2" />
          Your Subscription
        </h2>
        <StatusBadge status={subscriptionData?.status} />
      </div>
      
      <div className="p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between">
          <div>
            <div className="mb-4">
              <h3 className="text-2xl font-bold text-gray-900">
                {getPlanName(subscriptionData?.plan)}
              </h3>
              <p className="text-gray-600 mt-1">
                {getIntervalName(subscriptionData?.billing_cycle)} billing
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center text-gray-700">
                <Calendar size={18} className="text-blue-500 mr-2" />
                <span className="mr-2 font-medium">Next billing:</span>
                <span>{formatDate(subscriptionData?.current_period_ends_at)}</span>
              </div>
              
              {subscriptionData?.trial_ends_at && (
                <div className="flex items-center text-gray-700">
                  <Clock size={18} className="text-blue-500 mr-2" />
                  <span className="mr-2 font-medium">Trial ends:</span>
                  <span>{formatDate(subscriptionData?.trial_ends_at)}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-6 md:mt-0">
            <StripePortalButton 
              userId={userId} 
              buttonText="Manage Subscription"
              className="w-full md:w-auto"
            />
          </div>
        </div>
      </div>
    </div>
  );
}