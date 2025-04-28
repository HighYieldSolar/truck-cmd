"use client";

import Link from 'next/link';
import { Check, X, CheckCircle } from 'lucide-react';

export default function PlanCard({ 
  name, 
  description = "", 
  price, 
  yearlyPrice, 
  billingCycle, 
  features = [], 
  highlighted = false,
  freeTrial = true,
  ctaText = "Start Free Trial",
  ctaLink = "/signup",
  onClick = null
}) {
  const isYearly = billingCycle === 'yearly';
  const displayPrice = isYearly ? yearlyPrice : price;
  const yearlyDiscount = Math.round(((price * 12) - (yearlyPrice * 12)) / (price * 12) * 100);
  
  const cardContent = (
    <div className={`bg-white rounded-xl shadow-lg overflow-hidden transition-all text-black duration-300 hover:shadow-xl hover:-translate-y-1 h-full flex flex-col ${
      highlighted ? 'relative border-2 border-blue-500' : 'border border-gray-200'
    }`}>
      {highlighted && (
        <div className="absolute top-0 right-0">
          <div className="bg-blue-600 text-white transform rotate-45 text-center text-sm py-1 px-8 translate-x-8 translate-y-4 font-semibold">
            Popular
          </div>
        </div>
      )}
      
      <div className={`p-8 border-b border-gray-100 ${highlighted ? 'bg-gradient-to-br from-blue-50 to-blue-100' : ''}`}>
        <h4 className="text-2xl font-bold mb-2">{name}</h4>
        {description && <p className="text-gray-600 mb-4">{description}</p>}
        <div className="flex items-end">
          <p className="text-4xl font-extrabold text-blue-600">
            ${displayPrice}
          </p>
          <span className="text-black text-xl ml-1 mb-1">/mo</span>
        </div>
        <p className="text-gray-600 mt-2">
          {isYearly 
            ? `Billed $${displayPrice * 12} yearly (save ${yearlyDiscount}%)`
            : 'Billed monthly'}
        </p>
        {freeTrial && (
          <div className="mt-4 bg-green-100 text-green-800 py-2 px-3 rounded-lg inline-flex items-center">
            <CheckCircle size={16} className="mr-1" />
            <span>7-day free trial</span>
          </div>
        )}
      </div>
      
      <div className="p-8 flex-1 flex flex-col justify-between">
        <ul className="space-y-4 mb-8">
          {features.map((feature, index) => (
            <li key={index} className={`flex items-start ${!feature.included ? 'opacity-60' : ''}`}>
              {feature.included ? (
                <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                  <Check size={14} className="text-blue-600" />
                </div>
              ) : (
                <div className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                  <X size={14} className="text-gray-400" />
                </div>
              )}
              <span className="text-gray-700">{feature.text}</span>
            </li>
          ))}
        </ul>
        
        {onClick ? (
          <button 
            onClick={onClick}
            className={`w-full py-3 px-4 rounded-lg font-medium text-center transition-colors ${
              highlighted 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
            }`}
          >
            {ctaText}
          </button>
        ) : (
          <Link
            href={`${ctaLink}?plan=${name.toLowerCase().replace(/\s+/g, '-')}`}
            className={`block w-full py-3 px-4 rounded-lg font-medium text-center transition-colors ${
              highlighted 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
            }`}
          >
            {ctaText}
          </Link>
        )}
      </div>
    </div>
  );

  return cardContent;
}
