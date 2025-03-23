"use client";

import { useState } from "react";
import { 
  Plus, 
  Truck, 
  Calendar, 
  MapPin, 
  Fuel, 
  DollarSign, 
  AlertCircle,
  RefreshCw,
  Info,
  FileText
} from "lucide-react";

// Helper function to get US states
const getUSStates = () => {
  return [
    { code: "AL", name: "Alabama" },
    { code: "AK", name: "Alaska" },
    { code: "AZ", name: "Arizona" },
    { code: "AR", name: "Arkansas" },
    { code: "CA", name: "California" },
    { code: "CO", name: "Colorado" },
    { code: "CT", name: "Connecticut" },
    { code: "DE", name: "Delaware" },
    { code: "FL", name: "Florida" },
    { code: "GA", name: "Georgia" },
    { code: "HI", name: "Hawaii" },
    { code: "ID", name: "Idaho" },
    { code: "IL", name: "Illinois" },
    { code: "IN", name: "Indiana" },
    { code: "IA", name: "Iowa" },
    { code: "KS", name: "Kansas" },
    { code: "KY", name: "Kentucky" },
    { code: "LA", name: "Louisiana" },
    { code: "ME", name: "Maine" },
    { code: "MD", name: "Maryland" },
    { code: "MA", name: "Massachusetts" },
    { code: "MI", name: "Michigan" },
    { code: "MN", name: "Minnesota" },
    { code: "MS", name: "Mississippi" },
    { code: "MO", name: "Missouri" },
    { code: "MT", name: "Montana" },
    { code: "NE", name: "Nebraska" },
    { code: "NV", name: "Nevada" },
    { code: "NH", name: "New Hampshire" },
    { code: "NJ", name: "New Jersey" },
    { code: "NM", name: "New Mexico" },
    { code: "NY", name: "New York" },
    { code: "NC", name: "North Carolina" },
    { code: "ND", name: "North Dakota" },
    { code: "OH", name: "Ohio" },
    { code: "OK", name: "Oklahoma" },
    { code: "OR", name: "Oregon" },
    { code: "PA", name: "Pennsylvania" },
    { code: "RI", name: "Rhode Island" },
    { code: "SC", name: "South Carolina" },
    { code: "SD", name: "South Dakota" },
    { code: "TN", name: "Tennessee" },
    { code: "TX", name: "Texas" },
    { code: "UT", name: "Utah" },
    { code: "VT", name: "Vermont" },
    { code: "VA", name: "Virginia" },
    { code: "WA", name: "Washington" },
    { code: "WV", name: "West Virginia" },
    { code: "WI", name: "Wisconsin" },
    { code: "WY", name: "Wyoming" },
    { code: "AB", name: "Alberta" },
    { code: "BC", name: "British Columbia" },
    { code: "MB", name: "Manitoba" },
    { code: "NB", name: "New Brunswick" },
    { code: "NL", name: "Newfoundland" },
    { code: "NS", name: "Nova Scotia" },
    { code: "ON", name: "Ontario" },
    { code: "PE", name: "Prince Edward Island" },
    { code: "QC", name: "Quebec" },
    { code: "SK", name: "Saskatchewan" }
  ];
};

