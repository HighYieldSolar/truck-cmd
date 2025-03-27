// src/components/ifta/StateMileageImporter.js
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  MapPin,
  ArrowRight,
  Check,
  RefreshCw,
  AlertTriangle,
  Info,
  Download,
  CheckCircle,
  Truck,
  Calendar,
  Plus
} from "lucide-react";
import Link from "next/link";

// Import the mileage service
import { getImportableMileageTrips, getStateMileageForTrip, importMileageTripToIFTA } from "@/lib/services/iftaMileageService";

export default function StateMileageImporter({ 
  userId, 
  quarter,
  onImportComplete,
  isCollapsible = true,
  showImportedTrips = true
}) {
  const [mileageTrips, setMileageTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [mileageData, setMileageData] = useState([]);
  const [mileageModalOpen, setMileageModalOpen] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const [bulkImportLoading, setBulkImportLoading] = useState(false);
  // New state for vehicle details
  const [vehicleDetails, setVehicleDetails] = useState({});

  // Load mileage trips
  useEffect(() => {
    const loadMileageTrips = async () => {
      if (!userId || !quarter) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch mileage trips for the quarter
        const trips = await getImportableMileageTrips(userId, quarter);
        setMileageTrips(trips);
        
        // Get vehicle details for each unique vehicle ID
        const vehicleIds = [...new Set(trips.map(trip => trip.vehicle_id))].filter(Boolean);
        if (vehicleIds.length > 0) {
          await fetchVehicleDetails(vehicleIds);
        }
        
        // If there are no unimported trips, collapse the section if collapsible
        if (isCollapsible && trips.filter(t => !t.alreadyImported).length === 0 && !showImportedTrips) {
          setCollapsed(true);
        }
      } catch (err) {
        console.error("Error loading mileage trips:", err);
        setError("Failed to load state mileage trips. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    
    loadMileageTrips();
  }, [userId, quarter, isCollapsible, showImportedTrips]);

  // Fetch vehicle details from the database
  const fetchVehicleDetails = async (vehicleIds) => {
    try {
      // Try fetching from vehicles table first
      let { data: vehiclesData, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('id, name, license_plate')
        .in('id', vehicleIds);
      
      // If we couldn't find vehicles, try the trucks table
      if (vehiclesError || !vehiclesData || vehiclesData.length === 0) {
        const { data: trucksData, error: trucksError } = await supabase
          .from('trucks')
          .select('id, name, license_plate')
          .in('id', vehicleIds);
          
        if (!trucksError && trucksData && trucksData.length > 0) {
          vehiclesData = trucksData;
        }
      }
      
      // Build a lookup object for vehicle details
      if (vehiclesData && vehiclesData.length > 0) {
        const detailsMap = {};
        vehiclesData.forEach(vehicle => {
          detailsMap[vehicle.id] = {
            name: vehicle.name || vehicle.id,
            licensePlate: vehicle.license_plate || ''
          };
        });
        setVehicleDetails(detailsMap);
      }
    } catch (err) {
      console.error("Error fetching vehicle details:", err);
      // Continue without vehicle details, just use IDs
    }
  };

  // Format vehicle display with name and plate if available
  const formatVehicleDisplay = (vehicleId) => {
    if (!vehicleId) return 'Unknown Vehicle';
    
    const details = vehicleDetails[vehicleId];
    if (!details) return vehicleId;
    
    return details.name + (details.licensePlate ? ` (${details.licensePlate})` : '');
  };

  // Handle selecting a mileage trip
  const handleSelectTrip = async (trip) => {
    try {
      setSelectedTrip(trip);
      setError(null);
      
      // Load state mileage data for this trip
      const stateData = await getStateMileageForTrip(trip.id);
      setMileageData(stateData);
      
      // Open the modal
      setMileageModalOpen(true);
    } catch (err) {
      console.error("Error loading state mileage details:", err);
      setError("Failed to load state mileage details. Please try again.");
    }
  };

  // Handle importing a single trip
  const handleImportTrip = async () => {
    if (!selectedTrip || mileageData.length === 0) return;
    
    try {
      setImportLoading(true);
      setError(null);
      
      // Import the trip
      const result = await importMileageTripToIFTA(userId, quarter, selectedTrip.id);
      
      if (!result.success) {
        console.error("Import failure details:", result);  // Add detailed logging
        throw new Error(result.error || "Failed to import trip");
      }
      
      // Close modal and show appropriate success message
      setMileageModalOpen(false);
      
      if (result.alreadyImported) {
        // Check if we can actually find the imported trip in the IFTA data
        // This is a secondary validation to avoid false "already imported" messages
        const { data: existingTrips, error: verifyError } = await supabase
          .from('ifta_trip_records')
          .select('id')
          .eq('user_id', userId)
          .eq('quarter', quarter)
          .eq('mileage_trip_id', selectedTrip.id);
  
        if (verifyError || !existingTrips || existingTrips.length === 0) {
          // If we can't find the trip, it's probably a false positive
          console.log("No actual trip records found despite 'already imported' flag");
          
          // Try again but skipping the preliminary check
          const forceImportResult = await forceTripImport(userId, quarter, selectedTrip.id, mileageData);
          
          if (forceImportResult.success && forceImportResult.importedCount > 0) {
            setMessage({
              type: "success",
              text: `Successfully imported trip with ${forceImportResult.importedCount} state entries and ${forceImportResult.totalMiles.toFixed(1)} miles.`
            });
          } else {
            setMessage({
              type: "warning",
              text: "Could not import trip. There might be a database issue."
            });
          }
        } else {
          // It's genuinely already imported
          setMessage({
            type: "warning",
            text: "This trip has already been imported."
          });
        }
      } else if (result.importedCount === 0) {
        setMessage({
          type: "warning",
          text: "No state data was imported. Please check your state crossings."
        });
      } else {
        setMessage({
          type: "success",
          text: `Successfully imported trip with ${result.importedCount} state entries and ${result.totalMiles.toFixed(1)} miles.`
        });
      }
      
      // Clear the message after 5 seconds
      setTimeout(() => setMessage(null), 5000);
      
      // Refresh the trips list
      const updatedTrips = await getImportableMileageTrips(userId, quarter);
      setMileageTrips(updatedTrips);
      
      // Call the onImportComplete callback if provided
      if (onImportComplete) {
        onImportComplete();
      }
    } catch (err) {
      console.error("Error importing mileage trip:", err);
      setError("Failed to import mileage trip: " + (err.message || "Unknown error"));
    } finally {
      setImportLoading(false);
    }
  };
  
  // Force import by directly inserting records without the preliminary check
  const forceTripImport = async (userId, quarter, tripId, mileageData) => {
    try {
      // Get the trip details
      const { data: trip, error: tripError } = await supabase
        .from('driver_mileage_trips')
        .select('*')
        .eq('id', tripId)
        .eq('user_id', userId)
        .single();
        
      if (tripError) throw tripError;
      if (!trip) throw new Error("Trip not found");
      
      // Use the mileage data we already have
      if (!mileageData || mileageData.length === 0) {
        return {
          success: true,
          importedCount: 0,
          totalMiles: 0,
        };
      }
      
      // Prepare IFTA records for each state with miles
      const tripRecords = mileageData.map(state => ({
        user_id: userId,
        quarter: quarter,
        start_date: trip.start_date,
        end_date: trip.end_date || trip.start_date,
        vehicle_id: trip.vehicle_id,
        mileage_trip_id: trip.id,
        start_jurisdiction: state.state,
        end_jurisdiction: state.state,
        total_miles: state.miles,
        gallons: 0,
        fuel_cost: 0,
        notes: `Imported from State Mileage Tracker: ${state.state_name} (${state.miles.toFixed(1)} miles)`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_imported: true,
        source: 'mileage_tracker'
      }));
      
      // Insert the records
      const { data, error: insertError } = await supabase
        .from('ifta_trip_records')
        .insert(tripRecords)
        .select();
          
      if (insertError) {
        if (insertError.code === '23505') {
          return {
            success: true,
            importedCount: 0,
            totalMiles: 0,
            alreadyImported: true
          };
        }
        throw insertError;
      }
      
      // Calculate total miles
      const totalMiles = mileageData.reduce((sum, state) => sum + state.miles, 0);
      
      return {
        success: true,
        importedCount: tripRecords.length,
        totalMiles: totalMiles
      };
    } catch (error) {
      console.error("Error in force import:", error);
      return {
        success: false,
        error: error.message
      };
    }
  };

  // Handle bulk import of all unimported trips
  const handleBulkImport = async () => {
    // Get all unimported trips
    const unimportedTrips = mileageTrips.filter(trip => !trip.alreadyImported);
    
    if (unimportedTrips.length === 0) return;
    
    try {
      setBulkImportLoading(true);
      setError(null);
      
      let successCount = 0;
      let totalMiles = 0;
      let alreadyImportedCount = 0;
      let errorCount = 0;
      
      // Import each trip sequentially
      for (const trip of unimportedTrips) {
        try {
          const result = await importMileageTripToIFTA(userId, quarter, trip.id);
          
          if (result.success) {
            if (result.alreadyImported || result.importedCount === 0) {
              alreadyImportedCount++;
            } else {
              successCount++;
              totalMiles += result.totalMiles;
            }
          } else {
            errorCount++;
            console.error(`Error importing trip ${trip.id}:`, result.error);
          }
        } catch (tripError) {
          errorCount++;
          console.error(`Exception importing trip ${trip.id}:`, tripError);
        }
      }
      
      // Build the success message
      let successText = "";
      if (successCount > 0) {
        successText = `Successfully imported ${successCount} trip${successCount !== 1 ? 's' : ''} with a total of ${totalMiles.toFixed(1)} miles.`;
      }
      
      if (alreadyImportedCount > 0) {
        successText += successCount > 0 ? " " : "";
        successText += `${alreadyImportedCount} trip${alreadyImportedCount !== 1 ? 's were' : ' was'} already imported.`;
      }
      
      if (errorCount > 0) {
        successText += `${successText ? " " : ""}${errorCount} trip${errorCount !== 1 ? 's' : ''} failed to import. Check console for details.`;
      }
      
      // Show success message
      setMessage({
        type: successCount > 0 ? "success" : "warning",
        text: successText || "Import process completed."
      });
      
      // Clear the message after 5 seconds
      setTimeout(() => setMessage(null), 5000);
      
      // Refresh the trips list
      const updatedTrips = await getImportableMileageTrips(userId, quarter);
      setMileageTrips(updatedTrips);
      
      // Call the onImportComplete callback if provided
      if (onImportComplete) {
        onImportComplete();
      }
    } catch (err) {
      console.error("Error in bulk import:", err);
      setError("Failed to complete bulk import. Some trips may have been imported.");
    } finally {
      setBulkImportLoading(false);
    }
  };

  // Get the number of importable and already imported trips
  const importableTripsCount = mileageTrips.filter(trip => !trip.alreadyImported).length;
  const importedTripsCount = mileageTrips.filter(trip => trip.alreadyImported).length;

  // Handle collapse toggle
  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  // If no state mileage trips are available and the component is collapsed, return minimal UI
  if (collapsed) {
    return (
      <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center">
            <MapPin size={20} className="text-blue-600 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">State Mileage Data</h3>
          </div>
          
          <div className="flex items-center">
            <button
              onClick={toggleCollapse}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
            >
              Show {importableTripsCount > 0 ? `(${importableTripsCount} available)` : ''}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <div className="flex items-center">
          <MapPin size={20} className="text-blue-600 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Import State Mileage Data</h3>
        </div>
        
        <div className="flex items-center space-x-4">
          <Link
            href="/dashboard/mileage"
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
          >
            <Truck size={14} className="mr-1" />
            View Mileage Tracker
          </Link>
          
          {isCollapsible && (
            <button
              onClick={toggleCollapse}
              className="text-sm text-gray-600 hover:text-gray-800 flex items-center"
            >
              Collapse
            </button>
          )}
        </div>
      </div>
      
      <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
        <div className="flex items-start">
          <div className="mr-3 flex-shrink-0">
            <MapPin size={20} className="text-blue-500" />
          </div>
          <div>
            <h4 className="text-sm font-medium text-blue-800">Use Your State Mileage Data for IFTA</h4>
            <p className="text-sm text-blue-700 mt-1">
              Import your detailed state-by-state mileage data directly from the State Mileage Tracker into your IFTA report.
              This ensures your IFTA reporting is accurate, with precise mileage for each jurisdiction.
            </p>
            <p className="text-sm text-blue-700 mt-1">
              For this quarter ({quarter}), there {importableTripsCount === 1 ? 'is' : 'are'} {importableTripsCount} {importableTripsCount === 1 ? 'trip' : 'trips'} available for import 
              and {importedTripsCount} already imported.
            </p>
          </div>
        </div>
      </div>
      
      {/* Error or success messages */}
      {error && (
        <div className="px-6 py-3 bg-red-50 border-b border-red-100">
          <div className="flex items-start">
            <AlertTriangle size={16} className="text-red-500 mr-2 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}
      
      {message && (
        <div className={`px-6 py-3 ${message.type === "success" ? "bg-green-50 border-b border-green-100" : "bg-yellow-50 border-b border-yellow-100"}`}>
          <div className="flex items-start">
            {message.type === "success" ? (
              <CheckCircle size={16} className="text-green-500 mr-2 flex-shrink-0" />
            ) : (
              <Info size={16} className="text-yellow-500 mr-2 flex-shrink-0" />
            )}
            <p className={`text-sm ${message.type === "success" ? "text-green-700" : "text-yellow-700"}`}>{message.text}</p>
          </div>
        </div>
      )}
      
      <div className="px-6 py-4">
        {loading ? (
          <div className="py-8 text-center">
            <RefreshCw size={32} className="mx-auto mb-4 animate-spin text-blue-500" />
            <p className="text-gray-500">Loading state mileage trips...</p>
          </div>
        ) : mileageTrips.length === 0 ? (
          <div className="text-center py-8">
            <div className="flex justify-center mb-4">
              <MapPin size={32} className="text-gray-400" />
            </div>
            <p className="text-gray-500 mb-2">No mileage trips found for this quarter.</p>
            <Link 
              href="/dashboard/mileage"
              className="inline-flex items-center mt-2 text-blue-600 hover:text-blue-800"
            >
              <MapPin size={16} className="mr-1" />
              Go to State Mileage Tracker
            </Link>
          </div>
        ) : (
          <>
            <h3 className="text-md font-medium mb-3">
              {showImportedTrips ? 'Available Mileage Trips' : 'Trips Ready for Import'}
            </h3>
            
            {/* Bulk import button */}
            {importableTripsCount > 0 && (
              <div className="mb-4">
                <button
                  onClick={handleBulkImport}
                  disabled={bulkImportLoading}
                  className="inline-flex items-center px-4 py-2 border border-transparent bg-blue-600 text-white text-sm rounded-md shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {bulkImportLoading ? (
                    <>
                      <RefreshCw size={16} className="mr-2 animate-spin" />
                      Importing {importableTripsCount} trips...
                    </>
                  ) : (
                    <>
                      <Download size={16} className="mr-2" />
                      Import All {importableTripsCount} Available Trips
                    </>
                  )}
                </button>
              </div>
            )}
            
            {/* Filterable view with tabs */}
            <div className="mb-4">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex">
                  <button
                    onClick={() => setShowImportedTrips(false)}
                    className={`py-2 px-4 text-sm font-medium ${
                      !showImportedTrips
                        ? 'border-b-2 border-blue-500 text-blue-600'
                        : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Available ({importableTripsCount})
                  </button>
                  <button
                    onClick={() => setShowImportedTrips(true)}
                    className={`py-2 px-4 text-sm font-medium ${
                      showImportedTrips
                        ? 'border-b-2 border-blue-500 text-blue-600'
                        : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    All Trips ({mileageTrips.length})
                  </button>
                </nav>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mileageTrips
                .filter(trip => showImportedTrips || !trip.alreadyImported)
                .map(trip => (
                  <div 
                    key={trip.id} 
                    className={`p-3 border rounded-lg ${
                      trip.alreadyImported 
                        ? 'bg-green-50 border-green-200 hover:bg-green-100' 
                        : 'bg-white hover:bg-gray-50 cursor-pointer'
                    }`}
                    onClick={() => !trip.alreadyImported && handleSelectTrip(trip)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-gray-900 flex items-center">
                          <Truck size={16} className="mr-2 text-gray-500" />
                          {formatVehicleDisplay(trip.vehicle_id)}
                          {trip.alreadyImported && (
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <Check size={12} className="mr-1" />
                              Imported
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 mt-1 flex items-center">
                          <Calendar size={14} className="mr-1 text-gray-400" />
                          {new Date(trip.start_date).toLocaleDateString()} - {new Date(trip.end_date).toLocaleDateString()}
                        </div>
                        {trip.notes && (
                          <div className="text-sm text-gray-500 mt-1 line-clamp-1">
                            {trip.notes}
                          </div>
                        )}
                      </div>
                      {!trip.alreadyImported && (
                        <div className="flex items-center text-blue-600">
                          <ArrowRight size={16} />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
            
            {mileageTrips.filter(trip => showImportedTrips || !trip.alreadyImported).length === 0 && (
              <div className="text-center py-4">
                <p className="text-gray-500">
                  {showImportedTrips 
                    ? "No mileage trips found for this quarter." 
                    : "No trips available for import. All trips have been imported."}
                </p>
              </div>
            )}
          </>
        )}
      </div>
      
      <div className="px-6 py-4 bg-gray-50 flex justify-between items-center">
        <div className="text-sm text-gray-500">
          <span>
            {importableTripsCount} available trip{importableTripsCount !== 1 ? 's' : ''} • 
            {importedTripsCount} already imported
          </span>
        </div>
        <div>
          <Link
            href="/dashboard/mileage"
            className="inline-flex items-center px-4 py-2 border border-transparent bg-blue-600 text-white text-sm rounded-md shadow-sm hover:bg-blue-700"
          >
            <Plus size={16} className="mr-2" />
            Record New State Crossings
          </Link>
        </div>
      </div>
      
      {/* State mileage details modal */}
      {mileageModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      Import State Mileage Data
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        {selectedTrip ? (
                          <>Vehicle {formatVehicleDisplay(selectedTrip.vehicle_id)}: {new Date(selectedTrip.start_date).toLocaleDateString()} - {new Date(selectedTrip.end_date).toLocaleDateString()}</>
                        ) : (
                          'Select a mileage trip to import'
                        )}
                      </p>
                    </div>
                    
                    {selectedTrip && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">State Mileage Breakdown</h4>
                        
                        {mileageData.length === 0 ? (
                          <p className="text-sm text-gray-500">No state crossings found for this trip.</p>
                        ) : (
                          <div className="max-h-60 overflow-y-auto pr-2">
                            {mileageData.map(state => (
                              <div key={state.state} className="mb-2 border border-gray-200 rounded-md p-2">
                                <div className="flex justify-between">
                                  <span className="font-medium">{state.state_name} ({state.state})</span>
                                  <span className="font-medium">{state.miles.toFixed(1)} miles</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="mt-4">
                      <p className="text-sm text-gray-500">
                        This will create separate IFTA records for each state with the correct mileage. The data will be imported exactly as recorded in your state mileage tracker.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleImportTrip}
                  disabled={!selectedTrip || mileageData.length === 0 || importLoading}
                  className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm ${
                    (!selectedTrip || mileageData.length === 0 || importLoading) ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {importLoading ? (
                    <>
                      <RefreshCw size={16} className="mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    'Import State Mileage'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setMileageModalOpen(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}