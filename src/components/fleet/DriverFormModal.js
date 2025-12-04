/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import {
  X,
  AlertCircle,
  CheckCircle,
  Upload,
  Calendar,
  User,
  Briefcase,
  Phone,
  Mail,
  MapPin,
  IdCard,
  FileCheck,
  Loader2,
  UserCircle,
  Shield
} from "lucide-react";
import { useLocalStorage } from "@/lib/hooks/useLocalStorage";
import { createDriver, updateDriver, uploadDriverImage } from "@/lib/services/driverService";
import { getCurrentDateLocal } from "@/lib/utils/dateUtils";

export default function DriverFormModal({ isOpen, onClose, driver, userId, onSubmit }) {
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
    hire_date: getCurrentDateLocal(),
    city: '',
    state: '',
    emergency_contact: '',
    emergency_phone: '',
    image: null,
    image_file: null,
    notes: ''
  };

  const formKey = driver ? `driverForm-${driver.id}` : 'driverForm-new';
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
    basic: ['name'],
    contact: [],
    license: ['license_number', 'license_state']
  };

  // Field labels for error messages
  const fieldLabels = {
    name: 'Driver Name',
    license_number: 'License Number',
    license_state: 'License State'
  };

  // Handle localStorage save
  const handleSaveToLocalStorage = () => {
    if (!driver && isOpen) {
      setStoredFormData(formData);
    }
  };

  // Load initial data
  useEffect(() => {
    if (!isOpen) return;

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
        image: driver.image_url || null,
        image_file: null,
        notes: driver.notes || ''
      });
      localStorage.removeItem('driverForm-new');
    } else if (!initialDataLoaded) {
      // Load from localStorage only once on initial open
      const stored = localStorage.getItem(formKey);
      if (stored) {
        try {
          const parsedData = JSON.parse(stored);
          const hasValidData = parsedData && (parsedData.name || parsedData.email || parsedData.phone);
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
  }, [driver, isOpen, initialDataLoaded, formKey]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setInitialDataLoaded(false);
      setActiveTab('basic');
      setTabErrors({});
      setTouchedTabs({ basic: true });
      setErrors({});
      if (!driver) {
        // Clear localStorage directly to avoid infinite loop
        // (clearStoredFormData is not stable between renders)
        localStorage.removeItem(formKey);
      }
    }
  }, [isOpen, driver, formKey]);

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
    if (tabId === 'contact') {
      if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
      if (formData.phone && !/^(\+\d{1,2}\s?)?(\d{3}[\s.-]?\d{3}[\s.-]?\d{4})$/.test(formData.phone)) {
        newErrors.phone = 'Please enter a valid phone number';
      }
      if (formData.emergency_phone && !/^(\+\d{1,2}\s?)?(\d{3}[\s.-]?\d{3}[\s.-]?\d{4})$/.test(formData.emergency_phone)) {
        newErrors.emergency_phone = 'Please enter a valid phone number';
      }
    }

    // Check expiry warnings for license tab
    if (tabId === 'license') {
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
    }

    if (showErrors) {
      setErrors(prev => ({ ...prev, ...newErrors }));
      setTabErrors(prev => ({
        ...prev,
        [tabId]: Object.keys(newErrors).filter(k => !k.includes('_warning')).length > 0
      }));
    }

    // Return true if no blocking errors (warnings don't block)
    const blockingErrors = Object.keys(newErrors).filter(k => !k.includes('_warning'));
    return blockingErrors.length === 0;
  };

  // Validate all tabs for final submission
  const validateForm = () => {
    let allValid = true;
    const allErrors = {};
    const allTabErrors = {};
    const tabsWithErrors = [];

    ['basic', 'contact', 'license'].forEach(tabId => {
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
      if (tabId === 'contact') {
        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          allErrors.email = 'Please enter a valid email address';
          allTabErrors[tabId] = true;
          if (!tabsWithErrors.includes(tabId)) tabsWithErrors.push(tabId);
        }
        if (formData.phone && !/^(\+\d{1,2}\s?)?(\d{3}[\s.-]?\d{3}[\s.-]?\d{4})$/.test(formData.phone)) {
          allErrors.phone = 'Please enter a valid phone number';
          allTabErrors[tabId] = true;
          if (!tabsWithErrors.includes(tabId)) tabsWithErrors.push(tabId);
        }
        if (formData.emergency_phone && !/^(\+\d{1,2}\s?)?(\d{3}[\s.-]?\d{3}[\s.-]?\d{4})$/.test(formData.emergency_phone)) {
          allErrors.emergency_phone = 'Please enter a valid phone number';
          allTabErrors[tabId] = true;
          if (!tabsWithErrors.includes(tabId)) tabsWithErrors.push(tabId);
        }
      }

      // Warnings (don't block submission)
      if (tabId === 'license') {
        if (formData.license_expiry) {
          const expiryDate = new Date(formData.license_expiry);
          const today = new Date();
          if (expiryDate < today) {
            allErrors.license_expiry_warning = 'License has already expired';
          } else {
            const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
            if (daysUntilExpiry < 30) {
              allErrors.license_expiry_warning = `License expires in ${daysUntilExpiry} days`;
            }
          }
        }

        if (formData.medical_card_expiry) {
          const expiryDate = new Date(formData.medical_card_expiry);
          const today = new Date();
          if (expiryDate < today) {
            allErrors.medical_card_expiry_warning = 'Medical card has already expired';
          } else {
            const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
            if (daysUntilExpiry < 30) {
              allErrors.medical_card_expiry_warning = `Medical card expires in ${daysUntilExpiry} days`;
            }
          }
        }
      }
    });

    setErrors(allErrors);
    setTabErrors(allTabErrors);
    setTouchedTabs({ basic: true, contact: true, license: true });

    // If there are errors, navigate to the first tab with errors
    if (tabsWithErrors.length > 0) {
      setActiveTab(tabsWithErrors[0]);
      allValid = false;
    }

    // Check for blocking errors (not warnings)
    const blockingErrors = Object.keys(allErrors).filter(k => !k.includes('_warning'));
    return blockingErrors.length === 0;
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
      let imageUrl = driver?.image_url || null;

      if (formData.image_file) {
        imageUrl = await uploadDriverImage(userId, formData.image_file);
      }

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
        image_url: imageUrl,
        notes: formData.notes,
      };

      let result;

      if (driver) {
        result = await updateDriver(driver.id, driverData);
      } else {
        driverData.user_id = userId;
        driverData.created_at = new Date().toISOString();
        result = await createDriver(driverData);
      }

      setSubmitMessage({ type: 'success', text: driver ? 'Driver updated successfully!' : 'Driver added successfully!' });
      localStorage.removeItem(formKey);

      if (onSubmit) await onSubmit(result);

      setTimeout(() => onClose(), 1500);
    } catch (error) {
      setSubmitMessage({ type: 'error', text: error.message || 'Failed to save driver. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: <User size={16} /> },
    { id: 'contact', label: 'Contact', icon: <Phone size={16} /> },
    { id: 'license', label: 'License & Compliance', icon: <Shield size={16} /> }
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-700 dark:to-blue-600 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mr-3">
                <UserCircle size={22} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  {driver ? `Edit Driver: ${driver.name}` : 'Add New Driver'}
                </h2>
                <p className="text-blue-100 text-sm">
                  {driver ? 'Update driver information' : 'Enter driver details to add to your fleet'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
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
                    className={`relative flex items-center px-4 py-2.5 rounded-full font-medium text-sm transition-all duration-200 ${
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
                      <User size={14} className="inline mr-1.5" />
                      Driver Name <span className="text-red-500">*</span>
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
                      placeholder="Full name"
                    />
                    {errors.name && (
                      <p className="mt-1.5 text-sm text-red-500 dark:text-red-400">{errors.name}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <Briefcase size={14} className="inline mr-1.5" />
                        Position
                      </label>
                      <select
                        name="position"
                        value={formData.position}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
                        <option value="Inactive">Inactive</option>
                        <option value="On Leave">On Leave</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Calendar size={14} className="inline mr-1.5" />
                      Hire Date
                    </label>
                    <input
                      type="date"
                      name="hire_date"
                      value={formData.hire_date}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Notes
                    </label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                      placeholder="Additional notes..."
                    />
                  </div>
                </div>

                {/* Right column - Photo */}
                <div className="md:w-1/3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Driver Photo
                  </label>
                  <div className="flex flex-col items-center space-y-4 p-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                    {formData.image ? (
                      <div className="relative">
                        <img
                          src={formData.image}
                          alt="Driver preview"
                          className="h-36 w-36 object-cover rounded-full border-4 border-white dark:border-gray-600 shadow-lg"
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
                      <div className="h-36 w-36 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                        <User size={48} className="text-gray-400 dark:text-gray-500" />
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

          {/* Contact Information Tab */}
          {activeTab === 'contact' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Mail size={14} className="inline mr-1.5" />
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 rounded-lg border ${
                      errors.email
                        ? 'border-red-300 dark:border-red-600'
                        : 'border-gray-300 dark:border-gray-600'
                    } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
                    placeholder="email@example.com"
                  />
                  {errors.email && (
                    <p className="mt-1.5 text-sm text-red-500 dark:text-red-400">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Phone size={14} className="inline mr-1.5" />
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 rounded-lg border ${
                      errors.phone
                        ? 'border-red-300 dark:border-red-600'
                        : 'border-gray-300 dark:border-gray-600'
                    } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
                    placeholder="(555) 123-4567"
                  />
                  {errors.phone && (
                    <p className="mt-1.5 text-sm text-red-500 dark:text-red-400">{errors.phone}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <MapPin size={14} className="inline mr-1.5" />
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="City"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <MapPin size={14} className="inline mr-1.5" />
                    State
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="State"
                  />
                </div>
              </div>

              {/* Emergency Contact Section */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                  <AlertCircle size={18} className="mr-2 text-orange-500" />
                  Emergency Contact
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <User size={14} className="inline mr-1.5" />
                      Contact Name
                    </label>
                    <input
                      type="text"
                      name="emergency_contact"
                      value={formData.emergency_contact}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Emergency contact name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Phone size={14} className="inline mr-1.5" />
                      Contact Phone
                    </label>
                    <input
                      type="tel"
                      name="emergency_phone"
                      value={formData.emergency_phone}
                      onChange={handleChange}
                      className={`w-full px-4 py-2.5 rounded-lg border ${
                        errors.emergency_phone
                          ? 'border-red-300 dark:border-red-600'
                          : 'border-gray-300 dark:border-gray-600'
                      } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
                      placeholder="(555) 123-4567"
                    />
                    {errors.emergency_phone && (
                      <p className="mt-1.5 text-sm text-red-500 dark:text-red-400">{errors.emergency_phone}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* License & Compliance Tab */}
          {activeTab === 'license' && (
            <div className="space-y-6">
              {/* Compliance Info Box */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-start">
                <FileCheck className="h-5 w-5 text-blue-500 dark:text-blue-400 mr-3 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Keep license and medical card information up-to-date to ensure compliance with DOT regulations.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <IdCard size={14} className="inline mr-1.5" />
                    License Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="license_number"
                    value={formData.license_number}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Driver's license number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <MapPin size={14} className="inline mr-1.5" />
                    License State <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="license_state"
                    value={formData.license_state}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="e.g. TX"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Calendar size={14} className="inline mr-1.5" />
                    License Expiry Date
                  </label>
                  <input
                    type="date"
                    name="license_expiry"
                    value={formData.license_expiry}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 rounded-lg border ${
                      errors.license_expiry_warning
                        ? 'border-yellow-400 dark:border-yellow-600'
                        : 'border-gray-300 dark:border-gray-600'
                    } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
                  />
                  {errors.license_expiry_warning && (
                    <div className="mt-1.5 flex items-center text-sm text-yellow-600 dark:text-yellow-400">
                      <AlertCircle size={14} className="mr-1 flex-shrink-0" />
                      {errors.license_expiry_warning}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Calendar size={14} className="inline mr-1.5" />
                    Medical Card Expiry
                  </label>
                  <input
                    type="date"
                    name="medical_card_expiry"
                    value={formData.medical_card_expiry}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 rounded-lg border ${
                      errors.medical_card_expiry_warning
                        ? 'border-yellow-400 dark:border-yellow-600'
                        : 'border-gray-300 dark:border-gray-600'
                    } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
                  />
                  {errors.medical_card_expiry_warning && (
                    <div className="mt-1.5 flex items-center text-sm text-yellow-600 dark:text-yellow-400">
                      <AlertCircle size={14} className="mr-1 flex-shrink-0" />
                      {errors.medical_card_expiry_warning}
                    </div>
                  )}
                </div>
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
