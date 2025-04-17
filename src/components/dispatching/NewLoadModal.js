// src/components/dispatching/NewLoadModal.js
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { X, RefreshCw, Users, Truck as TruckIcon } from "lucide-react";

export default function NewLoadModal({ onClose, onSave, customers }) {
  const [formData, setFormData] = useState({
    customer: "",
    origin: "",
    destination: "",
    pickupDate: "",
    deliveryDate: "",
    rate: "",
    description: "",
    loadNumber: "", // Added load number field
    driverId: "",
    truckId: ""
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [drivers, setDrivers] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [loadingFleet, setLoadingFleet] = useState(true);
  const [fleetError, setFleetError] = useState(null);

  // Fetch drivers and trucks when modal opens
  useEffect(() => {
    async function fetchFleetData() {
      try {
        setLoadingFleet(true);
        setFleetError(null);
        
        // Get user ID from session
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");
        
        // Fetch drivers and trucks in parallel
        const [driversResult, trucksResult] = await Promise.all([
          // Try to fetch from drivers table first
          supabase
            .from('drivers')
            .select('id, name, status')
            .eq('user_id', user.id)
            .eq('status', 'Active'),
            
          // Try to fetch from vehicles/trucks table
          supabase
            .from('vehicles')
            .select('id, name, status, make, model')
            .eq('user_id', user.id)
            .eq('status', 'Active')
        ]);
        
        // Handle any errors
        if (driversResult.error) {
          console.error("Error fetching drivers:", driversResult.error);
        } else {
          setDrivers(driversResult.data || []);
        }
        
        if (trucksResult.error) {
          // If vehicles table doesn't exist, try trucks table as fallback
          const fallbackResult = await supabase
            .from('trucks')
            .select('id, name, status, make, model')
            .eq('user_id', user.id)
            .eq('status', 'Active');
            
          if (fallbackResult.error) {
            console.error("Error fetching trucks:", fallbackResult.error);
          } else {
            setTrucks(fallbackResult.data || []);
          }
        } else {
          setTrucks(trucksResult.data || []);
        }
      } catch (error) {
        console.error("Error loading fleet data:", error);
        setFleetError("Failed to load drivers and trucks. Please try again.");
      } finally {
        setLoadingFleet(false);
      }
    }
    
    fetchFleetData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      
      // Get user ID from session
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      
      // Find the selected driver name
      const selectedDriver = drivers.find(d => d.id === formData.driverId);
      const driverName = selectedDriver ? selectedDriver.name : "";
      
      // Find the selected truck
      const selectedTruck = trucks.find(t => t.id === formData.truckId);
      
      // Format data for the database
      const dbData = {
        user_id: user.id,
        load_number: formData.loadNumber, // Use user-provided load number
        customer: formData.customer,
        origin: formData.origin,
        destination: formData.destination,
        pickup_date: formData.pickupDate,
        delivery_date: formData.deliveryDate,
        rate: parseFloat(formData.rate) || 0,
        status: "Pending",
        description: formData.description,
        driver: driverName,
        driver_id: formData.driverId || null,
        vehicle_id: formData.truckId || null,  // Use vehicle_id, not truck_id
        // Keep the truck_info field as is
        truck_info: selectedTruck ? `${selectedTruck.make || ''} ${selectedTruck.model || ''} (${selectedTruck.name})`.trim() : null,
        created_at: new Date().toISOString(),
        
        // Include other necessary fields
        factored: false,
        notes: formData.description || "",
        final_rate: parseFloat(formData.rate) || 0,
        distance: Math.floor(Math.random() * 500) + 100 // Placeholder
      };
      
      console.log("Attempting to insert load with data:", dbData);
      
      // Insert into database
      const { data, error } = await supabase
        .from('loads')
        .insert([dbData])
        .select();
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        throw new Error("Failed to create load - no data returned");
      }
      
      // Map database response to component format
      const newLoad = {
        id: data[0].id,
        loadNumber: data[0].load_number,
        customer: data[0].customer,
        origin: data[0].origin,
        destination: data[0].destination,
        pickupDate: data[0].pickup_date,
        deliveryDate: data[0].delivery_date,
        rate: data[0].rate,
        status: data[0].status,
        distance: data[0].distance,
        description: data[0].description,
        driver: data[0].driver,
        driverId: data[0].driver_id,
        truckId: data[0].vehicle_id,  // Map database vehicle_id to UI truckId
        truckInfo: data[0].truck_info
      };
      
      // If a driver is assigned, update the load status to "Assigned"
      if (formData.driverId) {
        const { error: updateError } = await supabase
          .from('loads')
          .update({ status: 'Assigned' })
          .eq('id', data[0].id);
          
        if (updateError) {
          console.error("Warning: Failed to update load status to Assigned:", updateError);
        } else {
          newLoad.status = "Assigned";
        }
      }
      
      onSave(newLoad);
      onClose();
    } catch (error) {
      console.error("Error creating load:", error);
      // More detailed error message for debugging
      if (error.message) {
        console.error("Error message:", error.message);
      }
      if (error.details) {
        console.error("Error details:", error.details);
      }
      alert(`Failed to create load: ${error.message || "Unknown error"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900">Create New Load</h2>
          <button 
            onClick={onClose}
            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-full"
            disabled={isSubmitting}
          >
            <X size={18} />
          </button>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Load Number Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Load Number *</label>
            <input
              type="text"
              name="loadNumber"
              value={formData.loadNumber}
              onChange={handleChange}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
              required
            />
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer *</label>
              <select
                name="customer"
                value={formData.customer}
                onChange={handleChange}
                className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                required
              >
                <option value="">Select Customer</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.company_name}>{customer.company_name}</option>
                ))}
              </select>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Origin *</label>
                <input
                  type="text"
                  name="origin"
                  placeholder="City, State"
                  value={formData.origin}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Destination *</label>
                <input
                  type="text"
                  name="destination"
                  placeholder="City, State"
                  value={formData.destination}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Date *</label>
                <input
                  type="date"
                  name="pickupDate"
                  value={formData.pickupDate}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Date *</label>
                <input
                  type="date"
                  name="deliveryDate"
                  value={formData.deliveryDate}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rate ($) *</label>
              <input
                type="number"
                name="rate"
                placeholder="0.00"
                value={formData.rate}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                required
              />
            </div>
            
            {/* Driver Selection */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                <Users size={16} className="mr-1" /> Driver Assignment
              </label>
              <select
                name="driverId"
                value={formData.driverId}
                onChange={handleChange}
                className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                disabled={loadingFleet}
              >
                <option value="">Unassigned</option>
                {drivers.map(driver => (
                  <option key={driver.id} value={driver.id}>{driver.name}</option>
                ))}
              </select>
              {loadingFleet && (
                <p className="mt-1 text-xs text-gray-500 flex items-center">
                  <RefreshCw size={12} className="animate-spin mr-1" />
                  Loading drivers...
                </p>
              )}
              {drivers.length === 0 && !loadingFleet && (
                <p className="mt-1 text-xs text-gray-500">
                  No active drivers found. <a href="/dashboard/fleet/drivers" className="text-blue-600 hover:underline">Add drivers</a> in fleet management.
                </p>
              )}
            </div>
            
            {/* Truck Selection */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                <TruckIcon size={16} className="mr-1" /> Truck Assignment
              </label>
              <select
                name="truckId"
                value={formData.truckId}
                onChange={handleChange}
                className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                disabled={loadingFleet}
              >
                <option value="">No truck assigned</option>
                {trucks.map(truck => (
                  <option key={truck.id} value={truck.id}>{truck.name} - {truck.make} {truck.model}</option>
                ))}
              </select>
              {loadingFleet && (
                <p className="mt-1 text-xs text-gray-500 flex items-center">
                  <RefreshCw size={12} className="animate-spin mr-1" />
                  Loading trucks...
                </p>
              )}
              {trucks.length === 0 && !loadingFleet && (
                <p className="mt-1 text-xs text-gray-500">
                  No active trucks found. <a href="/dashboard/fleet/trucks" className="text-blue-600 hover:underline">Add trucks</a> in fleet management.
                </p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
              <textarea
                name="description"
                placeholder="Enter any special instructions or notes..."
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
              ></textarea>
            </div>
          </div>
          
          {fleetError && (
            <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded border border-red-200">
              {fleetError}
            </div>
          )}
          
          <div className="mt-8 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 text-sm"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm flex items-center"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw size={16} className="mr-2 animate-spin" />
                  Creating...
                </>
              ) : "Create Load"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}