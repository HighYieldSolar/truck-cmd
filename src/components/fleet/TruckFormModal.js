/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import { X, RefreshCw, AlertCircle, CheckCircle } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { createTruck, updateTruck, uploadTruckImage } from "@/lib/services/truckService";

export default function TruckFormModal({ isOpen, onClose, truck, userId, onSubmit }) {
  const [formData, setFormData] = useState({
    name: '',
    make: '',
    model: '',
    year: '',
    vin: '',
    license_plate: '',
    status: 'Active',
    purchase_date: '',
    odometer: '',
    fuel_type: 'Diesel',
    image: null,
    image_file: null,
    notes: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(null);

  // Reset form when truck changes
  useEffect(() => {
    if (truck) {
      // Edit mode - populate form with truck data
      setFormData({
        name: truck.name || '',
        make: truck.make || '',
        model: truck.model || '',
        year: truck.year || '',
        vin: truck.vin || '',
        license_plate: truck.license_plate || '',
        status: truck.status || 'Active',
        purchase_date: truck.purchase_date || '',
        odometer: truck.odometer || '',
        fuel_type: truck.fuel_type || 'Diesel',
        image: truck.image || null,
        image_file: null,
        notes: truck.notes || ''
      });
    } else {
      // Add mode - reset form
      setFormData({
        name: '',
        make: '',
        model: '',
        year: new Date().getFullYear().toString(),
        vin: '',
        license_plate: '',
        status: 'Active',
        purchase_date: '',
        odometer: '',
        fuel_type: 'Diesel',
        image: null,
        image_file: null,
        notes: ''
      });
    }
    
    setErrors({});
    setSubmitError(null);
    setSubmitSuccess(null);
  }, [truck, isOpen]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    
    if (type === 'file' && files?.length > 0) {
      setFormData({
        ...formData,
        image_file: files[0],
      });
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          image: reader.result
        }));
      };
      reader.readAsDataURL(files[0]);
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
    
    // Clear error when field is changed
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Vehicle name is required';
    }
    
    if (!formData.make.trim()) {
      newErrors.make = 'Make is required';
    }
    
    if (!formData.model.trim()) {
      newErrors.model = 'Model is required';
    }
    
    if (!formData.year) {
      newErrors.year = 'Year is required';
    } else if (!/^\d{4}$/.test(formData.year)) {
      newErrors.year = 'Please enter a valid 4-digit year';
    }
    
    if (formData.vin && formData.vin.length > 0 && formData.vin.length !== 17) {
      newErrors.vin = 'VIN must be 17 characters';
    }
    
    if (formData.odometer && isNaN(formData.odometer)) {
      newErrors.odometer = 'Odometer must be a number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);
    
    try {
      let imageUrl = formData.image;
      
      // Upload image if there's a new one
      if (formData.image_file) {
        imageUrl = await uploadTruckImage(userId, formData.image_file);
      }
      
      // Prepare data for submission
      const truckData = {
        name: formData.name,
        make: formData.make,
        model: formData.model,
        year: formData.year,
        vin: formData.vin,
        license_plate: formData.license_plate,
        status: formData.status,
        purchase_date: formData.purchase_date,
        odometer: formData.odometer ? parseFloat(formData.odometer) : null,
        fuel_type: formData.fuel_type,
        image: imageUrl,
        notes: formData.notes,
      };
      
      let result;
      
      if (truck) {
        // Update existing truck
        result = await updateTruck(truck.id, truckData);
      } else {
        // Create new truck
        truckData.user_id = userId;
        truckData.created_at = new Date().toISOString();
        result = await createTruck(truckData);
      }
      
      setSubmitSuccess(truck ? 'Vehicle updated successfully' : 'Vehicle added successfully');
      
      // Call the onSubmit callback
      if (onSubmit) {
        await onSubmit(result);
      }
      
      // Close modal after a short delay to show success message
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Error saving truck:', error);
      setSubmitError(error.message || 'Failed to save vehicle. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center border-b p-4 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-semibold text-gray-900">
            {truck ? 'Edit Vehicle' : 'Add New Vehicle'}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={isSubmitting}
          >
            <X size={24} />
          </button>
        </div>
        
        {/* Success/Error Messages */}
        {submitSuccess && (
          <div className="mx-6 mt-4 bg-green-50 border-l-4 border-green-400 p-4 rounded-md">
            <div className="flex">
              <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
              <p className="text-sm text-green-700">{submitSuccess}</p>
            </div>
          </div>
        )}
        
        {submitError && (
          <div className="mx-6 mt-4 bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
              <p className="text-sm text-red-700">{submitError}</p>
            </div>
          </div>
        )}
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Basic Information</h3>
            </div>
            
            <div className="md:col-span-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Vehicle Name / ID *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`block w-full px-3 py-2 border ${
                  errors.name ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                } rounded-md shadow-sm placeholder-gray-400 text-sm`}
                placeholder="e.g. Truck #101"
                required
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="make" className="block text-sm font-medium text-gray-700 mb-1">
                Make *
              </label>
              <input
                type="text"
                id="make"
                name="make"
                value={formData.make}
                onChange={handleChange}
                className={`block w-full px-3 py-2 border ${
                  errors.make ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                } rounded-md shadow-sm placeholder-gray-400 text-sm`}
                placeholder="e.g. Freightliner"
                required
              />
              {errors.make && (
                <p className="mt-1 text-sm text-red-600">{errors.make}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-1">
                Model *
              </label>
              <input
                type="text"
                id="model"
                name="model"
                value={formData.model}
                onChange={handleChange}
                className={`block w-full px-3 py-2 border ${
                  errors.model ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                } rounded-md shadow-sm placeholder-gray-400 text-sm`}
                placeholder="e.g. Cascadia"
                required
              />
              {errors.model && (
                <p className="mt-1 text-sm text-red-600">{errors.model}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">
                Year *
              </label>
              <input
                type="text"
                id="year"
                name="year"
                value={formData.year}
                onChange={handleChange}
                className={`block w-full px-3 py-2 border ${
                  errors.year ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                } rounded-md shadow-sm placeholder-gray-400 text-sm`}
                placeholder="e.g. 2023"
                required
              />
              {errors.year && (
                <p className="mt-1 text-sm text-red-600">{errors.year}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="Active">Active</option>
                <option value="In Maintenance">In Maintenance</option>
                <option value="Out of Service">Out of Service</option>
                <option value="Idle">Idle</option>
              </select>
            </div>

            {/* Vehicle Details */}
            <div className="md:col-span-2 mt-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Vehicle Details</h3>
            </div>
            
            <div>
              <label htmlFor="vin" className="block text-sm font-medium text-gray-700 mb-1">
                VIN
              </label>
              <input
                type="text"
                id="vin"
                name="vin"
                value={formData.vin}
                onChange={handleChange}
                className={`block w-full px-3 py-2 border ${
                  errors.vin ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                } rounded-md shadow-sm placeholder-gray-400 text-sm`}
                placeholder="Vehicle Identification Number"
              />
              {errors.vin && (
                <p className="mt-1 text-sm text-red-600">{errors.vin}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="license_plate" className="block text-sm font-medium text-gray-700 mb-1">
                License Plate
              </label>
              <input
                type="text"
                id="license_plate"
                name="license_plate"
                value={formData.license_plate}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 text-sm"
                placeholder="e.g. TX-12345"
              />
            </div>
            
            <div>
              <label htmlFor="purchase_date" className="block text-sm font-medium text-gray-700 mb-1">
                Purchase Date
              </label>
              <input
                type="date"
                id="purchase_date"
                name="purchase_date"
                value={formData.purchase_date}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
            
            <div>
              <label htmlFor="odometer" className="block text-sm font-medium text-gray-700 mb-1">
                Odometer (miles)
              </label>
              <input
                type="text"
                id="odometer"
                name="odometer"
                value={formData.odometer}
                onChange={handleChange}
                className={`block w-full px-3 py-2 border ${
                  errors.odometer ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                } rounded-md shadow-sm placeholder-gray-400 text-sm`}
                placeholder="Current mileage"
              />
              {errors.odometer && (
                <p className="mt-1 text-sm text-red-600">{errors.odometer}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="fuel_type" className="block text-sm font-medium text-gray-700 mb-1">
                Fuel Type
              </label>
              <select
                id="fuel_type"
                name="fuel_type"
                value={formData.fuel_type}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="Diesel">Diesel</option>
                <option value="Gasoline">Gasoline</option>
                <option value="CNG">CNG (Compressed Natural Gas)</option>
                <option value="LNG">LNG (Liquefied Natural Gas)</option>
                <option value="Electric">Electric</option>
                <option value="Hybrid">Hybrid</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">
                Vehicle Image
              </label>
              <input
                type="file"
                id="image"
                name="image"
                accept="image/*"
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
              
              {/* Image preview */}
              {formData.image && (
                <div className="mt-2">
                  <img 
                    src={formData.image} 
                    alt="Vehicle preview" 
                    className="h-32 w-auto object-cover rounded-md border border-gray-300" 
                  />
                </div>
              )}
            </div>
            
            <div className="md:col-span-2">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="3"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 text-sm"
                placeholder="Additional information about this vehicle"
              ></textarea>
            </div>
          </div>
          
          {/* Form Actions */}
          <div className="mt-8 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none flex items-center"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw size={16} className="animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>{truck ? 'Update Vehicle' : 'Add Vehicle'}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}