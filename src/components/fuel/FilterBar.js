"use client";

import { Search, Filter, RefreshCw, Calendar, Truck, MapPin } from "lucide-react";
import { getUSStates } from "@/lib/services/fuelService";

export default function FilterBar({ 
  filters, 
  setFilters, 
  vehicles = [],
  onReset,
}) {
  const states = getUSStates();

  const handleDateFilterChange = (value) => {
    setFilters({
      ...filters,
      dateRange: value,
      ...(value !== 'Custom' && { startDate: '', endDate: '' })
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
        {/* Search */}
        <div className="flex items-center w-full md:w-auto">
          <Search size={16} className="text-gray-400 mr-1" />
          <input
            type="text"
            placeholder="Search by any term..."
            value={filters.search || ''}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="w-full pl-2 py-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* State Filter */}
          <div className="sm:w-40">
            <label htmlFor="state" className="text-xs font-medium text-gray-700 mb-1 flex items-center">
              <MapPin size={12} className="mr-1" /> State
            </label>
            <select
              id="state"
              className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
              value={filters.state || ''}
              onChange={(e) => setFilters({ ...filters, state: e.target.value })}
            >
              <option value="">All States</option>
              {states.map(state => (
                <option key={state.code} value={state.code}>{state.code} - {state.name}</option>
              ))}
            </select>
          </div>

          {/* Date Range Filter */}
          <div className="sm:w-40">
            <label htmlFor="dateRange" className="text-xs font-medium text-gray-700 mb-1 flex items-center">
              <Calendar size={12} className="mr-1" /> Date Range
            </label>
            <select
              id="dateRange"
              className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
              value={filters.dateRange || 'This Quarter'}
              onChange={(e) => handleDateFilterChange(e.target.value)}
            >
              <option value="All">All Time</option>
              <option value="This Quarter">This Quarter</option>
              <option value="Last Quarter">Last Quarter</option>
              <option value="Custom">Custom Range</option>
            </select>
          </div>

          {/* Vehicle Filter */ }
          {vehicles.length > 0 && (
            <div className="sm:w-40">
              <label htmlFor="vehicleId" className="text-xs font-medium text-gray-700 mb-1 flex items-center">
                <Truck size={12} className="mr-1" /> Vehicle
              </label>
              <select
                id="vehicleId"
                className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                value={filters.vehicleId || ''}
                onChange={(e) => setFilters({ ...filters, vehicleId: e.target.value })}
              >
                <option value="">All Vehicles</option>
                {vehicles.map((vehicle) => (
                  <option key={vehicle} value={vehicle}>{vehicle}</option>
                ))}
              </select>
            </div>
          )}

          {/* Reset Button */}
          <div className="flex-none flex items-end">
            <button
              onClick={onReset}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
            >
              <RefreshCw size={16} className="mr-2 inline-block"/>
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Custom Date Range */}
      {filters.dateRange === 'Custom' && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="startDate" className="block text-xs font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              id="startDate"
              className="block w-full pl-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
              value={filters.startDate || ""}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-xs font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              id="endDate"
              className="block w-full pl-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
              value={filters.endDate || ""}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            />
          </div>
        </div>
      )}
    </div>
  );
}