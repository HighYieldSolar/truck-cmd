// src/components/dispatching/FilterBar.js
"use client";

import { Search, Truck, CheckCircle } from "lucide-react";

export default function FilterBar({ filters, setFilters }) {
  const statusOptions = [
    "All",
    "Pending",
    "Assigned",
    "In Transit",
    "Loading",
    "Unloading",
    "Delivered",
    "Completed",
    "Cancelled",
    "Delayed"
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
        {/* Search */}
        <div className="flex-1">
          <label htmlFor="search" className="block text-xs font-medium text-gray-700 mb-1">Search</label>
          <div className="relative">
            <input
              type="text"
              id="search"
              placeholder="Search by load #, customer, or driver"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400" />
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="sm:w-40">
          <label htmlFor="status" className="block text-xs font-medium text-gray-700 mb-1">Status</label>
          <select
            id="status"
            className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value})}
          >
            {statusOptions.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Quick filter buttons */}
      <div className="flex flex-wrap gap-2 mt-4">
        <button
          onClick={() => setFilters({...filters, status: "All"})}
          className={`px-3 py-1 text-xs rounded-full ${
            filters.status === "All" 
              ? 'bg-blue-100 text-blue-800 border border-blue-300' 
              : 'bg-gray-100 text-gray-800 border border-gray-200'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilters({...filters, status: "Active"})}
          className={`px-3 py-1 text-xs rounded-full flex items-center ${
            filters.status === "Active" 
              ? 'bg-blue-100 text-blue-800 border border-blue-300' 
              : 'bg-gray-100 text-gray-800 border border-gray-200'
          }`}
        >
          <Truck size={10} className="mr-1" />
          Active
        </button>
        <button
          onClick={() => setFilters({...filters, status: "Completed"})}
          className={`px-3 py-1 text-xs rounded-full flex items-center ${
            filters.status === "Completed" 
              ? 'bg-green-100 text-green-800 border border-green-300' 
              : 'bg-gray-100 text-gray-800 border border-gray-200'
          }`}
        >
          <CheckCircle size={10} className="mr-1" />
          Completed
        </button>
      </div>
    </div>
  );
}