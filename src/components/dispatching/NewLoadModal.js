// src/components/dispatching/NewLoadModal.js
"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { X, RefreshCw } from "lucide-react";

export default function NewLoadModal({ onClose, onSave, customers }) {
  const [formData, setFormData] = useState({
    customer: "",
    origin: "",
    destination: "",
    pickupDate: "",
    deliveryDate: "",
    rate: "",
    description: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      // Generate a load number for new loads
      const loadNumber = `L${Math.floor(10000 + Math.random() * 90000)}`;
      
      // Get user ID from session
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      
      // Format data for the database
      const dbData = {
        user_id: user.id,
        load_number: loadNumber,
        customer: formData.customer,
        origin: formData.origin,
        destination: formData.destination,
        pickup_date: formData.pickupDate,
        delivery_date: formData.deliveryDate,
        rate: parseFloat(formData.rate) || 0,
        status: "Pending",
        description: formData.description,
        created_at: new Date()
      };
      
      // Calculate distance using Google Maps API or estimate 
      // For now, use a simple estimation based on origin/destination
      const distance = Math.floor(Math.random() * 500) + 100; // Placeholder
      dbData.distance = distance;
      
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
        driver: ""
      };
      
      onSave(newLoad);
      onClose();
    } catch (error) {
      console.error("Error creating load:", error);
      alert("Failed to create load. Please try again.");
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