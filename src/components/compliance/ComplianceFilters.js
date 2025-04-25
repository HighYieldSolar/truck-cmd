"use client";

import { Search } from "lucide-react";
import { COMPLIANCE_TYPES } from "@/lib/constants/complianceConstants";

export default function ComplianceFilters({ filters, onFilterChange, onSearch }) {
  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6">
      <div className="flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 md:space-x-4">
        <div className="relative inline-block w-full md:w-auto">
          <select
            name="status"
            value={filters.status}
            onChange={onFilterChange}
            className="text-black block w-full pl-3 pr-10 py-2 text-base border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="expiring soon">Expiring Soon</option>
            <option value="expired">Expired</option>
            <option value="pending">Pending</option>
          </select>
        </div>
        
        <div className="relative inline-block w-full md:w-auto">
          <select
            name="type"
            value={filters.type}
            onChange={onFilterChange}
            className="text-black block w-full pl-3 pr-10 py-2 text-base border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="all">All Types</option>
            {Object.entries(COMPLIANCE_TYPES).map(([key, type]) => (
              <option key={key} value={key}>
                {type.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="relative inline-block w-full md:w-auto">
          <select
            name="entity"
            value={filters.entity}
            onChange={onFilterChange}
            className="text-black block w-full pl-3 pr-10 py-2 text-base border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="all">All Entities</option>
            <option value="Vehicle">Vehicles</option>
            <option value="Driver">Drivers</option>
            <option value="Company">Company</option>
            <option value="Other">Other</option>
          </select>
        </div>
        
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-gray-400" />
          </div>
          <input
            type="text"
            value={filters.search}
            onChange={onSearch}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Search records..."
          />
        </div>
      </div>
    </div>
  );
}