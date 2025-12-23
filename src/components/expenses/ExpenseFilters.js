// src/components/expenses/ExpenseFilters.js
"use client";

import { useState } from "react";
import { Search, RefreshCw } from "lucide-react";
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

  // Handle date range changes
  const handleDateRangeChange = (e) => {
    const { value } = e.target;
    if (value === "Custom") {
      setShowCustomDates(true);
    } else {
      setShowCustomDates(false);
      onDateRangeChange(value);
    }
  };

  // Handle start date change
  const handleStartDateChange = (e) => {
    const startDate = e.target.value;
    onCustomDateChange(startDate, filters.endDate);
  };

  // Handle end date change
  const handleEndDateChange = (e) => {
    const endDate = e.target.value;
    onCustomDateChange(filters.startDate, endDate);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="md:col-span-1">
        <label className="block text-sm font-medium text-gray-700 mb-1">{t('filtersExpanded.category')}</label>
        <select
          name="category"
          value={filters.category}
          onChange={onFilterChange}
          className="block w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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

      <div className="md:col-span-1">
        <label className="block text-sm font-medium text-gray-700 mb-1">{t('filtersExpanded.dateRange')}</label>
        <select
          name="dateRange"
          value={filters.dateRange}
          onChange={handleDateRangeChange}
          className="block w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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

      <div className="md:col-span-1">
        <label className="block text-sm font-medium text-gray-700 mb-1">{t('filtersExpanded.sortBy')}</label>
        <select
          name="sortBy"
          value={filters.sortBy}
          onChange={onFilterChange}
          className="block w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="date">{t('filtersExpanded.sortDate')}</option>
          <option value="amount">{t('filtersExpanded.sortAmount')}</option>
          <option value="category">{t('filtersExpanded.sortCategory')}</option>
          <option value="description">{t('filtersExpanded.sortDescription')}</option>
        </select>
      </div>

      <div className="md:col-span-1">
        <label className="block text-sm font-medium text-gray-700 mb-1">{t('filtersExpanded.search')}</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-gray-400" />
          </div>
          <input
            type="text"
            value={filters.search}
            onChange={onSearchChange}
            placeholder={t('filtersExpanded.searchPlaceholder')}
            className="block w-full pl-10 rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Custom date range fields */}
      {showCustomDates && (
        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('filtersExpanded.startDate')}</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={handleStartDateChange}
              className="block w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('filtersExpanded.endDate')}</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={handleEndDateChange}
              className="block w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      <div className="md:col-span-2 md:col-start-3 mt-4 flex justify-end">
        <button
          onClick={onResetFilters}
          className="flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
        >
          <RefreshCw size={16} className="mr-2" />
          {t('filtersExpanded.resetFilters')}
        </button>
      </div>
    </div>
  );
}