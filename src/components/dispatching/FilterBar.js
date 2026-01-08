// src/components/dispatching/FilterBar.js
"use client";

import { Search, Filter, Truck, CheckCircle, Clock, SlidersHorizontal } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";

export default function FilterBar({ filters, setFilters }) {
  const { t } = useTranslation('dispatching');

  const statusOptions = [
    { value: "All", label: t('filterBar.allStatus'), icon: <SlidersHorizontal size={14} /> },
    { value: "Pending", label: t('statusLabels.pending'), icon: <Clock size={14} /> },
    { value: "Assigned", label: t('statusLabels.assigned'), icon: <Truck size={14} /> },
    { value: "In Transit", label: t('statusLabels.inTransit'), icon: <Truck size={14} /> },
    { value: "Loading", label: t('statusLabels.loading'), icon: <SlidersHorizontal size={14} /> },
    { value: "Unloading", label: t('statusLabels.unloading'), icon: <SlidersHorizontal size={14} /> },
    { value: "Delivered", label: t('statusLabels.delivered'), icon: <CheckCircle size={14} /> },
    { value: "Completed", label: t('statusLabels.completed'), icon: <CheckCircle size={14} /> },
    { value: "Cancelled", label: t('statusLabels.cancelled'), icon: <SlidersHorizontal size={14} /> },
    { value: "Delayed", label: t('statusLabels.delayed'), icon: <Clock size={14} /> }
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
  ];

  const sortOptions = [
    { value: "deliveryDate", label: t('filterBar.sortOptions.deliveryDate') },
    { value: "pickupDate", label: t('filterBar.sortOptions.pickupDate') },
    { value: "completedDate", label: t('filterBar.sortOptions.completedDate') },
    { value: "status", label: t('filterBar.sortOptions.status') },
    { value: "customer", label: t('filterBar.sortOptions.customer') },
    { value: "rate", label: t('filterBar.sortOptions.rate') },
  ];

  return (
    <div className="p-6">
      <div className="flex flex-col xl:flex-row xl:items-center space-y-4 xl:space-y-0 xl:space-x-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <input
              type="text"
              placeholder={t('filterBar.searchPlaceholder')}
              className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-gray-50"
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Status Filter */}
          <div className="relative min-w-[160px]">
            <select
              className="text-gray-600 block w-full pl-3 pr-10 py-2.5 border border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm appearance-none"
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <Filter size={14} className="text-gray-400" />
            </div>
          </div>

          {/* Date Range Filter */}
          <div className="relative min-w-[140px]">
            <select
              className="text-gray-600 block w-full pl-3 pr-10 py-2.5 border border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm appearance-none"
              value={filters.dateRange}
              onChange={(e) => setFilters({...filters, dateRange: e.target.value})}
            >
              {dateRangeOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div className="relative min-w-[140px]">
            <select
              className="text-gray-600 block w-full pl-3 pr-10 py-2.5 border border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm appearance-none"
              value={filters.sortBy}
              onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>{t('filterBar.sortBy')} {option.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Quick filter chips */}
      <div className="flex flex-wrap gap-2 mt-4">
        <FilterChip
          label={t('filterBar.quickFilters.all')}
          icon={<SlidersHorizontal size={12} />}
          isActive={filters.status === "All"}
          onClick={() => setFilters({...filters, status: "All"})}
        />
        <FilterChip
          label={t('filterBar.quickFilters.active')}
          icon={<Truck size={12} />}
          isActive={filters.status === "Active"}
          onClick={() => setFilters({...filters, status: "Active"})}
        />
        <FilterChip
          label={t('filterBar.quickFilters.completed')}
          icon={<CheckCircle size={12} />}
          isActive={filters.status === "Completed"}
          onClick={() => setFilters({...filters, status: "Completed"})}
        />
      </div>
    </div>
  );
}

// Filter Chip Component
function FilterChip({ label, icon, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
        isActive
          ? 'bg-blue-100 text-blue-700 border border-blue-200' 
          : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
      }`}
    >
      {icon && <span className="mr-1.5">{icon}</span>}
      {label}
    </button>
  );
}