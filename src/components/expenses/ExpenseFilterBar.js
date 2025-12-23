'use client';

import { useState } from 'react';
import { Search, X, Filter, ChevronDown } from 'lucide-react';
import { useTranslation } from "@/context/LanguageContext";

/**
 * Expense Filter Bar Component
 *
 * Provides search and filtering controls for expenses
 * following the design spec filter bar pattern.
 */
export default function ExpenseFilterBar({ filters, setFilters, onReset }) {
  const { t } = useTranslation('expenses');
  const [showCustomDates, setShowCustomDates] = useState(filters.dateRange === 'Custom');

  // Handle filter changes
  const handleFilterChange = (name, value) => {
    if (name === 'dateRange' && value === 'Custom') {
      setShowCustomDates(true);
    } else if (name === 'dateRange') {
      setShowCustomDates(false);
    }

    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle search change
  const handleSearchChange = (e) => {
    setFilters(prev => ({
      ...prev,
      search: e.target.value
    }));
  };

  // Clear search
  const handleClearSearch = () => {
    setFilters(prev => ({
      ...prev,
      search: ''
    }));
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 transition-colors duration-200">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search Input */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder={t('filtersExpanded.searchPlaceholder')}
            className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-colors"
            value={filters.search}
            onChange={handleSearchChange}
          />
          {filters.search && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter Dropdowns Row */}
        <div className="flex flex-wrap gap-3">
          {/* Category Filter */}
          <select
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 min-w-[150px] transition-colors"
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
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

          {/* Date Range Filter */}
          <select
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 min-w-[140px] transition-colors"
            value={filters.dateRange}
            onChange={(e) => handleFilterChange('dateRange', e.target.value)}
          >
            <option value="All Time">{t('filtersExpanded.allTime')}</option>
            <option value="This Month">{t('filtersExpanded.thisMonth')}</option>
            <option value="Last Month">{t('filtersExpanded.lastMonth')}</option>
            <option value="This Quarter">{t('filtersExpanded.thisQuarter')}</option>
            <option value="Last Quarter">{t('filtersExpanded.lastQuarter')}</option>
            <option value="This Year">{t('filtersExpanded.thisYear')}</option>
            <option value="Custom">{t('filtersExpanded.customRange')}</option>
          </select>

          {/* Sort By Filter */}
          <select
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 min-w-[120px] transition-colors"
            value={filters.sortBy}
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
          >
            <option value="date">{t('filtersExpanded.sortDate')}</option>
            <option value="amount">{t('filtersExpanded.sortAmount')}</option>
            <option value="category">{t('filtersExpanded.sortCategory')}</option>
          </select>

          {/* Reset Filters Button */}
          <button
            onClick={onReset}
            className="px-3 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title={t('filtersExpanded.resetFilters')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Custom Date Range Fields */}
      {showCustomDates && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('filtersExpanded.startDate')}
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('filtersExpanded.endDate')}
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
