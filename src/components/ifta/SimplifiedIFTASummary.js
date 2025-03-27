// src/components/ifta/SimplifiedIFTASummary.js
"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Download, 
  Flag, 
  Table, 
  FileDown,
  Info,
  AlertTriangle,
  Fuel,
  Truck,
  FileSpreadsheet,  // Using FileSpreadsheet instead of FileCsv
} from "lucide-react";

export default function SimplifiedIFTASummary({ 
  userId, 
  quarter,
  trips = [], 
  fuelData = [],
  isLoading = false 
}) {
  const [summaryData, setSummaryData] = useState([]);
  const [totals, setTotals] = useState({
    totalMiles: 0,
    totalGallons: 0,
    avgMpg: 0
  });
  const [showInfo, setShowInfo] = useState(false);

  // Calculate the state-by-state summary data - using useCallback
  const calculateSummaryData = useCallback(() => {
    // Step 1: Calculate miles by jurisdiction
    const milesByJurisdiction = {};
    
    // Process miles from trips
    trips.forEach(trip => {
      // If trip has start and end in same jurisdiction
      if (trip.start_jurisdiction === trip.end_jurisdiction && trip.start_jurisdiction) {
        if (!milesByJurisdiction[trip.start_jurisdiction]) {
          milesByJurisdiction[trip.start_jurisdiction] = {
            state: trip.start_jurisdiction,
            miles: 0,
            gallons: 0
          };
        }
        milesByJurisdiction[trip.start_jurisdiction].miles += parseFloat(trip.total_miles || 0);
      } 
      // If trip crosses jurisdictions, split miles between them
      else if (trip.start_jurisdiction && trip.end_jurisdiction) {
        if (!milesByJurisdiction[trip.start_jurisdiction]) {
          milesByJurisdiction[trip.start_jurisdiction] = {
            state: trip.start_jurisdiction,
            miles: 0,
            gallons: 0
          };
        }
        if (!milesByJurisdiction[trip.end_jurisdiction]) {
          milesByJurisdiction[trip.end_jurisdiction] = {
            state: trip.end_jurisdiction,
            miles: 0,
            gallons: 0
          };
        }
        
        // Split the miles between jurisdictions (simplified approach)
        const milesPerJurisdiction = parseFloat(trip.total_miles || 0) / 2;
        milesByJurisdiction[trip.start_jurisdiction].miles += milesPerJurisdiction;
        milesByJurisdiction[trip.end_jurisdiction].miles += milesPerJurisdiction;
      }
    });
    
    // Step 2: Calculate fuel by jurisdiction from fuel purchase data
    fuelData.forEach(entry => {
      const state = entry.state;
      if (state && entry.gallons) {
        if (!milesByJurisdiction[state]) {
          milesByJurisdiction[state] = {
            state: state,
            miles: 0,
            gallons: 0
          };
        }
        milesByJurisdiction[state].gallons += parseFloat(entry.gallons || 0);
      }
    });
    
    // Step 3: Calculate total miles and gallons
    let totalMiles = 0;
    let totalGallons = 0;
    
    Object.values(milesByJurisdiction).forEach(state => {
      totalMiles += state.miles;
      totalGallons += state.gallons;
    });
    
    // Calculate average MPG
    const avgMpg = totalGallons > 0 ? (totalMiles / totalGallons).toFixed(2) : 0;
    
    // Update state with calculated values
    setSummaryData(Object.values(milesByJurisdiction).sort((a, b) => b.miles - a.miles));
    setTotals({
      totalMiles,
      totalGallons,
      avgMpg
    });
  }, [trips, fuelData]); // Added proper dependencies here

  // Calculate summary when trips or fuel data changes
  useEffect(() => {
    if (trips.length === 0) return;
    
    calculateSummaryData();
  }, [trips, fuelData, calculateSummaryData]); // Added calculateSummaryData to the dependency array

  // Format numbers for display
  const formatNumber = (value, decimals = 1) => {
    return parseFloat(value || 0).toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };

  // Handle exporting to CSV
  const handleExportCSV = () => {
    if (summaryData.length === 0) return;
    
    // Create CSV content
    const headers = ["Jurisdiction", "Miles", "Gallons"];
    const rows = [
      headers.join(','),
      ...summaryData.map(state => [
        state.state,
        formatNumber(state.miles, 1),
        formatNumber(state.gallons, 3)
      ].join(','))
    ];
    
    // Add total row
    rows.push([
      "TOTAL",
      formatNumber(totals.totalMiles, 1),
      formatNumber(totals.totalGallons, 3)
    ].join(','));
    
    // Create and download the CSV file
    const csvContent = rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ifta_summary_${quarter.replace('-', '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle printing the summary
  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="bg-white shadow rounded-lg p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          <div className="h-4 bg-gray-200 rounded w-4/6"></div>
        </div>
      </div>
    );
  }

  if (trips.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center">
          <Truck size={40} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No IFTA Data Available</h3>
          <p className="mt-2 text-gray-500">Add trips to see your IFTA summary by state.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden print:shadow-none">
      <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 print:hidden">
        <div className="flex items-center">
          <Table size={20} className="text-blue-600 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">IFTA Miles & Gallons by Jurisdiction</h3>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="text-gray-500 hover:text-gray-700"
            title="Show information"
          >
            <Info size={20} />
          </button>
          
          <button
            onClick={handleExportCSV}
            className="text-gray-500 hover:text-gray-700"
            title="Export as CSV"
          >
            <FileDown size={20} />
          </button>
          
          <button
            onClick={handlePrint}
            className="text-gray-500 hover:text-gray-700"
            title="Print summary"
          >
            <Download size={20} />
          </button>
        </div>
      </div>
      
      {/* Title for print version */}
      <div className="hidden print:block px-6 pt-6">
        <h2 className="text-xl font-bold text-center">IFTA Summary for {quarter}</h2>
      </div>
      
      {showInfo && (
        <div className="bg-blue-50 p-4 print:hidden">
          <div className="flex">
            <Info size={20} className="text-blue-500 mr-2 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-blue-800">About this Summary</h4>
              <p className="text-sm text-blue-700 mt-1">
                This simplified IFTA summary shows your total miles driven and fuel purchased in each jurisdiction.
                You can provide this to your IFTA preparer or use it to complete your own IFTA tax return.
              </p>
              <p className="text-sm text-blue-700 mt-1">
                <span className="font-medium">Miles:</span> Total miles driven in each jurisdiction
                <br />
                <span className="font-medium">Gallons:</span> Total fuel purchased in each jurisdiction
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Compact stats at the top */}
      <div className="p-6 bg-gray-50 print:bg-white grid grid-cols-3 gap-4 border-b border-gray-200">
        <div>
          <p className="text-sm text-gray-500 font-medium">Total Miles</p>
          <p className="text-2xl font-bold">{formatNumber(totals.totalMiles)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500 font-medium">Total Gallons</p>
          <p className="text-2xl font-bold">{formatNumber(totals.totalGallons, 3)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500 font-medium">Average MPG</p>
          <p className="text-2xl font-bold">{totals.avgMpg}</p>
        </div>
      </div>
      
      <div className="p-6">
        {summaryData.length === 0 ? (
          <div className="text-center py-6">
            <AlertTriangle size={32} className="mx-auto text-yellow-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No Jurisdiction Data</h3>
            <p className="mt-2 text-gray-500">Your trips don&#39;t have jurisdiction information.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 print:bg-white">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Jurisdiction
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Miles
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gallons
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {summaryData.map((state, index) => (
                  <tr key={state.state} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50 print:bg-white'}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Flag size={16} className="text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-900">{state.state}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {formatNumber(state.miles)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {formatNumber(state.gallons, 3)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 print:bg-white">
                  <th scope="row" className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    TOTAL
                  </th>
                  <td className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                    {formatNumber(totals.totalMiles)}
                  </td>
                  <td className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                    {formatNumber(totals.totalGallons, 3)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
      
      <div className="px-6 py-4 bg-gray-50 print:bg-white print:hidden text-xs text-gray-500 border-t border-gray-200">
        For {quarter} • Based on {trips.length} trip records • Generated on {new Date().toLocaleDateString()}
      </div>
      
      {/* Print-only footer */}
      <div className="hidden print:block p-6 text-sm text-gray-500">
        <p>Quarter: {quarter} | Date Generated: {new Date().toLocaleDateString()}</p>
        <p>Based on {trips.length} trip records and {fuelData.length} fuel purchase records</p>
      </div>
    </div>
  );
}