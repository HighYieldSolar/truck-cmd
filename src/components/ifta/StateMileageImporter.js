// src/components/ifta/StateMileageImporter.js
"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  Upload,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  FileText,
  Plus,
  ArrowRight,
  RouteOff,
  ChevronDown,
  ChevronRight
} from "lucide-react";

export default function StateMileageImporter({
  userId,
  quarter,
  onImportComplete,
  showImportedTrips = false
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [selectedLoads, setSelectedLoads] = useState([]);
  const [loadData, setLoadData] = useState([]);
  const [importedTrips, setImportedTrips] = useState([]);
  const [importCount, setImportCount] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  // Fetch loads from state mileage tracker that haven't been imported to IFTA
  const fetchAvailableLoads = async () => {
    if (!userId || !quarter) return;

    try {
      setLoading(true);
      setError(null);

      // Parse quarter into date range
      const [year, q] = quarter.split('-Q');
      const quarterStartMonth = (parseInt(q) - 1) * 3;
      const startDate = new Date(parseInt(year), quarterStartMonth, 1);
      const endDate = new Date(parseInt(year), quarterStartMonth + 3, 0);

      // Fetch loads from the state mileage tracker within the quarter
      const { data: loads, error: loadError } = await supabase
        .from('loads')
        .select(`
          id,
          load_number,
          origin,
          destination,
          completed_at,
          route_details->mileageByState,
          vehicle_id
        `)
        .eq('user_id', userId)
        .eq('status', 'Completed')
        .gte('completed_at', startDate.toISOString())
        .lte('completed_at', endDate.toISOString())
        .not('route_details->mileageByState', 'is', null);

      if (loadError) throw loadError;

      // Check which loads have already been imported
      const { data: existingTrips, error: tripError } = await supabase
        .from('ifta_trip_records')
        .select('load_id')
        .eq('user_id', userId)
        .eq('quarter', quarter)
        .not('load_id', 'is', null);

      if (tripError) throw tripError;

      const importedLoadIds = new Set(existingTrips?.map(trip => trip.load_id));

      // Filter out already imported loads
      const availableLoads = loads?.filter(load => !importedLoadIds.has(load.id)) || [];

      setLoadData(availableLoads);
      setSuccess(false);
    } catch (err) {
      console.error('Error fetching loads:', err);
      setError('Failed to fetch available loads');
    } finally {
      setLoading(false);
    }
  };

  // Import selected loads into IFTA trip records
  const importLoads = async () => {
    if (selectedLoads.length === 0) {
      setError('Please select at least one load to import');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setImportedTrips([]);

      const tripsToInsert = [];

      for (const load of selectedLoads) {
        const mileageByState = load.route_details?.mileageByState;

        if (!mileageByState) continue;

        // Convert the mileage by state data into IFTA trip records
        const states = Object.keys(mileageByState);

        for (let i = 0; i < states.length; i++) {
          const startState = states[i];
          const endState = states[i + 1] || states[i]; // If last state, use same state
          const miles = mileageByState[startState];

          if (miles > 0) {
            tripsToInsert.push({
              user_id: userId,
              quarter: quarter,
              start_date: load.completed_at,
              end_date: load.completed_at,
              vehicle_id: load.vehicle_id,
              start_jurisdiction: startState,
              end_jurisdiction: endState,
              total_miles: miles,
              load_id: load.id,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          }
        }
      }

      if (tripsToInsert.length === 0) {
        setError('No valid trips to import from selected loads');
        return;
      }

      // Insert trips into IFTA database
      const { data: insertedTrips, error: insertError } = await supabase
        .from('ifta_trip_records')
        .insert(tripsToInsert)
        .select();

      if (insertError) throw insertError;

      setImportedTrips(insertedTrips || []);
      setImportCount(insertedTrips?.length || 0);
      setSuccess(true);
      setSelectedLoads([]);

      // Refresh available loads
      await fetchAvailableLoads();

      // Notify parent component
      if (onImportComplete) {
        onImportComplete();
      }
    } catch (err) {
      console.error('Error importing loads:', err);
      setError('Failed to import loads to IFTA');
    } finally {
      setLoading(false);
    }
  };

  // Handle load selection
  const handleLoadSelection = (load) => {
    setSelectedLoads(prev => {
      const isSelected = prev.some(l => l.id === load.id);
      if (isSelected) {
        return prev.filter(l => l.id !== load.id);
      } else {
        return [...prev, load];
      }
    });
  };

  // Select/deselect all loads
  const handleSelectAll = () => {
    if (selectedLoads.length === loadData.length) {
      setSelectedLoads([]);
    } else {
      setSelectedLoads(loadData);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
      <div className="bg-gradient-to-r from-green-600 to-green-500 px-5 py-4 text-white">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold flex items-center">
            <RouteOff size={18} className="mr-2" />
            Import from State Mileage Tracker
          </h3>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-white hover:text-green-100 flex items-center text-sm"
          >
            {isExpanded ? (
              <>
                <ChevronDown size={16} className="mr-1" />
                Hide
              </>
            ) : (
              <>
                <ChevronRight size={16} className="mr-1" />
                Show
              </>
            )}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-6">
          {success && (
            <div className="mb-6 bg-green-50 border-l-4 border-green-400 p-4 rounded-md flex items-start">
              <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-800">Import Successful!</p>
                <p className="text-sm text-green-700">
                  Successfully imported {importCount} trips from selected loads.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-md flex items-start">
              <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 mr-2 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-4">
              Import completed loads from your State Mileage Tracker to automatically create IFTA trip records
              based on the mileage by state data.
            </p>

            <button
              onClick={fetchAvailableLoads}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="animate-spin mr-2" />
                  Loading...
                </>
              ) : (
                <>
                  <Upload size={16} className="mr-2" />
                  Check for Available Loads
                </>
              )}
            </button>
          </div>

          {loadData.length > 0 && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                <h4 className="text-sm font-medium text-gray-700">Available Loads to Import</h4>
                <button
                  onClick={handleSelectAll}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {selectedLoads.length === loadData.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              <div className="max-h-64 overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Select
                      </th>
                      <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Load #
                      </th>
                      <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Route
                      </th>
                      <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Completed
                      </th>
                      <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        States
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loadData.map((load) => (
                      <tr key={load.id} className={selectedLoads.some(l => l.id === load.id) ? 'bg-blue-50' : ''}>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedLoads.some(l => l.id === load.id)}
                            onChange={() => handleLoadSelection(load)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                          {load.load_number}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                          {load.origin} → {load.destination}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                          {new Date(load.completed_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                          {Object.keys(load.route_details?.mileageByState || {}).join(', ')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                <span className="text-sm text-gray-700">
                  {selectedLoads.length} of {loadData.length} loads selected
                </span>
                <button
                  onClick={importLoads}
                  disabled={loading || selectedLoads.length === 0}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus size={16} className="mr-2" />
                  Import Selected Loads
                </button>
              </div>
            </div>
          )}

          {loadData.length === 0 && !loading && (
            <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
              <RouteOff size={36} className="mx-auto text-gray-400 mb-2" />
              <p className="text-gray-600">No loads available for import in this quarter.</p>
              <p className="text-sm text-gray-500 mt-1">
                Complete loads with state mileage data will appear here.
              </p>
            </div>
          )}

          {showImportedTrips && importedTrips.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Recently Imported Trips</h4>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Route
                      </th>
                      <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Miles
                      </th>
                      <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {importedTrips.map((trip) => (
                      <tr key={trip.id}>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                          {new Date(trip.start_date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                          {trip.start_jurisdiction} → {trip.end_jurisdiction}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-right">
                          {trip.total_miles.toFixed(1)}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle size={12} className="mr-1" />
                            Imported
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}