"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { 
  MapPin, 
  Calendar, 
  ArrowRight, 
  CheckCircle, 
  AlertTriangle,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Truck,
  BarChart2
} from "lucide-react";

/**
 * Component that integrates State Mileage Tracker data with IFTA Calculator
 * This component allows users to import state mileage entries into IFTA calculator
 */
export default function StateMileageIFTAIntegration({ 
  userId, 
  quarter,
  onImportComplete = () => {},
  showDetails = true
}) {
  const [mileageTrips, setMileageTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [stateMileage, setStateMileage] = useState([]);
  const [importResult, setImportResult] = useState(null);
  const [success, setSuccess] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [quarterDates, setQuarterDates] = useState({ start: null, end: null });

  // Parse quarter string to get date range
  useEffect(() => {
    if (quarter) {
      const [year, q] = quarter.split('-Q');
      const quarterNum = parseInt(q);
      
      // Calculate quarter start and end dates
      const startMonth = (quarterNum - 1) * 3;
      const startDate = new Date(parseInt(year), startMonth, 1);
      const endDate = new Date(parseInt(year), startMonth + 3, 0);
      
      setQuarterDates({
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0]
      });
    }
  }, [quarter]);

  // Load completed mileage trips
  const loadCompletedMileageTrips = useCallback(async () => {
    if (!userId || !quarterDates.start || !quarterDates.end) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Get completed mileage trips within the quarter date range
      const { data, error: tripsError } = await supabase
        .from('driver_mileage_trips')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .gte('start_date', quarterDates.start)
        .lte('end_date', quarterDates.end)
        .order('end_date', { ascending: false });
        
      if (tripsError) throw tripsError;
      
      // Check if these trips have already been imported as IFTA trips
      const tripIds = (data || []).map(trip => trip.id);
      
      // Get all IFTA trips that reference these mileage trips
      let alreadyImportedTripIds = [];
      
      if (tripIds.length > 0) {
        const { data: existingImports, error: importsError } = await supabase
          .from('ifta_trip_records')
          .select('mileage_trip_id')
          .in('mileage_trip_id', tripIds)
          .eq('user_id', userId)
          .eq('quarter', quarter);
          
        if (importsError) throw importsError;
        
        alreadyImportedTripIds = (existingImports || [])
          .map(trip => trip.mileage_trip_id)
          .filter(id => id);
      }
      
      // Mark trips that are already imported
      const processedTrips = (data || []).map(trip => ({
        ...trip,
        alreadyImported: alreadyImportedTripIds.includes(trip.id)
      }));
      
      setMileageTrips(processedTrips);
    } catch (error) {
      console.error('Error loading mileage trips:', error);
      setError('Failed to load state mileage trips. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [userId, quarter, quarterDates]);

  // Load data when component mounts or quarter/date range changes
  useEffect(() => {
    if (quarterDates.start && quarterDates.end) {
      loadCompletedMileageTrips();
    }
  }, [loadCompletedMileageTrips, quarterDates]);

  // Handle selecting a trip
  const handleSelectTrip = async (trip) => {
    try {
      setSelectedTrip(trip);
      
      // Fetch all crossings for this trip
      const { data: crossings, error } = await supabase
        .from('driver_mileage_crossings')
        .select('*')
        .eq('trip_id', trip.id)
        .order('timestamp', { ascending: true });
        
      if (error) throw error;
      
      // Calculate mileage by state
      let mileageByState = [];
      
      if (crossings && crossings.length >= 2) {
        for (let i = 0; i < crossings.length - 1; i++) {
          const currentState = crossings[i].state;
          const currentOdometer = crossings[i].odometer;
          const nextOdometer = crossings[i + 1].odometer;
          const milesDriven = nextOdometer - currentOdometer;
          
          // Add or update state mileage
          const existingEntry = mileageByState.find(entry => entry.state === currentState);
          if (existingEntry) {
            existingEntry.miles += milesDriven;
          } else {
            mileageByState.push({
              state: currentState,
              state_name: crossings[i].state_name,
              miles: milesDriven
            });
          }
        }
      }
      
      // Sort by miles (highest first)
      mileageByState = mileageByState.sort((a, b) => b.miles - a.miles);
      
      setStateMileage(mileageByState);
      setExpanded(true);
    } catch (error) {
      console.error('Error loading state mileage:', error);
      setError('Failed to load state mileage details.');
    }
  };

  // Import mileage data into IFTA
  const handleImportMileage = async () => {
    if (!selectedTrip || !stateMileage || stateMileage.length === 0) {
      return;
    }
    
    try {
      setImportLoading(true);
      setError(null);
      setSuccess(false);
      
      // Create IFTA trip records for each state with miles
      const tripRecords = stateMileage.map(state => ({
        user_id: userId,
        quarter: quarter,
        start_date: selectedTrip.start_date,
        end_date: selectedTrip.end_date,
        vehicle_id: selectedTrip.vehicle_id,
        mileage_trip_id: selectedTrip.id, // Reference to the original mileage trip
        start_jurisdiction: state.state,
        end_jurisdiction: state.state, // Same state for these records since we're importing state by state
        total_miles: state.miles,
        gallons: 0, // To be filled based on MPG later
        fuel_cost: 0,
        notes: `Imported from State Mileage Tracker: ${state.state_name} (${state.miles.toFixed(1)} miles)`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_imported: true,
        source: 'mileage_tracker'
      }));
      
      // Insert the trip records
      const { data, error: insertError } = await supabase
        .from('ifta_trip_records')
        .insert(tripRecords)
        .select();
        
      if (insertError) throw insertError;
      
      // Set success state and result
      setSuccess(true);
      setImportResult({
        importedCount: tripRecords.length,
        totalMiles: stateMileage.reduce((sum, state) => sum + state.miles, 0),
        states: stateMileage.map(state => state.state)
      });
      
      // Refresh the mileage trips list
      loadCompletedMileageTrips();
      
      // Clear selection
      setSelectedTrip(null);
      setStateMileage([]);
      setExpanded(false);
      
      // Notify parent component
      onImportComplete(data);
    } catch (error) {
      console.error('Error importing mileage data:', error);
      setError('Failed to import mileage data: ' + error.message);
    } finally {
      setImportLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      {/* Header Section */}
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <div className="flex items-center">
          <MapPin size={20} className="text-blue-600 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">State Mileage IFTA Integration</h3>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
        >
          {expanded ? (
            <>
              <ChevronDown size={16} className="mr-1" />
              Hide Details
            </>
          ) : (
            <>
              <ChevronRight size={16} className="mr-1" />
              Show Details
            </>
          )}
        </button>
      </div>
      
      {/* Description & Help Text */}
      <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
        <div className="flex items-start">
          <div className="mr-3 flex-shrink-0">
            <BarChart2 size={20} className="text-blue-500" />
          </div>
          <div>
            <h4 className="text-sm font-medium text-blue-800">Accurate IFTA Data from Your State Mileage Tracker</h4>
            <p className="text-sm text-blue-700 mt-1">
              Use your state mileage tracker data to automatically generate accurate IFTA reports. 
              This ensures your quarterly filings include precise mileage for each jurisdiction you&apos;ve driven through.
            </p>
            {mileageTrips && (
              <p className="text-sm text-blue-700 mt-1">
                For this quarter ({quarter}), we found {mileageTrips.filter(t => !t.alreadyImported).length} completed mileage trips 
                that can be imported.
              </p>
            )}
          </div>
        </div>
      </div>
      
      {/* Show any errors */}
      {error && (
        <div className="px-6 py-3 bg-red-50 border-b border-red-200">
          <div className="flex items-start">
            <AlertTriangle size={16} className="text-red-500 mr-2 mt-0.5" />
            <p className="text-sm text-red-700">
              {error}
            </p>
          </div>
        </div>
      )}
      
      {/* Success message */}
      {success && importResult && (
        <div className="px-6 py-3 bg-green-50 border-b border-green-200">
          <div className="flex items-start">
            <CheckCircle size={16} className="text-green-500 mr-2 mt-0.5" />
            <div>
              <p className="text-sm text-green-700">
                Successfully imported {importResult.importedCount} state entries for a total of {importResult.totalMiles.toFixed(1)} miles.
              </p>
              {importResult.states?.length > 0 && (
                <p className="text-xs text-green-600 mt-1">
                  States: {importResult.states.join(', ')}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Mileage Trips and Detail View (When Expanded) */}
      {expanded && (
        <div className="px-6 py-4 border-b border-gray-200">
          {loading ? (
            <div className="py-8 text-center">
              <RefreshCw size={24} className="animate-spin inline-block text-blue-500 mb-2" />
              <p className="text-gray-500">Loading mileage data...</p>
            </div>
          ) : mileageTrips.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-gray-500">
                No recorded state mileage trips found for this quarter ({quarterDates.start} to {quarterDates.end}).
              </p>
              <Link 
                href="/dashboard/mileage"
                className="inline-flex items-center mt-2 text-blue-600 hover:text-blue-800"
              >
                <MapPin size={16} className="mr-1" />
                Record State Mileage
              </Link>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row gap-6">
              {/* Trips List */}
              <div className="md:w-1/2">
                <h4 className="text-md font-medium mb-3">Available Mileage Trips</h4>
                <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                  {mileageTrips.map(trip => (
                    <div 
                      key={trip.id} 
                      className={`p-3 border rounded-lg ${
                        trip.alreadyImported 
                          ? 'bg-gray-100 border-gray-200 opacity-70' 
                          : selectedTrip && selectedTrip.id === trip.id
                            ? 'bg-blue-50 border-blue-300'
                            : 'bg-white border-gray-200 hover:bg-gray-50'
                      } cursor-pointer`}
                      onClick={() => !trip.alreadyImported && handleSelectTrip(trip)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-medium text-gray-900">Vehicle: {trip.vehicle_id}</span>
                          <div className="mt-1 flex items-center text-xs text-gray-500">
                            <Calendar size={12} className="mr-1" />
                            {formatDate(trip.start_date)} to {formatDate(trip.end_date)}
                          </div>
                        </div>
                        <div>
                          {trip.alreadyImported ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle size={10} className="mr-1" />
                              Imported
                            </span>
                          ) : (
                            <ArrowRight size={16} className="text-blue-500" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* State Mileage Details */}
              <div className="md:w-1/2">
                <h4 className="text-md font-medium mb-3">State Mileage Details</h4>
                
                {selectedTrip ? (
                  <div>
                    <div className="bg-blue-50 p-3 rounded-lg mb-3">
                      <p className="text-sm text-blue-800">
                        <span className="font-medium">Trip Summary:</span> {formatDate(selectedTrip.start_date)} to {formatDate(selectedTrip.end_date)}
                      </p>
                      <p className="text-sm text-blue-800">
                        <span className="font-medium">Vehicle:</span> {selectedTrip.vehicle_id}
                      </p>
                    </div>
                    
                    {stateMileage.length === 0 ? (
                      <div className="text-center py-6">
                        <p className="text-gray-500">No state crossings recorded for this trip.</p>
                      </div>
                    ) : (
                      <div>
                        <div className="max-h-60 overflow-y-auto pr-1">
                          {stateMileage.map(state => (
                            <div key={state.state} className="mb-2 border border-gray-200 rounded-lg p-3">
                              <div className="flex justify-between">
                                <div>
                                  <span className="font-medium text-gray-900">{state.state_name}</span>
                                  <div className="text-xs text-gray-500">State code: {state.state}</div>
                                </div>
                                <span className="font-medium text-gray-900">{state.miles.toFixed(1)} miles</span>
                              </div>
                              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full" 
                                  style={{ width: `${Math.min(100, (state.miles / stateMileage[0].miles) * 100)}%` }}
                                ></div>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <div className="mt-4 bg-gray-50 p-3 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-gray-900">Total Miles:</span>
                            <span className="font-medium text-gray-900">
                              {stateMileage.reduce((sum, s) => sum + s.miles, 0).toFixed(1)} miles
                            </span>
                          </div>
                          <div className="flex justify-between items-center mt-1">
                            <span className="font-medium text-gray-900">Total States:</span>
                            <span className="font-medium text-gray-900">{stateMileage.length}</span>
                          </div>
                        </div>
                        
                        <button
                          onClick={handleImportMileage}
                          disabled={importLoading}
                          className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none flex items-center justify-center"
                        >
                          {importLoading ? (
                            <>
                              <RefreshCw size={16} className="mr-2 animate-spin" />
                              Importing...
                            </>
                          ) : (
                            <>
                              <CheckCircle size={16} className="mr-2" />
                              Import State Mileage Data
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-gray-50 p-6 text-center rounded-lg">
                    <MapPin size={32} className="mx-auto mb-3 text-gray-400" />
                    <p className="text-gray-500">Select a mileage trip to view state-by-state mileage details.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      
      {!expanded && !loading && mileageTrips.length > 0 && (
        <div className="px-6 py-4 border-b border-gray-200">
          <h4 className="text-md font-medium mb-3">Available Mileage Trips</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {mileageTrips
              .filter(trip => !trip.alreadyImported)
              .slice(0, 3)
              .map(trip => (
                <div 
                  key={trip.id} 
                  className="p-3 border rounded-lg bg-white hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleSelectTrip(trip)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-gray-900">
                        {trip.vehicle_id}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
                      </div>
                    </div>
                    <div className="flex items-center text-blue-600">
                      <ArrowRight size={16} />
                    </div>
                  </div>
                </div>
              ))}
          </div>
          {mileageTrips.filter(t => !t.alreadyImported).length > 3 && (
            <div className="mt-3 text-center">
              <button
                onClick={() => setExpanded(true)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                View all {mileageTrips.filter(t => !t.alreadyImported).length} available trips
              </button>
            </div>
          )}
        </div>
      )}
      
      {/* Actions Footer */}
      <div className="px-6 py-4 bg-gray-50 flex justify-between items-center">
        <div className="text-sm text-gray-500">
          {mileageTrips && (
            <span>
              {mileageTrips.filter(t => !t.alreadyImported).length} available trip{mileageTrips.filter(t => !t.alreadyImported).length !== 1 ? 's' : ''} • 
              {mileageTrips.filter(t => t.alreadyImported).length} already imported
            </span>
          )}
        </div>
        <div className="flex space-x-3">
          {expanded ? (
            <button
              onClick={() => setExpanded(false)}
              className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Collapse
            </button>
          ) : (
            <Link
              href="/dashboard/mileage"
              className="inline-flex items-center px-4 py-2 border border-transparent bg-blue-600 text-white text-sm rounded-md shadow-sm hover:bg-blue-700"
            >
              <Truck size={16} className="mr-2" />
              Go to State Mileage Tracker
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}