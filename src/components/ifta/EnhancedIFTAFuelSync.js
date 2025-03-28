// src/components/ifta/EnhancedIFTAFuelSync.js
"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { 
  RefreshCw, 
  AlertTriangle, 
  Truck, 
  Fuel, 
  CheckCircle,
  ArrowRight,
  Info
} from "lucide-react";

/**
 * Enhanced IFTAFuelSync Component
 * Improved synchronization between fuel entries and IFTA trip records
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
  const [syncStatus, setSyncStatus] = useState('idle'); // idle, loading, success, error
  const [syncResults, setSyncResults] = useState(null);
  const [errorDetails, setErrorDetails] = useState(null);
  const [lastSyncTime, setLastSyncTime] = useState(null);

  // Helper function to fetch fuel data for a specific quarter
  const fetchFuelDataForQuarter = useCallback(async () => {
    try {
      if (!userId || !quarter) {
        throw new Error("User ID and quarter are required");
      }
      
      // Parse the quarter to get date range
      const [year, qPart] = quarter.split('-Q');
      const quarterNum = parseInt(qPart);
      
      if (isNaN(quarterNum) || quarterNum < 1 || quarterNum > 4) {
        throw new Error("Invalid quarter format. Use YYYY-QN (e.g., 2023-Q1)");
      }
      
      // Calculate quarter date range
      const startMonth = (quarterNum - 1) * 3;
      const startDate = new Date(parseInt(year), startMonth, 1);
      const endDate = new Date(parseInt(year), startMonth + 3, 0);
      
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      console.log(`Looking for fuel entries from ${startDateStr} to ${endDateStr}`);
      
      // Query fuel entries within the date range
      const { data, error } = await supabase
        .from('fuel_entries')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDateStr)
        .lte('date', endDateStr)
        .order('date', { ascending: true });
      
      if (error) {
        console.error("Error fetching fuel entries:", error);
        throw error;
      }
      
      console.log(`Found ${data?.length || 0} fuel entries for the quarter`);
      
      return data || [];
    } catch (error) {
      console.error('Error fetching fuel data for quarter:', error);
      throw error;
    }
  }, [userId, quarter]);

  // Helper function to analyze and sync fuel data with IFTA
  const analyzeFuelSync = useCallback(async () => {
    try {
      setSyncStatus('loading');
      setErrorDetails(null);
      
      // Use provided fuel data or fetch it if not provided
      const fuelEntries = fuelData.length > 0 ? fuelData : await fetchFuelDataForQuarter();
      
      // Group fuel entries by state
      const fuelByState = {};
      fuelEntries.forEach(entry => {
        if (!entry.state) return;
        
        const state = entry.state;
        if (!fuelByState[state]) {
          fuelByState[state] = {
            state,
            gallons: 0,
            entries: []
          };
        }
        
        fuelByState[state].gallons += parseFloat(entry.gallons || 0);
        fuelByState[state].entries.push(entry);
      });
      
      // Calculate total gallons in trips by state/jurisdiction
      const tripGallonsByState = {};
      trips.forEach(trip => {
        if (trip.gallons && trip.gallons > 0) {
          // If start and end jurisdictions are the same
          if (trip.start_jurisdiction === trip.end_jurisdiction && trip.start_jurisdiction) {
            const state = trip.start_jurisdiction;
            if (!tripGallonsByState[state]) {
              tripGallonsByState[state] = 0;
            }
            tripGallonsByState[state] += parseFloat(trip.gallons);
          } 
          // If trip crosses jurisdictions, split fuel between them (50/50)
          else if (trip.start_jurisdiction && trip.end_jurisdiction) {
            const startState = trip.start_jurisdiction;
            const endState = trip.end_jurisdiction;
            
            if (!tripGallonsByState[startState]) {
              tripGallonsByState[startState] = 0;
            }
            if (!tripGallonsByState[endState]) {
              tripGallonsByState[endState] = 0;
            }
            
            const gallonsPerState = parseFloat(trip.gallons) / 2;
            tripGallonsByState[startState] += gallonsPerState;
            tripGallonsByState[endState] += gallonsPerState;
          }
        }
      });
      
      // Find discrepancies between fuel purchases and IFTA trips
      const discrepancies = [];
      
      // Check states with fuel purchases
      Object.values(fuelByState).forEach(state => {
        const stateName = state.state;
        const fuelGallons = state.gallons;
        const tripGallons = tripGallonsByState[stateName] || 0;
        
        const difference = fuelGallons - tripGallons;
        // Use a small threshold to account for rounding errors
        if (Math.abs(difference) > 0.001) {
          discrepancies.push({
            state: stateName,
            fuelGallons,
            tripGallons,
            difference,
            needsAttention: difference > 0, // Positive difference means more fuel than accounted for in trips
          });
        }
      });
      
      // Check states with trips but no fuel purchases
      Object.entries(tripGallonsByState).forEach(([stateName, tripGallons]) => {
        if (!fuelByState[stateName] && tripGallons > 0) {
          discrepancies.push({
            state: stateName,
            fuelGallons: 0,
            tripGallons,
            difference: -tripGallons, // Negative because there's no fuel but there are trip gallons
            needsAttention: false,    // No action needed if trips account for more gallons
          });
        }
      });
      
      // Sort discrepancies by absolute difference (largest first)
      discrepancies.sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference));
      
      // Calculate summary stats
      const totalFuelGallons = Object.values(fuelByState).reduce((sum, state) => sum + state.gallons, 0);
      const totalTripGallons = Object.values(tripGallonsByState).reduce((sum, gallons) => sum + gallons, 0);
      const syncResults = {
        totalFuelGallons,
        totalTripGallons,
        discrepancies,
        netDifference: totalFuelGallons - totalTripGallons,
        isBalanced: Math.abs(totalFuelGallons - totalTripGallons) < 0.01, // Consider balanced if very close
        states: {
          fuelStates: Object.keys(fuelByState),
          tripStates: Object.keys(tripGallonsByState)
        }
      };
      
      setSyncResults(syncResults);
      setSyncStatus('success');
      setLastSyncTime(new Date());
      
      // Notify parent component if needed
      if (onSyncComplete) {
        onSyncComplete(syncResults);
      }
      
      return syncResults;
    } catch (error) {
      console.error("Error analyzing fuel sync:", error);
      setErrorDetails(error.message || "An error occurred while analyzing fuel and IFTA data");
      setSyncStatus('error');
      
      // Notify parent component of error
      if (onError) {
        onError(error);
      }
      
      return null;
    }
  }, [userId, quarter, fuelData, trips, fetchFuelDataForQuarter, onSyncComplete, onError]);

  // Run analysis on initial mount
  useEffect(() => {
    if (userId && quarter) {
      analyzeFuelSync();
    }
  }, [analyzeFuelSync]);

  // Handle manual sync request
  const handleSync = () => {
    analyzeFuelSync();
  };

  if (syncStatus === 'loading') {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center justify-center">
          <RefreshCw size={20} className="animate-spin text-blue-500 mr-2" />
          <p className="text-gray-700">Analyzing fuel and IFTA data...</p>
        </div>
      </div>
    );
  }

  if (syncStatus === 'error') {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
        <div className="flex">
          <AlertTriangle className="h-6 w-6 text-red-500 mr-3" />
          <div>
            <h3 className="text-lg font-medium text-red-800">Sync Error</h3>
            <p className="text-red-700">
              {errorDetails || "Failed to synchronize IFTA data with fuel purchases. Please try again."}
            </p>
            
            <div className="mt-4">
              <button
                onClick={handleSync}
                className="px-4 py-2 bg-white border border-red-300 rounded-md text-red-700 text-sm font-medium hover:bg-red-50"
              >
                Retry Sync
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (syncResults && syncResults.isBalanced) {
    return (
      <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-md mb-6">
        <div className="flex">
          <CheckCircle className="h-6 w-6 text-green-500 mr-3" />
          <div>
            <h3 className="text-lg font-medium text-green-800">IFTA and Fuel Data are Synced</h3>
            <p className="text-green-700">
              Your IFTA trip data and fuel purchases are synchronized correctly.
              Total Fuel: {syncResults.totalFuelGallons.toFixed(3)} gallons
              | Total Trip Gallons: {syncResults.totalTripGallons.toFixed(3)} gallons
              {lastSyncTime && ` | Last synced: ${lastSyncTime.toLocaleTimeString()}`}
            </p>
            
            <div className="mt-4">
              <button
                onClick={handleSync}
                className="px-4 py-2 bg-white border border-green-300 rounded-md text-green-700 text-sm font-medium hover:bg-green-50"
              >
                <RefreshCw size={16} className="inline-block mr-1" />
                Refresh Sync
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show summary with discrepancies
  return syncResults ? (
    <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
      <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-4">
        <div className="flex items-start">
          <AlertTriangle className="h-6 w-6 text-yellow-500 mr-3 mt-0.5" />
          <div>
            <h3 className="text-lg font-medium text-yellow-800">IFTA and Fuel Data Mismatch</h3>
            <p className="text-yellow-700">
              There are discrepancies between your fuel purchases and IFTA trip records.
              Total fuel gallons: {syncResults.totalFuelGallons.toFixed(3)} | 
              Total trip gallons: {syncResults.totalTripGallons.toFixed(3)} | 
              Difference: {Math.abs(syncResults.netDifference).toFixed(3)} gallons
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 py-4">
        <h4 className="text-md font-medium text-gray-700 mb-3">State-by-State Analysis</h4>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  State
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fuel Gallons
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trip Gallons
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Difference
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {syncResults.discrepancies.map((discrepancy, index) => (
                <tr key={discrepancy.state} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{discrepancy.state}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {discrepancy.fuelGallons.toFixed(3)}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {discrepancy.tripGallons.toFixed(3)}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className={`text-sm font-medium ${discrepancy.difference > 0 ? 'text-red-600' : 'text-blue-600'}`}>
                      {discrepancy.difference > 0 ? '+' : ''}{discrepancy.difference.toFixed(3)}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {discrepancy.needsAttention ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        Update needed
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        OK
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 bg-blue-50 rounded-lg p-4">
          <div className="flex items-start">
            <Info className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
            <div>
              <h5 className="text-sm font-medium text-blue-800">How to Fix Discrepancies</h5>
              <p className="text-sm text-blue-700 mt-1">
                If you see more fuel than trip gallons for a state (positive difference), you should:
              </p>
              <ul className="list-disc pl-5 mt-1 space-y-1 text-sm text-blue-700">
                <li>Add any missing trips that used fuel in that state</li>
                <li>Update existing trips to include the correct gallons used</li>
                <li>Double-check that your fuel purchases are correctly categorized by state</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={handleSync}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
          >
            <RefreshCw size={16} className="inline-block mr-1" />
            Refresh Analysis
          </button>
        </div>
      </div>
    </div>
  ) : null;
}