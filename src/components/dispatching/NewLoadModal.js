// src/components/dashboard/NewLoadForm.js
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { 
  X, MapPin, Building, Calendar, DollarSign, FileText, RefreshCw, 
  CheckCircle, AlertCircle, Info, Truck, Route, Clock
} from "lucide-react";

// Helper function to get form data from local storage
const getFormDataFromLocalStorage = (formKey) => {
  try {
    if (typeof window === 'undefined') return null;
    
    const formDataString = localStorage.getItem(formKey);
    return formDataString ? JSON.parse(formDataString) : null;
  } catch (error) {
    console.error("Error retrieving from localStorage:", error);
    return null;
  }
};

// Helper function to set form data to local storage
const setFormDataToLocalStorage = (formKey, data) => {
  try {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem(formKey, JSON.stringify(data));
  } catch (error) {
    console.error("Error saving to localStorage:", error);
  }
};

// Helper function to clear form data from local storage
const clearFormDataFromLocalStorage = (formKey) => {
  try {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem(formKey);
  } catch (error) {
    console.error("Error clearing localStorage:", error);
  }
};

export default function NewLoadForm({ onClose, onSubmit }) {
  // Form key for localStorage
  const formKey = 'loadForm-new';
  
  // Initial form data
  const initialFormData = {
    customer: "",
    origin: "",
    destination: "",
    pickupDate: "",
    deliveryDate: "",
    rate: "",
    description: "",
  };
  
  // State management
  const [formData, setFormData] = useState(initialFormData);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [customers, setCustomers] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(true);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
  const [hasRestoredData, setHasRestoredData] = useState(false);
  
  // Load initial data from localStorage
  useEffect(() => {
    const storedData = getFormDataFromLocalStorage(formKey);
    
    if (storedData && Object.values(storedData).some(value => value !== "" && value !== null)) {
      setFormData(storedData);
      setHasRestoredData(true);
    }
    
    setInitialDataLoaded(true);
  }, []);
  
  // Save form data to localStorage when form data changes
  useEffect(() => {
    if (initialDataLoaded) {
      setFormDataToLocalStorage(formKey, formData);
    }
  }, [formData, initialDataLoaded]);
  
  // Load customers
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        setCustomersLoading(true);
        
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");
        
        const { data, error } = await supabase
          .from("customers")
          .select("id, company_name")
          .eq("user_id", user.id)
          .order("company_name");
        
        if (error) throw error;
        
        setCustomers(data || []);
      } catch (err) {
        console.error("Error loading customers:", err);
        setError("Failed to load customers. You can still enter customer name manually.");
      } finally {
        setCustomersLoading(false);
      }
    };
    
    loadCustomers();
  }, []);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const validateForm = () => {
    if (!formData.customer.trim()) {
      setError("Customer name is required");
      return false;
    }
    if (!formData.origin.trim()) {
      setError("Pickup location is required");
      return false;
    }
    if (!formData.destination.trim()) {
      setError("Delivery location is required");
      return false;
    }
    if (!formData.pickupDate) {
      setError("Pickup date is required");
      return false;
    }
    if (!formData.deliveryDate) {
      setError("Delivery date is required");
      return false;
    }
    if (!formData.rate || isNaN(parseFloat(formData.rate))) {
      setError("Valid rate is required");
      return false;
    }
    
    const pickupDateTime = new Date(formData.pickupDate);
    const deliveryDateTime = new Date(formData.deliveryDate);
    
    if (deliveryDateTime <= pickupDateTime) {
      setError("Delivery date must be after pickup date");
      return false;
    }
    
    return true;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    if (!validateForm()) {
      return;
    }
    
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      
      const loadData = {
        user_id: user.id,
        customer: formData.customer,
        origin: formData.origin,
        destination: formData.destination,
        pickup_date: formData.pickupDate,
        delivery_date: formData.deliveryDate,
        rate: parseFloat(formData.rate),
        description: formData.description || "",
        status: "Pending",
        created_at: new Date().toISOString(),
      };
      
      const { data, error } = await supabase
        .from("loads")
        .insert([loadData])
        .select()
        .single();
      
      if (error) throw error;
      
      // Clear form data from localStorage on successful submission
      clearFormDataFromLocalStorage(formKey);
      
      onSubmit(data);
      onClose();
    } catch (err) {
      console.error("Error creating load:", err);
      setError(err.message || "Failed to create load");
    } finally {
      setSaving(false);
    }
  };
  
  const handleClose = () => {
    // Keep data in localStorage when closing
    onClose();
  };
  
  const handleClearForm = () => {
    clearFormDataFromLocalStorage(formKey);
    setFormData(initialFormData);
    setHasRestoredData(false);
  };
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-400 p-5 rounded-t-xl text-white z-10">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold flex items-center">
              <Route size={20} className="mr-2" />
              Create New Load
            </h2>
            <button 
              onClick={handleClose}
              className="p-2 hover:bg-blue-500 rounded-full transition-colors"
              disabled={saving}
            >
              <X size={20} />
            </button>
          </div>
        </div>
        
        {/* Form content */}
        <div className="p-6">
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-md flex items-start">
              <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-2 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
          
          {hasRestoredData && (
            <div className="mb-6 bg-blue-50 border-l-4 border-blue-400 p-4 rounded-md flex items-start justify-between">
              <div className="flex items-start">
                <Info className="h-5 w-5 text-blue-400 mt-0.5 mr-2 flex-shrink-0" />
                <p className="text-sm text-blue-700">Your previous form data has been restored.</p>
              </div>
              <button
                onClick={handleClearForm}
                className="ml-4 text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Clear form
              </button>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customer section */}
            <div>
              <label htmlFor="customer" className="block text-sm font-medium text-gray-700 mb-1">
                Customer <span className="text-red-500">*</span>
              </label>
              <div className="flex space-x-2">
                {customersLoading ? (
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="Loading customers..."
                      disabled
                    />
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                      <RefreshCw size={16} className="animate-spin text-gray-400" />
                    </div>
                  </div>
                ) : customers.length > 0 ? (
                  <select
                    id="customer"
                    name="customer"
                    value={formData.customer}
                    onChange={handleChange}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                    required
                  >
                    <option value="">Select a customer</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.company_name}>
                        {customer.company_name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    id="customer"
                    name="customer"
                    value={formData.customer}
                    onChange={handleChange}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="Enter customer name"
                    required
                  />
                )}
              </div>
            </div>
            
            {/* Location section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="origin" className="block text-sm font-medium text-gray-700 mb-1">
                  Pickup Location <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin size={16} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="origin"
                    name="origin"
                    value={formData.origin}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="City, State"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="destination" className="block text-sm font-medium text-gray-700 mb-1">
                  Delivery Location <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin size={16} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="destination"
                    name="destination"
                    value={formData.destination}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="City, State"
                    required
                  />
                </div>
              </div>
            </div>
            
            {/* Date section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="pickupDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Pickup Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar size={16} className="text-gray-400" />
                  </div>
                  <input
                    type="date"
                    id="pickupDate"
                    name="pickupDate"
                    value={formData.pickupDate}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="deliveryDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Expected Delivery Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar size={16} className="text-gray-400" />
                  </div>
                  <input
                    type="date"
                    id="deliveryDate"
                    name="deliveryDate"
                    value={formData.deliveryDate}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                    required
                  />
                </div>
              </div>
            </div>
            
            {/* Rate section */}
            <div>
              <label htmlFor="rate" className="block text-sm font-medium text-gray-700 mb-1">
                Rate ($) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSign size={16} className="text-gray-400" />
                </div>
                <input
                  type="number"
                  id="rate"
                  name="rate"
                  value={formData.rate}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
            
            {/* Description section */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <div className="relative">
                <div className="absolute top-3 left-0 pl-3 pointer-events-none">
                  <FileText size={16} className="text-gray-400" />
                </div>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Additional details about the load"
                ></textarea>
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="border-t border-gray-200 pt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 inline-flex items-center transition-colors"
              >
                {saving ? (
                  <>
                    <RefreshCw size={16} className="animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} className="mr-2" />
                    Create Load
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}