// src/components/ifta/EnhancedIFTAFuelSync.js
"use client";

import { useState, useEffect, useRef } from "react";
import { 
  AlertTriangle, 
  Truck, 
  Fuel, 
  CheckCircle,
  Info,
  RefreshCw,
  BarChart2,
  MapPin
} from "lucide-react";

/**
 * Enhanced IFTAFuelSync Component (Simplified View)
 * Shows fuel data by state without combining with trip data
 */
export default function EnhancedIFTAFuelSync({ 
  userId, 
  quarter, 
  fuelData = [],
  trips = [],
  onSyncComplete,
  onError
}) {
  // Component state
  const [syncStatus, setSyncStatus] = useState('idle');
  const [fuelByState, setFuelByState] = useState({});
  const [totalFuelGallons, setTotalFuelGallons] = useState(0);
  const [uniqueStates, setUniqueStates] = useState([]);
  const [errorDetails, setErrorDetails] = useState(null);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  
  // Use a ref to track if analysis has been run
  const hasRun = useRef(false);
  // Track props changes
  const propsRef = useRef({ userId, quarter, fuelDataLength: fuelData.length });

  // Manual sync handler
  const handleManualSync = () => {
    // Only run if we have data
    if (userId && quarter) {
      console.log("Running manual fuel data analysis...");
      runAnalysis();
    }
  };

  // Key function to analyze data without causing infinite loops
  const runAnalysis = () => {
    // Guard against running in an infinite loop
    if (!userId || !quarter) return;
    
    try {
      console.log("Running fuel data analysis...");
      
      // Group fuel entries by state - only concerned with actual fuel purchases
      const fuelStateMap = {};
      let totalGallons = 0;
      
      fuelData.forEach(entry => {
        if (!entry.state) return;
        
        const state = entry.state;
        if (!fuelStateMap[state]) {
          fuelStateMap[state] = {
            state,
            gallons: 0,
            entries: []
          };
        }
        
        const gallons = parseFloat(entry.gallons || 0);
        fuelStateMap[state].gallons += gallons;
        totalGallons += gallons;
        fuelStateMap[state].entries.push(entry);
      });
      
      // Update state with calculated values
      setFuelByState(fuelStateMap);
      setTotalFuelGallons(totalGallons);
      setUniqueStates(Object.keys(fuelStateMap).sort());
      
      // Set status based on results
      setSyncStatus(Object.keys(fuelStateMap).length > 0 ? 'success' : 'empty');
      setLastSyncTime(new Date());
      
      // Mark as having run
      hasRun.current = true;
      
      // Notify parent component if needed
      if (onSyncComplete) {
        onSyncComplete({
          fuelByState: fuelStateMap,
          totalFuelGallons,
          uniqueStates: Object.keys(fuelStateMap)
        });
      }
      
      return fuelStateMap;
    } catch (error) {
      console.error("Error analyzing fuel data:", error);
      setErrorDetails(error.message || "An error occurred while analyzing fuel data");
      setSyncStatus('error');
      
      // Mark as having run despite error
      hasRun.current = true;
      
      // Notify parent component of error
      if (onError) {
        onError(error);
      }
      
      return null;
    }
  };

  // Run analysis only once on initial mount or when key props change
  useEffect(() => {
    // Check if props have changed significantly
    const currentProps = {
      userId,
      quarter,
      fuelDataLength: fuelData.length
    };
    
    const propsChanged = 
      currentProps.userId !== propsRef.current.userId ||
      currentProps.quarter !== propsRef.current.quarter ||
      currentProps.fuelDataLength !== propsRef.current.fuelDataLength;
    
    // Only run if not run before or if props changed
    if (!hasRun.current || propsChanged) {
      // Update props ref
      propsRef.current = currentProps;
      
      // Only run analysis if we have data
      if (userId && quarter && (fuelData.length > 0)) {
        runAnalysis();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, quarter, fuelData.length]);

  if (syncStatus === 'error') {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
        <div className="flex">
          <AlertTriangle className="h-6 w-6 text-red-500 mr-3" />
          <div>
            <h3 className="text-lg font-medium text-red-800">Fuel Data Sync Error</h3>
            <p className="text-red-700">
              {errorDetails || "Failed to analyze fuel purchase data. Please try again."}
            </p>
            
            <div className="mt-4">
              <button
                onClick={handleManualSync}
                className="px-4 py-2 bg-white border border-red-300 rounded-md text-red-700 text-sm font-medium hover:bg-red-50"
              >
                Retry Analysis
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (syncStatus === 'empty') {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-md mb-6">
        <div className="flex">
          <Fuel className="h-6 w-6 text-yellow-500 mr-3" />
          <div>
            <h3 className="text-lg font-medium text-yellow-800">No Fuel Purchase Data</h3>
            <p className="text-yellow-700">
              No fuel purchase data was found for this quarter. IFTA requires fuel purchase records by state.
            </p>
            
            <div className="mt-4">
              <a 
                href="/dashboard/fuel" 
                className="px-4 py-2 bg-white border border-yellow-300 rounded-md text-yellow-700 text-sm font-medium hover:bg-yellow-50"
              >
                Add Fuel Purchases
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (syncStatus === 'success') {
    return (
      <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-blue-50 to-white px-6 py-4 border-b border-blue-100">
          <div className="flex items-start">
            <Fuel className="h-6 w-6 text-blue-500 mr-3 mt-0.5" />
            <div>
              <h3 className="text-lg font-medium text-blue-800">Fuel Purchase Data by State</h3>
              <p className="text-blue-700">
                You have recorded {totalFuelGallons.toFixed(3)} gallons of fuel in {uniqueStates.length} states for this quarter.
                {lastSyncTime && ` Last updated: ${lastSyncTime.toLocaleTimeString()}`}
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-4">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    State
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fuel Gallons
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Purchases
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.values(fuelByState)
                  .sort((a, b) => b.gallons - a.gallons)
                  .map((state) => (
                    <tr key={state.state}>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <MapPin size={16} className="text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-gray-900">{state.state}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {state.gallons.toFixed(3)}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <div className="text-sm text-gray-500">
                          {state.entries.length} {state.entries.length === 1 ? 'purchase' : 'purchases'}
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100">
                  <th scope="row" className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                    TOTAL
                  </th>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                    {totalFuelGallons.toFixed(3)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-500">
                    {fuelData.length} entries
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="mt-6 bg-blue-50 rounded-lg p-4">
            <div className="flex items-start">
              <Info className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
              <div>
                <h5 className="text-sm font-medium text-blue-800">About Fuel Data for IFTA</h5>
                <p className="text-sm text-blue-700 mt-1">
                  Fuel purchase records are essential for IFTA reporting. You should have fuel receipts for each state where you purchase fuel.
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  Use the Fuel Tracker to enter all your fuel purchases properly categorized by state.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={handleManualSync}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
            >
              <RefreshCw size={16} className="inline-block mr-2" />
              Refresh Fuel Data
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Default loading or no data state
  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <div className="flex items-center">
        <Fuel className="h-6 w-6 text-blue-400 mr-3" />
        <div>
          <h3 className="text-lg font-medium text-gray-800">Fuel Data Analysis</h3>
          <p className="text-gray-600 mt-1">
            {!userId || !quarter 
              ? "Waiting for quarter selection..." 
              : fuelData.length === 0 
                ? "No fuel data available for this quarter." 
                : "Analyzing fuel data..."}
          </p>
        </div>
      </div>
    </div>
  );
}