"use client";

import { Download, Flag, Fuel, DollarSign, Hash } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";

export default function StateSummary({ fuelData = [], onExportForIFTA }) {
  const { t } = useTranslation('fuel');
  // Group and calculate fuel by state
  const stateData = fuelData.reduce((acc, entry) => {
    if (!acc[entry.state]) {
      acc[entry.state] = {
        state: entry.state,
        state_name: entry.state_name,
        gallons: 0,
        amount: 0,
        purchases: 0
      };
    }

    acc[entry.state].gallons += entry.gallons;
    acc[entry.state].amount += entry.total_amount;
    acc[entry.state].purchases += 1;

    return acc;
  }, {});

  // Convert to array and sort by gallons (descending)
  const stateArray = Object.values(stateData).sort((a, b) => b.gallons - a.gallons);

  // Calculate totals for mobile view
  const totals = {
    gallons: stateArray.reduce((sum, state) => sum + state.gallons, 0),
    amount: stateArray.reduce((sum, state) => sum + state.amount, 0),
    purchases: stateArray.reduce((sum, state) => sum + state.purchases, 0)
  };
  totals.avgPrice = totals.gallons > 0 ? totals.amount / totals.gallons : 0;

  if (stateArray.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/40 rounded-full mb-4">
          <Flag size={24} className="text-blue-600 dark:text-blue-400" />
        </div>
        <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-gray-100">{t('stateSummaryTable.noData')}</h3>
        <p className="text-gray-500 dark:text-gray-400">{t('stateSummaryTable.noDataDescription')}</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="px-4 xl:px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h3 className="text-base xl:text-lg font-medium text-gray-900 dark:text-gray-100">{t('stateSummaryTable.title')}</h3>
        {onExportForIFTA && (
          <button
            onClick={onExportForIFTA}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center"
          >
            <Download size={14} className="mr-1" />
            {t('stateSummaryTable.viewIFTA')}
          </button>
        )}
      </div>

      {/* Mobile/Tablet Card View */}
      <div className="xl:hidden p-4 space-y-3">
        {stateArray.map((state) => (
          <div
            key={state.state}
            className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 border border-gray-200 dark:border-gray-600"
          >
            {/* State Name Header */}
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200 dark:border-gray-600">
              <Flag size={16} className="text-blue-500 dark:text-blue-400 flex-shrink-0" />
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {state.state_name} ({state.state})
              </span>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{t('stateSummaryTable.gallons')}</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {state.gallons.toFixed(3)} gal
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{t('stateSummaryTable.amount')}</p>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">
                  ${state.amount.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{t('stateSummaryTable.purchases')}</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {state.purchases}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{t('stateSummaryTable.avgPricePerGal')}</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  ${(state.amount / state.gallons).toFixed(3)}
                </p>
              </div>
            </div>
          </div>
        ))}

        {/* Mobile Totals Card */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-blue-200 dark:border-blue-700">
            <span className="font-semibold text-blue-900 dark:text-blue-100">
              {t('stateSummaryTable.total')} ({stateArray.length} {stateArray.length === 1 ? 'state' : 'states'})
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-blue-600 dark:text-blue-400 mb-0.5">{t('stateSummaryTable.gallons')}</p>
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                {totals.gallons.toFixed(3)} gal
              </p>
            </div>
            <div>
              <p className="text-xs text-blue-600 dark:text-blue-400 mb-0.5">{t('stateSummaryTable.amount')}</p>
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                ${totals.amount.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-blue-600 dark:text-blue-400 mb-0.5">{t('stateSummaryTable.purchases')}</p>
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                {totals.purchases}
              </p>
            </div>
            <div>
              <p className="text-xs text-blue-600 dark:text-blue-400 mb-0.5">{t('stateSummaryTable.avgPricePerGal')}</p>
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                ${totals.avgPrice.toFixed(3)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden xl:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('stateSummaryTable.state')}
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('stateSummaryTable.gallons')}
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('stateSummaryTable.amount')}
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('stateSummaryTable.purchases')}
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('stateSummaryTable.avgPricePerGal')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {stateArray.map((state) => (
              <tr key={state.state} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Flag size={16} className="text-gray-400 dark:text-gray-500 mr-2" />
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {state.state_name} ({state.state})
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-gray-100">{state.gallons.toFixed(3)} gal</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-gray-100">${state.amount.toFixed(2)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-gray-100">{state.purchases}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-gray-100">
                    ${(state.amount / state.gallons).toFixed(3)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                {t('stateSummaryTable.total')} ({t('stateSummaryTable.statesCount', { count: stateArray.length })})
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                {totals.gallons.toFixed(3)} gal
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                ${totals.amount.toFixed(2)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                {totals.purchases}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                ${totals.avgPrice.toFixed(3)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}