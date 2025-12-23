// src/components/dispatching/TopLoads.js
"use client";

import { DollarSign, MapPin, ArrowRight, TrendingUp } from "lucide-react";
import StatusBadge from "./StatusBadge";
import { useTranslation } from "@/context/LanguageContext";

export default function TopLoads({ loads = [], isLoading = false, onSelectLoad, className = "" }) {
  const { t } = useTranslation('dispatching');
  // Get top 5 loads by rate
  const topLoads = [...loads]
    .sort((a, b) => (b.rate || 0) - (a.rate || 0))
    .slice(0, 5);

  // Format currency
  const formatCurrency = (amount) => {
    return '$' + parseFloat(amount || 0).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };

  if (isLoading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="h-5 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                <div className="flex-1">
                  <div className="h-4 w-24 bg-gray-200 dark:bg-gray-600 rounded mb-2"></div>
                  <div className="h-3 w-32 bg-gray-200 dark:bg-gray-600 rounded"></div>
                </div>
                <div className="h-5 w-16 bg-gray-200 dark:bg-gray-600 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t('topLoads.title')}</h3>
        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg">
          <TrendingUp size={16} className="text-emerald-600 dark:text-emerald-400" />
        </div>
      </div>

      {topLoads.length === 0 ? (
        <div className="text-center py-6">
          <DollarSign size={24} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('emptyState.title')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {topLoads.map((load, index) => (
            <button
              key={load.id}
              onClick={() => onSelectLoad && onSelectLoad(load)}
              className="w-full text-left p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center mb-1">
                    <span className="text-xs font-bold text-gray-400 dark:text-gray-500 mr-2">
                      #{index + 1}
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                      {load.loadNumber || load.load_number}
                    </span>
                  </div>
                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                    <MapPin size={10} className="text-emerald-500 dark:text-emerald-400 mr-1 flex-shrink-0" />
                    <span className="truncate max-w-[60px]">{load.origin?.split(',')[0]}</span>
                    <ArrowRight size={10} className="mx-1 flex-shrink-0" />
                    <MapPin size={10} className="text-red-500 dark:text-red-400 mr-1 flex-shrink-0" />
                    <span className="truncate max-w-[60px]">{load.destination?.split(',')[0]}</span>
                  </div>
                </div>
                <div className="ml-2 text-right">
                  <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(load.rate)}
                  </div>
                  <StatusBadge status={load.status} size="sm" className="mt-1" />
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
