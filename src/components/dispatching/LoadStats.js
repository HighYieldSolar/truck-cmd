// src/components/dispatching/LoadStats.js
"use client";

import { Package, Truck, Clock, CheckCircle, DollarSign } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";

export default function LoadStats({ stats, isLoading = false, period = "All Time", className = "" }) {
  const { t } = useTranslation('dispatching');
  // Helper function to format currency
  const formatCurrency = (value) => {
    if (value === undefined || value === null || isNaN(value)) return '$0';
    return '$' + parseFloat(value).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };

  const statsItems = [
    {
      title: t('stats.totalLoads'),
      value: stats.totalLoads || 0,
      icon: <Package size={20} className="text-blue-600 dark:text-blue-400" />,
      color: "blue"
    },
    {
      title: t('stats.activeLoads'),
      value: stats.activeLoads || 0,
      icon: <Truck size={20} className="text-amber-600 dark:text-amber-400" />,
      color: "yellow"
    },
    {
      title: t('stats.completedLoads'),
      value: stats.completedLoads || 0,
      icon: <CheckCircle size={20} className="text-emerald-600 dark:text-emerald-400" />,
      color: "green"
    },
    {
      title: t('stats.totalRevenue'),
      value: formatCurrency(stats.totalRevenue),
      icon: <DollarSign size={20} className="text-purple-600 dark:text-purple-400" />,
      color: "purple"
    }
  ];

  if (isLoading) {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 ${className}`}>
        {Array(4).fill(0).map((_, idx) => (
          <div key={idx} className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 animate-pulse">
            <div className="flex items-center justify-between mb-3">
              <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-10 w-10 rounded-lg bg-gray-200 dark:bg-gray-700"></div>
            </div>
            <div className="flex items-baseline mb-2">
              <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Color classes for each stat type - with dark mode support
  const colorClasses = {
    yellow: {
      border: 'border-l-amber-500 dark:border-l-amber-400',
      iconBg: 'bg-amber-100 dark:bg-amber-900/40'
    },
    green: {
      border: 'border-l-emerald-500 dark:border-l-emerald-400',
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/40'
    },
    blue: {
      border: 'border-l-blue-500 dark:border-l-blue-400',
      iconBg: 'bg-blue-100 dark:bg-blue-900/40'
    },
    purple: {
      border: 'border-l-purple-500 dark:border-l-purple-400',
      iconBg: 'bg-purple-100 dark:bg-purple-900/40'
    }
  };

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 ${className}`}>
      {statsItems.map((item, index) => {
        const colors = colorClasses[item.color] || colorClasses.blue;
        return (
          <div
            key={index}
            className={`bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 border-l-4 ${colors.border} hover:shadow-md transition-all duration-200`}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">{item.title}</h3>
              <div className={`${colors.iconBg} p-2.5 rounded-xl`}>
                {item.icon}
              </div>
            </div>
            <div className="flex items-baseline mb-1">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{item.value}</h2>
            </div>
            <div className="text-xs text-gray-400 dark:text-gray-500 font-medium">{period}</div>
          </div>
        );
      })}
    </div>
  );
}
