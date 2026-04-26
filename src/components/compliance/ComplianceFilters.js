"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import { COMPLIANCE_TYPES } from "@/lib/constants/complianceConstants";
import { useTranslation } from "@/context/LanguageContext";

export default function ComplianceFilters({ filters, onFilterChange, onSearch, onReset }) {
  const { t } = useTranslation('compliance');

  const inputBase =
    "w-full min-w-0 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent";
  const labelBase = "block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1";

  const hasActiveFilters =
    (filters.status && filters.status !== 'all') ||
    (filters.type && filters.type !== 'all') ||
    (filters.entity && filters.entity !== 'all') ||
    (filters.search && filters.search.length > 0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 space-y-3">
      {/* Search prominent on top */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={16} className="text-gray-400 dark:text-gray-500" />
        </div>
        <input
          type="text"
          value={filters.search}
          onChange={onSearch}
          className={`${inputBase} pl-10`}
          placeholder={t('placeholders.searchRecords')}
          aria-label={t('filters.search')}
        />
      </div>

      {/* Compact dropdowns row — 2 cols mobile, 3 cols desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
        <div className="min-w-0">
          <label className={labelBase}>{t('filters.status')}</label>
          <select name="status" value={filters.status} onChange={onFilterChange} className={inputBase}>
            <option value="all">{t('filters.allStatuses')}</option>
            <option value="active">{t('status.active')}</option>
            <option value="expiring soon">{t('status.expiringSoon')}</option>
            <option value="expired">{t('status.expired')}</option>
            <option value="pending">{t('status.pending')}</option>
          </select>
        </div>

        <div className="min-w-0">
          <label className={labelBase}>{t('filters.type')}</label>
          <select name="type" value={filters.type} onChange={onFilterChange} className={inputBase}>
            <option value="all">{t('filters.allTypes')}</option>
            {Object.entries(COMPLIANCE_TYPES).map(([key, type]) => (
              <option key={key} value={key}>{type.name}</option>
            ))}
          </select>
        </div>

        <div className="min-w-0 col-span-2 sm:col-span-1">
          <label className={labelBase}>{t('filters.entity')}</label>
          <select name="entity" value={filters.entity} onChange={onFilterChange} className={inputBase}>
            <option value="all">{t('filters.allEntities')}</option>
            <option value="Vehicle">{t('filters.vehicles')}</option>
            <option value="Driver">{t('filters.drivers')}</option>
            <option value="Company">{t('entityTypes.company')}</option>
            <option value="Other">{t('entityTypes.other')}</option>
          </select>
        </div>
      </div>

      {hasActiveFilters && onReset && (
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
            <span>{t('common:buttons.clear', { defaultValue: 'Clear' })}</span>
          </button>
        </div>
      )}
    </div>
  );
}
