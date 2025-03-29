// src/components/ifta/VehicleSelector.js
import { useState, useEffect, useCallback } from "react";
import { Truck, ChevronDown } from "lucide-react";

export default function VehicleSelector({ 
  selectedVehicle, 
  setSelectedVehicle, 
  vehicles = [], 
  isLoading = false 
}) {
  // Group vehicles by active and inactive if status is available
  const [vehicleGroups, setVehicleGroups] = useState({
    all: { label: "All Vehicles", id: "all" },
    vehicles: []
  });

  // Process vehicle data when it changes
  useEffect(() => {
    // Skip processing if vehicles array is empty
    if (!vehicles || vehicles.length === 0) {
      setVehicleGroups({
        all: { label: "All Vehicles", id: "all" },
        vehicles: []
      });
      return;
    }
    
    try {
      // Format vehicles for display
      const processedVehicles = vehicles.map(vehicle => {
        // If vehicle is already formatted as an object with id property, use as is
        if (typeof vehicle === 'object' && vehicle.id) {
          return {
            id: typeof vehicle.id === 'object' ? JSON.stringify(vehicle.id) : String(vehicle.id),
            label: vehicle.name || vehicle.id,
            licensePlate: vehicle.license_plate || vehicle.licensePlate
          };
        }
        
        // Otherwise, use the vehicle string as both id and label
        return {
          id: String(vehicle),
          label: String(vehicle),
          licensePlate: ''
        };
      });
      
      setVehicleGroups({
        all: { label: "All Vehicles", id: "all" },
        vehicles: processedVehicles
      });
    } catch (error) {
      console.error("Error processing vehicles:", error);
      // Keep existing state on error
    }
  }, [vehicles]);

  // Format the selected vehicle for display
  const getSelectedVehicleDisplay = useCallback(() => {
    if (!selectedVehicle || selectedVehicle === 'all') {
      return "All Vehicles";
    }
    
    const vehicle = vehicleGroups.vehicles.find(v => v.id === selectedVehicle);
    if (!vehicle) return selectedVehicle;
    
    return vehicle.licensePlate 
      ? `${vehicle.label} (${vehicle.licensePlate})`
      : vehicle.label;
  }, [selectedVehicle, vehicleGroups.vehicles]);

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
            disabled={isLoading}
          >
            <option value="all">{vehicleGroups.all.label}</option>
            {vehicleGroups.vehicles.map((vehicle) => (
              <option 
                key={typeof vehicle.id === 'object' ? JSON.stringify(vehicle.id) : vehicle.id} 
                value={typeof vehicle.id === 'object' ? JSON.stringify(vehicle.id) : vehicle.id}
              >
                {vehicle.label}
                {vehicle.licensePlate && ` (${vehicle.licensePlate})`}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
            <ChevronDown size={16} className="text-gray-400" />
          </div>
        </div>
      </div>
      
      <div className="mt-4 hidden sm:grid sm:grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="text-xs text-blue-500 uppercase font-medium">Selected Vehicle</div>
          <div className="text-lg font-medium text-blue-700">{getSelectedVehicleDisplay()}</div>
        </div>
        
        <div className="bg-green-50 p-3 rounded-lg">
          <div className="text-xs text-green-500 uppercase font-medium">Available Vehicles</div>
          <div className="text-lg font-medium text-green-700">
            {vehicleGroups.vehicles.length} vehicle{vehicleGroups.vehicles.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>
    </div>
  );
}