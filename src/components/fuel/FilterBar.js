"use client";

import { Search, Filter, RefreshCw, Calendar, Truck, MapPin } from "lucide-react";
import { getUSStates } from "@/lib/services/fuelService";

export default function FilterBar({ 
  filters, 
  setFilters, 
  vehicles = [],
  onReset
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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
        {/* Search */}
        <div className="flex-1">
          <label htmlFor="search" className="text-xs font-medium text-gray-700 mb-1 flex items-center">
            <Search size={12} className="mr-1" /> Search
          </label>
          <div className="relative">
            <input
              type="text"
              id="search"
              placeholder="Search by location or vehicle ID"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
              value={filters.search || ''}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400" />
            </div>
          </div>
        </div>

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

        {/* Vehicle Filter */}
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
              {vehicles.map(vehicle => (
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
            <RefreshCw size={16} className="mr-2 inline-block" />
            Reset
          </button>
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
              value={filters.startDate || ''}
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
              value={filters.endDate || ''}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            />
          </div>
        </div>
      )}
    </div>
  );
}