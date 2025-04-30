/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import { X, RefreshCw, AlertCircle, CheckCircle, Upload, Calendar, User, Briefcase, Phone, Mail, MapPin, IdCard, FileCheck } from "lucide-react";
import { useLocalStorage } from "@/lib/hooks/useLocalStorage";
import { supabase } from "@/lib/supabaseClient";
import { createDriver, updateDriver, uploadDriverImage } from "@/lib/services/driverService";

export default function DriverFormModal({ isOpen, onClose, driver, userId, onSubmit }) {
  // Initialize with empty form data
  const initialFormData = {
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
  };

  // Generate unique form key based on whether we're editing or creating
  const formKey = driver ? `driverForm-${driver.id}` : 'driverForm-new';
  
  // Use the custom useLocalStorage hook
  const [storedFormData, setStoredFormData, clearStoredFormData] = useLocalStorage(formKey, initialFormData);
  
  // Main form state - will be initialized from either driver data (when editing) or stored data (when creating)
  const [formData, setFormData] = useState(initialFormData);
  
  // Flag to track if initial data was loaded from localStorage
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(null);
  
  // Active tab state
  const [activeTab, setActiveTab] = useState('basic');

  // Save form data to localStorage when specific fields change (only for new drivers)
  const handleSaveToLocalStorage = () => {
    if (!driver && isOpen) {
      setStoredFormData(formData);
    }
  };

  // Load initial data: either from driver (when editing) or from localStorage (when creating)
  useEffect(() => {
    // For editing existing driver
    if (driver) {
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
      
      // Clear any saved data for new drivers to avoid confusion
      localStorage.removeItem('driverForm-new');
    } 
    // For creating new driver
    else if (isOpen && !initialDataLoaded) {
      // Check if we have valid stored data
      const hasValidData = storedFormData && 
        (storedFormData.name || storedFormData.email || storedFormData.phone);
        
      if (hasValidData) {
        setFormData(storedFormData);
      }
      
      // Mark that we've loaded initial data
      setInitialDataLoaded(true);
    }
    
    // Clear error states on every modal open
    setErrors({});
    setSubmitError(null);
    setSubmitSuccess(null);
    
  }, [driver, isOpen, initialDataLoaded, storedFormData]);

  // Reset initialDataLoaded when modal closes
  useEffect(() => {
    if (!isOpen) {
      setInitialDataLoaded(false);
      setActiveTab('basic');
      
      // Only clear storage for new forms, keep edit forms in case user returns
      if (!driver) {
        clearStoredFormData();
      }
    }
  }, [isOpen, driver, clearStoredFormData]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    
    if (type === 'file' && files?.length > 0) {
      setFormData(prev => ({
        ...prev,
        image_file: files[0],
      }));
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          image: reader.result,
        }));
      };
      reader.readAsDataURL(files[0]);
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear error when field is changed
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
    
    // Save to localStorage after a short delay to avoid constant updates
    setTimeout(handleSaveToLocalStorage, 500);
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
      
      // Clear form data in localStorage after successful submission
      clearStoredFormData();
      
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

  // Tabs for form sections
  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: <User size={16} /> },
    { id: 'contact', label: 'Contact Info', icon: <Phone size={16} /> },
    { id: 'license', label: 'License', icon: <IdCard size={16} /> }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center border-b px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white sticky top-0">
          <h2 className="text-xl font-semibold flex items-center">
            {driver ? (
              <>
                <User size={20} className="mr-2" />
                Edit Driver: {driver.name}
              </>
            ) : (
              <>
                <User size={20} className="mr-2" />
                Add New Driver
              </>
            )}
          </h2>
          <button 
            onClick={onClose}
            className="text-white hover:bg-blue-700 rounded-full p-1"
            disabled={isSubmitting}
          >
            <X size={24} />
          </button>
        </div>
        
        {/* Success/Error Messages */}
        {submitSuccess && (
          <div className="mx-6 mt-4 bg-green-50 border-l-4 border-green-400 p-4 rounded-md flex items-start">
            <CheckCircle className="h-5 w-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-green-700">{submitSuccess}</p>
          </div>
        )}
        
        {submitError && (
          <div className="mx-6 mt-4 bg-red-50 border-l-4 border-red-400 p-4 rounded-md flex items-start">
            <AlertCircle className="h-5 w-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-700">{submitError}</p>
          </div>
        )}
        
        {/* Tab Navigation */}
        <div className="px-6 pt-4 border-b">
          <div className="flex space-x-4">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`pb-3 px-2 font-medium text-sm flex items-center transition-colors ${
                  activeTab === tab.id
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* Form Content */}
        <div className="overflow-y-auto flex-1 px-6 py-4">
          <form onSubmit={handleSubmit}>
            {/* Basic Information Tab */}
            {activeTab === 'basic' && (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Left column */}
                  <div className="flex-1 space-y-6">
                    <div>
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
                        } rounded-md shadow-sm text-sm`}
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
                      <div className="flex items-center">
                        <Briefcase size={18} className="text-gray-400 mr-2" />
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
                      <div className="flex items-center">
                        <Calendar size={18} className="text-gray-400 mr-2" />
                        <input
                          type="date"
                          id="hire_date"
                          name="hire_date"
                          value={formData.hire_date}
                          onChange={handleChange}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                        Notes
                      </label>
                      <textarea
                        id="notes"
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        rows="3"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                        placeholder="Additional information about this driver"
                      ></textarea>
                    </div>
                  </div>
                  
                  {/* Right column - Image upload */}
                  <div className="md:w-1/3 flex flex-col items-center space-y-4">
                    <div className="w-full">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Driver Photo
                      </label>
                      <div className="flex flex-col items-center space-y-4">
                        {formData.image ? (
                          <div className="relative">
                            <img 
                              src={formData.image} 
                              alt="Driver preview" 
                              className="h-40 w-40 object-cover rounded-full border border-gray-300" 
                            />
                            <button
                              type="button"
                              onClick={() => setFormData({...formData, image: null, image_file: null})}
                              className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <div className="h-40 w-40 rounded-full bg-gray-100 flex items-center justify-center">
                            <User size={60} className="text-gray-400" />
                          </div>
                        )}
                        
                        <label className="w-full flex flex-col items-center px-4 py-2 bg-blue-50 text-blue-500 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors">
                          <Upload size={18} className="mb-1" />
                          <span className="text-sm font-medium">Upload Photo</span>
                          <input
                            type="file"
                            id="image"
                            name="image"
                            accept="image/*"
                            onChange={handleChange}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Contact Information Tab */}
            {activeTab === 'contact' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <div className="flex items-center">
                      <Mail size={18} className="text-gray-400 mr-2" />
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={`block w-full px-3 py-2 border ${
                          errors.email ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                        } rounded-md shadow-sm text-sm`}
                        placeholder="email@example.com"
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <div className="flex items-center">
                      <Phone size={18} className="text-gray-400 mr-2" />
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className={`block w-full px-3 py-2 border ${
                          errors.phone ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                        } rounded-md shadow-sm text-sm`}
                        placeholder="(555) 123-4567"
                      />
                    </div>
                    {errors.phone && (
                      <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <div className="flex items-center">
                      <MapPin size={18} className="text-gray-400 mr-2" />
                      <input
                        type="text"
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                        placeholder="City"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                      State
                    </label>
                    <div className="flex items-center">
                      <MapPin size={18} className="text-gray-400 mr-2" />
                      <input
                        type="text"
                        id="state"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                        placeholder="State"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="border-t border-gray-200 pt-6 mt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Emergency Contact Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="emergency_contact" className="block text-sm font-medium text-gray-700 mb-1">
                        Emergency Contact
                      </label>
                      <div className="flex items-center">
                        <User size={18} className="text-gray-400 mr-2" />
                        <input
                          type="text"
                          id="emergency_contact"
                          name="emergency_contact"
                          value={formData.emergency_contact}
                          onChange={handleChange}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                          placeholder="Contact name"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="emergency_phone" className="block text-sm font-medium text-gray-700 mb-1">
                        Emergency Phone
                      </label>
                      <div className="flex items-center">
                        <Phone size={18} className="text-gray-400 mr-2" />
                        <input
                          type="tel"
                          id="emergency_phone"
                          name="emergency_phone"
                          value={formData.emergency_phone}
                          onChange={handleChange}
                          className={`block w-full px-3 py-2 border ${
                            errors.emergency_phone ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                          } rounded-md shadow-sm text-sm`}
                          placeholder="(555) 123-4567"
                        />
                      </div>
                      {errors.emergency_phone && (
                        <p className="mt-1 text-sm text-red-600">{errors.emergency_phone}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* License Information Tab */}
            {activeTab === 'license' && (
              <div className="space-y-6">
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-md mb-6">
                  <div className="flex">
                    <FileCheck className="h-5 w-5 text-blue-400 mr-2 flex-shrink-0" />
                    <p className="text-sm text-blue-700">
                      Keep license information up-to-date to ensure compliance with regulatory requirements.
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="license_number" className="block text-sm font-medium text-gray-700 mb-1">
                      License Number
                    </label>
                    <div className="flex items-center">
                      <IdCard size={18} className="text-gray-400 mr-2" />
                      <input
                        type="text"
                        id="license_number"
                        name="license_number"
                        value={formData.license_number}
                        onChange={handleChange}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                        placeholder="Driver's license number"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="license_state" className="block text-sm font-medium text-gray-700 mb-1">
                      License State
                    </label>
                    <div className="flex items-center">
                      <MapPin size={18} className="text-gray-400 mr-2" />
                      <input
                        type="text"
                        id="license_state"
                        name="license_state"
                        value={formData.license_state}
                        onChange={handleChange}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                        placeholder="e.g. TX"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="license_expiry" className="block text-sm font-medium text-gray-700 mb-1">
                      License Expiry Date
                    </label>
                    <div className="flex items-center">
                      <Calendar size={18} className="text-gray-400 mr-2" />
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
                    </div>
                    {errors.license_expiry_warning && (
                      <div className="mt-1 flex items-center text-sm text-yellow-600">
                        <AlertCircle size={14} className="mr-1 flex-shrink-0" />
                        {errors.license_expiry_warning}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="medical_card_expiry" className="block text-sm font-medium text-gray-700 mb-1">
                      Medical Card Expiry
                    </label>
                    <div className="flex items-center">
                      <Calendar size={18} className="text-gray-400 mr-2" />
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
                    </div>
                    {errors.medical_card_expiry_warning && (
                      <div className="mt-1 flex items-center text-sm text-yellow-600">
                        <AlertCircle size={14} className="mr-1 flex-shrink-0" />
                        {errors.medical_card_expiry_warning}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>
        
        {/* Form Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          
          <div className="flex items-center space-x-2">
            {activeTab !== 'basic' && (
              <button
                type="button"
                onClick={() => {
                  const currentIndex = tabs.findIndex(t => t.id === activeTab);
                  if (currentIndex > 0) {
                    setActiveTab(tabs[currentIndex - 1].id);
                  }
                }}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                disabled={isSubmitting}
              >
                Previous
              </button>
            )}
            
            {activeTab !== tabs[tabs.length - 1].id ? (
              <button
                type="button"
                onClick={() => {
                  const currentIndex = tabs.findIndex(t => t.id === activeTab);
                  if (currentIndex < tabs.length - 1) {
                    setActiveTab(tabs[currentIndex + 1].id);
                  }
                }}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                disabled={isSubmitting}
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none flex items-center"
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}