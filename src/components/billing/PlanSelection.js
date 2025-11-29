"use client";

import { useState } from "react";
import { Check, Star } from "lucide-react";

export default function PlanSelection({ selectedPlan, setSelectedPlan }) {
  const plans = [
    {
      id: "basic",
      name: "Basic Plan",
      price: "$20/month",
      yearlyPrice: "$16/month",
      features: ["1 Truck", "Basic Invoicing", "Email Support"]
    },
    {
      id: "premium",
      name: "Premium Plan",
      price: "$35/month",
      yearlyPrice: "$28/month",
      features: ["1-2 Trucks", "Advanced Features", "Priority Support"],
      recommended: true
    },
    {
      id: "fleet",
      name: "Fleet Plan",
      price: "$75/month",
      yearlyPrice: "$60/month",
      features: ["3+ Trucks", "Fleet Management", "Phone Support"]
    },
  ];

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Select a Plan</h3>
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
                    Popular
                  </span>
                </div>
              )}
              <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{plan.name}</h4>
              <p className="text-gray-600 dark:text-gray-400">{plan.price}</p>
              <ul className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center mt-1">
                    <Check size={16} className="text-emerald-500 dark:text-emerald-400 mr-2 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <div className="mt-4 w-full py-2 bg-blue-600 dark:bg-blue-500 text-white text-center rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors font-medium">
                Select Plan
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
