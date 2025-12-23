// src/components/dispatching/LoadFilterBar.js
"use client";

import { useState } from "react";
import { Search, Filter, Calendar, Truck, Users, X, RefreshCw, SlidersHorizontal } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";

export default function LoadFilterBar({
  filters,
  setFilters,
  drivers = [],
  vehicles = [],
  onReset,
  className = ""
}) {
  const { t } = useTranslation('dispatching');
  const [expanded, setExpanded] = useState(false);

  const statusOptions = [
    { value: "All", label: t('filterBar.allStatus') },
    { value: "Pending", label: t('statusLabels.pending') },
    { value: "Assigned", label: t('statusLabels.assigned') },
    { value: "In Transit", label: t('statusLabels.inTransit') },
    { value: "Loading", label: t('statusLabels.loading') },
    { value: "Unloading", label: t('statusLabels.unloading') },
    { value: "Delivered", label: t('statusLabels.delivered') },
    { value: "Completed", label: t('statusLabels.completed') },
    { value: "Cancelled", label: t('statusLabels.cancelled') },
    { value: "Delayed", label: t('statusLabels.delayed') }
  ];

  const dateRangeOptions = [
    { value: "all", label: t('filterBar.dateRanges.all') },
    { value: "today", label: t('filterBar.dateRanges.today') },
    { value: "tomorrow", label: t('filterBar.dateRanges.tomorrow') },
    { value: "thisWeek", label: t('filterBar.dateRanges.thisWeek') },
    { value: "lastWeek", label: t('filterBar.dateRanges.lastWeek') },
    { value: "thisMonth", label: t('filterBar.dateRanges.thisMonth') },
    { value: "lastMonth", label: t('filterBar.dateRanges.lastMonth') },
    { value: "thisQuarter", label: t('filterBar.dateRanges.thisQuarter') },
    { value: "lastQuarter", label: t('filterBar.dateRanges.lastQuarter') },
    { value: "Custom", label: t('common:time.dateRange') }
  ];

  const sortOptions = [
    { value: "created_at", label: t('common:time.allTime') },
    { value: "deliveryDate", label: t('filterBar.sortOptions.deliveryDate') },
    { value: "pickupDate", label: t('filterBar.sortOptions.pickupDate') },
    { value: "completedDate", label: t('filterBar.sortOptions.completedDate') },
    { value: "status", label: t('filterBar.sortOptions.status') },
    { value: "customer", label: t('filterBar.sortOptions.customer') },
    { value: "rate", label: t('filterBar.sortOptions.rate') }
  ];

  const handleDateFilterChange = (value) => {
    setFilters({
      ...filters,
      dateRange: value,
      ...(value !== 'Custom' && { startDate: '', endDate: '' })
    });
  };

  const hasActiveFilters = () => {
    return filters.search ||
      filters.status !== 'All' ||
      filters.driverId ||
      filters.vehicleId ||
      filters.dateRange !== 'all' ||
      (filters.dateRange === 'Custom' && (filters.startDate || filters.endDate));
  };

  return (
    <div className={className}>
      {/* Simple Filter Bar (Always Visible) */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
          {/* Search */}
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400 dark:text-gray-500" />
            </div>
            <input
              type="text"
              placeholder={t('filterBar.searchPlaceholder')}
              value={filters.search || ''}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400"
            />
            {filters.search && (
              <button
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setFilters({ ...filters, search: '' })}
              >
                <X size={16} className="text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400" />
              </button>
            )}
          </div>

          {/* Status Dropdown */}
          <div className="relative min-w-[140px]">
            <select
              className="block w-full pl-3 pr-10 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-700 dark:text-gray-200 appearance-none"
              value={filters.status || 'All'}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <SlidersHorizontal size={14} className="text-gray-400 dark:text-gray-500" />
            </div>
          </div>

          {/* Toggle Filters Button */}
          <button
            onClick={() => setExpanded(!expanded)}
            className={`flex-shrink-0 inline-flex items-center px-3 py-2 border ${hasActiveFilters()
              ? 'border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
              : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200'
              } rounded-lg shadow-sm text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors`}
          >
            <Filter size={16} className={`mr-2 ${hasActiveFilters() ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`} />
            {hasActiveFilters() ? `${t('common:buttons.filter')} (${(filters.status !== 'All' ? 1 : 0) +
              (filters.driverId ? 1 : 0) +
              (filters.vehicleId ? 1 : 0) +
              (filters.dateRange !== 'all' ? 1 : 0)
              })` : t('common:buttons.filter')}
          </button>

          {/* Reset Button (Only shown when filters are active) */}
          {hasActiveFilters() && (
            <button
              onClick={onReset}
              className="flex-shrink-0 inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              <RefreshCw size={16} className="mr-2 text-gray-500 dark:text-gray-400" />
              {t('common:buttons.reset')}
            </button>
          )}
        </div>
      </div>

      {/* Expanded Filters */}
      {expanded && (
        <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Date Range Filter */}
            <div>
              <label htmlFor="dateRange" className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center">
                <Calendar size={12} className="mr-1" /> {t('common:time.dateRange')}
              </label>
              <select
                id="dateRange"
                className="block w-full pl-3 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                value={filters.dateRange || 'all'}
                onChange={(e) => handleDateFilterChange(e.target.value)}
              >
                {dateRangeOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            {/* Driver Filter */}
            {drivers.length > 0 && (
              <div>
                <label htmlFor="driverId" className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center">
                  <Users size={12} className="mr-1" /> {t('fields.driver')}
                </label>
                <select
                  id="driverId"
                  className="block w-full pl-3 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={filters.driverId || ''}
                  onChange={(e) => setFilters({ ...filters, driverId: e.target.value })}
                >
                  <option value="">{t('filters.allStatuses')}</option>
                  {drivers.map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Vehicle Filter */}
            {vehicles.length > 0 && (
              <div>
                <label htmlFor="vehicleId" className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center">
                  <Truck size={12} className="mr-1" /> {t('fields.truck')}
                </label>
                <select
                  id="vehicleId"
                  className="block w-full pl-3 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={filters.vehicleId || ''}
                  onChange={(e) => setFilters({ ...filters, vehicleId: e.target.value })}
                >
                  <option value="">{t('filters.allStatuses')}</option>
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.name}{vehicle.license_plate ? ` (${vehicle.license_plate})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Sort By */}
            <div>
              <label htmlFor="sortBy" className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center">
                <SlidersHorizontal size={12} className="mr-1" /> {t('filterBar.sortBy')}
              </label>
              <select
                id="sortBy"
                className="block w-full pl-3 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                value={filters.sortBy || 'created_at'}
                onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Custom Date Range */}
          {filters.dateRange === 'Custom' && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="startDate" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('common:time.from')}
                </label>
                <input
                  type="date"
                  id="startDate"
                  className="block w-full pl-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={filters.startDate || ""}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="endDate" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('common:time.to')}
                </label>
                <input
                  type="date"
                  id="endDate"
                  className="block w-full pl-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={filters.endDate || ""}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* Active Filters Summary */}
          {hasActiveFilters() && (
            <div className="mt-3 flex flex-wrap items-center">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mr-2">{t('filters.title')}:</span>
              {filters.status !== 'All' && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 mr-2 mb-1">
                  {t('status.label')}: {filters.status}
                  <button
                    onClick={() => setFilters({ ...filters, status: 'All' })}
                    className="ml-1 text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                  >
                    <X size={12} />
                  </button>
                </span>
              )}
              {filters.driverId && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 mr-2 mb-1">
                  {t('fields.driver')}: {drivers.find(d => d.id === filters.driverId)?.name || t('status.assigned')}
                  <button
                    onClick={() => setFilters({ ...filters, driverId: '' })}
                    className="ml-1 text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                  >
                    <X size={12} />
                  </button>
                </span>
              )}
              {filters.vehicleId && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 mr-2 mb-1">
                  {t('fields.truck')}: {vehicles.find(v => v.id === filters.vehicleId)?.name || t('status.assigned')}
                  <button
                    onClick={() => setFilters({ ...filters, vehicleId: '' })}
                    className="ml-1 text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                  >
                    <X size={12} />
                  </button>
                </span>
              )}
              {filters.dateRange !== 'all' && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 mr-2 mb-1">
                  {t('common:time.dateRange')}: {filters.dateRange === 'Custom' ? t('common:time.dateRange') : dateRangeOptions.find(d => d.value === filters.dateRange)?.label}
                  <button
                    onClick={() => setFilters({ ...filters, dateRange: 'all', startDate: '', endDate: '' })}
                    className="ml-1 text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                  >
                    <X size={12} />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
