"use client";

import { Search } from "lucide-react";
import { COMPLIANCE_TYPES } from "@/lib/constants/complianceConstants";

export default function ComplianceFilters({ filters, onFilterChange, onSearch }) {
  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6 border border-gray-200">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Filters</h2>
      <form className="md:flex">
        <div className="mb-2 md:mb-0 md:mr-4 w-full">
          <label className="text-sm font-medium text-gray-700 block mb-1">Status</label>
          <select
            name="status"
            value={filters.status}
            onChange={onFilterChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="expiring soon">Expiring Soon</option>
            <option value="expired">Expired</option>
            <option value="pending">Pending</option>
          </select> 
        </div>
        
        <div className="mb-2 md:mb-0 md:mr-4 w-full">
        <label className="text-sm font-medium text-gray-700 block mb-1">Type</label>
          <select
            name="type"
            value={filters.type}
            onChange={onFilterChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Types</option>
            {Object.entries(COMPLIANCE_TYPES).map(([key, type]) => (
              <option key={key} value={key}>
                {type.name}
              </option>
            ))} 
          </select> 
        </div>
        
        <div className="mb-2 md:mb-0 md:mr-4 w-full">
        <label className="text-sm font-medium text-gray-700 block mb-1">Entity</label>
          <select
            name="entity"
            value={filters.entity}
            onChange={onFilterChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Entities</option>
            <option value="Vehicle">Vehicles</option>
            <option value="Driver">Drivers</option>
            <option value="Company">Company</option>
            <option value="Other">Other</option>
          </select> 
        </div>
        
        <div className="relative flex-grow mb-2 md:mb-0 md:mr-4">
        <label className="text-sm font-medium text-gray-700 block mb-1">Search</label>
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-gray-400" />
          </div>
          <input
            type="text"
            value={filters.search}
            onChange={onSearch}
            className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Search records..."
          />
        </div>
      </form>
    </div>
  );
}