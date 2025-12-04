// src/components/ifta/SimplifiedTripsList.js
"use client";

import { useState, useEffect } from "react";
import {
  Trash2,
  RefreshCw,
  Plus,
  Route,
  AlertTriangle,
  FileText,
  ChevronDown,
  ChevronRight,
  Edit,
  Truck
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { formatDateForDisplayMMDDYYYY } from "@/lib/utils/dateUtils";

export default function SimplifiedTripsList({ trips = [], onDeleteTrip, isLoading = false }) {
  const [vehicleDetails, setVehicleDetails] = useState({});
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  // Fetch vehicle details on component mount and when trips change
  useEffect(() => {
    const fetchVehicleDetails = async () => {
      try {
        setLoadingVehicles(true);

        // Get unique vehicle IDs from trips
        const vehicleIds = [...new Set(trips.map(trip => trip.vehicle_id))].filter(Boolean);

        if (vehicleIds.length === 0) {
          setVehicleDetails({});
          return;
        }

        // Try to get vehicles from both possible tables
        const { data: vehiclesData, error: vehiclesError } = await supabase
          .from('vehicles')
          .select('id, name, license_plate')
          .in('id', vehicleIds);

        // Build a lookup object for vehicle details
        if (vehiclesData && vehiclesData.length > 0) {
          const detailsMap = {};
          vehiclesData.forEach(vehicle => {
            detailsMap[vehicle.id] = {
              name: vehicle.name || 'Unknown Truck',
              licensePlate: vehicle.license_plate || ''
            };
          });
          setVehicleDetails(detailsMap);
        }
      } catch (err) {
        // Failed to load vehicle details
      } finally {
        setLoadingVehicles(false);
      }
    };

    fetchVehicleDetails();
  }, [trips]);

  // Format date for display (fixed timezone issue)
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";

    try {
      return formatDateForDisplayMMDDYYYY(dateString);
    } catch (error) {
      return dateString || "N/A";
    }
  };

  // Get source badge for the trip
  const getSourceBadge = (trip) => {
    if (trip.is_imported && trip.source === 'mileage_tracker' && trip.mileage_trip_id) {
      return (
        <span className="inline-flex items-center ml-2 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          State Mileage
        </span>
      );
    } else if (trip.is_imported && trip.load_id) {
      return (
        <span className="inline-flex items-center ml-2 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          Load
        </span>
      );
    } else if (trip.is_fuel_only) {
      return (
        <span className="inline-flex items-center ml-2 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Fuel Only
        </span>
      );
    }
    return null;
  };

  // Format vehicle display with name and license plate
  const formatVehicleDisplay = (vehicleId) => {
    if (!vehicleId) return "N/A";

    if (vehicleDetails[vehicleId]) {
      const { name, licensePlate } = vehicleDetails[vehicleId];
      return licensePlate ? `${name} (${licensePlate})` : name;
    }

    // If vehicle details not loaded yet and we're loading, show loading indicator
    if (loadingVehicles) {
      return (
        <span className="flex items-center text-gray-500">
          <RefreshCw size={12} className="animate-spin mr-1" />
          Loading...
        </span>
      );
    }

    // If we can't find vehicle details, show a shortened version of the ID
    if (vehicleId.includes('-')) {
      // For UUIDs, show first 8 characters
      return vehicleId.substring(0, 8) + '...';
    }

    return vehicleId;
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
        <div className="animate-pulse">
          <div className="h-16 bg-gradient-to-r from-blue-600 to-blue-500"></div>
          <div className="divide-y divide-gray-200">
            {[1, 2, 3].map(i => (
              <div key={i} className="px-6 py-4 flex items-center justify-between">
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="flex space-x-2">
                  <div className="h-8 w-8 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-4 text-white">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold flex items-center">
            <Route size={18} className="mr-2" />
            Trip Records
          </h3>
          <div className="flex items-center space-x-3">
            {trips.length > 0 && (
              <span className="text-sm text-blue-100">
                {trips.length} {trips.length === 1 ? 'trip' : 'trips'} recorded
              </span>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-white hover:text-blue-100 flex items-center text-sm"
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
      </div>

      {isExpanded && (
        <>
          <div className="overflow-x-auto">
            <div className="max-h-96 overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vehicle
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Route
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Miles
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Gallons
                    </th>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider sticky right-0 bg-gray-50">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {trips.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center">
                        <div className="max-w-sm mx-auto">
                          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Route size={32} className="text-blue-600" />
                          </div>
                          <h3 className="text-lg font-medium text-gray-900 mb-1">No trips recorded</h3>
                          <p className="text-gray-500 mb-4">Start tracking your IFTA trips to see them here</p>
                          <button
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                          >
                            <Plus size={16} className="mr-2" />
                            Add New Trip
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    trips.map((trip, index) => (
                      <tr key={trip.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {formatDate(trip.start_date)}
                            {getSourceBadge(trip)}
                          </div>
                          {trip.notes && (
                            <div className="text-xs text-gray-500 mt-1 truncate max-w-xs" title={trip.notes}>
                              {trip.notes}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Truck size={16} className="text-blue-500 mr-2" />
                            <div className="text-sm font-medium text-gray-900">
                              {formatVehicleDisplay(trip.vehicle_id)}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm font-medium text-gray-900">
                            {trip.start_jurisdiction === trip.end_jurisdiction ? (
                              <div className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md">
                                {trip.start_jurisdiction || "UNK"}
                              </div>
                            ) : (
                              <>
                                <div className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md mr-2">
                                  {trip.start_jurisdiction || "UNK"}
                                </div>
                                <Route size={14} className="text-gray-400 mx-1" />
                                <div className="bg-green-100 text-green-700 px-2 py-1 rounded-md ml-2">
                                  {trip.end_jurisdiction || "UNK"}
                                </div>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <span className="text-sm font-semibold text-gray-900">
                            {trip.total_miles?.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) || "0.0"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <span className="text-sm font-semibold text-gray-900">
                            {trip.gallons?.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) || "0.0"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center space-x-2">
                            {!trip.is_imported && (
                              <button
                                className="p-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
                                title="Edit"
                              >
                                <Edit size={16} />
                              </button>
                            )}
                            <button
                              className="p-1.5 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors"
                              onClick={() => onDeleteTrip(trip)}
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {trips.length > 5 && (
            <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 text-center text-sm text-gray-500">
              Showing all {trips.length} trips. Scroll to view more.
            </div>
          )}
        </>
      )}
    </div>
  );
}