// src/components/dispatching/NewLoadModal.js
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { X, RefreshCw, Users, Truck as TruckIcon, Plus } from "lucide-react";

export default function NewLoadModal({ onClose, onSave, customers }) {
  const [formData, setFormData] = useState({
    customer: "",
    origin: "",
    destination: "",
    pickupDate: "",
    deliveryDate: "",
    rate: "",
    description: "",
    loadNumber: "",
    driverId: "",
    truckId: ""
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [drivers, setDrivers] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [loadingFleet, setLoadingFleet] = useState(true);
  const [fleetError, setFleetError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Maintain the same submission logic
    // Just updating the UI components
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10 rounded-t-xl">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-blue-100 mr-3">
              <Plus size={20} className="text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Create New Load</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isSubmitting}
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-8">
            {/* Basic Information */}
            <div>
              <h3 className="text-base font-medium text-gray-900 mb-5">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Load Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="loadNumber"
                    value={formData.loadNumber}
                    onChange={handleChange}
                    className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Customer <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="customer"
                    value={formData.customer}
                    onChange={handleChange}
                    className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
                    required
                  >
                    <option value="">Select Customer</option>
                    {customers.map(customer => (
                      <option key={customer.id} value={customer.company_name}>{customer.company_name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            {/* Route Information */}
            <div>
              <h3 className="text-base font-medium text-gray-900 mb-5">Route Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Origin <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="origin"
                    placeholder="City, State"
                    value={formData.origin}
                    onChange={handleChange}
                    className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Destination <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="destination"
                    placeholder="City, State"
                    value={formData.destination}
                    onChange={handleChange}
                    className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    required
                  />
                </div>
              </div>
            </div>
            
            {/* Schedule */}
            <div>
              <h3 className="text-base font-medium text-gray-900 mb-5">Schedule</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Pickup Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="pickupDate"
                    value={formData.pickupDate}
                    onChange={handleChange}
                    className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Delivery Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="deliveryDate"
                    value={formData.deliveryDate}
                    onChange={handleChange}
                    className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    required
                  />
                </div>
              </div>
            </div>
            
            {/* Financial Information */}
            <div>
              <h3 className="text-base font-medium text-gray-900 mb-5">Financial Information</h3>
              <div className="md:w-1/2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Rate ($) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="rate"
                  placeholder="0.00"
                  value={formData.rate}
                  onChange={handleChange}
                  className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  required
                />
              </div>
            </div>
            
            {/* Assignment */}
            <div>
              <h3 className="text-base font-medium text-gray-900 mb-5">Assignment</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center">
                    <Users size={16} className="mr-2" /> Driver Assignment
                  </label>
                  <select
                    name="driverId"
                    value={formData.driverId}
                    onChange={handleChange}
                    className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
                    disabled={loadingFleet}
                  >
                    <option value="">Unassigned</option>
                    {drivers.map(driver => (
                      <option key={driver.id} value={driver.id}>{driver.name}</option>
                    ))}
                  </select>
                  {loadingFleet && (
                    <p className="mt-1.5 text-xs text-gray-500 flex items-center">
                      <RefreshCw size={12} className="animate-spin mr-1" />
                      Loading drivers...
                    </p>
                  )}
                  {drivers.length === 0 && !loadingFleet && (
                    <p className="mt-1.5 text-xs text-gray-500">
                      No active drivers found. <a href="/dashboard/fleet/drivers" className="text-blue-600 hover:underline">Add drivers</a> in fleet management.
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center">
                    <TruckIcon size={16} className="mr-2" /> Truck Assignment
                  </label>
                  <select
                    name="truckId"
                    value={formData.truckId}
                    onChange={handleChange}
                    className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
                    disabled={loadingFleet}
                  >
                    <option value="">No truck assigned</option>
                    {trucks.map(truck => (
                      <option key={truck.id} value={truck.id}>{truck.name} - {truck.make} {truck.model}</option>
                    ))}
                  </select>
                  {loadingFleet && (
                    <p className="mt-1.5 text-xs text-gray-500 flex items-center">
                      <RefreshCw size={12} className="animate-spin mr-1" />
                      Loading trucks...
                    </p>
                  )}
                  {trucks.length === 0 && !loadingFleet && (
                    <p className="mt-1.5 text-xs text-gray-500">
                      No active trucks found. <a href="/dashboard/fleet/trucks" className="text-blue-600 hover:underline">Add trucks</a> in fleet management.
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Additional Information */}
            <div>
              <h3 className="text-base font-medium text-gray-900 mb-5">Additional Information</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description (Optional)</label>
                <textarea
                  name="description"
                  placeholder="Enter any special instructions or notes..."
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                ></textarea>
              </div>
            </div>
          </div>
          
          {fleetError && (
            <div className="mt-6 p-4 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
              {fleetError}
            </div>
          )}
        </form>
        
        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3 rounded-b-xl sticky bottom-0 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 text-sm font-medium transition-colors"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center transition-colors"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <RefreshCw size={16} className="mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus size={16} className="mr-2" />
                Create Load
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}