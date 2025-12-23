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

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 transition-colors duration-200">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search Input */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder={t('filters.searchPlaceholder')}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-colors"
            value={filters.search}
            onChange={handleSearchChange}
          />
        </div>

        {/* Filter Dropdowns Row */}
        <div className="flex flex-wrap gap-3">
          {/* Status Filter */}
          <select
            name="status"
            className="px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent min-w-[130px] transition-colors"
            value={filters.status}
            onChange={handleFilterChange}
          >
            <option value="all">{t('filters.allStatus')}</option>
            <option value="active">{t('status.active')}</option>
            <option value="inactive">{t('status.inactive')}</option>
            <option value="pending">{t('status.pending')}</option>
          </select>

          {/* Type Filter */}
          <select
            name="type"
            className="px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent min-w-[140px] transition-colors"
            value={filters.type}
            onChange={handleFilterChange}
          >
            <option value="all">{t('filters.allTypes')}</option>
            <option value="shipper">{t('types.shipper')}</option>
            <option value="broker">{t('types.broker')}</option>
            <option value="consignee">{t('types.consignee')}</option>
            <option value="direct">{t('filters.directCustomer')}</option>
            <option value="freight-forwarder">{t('filters.freightForwarder')}</option>
            <option value="3pl">{t('types.thirdPartyLogistics')}</option>
            <option value="business">{t('types.business')}</option>
          </select>

          {/* State Filter */}
          {availableStates.length > 0 && (
            <select
              name="state"
              className="px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent min-w-[130px] transition-colors"
              value={filters.state}
              onChange={handleFilterChange}
            >
              <option value="all">{t('filters.allStates')}</option>
              {availableStates.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          )}

          {/* Sort By */}
          <select
            name="sortBy"
            className="px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent min-w-[140px] transition-colors"
            value={filters.sortBy}
            onChange={handleFilterChange}
          >
            <option value="name">{t('filters.sortName')}</option>
            <option value="newest">{t('filters.sortNewest')}</option>
            <option value="oldest">{t('filters.sortOldest')}</option>
            <option value="type">{t('filters.sortType')}</option>
          </select>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={onReset}
              className="px-3 py-2.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-1"
              title={t('filters.clearFilters')}
            >
              <X className="h-4 w-4" />
              <span className="hidden sm:inline text-sm">{t('filters.clear')}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
