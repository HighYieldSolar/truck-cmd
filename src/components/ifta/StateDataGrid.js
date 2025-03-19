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
  MapPin,
  Fuel,
  ExternalLink,
  Calculator
} from "lucide-react";
import Link from "next/link";

export default function StateDataGrid({ trips = [], fuelData = [], isLoading = false }) {
  const [filters, setFilters] = useState({
    search: "",
    sortBy: "jurisdiction",
    sortDirection: "asc",
    showZeroMiles: false
  });
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showFuelColumn, setShowFuelColumn] = useState(true);

  // Process trips to get per-jurisdiction data
  const calculateJurisdictionData = () => {
    // First, we need to extract all jurisdictions involved
    const allJurisdictions = new Set();
    trips.forEach(trip => {
      if (trip.start_jurisdiction) allJurisdictions.add(trip.start_jurisdiction);
      if (trip.end_jurisdiction) allJurisdictions.add(trip.end_jurisdiction);
    });

    // Also add jurisdictions from fuel data
    fuelData.forEach(entry => {
      if (entry.state) allJurisdictions.add(entry.state);
    });

    // Create a map of jurisdiction data
    const jurisdictionMap = {};
    allJurisdictions.forEach(jurisdiction => {
      jurisdictionMap[jurisdiction] = {
        jurisdiction,
        totalMiles: 0,
        taxableMiles: 0,
        taxPaidGallons: 0,
        netTaxableGallons: 0,
        lastFuelPurchase: null,
        fuelPurchases: 0
      };
    });

    // Process trips to calculate miles in each jurisdiction
    trips.forEach(trip => {
      // Get odometer values if available
      const hasOdometer = trip.starting_odometer && trip.ending_odometer;
      let miles = parseFloat(trip.total_miles) || 0;
      
      // If we have odometer readings, use them instead of total_miles
      if (hasOdometer && trip.starting_odometer < trip.ending_odometer) {
        miles = trip.ending_odometer - trip.starting_odometer;
      }
      
      // Simple case: if start and end are the same, all miles belong to that jurisdiction
      if (trip.start_jurisdiction === trip.end_jurisdiction && trip.start_jurisdiction) {
        jurisdictionMap[trip.start_jurisdiction].totalMiles += miles;
        jurisdictionMap[trip.start_jurisdiction].taxableMiles += miles;
      } 
      // If crossing jurisdictions, split miles 50/50 (simplified approach)
      else if (trip.start_jurisdiction && trip.end_jurisdiction) {
        const milesPerJurisdiction = miles / 2;
        
        jurisdictionMap[trip.start_jurisdiction].totalMiles += milesPerJurisdiction;
        jurisdictionMap[trip.start_jurisdiction].taxableMiles += milesPerJurisdiction;
        
        jurisdictionMap[trip.end_jurisdiction].totalMiles += milesPerJurisdiction;
        jurisdictionMap[trip.end_jurisdiction].taxableMiles += milesPerJurisdiction;
      }
    });

    // Process fuel data to calculate tax-paid gallons in each jurisdiction
    fuelData.forEach(entry => {
      const jurisdiction = entry.state;
      if (jurisdiction && jurisdictionMap[jurisdiction]) {
        jurisdictionMap[jurisdiction].taxPaidGallons += parseFloat(entry.gallons) || 0;
        jurisdictionMap[jurisdiction].fuelPurchases += 1;
        
        // Track the most recent fuel purchase date
        const purchaseDate = new Date(entry.date);
        if (!jurisdictionMap[jurisdiction].lastFuelPurchase || 
            purchaseDate > new Date(jurisdictionMap[jurisdiction].lastFuelPurchase)) {
          jurisdictionMap[jurisdiction].lastFuelPurchase = entry.date;
        }
      }
    });

    // Calculate the rest of the values
    const totalMiles = Object.values(jurisdictionMap).reduce((sum, j) => sum + j.totalMiles, 0);
    const totalGallons = trips.reduce((sum, trip) => sum + (parseFloat(trip.gallons) || 0), 0);
    
    // Average fuel consumption (MPG)
    const avgMpg = totalMiles > 0 && totalGallons > 0 ? totalMiles / totalGallons : 6.0;

    // Calculate net taxable gallons for each jurisdiction
    Object.values(jurisdictionMap).forEach(j => {
      // Taxable gallons based on miles and average consumption
      const taxableGallons = j.taxableMiles / avgMpg;
      
      // Net taxable gallons = taxable gallons - tax paid gallons
      j.netTaxableGallons = taxableGallons - j.taxPaidGallons;
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
    fuelPurchases: filteredData.reduce((sum, j) => sum + j.fuelPurchases, 0)
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
    const columns = ['Jurisdiction', 'Total Miles', 'Taxable Miles', 'Tax Paid Gallons', 'Net Taxable Gallons'];
    
    if (showFuelColumn) {
      columns.push('Fuel Purchases', 'Last Purchase Date');
    }
    
    const csvRows = [
      // Header row
      columns.join(','),
      // Data rows
      ...filteredData.map(j => {
        const baseData = [
          j.jurisdiction,
          j.totalMiles.toFixed(1),
          j.taxableMiles.toFixed(1),
          j.taxPaidGallons.toFixed(3),
          j.netTaxableGallons.toFixed(3)
        ];
        
        if (showFuelColumn) {
          baseData.push(
            j.fuelPurchases,
            j.lastFuelPurchase ? j.lastFuelPurchase : 'None'
          );
        }
        
        return baseData.join(',');
      })
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

  // Get the current quarter based on today's date
  const getCurrentQuarter = () => {
    const now = new Date();
    const year = now.getFullYear();
    const quarter = Math.ceil((now.getMonth() + 1) / 3);
    return `${year}-Q${quarter}`;
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
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="show-fuel-column"
              checked={showFuelColumn}
              onChange={(e) => setShowFuelColumn(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="show-fuel-column" className="ml-2 text-sm text-gray-700">
              Show fuel data
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
                  <li>Tax Paid Gallons: Fuel purchased in each jurisdiction (from Fuel Tracker)</li>
                  <li>Net Taxable Gallons: Calculated as (Taxable Miles ÷ Fleet MPG) - Tax Paid Gallons</li>
                </ul>
                <p className="mt-2">
                  Positive net taxable gallons mean you need to pay additional tax, while negative amounts represent potential credits.
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
        ) : !trips.length && !fuelData.length ? (
          <div className="p-12 text-center">
            <p className="text-gray-500">
              No trip or fuel data available. Add trips using the form above or record fuel purchases in the Fuel Tracker to see jurisdiction calculations.
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
                {showFuelColumn && (
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("fuelPurchases")}
                  >
                    <div className="flex items-center">
                      Fuel Tracker
                      {getSortIcon("fuelPurchases")}
                    </div>
                  </th>
                )}
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
                  {showFuelColumn && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {j.fuelPurchases > 0 ? (
                        <div>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {j.fuelPurchases} purchase{j.fuelPurchases !== 1 ? 's' : ''}
                          </span>
                          <div className="text-xs text-gray-500 mt-1">
                            Last: {j.lastFuelPurchase ? new Date(j.lastFuelPurchase).toLocaleDateString() : 'N/A'}
                          </div>
                          <Link 
                            href={`/dashboard/fuel?state=${j.jurisdiction}`}
                            className="text-xs text-blue-600 hover:text-blue-800 mt-1 inline-flex items-center"
                          >
                            <Fuel size={12} className="mr-1" />
                            View fuel data
                          </Link>
                        </div>
                      ) : (
                        <div className="text-xs text-yellow-600 inline-flex items-center">
                          <AlertTriangle size={12} className="mr-1" />
                          No fuel purchases
                        </div>
                      )}
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <span className={j.netTaxableGallons < 0 ? "text-red-600" : "text-green-600"}>
                      {j.netTaxableGallons.toFixed(3)} {j.netTaxableGallons < 0 ? "(Credit)" : ""}
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
                {showFuelColumn && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {totals.fuelPurchases} purchases
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={totals.netTaxableGallons < 0 ? "text-red-600" : "text-green-600"}>
                    {totals.netTaxableGallons.toFixed(3)} {totals.netTaxableGallons < 0 ? "(Net Credit)" : "(Net Due)"}
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
      
      <div className="px-6 py-3 bg-gray-50 text-gray-500 text-xs border-t border-gray-200">
        <div className="flex justify-between items-center">
          <span>
            Note: This is an estimate based on your recorded trips and fuel purchases. Please consult with a tax professional for official IFTA filings.
          </span>
          <Link 
            href={`/dashboard/ifta?quarter=${getCurrentQuarter()}`} 
            className="text-blue-600 hover:text-blue-800 inline-flex items-center"
          >
            <Calculator size={14} className="mr-1" />
            Go to IFTA Calculator
          </Link>
        </div>
      </div>
    </div>
  );
}