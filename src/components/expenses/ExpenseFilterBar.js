'use client';

import { useState } from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { useTranslation } from "@/context/LanguageContext";

/**
 * Expense Filter Bar — compact mobile-first version that matches the
 * dashboard's standard filter-bar pattern (search row on top, dropdowns
 * in a 2-col mobile / 3-col desktop grid, filters-active indicator).
 */
export default function ExpenseFilterBar({ filters, setFilters, onReset }) {
  const { t } = useTranslation('expenses');
  const [showCustomDates, setShowCustomDates] = useState(filters.dateRange === 'Custom');

  const handleFilterChange = (name, value) => {
    if (name === 'dateRange' && value === 'Custom') {
      setShowCustomDates(true);
    } else if (name === 'dateRange') {
      setShowCustomDates(false);
    }
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearchChange = (e) => {
    setFilters((prev) => ({ ...prev, search: e.target.value }));
  };

  const handleClearSearch = () => {
    setFilters((prev) => ({ ...prev, search: '' }));
  };

  const inputBase =
    "w-full min-w-0 max-w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent";
  const labelBase = "block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1";

  const hasActiveFilters =
    (filters.category && filters.category !== 'All') ||
    (filters.dateRange && filters.dateRange !== 'All Time') ||
    (filters.search && filters.search.length > 0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 space-y-3">
      {/* Search row */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
        <input
          type="text"
          placeholder={t('filtersExpanded.searchPlaceholder')}
          className={`${inputBase} pl-10 pr-10`}
          value={filters.search}
          onChange={handleSearchChange}
          aria-label={t('filtersExpanded.search')}
        />
        {filters.search && (
          <button
            onClick={handleClearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filter dropdowns — 2-col mobile, 3-col desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
        <div className="min-w-0">
          <label className={labelBase}>{t('filtersExpanded.category')}</label>
          <select
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className={inputBase}
          >
            <option value="All">{t('filtersExpanded.allCategories')}</option>
            <option value="Fuel">{t('categories.fuel')}</option>
            <option value="Maintenance">{t('categories.maintenance')}</option>
            <option value="Insurance">{t('categories.insurance')}</option>
            <option value="Tolls">{t('categories.tolls')}</option>
            <option value="Office">{t('categories.office')}</option>
            <option value="Permits">{t('categories.permits')}</option>
            <option value="Meals">{t('categories.meals')}</option>
            <option value="Other">{t('categories.other')}</option>
          </select>
        </div>

        <div className="min-w-0">
          <label className={labelBase}>{t('filtersExpanded.dateRange')}</label>
          <select
            value={filters.dateRange}
            onChange={(e) => handleFilterChange('dateRange', e.target.value)}
            className={inputBase}
          >
            <option value="All Time">{t('filtersExpanded.allTime')}</option>
            <option value="This Month">{t('filtersExpanded.thisMonth')}</option>
            <option value="Last Month">{t('filtersExpanded.lastMonth')}</option>
            <option value="This Quarter">{t('filtersExpanded.thisQuarter')}</option>
            <option value="Last Quarter">{t('filtersExpanded.lastQuarter')}</option>
            <option value="This Year">{t('filtersExpanded.thisYear')}</option>
            <option value="Custom">{t('filtersExpanded.customRange')}</option>
          </select>
        </div>

        <div className="min-w-0 col-span-2 sm:col-span-1">
          <label className={labelBase}>{t('filtersExpanded.sortBy')}</label>
          <select
            value={filters.sortBy}
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            className={inputBase}
          >
            <option value="date">{t('filtersExpanded.sortDate')}</option>
            <option value="amount">{t('filtersExpanded.sortAmount')}</option>
            <option value="category">{t('filtersExpanded.sortCategory')}</option>
          </select>
        </div>
      </div>

      {/* Custom date range — appears only when "Custom" is selected */}
      {showCustomDates && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="min-w-0">
            <label className={labelBase}>{t('filtersExpanded.startDate')}</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className={inputBase}
            />
          </div>
          <div className="min-w-0">
            <label className={labelBase}>{t('filtersExpanded.endDate')}</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className={inputBase}
            />
          </div>
        </div>
      )}

      {hasActiveFilters && (
        <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
          <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <SlidersHorizontal className="h-3 w-3" />
            Filters active
          </span>
          <button
            onClick={onReset}
            className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <X className="h-4 w-4" />
            <span>{t('filtersExpanded.resetFilters')}</span>
          </button>
        </div>
      )}
    </div>
  );
}
