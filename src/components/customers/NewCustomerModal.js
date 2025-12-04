'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Building2, Phone, FileText, ChevronRight, ChevronLeft, Check, AlertCircle, Trash2, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createCustomer, updateCustomer } from '@/lib/services/customerService';
import { supabase } from '@/lib/supabaseClient';

const NewCustomerModal = ({ isOpen, onClose, onCustomerCreated, initialData = null }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [showOptionalFields, setShowOptionalFields] = useState(false);
  const [hasRestoredData, setHasRestoredData] = useState(false);
  const [showStateDropdown, setShowStateDropdown] = useState(false);
  const stateDropdownRef = useRef(null);

  // Form data state
  const [formData, setFormData] = useState({
    // Step 1: Basic Information
    company_name: '',
    customer_type: 'shipper',
    status: 'active',
    contact_name: '',
    email: '',
    phone: '',
    
    // Step 2: Additional Details
    address: '',
    city: '',
    state: '',
    zip_code: '',
    notes: ''
  });

  // Save to localStorage on form data change
  useEffect(() => {
    if (isOpen && !initialData) {
      localStorage.setItem('newCustomerFormData', JSON.stringify(formData));
      localStorage.setItem('newCustomerFormStep', currentStep.toString());
    }
  }, [formData, currentStep, isOpen, initialData]);

  // Load from localStorage on mount
  useEffect(() => {
    if (isOpen && !initialData) {
      const savedData = localStorage.getItem('newCustomerFormData');
      const savedStep = localStorage.getItem('newCustomerFormStep');
      
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          if (Object.values(parsedData).some(value => value !== '')) {
            setFormData(parsedData);
            setCurrentStep(parseInt(savedStep) || 1);
            setHasRestoredData(true);
          }
        } catch (error) {
          // Failed to load saved form data
        }
      }
    } else if (initialData) {
      setFormData(initialData);
    }
  }, [isOpen, initialData]);

  // Handle click outside to close state dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (stateDropdownRef.current && !stateDropdownRef.current.contains(event.target)) {
        setShowStateDropdown(false);
      }
    };

    if (showStateDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showStateDropdown]);

  const clearSavedData = () => {
    localStorage.removeItem('newCustomerFormData');
    localStorage.removeItem('newCustomerFormStep');
    setFormData({
      company_name: '',
      customer_type: 'shipper',
      status: 'active',
      contact_name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zip_code: '',
      notes: ''
    });
    setCurrentStep(1);
    setHasRestoredData(false);
    setErrors({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateStep = (step) => {
    const newErrors = {};

    switch (step) {
      case 1:
        if (!formData.company_name.trim()) {
          newErrors.company_name = 'Company name is required';
        }
        break;
      case 2:
        // No validation needed for step 2
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 2));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;

    setIsSubmitting(true);
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Authentication required');
      }

      // Format data for submission - map zip_code to zip
      const submitData = {
        ...formData,
        zip: formData.zip_code
      };
      delete submitData.zip_code;

      if (initialData) {
        await updateCustomer(initialData.id, submitData);
      } else {
        await createCustomer(user.id, submitData);
      }

      // Clear saved data
      clearSavedData();
      
      // Notify parent and close
      onCustomerCreated?.();
      onClose();
      
      // Refresh the page to show the new customer
      if (!initialData) {
        window.location.reload();
      }
    } catch (error) {
      setErrors({ submit: error.message || 'Failed to save customer' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  const steps = [
    { number: 1, title: 'Basic Info', icon: Building2 },
    { number: 2, title: 'Details', icon: FileText }
  ];

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Customer Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="company_name"
                value={formData.company_name}
                onChange={handleInputChange}
                className={`block w-full px-4 py-3 border ${errors.company_name ? 'border-red-500' : 'border-gray-300'} rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base`}
                placeholder="Enter company name"
              />
              {errors.company_name && (
                <p className="text-red-500 text-sm mt-1">{errors.company_name}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Type
                </label>
                <select
                  name="customer_type"
                  value={formData.customer_type}
                  onChange={handleInputChange}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base"
                >
                  <option value="direct">Direct Customer</option>
                  <option value="broker">Broker</option>
                  <option value="freight-forwarder">Freight Forwarder</option>
                  <option value="3pl">3PL</option>
                  <option value="shipper">Shipper</option>
                  <option value="business">Business</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending Approval</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="contact_name"
                  value={formData.contact_name}
                  onChange={handleInputChange}
                  className={`block w-full px-4 py-3 border ${errors.contact_name ? 'border-red-500' : 'border-gray-300'} rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base`}
                  placeholder="John Doe"
                />
                {errors.contact_name && (
                  <p className="text-red-500 text-sm mt-1">{errors.contact_name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={`block w-full px-4 py-3 border ${errors.phone ? 'border-red-500' : 'border-gray-300'} rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base`}
                  placeholder="(555) 123-4567"
                />
                {errors.phone && (
                  <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`block w-full px-4 py-3 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base`}
                placeholder="john@company.com"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Additional Details</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base"
                placeholder="123 Main St"
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base"
                  placeholder="New York"
                />
              </div>

              <div className="relative" ref={stateDropdownRef}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State
                </label>
                <div
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base cursor-pointer bg-white flex justify-between items-center"
                  onClick={() => setShowStateDropdown(!showStateDropdown)}
                >
                  <span className={formData.state ? 'text-gray-900' : 'text-gray-400'}>
                    {formData.state ? 
                      {
                        'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas',
                        'CA': 'California', 'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware',
                        'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii', 'ID': 'Idaho',
                        'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa', 'KS': 'Kansas',
                        'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
                        'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi',
                        'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada',
                        'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico', 'NY': 'New York',
                        'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio', 'OK': 'Oklahoma',
                        'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
                        'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah',
                        'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia',
                        'WI': 'Wisconsin', 'WY': 'Wyoming'
                      }[formData.state] : 'Select State'
                    }
                  </span>
                  <ChevronDown size={20} className={`text-gray-400 transition-transform ${showStateDropdown ? 'rotate-180' : ''}`} />
                </div>
                
                {showStateDropdown && (
                  <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-[280px] overflow-y-auto">
                    {[
                      { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' },
                      { code: 'AZ', name: 'Arizona' }, { code: 'AR', name: 'Arkansas' },
                      { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' },
                      { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' },
                      { code: 'FL', name: 'Florida' }, { code: 'GA', name: 'Georgia' },
                      { code: 'HI', name: 'Hawaii' }, { code: 'ID', name: 'Idaho' },
                      { code: 'IL', name: 'Illinois' }, { code: 'IN', name: 'Indiana' },
                      { code: 'IA', name: 'Iowa' }, { code: 'KS', name: 'Kansas' },
                      { code: 'KY', name: 'Kentucky' }, { code: 'LA', name: 'Louisiana' },
                      { code: 'ME', name: 'Maine' }, { code: 'MD', name: 'Maryland' },
                      { code: 'MA', name: 'Massachusetts' }, { code: 'MI', name: 'Michigan' },
                      { code: 'MN', name: 'Minnesota' }, { code: 'MS', name: 'Mississippi' },
                      { code: 'MO', name: 'Missouri' }, { code: 'MT', name: 'Montana' },
                      { code: 'NE', name: 'Nebraska' }, { code: 'NV', name: 'Nevada' },
                      { code: 'NH', name: 'New Hampshire' }, { code: 'NJ', name: 'New Jersey' },
                      { code: 'NM', name: 'New Mexico' }, { code: 'NY', name: 'New York' },
                      { code: 'NC', name: 'North Carolina' }, { code: 'ND', name: 'North Dakota' },
                      { code: 'OH', name: 'Ohio' }, { code: 'OK', name: 'Oklahoma' },
                      { code: 'OR', name: 'Oregon' }, { code: 'PA', name: 'Pennsylvania' },
                      { code: 'RI', name: 'Rhode Island' }, { code: 'SC', name: 'South Carolina' },
                      { code: 'SD', name: 'South Dakota' }, { code: 'TN', name: 'Tennessee' },
                      { code: 'TX', name: 'Texas' }, { code: 'UT', name: 'Utah' },
                      { code: 'VT', name: 'Vermont' }, { code: 'VA', name: 'Virginia' },
                      { code: 'WA', name: 'Washington' }, { code: 'WV', name: 'West Virginia' },
                      { code: 'WI', name: 'Wisconsin' }, { code: 'WY', name: 'Wyoming' }
                    ].map(state => (
                      <div
                        key={state.code}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-gray-900"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, state: state.code }));
                          setShowStateDropdown(false);
                          if (errors.state) {
                            setErrors(prev => ({ ...prev, state: '' }));
                          }
                        }}
                      >
                        {state.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ZIP Code
                </label>
                <input
                  type="text"
                  name="zip_code"
                  value={formData.zip_code}
                  onChange={handleInputChange}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base"
                  placeholder="10001"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base"
                rows="4"
                placeholder="Any additional notes about this customer..."
              />
            </div>

            {/* Review Summary */}
            <div className="bg-gray-50 p-4 rounded-lg mt-6">
              <h4 className="font-medium text-gray-900 mb-3">Review Customer Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">Company:</span>
                  <span className="ml-2 font-medium">{formData.company_name}</span>
                </div>
                <div>
                  <span className="text-gray-600">Type:</span>
                  <span className="ml-2 font-medium capitalize">{formData.customer_type.replace('-', ' ')}</span>
                </div>
                <div>
                  <span className="text-gray-600">Contact:</span>
                  <span className="ml-2 font-medium">{formData.contact_name}</span>
                </div>
                <div>
                  <span className="text-gray-600">Email:</span>
                  <span className="ml-2 font-medium">{formData.email}</span>
                </div>
                <div>
                  <span className="text-gray-600">Phone:</span>
                  <span className="ml-2 font-medium">{formData.phone}</span>
                </div>
                <div>
                  <span className="text-gray-600">Status:</span>
                  <span className="ml-2 font-medium capitalize">{formData.status}</span>
                </div>
              </div>
            </div>
          </div>
        );

    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header with Progress */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-bold">
              {initialData ? 'Edit Customer' : 'Create New Customer'}
            </h2>
            <button
              onClick={handleClose}
              className="text-white hover:bg-white/20 p-1 rounded transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex justify-between items-center">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.number;
              const isCompleted = currentStep > step.number;

              return (
                <React.Fragment key={step.number}>
                  <div className="flex items-center">
                    <motion.div
                      initial={false}
                      animate={{
                        scale: isActive ? 1.1 : 1,
                        backgroundColor: isActive ? '#ffffff' : isCompleted ? '#10b981' : 'rgba(255,255,255,0.3)'
                      }}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        isActive ? 'ring-4 ring-white/30' : ''
                      }`}
                    >
                      {isCompleted ? (
                        <Check size={20} className="text-white" />
                      ) : (
                        <Icon size={20} className={isActive ? 'text-blue-600' : 'text-white'} />
                      )}
                    </motion.div>
                    <span className={`ml-2 text-sm ${isActive ? 'font-semibold' : ''}`}>
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-1 mx-4 rounded ${
                      currentStep > step.number ? 'bg-green-400' : 'bg-white/30'
                    }`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Restored Data Alert */}
        {hasRestoredData && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mx-6 mt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <AlertCircle className="text-blue-500 mr-2" size={20} />
                <p className="text-sm text-blue-700">
                  We've restored your previous progress. You can continue where you left off.
                </p>
              </div>
              <button
                onClick={clearSavedData}
                className="text-blue-700 hover:text-blue-900 flex items-center gap-1 text-sm"
              >
                <Trash2 size={16} />
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Form Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 240px)' }}>
          {renderStepContent()}
          
          {errors.submit && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md mt-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                <p className="text-sm text-red-700">{errors.submit}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer with Actions */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={currentStep === 1 ? handleClose : handlePrevious}
              className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors inline-flex items-center"
              disabled={isSubmitting}
            >
              <ChevronLeft size={16} className="mr-2" />
              {currentStep === 1 ? 'Cancel' : 'Previous'}
            </button>

            {currentStep < 2 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 inline-flex items-center transition-colors"
                disabled={isSubmitting}
              >
                Next
                <ChevronRight size={16} className="ml-2" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 inline-flex items-center transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={16} className="animate-spin mr-2" />
                    {initialData ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <Check size={16} className="mr-2" />
                    {initialData ? 'Update Customer' : 'Create Customer'}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default NewCustomerModal;