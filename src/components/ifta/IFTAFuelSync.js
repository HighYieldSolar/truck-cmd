"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Check, 
  AlertTriangle, 
  RefreshCw, 
  Truck, 
  Fuel, 
  FileCheck,
  MapPin,
  CheckCircle,
  ArrowRight,
  Calendar,
  Info,
  Database
} from "lucide-react";

import { syncFuelDataWithIFTA, createMissingFuelOnlyTrips } from "@/lib/services/iftaService";

export default function IFTAFuelSync({ userId, quarter, onSyncComplete }) {
  const [syncStatus, setSyncStatus] = useState('idle'); // idle, loading, success, error
  const [syncResult, setSyncResult] = useState(null);
  const [errorDetails, setErrorDetails] = useState(null);
  const [autoFixEnabled, setAutoFixEnabled] = useState(false);
  const [fixResult, setFixResult] = useState(null);
  const [fixLoading, setFixLoading] = useState(false);

  // Define handleSync with useCallback to avoid dependency issues
  const handleSync = useCallback(async () => {
    try {
      if (!userId) {
        setErrorDetails("User ID is missing. Please make sure you're logged in.");
        setSyncStatus('error');
        return;
      }
      
      if (!quarter) {
        setErrorDetails("Quarter information is missing. Please select a valid quarter.");
        setSyncStatus('error');
        return;
      }
      
      setSyncStatus('loading');
      setSyncResult(null);
      setFixResult(null);
      setErrorDetails(null);
      
      console.log(`Starting IFTA sync for user ${userId} and quarter ${quarter}`);
      
      const result = await syncFuelDataWithIFTA(userId, quarter);
      
      // Check if result contains an error
      if (result.error) {
        console.error("Error returned from syncFuelDataWithIFTA:", result.errorMessage);
        throw new Error(result.errorMessage || "Sync failed");
      }
      
      setSyncResult(result);
      setSyncStatus('success');
      
      if (onSyncComplete) {
        onSyncComplete(result);
      }
    } catch (error) {
      console.error("Error syncing IFTA fuel data:", error);
      setSyncStatus('error');
      setErrorDetails(error.message || "An unknown error occurred during synchronization");
    }
  }, [userId, quarter, onSyncComplete]); // Include all dependencies

  // Check if database tables exist
  const checkDatabaseTables = useCallback(async () => {
    try {
      // Simple check to see if we have access to the necessary tables
      if (!userId) return false;
      
      // We'll try a minimal query just to check table existence
      const { error: fuelError } = await window.supabase
        .from('fuel_entries')
        .select('id')
        .eq('user_id', userId)
        .limit(1);
      
      const { error: iftaError } = await window.supabase
        .from('ifta_trip_records')
        .select('id')
        .eq('user_id', userId)
        .limit(1);
      
      // If either table doesn't exist, the query will return an error
      if (fuelError && fuelError.code === '42P01') {
        // Table doesn't exist error
        return false;
      }
      
      if (iftaError && iftaError.code === '42P01') {
        // Table doesn't exist error
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("Error checking database tables:", error);
      return false;
    }
  }, [userId]);

  // Run sync when component mounts or quarter changes
  useEffect(() => {
    if (userId && quarter) {
      // First check if tables exist
      checkDatabaseTables()
        .then(tablesExist => {
          if (!tablesExist) {
            setSyncStatus('error');
            setErrorDetails("Database tables not found. Please make sure your database is properly set up.");
            return;
          }
          
          // If tables exist, proceed with sync
          handleSync();
        })
        .catch(error => {
          console.error("Error checking database:", error);
          setSyncStatus('error');
          setErrorDetails("Failed to check database structure. Please try again later.");
        });
    }
  }, [userId, quarter, handleSync, checkDatabaseTables]); // Now correctly includes handleSync and checkDatabaseTables

  // Handle auto-fix operation
  const handleAutoFix = async () => {
    if (!syncResult || !syncResult.discrepancies || syncResult.discrepancies.length === 0) {
      return;
    }
    
    try {
      setFixLoading(true);
      
      const result = await createMissingFuelOnlyTrips(
        userId, 
        quarter, 
        syncResult.discrepancies
      );
      
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

  if (syncStatus === 'loading') {
    return (
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex justify-center items-center py-6">
          <RefreshCw size={32} className="animate-spin text-blue-500 mr-2" />
          <h3 className="text-lg font-medium text-gray-700">Syncing IFTA data with fuel purchases...</h3>
        </div>
      </div>
    );
  }

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
            
            {/* Debugging information - only show in non-production */}
            <div className="mt-2 p-2 bg-red-100 rounded text-xs text-red-800 font-mono overflow-auto max-h-32">
              <p>User ID: {userId || 'Not provided'}</p>
              <p>Quarter: {quarter || 'Not provided'}</p>
              <p>Last sync attempt: {new Date().toLocaleString()}</p>
            </div>
            
            <div className="mt-4 flex space-x-3">
              <button
                onClick={handleSync}
                className="px-4 py-2 bg-white border border-red-300 rounded-md text-red-700 text-sm font-medium hover:bg-red-50"
              >
                Retry Sync
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 text-sm font-medium hover:bg-gray-50"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!syncResult) {
    // Show a placeholder while waiting for initial data
    return (
      <div className="bg-white shadow rounded-lg p-6 mb-6 animate-pulse">
        <div className="flex items-center">
          <div className="rounded-full bg-gray-200 h-10 w-10"></div>
          <div className="ml-4 flex-1">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="mt-2 h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  // If no discrepancies, show success message
  if (!syncResult.hasDiscrepancies) {
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
  return (
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
            <RefreshCw size={16} className="inline-block mr-2" />
            Refresh Sync
          </button>
          
          <button
            onClick={handleAutoFix}
            disabled={!autoFixEnabled || fixLoading}
            className={`px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white ${
              autoFixEnabled
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-gray-300 cursor-not-allowed'
            } flex items-center`}
          >
            {fixLoading ? (
              <>
                <RefreshCw size={16} className="animate-spin mr-2" />
                Fixing...
              </>
            ) : (
              <>
                <FileCheck size={16} className="mr-2" />
                Create Fuel-Only Trips
              </>
            )}
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
                          {error.jurisdiction}: {error.error}
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
  );
}