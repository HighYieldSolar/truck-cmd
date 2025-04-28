
"use client";

export default function BillingToggle({ billingCycle, setBillingCycle }) {
  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-sm p-2 flex items-center justify-between">
      <button
        onClick={() => setBillingCycle('monthly')}
        className={`flex-1 py-2 px-4 rounded-md transition-colors font-medium ${
          billingCycle === 'monthly' 
            ? 'bg-blue-600 text-white'
            : 'text-gray-700 hover:bg-gray-100'
        }`}
      >
        Monthly
      </button>
      
      <div className="px-3 text-center">
        <div className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded-full">
          Save 20%
        </div>
      </div>
      
      <button
        onClick={() => setBillingCycle('yearly')}
        className={`flex-1 py-2 px-4 rounded-md transition-colors font-medium ${
          billingCycle === 'yearly' 
            ? 'bg-blue-600 text-white'
            : 'text-gray-700 hover:bg-gray-100'
        }`}
      >
        Yearly
      </button>
    </div>
  );
}
