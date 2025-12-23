"use client";

import { useState } from "react";
import { Check, Star } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";

export default function PlanSelection({ selectedPlan, setSelectedPlan }) {
  const { t } = useTranslation('billing');

  // Plans data - matches tierConfig.js, uses translations
  const plans = [
    {
      id: "basic",
      name: t('planSelection.plans.basic.name'),
      description: t('planSelection.plans.basic.description'),
      price: "$20/month",
      yearlyPrice: "$16/month",
      limits: t('planSelection.plans.basic.limits'),
      features: t('planSelection.plans.basic.features', { returnObjects: true }) || []
    },
    {
      id: "premium",
      name: t('planSelection.plans.premium.name'),
      description: t('planSelection.plans.premium.description'),
      price: "$35/month",
      yearlyPrice: "$28/month",
      limits: t('planSelection.plans.premium.limits'),
      features: t('planSelection.plans.premium.features', { returnObjects: true }) || [],
      recommended: true
    },
    {
      id: "fleet",
      name: t('planSelection.plans.fleet.name'),
      description: t('planSelection.plans.fleet.description'),
      price: "$75/month",
      yearlyPrice: "$60/month",
      limits: t('planSelection.plans.fleet.limits'),
      features: t('planSelection.plans.fleet.features', { returnObjects: true }) || []
    },
  ];

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">{t('planSelection.selectPlan')}</h3>
      <div className="grid grid-cols-1 gap-4">
        {plans.map((plan) => (
          <button
            key={plan.id}
            onClick={() => setSelectedPlan(plan.id)}
            className={`p-4 border rounded-xl cursor-pointer transition-all duration-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 w-full text-left ${
              selectedPlan === plan.id
                ? "border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20"
                : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
            } hover:shadow-lg`}
          >
            <div className="relative">
              {plan.recommended && (
                <div className="absolute top-0 right-0">
                  <span className="inline-flex items-center bg-orange-500 text-white text-center text-xs py-1 px-3 rounded-full">
                    <Star size={12} className="mr-1" />
                    {t('planSelection.popular')}
                  </span>
                </div>
              )}
              <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{plan.name}</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{plan.description}</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{plan.price}</p>

              {/* Resource limits badge */}
              {plan.limits && (
                <div className="inline-flex items-center px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full mt-2">
                  {plan.limits}
                </div>
              )}

              <ul className="text-sm text-gray-500 dark:text-gray-400 mt-3">
                {(Array.isArray(plan.features) ? plan.features : []).map((feature, index) => (
                  <li key={index} className="flex items-center mt-1">
                    <Check size={16} className="text-emerald-500 dark:text-emerald-400 mr-2 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <div className="mt-4 w-full py-2 bg-blue-600 dark:bg-blue-500 text-white text-center rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors font-medium">
                {selectedPlan === plan.id ? t('planSelection.selected') : t('planSelection.selectPlanButton')}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
