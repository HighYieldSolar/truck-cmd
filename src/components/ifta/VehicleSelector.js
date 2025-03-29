// src/components/ifta/VehicleSelector.js
import { useState, useEffect, useCallback } from "react";
import { Truck, ChevronDown, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function VehicleSelector({ 
  selectedVehicle, 
  setSelectedVehicle, 
  vehicles = [], 
  isLoading = false,
  userId = null // Optional userId for fetching vehicles directly
}) {
  // State for vehicle data
  const [vehicleOptions, setVehicleOptions] = useState([]);
  const [vehicleDetails, setVehicleDetails] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all vehicles from database on component mount
  useEffect(() => {
    async function fetchVehicles() {
      try {
        setLoading(true);
        setError(null);
        
        // Directly query the vehicles table
        const { data, error } = await supabase
          .from('vehicles')
          .select('id, name, license_plate, make, model, year')
          .order('name');
          
        if (error) throw error;
        
        if (data && data.length > 0) {
          console.log("Fetched vehicles:", data);
          
          // Create lookup map for vehicle details
          const detailsMap = {};
          data.forEach(vehicle => {
            detailsMap[vehicle.id] = {
              id: vehicle.id,
              name: vehicle.name || 'Unnamed Vehicle',
              licensePlate: vehicle.license_plate || '',
              make: vehicle.make || '',
              model: vehicle.model || '',
              year: vehicle.year || ''
            };
          });
          
          // Save details for lookup
          setVehicleDetails(detailsMap);
          
          // Create options for dropdown
          setVehicleOptions(data.map(vehicle => ({
            id: vehicle.id,
            label: vehicle.name || `${vehicle.make} ${vehicle.model}`.trim() || vehicle.id,
            licensePlate: vehicle.license_plate || ''
          })));
        } else {
          // If no data returned, try to format the passed vehicles
          processPassedVehicles();
        }
      } catch (err) {
        console.error("Error fetching vehicles:", err);
        setError(err.message);
        // If database query fails, try to use passed vehicles
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
            licensePlate: vehicle.license_plate || ''
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
  }, [vehicles]); // Only run on mount and when vehicles prop changes

  // Lookup vehicle details by ID
  const getVehicleDisplay = useCallback((vehicleId) => {
    if (!vehicleId || vehicleId === 'all') {
      return "All Vehicles";
    }
    
    // Check if we have the details in our lookup table
    if (vehicleDetails[vehicleId]) {
      const vehicle = vehicleDetails[vehicleId];
      let display = vehicle.name;
      
      // Add license plate if available
      if (vehicle.licensePlate) {
        display += ` (${vehicle.licensePlate})`;
      }
      
      return display;
    }
    
    // Find in options
    const option = vehicleOptions.find(v => v.id === vehicleId);
    if (option) {
      return option.licensePlate 
        ? `${option.label} (${option.licensePlate})`
        : option.label;
    }
    
    // Default fallback for UUIDs
    if (typeof vehicleId === 'string' && vehicleId.includes('-')) {
      return "Selected Vehicle";
    }
    
    return vehicleId;
  }, [vehicleDetails, vehicleOptions]);

  // If a specific vehicle ID is selected but not in our options, fetch it directly
  useEffect(() => {
    async function fetchSingleVehicle() {
      // Skip all vehicles or if already in details
      if (!selectedVehicle || selectedVehicle === 'all' || vehicleDetails[selectedVehicle]) {
        return;
      }
      
      // Skip if it doesn't look like a UUID
      if (typeof selectedVehicle !== 'string' || !selectedVehicle.includes('-')) {
        return;
      }
      
      try {
        setLoading(true);
        
        // Fetch this specific vehicle
        const { data, error } = await supabase
          .from('vehicles')
          .select('id, name, license_plate, make, model')
          .eq('id', selectedVehicle)
          .single();
          
        if (error) throw error;
        
        if (data) {
          console.log("Fetched specific vehicle:", data);
          
          // Add to details map
          setVehicleDetails(prev => ({
            ...prev,
            [data.id]: {
              id: data.id,
              name: data.name || `${data.make || ''} ${data.model || ''}`.trim() || 'Vehicle',
              licensePlate: data.license_plate || '',
              make: data.make || '',
              model: data.model || ''
            }
          }));
          
          // Check if we need to add to options
          if (!vehicleOptions.some(v => v.id === data.id)) {
            setVehicleOptions(prev => [
              ...prev,
              {
                id: data.id,
                label: data.name || `${data.make || ''} ${data.model || ''}`.trim() || 'Vehicle',
                licensePlate: data.license_plate || ''
              }
            ]);
          }
        }
      } catch (err) {
        console.error("Error fetching specific vehicle:", err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchSingleVehicle();
  }, [selectedVehicle, vehicleDetails, vehicleOptions]);

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
        <div className="flex items-center mb-3 sm:mb-0">
          <Truck size={18} className="text-blue-600 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Vehicle Selection</h3>
        </div>
        
        <div className="relative w-full sm:w-auto">
          <select
            id="vehicle"
            name="vehicle"
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            value={selectedVehicle}
            onChange={(e) => setSelectedVehicle(e.target.value)}
            disabled={isLoading || loading}
          >
            <option value="all">All Vehicles</option>
            {vehicleOptions.map((vehicle) => (
              <option 
                key={vehicle.id} 
                value={vehicle.id}
              >
                {vehicle.label}
                {vehicle.licensePlate && ` (${vehicle.licensePlate})`}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
            {loading ? (
              <RefreshCw size={16} className="text-blue-500 animate-spin" />
            ) : (
              <ChevronDown size={16} className="text-gray-400" />
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-4 hidden sm:grid sm:grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="text-xs text-blue-500 uppercase font-medium">SELECTED VEHICLE</div>
          <div className="text-lg font-medium text-blue-700">{getVehicleDisplay(selectedVehicle)}</div>
        </div>
        
        <div className="bg-green-50 p-3 rounded-lg">
          <div className="text-xs text-green-500 uppercase font-medium">AVAILABLE VEHICLES</div>
          <div className="text-lg font-medium text-green-700">
            {vehicleOptions.length} vehicle{vehicleOptions.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>
      
      {error && (
        <div className="mt-2 text-sm text-red-600">
          Error loading vehicles: {error}
        </div>
      )}
    </div>
  );
}