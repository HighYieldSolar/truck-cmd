/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import {
  X,
  AlertCircle,
  CheckCircle,
  Upload,
  Calendar,
  Truck,
  Tag,
  Hash,
  FileText,
  Wrench,
  Fuel,
  MapPin,
  Loader2,
  Settings,
  ShieldCheck,
  UserCircle
} from "lucide-react";
import { useLocalStorage } from "@/lib/hooks/useLocalStorage";
import { createTruck, updateTruck, uploadTruckImage } from "@/lib/services/truckService";
import { getCurrentDateLocal } from "@/lib/utils/dateUtils";

export default function TruckFormModal({ isOpen, onClose, truck, userId, onSubmit, drivers = [] }) {
  const initialFormData = {
    name: '',
    make: '',
    model: '',
    year: '',
    vin: '',
    license_plate: '',
    status: 'Active',
    purchase_date: getCurrentDateLocal(),
    odometer: '',
    fuel_type: 'Diesel',
    image: null,
    image_file: null,
    notes: '',
    vehicle_id: '',
    // Compliance fields
    registration_expiry: '',
    insurance_expiry: '',
    inspection_expiry: '',
    // Driver assignment
    assigned_driver_id: ''
  };

  const formKey = truck ? `truckForm-${truck.id}` : 'truckForm-new';
  // eslint-disable-next-line no-unused-vars
  const [storedFormData, setStoredFormData] = useLocalStorage(formKey, initialFormData);

  const [formData, setFormData] = useState(initialFormData);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
  const [errors, setErrors] = useState({});
  const [tabErrors, setTabErrors] = useState({});
  const [touchedTabs, setTouchedTabs] = useState({ basic: true });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState(null);
  const [activeTab, setActiveTab] = useState('basic');

  // Define required fields per tab
  const requiredFieldsByTab = {
    basic: ['name', 'make', 'model', 'year'],
    details: [],
    compliance: []
  };

  // Field labels for error messages
  const fieldLabels = {
    name: 'Vehicle Name',
    make: 'Make',
    model: 'Model',
    year: 'Year'
  };

  // Load initial data
  useEffect(() => {
    if (!isOpen) return;

    if (truck) {
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
        image: truck.image_url || null,
        image_file: null,
        notes: truck.notes || '',
        vehicle_id: truck.vehicle_id || '',
        // Compliance fields
        registration_expiry: truck.registration_expiry || '',
        insurance_expiry: truck.insurance_expiry || '',
        inspection_expiry: truck.inspection_expiry || '',
        // Driver assignment
        assigned_driver_id: truck.assigned_driver_id || ''
      });
      localStorage.removeItem('truckForm-new');
    } else if (!initialDataLoaded) {
      // Load from localStorage only once on initial open
      const stored = localStorage.getItem(formKey);
      if (stored) {
        try {
          const parsedData = JSON.parse(stored);
          const hasValidData = parsedData && (parsedData.name || parsedData.make || parsedData.model);
          if (hasValidData) {
            setFormData(parsedData);
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
      setInitialDataLoaded(true);
    }

    setErrors({});
    setTabErrors({});
    setSubmitMessage(null);
  }, [truck, isOpen, initialDataLoaded, formKey]);

  const handleSaveToLocalStorage = () => {
    if (!truck && isOpen) {
      setStoredFormData(formData);
    }
  };

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setInitialDataLoaded(false);
      setActiveTab('basic');
      setTabErrors({});
      setTouchedTabs({ basic: true });
      setErrors({});
      if (!truck) {
        // Clear localStorage directly to avoid infinite loop
        // (clearStoredFormData is not stable between renders)
        localStorage.removeItem(formKey);
      }
    }
  }, [isOpen, truck, formKey]);

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;

    if (type === 'file' && files?.length > 0) {
      setFormData(prev => ({ ...prev, image_file: files[0] }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(files[0]);
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }

    setTimeout(handleSaveToLocalStorage, 500);
  };

  // Validate a specific tab
  const validateTab = (tabId, showErrors = true) => {
    const newErrors = {};
    const requiredFields = requiredFieldsByTab[tabId] || [];

    // Check required fields for this tab
    requiredFields.forEach(field => {
      if (!formData[field] || !formData[field].toString().trim()) {
        newErrors[field] = `${fieldLabels[field] || field} is required`;
      }
    });

    // Additional format validations
    if (tabId === 'basic') {
      if (formData.year) {
        if (!/^\d{4}$/.test(formData.year)) {
          newErrors.year = 'Please enter a valid 4-digit year';
        } else {
          const yearNum = parseInt(formData.year, 10);
          const currentYear = new Date().getFullYear();
          if (yearNum < 1900 || yearNum > currentYear + 2) {
            newErrors.year = `Year must be between 1900 and ${currentYear + 2}`;
          }
        }
      }
    }

    if (tabId === 'details') {
      if (formData.vin && formData.vin.length > 0 && formData.vin.length !== 17) {
        newErrors.vin = 'VIN must be 17 characters';
      }
      if (formData.odometer) {
        const odometerNum = parseFloat(formData.odometer);
        if (isNaN(odometerNum)) {
          newErrors.odometer = 'Odometer must be a number';
        } else if (odometerNum < 0) {
          newErrors.odometer = 'Odometer cannot be negative';
        } else if (odometerNum > 10000000) {
          newErrors.odometer = 'Odometer value seems too high';
        }
      }
    }

    if (showErrors) {
      setErrors(prev => ({ ...prev, ...newErrors }));
      setTabErrors(prev => ({
        ...prev,
        [tabId]: Object.keys(newErrors).length > 0
      }));
    }

    return Object.keys(newErrors).length === 0;
  };

  // Validate all tabs for final submission
  const validateForm = () => {
    const allErrors = {};
    const allTabErrors = {};
    const tabsWithErrors = [];

    ['basic', 'details', 'compliance'].forEach(tabId => {
      const requiredFields = requiredFieldsByTab[tabId] || [];

      // Check required fields
      requiredFields.forEach(field => {
        if (!formData[field] || !formData[field].toString().trim()) {
          allErrors[field] = `${fieldLabels[field] || field} is required`;
          allTabErrors[tabId] = true;
          if (!tabsWithErrors.includes(tabId)) tabsWithErrors.push(tabId);
        }
      });

      // Format validations
      if (tabId === 'basic') {
        if (formData.year) {
          if (!/^\d{4}$/.test(formData.year)) {
            allErrors.year = 'Please enter a valid 4-digit year';
            allTabErrors[tabId] = true;
            if (!tabsWithErrors.includes(tabId)) tabsWithErrors.push(tabId);
          } else {
            const yearNum = parseInt(formData.year, 10);
            const currentYear = new Date().getFullYear();
            if (yearNum < 1900 || yearNum > currentYear + 2) {
              allErrors.year = `Year must be between 1900 and ${currentYear + 2}`;
              allTabErrors[tabId] = true;
              if (!tabsWithErrors.includes(tabId)) tabsWithErrors.push(tabId);
            }
          }
        }
      }

      if (tabId === 'details') {
        if (formData.vin && formData.vin.length > 0 && formData.vin.length !== 17) {
          allErrors.vin = 'VIN must be 17 characters';
          allTabErrors[tabId] = true;
          if (!tabsWithErrors.includes(tabId)) tabsWithErrors.push(tabId);
        }
        if (formData.odometer) {
          const odometerNum = parseFloat(formData.odometer);
          if (isNaN(odometerNum)) {
            allErrors.odometer = 'Odometer must be a number';
            allTabErrors[tabId] = true;
            if (!tabsWithErrors.includes(tabId)) tabsWithErrors.push(tabId);
          } else if (odometerNum < 0) {
            allErrors.odometer = 'Odometer cannot be negative';
            allTabErrors[tabId] = true;
            if (!tabsWithErrors.includes(tabId)) tabsWithErrors.push(tabId);
          } else if (odometerNum > 10000000) {
            allErrors.odometer = 'Odometer value seems too high';
            allTabErrors[tabId] = true;
            if (!tabsWithErrors.includes(tabId)) tabsWithErrors.push(tabId);
          }
        }
      }
    });

    setErrors(allErrors);
    setTabErrors(allTabErrors);
    setTouchedTabs({ basic: true, details: true, compliance: true });

    // If there are errors, navigate to the first tab with errors
    if (tabsWithErrors.length > 0) {
      setActiveTab(tabsWithErrors[0]);
    }

    return Object.keys(allErrors).length === 0;
  };

  // Handle tab navigation with validation
  const handleNextTab = () => {
    // Mark current tab as touched
    setTouchedTabs(prev => ({ ...prev, [activeTab]: true }));

    // Validate current tab before moving forward
    if (!validateTab(activeTab)) {
      return; // Don't navigate if validation fails
    }

    const currentIndex = tabs.findIndex(t => t.id === activeTab);
    if (currentIndex < tabs.length - 1) {
      const nextTab = tabs[currentIndex + 1].id;
      setActiveTab(nextTab);
      setTouchedTabs(prev => ({ ...prev, [nextTab]: true }));
    }
  };

  const handlePreviousTab = () => {
    const currentIndex = tabs.findIndex(t => t.id === activeTab);
    if (currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1].id);
    }
  };

  // Check if a tab is complete (all required fields filled)
  const isTabComplete = (tabId) => {
    const requiredFields = requiredFieldsByTab[tabId] || [];
    return requiredFields.every(field => formData[field] && formData[field].toString().trim());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      let imageUrl = truck?.image_url || null;

      if (formData.image_file) {
        imageUrl = await uploadTruckImage(userId, formData.image_file);
      }

      const truckData = {
        name: formData.name,
        make: formData.make,
        model: formData.model,
        year: formData.year,
        vin: formData.vin,
        license_plate: formData.license_plate,
        status: formData.status,
        fuel_type: formData.fuel_type,
        image_url: imageUrl,
        notes: formData.notes,
        // Compliance fields
        registration_expiry: formData.registration_expiry || null,
        insurance_expiry: formData.insurance_expiry || null,
        inspection_expiry: formData.inspection_expiry || null,
        // Driver assignment
        assigned_driver_id: formData.assigned_driver_id || null,
      };

      let result;

      if (truck) {
        result = await updateTruck(truck.id, truckData);
      } else {
        truckData.user_id = userId;
        truckData.created_at = new Date().toISOString();
        result = await createTruck(truckData);
      }

      setSubmitMessage({ type: 'success', text: truck ? 'Vehicle updated successfully!' : 'Vehicle added successfully!' });
      localStorage.removeItem(formKey);

      if (onSubmit) await onSubmit(result);

      setTimeout(() => onClose(), 1500);
    } catch (error) {
      setSubmitMessage({ type: 'error', text: error.message || 'Failed to save vehicle. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: <Truck size={16} /> },
    { id: 'details', label: 'Details & Notes', icon: <Settings size={16} /> },
    { id: 'compliance', label: 'Compliance & Driver', icon: <ShieldCheck size={16} /> }
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-700 dark:to-blue-600 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mr-3">
                <Truck size={22} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  {truck ? `Edit Vehicle: ${truck.name}` : 'Add New Vehicle'}
                </h2>
                <p className="text-blue-100 text-sm">
                  {truck ? 'Update vehicle information' : 'Enter vehicle details to add to your fleet'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              aria-label="Close"
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X size={22} className="text-white" />
            </button>
          </div>
        </div>

        {/* Messages */}
        {submitMessage && (
          <div className={`mx-6 mt-4 p-4 rounded-lg flex items-start ${
            submitMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800'
              : 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800'
          }`}>
            {submitMessage.type === 'success' ? (
              <CheckCircle className="h-5 w-5 text-emerald-500 mr-3 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0" />
            )}
            <p className={`text-sm ${
              submitMessage.type === 'success'
                ? 'text-emerald-800 dark:text-emerald-200'
                : 'text-red-800 dark:text-red-200'
            }`}>
              {submitMessage.text}
            </p>
          </div>
        )}

        {/* Tab Navigation - Modern Step Indicator with Status */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/30 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-center">
            <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-full p-1">
              {tabs.map((tab, index) => {
                const hasError = touchedTabs[tab.id] && tabErrors[tab.id];
                const isComplete = isTabComplete(tab.id) && !tabErrors[tab.id];
                const hasRequiredFields = requiredFieldsByTab[tab.id]?.length > 0;

                return (
                  <button
                    key={tab.id}
                    className={`relative flex items-center px-5 py-2.5 rounded-full font-medium text-sm transition-all duration-200 ${
                      activeTab === tab.id
                        ? hasError
                          ? 'bg-red-600 text-white shadow-md'
                          : 'bg-blue-600 text-white shadow-md'
                        : hasError
                          ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                          : isComplete && hasRequiredFields
                            ? 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
                            : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                    onClick={() => {
                      setTouchedTabs(prev => ({ ...prev, [tab.id]: true }));
                      setActiveTab(tab.id);
                    }}
                  >
                    <span className={`flex items-center justify-center w-6 h-6 rounded-full mr-2 text-xs font-bold ${
                      activeTab === tab.id
                        ? 'bg-white/20'
                        : hasError
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                          : isComplete && hasRequiredFields
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                            : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                    }`}>
                      {hasError ? (
                        <AlertCircle size={14} />
                      ) : isComplete && hasRequiredFields ? (
                        <CheckCircle size={14} />
                      ) : (
                        index + 1
                      )}
                    </span>
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">{tab.icon}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Required Fields Legend */}
          <div className="flex items-center justify-center mt-3 text-xs text-gray-500 dark:text-gray-400">
            <span className="text-red-500 mr-1">*</span>
            <span>Required fields</span>
            {Object.keys(tabErrors).some(k => tabErrors[k]) && (
              <span className="ml-4 flex items-center text-red-500 dark:text-red-400">
                <AlertCircle size={12} className="mr-1" />
                Please complete required fields
              </span>
            )}
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          {/* Basic Information Tab */}
          {activeTab === 'basic' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Left column */}
                <div className="flex-1 space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Tag size={14} className="inline mr-1.5" />
                      Vehicle Name / ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={`w-full px-4 py-2.5 rounded-lg border ${
                        errors.name
                          ? 'border-red-300 dark:border-red-600'
                          : 'border-gray-300 dark:border-gray-600'
                      } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
                      placeholder="e.g. Truck #101"
                    />
                    {errors.name && (
                      <p className="mt-1.5 text-sm text-red-500 dark:text-red-400">{errors.name}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Make <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="make"
                        value={formData.make}
                        onChange={handleChange}
                        className={`w-full px-4 py-2.5 rounded-lg border ${
                          errors.make
                            ? 'border-red-300 dark:border-red-600'
                            : 'border-gray-300 dark:border-gray-600'
                        } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
                        placeholder="e.g. Freightliner"
                      />
                      {errors.make && (
                        <p className="mt-1.5 text-sm text-red-500 dark:text-red-400">{errors.make}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Model <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="model"
                        value={formData.model}
                        onChange={handleChange}
                        className={`w-full px-4 py-2.5 rounded-lg border ${
                          errors.model
                            ? 'border-red-300 dark:border-red-600'
                            : 'border-gray-300 dark:border-gray-600'
                        } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
                        placeholder="e.g. Cascadia"
                      />
                      {errors.model && (
                        <p className="mt-1.5 text-sm text-red-500 dark:text-red-400">{errors.model}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Year <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="year"
                        value={formData.year}
                        onChange={handleChange}
                        className={`w-full px-4 py-2.5 rounded-lg border ${
                          errors.year
                            ? 'border-red-300 dark:border-red-600'
                            : 'border-gray-300 dark:border-gray-600'
                        } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
                        placeholder="e.g. 2023"
                      />
                      {errors.year && (
                        <p className="mt-1.5 text-sm text-red-500 dark:text-red-400">{errors.year}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Status
                      </label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      >
                        <option value="Active">Active</option>
                        <option value="In Maintenance">In Maintenance</option>
                        <option value="Out of Service">Out of Service</option>
                        <option value="Idle">Idle</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <Calendar size={14} className="inline mr-1.5" />
                        Purchase Date
                      </label>
                      <input
                        type="date"
                        name="purchase_date"
                        value={formData.purchase_date}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Right column - Photo */}
                <div className="md:w-1/3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Vehicle Photo
                  </label>
                  <div className="flex flex-col items-center space-y-4 p-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                    {formData.image ? (
                      <div className="relative">
                        <img
                          src={formData.image}
                          alt="Vehicle preview"
                          className="h-36 w-auto max-w-full object-cover rounded-lg border-4 border-white dark:border-gray-600 shadow-lg"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData({...formData, image: null, image_file: null})}
                          className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-md transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="h-36 w-full rounded-lg bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                        <Truck size={48} className="text-gray-400 dark:text-gray-500" />
                      </div>
                    )}

                    <label className="w-full flex flex-col items-center px-4 py-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors border border-blue-200 dark:border-blue-800">
                      <Upload size={18} className="mb-1" />
                      <span className="text-sm font-medium">Upload Photo</span>
                      <input
                        type="file"
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
          )}

          {/* Details Tab */}
          {activeTab === 'details' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Hash size={14} className="inline mr-1.5" />
                    VIN
                  </label>
                  <input
                    type="text"
                    name="vin"
                    value={formData.vin}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 rounded-lg border ${
                      errors.vin
                        ? 'border-red-300 dark:border-red-600'
                        : 'border-gray-300 dark:border-gray-600'
                    } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors font-mono`}
                    placeholder="Vehicle Identification Number"
                  />
                  {errors.vin && (
                    <p className="mt-1.5 text-sm text-red-500 dark:text-red-400">{errors.vin}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Tag size={14} className="inline mr-1.5" />
                    License Plate
                  </label>
                  <input
                    type="text"
                    name="license_plate"
                    value={formData.license_plate}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="e.g. TX-12345"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <MapPin size={14} className="inline mr-1.5" />
                    Odometer (miles)
                  </label>
                  <input
                    type="text"
                    name="odometer"
                    value={formData.odometer}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 rounded-lg border ${
                      errors.odometer
                        ? 'border-red-300 dark:border-red-600'
                        : 'border-gray-300 dark:border-gray-600'
                    } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
                    placeholder="Current mileage"
                  />
                  {errors.odometer && (
                    <p className="mt-1.5 text-sm text-red-500 dark:text-red-400">{errors.odometer}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Fuel size={14} className="inline mr-1.5" />
                    Fuel Type
                  </label>
                  <select
                    name="fuel_type"
                    value={formData.fuel_type}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <FileText size={14} className="inline mr-1.5" />
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                  placeholder="Additional information about this vehicle"
                />
              </div>

              {/* Tip Box */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-start">
                <Wrench className="h-5 w-5 text-blue-500 dark:text-blue-400 mr-3 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Regular vehicle inspections and maintenance keep your fleet operating efficiently and safely. Keep odometer readings up-to-date for accurate IFTA reporting.
                </p>
              </div>
            </div>
          )}

          {/* Compliance & Driver Tab */}
          {activeTab === 'compliance' && (
            <div className="space-y-6">
              {/* Driver Assignment Section */}
              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-5">
                <h3 className="text-base font-semibold text-purple-800 dark:text-purple-200 mb-4 flex items-center">
                  <UserCircle size={18} className="mr-2" />
                  Driver Assignment
                </h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Assign Driver
                  </label>
                  <select
                    name="assigned_driver_id"
                    value={formData.assigned_driver_id}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                  >
                    <option value="">No driver assigned</option>
                    {drivers.map(driver => (
                      <option key={driver.id} value={driver.id}>
                        {driver.name} {driver.position ? `(${driver.position})` : ''}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Assign a driver to this vehicle for dispatch and reporting purposes.
                  </p>
                </div>
              </div>

              {/* Document Expiration Section */}
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-5">
                <h3 className="text-base font-semibold text-green-800 dark:text-green-200 mb-4 flex items-center">
                  <ShieldCheck size={18} className="mr-2" />
                  Document Expiration Tracking
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Calendar size={14} className="inline mr-1.5" />
                      Registration Expiry
                    </label>
                    <input
                      type="date"
                      name="registration_expiry"
                      value={formData.registration_expiry}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Calendar size={14} className="inline mr-1.5" />
                      Insurance Expiry
                    </label>
                    <input
                      type="date"
                      name="insurance_expiry"
                      value={formData.insurance_expiry}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Calendar size={14} className="inline mr-1.5" />
                      DOT Inspection Expiry
                    </label>
                    <input
                      type="date"
                      name="inspection_expiry"
                      value={formData.inspection_expiry}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    />
                  </div>
                </div>
                <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                  Track document expirations to stay compliant with DOT regulations. You&apos;ll receive alerts when documents are expiring soon.
                </p>
              </div>

              {/* Compliance Tip Box */}
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 flex items-start">
                <AlertCircle className="h-5 w-5 text-amber-500 dark:text-amber-400 mr-3 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Keeping your vehicle documents up-to-date is crucial for DOT compliance. Expired documents can result in fines and being put out of service.
                </p>
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center space-x-3">
            {activeTab !== 'basic' && (
              <button
                type="button"
                onClick={handlePreviousTab}
                className="px-5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors"
                disabled={isSubmitting}
              >
                Previous
              </button>
            )}

            {activeTab !== tabs[tabs.length - 1].id ? (
              <button
                type="button"
                onClick={handleNextTab}
                className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
                disabled={isSubmitting}
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors flex items-center disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>{truck ? 'Update Vehicle' : 'Add Vehicle'}</>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
