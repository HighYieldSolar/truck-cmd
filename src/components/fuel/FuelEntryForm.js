// src/components/fuel/FuelEntryForm.js
/* eslint-disable @next/next/no-img-element */
"use client";
import { useState, useEffect } from "react";
import { X, RefreshCw, AlertCircle, Fuel, MapPin, DollarSign, Info, Maximize2, Calendar, CreditCard, Image } from "lucide-react";
import { v4 as uuidv4 } from 'uuid';
import { supabase } from "@/lib/supabaseClient";
import { getUSStates } from "@/lib/services/fuelService";
import { getCurrentDateLocal, formatDateLocal, prepareDateForDB } from "@/lib/utils/dateUtils";

// Import the VehicleSelector component
import VehicleSelector from "@/components/fuel/VehicleSelector";

const states = getUSStates();

// Define initial form data
const defaultFormData = {
    date: getCurrentDateLocal(),
    state: "",
    state_name: "",
    location: "",
    gallons: '',
    price_per_gallon: '',
    total_amount: '',
    vehicle_id: '',
    odometer: '',
    fuel_type: 'Diesel',
    payment_method: 'Credit Card',
    notes: '',
    receipt_image: null,
    receipt_file: null,
    receipt_preview: null,
};
  


export default function FuelEntryForm({ isOpen, onClose, fuelEntry, onSave, isSubmitting = false, vehicles = [] }) { 
  
  const formKey = fuelEntry ? `fuelEntry-${fuelEntry.id}` : `fuelEntry-${uuidv4()}`;
  const storedData = localStorage.getItem(formKey);
  const initialData = storedData ? JSON.parse(storedData) : defaultFormData;


  // State to manage form data, initialized from local storage or defaults

  const [formData, setFormData] = useState(initialData);
  
  // Save form data to local storage whenever it changes
  useEffect(() => {
    if (formKey) {
        localStorage.setItem(formKey, JSON.stringify(formData));
    }
  }, [formData, formKey]);

  const [calculationMode, setCalculationMode] = useState('total');
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  useEffect(() => {
    if (!fuelEntry) {
        setFormData(storedData ? JSON.parse(storedData) : defaultFormData);
    } 
  }, [fuelEntry]);


  useEffect(() => { 

    
    if(!formKey) return;
    if (fuelEntry) {
      // Format existing entry data for the form
      setFormData({
        ...fuelEntry,
        // Format date to YYYY-MM-DD for the date input
        date: fuelEntry.date ? formatDateLocal(fuelEntry.date) : '',
        gallons: fuelEntry.gallons.toString(),
        price_per_gallon: fuelEntry.price_per_gallon.toString(),
        total_amount: fuelEntry.total_amount.toString(),
        odometer: fuelEntry.odometer ? fuelEntry.odometer.toString() : '',
        receipt_preview: fuelEntry.receipt_image,
        receipt_file: null // Reset file input when editing
      });

      // Set calculation mode
      setCalculationMode('total');
    } else {
      // Reset form for new fuel entry
      setFormData({
        date: getCurrentDateLocal(), // Today's date
        state: '',
        state_name: '',
        location: '',
        gallons: '',
        price_per_gallon: '',
        total_amount: '',
        vehicle_id: '',
        odometer: '',
        fuel_type: 'Diesel',
        payment_method: 'Credit Card',
        notes: '',
        receipt_image: null,
        receipt_file: null,
        receipt_preview: null
      });
      setCalculationMode('total');
    }

    // Reset validation state
    setErrors({});
    setTouched({}); 
  }, [fuelEntry]);
  
  
  // Handle form reset when the modal closes
  useEffect(() => {
      if (!isOpen && formKey) {
          localStorage.removeItem(formKey);
      }      
  }, [isOpen, formKey]);



  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    
    if (type === 'file' && files && files[0]) {
      const file = files[0];
      // Create a preview URL for the image
      const previewUrl = URL.createObjectURL(file);
      
      setFormData({
        ...formData,
        receipt_file: file,
        receipt_preview: previewUrl
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
      
      // Auto-calculate total amount or price per gallon
      if (name === 'gallons' || name === 'price_per_gallon' || name === 'total_amount') {
        const gallons = parseFloat(name === 'gallons' ? value : formData.gallons) || 0;
        const pricePerGallon = parseFloat(name === 'price_per_gallon' ? value : formData.price_per_gallon) || 0;
        const totalAmount = parseFloat(name === 'total_amount' ? value : formData.total_amount) || 0;
        
        if (calculationMode === 'total' && gallons > 0 && pricePerGallon > 0) {
          // Calculate total from gallons and price per gallon
          const calculatedTotal = (gallons * pricePerGallon).toFixed(2);
          setFormData(current => ({
            ...current,
            total_amount: calculatedTotal
          }));
        } else if (calculationMode === 'price' && gallons > 0 && totalAmount > 0) {
          // Calculate price per gallon from total and gallons
          const calculatedPrice = (totalAmount / gallons).toFixed(3);
          setFormData(current => ({
            ...current,
            price_per_gallon: calculatedPrice
          }));
        }
      }
    }

    // Clear any errors on change
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched({ ...touched, [name]: true });
    
    // Validate the field

    validateField(name, formData[name]);
  };

  const validateField = (name, value) => {
    let error = null;
    
    switch (name) {
      case 'date':
        if (!value) error = 'Date is required';
        break;
      case 'state':
        if (!value) error = 'State is required';
        break;
      case 'location':
        if (!value) error = 'Location is required';
        break;
      case 'gallons':
        if (!value) error = 'Gallons is required';
        if (isNaN(parseFloat(value)) || parseFloat(value) <= 0) error = 'Enter a valid number greater than 0';
        break;
      case 'price_per_gallon':
        if (calculationMode === 'total' && (!value || parseFloat(value) <= 0)) {
          error = 'Enter a valid price per gallon';
        }
        break;
      case 'total_amount':
        if (calculationMode === 'price' && (!value || parseFloat(value) <= 0)) {
          error = 'Enter a valid total amount';
        }
        break;
      case 'vehicle_id':
        if (!value) error = 'Vehicle ID is required';
        break;
      default:
        break;
    }
    
    setErrors(prev => ({ ...prev, [name]: error }));
    return !error;
  };

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;
    
    // Check required fields
    const requiredFields = ['date', 'state', 'location', 'gallons', 'vehicle_id'];
    
    if (calculationMode === 'total') {
      requiredFields.push('price_per_gallon');
    } else {
      requiredFields.push('total_amount');
    }
    
    requiredFields.forEach(field => {
      const valid = validateField(field, formData[field]);
      if (!valid) isValid = false;
    });
    
    // Mark all fields as touched
    const allTouched = requiredFields.reduce((acc, field) => {
      acc[field] = true;
      return acc;
    }, {});
    
    setTouched(prev => ({ ...prev, ...allTouched }));
    
    return isValid;
  };

  // Toggle calculation mode between total and price per gallon
  const toggleCalculationMode = () => {
    setCalculationMode(calculationMode === 'total' ? 'price' : 'total');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    try {
      // Prepare data for submission
      const fuelEntryData = {
        ...formData,
        date: prepareDateForDB(formData.date), // Ensure proper date format
        gallons: parseFloat(formData.gallons),
        price_per_gallon: parseFloat(formData.price_per_gallon),
        total_amount: parseFloat(formData.total_amount),
        odometer: formData.odometer ? parseFloat(formData.odometer) : null
      };
      
      // Call the parent save function
      await onSave(fuelEntryData);
      
      // Close the modal
      onClose();
    } catch (error) {
      console.error('Error saving fuel entry:', error);
      setErrors(prev => ({
        ...prev,
        form: 'Failed to save fuel entry. Please try again.'
      }));
    }
  };

  // Get state name from state code
  const getStateName = (stateCode) => {
    const state = states.find(s => s.code === stateCode);
    return state ? state.name : "";
  };

  

if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl p-6 overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-center pb-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
          <Fuel size={20} className="text-blue-600 mr-2" />
          {fuelEntry ? "Edit Fuel Purchase" : "Add New Fuel Purchase"}
          </h2>
          <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100"
          disabled={isSubmitting}
          >          <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="mt-4">
          {errors.form && (
            <div className="rounded-md bg-red-50 p-4 mb-4">
              <div className="flex">
              <div className="flex-shrink-0"><AlertCircle className="h-5 w-5 text-red-400"/></div>
              <div className="ml-3">
              <p className="text-sm font-medium text-red-800">{errors.form}</p>
              </div>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column - Form Fields */}
            <div className="space-y-6">
              <div>
              <label htmlFor="date" className="text-sm font-medium text-gray-700 mb-1 flex items-center">
              <Calendar size={16} className="text-gray-400 mr-1" /> Date *
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full px-3 py-2 border ${
                    errors.date && touched.date ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  } rounded-md shadow-sm text-sm focus:outline-none`}
                  required
                />
                {errors.date && touched.date && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                <AlertCircle size={12} className="mr-1" />
                    {errors.date}
                  </p>
                )}
              </div>
              
              <div>
                <label htmlFor="state" className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                <MapPin size={16} className="text-gray-400 mr-1" /> State *
              </label>
                <select
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      state: e.target.value,
                      state_name: getStateName(e.target.value)
                    });
                    if (errors.state) {
                      setErrors(prev => ({ ...prev, state: null }));
                    }
                  }}
                  onBlur={handleBlur}
                  className={`w-full px-3 py-2 border ${
                    errors.state && touched.state ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  } rounded-md shadow-sm text-sm focus:outline-none`}
                  required
                >
                  <option value="" disabled>Select State</option>
                  {states.map((state) =>
                    <option key={state.code} value={state.code}>{state.name} ({state.code})</option>
                    )}
                </select>
                {errors.state && touched.state && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle size={12} className="mr-1" />
                {errors.state}
                </p>
                )}
              </div>

              <div>
                <label htmlFor="location" className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <MapPin size={16} className="text-gray-400 mr-1" /> Location/Station *
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  placeholder="E.g., Flying J Truck Stop"
                  value={formData.location}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full px-3 py-2 border ${
                    errors.location && touched.location ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  } rounded-md shadow-sm text-sm focus:outline-none`}
                  required
                />
                {errors.location && touched.location && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle size={12} className="mr-1" />
                    {errors.location}
                  </p>
                )}
              </div>
              
              <div>
                <label htmlFor="gallons" className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Fuel size={16} className="text-gray-400 mr-1" /> Gallons *
                </label>
                <input
                  type="number"
                  id="gallons"
                  name="gallons"
                  placeholder="0.000"
                  step="0.001"
                  min="0"
                  value={formData.gallons}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full px-3 py-2 border ${
                    errors.gallons && touched.gallons ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  } rounded-md shadow-sm text-sm focus:outline-none`}
                  required
                />
                {errors.gallons && touched.gallons && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle size={12} className="mr-1" />
                    {errors.gallons}
                  </p>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="price_per_gallon" className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <DollarSign size={16} className="text-gray-400 mr-1" /> Price/Gallon *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500">$</span>
                    </div>
                    <input
                      type="number"
                      id="price_per_gallon"
                      name="price_per_gallon"
                      placeholder="0.000"
                      step="0.001"
                      min="0"
                      value={formData.price_per_gallon}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full pl-7 pr-3 py-2 border ${
                        errors.price_per_gallon && touched.price_per_gallon ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                      } rounded-md shadow-sm text-sm focus:outline-none`}
                      required={calculationMode === 'total'}
                      disabled={calculationMode === 'price'}
                    />
                  </div>
                  {errors.price_per_gallon && touched.price_per_gallon && calculationMode === 'total' && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle size={12} className="mr-1" />
                      {errors.price_per_gallon}
                    </p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="total_amount" className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <DollarSign size={16} className="text-gray-400 mr-1" /> Total Amount *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500">$</span>
                    </div>
                    <input
                      type="number"
                      id="total_amount"
                      name="total_amount"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      value={formData.total_amount}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full pl-7 pr-3 py-2 border ${
                        errors.total_amount && touched.total_amount ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                      } rounded-md shadow-sm text-sm focus:outline-none`}
                      required={calculationMode === 'price'}
                      disabled={calculationMode === 'total'}
                    />
                  </div>
                  {errors.total_amount && touched.total_amount && calculationMode === 'price' && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle size={12} className="mr-1" />
                      {errors.total_amount}
                    </p>
                  )}
                </div>
              </div>
              
              <div>
                <button
                  type="button"
                  onClick={toggleCalculationMode}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Switch to {calculationMode === 'total' ? 'calculate price per gallon' : 'calculate total amount'}
                </button>
              </div>
              
              {/* Use the enhanced VehicleSelector component instead of basic select/input */}
              <div>
                <VehicleSelector
                  selectedVehicleId={formData.vehicle_id}
                  onChange={handleChange}
                  required={true}
                  disabled={isSubmitting}
                  className="w-full focus:outline-none"
                />
              {errors.vehicle_id && touched.vehicle_id && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle size={12} className="mr-1" />
                    {errors.vehicle_id}
                  </p>
                )}
              </div>
              
              <div>
                <label htmlFor="odometer" className="block text-sm font-medium text-gray-700 mb-1">
                  Odometer Reading
                </label>
                <input
                  type="number"
                  id="odometer"
                  name="odometer"
                  placeholder="Current mileage"
                  min="0"
                  value={formData.odometer}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="Diesel">Diesel</option>
                  <option value="Gasoline">Gasoline</option>
                  <option value="DEF">DEF</option>
                  <option value="CNG">CNG</option>
                  <option value="LNG">LNG</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="payment_method" className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <CreditCard size={16} className="text-gray-400 mr-1" /> Payment Method
                </label>
                <select
                  id="payment_method"
                  name="payment_method"
                  value={formData.payment_method || 'Credit Card'}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="Credit Card">Credit Card</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="Cash">Cash</option>
                  <option value="EFT">EFT</option>
                  <option value="Fuel Card">Fuel Card</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            
            {/* Right Column - Receipt Upload and Additional Info */}
            <div className="space-y-6">
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
              
              {/* Receipt Preview */}
              {formData.receipt_preview && (
                <div className="border rounded-md p-4">
                  <div className="mb-2 flex justify-between items-center">
                    <h3 className="text-sm font-medium text-gray-700">Receipt Preview </h3>
                    <button
                      type="button"
                      className="text-blue-600 hover:text-blue-800"
                      onClick={() => window.open(formData.receipt_preview, "_blank", "width=800,height=600")}
                    >
                  <Maximize2 size={16} />
                    </button>
                  </div>
                  <div className="relative aspect-[3/4] max-h-96 overflow-hidden bg-gray-100 rounded-md flex items-center justify-center">
                    <img
                         src={formData.receipt_preview}
                         alt="Receipt preview"
                         className="max-w-full max-h-full object-contain"
                       />
                     </div>
                </div>
              )}
              
              {/* Notes Field */}
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows="3"
                  value={formData.notes || ''}
                  onChange={handleChange}
                  placeholder="Additional information about this purchase"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                ></textarea>
              </div>
              
              {/* IFTA Information */}
              <div className="bg-yellow-50 p-4 rounded-md">
                <div className="flex items-start">
                  <Info size={16} className="text-yellow-800 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-medium text-yellow-800">IFTA Reporting Information</h3>
                    <p className="text-sm text-yellow-700 mt-1">
                      This fuel purchase will be included in your IFTA quarterly reports. Accurate state information is critical for proper tax reporting.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 flex items-center"
              disabled={isSubmitting}
            >
            {isSubmitting ? (
              <>
              <RefreshCw size={16} className="animate-spin mr-2" />
              Saving...
              </>
            ) : (
              fuelEntry ? "Update Fuel Entry" : "Save Fuel Entry"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}