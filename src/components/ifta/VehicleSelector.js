// src/components/ifta/VehicleSelector.js
"use client";

import { useState, useEffect } from "react";
import { Truck, ChevronDown, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function VehicleSelector({
  selectedVehicle,
  setSelectedVehicle,
  vehicles = [],
  isLoading = false,
  userId = null
}) {
  const [vehicleOptions, setVehicleOptions] = useState([]);
  const [vehicleDetails, setVehicleDetails] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all vehicles from database
  useEffect(() => {
    async function fetchVehicles() {
      try {
        setLoading(true);
        setError(null);

        // Get the current user's ID if not provided
        let currentUserId = userId;
        if (!currentUserId) {
          const { data: { user } } = await supabase.auth.getUser();
          currentUserId = user?.id;
        }

        if (!currentUserId) {
          console.warn("No user ID available for fetching vehicles");
          return;
        }

        // Query the vehicles/trucks table
        let { data: vehiclesData, error: vehiclesError } = await supabase
          .from('vehicles')
          .select('id, name, license_plate, make, model, year')
          .eq('user_id', currentUserId)
          .order('name');

        // If no vehicles found, try the trucks table
        if (vehiclesError || !vehiclesData || vehiclesData.length === 0) {
          const { data: trucksData, error: trucksError } = await supabase
            .from('trucks')
            .select('id, name, license_plate, make, model, year')
            .eq('user_id', currentUserId)
            .order('name');

          if (!trucksError && trucksData && trucksData.length > 0) {
            vehiclesData = trucksData;
          }
        }

        if (vehiclesData && vehiclesData.length > 0) {
          // Create lookup map for vehicle details
          const detailsMap = {};
          vehiclesData.forEach(vehicle => {
            detailsMap[vehicle.id] = {
              id: vehicle.id,
              name: vehicle.name || `${vehicle.make || ''} ${vehicle.model || ''}`.trim() || 'Unknown Vehicle',
              licensePlate: vehicle.license_plate || '',
              make: vehicle.make || '',
              model: vehicle.model || '',
              year: vehicle.year || ''
            };
          });

          // Save details for lookup
          setVehicleDetails(detailsMap);

          // Create options for dropdown
          const options = vehiclesData.map(vehicle => ({
            id: vehicle.id,
            label: vehicle.name || `${vehicle.make || ''} ${vehicle.model || ''}`.trim() || vehicle.id,
            licensePlate: vehicle.license_plate || ''
          }));

          setVehicleOptions(options);
        } else {
          // If no data from database, try to format the passed vehicles
          processPassedVehicles();
        }
      } catch (err) {
        console.error("Error fetching vehicles:", err);
        setError(err.message);
        // Fall back to passed vehicles on error
        processPassedVehicles();
      } finally {
        setLoading(false);
      }
    }

    // Process vehicles passed in as props
    function processPassedVehicles() {
      if (!vehicles || vehicles.length === 0) return;

      const processed = vehicles.map(vehicle => {
        if (typeof vehicle === 'object' && vehicle.id) {
          return {
            id: vehicle.id,
            label: vehicle.name || `${vehicle.make || ''} ${vehicle.model || ''}`.trim() || 'Vehicle',
            licensePlate: vehicle.license_plate || vehicle.licensePlate || ''
          };
        }
        return {
          id: vehicle,
          label: typeof vehicle === 'string' ? vehicle : 'Vehicle',
          licensePlate: ''
        };
      });

      setVehicleOptions(processed);
    }

    fetchVehicles();
  }, [vehicles, userId]);

  // Format vehicle display with name and license plate
  const formatVehicleDisplay = (vehicleId) => {
    if (!vehicleId || vehicleId === 'all') {
      return "All Vehicles";
    }

    // Check if we have the details in our lookup table
    if (vehicleDetails[vehicleId]) {
      const vehicle = vehicleDetails[vehicleId];
      return vehicle.licensePlate
        ? `${vehicle.name} (${vehicle.licensePlate})`
        : vehicle.name;
    }

    // Find in options
    const option = vehicleOptions.find(v => v.id === vehicleId);
    if (option) {
      return option.licensePlate
        ? `${option.label} (${option.licensePlate})`
        : option.label;
    }

    return vehicleId;
  };

  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        <Truck size={16} className="text-gray-400" />
      </div>
      <select
        value={selectedVehicle}
        onChange={(e) => setSelectedVehicle(e.target.value)}
        disabled={isLoading || loading}
        className="appearance-none block w-full pl-10 pr-10 py-2 text-sm border border-gray-300 rounded-lg 
        focus:ring-blue-500 focus:border-blue-500 
        bg-gray-50 text-gray-900"
      >
        <option value="all" className="bg-white text-gray-900">All Vehicles</option>
        {vehicleOptions.map((vehicle) => (
          <option key={vehicle.id} value={vehicle.id} className="bg-white text-gray-900">
            {vehicle.licensePlate
              ? `${vehicle.label} (${vehicle.licensePlate})`
              : vehicle.label}
          </option>
        ))}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        {loading ? (
          <RefreshCw size={16} className="text-blue-500 animate-spin" />
        ) : (
          <ChevronDown size={16} className="text-gray-400" />
        )}
      </div>
    </div>
  );
}