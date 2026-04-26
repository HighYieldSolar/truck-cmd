"use client";

import { Search, X, SlidersHorizontal } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";

/**
 * Customer Filter Bar
 * Follows the FuelFilterBar design pattern with search and dropdowns
 */
export default function CustomerFilterBar({
  filters,
  setFilters,
  availableStates = [],
  onReset
}) {
  const { t } = useTranslation('customers');
  const handleSearchChange = (e) => {
    setFilters(prev => ({ ...prev, search: e.target.value }));
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const hasActiveFilters =
    filters.search ||
    filters.status !== 'all' ||
    filters.type !== 'all' ||
    filters.state !== 'all' ||
    filters.sortBy !== 'name';

  const selectClass = "w-full min-w-0 px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-colors";

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 space-y-3 transition-colors duration-200">
      {/* Search row */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
        <input
          type="text"
          placeholder={t('filters.searchPlaceholder')}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-colors"
          value={filters.search}
          onChange={handleSearchChange}
        />
      </div>

      {/* Filter dropdowns — 2-col grid on mobile, 4-col on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <select name="status" value={filters.status} onChange={handleFilterChange} className={selectClass} aria-label={t('filters.allStatus')}>
          <option value="all">{t('filters.allStatus')}</option>
          <option value="active">{t('status.active')}</option>
          <option value="inactive">{t('status.inactive')}</option>
          <option value="pending">{t('status.pending')}</option>
        </select>

        <select name="type" value={filters.type} onChange={handleFilterChange} className={selectClass} aria-label={t('filters.allTypes')}>
          <option value="all">{t('filters.allTypes')}</option>
          <option value="shipper">{t('types.shipper')}</option>
          <option value="broker">{t('types.broker')}</option>
          <option value="consignee">{t('types.consignee')}</option>
          <option value="direct">{t('filters.directCustomer')}</option>
          <option value="freight-forwarder">{t('filters.freightForwarder')}</option>
          <option value="3pl">{t('types.thirdPartyLogistics')}</option>
          <option value="business">{t('types.business')}</option>
        </select>

        {availableStates.length > 0 ? (
          <select name="state" value={filters.state} onChange={handleFilterChange} className={selectClass} aria-label={t('filters.allStates')}>
            <option value="all">{t('filters.allStates')}</option>
            {availableStates.map(state => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>
        ) : (
          <div className="hidden lg:block" />
        )}

        <select name="sortBy" value={filters.sortBy} onChange={handleFilterChange} className={selectClass} aria-label={t('filters.sortName')}>
          <option value="name">{t('filters.sortName')}</option>
          <option value="newest">{t('filters.sortNewest')}</option>
          <option value="oldest">{t('filters.sortOldest')}</option>
          <option value="type">{t('filters.sortType')}</option>
        </select>
      </div>

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
            <span>{t('filters.clear')}</span>
          </button>
        </div>
      )}
    </div>
  );
}
