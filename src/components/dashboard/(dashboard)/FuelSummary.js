// src/components/dashboard/FuelSummary.js
"use client";

import Link from "next/link";
import { Fuel, Plus } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";

/**
 * Fuel Summary Component
 * Displays fuel statistics in a card on the dashboard
 *
 * @param {Object} props Component props
 * @param {Object} props.stats Fuel statistics
 */
export default function FuelSummary({ stats = {} }) {
  const { t } = useTranslation('dashboard');
  const totalGallons = stats.totalGallons || 0;
  const totalAmount = stats.totalAmount || 0;
  const avgPricePerGallon = stats.avgPricePerGallon || 0;
  const uniqueStates = stats.uniqueStates || 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/10 overflow-hidden border border-gray-200 dark:border-gray-700 transition-colors duration-200">
      <div className="bg-yellow-500 dark:bg-yellow-600 px-5 py-4 text-white">
        <h3 className="font-semibold flex items-center">
          <Fuel size={18} className="mr-2" />
          {t('fuel.title')}
        </h3>
      </div>
      <div className="p-5">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t('fuel.totalGallons')}</div>
            <div className="text-gray-900 dark:text-gray-100 text-2xl font-semibold">{totalGallons.toFixed(1)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t('fuel.totalSpent')}</div>
            <div className="text-gray-900 dark:text-gray-100 text-2xl font-semibold">${totalAmount.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t('fuel.avgPricePerGallon')}</div>
            <div className="text-gray-900 dark:text-gray-100 text-2xl font-semibold">${avgPricePerGallon.toFixed(3)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t('fuel.uniqueStates')}</div>
            <div className="text-gray-900 dark:text-gray-100 text-2xl font-semibold">{uniqueStates}</div>
          </div>
        </div>
        <Link
          href="/dashboard/fuel"
          className="flex items-center justify-center w-full px-4 py-2 bg-yellow-500 dark:bg-yellow-600 text-white rounded-lg hover:bg-yellow-600 dark:hover:bg-yellow-700 transition-colors"
        >
          <Plus size={16} className="mr-2" />
          {t('fuel.addFuelPurchase')}
        </Link>
      </div>
    </div>
  );
}