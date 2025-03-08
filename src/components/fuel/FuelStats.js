"use client";

import { Fuel, DollarSign, Flag, RefreshCw } from "lucide-react";

export default function FuelStats({ stats, isLoading = false, period = "This Quarter" }) {
  // Helper function to format numbers
  const formatNumber = (value, decimals = 0) => {
    if (value === undefined || value === null) return '0';
    return parseFloat(value).toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };
  
  const statsItems = [
    {
      title: "Total Gallons",
      value: `${formatNumber(stats.totalGallons, 3)} gal`,
      icon: <Fuel size={20} className="text-yellow-600" />,
      color: "yellow"
    },
    {
      title: "Total Spent",
      value: `$${formatNumber(stats.totalAmount, 2)}`,
      icon: <DollarSign size={20} className="text-green-600" />,
      color: "green"
    },
    {
      title: "Average Price",
      value: `$${formatNumber(stats.avgPricePerGallon, 3)}/gal`,
      icon: <DollarSign size={20} className="text-blue-600" />,
      color: "blue"
    },
    {
      title: "States",
      value: `${stats.uniqueStates} ${stats.uniqueStates === 1 ? 'state' : 'states'}`,
      icon: <Flag size={20} className="text-purple-600" />,
      color: "purple"
    }
  ];
  
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {Array(4).fill(0).map((_, idx) => (
          <div key={idx} className="bg-white p-5 rounded-lg shadow-md animate-pulse">
            <div className="flex items-center justify-between mb-3">
              <div className="h-3 w-24 bg-gray-200 rounded"></div>
              <div className="h-10 w-10 rounded-lg bg-gray-200"></div>
            </div>
            <div className="flex items-baseline mb-2">
              <div className="h-6 w-24 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {statsItems.map((item, index) => (
        <div key={index} className="bg-white p-5 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-gray-500 text-sm font-medium">{item.title}</h3>
            <div className={`bg-${item.color}-100 p-2 rounded-lg`}>
              {item.icon}
            </div>
          </div>
          <div className="flex items-baseline mb-2">
            <h2 className="text-2xl font-bold">{item.value}</h2>
          </div>
          <div className="text-sm text-gray-500">{period}</div>
        </div>
      ))}
    </div>
  );
}