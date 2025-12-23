// src/components/dashboard/EarningsBreakdown.js
"use client";

import { BarChart2, FileText, Truck, DollarSign } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";

/**
 * Earnings Breakdown Component
 * Shows the distribution of earnings between completed loads (factored/invoiced) and standalone invoices
 *
 * @param {Object} props Component props
 * @param {Object} props.stats Dashboard statistics containing earnings data
 */
export default function EarningsBreakdown({ stats }) {
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

  // Calculate total earnings from all sources
  const totalLoadEarnings = stats.loadEarnings || 0;
  const standaloneInvoiceEarnings = stats.standaloneInvoiceEarnings || 0;
  const factoredEarnings = stats.factoredEarnings || 0;
  const invoicedLoadEarnings = stats.invoicedLoadEarnings || 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/10 mb-6 p-5 border border-gray-200 dark:border-gray-700 transition-colors duration-200">
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center">
        <BarChart2 size={20} className="mr-2 text-blue-500 dark:text-blue-400" />
        {t('earningsBreakdown.title')}
      </h3>

      {/* Main earnings sources */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('earningsBreakdown.factoredLoads')}</p>
            <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(factoredEarnings)}</p>
          </div>
          <Truck size={22} className="text-green-600 dark:text-green-400" />
        </div>
        <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('earningsBreakdown.invoicedLoads')}</p>
            <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(invoicedLoadEarnings)}</p>
          </div>
          <FileText size={22} className="text-blue-600 dark:text-blue-400" />
        </div>
      </div>

      {/* Standalone invoices if any */}
      {standaloneInvoiceEarnings > 0 && (
        <div className="flex justify-between items-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg mb-4">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('earningsBreakdown.otherInvoicePayments')}</p>
            <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(standaloneInvoiceEarnings)}</p>
          </div>
          <DollarSign size={22} className="text-purple-600 dark:text-purple-400" />
        </div>
      )}

      {/* Progress bar visualization */}
      {stats.earnings > 0 && (
        <div className="mt-4">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('earningsBreakdown.earningsDistribution')}</p>
          <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 float-left"
              style={{ width: `${(factoredEarnings / stats.earnings) * 100}%` }}
              title={`${t('earningsBreakdown.factoredLoads')}: ${formatCurrency(factoredEarnings)}`}
            ></div>
            <div
              className="h-full bg-blue-500 float-left"
              style={{ width: `${(invoicedLoadEarnings / stats.earnings) * 100}%` }}
              title={`${t('earningsBreakdown.invoicedLoads')}: ${formatCurrency(invoicedLoadEarnings)}`}
            ></div>
            {standaloneInvoiceEarnings > 0 && (
              <div
                className="h-full bg-purple-500 float-left"
                style={{ width: `${(standaloneInvoiceEarnings / stats.earnings) * 100}%` }}
                title={`${t('earningsBreakdown.otherInvoicePayments')}: ${formatCurrency(standaloneInvoiceEarnings)}`}
              ></div>
            )}
          </div>
          <div className="flex flex-wrap justify-between mt-1 text-xs text-gray-500 dark:text-gray-400 gap-2">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
              <span>{t('earningsBreakdown.factored')} ({stats.earnings > 0 ? Math.round((factoredEarnings / stats.earnings) * 100) : 0}%)</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-1"></div>
              <span>{t('earningsBreakdown.invoiced')} ({stats.earnings > 0 ? Math.round((invoicedLoadEarnings / stats.earnings) * 100) : 0}%)</span>
            </div>
            {standaloneInvoiceEarnings > 0 && (
              <div className="flex items-center">
                <div className="w-3 h-3 bg-purple-500 rounded-full mr-1"></div>
                <span>{t('earningsBreakdown.other')} ({stats.earnings > 0 ? Math.round((standaloneInvoiceEarnings / stats.earnings) * 100) : 0}%)</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}