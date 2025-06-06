// src/components/expenses/ExpenseFormModal.js
"use client";

import { useState, useEffect } from "react";
import { X, RefreshCw, CheckCircle, FileText, AlertCircle, Calendar, Info, Wallet } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { createExpense, updateExpense, uploadReceiptImage } from "@/lib/services/expenseService";
import { getCurrentDateLocal, formatDateLocal, prepareDateForDB } from "@/lib/utils/dateUtils";

// These helper functions are now replaced by the dateUtils imports above

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

export default function ExpenseFormModal({ isOpen, onClose, expense, onSave }) {
  // Initial form data
  const initialFormData = {
    description: '',
    amount: '',
    date: getCurrentDateLocal(),
    category: 'Fuel',
    payment_method: 'Credit Card',
    notes: '',
    receipt_image: null,
    receipt_file: null,
    vehicle_id: '',
    deductible: true
  };
  
  // Generate unique form key based on whether we're editing or creating
  const formKey = expense ? `expenseForm-${expense.id}` : 'expenseForm-new';
  
  // Main form state
  const [formData, setFormData] = useState(initialFormData);
  
  // UI control states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(false);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
  const [hasRestoredData, setHasRestoredData] = useState(false);

  // Load initial data: either from expense (when editing) or from localStorage (when creating)
  useEffect(() => {
    if (!isOpen) return;
    
    // For editing existing expense
    if (expense) {
      setFormData({
        description: expense.description || "",
        amount: expense.amount?.toString() || "",
        date: formatDateLocal(expense.date) || getCurrentDateLocal(),
        category: expense.category || "Fuel",
        payment_method: expense.payment_method || "Credit Card",
        notes: expense.notes || "",
        receipt_image: expense.receipt_image || null,
        receipt_file: null, // Reset file input when editing
        vehicle_id: expense.vehicle_id || "",
        deductible: expense.deductible !== false
      });
      
      // Clear any saved data for new expense to avoid confusion
      clearFormDataFromLocalStorage('expenseForm-new');
      
      // Save this as the latest edited state
      setFormDataToLocalStorage(formKey, {
        description: expense.description || "",
        amount: expense.amount?.toString() || "",
        date: formatDateLocal(expense.date) || getCurrentDateLocal(),
        category: expense.category || "Fuel",
        payment_method: expense.payment_method || "Credit Card",
        notes: expense.notes || "",
        receipt_image: expense.receipt_image || null,
        vehicle_id: expense.vehicle_id || "",
        deductible: expense.deductible !== false
      });
      
      setInitialDataLoaded(true);
    } 
    // For creating new expense
    else if (!initialDataLoaded) {
      // Check if we have stored data
      const storedData = getFormDataFromLocalStorage(formKey);
      
      if (storedData && (storedData.description || storedData.amount)) {
        setFormData(storedData);
        setHasRestoredData(true);
      }
      
      setInitialDataLoaded(true);
    }
  }, [expense, isOpen, initialDataLoaded, formKey]);

  // Save form data to localStorage when form data changes
  useEffect(() => {
    if (initialDataLoaded && isOpen) {
      // Don't save the file object to localStorage
      const dataToStore = { ...formData };
      if (dataToStore.receipt_file) {
        delete dataToStore.receipt_file;
      }
      
      setFormDataToLocalStorage(formKey, dataToStore);
    }
  }, [formData, initialDataLoaded, isOpen, formKey]);

  // Reset initialDataLoaded when modal closes
  useEffect(() => {
    if (!isOpen) {
      setInitialDataLoaded(false);
      setHasRestoredData(false);
    }
  }, [isOpen]);

  // Load vehicles when the modal opens
  useEffect(() => {
    async function loadVehicles() {
      if (!isOpen) return;
      
      try {
        setVehiclesLoading(true);
        
        // Get the current user ID
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error("Not authenticated");
        }
        
        const userId = session.user.id;
        
        // First try to get vehicles from the vehicles table
        let { data, error } = await supabase
          .from('vehicles')
          .select('id, name, license_plate')
          .eq('user_id', userId);
        
        // If that fails, try the trucks table instead
        if (error || !data || data.length === 0) {
          const { data: trucksData, error: trucksError } = await supabase
            .from('trucks')
            .select('id, name, license_plate')
            .eq('user_id', userId);
            
          if (!trucksError) {
            data = trucksData;
          }
        }
        
        // If we still don't have data, create some sample vehicles
        if (!data || data.length === 0) {
          data = [
            { id: 'truck1', name: 'Truck 1', license_plate: 'ABC123' },
            { id: 'truck2', name: 'Truck 2', license_plate: 'XYZ789' }
          ];
        }
        
        setVehicles(data);
        
      } catch (error) {
        console.error('Error loading vehicles:', error);
        
        // Set some default vehicles as fallback
        setVehicles([
          { id: 'truck1', name: 'Truck 1', license_plate: 'ABC123' },
          { id: 'truck2', name: 'Truck 2', license_plate: 'XYZ789' }
        ]);
      } finally {
        setVehiclesLoading(false);
      }
    }
    
    loadVehicles();
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    
    if (type === 'file' && files && files[0]) {
      const file = files[0];
      // Create a preview URL for the image
      const previewUrl = URL.createObjectURL(file);
      
      setFormData({
        ...formData,
        receipt_file: file,
        receipt_image: previewUrl
      });
    } else if (type === "checkbox") {
      setFormData({
        ...formData,
        [name]: checked
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      let receiptImageUrl = formData.receipt_image;
      
      // If there's a new receipt file, upload it to Supabase storage
      if (formData.receipt_file) {
        // Get the current user ID from Supabase auth
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error("Not authenticated");
        }
        
        receiptImageUrl = await uploadReceiptImage(session.user.id, formData.receipt_file);
      }
      
      // Prepare expense data for Supabase
      const expenseData = {
        description: formData.description,
        amount: parseFloat(formData.amount),
        date: prepareDateForDB(formData.date),
        category: formData.category,
        payment_method: formData.payment_method,
        notes: formData.notes,
        receipt_image: receiptImageUrl,
        vehicle_id: formData.vehicle_id,
        deductible: formData.deductible
      };
      
      // Add user_id for new expenses
      if (!expense) {
        const { data: { session } } = await supabase.auth.getSession();
        expenseData.user_id = session.user.id;
      }
      
      let result;
      
      if (expense) {
        // Update existing expense
        result = await updateExpense(expense.id, expenseData);
      } else {
        // Create new expense
        result = await createExpense(expenseData);
      }
      
      // Call the parent component's onSave callback with the result
      onSave(result);
      
      // Clear form data from local storage
      clearFormDataFromLocalStorage(formKey);
      
      // Close the modal
      onClose();
    } catch (err) {
      console.error('Error saving expense:', err);
      setError(err.message || 'Failed to save expense. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-400 text-white rounded-t-xl">
          <h2 className="text-xl font-bold flex items-center">
            <Wallet size={20} className="mr-2" />
            {expense ? "Edit Expense" : "Add Expense"}
          </h2>
          <button 
            onClick={onClose} 
            className="p-2 text-white hover:bg-blue-500 rounded-full transition-colors focus:outline-none"
            disabled={isSubmitting}
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Form content */}
        <div className="p-6">
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-md flex items-start">
              <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-2 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
          
          {hasRestoredData && !expense && (
            <div className="mb-6 bg-blue-50 border-l-4 border-blue-400 p-4 rounded-md flex items-start">
              <Info className="h-5 w-5 text-blue-400 mt-0.5 mr-2 flex-shrink-0" />
              <p className="text-sm text-blue-700">Your previous form data has been restored.</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center border-b border-gray-200 pb-2">
                <Info size={18} className="mr-2 text-blue-500" />
                Basic Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="e.g. Fuel for Truck #123"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                    Amount ($) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="amount"
                    name="amount"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={handleChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                    required
                  >
                    <option value="Fuel">Fuel</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Insurance">Insurance</option>
                    <option value="Tolls">Tolls</option>
                    <option value="Office">Office</option>
                    <option value="Permits">Permits</option>
                    <option value="Meals">Meals</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="payment_method" className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Method
                  </label>
                  <select
                    id="payment_method"
                    name="payment_method"
                    value={formData.payment_method}
                    onChange={handleChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="Credit Card">Credit Card</option>
                    <option value="Debit Card">Debit Card</option>
                    <option value="Cash">Cash</option>
                    <option value="Check">Check</option>
                    <option value="EFT">EFT</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>
            
            {/* Vehicle & Receipt Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center border-b border-gray-200 pb-2">
                <FileText size={18} className="mr-2 text-blue-500" />
                Vehicle & Receipt
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="vehicle_id" className="block text-sm font-medium text-gray-700 mb-1">
                    Vehicle
                  </label>
                  <select
                    id="vehicle_id"
                    name="vehicle_id"
                    value={formData.vehicle_id}
                    onChange={handleChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="">Select Vehicle</option>
                    {vehiclesLoading ? (
                      <option disabled>Loading vehicles...</option>
                    ) : (
                      vehicles.map(vehicle => (
                        <option key={vehicle.id} value={vehicle.id}>
                          {vehicle.name} {vehicle.license_plate ? `(${vehicle.license_plate})` : ''}
                        </option>
                      ))
                    )}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Receipt Image (optional)
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                        aria-hidden="true"
                      >
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="receipt_image"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none"
                        >
                          <span>Upload a file</span>
                          <input
                            id="receipt_image"
                            name="receipt_image"
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            onChange={handleChange}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        PNG, JPG, GIF up to 10MB
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Receipt Preview */}
              {formData.receipt_image && (
                <div className="border rounded-md p-4">
                  <div className="mb-2 flex justify-between items-center">
                    <h3 className="text-sm font-medium text-gray-700">Receipt Preview</h3>
                    <button
                      type="button"
                      className="text-blue-600 hover:text-blue-800"
                      onClick={() => window.open(formData.receipt_image, "_blank", "width=800,height=600")}
                    >
                      <FileText size={16} />
                    </button>
                  </div>
                  <div className="relative aspect-[3/4] max-h-96 overflow-hidden bg-gray-100 rounded-md flex items-center justify-center">
                    <img
                      src={formData.receipt_image}
                      alt="Receipt preview"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, receipt_file: null, receipt_image: null })}
                      className="text-xs text-red-600 hover:text-red-800"
                    >
                      Remove Receipt
                    </button>
                  </div>
                </div>
              )}
              
              <div>
                <label htmlFor="deductible" className="flex items-center space-x-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    id="deductible"
                    name="deductible"
                    checked={formData.deductible}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">Tax Deductible</span>
                </label>
              </div>
            </div>
            
            {/* Notes Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center border-b border-gray-200 pb-2">
                <Info size={18} className="mr-2 text-blue-500" />
                Additional Notes
              </h3>
              
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
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Any additional information"
                ></textarea>
              </div>
            </div>
            
            {/* Form actions */}
            <div className="border-t border-gray-200 pt-4 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none flex items-center transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={16} className="animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} className="mr-2" />
                    {expense ? "Update Expense" : "Save Expense"}
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