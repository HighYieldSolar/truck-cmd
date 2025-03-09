"use client";

import { useState } from "react";
import { 
  Download, 
  Search, 
  Filter, 
  RefreshCw, 
  ChevronDown, 
  ArrowUpDown,
  FileDown,
  Calendar
} from "lucide-react";

export default function IFTARatesTable({ rates = [], isLoading = false }) {
  const [filters, setFilters] = useState({
    search: "",
    sortBy: "jurisdiction",
    sortDirection: "asc"
  });

  // Apply filters and sorting
  const filteredRates = rates
    .filter(rate => {
      if (!filters.search) return true;
      return rate.jurisdiction.toLowerCase().includes(filters.search.toLowerCase());
    })
    .sort((a, b) => {
      const sortKey = filters.sortBy;
      
      if (sortKey === 'jurisdiction') {
        return filters.sortDirection === 'asc'
          ? a.jurisdiction.localeCompare(b.jurisdiction)
          : b.jurisdiction.localeCompare(a.jurisdiction);
      }
      
      // Numeric sort for other columns
      return filters.sortDirection === 'asc'
        ? a[sortKey] - b[sortKey]
        : b[sortKey] - a[sortKey];
    });

  // Handle sort
  const handleSort = (column) => {
    setFilters(prev => ({
      ...prev,
      sortBy: column,
      sortDirection: prev.sortBy === column && prev.sortDirection === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Get sort indicator icon
  const getSortIcon = (column) => {
    if (filters.sortBy !== column) {
      return <ArrowUpDown size={14} className="ml-1 text-gray-400" />;
    }
    
    return filters.sortDirection === 'asc' 
      ? <ChevronDown size={14} className="ml-1 text-blue-500 transform rotate-180" />
      : <ChevronDown size={14} className="ml-1 text-blue-500" />;
  };

  // Handle export
  const handleExport = () => {
    if (!rates || rates.length === 0) return;

    // Create array of data for CSV
    const csvRows = [
      // Header row
      ['Jurisdiction', 'Rate', 'Surcharge', 'Total Rate'].join(','),
      // Data rows
      ...filteredRates.map(rate => [
        rate.jurisdiction,
        rate.rate.toFixed(3),
        rate.surcharge.toFixed(3),
        rate.totalRate.toFixed(3)
      ].join(','))
    ];

    // Create blob and download link
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ifta_tax_rates_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <div className="flex items-center">
          <h3 className="text-lg font-medium text-gray-900">Current IFTA Tax Rates</h3>
          <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <Calendar size={12} className="mr-1" />
            Quarter {new Date().getMonth() < 3 ? '1' : new Date().getMonth() < 6 ? '2' : new Date().getMonth() < 9 ? '3' : '4'} {new Date().getFullYear()}
          </span>
        </div>
        <div className="flex space-x-2">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search jurisdiction..."
              className="pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          <button
            onClick={handleExport}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
          >
            <FileDown size={16} className="mr-1.5" />
            Export
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="p-12 text-center">
            <RefreshCw size={32} className="animate-spin mx-auto mb-4 text-blue-500" />
            <p className="text-gray-500">Loading tax rates...</p>
          </div>
        ) : rates.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500">No IFTA tax rates available. Please check back later.</p>
          </div>
        ) : filteredRates.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500">No jurisdictions match your search criteria.</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort("jurisdiction")}
                >
                  <div className="flex items-center">
                    Jurisdiction
                    {getSortIcon("jurisdiction")}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort("rate")}
                >
                  <div className="flex items-center">
                    Rate ($ per gallon)
                    {getSortIcon("rate")}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort("surcharge")}
                >
                  <div className="flex items-center">
                    Surcharge
                    {getSortIcon("surcharge")}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort("totalRate")}
                >
                  <div className="flex items-center">
                    Total Rate
                    {getSortIcon("totalRate")}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRates.map((rate, index) => (
                <tr key={rate.jurisdiction} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                    {rate.jurisdiction}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">
                    ${rate.rate.toFixed(3)}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">
                    ${rate.surcharge.toFixed(3)}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">
                    <span className="font-medium">${rate.totalRate.toFixed(3)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      
      <div className="px-6 py-3 bg-gray-50 text-gray-500 text-xs border-t border-gray-200">
        Note: Tax rates are subject to change. Always verify current rates with the appropriate jurisdiction before filing.
      </div>
    </div>
  );
}