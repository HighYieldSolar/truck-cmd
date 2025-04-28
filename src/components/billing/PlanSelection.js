"use client";

import { useState } from "react";
import Link from 'next/link';
import { Check, X } from "lucide-react";

export default function PlanSelection({ selectedPlan, setSelectedPlan }) {
  const plans = [
    { id: "basic", name: "Basic Plan", price: "$19/month", features: ["1 Truck", "Basic Features"] },
    { id: "premium", name: "Premium Plan", price: "$39/month", features: ["1-2 Trucks", "Premium Features"] },
    { id: "fleet", name: "Fleet Plan", price: "$69+/month", features: ["3+ Trucks", "Advanced Fleet Tools"] },
  ];

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold text-gray-800">Select a Plan</h3>
      <div className="grid grid-cols-1 gap-4 mt-3">
        {plans.map((plan) => (
          <button
            key={plan.id}
            onClick={() => setSelectedPlan(plan.id)}
            className={`p-4 border rounded-lg cursor-pointer transition-all duration-300 hover:bg-blue-50 w-full text-left border-blue-200 hover:shadow-lg ${
              selectedPlan === plan.id ? "border-blue-500 bg-blue-100" : ""
            }`}
          >
            <div className="relative">
              {plan.id === "premium" && (
                <div className="absolute top-0 right-0">
                  <div className="bg-orange-500 text-white text-center text-sm py-1 px-4 rounded-full">
                    Popular
                  </div>
                </div>
              )}
              <h4 className="text-lg font-semibold">{plan.name}</h4>
              <p className="text-gray-600">{plan.price}</p>
              <ul className="text-sm text-gray-500 mt-2">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center mt-1">
                    <Check size={16} className="text-green-500 mr-2 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              
              <div className="mt-4 w-full py-2 bg-blue-500 text-white text-center rounded-md hover:bg-blue-600 transition-colors">
                Select Plan
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}