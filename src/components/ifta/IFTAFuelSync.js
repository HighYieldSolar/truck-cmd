"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { 
  Check, 
  AlertTriangle, 
  Truck, 
  Fuel, 
  FileCheck,
  MapPin,
  CheckCircle,
  ArrowRight,
  Calendar,
  Info,
  Database,
  RefreshCw
} from "lucide-react";

/**
 * IFTAFuelSync Component
 * Handles synchronization between fuel entries and IFTA trip records
 * Detects discrepancies and offers to create fuel-only trips
 */
export default function IFTAFuelSync({ userId, quarter, onSyncComplete }) {
  // Component state with improved defaults
  const [syncStatus, setSyncStatus] = useState('idle'); // idle, success, error
  const [syncResult, setSyncResult] = useState(null);
  const [errorDetails, setErrorDetails] = useState(null);
  const [autoFixEnabled, setAutoFixEnabled] = useState(false);
  const [fixResult, setFixResult] = useState(null);
  const [fixLoading, setFixLoading] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [syncComplete, setSyncComplete] = useState(false);

  // Helper function to sync fuel data with IFTA
  const syncFuelDataWithIFTA = useCallback(async () => {
    try {
      if (!userId) {
        throw new Error("User ID is required");
      }
      
      if (!quarter) {
        throw new Error("Quarter is required");
      }
      
      console.log(`Starting IFTA fuel sync for user ${userId}, quarter ${quarter}`);
      
      // Get fuel data for the quarter
      const fuelData = await fetchFuelDataForIFTA(userId, quarter);
      console.log(`Fetched fuel data: ${fuelData.length} state entries`);
      
      // Get existing IFTA trip records for the quarter
      let existingTrips;
      try {
        const { data, error: tripsError } = await supabase
          .from('ifta_trip_records')
          .select('id, vehicle_id, start_jurisdiction, end_jurisdiction, gallons, fuel_cost')
          .eq('user_id', userId)
          .eq('quarter', quarter);
            
        if (tripsError) {
          console.error("Supabase error fetching trips:", tripsError);
          throw tripsError;
        }
          
        existingTrips = data || [];
        console.log(`Fetched ${existingTrips.length} IFTA trip records`);
      } catch (tripsError) {
        console.error("Error fetching IFTA trips:", tripsError);
        throw new Error(`Failed to fetch IFTA trips: ${tripsError.message}`);
      }
      
      // Calculate total fuel gallons by trip jurisdiction (for comparison)
      const existingFuelByJurisdiction = {};
      
      for (const trip of existingTrips) {
        if (trip.gallons && trip.gallons > 0) {
          // If trip has start and end in same jurisdiction
          if (trip.start_jurisdiction === trip.end_jurisdiction && trip.start_jurisdiction) {
            if (!existingFuelByJurisdiction[trip.start_jurisdiction]) {
              existingFuelByJurisdiction[trip.start_jurisdiction] = 0;
            }
            existingFuelByJurisdiction[trip.start_jurisdiction] += parseFloat(trip.gallons);
          } 
          // If trip crosses jurisdictions, split fuel between them
          else if (trip.start_jurisdiction && trip.end_jurisdiction) {
            if (!existingFuelByJurisdiction[trip.start_jurisdiction]) {
              existingFuelByJurisdiction[trip.start_jurisdiction] = 0;
            }
            if (!existingFuelByJurisdiction[trip.end_jurisdiction]) {
              existingFuelByJurisdiction[trip.end_jurisdiction] = 0;
            }
            
            // Split the gallons between jurisdictions (simplified approach)
            const gallonsPerJurisdiction = parseFloat(trip.gallons) / 2;
            existingFuelByJurisdiction[trip.start_jurisdiction] += gallonsPerJurisdiction;
            existingFuelByJurisdiction[trip.end_jurisdiction] += gallonsPerJurisdiction;
          }
        }
      }
      
      // Compare the fuel data from purchases with what's recorded in trips
      const discrepancies = {};
      const fuelByState = {};
      
      fuelData.forEach(stateData => {
        const jurisdiction = stateData.jurisdiction;
        fuelByState[jurisdiction] = {
          gallonsFromPurchases: stateData.gallons,
          gallonsFromTrips: existingFuelByJurisdiction[jurisdiction] || 0,
          entries: stateData.entries
        };
        
        // Calculate discrepancy
        const discrepancy = stateData.gallons - (existingFuelByJurisdiction[jurisdiction] || 0);
        
        if (Math.abs(discrepancy) > 0.001) { // Small tolerance for floating point comparison
          discrepancies[jurisdiction] = {
            jurisdiction,
            stateName: stateData.stateName,
            gallonsFromPurchases: stateData.gallons,
            gallonsFromTrips: existingFuelByJurisdiction[jurisdiction] || 0,
            discrepancy
          };
        }
      });
      
      console.log(`Found ${Object.keys(discrepancies).length} jurisdictions with discrepancies`);
      
      return {
        fuelData,
        existingTrips,
        fuelByState,
        discrepancies: Object.values(discrepancies),
        hasDiscrepancies: Object.keys(discrepancies).length > 0
      };
    } catch (error) {
      console.error('Error syncing fuel data with IFTA:', error);
      
      return {
        error: true,
        errorMessage: error.message || "Failed to sync IFTA data",
        fuelData: [],
        existingTrips: [],
        fuelByState: {},
        discrepancies: [],
        hasDiscrepancies: false
      };
    }
  }, [userId, quarter]);

  // Fetch fuel data for a specific quarter
  const fetchFuelDataForIFTA = async (userId, quarter) => {
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
      
      // Query fuel entries within the date range
      const { data, error } = await supabase
        .from('fuel_entries')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDateStr)
        .lte('date', endDateStr)
        .order('date', { ascending: true });
      
      if (error) {
        console.error("Supabase error fetching fuel entries:", error);
        throw error;
      }
      
      // Process data for IFTA use - group by jurisdiction (state)
      const fuelByState = {};
      
      (data || []).forEach(entry => {
        if (!entry.state) return;
        
        if (!fuelByState[entry.state]) {
          fuelByState[entry.state] = {
            jurisdiction: entry.state,
            stateName: entry.state_name || entry.state,
            gallons: 0,
            amount: 0,
            entries: []
          };
        }
        
        fuelByState[entry.state].gallons += parseFloat(entry.gallons || 0);
        fuelByState[entry.state].amount += parseFloat(entry.total_amount || 0);
        fuelByState[entry.state].entries.push({
          id: entry.id,
          date: entry.date,
          gallons: parseFloat(entry.gallons || 0),
          amount: parseFloat(entry.total_amount || 0),
          location: entry.location,
          vehicle: entry.vehicle_id
        });
      });
      
      // Convert to array format
      return Object.values(fuelByState);
    } catch (error) {
      console.error('Error fetching fuel data for IFTA:', error);
      throw new Error(`Failed to fetch fuel data: ${error.message || "Unknown error"}`);
    }
  };

  // Create "fuel-only" trips in IFTA for jurisdictions with positive discrepancies
  const createMissingFuelOnlyTrips = async () => {
    if (!syncResult || !syncResult.discrepancies || syncResult.discrepancies.length === 0) {
      return { createdTrips: [], errors: [] };
    }
    
    try {
      const createdTrips = [];
      const errors = [];
      
      // Create a fuel-only trip for each jurisdiction with positive discrepancy
      // (meaning there's more fuel purchased than accounted for in trips)
      for (const disc of syncResult.discrepancies) {
        if (disc.discrepancy <= 0) continue; // Skip if no positive discrepancy
        
        // Parse quarter for date
        const [year, qPart] = quarter.split('-Q');
        const quarterNum = parseInt(qPart);
        const startMonth = (quarterNum - 1) * 3;
        const midQuarterDate = new Date(parseInt(year), startMonth + 1, 15);
        const formattedDate = midQuarterDate.toISOString().split('T')[0];
        
        // Try to get a vehicle ID from fuel purchases in this state
        let vehicleId = null;
        const stateData = syncResult.fuelData.find(s => s.jurisdiction === disc.jurisdiction);
        if (stateData && stateData.entries && stateData.entries.length > 0) {
          // Use most recent vehicle that purchased fuel in this jurisdiction
          const sortedEntries = [...stateData.entries].sort((a, b) => 
            new Date(b.date) - new Date(a.date)
          );
          vehicleId = sortedEntries[0].vehicle;
        }
        
        // Create a "fuel only" trip record
        const tripData = {
          user_id: userId,
          quarter: quarter,
          start_date: formattedDate,
          end_date: formattedDate,
          start_jurisdiction: disc.jurisdiction,
          end_jurisdiction: disc.jurisdiction,
          vehicle_id: vehicleId || 'Unknown', // Use vehicle from fuel purchase if available
          total_miles: 0, // Zero miles since this is just to account for fuel purchases
          gallons: disc.discrepancy,
          fuel_cost: 0, // Can be updated later if needed
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_fuel_only: true, // Add a flag to mark this as a special fuel-only trip
          notes: `Auto-generated to account for ${disc.discrepancy.toFixed(3)} gallons of fuel purchased in ${disc.stateName || disc.jurisdiction} but not associated with trips.`
        };
        
        try {
          const { data, error } = await supabase
            .from('ifta_trip_records')
            .insert([tripData])
            .select();
              
          if (error) throw error;
          
          if (data && data.length > 0) {
            createdTrips.push(data[0]);
          }
        } catch (err) {
          console.error(`Error creating fuel-only trip for ${disc.jurisdiction}:`, err);
          errors.push({
            jurisdiction: disc.jurisdiction,
            error: err.message
          });
        }
      }
      
      return {
        createdTrips,
        errors
      };
    } catch (error) {
      console.error('Error creating missing fuel-only trips:', error);
      return { 
        createdTrips: [], 
        errors: [{
          general: error.message
        }] 
      };
    }
  };

  // Run sync when component mounts or quarter changes
  useEffect(() => {
    // Only run once and when dependencies change
    if (isFirstLoad && userId && quarter && !syncComplete) {
      setIsFirstLoad(false);
      
      // Run the sync
      const doSync = async () => {
        try {
          // Don't change the sync status here - no more flashing UI
          setErrorDetails(null);
          
          console.log(`Starting IFTA sync for user ${userId} and quarter ${quarter}`);
          
          const result = await syncFuelDataWithIFTA();
          
          // Check if result contains an error
          if (result.error) {
            console.error("Error returned from syncFuelDataWithIFTA:", result.errorMessage);
            throw new Error(result.errorMessage || "Sync failed");
          }
          
          setSyncResult(result);
          setSyncStatus('success');
          setSyncComplete(true);
          
          if (onSyncComplete) {
            onSyncComplete(result);
          }
        } catch (error) {
          console.error("Error syncing IFTA fuel data:", error);
          setSyncStatus('error');
          setErrorDetails(error.message || "An unknown error occurred during synchronization");
        }
      };
      
      doSync();
    }
  }, [userId, quarter, syncFuelDataWithIFTA, isFirstLoad, syncComplete, onSyncComplete]);

  // Reset sync complete when quarter changes
  useEffect(() => {
    setSyncComplete(false);
  }, [quarter]);

  // Handle manual sync
  const handleSync = async () => {
    try {
      setSyncComplete(false);
      setFixResult(null);
      setErrorDetails(null);
      
      console.log(`Starting manual IFTA sync for user ${userId} and quarter ${quarter}`);
      
      const result = await syncFuelDataWithIFTA();
      
      // Check if result contains an error
      if (result.error) {
        console.error("Error returned from syncFuelDataWithIFTA:", result.errorMessage);
        throw new Error(result.errorMessage || "Sync failed");
      }
      
      setSyncResult(result);
      setSyncStatus('success');
      setSyncComplete(true);
      
      if (onSyncComplete) {
        onSyncComplete(result);
      }
    } catch (error) {
      console.error("Error syncing IFTA fuel data:", error);
      setSyncStatus('error');
      setErrorDetails(error.message || "An unknown error occurred during synchronization");
    }
  };

  // Handle auto-fix operation
  const handleAutoFix = async () => {
    if (!syncResult || !syncResult.discrepancies || syncResult.discrepancies.length === 0) {
      return;
    }
    
    try {
      setFixLoading(true);
      
      const result = await createMissingFuelOnlyTrips();
      
      setFixResult(result);
      
      // Refresh sync data to show the changes
      await handleSync();
    } catch (error) {
      console.error("Error fixing IFTA fuel discrepancies:", error);
      setErrorDetails(`Failed to create fuel-only trips: ${error.message}`);
      setSyncStatus('error');
    } finally {
      setFixLoading(false);
    }
  };

  // Function to toggle auto-fix option
  const toggleAutoFix = () => {
    setAutoFixEnabled(!autoFixEnabled);
  };

  // Format gallons to show 3 decimal places
  const formatGallons = (gallons) => {
    return parseFloat(gallons).toFixed(3);
  };

  // Show meaningful error with action buttons
  if (syncStatus === 'error') {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md mb-6">
        <div className="flex">
          <AlertTriangle className="h-6 w-6 text-red-500 mr-3" />
          <div>
            <h3 className="text-lg font-medium text-red-800">Sync Error</h3>
            <p className="text-red-700">
              {errorDetails || "Failed to synchronize IFTA data with fuel purchases. Please try again."}
            </p>
            
            <div className="mt-4 flex space-x-3">
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

  // Handle case when no data is available yet - prevent flickering
  if (!syncResult && !syncComplete) {
    return null;
  }

  // If no discrepancies, show success message
  if (syncResult && !syncResult.hasDiscrepancies) {
    return (
      <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-md mb-6">
        <div className="flex">
          <CheckCircle className="h-6 w-6 text-green-500 mr-3" />
          <div>
            <h3 className="text-lg font-medium text-green-800">Data In Sync</h3>
            <p className="text-green-700">
              Your IFTA trip data and fuel purchases are synchronized correctly. 
              All fuel purchases have corresponding trip records.
            </p>
            <p className="text-sm text-green-600 mt-2">
              Total Fuel: {formatGallons(syncResult.fuelData.reduce((sum, state) => sum + state.gallons, 0))} gallons 
              across {syncResult.fuelData.length} jurisdiction{syncResult.fuelData.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show discrepancies and offer to fix them
  return syncResult ? (
    <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
      <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-4">
        <div className="flex items-start">
          <AlertTriangle className="h-6 w-6 text-yellow-500 mr-3 mt-0.5" />
          <div>
            <h3 className="text-lg font-medium text-yellow-800">IFTA Data Discrepancies Detected</h3>
            <p className="text-yellow-700">
              There are discrepancies between your fuel purchases and IFTA trip records.
              This may affect your IFTA reporting accuracy.
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 py-4">
        <h4 className="text-md font-medium text-gray-700 mb-3">Discrepancy Summary</h4>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Jurisdiction
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fuel Purchased
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fuel in Trips
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Discrepancy
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {syncResult.discrepancies.map((disc, index) => (
                <tr key={disc.jurisdiction} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <MapPin size={16} className="text-gray-400 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {disc.stateName}
                        </div>
                        <div className="text-xs text-gray-500">{disc.jurisdiction}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatGallons(disc.gallonsFromPurchases)} gal
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatGallons(disc.gallonsFromTrips)} gal
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className={`text-sm font-medium ${disc.discrepancy > 0 ? 'text-red-600' : 'text-blue-600'}`}>
                      {disc.discrepancy > 0 ? '+' : ''}{formatGallons(disc.discrepancy)} gal
                    </div>
                    <div className="text-xs text-gray-500">
                      {disc.discrepancy > 0 
                        ? 'More fuel purchased than in trips' 
                        : 'More fuel in trips than purchased'}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {disc.discrepancy > 0 ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        Needs fuel-only trip
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        Manual review needed
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
              <h5 className="text-sm font-medium text-blue-800">What This Means</h5>
              <p className="text-sm text-blue-700 mt-1">
                Positive discrepancies mean you&apos;ve purchased fuel in a jurisdiction but don&apos;t have enough 
                corresponding trip miles to account for it. This can be fixed by creating &quot;fuel-only&quot; trips
                to balance your IFTA records.
              </p>
              <p className="text-sm text-blue-700 mt-1">
                Negative discrepancies mean you have more fuel recorded in trips than actual purchases.
                This may require reviewing your trip data for accuracy.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <label className="flex items-center text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              checked={autoFixEnabled}
              onChange={toggleAutoFix}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2"
            />
            Automatically create &quot;fuel-only&quot; trips to account for excess fuel purchases
          </label>
          <p className="text-xs text-gray-500 ml-6 mt-1">
            This will create zero-mile trips in jurisdictions where you have more fuel purchased than accounted for in trips.
          </p>
        </div>

        <div className="mt-4 flex justify-between">
          <button
            onClick={handleSync}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Refresh Sync
          </button>
          
          <button
            onClick={handleAutoFix}
            disabled={!autoFixEnabled}
            className={`px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white ${
              autoFixEnabled
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-gray-300 cursor-not-allowed'
            } flex items-center`}
          >
            <FileCheck size={16} className="mr-2" />
            Create Fuel-Only Trips
          </button>
        </div>
        
        {/* Results from auto-fix */}
        {fixResult && (
          <div className="mt-4 border-t border-gray-200 pt-4">
            <h5 className="text-md font-medium text-gray-700 mb-2">Fix Results</h5>
            
            {fixResult.createdTrips && fixResult.createdTrips.length > 0 ? (
              <>
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="flex items-center">
                    <CheckCircle size={18} className="text-green-500 mr-2" />
                    <p className="text-sm text-green-700">
                      Created {fixResult.createdTrips.length} fuel-only trip{fixResult.createdTrips.length !== 1 ? 's' : ''} successfully
                    </p>
                  </div>
                </div>
                
                <div className="mt-2">
                  <h6 className="text-xs font-medium text-gray-500 uppercase mb-2">Created Trips</h6>
                  <ul className="space-y-2">
                    {fixResult.createdTrips.map(trip => (
                      <li key={trip.id} className="bg-gray-50 p-2 rounded text-sm">
                        <div className="flex items-center">
                          <Truck size={14} className="text-gray-400 mr-2" />
                          <span className="font-medium">
                            {trip.start_jurisdiction} - {formatGallons(trip.gallons)} gallons
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 ml-6 mt-1">
                          {trip.notes}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-500">No trips were created. No positive discrepancies to fix.</p>
            )}
            
            {fixResult.errors && fixResult.errors.length > 0 && (
              <div className="mt-3 bg-red-50 p-3 rounded-lg">
                <div className="flex items-start">
                  <AlertTriangle size={18} className="text-red-500 mr-2 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-700">
                      Failed to create some trips
                    </p>
                    <ul className="mt-1 text-xs text-red-600 list-disc list-inside">
                      {fixResult.errors.map((error, idx) => (
                        <li key={idx}>
                          {error.jurisdiction ? `${error.jurisdiction}: ${error.error}` : error.error || "Unknown error"}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  ) : null; // Return null if no syncResult, to avoid flicker
}