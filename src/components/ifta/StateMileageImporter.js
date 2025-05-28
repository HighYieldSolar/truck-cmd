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
  ChevronRight,
  Truck,
  Calendar
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
  const [isExpanded, setIsExpanded] = useState(true);

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

      // Fetch completed trips from the state mileage tracker within the quarter
      const { data: trips, error: tripsError } = await supabase
        .from('driver_mileage_trips')
        .select(`
          id,
          vehicle_id,
          start_date,
          end_date,
          status
        `)
        .eq('user_id', userId)
        .eq('status', 'completed')
        .gte('start_date', startDate.toISOString().split('T')[0])
        .lte('end_date', endDate.toISOString().split('T')[0]);

      if (tripsError) throw tripsError;

      // Check which trips have already been imported
      const { data: existingTrips, error: tripError } = await supabase
        .from('ifta_trip_records')
        .select('mileage_trip_id')
        .eq('user_id', userId)
        .eq('quarter', quarter)
        .not('mileage_trip_id', 'is', null);

      if (tripError) throw tripError;

      const importedTripIds = new Set(existingTrips?.map(trip => trip.mileage_trip_id));

      // Filter out already imported trips
      const availableTrips = trips?.filter(trip => !importedTripIds.has(trip.id)) || [];

      // Load vehicle names for display
      const vehicleIds = [...new Set(availableTrips.map(trip => trip.vehicle_id))];
      let vehicleNames = {};

      if (vehicleIds.length > 0) {
        const { data: vehicles, error: vehicleError } = await supabase
          .from('vehicles')
          .select('id, name, license_plate')
          .in('id', vehicleIds);

        if (!vehicleError && vehicles) {
          vehicles.forEach(vehicle => {
            vehicleNames[vehicle.id] = {
              name: vehicle.name,
              licensePlate: vehicle.license_plate
            };
          });
        }
      }

      // Fetch mileage data for each trip
      const tripsWithData = await Promise.all(
        availableTrips.map(async (trip) => {
          const { data: crossings, error: crossingsError } = await supabase
            .from('driver_mileage_crossings')
            .select('*')
            .eq('trip_id', trip.id)
            .order('timestamp', { ascending: true });

          if (crossingsError) {
            console.error('Error fetching crossings for trip:', trip.id, crossingsError);
            return null;
          }

          // Calculate mileage by state
          const mileageByState = calculateMileageByState(crossings || []);

          return {
            ...trip,
            vehicleName: vehicleNames[trip.vehicle_id]?.name || trip.vehicle_id,
            vehicleLicensePlate: vehicleNames[trip.vehicle_id]?.licensePlate || '',
            crossings: crossings || [],
            mileageByState
          };
        })
      );

      // Filter out trips with no mileage data
      const validTrips = tripsWithData.filter(trip => trip && trip.mileageByState.length > 0);

      setLoadData(validTrips);
      setSuccess(false);
    } catch (err) {
      console.error('Error fetching trips:', err);
      setError('Failed to fetch available trips');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to calculate mileage by state from crossings
  const calculateMileageByState = (crossings) => {
    if (!crossings || crossings.length < 2) {
      return [];
    }

    const stateMileage = [];

    for (let i = 0; i < crossings.length - 1; i++) {
      const currentState = crossings[i].state;
      const currentOdometer = crossings[i].odometer;
      const nextOdometer = crossings[i + 1].odometer;
      const milesDriven = nextOdometer - currentOdometer;

      // Add or update state mileage
      const existingEntry = stateMileage.find(entry => entry.state === currentState);
      if (existingEntry) {
        existingEntry.miles += milesDriven;
      } else {
        stateMileage.push({
          state: currentState,
          state_name: crossings[i].state_name,
          miles: milesDriven
        });
      }
    }

    // Sort by miles (highest first)
    return stateMileage.sort((a, b) => b.miles - a.miles);
  };

  // Import selected loads into IFTA trip records
  const importLoads = async () => {
    if (selectedLoads.length === 0) {
      setError('Please select at least one trip to import');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setImportedTrips([]);

      const tripsToInsert = [];

      for (const trip of selectedLoads) {
        const mileageByState = trip.mileageByState;

        if (!mileageByState || mileageByState.length === 0) continue;

        for (const stateMileage of mileageByState) {
          if (stateMileage.miles > 0) {
            tripsToInsert.push({
              user_id: userId,
              quarter: quarter,
              start_date: trip.start_date,
              end_date: trip.end_date || trip.start_date,
              vehicle_id: trip.vehicle_id,
              start_jurisdiction: stateMileage.state,
              end_jurisdiction: stateMileage.state, // Same state for these records
              total_miles: stateMileage.miles,
              mileage_trip_id: trip.id,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              is_imported: true,
              source: 'mileage_tracker',
              notes: `Imported from State Mileage Tracker: ${stateMileage.state_name} (${stateMileage.miles.toFixed(1)} miles)`,
              gallons: 0,
              fuel_cost: 0
            });
          }
        }
      }

      if (tripsToInsert.length === 0) {
        setError('No valid trips to import from selected trips');
        return;
      }

      // Ensure all required fields are present and valid
      const validTrips = tripsToInsert.map(trip => {
        // Ensure required fields have valid values
        return {
          ...trip,
          // Ensure numeric fields are properly formatted
          total_miles: parseFloat(trip.total_miles) || 0,
          // Make sure all dates are in ISO format
          start_date: typeof trip.start_date === 'string' ? trip.start_date : new Date(trip.start_date).toISOString().split('T')[0],
          end_date: typeof trip.end_date === 'string' ? trip.end_date : new Date(trip.end_date).toISOString().split('T')[0],
          // Ensure these fields exist
          gallons: trip.gallons || 0,
          fuel_cost: trip.fuel_cost || 0
        };
      });

      console.log('Attempting to insert trips:', validTrips);

      // Insert trips into IFTA database
      const { data: insertedTrips, error: insertError } = await supabase
        .from('ifta_trip_records')
        .insert(validTrips)
        .select();

      if (insertError) {
        console.error('Supabase error when inserting trips:', insertError);
        throw new Error(insertError.message || 'Database error occurred');
      }

      // Store the inserted trips for display with vehicle info
      const tripsWithVehicleInfo = (insertedTrips || []).map(trip => {
        const sourceTrip = selectedLoads.find(load => load.id === trip.mileage_trip_id);
        return {
          ...trip,
          vehicle_name: sourceTrip?.vehicleName || '',
          vehicle_license_plate: sourceTrip?.vehicleLicensePlate || ''
        };
      });

      setImportedTrips(tripsWithVehicleInfo);
      setImportCount(insertedTrips?.length || 0);
      setSuccess(true);
      setSelectedLoads([]);

      // Refresh available trips
      await fetchAvailableLoads();

      // Notify parent component
      if (onImportComplete) {
        onImportComplete();
      }
    } catch (err) {
      console.error('Error importing trips:', err);
      setError(`Failed to import trips to IFTA: ${err.message || 'Unknown error'}`);
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
                  Successfully imported {importCount} trips from selected trips.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-md flex items-start">
              <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-700">Error importing trips</p>
                <p className="text-sm text-red-600">{error}</p>
                <button
                  onClick={() => console.log('Last attempted import:', tripsToInsert)}
                  className="text-xs text-red-700 underline mt-1"
                >
                  Debug in Console
                </button>
              </div>
            </div>
          )}

          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-4">
              Import completed trips from your State Mileage Tracker to automatically create IFTA trip records
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
                  Check for Available Trips
                </>
              )}
            </button>
          </div>

          {loadData.length > 0 && (
            <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow transition-shadow duration-200">
              <div className="bg-gradient-to-r from-blue-50 to-white px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                <h4 className="text-sm font-medium text-gray-700 flex items-center">
                  <FileText size={16} className="mr-2 text-blue-500" />
                  Available Trips to Import
                </h4>
                <button
                  onClick={handleSelectAll}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors duration-150"
                >
                  {selectedLoads.length === loadData.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              <div className="max-h-64 overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Select
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Vehicle
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        States
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loadData.map((trip) => (
                      <tr
                        key={trip.id}
                        className={`${selectedLoads.some(l => l.id === trip.id) ? 'bg-blue-50' : 'hover:bg-gray-50'} transition-colors duration-150`}
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedLoads.some(l => l.id === trip.id)}
                            onChange={() => handleLoadSelection(trip)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <Truck size={16} className="text-gray-400 mr-2" />
                            <span className="text-sm font-medium text-gray-900">
                              {trip.vehicleName}
                              {trip.vehicleLicensePlate && (
                                <span className="ml-1 text-blue-600">{trip.vehicleLicensePlate}</span>
                              )}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <Calendar size={16} className="text-gray-400 mr-2" />
                            <span className="text-sm text-gray-600">
                              {new Date(trip.start_date).toLocaleDateString()}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div>
                            <div className="flex flex-wrap gap-1 mb-1">
                              {trip.mileageByState.map(state => (
                                <span key={state.state} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                  {state.state}
                                </span>
                              ))}
                            </div>
                            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                              {trip.mileageByState.reduce((sum, state) => sum + state.miles, 0).toFixed(0)} miles total
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-white border-t border-gray-200 flex justify-between items-center">
                <span className="text-sm text-gray-700 font-medium">
                  {selectedLoads.length} of {loadData.length} trips selected
                </span>
                <button
                  onClick={importLoads}
                  disabled={loading || selectedLoads.length === 0}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
                >
                  <Plus size={16} className="mr-2" />
                  Import Selected Trips
                </button>
              </div>
            </div>
          )}

          {loadData.length === 0 && !loading && (
            <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
              <RouteOff size={36} className="mx-auto text-gray-400 mb-2" />
              <p className="text-gray-600 font-medium">No trips available for import in this quarter.</p>
              <p className="text-sm text-gray-500 mt-1">
                Completed trips with state mileage data will appear here.
              </p>
            </div>
          )}

          {showImportedTrips && importedTrips.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                <CheckCircle size={16} className="mr-2 text-green-500" />
                Recently Imported Trips
              </h4>
              <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow transition-shadow duration-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-green-50 to-white">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Route
                      </th>
                      <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Miles
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {importedTrips.map((trip) => (
                      <tr key={trip.id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <Calendar size={16} className="text-gray-400 mr-2" />
                            <span className="text-sm font-medium text-gray-900">
                              {new Date(trip.start_date).toLocaleDateString()}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <ArrowRight size={16} className="text-gray-400 mr-2" />
                            <div>
                              <span className="text-sm text-gray-900">
                                {trip.start_jurisdiction} → {trip.end_jurisdiction}
                              </span>
                              <div className="text-xs text-gray-500 mt-1 flex items-center">
                                <Truck size={14} className="text-gray-400 mr-1" />
                                {trip.vehicle_name}
                                {trip.vehicle_license_plate && (
                                  <span className="ml-1 text-blue-600">{trip.vehicle_license_plate}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <span className="text-sm font-medium text-gray-900 bg-blue-50 px-2 py-1 rounded-full">
                            {trip.total_miles.toFixed(1)} mi
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
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