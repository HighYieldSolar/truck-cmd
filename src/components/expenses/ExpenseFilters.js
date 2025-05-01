// src/components/expenses/ExpenseFilters.js
"use client";

import { useState } from "react";
import { Search, RefreshCw } from "lucide-react";

export default function ExpenseFilters({ 
  filters, 
  onSearchChange, 
  onFilterChange,
  onDateRangeChange,
  onCustomDateChange,
  onResetFilters
}) {
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
        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
        <select
          name="category"
          value={filters.category}
          onChange={onFilterChange}
          className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="All">All Categories</option>
          <option value="Fuel">Fuel</option>
          <option value="Maintenance">Maintenance</option>
          <option value="Insurance">Insurance</option>
          <option value="Tolls">Tolls</option>
          <option value="Office">Office</option>
          <option value="Permits">Permits</option>
          <option value="Meals">Meals</option>
          <option value="Other">Other</option>
        </select>
      </div>
      
      <div className="md:col-span-1">
        <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
        <select
          name="dateRange"
          value={filters.dateRange}
          onChange={handleDateRangeChange}
          className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="All Time">All Time</option>
          <option value="This Month">This Month</option>
          <option value="Last Month">Last Month</option>
          <option value="This Quarter">This Quarter</option>
          <option value="Last Quarter">Last Quarter</option>
          <option value="This Year">This Year</option>
          <option value="Custom">Custom Range</option>
        </select>
      </div>
      
      <div className="md:col-span-1">
        <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
        <select
          name="sortBy"
          value={filters.sortBy}
          onChange={onFilterChange}
          className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="date">Date</option>
          <option value="amount">Amount</option>
          <option value="category">Category</option>
          <option value="description">Description</option>
        </select>
      </div>
      
      <div className="md:col-span-1">
        <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-gray-400" />
          </div>
          <input
            type="text"
            value={filters.search}
            onChange={onSearchChange}
            placeholder="Search expenses..."
            className="block w-full pl-10 rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>
      
      {/* Custom date range fields */}
      {showCustomDates && (
        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={handleStartDateChange}
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={handleEndDateChange}
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
          Reset Filters
        </button>
      </div>
    </div>
  );
}