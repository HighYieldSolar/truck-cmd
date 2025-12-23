'use client';

import { DollarSign, TrendingUp, Tag, Calendar } from 'lucide-react';
import { useTranslation } from "@/context/LanguageContext";

/**
 * Expense Statistics Cards
 *
 * Displays 4 stat cards in a row matching the Fuel Tracker design:
 * - Total Expenses
 * - Daily Average
 * - Top Category
 * - Total Entries
 */
export default function ExpenseStats({ stats, isLoading, dateRange }) {
  const { t } = useTranslation('expenses');

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value || 0);
  };

  const statCards = [
    {
      title: t('statsLabels.totalExpenses'),
      value: formatCurrency(stats.total),
      icon: <DollarSign size={20} className="text-blue-600 dark:text-blue-400" />,
      color: 'blue'
    },
    {
      title: t('statsLabels.dailyAverage'),
      value: formatCurrency(stats.dailyAverage),
      icon: <TrendingUp size={20} className="text-emerald-600 dark:text-emerald-400" />,
      color: 'green'
    },
    {
      title: t('statsLabels.topCategory'),
      value: stats.topCategory?.name || 'N/A',
      icon: <Tag size={20} className="text-amber-600 dark:text-amber-400" />,
      color: 'yellow',
      subtitle: stats.topCategory ? formatCurrency(stats.topCategory.amount) : null
    },
    {
      title: t('statsLabels.totalEntries'),
      value: `${stats.count?.toLocaleString() || '0'} ${stats.count === 1 ? t('statsLabels.entry') : t('statsLabels.entries')}`,
      icon: <Calendar size={20} className="text-purple-600 dark:text-purple-400" />,
      color: 'purple'
    }
  ];

  // Color classes for each stat type - matching FuelStats exactly
  const colorClasses = {
    blue: {
      border: 'border-l-blue-500 dark:border-l-blue-400',
      iconBg: 'bg-blue-100 dark:bg-blue-900/40'
    },
    green: {
      border: 'border-l-emerald-500 dark:border-l-emerald-400',
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/40'
    },
    yellow: {
      border: 'border-l-amber-500 dark:border-l-amber-400',
      iconBg: 'bg-amber-100 dark:bg-amber-900/40'
    },
    purple: {
      border: 'border-l-purple-500 dark:border-l-purple-400',
      iconBg: 'bg-purple-100 dark:bg-purple-900/40'
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {statCards.map((item, index) => {
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
            <div className="text-xs text-gray-400 dark:text-gray-500 font-medium">
              {item.subtitle || dateRange}
            </div>
          </div>
        );
      })}
    </div>
  );
}
