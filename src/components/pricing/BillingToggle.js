"use client";

export default function BillingToggle({ billingCycle, setBillingCycle }) {
  return (
    <div className="flex items-center justify-center mb-8 space-x-4">
      <span className={`text-black text-lg ${billingCycle === 'monthly' ? 'font-bold' : 'opacity-80'}`}>Monthly</span>
      <label className="relative inline-flex items-center cursor-pointer">
        <input 
          type="checkbox" 
          className="sr-only peer" 
          checked={billingCycle === 'yearly'}
          onChange={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
        />
        <div className="w-14 h-7 bg-white rounded-full peer peer-checked:after:translate-x-7 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-blue-600 after:rounded-full after:h-6 after:w-6 after:transition-all"></div>
      </label>
      <div className="flex flex-col items-start">
        <span className={`text-black text-lg ${billingCycle === 'yearly' ? 'font-bold' : 'opacity-80'}`}>Yearly</span>
        <span className="text-sm bg-green-500 text-white px-2 py-0.5 rounded-full">Save 20%</span>
      </div>
    </div>
  );
}