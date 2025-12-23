// src/components/dashboard/DashboardStats.js
"use client";

import { BarChart2, DollarSign, Wallet, TrendingUp, TrendingDown } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";

/**
 * Dashboard Stats Component
 * Displays the primary statistics (earnings, expenses, profit)
 *
 * @param {Object} props Component props
 * @param {Object} props.stats Dashboard statistics
 * @param {boolean} props.isLoading Whether data is loading
 * @param {string} props.dateRange Current date range selection
 */
export default function DashboardStats({ stats, isLoading, dateRange = 'month' }) {
  const { t } = useTranslation('dashboard');

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      {isLoading ? (
        // Skeleton loaders for stats cards
        Array(3).fill(0).map((_, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/10 p-5 border border-gray-200 dark:border-gray-700 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
              <div className="rounded-lg p-3 bg-gray-200 dark:bg-gray-700 h-10 w-10"></div>
            </div>
          </div>
        ))
      ) : (
        <>
          <StatCard
            title={t('stats.totalEarnings')}
            value={formatCurrency(stats.earnings)}
            change={stats.earningsChange}
            positive={stats.earningsPositive}
            icon={<DollarSign size={22} className="text-green-600" />}
            color="green"
            dateRange={dateRange}
          />
          <StatCard
            title={t('stats.totalExpenses')}
            value={formatCurrency(stats.expenses)}
            change={stats.expensesChange}
            positive={stats.expensesPositive}
            icon={<Wallet size={22} className="text-red-600" />}
            color="red"
            dateRange={dateRange}
          />
          <StatCard
            title={t('stats.netProfit')}
            value={formatCurrency(stats.profit)}
            change={stats.profitChange}
            positive={stats.profitPositive}
            icon={<BarChart2 size={22} className="text-blue-600" />}
            color="blue"
            dateRange={dateRange}
          />
        </>
      )}
    </div>
  );
}

/**
 * Stat Card Component
 * Individual statistic card with trend indicator
 */
function StatCard({ title, value, change, positive, icon, color = "blue", dateRange = 'month' }) {
  const { t } = useTranslation('dashboard');

  // Define color classes based on the color prop
  const getColorClasses = () => {
    switch (color) {
      case 'blue':
        return { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400', icon: 'text-blue-500' };
      case 'green':
        return { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-600 dark:text-green-400', icon: 'text-green-500' };
      case 'red':
        return { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-600 dark:text-red-400', icon: 'text-red-500' };
      case 'yellow':
        return { bg: 'bg-yellow-50 dark:bg-yellow-900/20', text: 'text-yellow-600 dark:text-yellow-400', icon: 'text-yellow-500' };
      default:
        return { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400', icon: 'text-blue-500' };
    }
  };

  // Get comparison period text based on date range
  const getComparisonText = () => {
    switch (dateRange) {
      case 'month':
        return t('stats.vsLastMonth');
      case 'lastMonth':
        return t('stats.vsPriorMonth');
      case 'quarter':
        return t('stats.vsLastQuarter');
      case 'year':
        return t('stats.vsLastYear');
      case 'all':
        return t('stats.vsPrior30Days');
      default:
        return t('stats.vsLastMonth');
    }
  };

  const colorClasses = getColorClasses();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/10 p-5 border border-gray-200 dark:border-gray-700 hover:shadow-md dark:hover:shadow-gray-900/20 transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mt-1">{value}</p>
        </div>
        <div className={`rounded-lg p-3 ${colorClasses.bg}`}>
          {icon}
        </div>
      </div>
      {change !== null && (
        <div className="mt-3">
          <p className={`text-sm flex items-center ${positive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {positive ? (
              <TrendingUp size={16} className="mr-1" />
            ) : (
              <TrendingDown size={16} className="mr-1" />
            )}
            <span>{Math.abs(change)}% {getComparisonText()}</span>
          </p>
        </div>
      )}
    </div>
  );
}