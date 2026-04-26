// src/components/expenses/ExpenseFilters.js
"use client";

import { useState } from "react";
import { Search, RefreshCw, Filter } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";

export default function ExpenseFilters({
  filters,
  onSearchChange,
  onFilterChange,
  onDateRangeChange,
  onCustomDateChange,
  onResetFilters
}) {
  const { t } = useTranslation('expenses');
  const [showCustomDates, setShowCustomDates] = useState(filters.dateRange === "Custom");

  const handleDateRangeChange = (e) => {
    const { value } = e.target;
    if (value === "Custom") {
      setShowCustomDates(true);
    } else {
      setShowCustomDates(false);
      onDateRangeChange(value);
    }
  };

  const handleStartDateChange = (e) => onCustomDateChange(e.target.value, filters.endDate);
  const handleEndDateChange = (e) => onCustomDateChange(filters.startDate, e.target.value);

  const inputBase =
    "w-full min-w-0 max-w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500";
  const labelBase = "block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1";

  const hasActiveFilters =
    (filters.category && filters.category !== 'All') ||
    (filters.dateRange && filters.dateRange !== 'All Time') ||
    (filters.search && filters.search.length > 0);

  return (
    <div className="space-y-3">
      {/* Search row — full width on mobile, primary affordance */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={16} className="text-gray-400 dark:text-gray-500" />
        </div>
        <input
          type="text"
          value={filters.search}
          onChange={onSearchChange}
          placeholder={t('filtersExpanded.searchPlaceholder')}
          className={`${inputBase} pl-10`}
          aria-label={t('filtersExpanded.search')}
        />
      </div>

      {/* Filter dropdowns row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="min-w-0">
          <label className={labelBase}>{t('filtersExpanded.category')}</label>
          <select
            name="category"
            value={filters.category}
            onChange={onFilterChange}
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
            name="dateRange"
            value={filters.dateRange}
            onChange={handleDateRangeChange}
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

        <div className="min-w-0">
          <label className={labelBase}>{t('filtersExpanded.sortBy')}</label>
          <select
            name="sortBy"
            value={filters.sortBy}
            onChange={onFilterChange}
            className={inputBase}
          >
            <option value="date">{t('filtersExpanded.sortDate')}</option>
            <option value="amount">{t('filtersExpanded.sortAmount')}</option>
            <option value="category">{t('filtersExpanded.sortCategory')}</option>
            <option value="description">{t('filtersExpanded.sortDescription')}</option>
          </select>
        </div>
      </div>

      {/* Custom date range — appears when "Custom" is selected */}
      {showCustomDates && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="min-w-0">
            <label className={labelBase}>{t('filtersExpanded.startDate')}</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={handleStartDateChange}
              className={inputBase}
            />
          </div>
          <div className="min-w-0">
            <label className={labelBase}>{t('filtersExpanded.endDate')}</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={handleEndDateChange}
              className={inputBase}
            />
          </div>
        </div>
      )}

      {/* Active filters badge + reset */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
          <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <Filter size={12} />
            Filters active
          </span>
          <button
            onClick={onResetFilters}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <RefreshCw size={14} className="mr-1.5" />
            {t('filtersExpanded.resetFilters')}
          </button>
        </div>
      )}
    </div>
  );
}
