"use client";

import Link from 'next/link';
import { Check, X, CheckCircle } from 'lucide-react';
import { useTranslation } from "@/context/LanguageContext";

export default function PlanCard({
  name,
  description = "",
  price,
  yearlyPrice,
  billingCycle,
  features = [],
  highlighted = false,
  freeTrial = true,
  ctaText,
  ctaLink = "/signup",
  textColor = "text-gray-900" // Add this default parameter
}) {
  const { t } = useTranslation('landing');
  const isYearly = billingCycle === 'yearly';
  const displayPrice = isYearly ? yearlyPrice : price;
  const yearlyDiscount = Math.round(((price * 12) - (yearlyPrice * 12)) / (price * 12) * 100);
  const buttonText = ctaText || t('pricing.startFreeTrial');
  
  return (
    <div className={`bg-white rounded-xl shadow-lg overflow-hidden transition-all text-black duration-300 hover:shadow-xl hover:-translate-y-1 ${highlighted ? 'relative' : ''}`}>
      {highlighted && (
        <div className="absolute top-0 right-0">
          <div className="bg-orange-500 text-white transform rotate-45 text-center text-sm py-1 px-8 translate-x-8 translate-y-4">
            {t('pricing.popular')}
          </div>
        </div>
      )}
      
      <div className={`p-8 border-b border-gray-100 ${highlighted ? 'bg-gradient-to-r from-blue-50 to-blue-100' : ''}`}>
        <h4 className="text-2xl font-semibold mb-2">{name}</h4>
        {description && <p className="text-gray-600 mb-4">{description}</p>}
        <div className="flex items-baseline">
          <p className="text-5xl font-bold">
            ${displayPrice}
          </p>
          <span className="text-black text-xl ml-1">{t('pricing.perMonth')}</span>
        </div>
        <p className="text-gray-600 mt-2">
          {isYearly
            ? t('pricing.billedYearly', { amount: displayPrice * 12, savings: Math.round((price * 12) - (displayPrice * 12)) })
            : t('pricing.billedMonthly')}
        </p>
        {freeTrial && (
          <div className="mt-4 bg-green-100 text-green-800 py-2 px-3 rounded-lg inline-flex items-center">
            <CheckCircle size={16} className="mr-1" />
            <span>{t('pricing.freeTrial')}</span>
          </div>
        )}
      </div>
      
      <div className="p-8">
        <ul className="space-y-4">
          {features.map((feature, index) => (
            <li key={index} className={`flex items-start ${!feature.included ? 'opacity-50' : ''}`}>
              {feature.included ? (
                <Check size={20} className="text-green-500 mr-2 mt-1 flex-shrink-0" />
              ) : (
                <X size={20} className="text-red-500 mr-2 mt-1 flex-shrink-0" />
              )}
              <span>{feature.text}</span>
            </li>
          ))}
        </ul>
        
        <Link
          href={`${ctaLink}?plan=${name.toLowerCase().replace(/\s+/g, '-')}`}
          className="block w-full text-center mt-8 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
        >
          {buttonText}
        </Link>
      </div>
    </div>
  );
}