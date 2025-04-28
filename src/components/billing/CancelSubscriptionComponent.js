"use client";

import { useState } from 'react';
import { X, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export default function CancelSubscriptionComponent({ 
  userId, 
  subscriptionData,
  onCancel
}) {
  const [showModal, setShowModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCancelSubscription = async () => {
    if (confirmText !== 'CANCEL') {
      setError('Please type CANCEL to confirm');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Log user feedback before redirecting
      try {
        await supabase
          .from('subscription_feedback')
          .insert([{
            user_id: userId,
            subscription_id: subscriptionData?.stripe_subscription_id,
            reason: cancelReason,
            created_at: new Date().toISOString()
          }]);
      } catch (err) {
        console.error('Error logging feedback:', err);
        // Continue anyway
      }
      
      // Call Stripe Portal with cancel_subscription mode
      const response = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          returnUrl: window.location.href,
          mode: 'cancel_subscription'
        }),
      });
      
      const { url, error: responseError } = await response.json();
      
      if (responseError) {
        throw new Error(responseError);
      }
      
      // Redirect to Stripe Portal
      window.location.href = url;
      
    } catch (err) {
      console.error('Error canceling subscription:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  // Calculate end date
  const getEndDate = () => {
    if (!subscriptionData?.current_period_ends_at) return 'the end of your current billing period';
    const date = new Date(subscriptionData.current_period_ends_at);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Modal component
  const CancelModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex justify-between items-center border-b px-6 py-4">
          <h3 className="text-xl font-bold text-gray-900">Cancel Subscription</h3>
          <button 
            onClick={() => setShowModal(false)}
            className="text-gray-400 hover:text-gray-500"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="px-6 py-4">
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  Your subscription will remain active until {getEndDate()}, after which all premium features will be disabled.
                </p>
              </div>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Please tell us why you&#39;re cancelling:
            </label>
            <select
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Select a reason...</option>
              <option value="too_expensive">Too expensive</option>
              <option value="missing_features">Missing features I need</option>
              <option value="not_using">Not using the service enough</option>
              <option value="switching">Switching to another service</option>
              <option value="business_closed">Closed my business</option>
              <option value="temporary">Temporary pause - will be back</option>
              <option value="other">Other reason</option>
            </select>
          </div>
          
          {cancelReason === 'other' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Please specify:
              </label>
              <textarea
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                rows={3}
                placeholder="Tell us more..."
              ></textarea>
            </div>
          )}
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type CANCEL to confirm:
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="CANCEL"
            />
          </div>
          
          {error && (
            <div className="mb-4 text-sm text-red-600">
              {error}
            </div>
          )}
        </div>
        
        <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3 border-t">
          <button
            type="button"
            onClick={() => setShowModal(false)}
            className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
          >
            Never mind
          </button>
          <button
            type="button"
            onClick={handleCancelSubscription}
            disabled={loading || !cancelReason || confirmText !== 'CANCEL'}
            className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <RefreshCw size={16} className="inline-block animate-spin mr-2" />
                Processing...
              </>
            ) : (
              'Cancel Subscription'
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
      <div className="bg-gradient-to-r from-red-600 to-red-500 px-6 py-4">
        <h2 className="text-xl font-bold text-white flex items-center">
          <X size={20} className="mr-2" />
          Cancel Subscription
        </h2>
      </div>
      
      <div className="p-6">
        <p className="text-gray-700 mb-4">
          We&#39;re sorry to see you considering cancellation. Your subscription will remain active until the end of your current billing period.
        </p>
        
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                If you cancel, you&#39;ll lose access to premium features after {getEndDate()}.
              </p>
            </div>
          </div>
        </div>
        
        <button
          onClick={() => setShowModal(true)}
          className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none transition-colors"
        >
          Cancel My Subscription
        </button>
        
        <div className="mt-4 text-sm text-gray-500">
          <p>Need help instead? <a href="/contact" className="text-blue-600 hover:underline">Contact our support team</a></p>
        </div>
      </div>
      
      {showModal && <CancelModal />}
    </div>
  );
}