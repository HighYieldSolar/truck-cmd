"use client";

import { useState, useEffect } from "react";
import { X, RefreshCw, AlertCircle, CheckCircle } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { createDriver, updateDriver, uploadDriverImage } from "@/lib/services/driverService";

export default function DriverFormModal({ isOpen, onClose, driver, userId, onSubmit }) {
  const [formData, setFormData] = useState({
    name: '',
    position: 'Driver',
    email: '',
    phone: '',
    license_number: '',
    license_state: '',
    license_expiry: '',
    medical_card_expiry: '',
    status: 'Active',
    hire_date: '',
    city: '',
    state: '',
    emergency_contact: '',
    emergency_phone: '',
    image: null,
    image_file: null,
    notes: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(null);

  // Reset form when driver changes
  useEffect(() => {
    if (driver) {
      // Edit mode - populate form with driver data
      setFormData({
        name: driver.name || '',
        position: driver.position || 'Driver',
        email: driver.email || '',
        phone: driver.phone || '',
        license_number: driver.license_number || '',
        license_state: driver.license_state || '',
        license_expiry: driver.license_expiry || '',
        medical_card_expiry: driver.medical_card_expiry || '',
        status: driver.status || 'Active',
        hire_date: driver.hire_date || '',
        city: driver.city || '',
        state: driver.state || '',
        emergency_contact: driver.emergency_contact || '',
        emergency_phone: driver.emergency_phone || '',
        image: driver.image || null,
        image_file: null,
        notes: driver.notes || ''
      });
    } else {
      // Add mode - reset form
      setFormData({
        name: '',
        position: 'Driver',
        email: '',
        phone: '',
        license_number: '',
        license_state: '',
        license_expiry: '',
        medical_card_expiry: '',
        status: 'Active',
        hire_date: '',
        city: '',
        state: '',
        emergency_contact: '',
        emergency_phone: '',
        image: null,
        image_file: null,
        notes: ''
      });
    }
    
    setErrors({});
    setSubmitError(null);
    setSubmitSuccess(null);
  }, [driver, isOpen]);

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
      newErrors.name = 'Driver name is required';
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (formData.phone && !/^(\+\d{1,2}\s?)?(\d{3}[\s.-]?\d{3}[\s.-]?\d{4})$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    
    if (formData.emergency_phone && !/^(\+\d{1,2}\s?)?(\d{3}[\s.-]?\d{3}[\s.-]?\d{4})$/.test(formData.emergency_phone)) {
      newErrors.emergency_phone = 'Please enter a valid phone number';
    }
    
    // Check if license is about to expire or already expired
    if (formData.license_expiry) {
      const expiryDate = new Date(formData.license_expiry);
      const today = new Date();
      
      if (expiryDate < today) {
        newErrors.license_expiry_warning = 'License has already expired';
      } else {
        const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
        if (daysUntilExpiry < 30) {
          newErrors.license_expiry_warning = `License expires in ${daysUntilExpiry} days`;
        }
      }
    }
    
    // Check if medical card is about to expire or already expired
    if (formData.medical_card_expiry) {
      const expiryDate = new Date(formData.medical_card_expiry);
      const today = new Date();
      
      if (expiryDate < today) {
        newErrors.medical_card_expiry_warning = 'Medical card has already expired';
      } else {
        const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
        if (daysUntilExpiry < 30) {
          newErrors.medical_card_expiry_warning = `Medical card expires in ${daysUntilExpiry} days`;
        }
      }
    }
    
    setErrors(newErrors);
    // We allow form submission even with warnings
    return !newErrors.name && !newErrors.email && !newErrors.phone && !newErrors.emergency_phone;
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
        imageUrl = await uploadDriverImage(userId, formData.image_file);
      }
      
      // Prepare data for submission
      const driverData = {
        name: formData.name,
        position: formData.position,
        email: formData.email,
        phone: formData.phone,
        license_number: formData.license_number,
        license_state: formData.license_state,
        license_expiry: formData.license_expiry,
        medical_card_expiry: formData.medical_card_expiry,
        status: formData.status,
        hire_date: formData.hire_date,
        city: formData.city,
        state: formData.state,
        emergency_contact: formData.emergency_contact,
        emergency_phone: formData.emergency_phone,
        image: imageUrl,
        notes: formData.notes,
      };
      
      let result;
      
      if (driver) {
        // Update existing driver
        result = await updateDriver(driver.id, driverData);
      } else {
        // Create new driver
        driverData.user_id = userId;
        driverData.created_at = new Date().toISOString();
        result = await createDriver(driverData);
      }
      
      setSubmitSuccess(driver ? 'Driver updated successfully' : 'Driver added successfully');
      
      // Call the onSubmit callback
      if (onSubmit) {
        await onSubmit(result);
      }
      
      // Close modal after a short delay to show success message
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Error saving driver:', error);
      setSubmitError(error.message || 'Failed to save driver. Please try again.');
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
            {driver ? 'Edit Driver' : 'Add New Driver'}
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
                Driver Name *
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
                placeholder="Full name"
                required
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-1">
                Position
              </label>
              <select
                id="position"
                name="position"
                value={formData.position}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="Driver">Driver</option>
                <option value="Lead Driver">Lead Driver</option>
                <option value="Owner-Operator">Owner-Operator</option>
                <option value="Dispatcher">Dispatcher</option>
                <option value="Manager">Manager</option>
                <option value="Other">Other</option>
              </select>
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
                <option value="Inactive">Inactive</option>
                <option value="On Leave">On Leave</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="hire_date" className="block text-sm font-medium text-gray-700 mb-1">
                Hire Date
              </label>
              <input
                type="date"
                id="hire_date"
                name="hire_date"
                value={formData.hire_date}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
            
            <div>
              <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">
                Driver Image
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
                    alt="Driver preview" 
                    className="h-32 w-32 object-cover rounded-full border border-gray-300" 
                  />
                </div>
              )}
            </div>

            {/* Contact Information */}
            <div className="md:col-span-2 mt-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Contact Information</h3>
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`block w-full px-3 py-2 border ${
                  errors.email ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                } rounded-md shadow-sm placeholder-gray-400 text-sm`}
                placeholder="email@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={`block w-full px-3 py-2 border ${
                  errors.phone ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                } rounded-md shadow-sm placeholder-gray-400 text-sm`}
                placeholder="(555) 123-4567"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 text-sm"
                placeholder="City"
              />
            </div>
            
            <div>
              <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                State
              </label>
              <input
                type="text"
                id="state"
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 text-sm"
                placeholder="State"
              />
            </div>
            
            <div>
              <label htmlFor="emergency_contact" className="block text-sm font-medium text-gray-700 mb-1">
                Emergency Contact
              </label>
              <input
                type="text"
                id="emergency_contact"
                name="emergency_contact"
                value={formData.emergency_contact}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 text-sm"
                placeholder="Contact name"
              />
            </div>
            
            <div>
              <label htmlFor="emergency_phone" className="block text-sm font-medium text-gray-700 mb-1">
                Emergency Phone
              </label>
              <input
                type="tel"
                id="emergency_phone"
                name="emergency_phone"
                value={formData.emergency_phone}
                onChange={handleChange}
                className={`block w-full px-3 py-2 border ${
                  errors.emergency_phone ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                } rounded-md shadow-sm placeholder-gray-400 text-sm`}
                placeholder="(555) 123-4567"
              />
              {errors.emergency_phone && (
                <p className="mt-1 text-sm text-red-600">{errors.emergency_phone}</p>
              )}
            </div>

            {/* License Information */}
            <div className="md:col-span-2 mt-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3">License Information</h3>
            </div>
            
            <div>
              <label htmlFor="license_number" className="block text-sm font-medium text-gray-700 mb-1">
                License Number
              </label>
              <input
                type="text"
                id="license_number"
                name="license_number"
                value={formData.license_number}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 text-sm"
                placeholder="Driver's license number"
              />
            </div>
            
            <div>
              <label htmlFor="license_state" className="block text-sm font-medium text-gray-700 mb-1">
                License State
              </label>
              <input
                type="text"
                id="license_state"
                name="license_state"
                value={formData.license_state}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 text-sm"
                placeholder="e.g. TX"
              />
            </div>
            
            <div>
              <label htmlFor="license_expiry" className="block text-sm font-medium text-gray-700 mb-1">
                License Expiry Date
              </label>
              <input
                type="date"
                id="license_expiry"
                name="license_expiry"
                value={formData.license_expiry}
                onChange={handleChange}
                className={`block w-full px-3 py-2 border ${
                  errors.license_expiry_warning ? 'border-yellow-300' : 'border-gray-300'
                } rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm`}
              />
              {errors.license_expiry_warning && (
                <p className="mt-1 text-sm text-yellow-600">{errors.license_expiry_warning}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="medical_card_expiry" className="block text-sm font-medium text-gray-700 mb-1">
                Medical Card Expiry
              </label>
              <input
                type="date"
                id="medical_card_expiry"
                name="medical_card_expiry"
                value={formData.medical_card_expiry}
                onChange={handleChange}
                className={`block w-full px-3 py-2 border ${
                  errors.medical_card_expiry_warning ? 'border-yellow-300' : 'border-gray-300'
                } rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm`}
              />
              {errors.medical_card_expiry_warning && (
                <p className="mt-1 text-sm text-yellow-600">{errors.medical_card_expiry_warning}</p>
              )}
            </div>
            
            {/* Notes */}
            <div className="md:col-span-2 mt-4">
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
                placeholder="Additional information about this driver"
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
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none flex items-center"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw size={16} className="animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>{driver ? 'Update Driver' : 'Add Driver'}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}