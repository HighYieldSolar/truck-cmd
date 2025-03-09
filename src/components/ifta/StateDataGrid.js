"use client";

import { useState } from "react";
import { 
  Map, 
  Filter, 
  RefreshCw, 
  Download, 
  ChevronDown, 
  ArrowUpDown,
  Info,
  AlertTriangle,
  MapPin
} from "lucide-react";

export default function StateDataGrid({ trips = [], rates = [], fuelData = [], isLoading = false }) {
  const [filters, setFilters] = useState({
    search: "",
    sortBy: "jurisdiction",
    sortDirection: "asc",
    showZeroMiles: false
  });
  const [showInfoModal, setShowInfoModal] = useState(false);

  // Process trips to get per-jurisdiction data
  const calculateJurisdictionData = () => {
    // First, we need to extract all jurisdictions involved
    const allJurisdictions = new Set();
    trips.forEach(trip => {
      if (trip.startJurisdiction) allJurisdictions.add(trip.startJurisdiction);
      if (trip.endJurisdiction) allJurisdictions.add(trip.endJurisdiction);
    });

    // Create a map of jurisdiction data
    const jurisdictionMap = {};
    allJurisdictions.forEach(jurisdiction => {
      jurisdictionMap[jurisdiction] = {
        jurisdiction,
        totalMiles: 0,
        taxableMiles: 0,
        taxPaidGallons: 0,
        taxRate: 0,
        netTaxableGallons: 0,
        taxDue: 0
      };
      
      // Look up tax rate for this jurisdiction
      const rateInfo = rates.find(r => r.jurisdiction.includes(jurisdiction));
      if (rateInfo) {
        jurisdictionMap[jurisdiction].taxRate = rateInfo.totalRate;
      }
    });

    // Process trips to calculate miles in each jurisdiction
    trips.forEach(trip => {
      // Simple case: if start and end are the same, all miles belong to that jurisdiction
      if (trip.startJurisdiction === trip.endJurisdiction && trip.startJurisdiction) {
        const miles = parseFloat(trip.miles) || 0;
        jurisdictionMap[trip.startJurisdiction].totalMiles += miles;
        jurisdictionMap[trip.startJurisdiction].taxableMiles += miles;
      } 
      // If crossing jurisdictions, split miles 50/50 (simplified approach)
      else if (trip.startJurisdiction && trip.endJurisdiction) {
        const miles = parseFloat(trip.miles) || 0;
        const milesPerJurisdiction = miles / 2;
        
        jurisdictionMap[trip.startJurisdiction].totalMiles += milesPerJurisdiction;
        jurisdictionMap[trip.startJurisdiction].taxableMiles += milesPerJurisdiction;
        
        jurisdictionMap[trip.endJurisdiction].totalMiles += milesPerJurisdiction;
        jurisdictionMap[trip.endJurisdiction].taxableMiles += milesPerJurisdiction;
      }
    });

    // Process fuel data to calculate tax-paid gallons in each jurisdiction
    fuelData.forEach(entry => {
      const jurisdiction = entry.state;
      if (jurisdiction && jurisdictionMap[jurisdiction]) {
        jurisdictionMap[jurisdiction].taxPaidGallons += parseFloat(entry.gallons) || 0;
      }
    });

    // Calculate the rest of the values
    const totalMiles = Object.values(jurisdictionMap).reduce((sum, j) => sum + j.totalMiles, 0);
    const totalGallons = trips.reduce((sum, trip) => sum + (parseFloat(trip.gallons) || 0), 0);
    
    // Average fuel consumption (MPG)
    const avgMpg = totalMiles > 0 && totalGallons > 0 ? totalMiles / totalGallons : 6.0;

    // Calculate net taxable gallons and tax due for each jurisdiction
    Object.values(jurisdictionMap).forEach(j => {
      // Taxable gallons based on miles and average consumption
      const taxableGallons = j.taxableMiles / avgMpg;
      
      // Net taxable gallons = taxable gallons - tax paid gallons
      j.netTaxableGallons = taxableGallons - j.taxPaidGallons;
      
      // Tax due = net taxable gallons * tax rate
      j.taxDue = j.netTaxableGallons * j.taxRate;
    });

    return Object.values(jurisdictionMap);
  };

  const jurisdictionData = calculateJurisdictionData();

  // Apply filtering and sorting
  const filteredData = jurisdictionData
    .filter(j => {
      // Apply search filter
      if (filters.search && !j.jurisdiction.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      
      // Filter out zero miles jurisdictions if needed
      if (!filters.showZeroMiles && j.totalMiles === 0) {
        return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      const sortKey = filters.sortBy;
      
      if (sortKey === 'jurisdiction') {
        return filters.sortDirection === 'asc'
          ? a.jurisdiction.localeCompare(b.jurisdiction)
          : b.jurisdiction.localeCompare(a.jurisdiction);
      }
      
      return filters.sortDirection === 'asc'
        ? a[sortKey] - b[sortKey]
        : b[sortKey] - a[sortKey];
    });

  // Calculate totals for the filtered data
  const totals = {
    totalMiles: filteredData.reduce((sum, j) => sum + j.totalMiles, 0),
    taxableMiles: filteredData.reduce((sum, j) => sum + j.taxableMiles, 0),
    taxPaidGallons: filteredData.reduce((sum, j) => sum + j.taxPaidGallons, 0),
    netTaxableGallons: filteredData.reduce((sum, j) => sum + j.netTaxableGallons, 0),
    taxDue: filteredData.reduce((sum, j) => sum + j.taxDue, 0)
  };

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
    if (filteredData.length === 0) return;

    // Create array of data for CSV
    const csvRows = [
      // Header row
      ['Jurisdiction', 'Total Miles', 'Taxable Miles', 'Tax Paid Gallons', 'Tax Rate', 'Net Taxable Gallons', 'Tax Due'].join(','),
      // Data rows
      ...filteredData.map(j => [
        j.jurisdiction,
        j.totalMiles.toFixed(1),
        j.taxableMiles.toFixed(1),
        j.taxPaidGallons.toFixed(3),
        j.taxRate.toFixed(3),
        j.netTaxableGallons.toFixed(3),
        j.taxDue.toFixed(2)
      ].join(','))
    ];

    // Create blob and download link
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ifta_jurisdiction_data.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <div className="flex items-center">
          <MapPin size={20} className="text-blue-600 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Jurisdiction Summary</h3>
          <button
            onClick={() => setShowInfoModal(!showInfoModal)}
            className="ml-2 text-blue-500 hover:text-blue-700 focus:outline-none"
          >
            <Info size={16} />
          </button>
        </div>
        
        <div className="flex space-x-3">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="show-zero-miles"
              checked={filters.showZeroMiles}
              onChange={(e) => setFilters({ ...filters, showZeroMiles: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="show-zero-miles" className="ml-2 text-sm text-gray-700">
              Show zero miles
            </label>
          </div>
          
          <div className="relative rounded-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter size={16} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Filter jurisdictions..."
              className="pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          
          <button
            onClick={handleExport}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
            disabled={filteredData.length === 0}
          >
            <Download size={16} className="mr-1.5" />
            Export Data
          </button>
        </div>
      </div>
      
      {showInfoModal && (
        <div className="bg-blue-50 p-4 border-b border-blue-100">
          <div className="flex">
            <div className="flex-shrink-0">
              <Info size={24} className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm leading-5 font-medium text-blue-800">
                How IFTA Calculations Work
              </h3>
              <div className="mt-2 text-sm leading-5 text-blue-700">
                <p>
                  This table shows how IFTA taxes are calculated for each jurisdiction:
                </p>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li>Total Miles: Miles traveled in each jurisdiction</li>
                  <li>Taxable Miles: Miles subject to fuel tax</li>
                  <li>Tax Paid Gallons: Fuel purchased in each jurisdiction</li>
                  <li>Net Taxable Gallons: Calculated as (Taxable Miles ÷ Fleet MPG) - Tax Paid Gallons</li>
                  <li>Tax Due: Net Taxable Gallons × Tax Rate</li>
                </ul>
                <p className="mt-2">
                  Positive tax due amounts must be paid, while negative amounts can be claimed as credits.
                </p>
              </div>
            </div>
            <div className="ml-auto">
              <button 
                onClick={() => setShowInfoModal(false)} 
                className="text-blue-500 hover:text-blue-700"
              >
                <span className="sr-only">Close</span>
                <span aria-hidden="true">×</span>
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="p-12 text-center">
            <RefreshCw size={32} className="animate-spin mx-auto mb-4 text-blue-500" />
            <p className="text-gray-500">Calculating IFTA data...</p>
          </div>
        ) : !trips.length ? (
          <div className="p-12 text-center">
            <p className="text-gray-500">
              No trip data available. Add trips using the form above to see jurisdiction calculations.
            </p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500">
              No jurisdictions match your filter criteria.
            </p>
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
                  onClick={() => handleSort("totalMiles")}
                >
                  <div className="flex items-center">
                    Total Miles
                    {getSortIcon("totalMiles")}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort("taxableMiles")}
                >
                  <div className="flex items-center">
                    Taxable Miles
                    {getSortIcon("taxableMiles")}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort("taxPaidGallons")}
                >
                  <div className="flex items-center">
                    Tax Paid Gallons
                    {getSortIcon("taxPaidGallons")}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort("taxRate")}
                >
                  <div className="flex items-center">
                    Tax Rate
                    {getSortIcon("taxRate")}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort("netTaxableGallons")}
                >
                  <div className="flex items-center">
                    Net Taxable Gallons
                    {getSortIcon("netTaxableGallons")}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort("taxDue")}
                >
                  <div className="flex items-center">
                    Tax Due
                    {getSortIcon("taxDue")}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.map((j, index) => (
                <tr key={j.jurisdiction} className={index % 2 === 0 ? "bg-white hover:bg-gray-50" : "bg-gray-50 hover:bg-gray-100"}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {j.jurisdiction}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {j.totalMiles.toFixed(1)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {j.taxableMiles.toFixed(1)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {j.taxPaidGallons.toFixed(3)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${j.taxRate.toFixed(3)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={j.netTaxableGallons < 0 ? "text-red-600" : ""}>
                      {j.netTaxableGallons.toFixed(3)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <span className={j.taxDue < 0 ? "text-red-600" : "text-green-600"}>
                      ${Math.abs(j.taxDue).toFixed(2)} {j.taxDue < 0 ? "(Credit)" : ""}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-100">
              <tr className="font-semibold text-gray-900">
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  Totals
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {totals.totalMiles.toFixed(1)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {totals.taxableMiles.toFixed(1)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {totals.taxPaidGallons.toFixed(3)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  —
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {totals.netTaxableGallons.toFixed(3)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={totals.taxDue < 0 ? "text-red-600" : "text-green-600"}>
                    ${Math.abs(totals.taxDue).toFixed(2)} {totals.taxDue < 0 ? "(Net Credit)" : "(Net Due)"}
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
      
      <div className="px-6 py-3 bg-gray-50 text-gray-500 text-xs border-t border-gray-200">
        Note: This is an estimate based on your recorded trips and fuel purchases. Actual tax liability may vary.
      </div>
    </div>
  );
}