export default function EnhancedTripEntryForm({ onAddTrip, isLoading = false, fuelData = [], vehicles = [] }) {
  const [tripForm, setTripForm] = useState({
    vehicleId: "",
    date: new Date().toISOString().split('T')[0],
    startJurisdiction: "",
    endJurisdiction: "",
    miles: "",
    startOdometer: "",
    endOdometer: "",
    gallons: "",
    fuelCost: "",
    loadId: "",
    notes: ""
  });
  
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [calculationMode, setCalculationMode] = useState('manual'); // 'manual', 'odometer' or 'mpg'
  const [showTips, setShowTips] = useState(false);

  // Get all states for dropdowns
  const states = getUSStates();
  
  // Get unique vehicles from passed vehicles or fuel data
  const getUniqueVehicles = () => {
    const uniqueVehicles = new Set();
    
    // Add vehicles passed from props
    if (vehicles && vehicles.length > 0) {
      vehicles.forEach(vehicle => {
        uniqueVehicles.add(vehicle.id || vehicle);
      });
    }
    
    // Add vehicles from fuel data if available
    if (fuelData && fuelData.length > 0) {
      fuelData.forEach(entry => {
        if (entry.vehicle_id) uniqueVehicles.add(entry.vehicle_id);
      });
    }
    
    return Array.from(uniqueVehicles);
  };
  
  const uniqueVehicles = getUniqueVehicles();

  // Mark field as touched on blur
  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched({ ...touched, [name]: true });
    validateField(name, tripForm[name]);
  };

  // Validate a specific field
  const validateField = (name, value) => {
    let error = null;
    
    switch (name) {
      case 'date':
        if (!value) error = 'Date is required';
        break;
      case 'vehicleId':
        if (!value) error = 'Vehicle ID is required';
        break;
      case 'startJurisdiction':
        if (!value) error = 'Starting jurisdiction is required';
        break;
      case 'endJurisdiction':
        if (!value) error = 'Ending jurisdiction is required';
        break;
      case 'miles':
        if (calculationMode === 'manual' && (!value || parseFloat(value) <= 0)) {
          error = 'Enter a valid number greater than 0';
        }
        break;
      case 'startOdometer':
        if (calculationMode === 'odometer' && (!value || parseFloat(value) <= 0)) {
          error = 'Enter a valid odometer reading';
        }
        break;
      case 'endOdometer':
        if (calculationMode === 'odometer') {
          if (!value || parseFloat(value) <= 0) {
            error = 'Enter a valid odometer reading';
          } else if (parseFloat(value) <= parseFloat(tripForm.startOdometer)) {
            error = 'Ending odometer must be greater than starting odometer';
          }
        }
        break;
      case 'gallons':
        if (calculationMode !== 'mpg' && parseFloat(value) < 0) {
          error = 'Gallons cannot be negative';
        }
        break;
      case 'fuelCost':
        if (parseFloat(value) < 0) {
          error = 'Fuel cost cannot be negative';
        }
        break;
      default:
        break;
    }
    
    setErrors(prev => ({ ...prev, [name]: error }));
    return !error;
  };

  // Validate form based on calculation mode
  const validateForm = () => {
    const newErrors = {};
    let isValid = true;
    
    // Define required fields based on calculation mode
    const requiredFields = ['date', 'vehicleId', 'startJurisdiction', 'endJurisdiction'];
    
    if (calculationMode === 'manual') {
      requiredFields.push('miles');
    } else if (calculationMode === 'odometer') {
      requiredFields.push('startOdometer', 'endOdometer');
    }
    
    requiredFields.forEach(field => {
      const valid = validateField(field, tripForm[field]);
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

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setTripForm({
      ...tripForm,
      [name]: value
    });
    
    // Calculate miles from odometer readings
    if (calculationMode === 'odometer' && name === 'endOdometer' && tripForm.startOdometer) {
      const startReading = parseFloat(tripForm.startOdometer);
      const endReading = parseFloat(value);
      
      if (!isNaN(startReading) && !isNaN(endReading) && endReading > startReading) {
        const calculatedMiles = endReading - startReading;
        setTripForm(prev => ({
          ...prev,
          miles: calculatedMiles.toString()
        }));
      }
    }
    
    // Calculate gallons based on mpg if in mpg mode
    if (calculationMode === 'mpg' && name === 'miles') {
      const miles = parseFloat(value) || 0;
      const assumedMpg = 6.5; // Default MPG assumption for trucks
      
      if (miles > 0) {
        const calculatedGallons = (miles / assumedMpg).toFixed(3);
        setTripForm(prev => ({
          ...prev,
          gallons: calculatedGallons
        }));
      }
    }
    
    // Clear any errors on change
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    // Format data for submission
    const newTrip = {
      ...tripForm,
      miles: parseFloat(tripForm.miles) || 0,
      gallons: parseFloat(tripForm.gallons) || 0,
      fuelCost: parseFloat(tripForm.fuelCost) || 0,
      startOdometer: parseFloat(tripForm.startOdometer) || 0,
      endOdometer: parseFloat(tripForm.endOdometer) || 0
    };
    
    // Call parent component's add function
    onAddTrip(newTrip);
    
    // Reset form
    setTripForm({
      vehicleId: "",
      date: new Date().toISOString().split('T')[0],
      startJurisdiction: "",
      endJurisdiction: "",
      miles: "",
      startOdometer: "",
      endOdometer: "",
      gallons: "",
      fuelCost: "",
      loadId: "",
      notes: ""
    });
    
    // Reset validation states
    setErrors({});
    setTouched({});
  };

  // Handle calculation mode change
  const handleModeChange = (mode) => {
    setCalculationMode(mode);
    setErrors({});
    setTouched({});
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <div className="flex items-center">
          <Plus size={20} className="text-blue-600 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Add New Trip</h3>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setShowTips(!showTips)}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
          >
            <Info size={14} className="mr-1" />
            {showTips ? 'Hide Tips' : 'Show Tips'}
          </button>
        </div>
      </div>
      
      {/* Calculation mode selector */}
      <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
        <div className="text-sm font-medium text-gray-700 mb-2">Trip Recording Method:</div>
        <div className="flex space-x-4">
          <label className="flex items-center">
            <input
              type="radio"
              name="calculationMode"
              checked={calculationMode === 'manual'}
              onChange={() => handleModeChange('manual')}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">Manual Miles</span>
          </label>
          
          <label className="flex items-center">
            <input
              type="radio"
              name="calculationMode"
              checked={calculationMode === 'odometer'}
              onChange={() => handleModeChange('odometer')}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">Odometer Readings</span>
          </label>
          
          <label className="flex items-center">
            <input
              type="radio"
              name="calculationMode"
              checked={calculationMode === 'mpg'}
              onChange={() => handleModeChange('mpg')}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">Auto-calculate Gallons (6.5 MPG)</span>
          </label>
        </div>
      </div>
      
      {/* Tips section */}
      {showTips && (
        <div className="px-6 py-3 bg-blue-50 border-b border-blue-100">
          <div className="flex">
            <Info size={16} className="text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-blue-800">IFTA Recording Tips</h4>
              <ul className="mt-1 text-sm text-blue-700 list-disc list-inside space-y-1">
                <li>Record every interstate trip, including deadhead miles</li>
                <li>Gallons should reflect fuel consumed during the trip, not purchased</li>
                <li>For better accuracy, use the State Mileage Tracker to record exact state crossings</li>
                <li>Ensure dates align with your quarterly reporting periods</li>
              </ul>
            </div>
          </div>
        </div>
      )}
      
      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Trip basics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="vehicleId" className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                <Truck size={16} className="text-gray-400 mr-1" /> Vehicle *
              </label>
              {uniqueVehicles.length > 0 ? (
                <select
                  id="vehicleId"
                  name="vehicleId"
                  value={tripForm.vehicleId}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`mt-1 block w-full rounded-md ${
                    errors.vehicleId && touched.vehicleId
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  } shadow-sm text-sm`}
                  required
                >
                  <option value="">Select Vehicle</option>
                  {uniqueVehicles.map((vehicle) => (
                    <option key={vehicle} value={vehicle}>{vehicle}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  id="vehicleId"
                  name="vehicleId"
                  placeholder="Enter vehicle ID"
                  value={tripForm.vehicleId}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`mt-1 block w-full rounded-md ${
                    errors.vehicleId && touched.vehicleId
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  } shadow-sm text-sm`}
                  required
                />
              )}
              {errors.vehicleId && touched.vehicleId && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle size={12} className="mr-1" />
                  {errors.vehicleId}
                </p>
              )}
            </div>
            
            <div>
              <label htmlFor="date" className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                <Calendar size={16} className="text-gray-400 mr-1" /> Trip Date *
              </label>
              <input
                type="date"
                id="date"
                name="date"
                value={tripForm.date}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`mt-1 block w-full rounded-md ${
                  errors.date && touched.date
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                } shadow-sm text-sm`}
                required
              />
              {errors.date && touched.date && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle size={12} className="mr-1" />
                  {errors.date}
                </p>
              )}
            </div>
            
            <div>
              <label htmlFor="loadId" className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                <FileText size={16} className="text-gray-400 mr-1" /> Load Reference (optional)
              </label>
              <input
                type="text"
                id="loadId"
                name="loadId"
                placeholder="Enter load ID or reference"
                value={tripForm.loadId}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500 shadow-sm text-sm"
              />
            </div>
          </div>
          
          {/* Jurisdictions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="startJurisdiction" className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                <MapPin size={16} className="text-gray-400 mr-1" /> Starting Jurisdiction *
              </label>
              <select
                id="startJurisdiction"
                name="startJurisdiction"
                value={tripForm.startJurisdiction}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`mt-1 block w-full rounded-md ${
                  errors.startJurisdiction && touched.startJurisdiction
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                } shadow-sm text-sm`}
                required
              >
                <option value="">Select Starting State</option>
                {states.map((state) => (
                  <option key={`start-${state.code}`} value={state.code}>{state.name} ({state.code})</option>
                ))}
              </select>
              {errors.startJurisdiction && touched.startJurisdiction && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle size={12} className="mr-1" />
                  {errors.startJurisdiction}
                </p>
              )}
            </div>
            
            <div>
              <label htmlFor="endJurisdiction" className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                <MapPin size={16} className="text-gray-400 mr-1" /> Ending Jurisdiction *
              </label>
              <select
                id="endJurisdiction"
                name="endJurisdiction"
                value={tripForm.endJurisdiction}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`mt-1 block w-full rounded-md ${
                  errors.endJurisdiction && touched.endJurisdiction
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                } shadow-sm text-sm`}
                required
              >
                <option value="">Select Ending State</option>
                {states.map((state) => (
                  <option key={`end-${state.code}`} value={state.code}>{state.name} ({state.code})</option>
                ))}
              </select>
              {errors.endJurisdiction && touched.endJurisdiction && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle size={12} className="mr-1" />
                  {errors.endJurisdiction}
                </p>
              )}
            </div>
          </div>
          
          {/* Distance section */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-700 border-b pb-2">Distance & Fuel Information</h4>
            
            {calculationMode === 'manual' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="miles" className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <Truck size={16} className="text-gray-400 mr-1" /> Miles Driven *
                  </label>
                  <input
                    type="number"
                    id="miles"
                    name="miles"
                    placeholder="0.0"
                    min="0"
                    step="0.1"
                    value={tripForm.miles}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`mt-1 block w-full rounded-md ${
                      errors.miles && touched.miles
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    } shadow-sm text-sm`}
                    required
                  />
                  {errors.miles && touched.miles && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle size={12} className="mr-1" />
                      {errors.miles}
                    </p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="gallons" className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <Fuel size={16} className="text-gray-400 mr-1" /> Gallons Used
                  </label>
                  <input
                    type="number"
                    id="gallons"
                    name="gallons"
                    placeholder="0.0"
                    min="0"
                    step="0.1"
                    value={tripForm.gallons}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`mt-1 block w-full rounded-md ${
                      errors.gallons && touched.gallons
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    } shadow-sm text-sm`}
                  />
                  {errors.gallons && touched.gallons && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle size={12} className="mr-1" />
                      {errors.gallons}
                    </p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="fuelCost" className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <DollarSign size={16} className="text-gray-400 mr-1" /> Fuel Cost ($)
                  </label>
                  <input
                    type="number"
                    id="fuelCost"
                    name="fuelCost"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    value={tripForm.fuelCost}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`mt-1 block w-full rounded-md ${
                      errors.fuelCost && touched.fuelCost
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    } shadow-sm text-sm`}
                  />
                  {errors.fuelCost && touched.fuelCost && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle size={12} className="mr-1" />
                      {errors.fuelCost}
                    </p>
                  )}
                </div>
              </div>
            )}
            
            {calculationMode === 'odometer' && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <label htmlFor="startOdometer" className="flex text-sm font-medium text-gray-700 mb-1 items-center">
                    <Truck size={16} className="text-gray-400 mr-1" /> Start Odometer *
                  </label>
                  <input
                    type="number"
                    id="startOdometer"
                    name="startOdometer"
                    placeholder="0"
                    min="0"
                    step="1"
                    value={tripForm.startOdometer}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`mt-1 block w-full rounded-md ${
                      errors.startOdometer && touched.startOdometer
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    } shadow-sm text-sm`}
                    required
                  />
                  {errors.startOdometer && touched.startOdometer && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle size={12} className="mr-1" />
                      {errors.startOdometer}
                    </p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="endOdometer" className="flex text-sm font-medium text-gray-700 mb-1 items-center">
                    <Truck size={16} className="text-gray-400 mr-1" /> End Odometer *
                  </label>
                  <input
                    type="number"
                    id="endOdometer"
                    name="endOdometer"
                    placeholder="0"
                    min="0"
                    step="1"
                    value={tripForm.endOdometer}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`mt-1 block w-full rounded-md ${
                      errors.endOdometer && touched.endOdometer
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    } shadow-sm text-sm`}
                    required
                  />
                  {errors.endOdometer && touched.endOdometer && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle size={12} className="mr-1" />
                      {errors.endOdometer}
                    </p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="miles" className="flex text-sm font-medium text-gray-700 mb-1 items-center">
                    <Truck size={16} className="text-gray-400 mr-1" /> Total Miles
                  </label>
                  <input
                    type="number"
                    id="miles"
                    name="miles"
                    placeholder="0.0"
                    value={tripForm.miles}
                    readOnly
                    className="mt-1 block w-full rounded-md bg-gray-50 border-gray-300 shadow-sm text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Calculated from odometer readings
                  </p>
                </div>
                
                <div>
                  <label htmlFor="gallons" className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <Fuel size={16} className="text-gray-400 mr-1" /> Gallons Used
                  </label>
                  <input
                    type="number"
                    id="gallons"
                    name="gallons"
                    placeholder="0.0"
                    min="0"
                    step="0.1"
                    value={tripForm.gallons}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500 shadow-sm text-sm"
                  />
                </div>
              </div>
            )}
            
            {calculationMode === 'mpg' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="miles" className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <Truck size={16} className="text-gray-400 mr-1" /> Miles Driven *
                  </label>
                  <input
                    type="number"
                    id="miles"
                    name="miles"
                    placeholder="0.0"
                    min="0"
                    step="0.1"
                    value={tripForm.miles}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`mt-1 block w-full rounded-md ${
                      errors.miles && touched.miles
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    } shadow-sm text-sm`}
                    required
                  />
                  {errors.miles && touched.miles && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle size={12} className="mr-1" />
                      {errors.miles}
                    </p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="gallons" className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <Fuel size={16} className="text-gray-400 mr-1" /> Gallons Used
                  </label>
                  <input
                    type="number"
                    id="gallons"
                    name="gallons"
                    placeholder="0.0"
                    value={tripForm.gallons}
                    readOnly
                    className="mt-1 block w-full rounded-md bg-gray-50 border-gray-300 shadow-sm text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Calculated at 6.5 MPG
                  </p>
                </div>
                
                <div>
                  <label htmlFor="fuelCost" className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <DollarSign size={16} className="text-gray-400 mr-1" /> Fuel Cost ($)
                  </label>
                  <input
                    type="number"
                    id="fuelCost"
                    name="fuelCost"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    value={tripForm.fuelCost}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className="mt-1 block w-full rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500 shadow-sm text-sm"
                  />
                </div>
              </div>
            )}
          </div>
          
          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes (optional)
            </label>
            <textarea
              id="notes"
              name="notes"
              rows="2"
              placeholder="Enter any additional information about this trip"
              value={tripForm.notes}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500 shadow-sm text-sm"
            ></textarea>
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <RefreshCw size={16} className="mr-2 animate-spin" />
                  Adding Trip...
                </>
              ) : (
                <>
                  <Plus size={16} className="mr-2" />
                  Add Trip
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}