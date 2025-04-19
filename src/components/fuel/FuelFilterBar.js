// src/components/fuel/FuelFilterBar.js
import { useState } from "react";
import { Search, Filter, Calendar, Truck, MapPin, X, RefreshCw } from "lucide-react";
import { getUSStates } from "@/lib/services/fuelService";

export default function FuelFilterBar({ 
  filters, 
  setFilters, 
  vehicles = [],
  onReset,
  className = ""
}) {
  const [expanded, setExpanded] = useState(false);
  const states = getUSStates();

  const handleDateFilterChange = (value) => {
    setFilters({
      ...filters,
      dateRange: value,
      ...(value !== 'Custom' && { startDate: '', endDate: '' })
    });
  };
  
  const hasActiveFilters = () => {
    return filters.search || 
           filters.state || 
           filters.vehicleId || 
           filters.dateRange !== 'This Quarter' ||
           (filters.dateRange === 'Custom' && (filters.startDate || filters.endDate));
  };
  
  return (
    <div className={`bg-white rounded-lg shadow border border-gray-200 ${className}`}>
      {/* Simple Filter Bar (Always Visible) */}
      <div className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
          {/* Search */}
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by location, vehicle..."
              value={filters.search || ''}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
            {filters.search && (
              <button
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setFilters({ ...filters, search: '' })}
              >
                <X size={16} className="text-gray-400 hover:text-gray-500" />
              </button>
            )}
          </div>
          
{/* Toggle Filters Button */}
<button
            onClick={() => setExpanded(!expanded)}
            className={`flex-shrink-0 inline-flex items-center px-3 py-2 border ${
              hasActiveFilters() ? 
                'border-blue-300 bg-blue-50 text-blue-700' : 
                'border-gray-300 bg-white text-gray-700'
            } rounded-md shadow-sm text-sm font-medium hover:bg-gray-50`}
          >
            <Filter size={16} className={`mr-2 ${hasActiveFilters() ? 'text-blue-600' : 'text-gray-500'}`} />
            {hasActiveFilters() ? `Filters (${
              (filters.state ? 1 : 0) + 
              (filters.vehicleId ? 1 : 0) + 
              (filters.dateRange !== 'This Quarter' ? 1 : 0)
            })` : 'Filters'}
          </button>
          
          {/* Reset Button (Only shown when filters are active) */}
          {hasActiveFilters() && (
            <button
              onClick={onReset}
              className="flex-shrink-0 inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <RefreshCw size={16} className="mr-2 text-gray-500" />
              Reset
            </button>
          )}
        </div>
      </div>
      
      {/* Expanded Filters */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-200 pt-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* State Filter */}
            <div>
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
            <div>
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
              <div>
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
          
          {/* Active Filters Summary */}
          {hasActiveFilters() && (
            <div className="mt-3 flex flex-wrap items-center">
              <span className="text-xs font-medium text-gray-500 mr-2">Active filters:</span>
              {filters.state && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2 mb-1">
                  State: {states.find(s => s.code === filters.state)?.name || filters.state}
                  <button 
                    onClick={() => setFilters({ ...filters, state: '' })}
                    className="ml-1 text-blue-500 hover:text-blue-700"
                  >
                    <X size={12} />
                  </button>
                </span>
              )}
              {filters.vehicleId && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2 mb-1">
                  Vehicle: {filters.vehicleId}
                  <button 
                    onClick={() => setFilters({ ...filters, vehicleId: '' })}
                    className="ml-1 text-blue-500 hover:text-blue-700"
                  >
                    <X size={12} />
                  </button>
                </span>
              )}
              {filters.dateRange !== 'This Quarter' && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2 mb-1">
                  Date: {filters.dateRange === 'Custom' ? 'Custom Range' : filters.dateRange}
                  <button 
                    onClick={() => setFilters({ ...filters, dateRange: 'This Quarter', startDate: '', endDate: '' })}
                    className="ml-1 text-blue-500 hover:text-blue-700"
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