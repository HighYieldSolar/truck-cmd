// src/components/dispatching/FilterBar.js
"use client";

import { Search, Filter, Truck, CheckCircle, Clock, SlidersHorizontal } from "lucide-react";

export default function FilterBar({ filters, setFilters }) {
  const statusOptions = [
    { value: "All", label: "All Status", icon: <SlidersHorizontal size={14} /> },
    { value: "Pending", label: "Pending", icon: <Clock size={14} /> },
    { value: "Assigned", label: "Assigned", icon: <Truck size={14} /> },
    { value: "In Transit", label: "In Transit", icon: <Truck size={14} /> },
    { value: "Loading", label: "Loading", icon: <SlidersHorizontal size={14} /> },
    { value: "Unloading", label: "Unloading", icon: <SlidersHorizontal size={14} /> },
    { value: "Delivered", label: "Delivered", icon: <CheckCircle size={14} /> },
    { value: "Completed", label: "Completed", icon: <CheckCircle size={14} /> },
    { value: "Cancelled", label: "Cancelled", icon: <SlidersHorizontal size={14} /> },
    { value: "Delayed", label: "Delayed", icon: <Clock size={14} /> }
  ];

  const dateRangeOptions = [
    { value: "all", label: "All Time" },
    { value: "today", label: "Today" },
    { value: "tomorrow", label: "Tomorrow" },
    { value: "thisWeek", label: "This Week" },
    { value: "lastWeek", label: "Last Week" },
    { value: "thisMonth", label: "This Month" },
    { value: "lastMonth", label: "Last Month" },
    { value: "thisQuarter", label: "This Quarter" },
    { value: "lastQuarter", label: "Last Quarter" },
  ];

  const sortOptions = [
    { value: "pickupDate", label: "Pickup Date" },
    { value: "deliveryDate", label: "Delivery Date" },
    { value: "status", label: "Status" },
    { value: "customer", label: "Customer" },
    { value: "rate", label: "Rate" },
  ];

  return (
    <div className="p-6">
      <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <input
              type="text"
              placeholder="Search loads by number, customer, or driver..."
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
                <option key={option.value} value={option.value}>Sort by {option.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {/* Quick filter chips */}
      <div className="flex flex-wrap gap-2 mt-4">
        <FilterChip 
          label="All"
          icon={<SlidersHorizontal size={12} />}
          isActive={filters.status === "All"} 
          onClick={() => setFilters({...filters, status: "All"})}
        />
        <FilterChip 
          label="Active"
          icon={<Truck size={12} />}
          isActive={filters.status === "Active"} 
          onClick={() => setFilters({...filters, status: "Active"})}
        />
        <FilterChip 
          label="Completed"
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