// src/components/fuel/FuelCategories.js
"use client";

import { 
  MapPin,
  Tag
} from "lucide-react";

export default function FuelCategories({ 
  categories, 
  onCategorySelect,
  selectedCategory
}) {
  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  // Get category icon (all states use MapPin)
  const getCategoryIcon = (category) => {
    return <MapPin size={16} className="text-purple-600" />;
  };

  // Filter out categories with no fuel entries
  const activeCategories = Object.entries(categories)
    .filter(([_, amount]) => amount > 0)
    .sort(([_, amountA], [__, amountB]) => amountB - amountA);

  if (activeCategories.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Tag size={36} className="mx-auto mb-2 text-gray-400" />
        <p>No states found</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activeCategories.map(([state, amount]) => (
        <div
          key={state}
          className={`p-3 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
            selectedCategory === state 
              ? 'bg-blue-50 border-blue-200 border' 
              : 'bg-gray-50 hover:bg-blue-50'
          }`}
          onClick={() => onCategorySelect(state)}
        >
          <div className="flex items-center">
            <MapPin size={16} className="text-purple-600 mr-2" />
            <span className="ml-1 text-sm font-medium text-gray-700">{state}</span>
          </div>
          <span className="text-xs font-medium px-2 py-1 bg-white rounded-full text-gray-600 shadow-sm">
            {formatCurrency(amount)}
          </span>
        </div>
      ))}
      
      <div className="pt-2 mt-2 border-t border-gray-200">
        <div
          className={`p-3 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
            selectedCategory === 'All' 
              ? 'bg-blue-50 border-blue-200 border' 
              : 'bg-gray-50 hover:bg-blue-50'
          }`}
          onClick={() => onCategorySelect('All')}
        >
          <div className="flex items-center">
            <Tag size={16} className="text-blue-600" />
            <span className="ml-2 text-sm font-medium text-gray-700">All States</span>
          </div>
          <span className="text-xs font-medium px-2 py-1 bg-white rounded-full text-gray-600 shadow-sm">
            {formatCurrency(Object.values(categories).reduce((sum, amount) => sum + amount, 0))}
          </span>
        </div>
      </div>
    </div>
  );
}