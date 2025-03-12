import React, { useState, useEffect } from 'react';
import { supabase } from "@/lib/supabaseClient";
import { X, RefreshCw, Building, Mail, Phone, User, MapPin, Check, AlertCircle } from 'lucide-react';

const CustomerFormModal = ({ isOpen, onClose, userId, existingCustomer, isSubmitting = false, onSave }) => {
  const [customer, setCustomer] = useState({
    company_name: '',
    contact_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    customer_type: 'Shipper',
    status: 'Active',
    notes: ''
  });
  
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    if (existingCustomer) {
      setCustomer(existingCustomer);
    } else {
      // Reset form for new customer
      setCustomer({
        company_name: '',
        contact_name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zip: '',
        customer_type: 'Shipper',
        status: 'Active',
        notes: ''
      });
    }
    
    // Reset validation state
    setErrors({});
    setTouched({});
    setSubmitError(null);
  }, [existingCustomer, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCustomer({ ...customer, [name]: value });
    
    // Clear error when field is changed
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };
  
  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched({ ...touched, [name]: true });
    validateField(name, customer[name]);
  };
  
  const validateField = (name, value) => {
    let errorMessage = null;
    
    switch (name) {
      case 'company_name':
        if (!value.trim()) {
          errorMessage = 'Company name is required';
        }
        break;
      case 'email':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errorMessage = 'Enter a valid email address';
        }
        break;
      case 'phone':
        if (value && !/^(\+\d{1,2}\s)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/.test(value)) {
          errorMessage = 'Enter a valid phone number';
        }
        break;
      default:
        break;
    }
    
    setErrors({ ...errors, [name]: errorMessage });
    return !errorMessage;
  };
  
  const validateForm = () => {
    const newErrors = {};
    let isValid = true;
    
    // Validate company_name (required)
    if (!customer.company_name.trim()) {
      newErrors.company_name = 'Company name is required';
      isValid = false;
    }
    
    // Validate email (optional but must be valid if provided)
    if (customer.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) {
      newErrors.email = 'Enter a valid email address';
      isValid = false;
    }
    
    // Validate phone (optional but must be valid if provided)
    if (customer.phone && !/^(\+\d{1,2}\s)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/.test(customer.phone)) {
      newErrors.phone = 'Enter a valid phone number';
      isValid = false;
    }
    
    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Mark all fields as touched for validation
    const allTouched = Object.keys(customer).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
    setTouched(allTouched);
    
    // Validate all fields
    if (!validateForm()) {
      return;
    }
    
    setSubmitting(true);
    setSubmitError(null);
    
    try {
      let result;
      
      // If we have an existing customer (editing)
      if (existingCustomer) {
        // Pass the data to the parent component's onSave function
        result = await onSave(customer);
      } else {
        // This is a new customer, create it in Supabase
        const newCustomer = {
          ...customer,
          user_id: userId,
          created_at: new Date().toISOString()
        };
        
        const { data, error } = await supabase
          .from('customers')
          .insert([newCustomer])
          .select();
          
        if (error) throw error;
        
        // Pass the created customer to the parent component's onSave function
        if (data && data.length > 0) {
          result = await onSave(data[0]);
        } else {
          throw new Error('Failed to create customer');
        }
      }
      
      onClose();
      return result;
    } catch (error) {
      console.error('Error in form submission:', error);
      setSubmitError(error.message || 'Failed to save customer. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10 shadow-sm">
          <div className="flex items-center">
            <Building size={20} className="text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">
              {existingCustomer ? 'Edit Customer' : 'Add New Customer'}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-md text-gray-600 hover:text-gray-800 hover:bg-gray-100 focus:outline-none"
            disabled={submitting || isSubmitting}
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Display any submission errors */}
          {submitError && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-md">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                <p className="text-sm text-red-700">{submitError}</p>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Company Information Section */}
            <div className="md:col-span-2">
              <h3 className="text-md font-medium text-gray-900 mb-3 pb-2 border-b border-gray-200">
                Company Information
              </h3>
            </div>
            
            <div className="md:col-span-2">
              <label htmlFor="company_name" className="block text-sm font-medium text-gray-700 mb-1">
                Company Name *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building size={16} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  id="company_name"
                  name="company_name"
                  value={customer.company_name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Enter company name"
                  className={`block w-full pl-10 pr-3 py-2 border ${
                    errors.company_name && touched.company_name ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  } rounded-md shadow-sm placeholder-gray-400 text-sm`}
                  required
                />
              </div>
              {errors.company_name && touched.company_name && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle size={14} className="mr-1" />
                  {errors.company_name}
                </p>
              )}
            </div>
            
            <div>
              <label htmlFor="customer_type" className="block text-sm font-medium text-gray-700 mb-1">
                Customer Type
              </label>
              <select
                id="customer_type"
                name="customer_type"
                value={customer.customer_type}
                onChange={handleChange}
                className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="Shipper">Shipper</option>
                <option value="Consignee">Consignee</option>
                <option value="Broker">Broker</option>
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
                value={customer.status}
                onChange={handleChange}
                className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
            
            {/* Contact Information Section */}
            <div className="md:col-span-2 mt-2">
              <h3 className="text-md font-medium text-gray-900 mb-3 pb-2 border-b border-gray-200">
                Contact Information
              </h3>
            </div>
            
            <div>
              <label htmlFor="contact_name" className="block text-sm font-medium text-gray-700 mb-1">
                Contact Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User size={16} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  id="contact_name"
                  name="contact_name"
                  value={customer.contact_name}
                  onChange={handleChange}
                  placeholder="Primary contact person"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 text-sm"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={16} className="text-gray-400" />
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={customer.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="email@example.com"
                  className={`block w-full pl-10 pr-3 py-2 border ${
                    errors.email && touched.email ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  } rounded-md shadow-sm placeholder-gray-400 text-sm`}
                />
              </div>
              {errors.email && touched.email && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle size={14} className="mr-1" />
                  {errors.email}
                </p>
              )}
            </div>
            
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone size={16} className="text-gray-400" />
                </div>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={customer.phone}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="(555) 123-4567"
                  className={`block w-full pl-10 pr-3 py-2 border ${
                    errors.phone && touched.phone ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  } rounded-md shadow-sm placeholder-gray-400 text-sm`}
                />
              </div>
              {errors.phone && touched.phone && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle size={14} className="mr-1" />
                  {errors.phone}
                </p>
              )}
            </div>
            
            {/* Address Section */}
            <div className="md:col-span-2 mt-2">
              <h3 className="text-md font-medium text-gray-900 mb-3 pb-2 border-b border-gray-200">
                Address Information
              </h3>
            </div>
            
            <div className="md:col-span-2">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                Street Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin size={16} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={customer.address}
                  onChange={handleChange}
                  placeholder="123 Shipping Lane"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 text-sm"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <input
                type="text"
                id="city"
                name="city"
                value={customer.city}
                onChange={handleChange}
                placeholder="City"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 text-sm"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                  State
                </label>
                <input
                  type="text"
                  id="state"
                  name="state"
                  value={customer.state}
                  onChange={handleChange}
                  placeholder="State"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 text-sm"
                />
              </div>
              
              <div>
                <label htmlFor="zip" className="block text-sm font-medium text-gray-700 mb-1">
                  Zip Code
                </label>
                <input
                  type="text"
                  id="zip"
                  name="zip"
                  value={customer.zip}
                  onChange={handleChange}
                  placeholder="Zip Code"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 text-sm"
                />
              </div>
            </div>
            
            {/* Notes Section */}
            <div className="md:col-span-2 mt-2">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                rows="3"
                value={customer.notes}
                onChange={handleChange}
                placeholder="Additional information about this customer..."
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 text-sm"
              ></textarea>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="mt-8 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
              disabled={submitting || isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none flex items-center"
              disabled={submitting || isSubmitting}
            >
              {submitting || isSubmitting ? (
                <>
                  <RefreshCw size={16} className="animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Check size={16} className="mr-2" />
                  {existingCustomer ? 'Update Customer' : 'Create Customer'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerFormModal;