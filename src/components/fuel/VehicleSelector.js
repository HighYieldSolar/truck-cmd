// src/components/fuel/VehicleSelector.js
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Truck } from "lucide-react";

export default function VehicleSelector({ 
  selectedVehicleId, 
  onChange, 
  className,
  required = false,
  disabled = false
}) {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load vehicles on component mount
  useEffect(() => {
    async function loadVehicles() {
      try {
        setLoading(true);
        
        // Get the current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        // First try to get trucks from the vehicles table
        let { data, error } = await supabase
          .from('vehicles')
          .select('id, name, license_plate')
          .eq('user_id', user.id);
        
        // If that fails, try the trucks table instead
        if (error || !data || data.length === 0) {
          const { data: trucksData, error: trucksError } = await supabase
            .from('trucks')
            .select('id, name, license_plate')
            .eq('user_id', user.id);
            
          if (!trucksError && trucksData) {
            data = trucksData;
          }
        }
        
        // If we still don't have data, try to get vehicle IDs from fuel entries
        if (!data || data.length === 0) {
          const { data: fuelData, error: fuelError } = await supabase
            .from('fuel_entries')
            .select('vehicle_id')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
            
          if (!fuelError && fuelData && fuelData.length > 0) {
            // Get unique vehicle IDs
            const uniqueVehicleIds = [...new Set(fuelData.map(entry => entry.vehicle_id))];
            
            // Create vehicle objects with ID as both id and name
            data = uniqueVehicleIds.map(id => ({
              id,
              name: id // Use ID as name if we don't have a better name
            }));
          }
        }
        
        // Set vehicles with formatted display names
        if (data && data.length > 0) {
          setVehicles(data.map(vehicle => ({
            id: vehicle.id,
            displayName: formatVehicleName(vehicle)
          })));
        }
      } catch (err) {
        console.error('Error loading vehicles:', err);
        setError('Failed to load vehicles');
      } finally {
        setLoading(false);
      }
    }
    
    loadVehicles();
  }, []);

  // Format vehicle name to be more user-friendly
  const formatVehicleName = (vehicle) => {
    if (!vehicle) return '';
    
    if (vehicle.name && vehicle.license_plate) {
      return `${vehicle.name} (${vehicle.license_plate})`;
    } else if (vehicle.name) {
      return vehicle.name;
    } else if (vehicle.license_plate) {
      return `Vehicle ${vehicle.license_plate}`;
    } else {
      return vehicle.id;
    }
  };

  // Handle selection change
  const handleChange = (e) => {
    if (onChange) {
      onChange({
        target: {
          name: 'vehicle_id',
          value: e.target.value
        }
      });
    }
  };

  return (
    <div className={className}>
      <label htmlFor="vehicle_id" className="text-sm font-medium text-gray-700 mb-1 flex items-center">
        <Truck size={16} className="text-gray-400 mr-1" /> Vehicle ID {required && '*'}
      </label>
      
      {loading ? (
        <select
          disabled
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
        >
          <option>Loading vehicles...</option>
        </select>
      ) : error ? (
        <div>
          <select
            id="vehicle_id"
            name="vehicle_id"
            value={selectedVehicleId}
            onChange={handleChange}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
            required={required}
            disabled={disabled}
          >
            <option value="">Enter Vehicle ID</option>
            {selectedVehicleId && <option value={selectedVehicleId}>{selectedVehicleId}</option>}
          </select>
          <p className="mt-1 text-sm text-red-600">{error}</p>
        </div>
      ) : vehicles.length > 0 ? (
        <select
          id="vehicle_id"
          name="vehicle_id"
          value={selectedVehicleId}
          onChange={handleChange}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
          required={required}
          disabled={disabled}
        >
          <option value="">Select Vehicle</option>
          {vehicles.map(vehicle => (
            <option key={vehicle.id} value={vehicle.id}>
              {vehicle.displayName}
            </option>
          ))}
        </select>
      ) : (
        <div>
          <input
            type="text"
            id="vehicle_id"
            name="vehicle_id"
            value={selectedVehicleId}
            onChange={handleChange}
            placeholder="Enter Vehicle ID"
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
            required={required}
            disabled={disabled}
          />
          <p className="mt-1 text-sm text-gray-500">No saved vehicles found. Enter an ID for your vehicle.</p>
        </div>
      )}
    </div>
  );
}