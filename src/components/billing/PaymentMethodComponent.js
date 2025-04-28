"use client";

import { useState } from 'react';
import { CreditCard, PlusCircle, RefreshCw, CreditCardIcon } from 'lucide-react';

export default function PaymentMethodComponent({ userId }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Example payment methods array
  // In a real implementation, you'd fetch this from your backend
  const [paymentMethods, setPaymentMethods] = useState([
    {
      id: 'pm_example',
      brand: 'visa',
      last4: '4242',
      expMonth: 12,
      expYear: 2025,
      isDefault: true
    }
  ]);

  // Handle update payment method
  const handleUpdatePayment = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Call Stripe Portal with update_payment_method mode
      const response = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          returnUrl: window.location.href,
          mode: 'update_payment_method'
        }),
      });
      
      const { url, error: responseError } = await response.json();
      
      if (responseError) {
        throw new Error(responseError);
      }
      
      // Redirect to Stripe Portal
      window.location.href = url;
      
    } catch (err) {
      console.error('Error updating payment method:', err);
      setError(err.message);
      setLoading(false);
    }
  };
  
  // Handle add payment method
  const handleAddPayment = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Call Stripe Portal with add_payment_method mode
      const response = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          returnUrl: window.location.href,
          mode: 'add_payment_method'
        }),
      });
      
      const { url, error: responseError } = await response.json();
      
      if (responseError) {
        throw new Error(responseError);
      }
      
      // Redirect to Stripe Portal
      window.location.href = url;
      
    } catch (err) {
      console.error('Error adding payment method:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  // Get card icon based on brand
  const getCardIcon = (brand) => {
    return <CreditCard size={20} />;
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-4">
        <h2 className="text-xl font-bold text-white flex items-center">
          <CreditCard size={20} className="mr-2" />
          Payment Methods
        </h2>
      </div>
      
      <div className="p-6">
        {error && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <p className="text-red-700">{error}</p>
          </div>
        )}
        
        <div className="space-y-4">
          {paymentMethods.map((method) => (
            <div key={method.id} className="flex justify-between items-center p-4 border rounded-lg">
              <div className="flex items-center">
                {getCardIcon(method.brand)}
                <div className="ml-3">
                  <p className="font-medium text-gray-900 capitalize">
                    {method.brand} •••• {method.last4}
                  </p>
                  <p className="text-sm text-gray-500">
                    Expires {method.expMonth}/{method.expYear}
                  </p>
                </div>
              </div>
              
              {method.isDefault && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                  Default
                </span>
              )}
            </div>
          ))}
          
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 pt-4">
            <button
              onClick={handleAddPayment}
              disabled={loading}
              className="flex items-center justify-center py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              {loading ? (
                <RefreshCw size={16} className="animate-spin mr-2" />
              ) : (
                <PlusCircle size={16} className="mr-2" />
              )}
              Add Payment Method
            </button>
            
            <button
              onClick={handleUpdatePayment}
              disabled={loading}
              className="flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              {loading ? (
                <RefreshCw size={16} className="animate-spin mr-2" />
              ) : (
                <CreditCard size={16} className="mr-2" />
              )}
              Manage Payment Methods
            </button>
          </div>
        </div>
        
        <div className="mt-6 text-sm text-gray-500">
          <p>Your payment information is securely processed by Stripe. We do not store your full card details on our servers.</p>
        </div>
      </div>
    </div>
  );
}