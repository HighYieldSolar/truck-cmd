"use client";

import { useState, useEffect } from "react";
import { 
  Plus, 
  Truck, 
  Calendar, 
  MapPin, 
  Fuel, 
  DollarSign, 
  AlertCircle,
  RefreshCw,
  Info
} from "lucide-react";

// Get state/jurisdiction list for dropdowns
const getJurisdictions = () => {
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
    // Canadian provinces
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

export default function TripEntryForm({ onAddTrip, isLoading = false, fuelData = [] }) {
  const [tripData, setTripData] = useState({
    date: "",
    vehicleId: "",
    driverId: "",
    loadId: "",
    startJurisdiction: "",
    endJurisdiction: "",
    miles: "",
    gallons: "",
    fuelCost: "",
    startOdometer: "",
    endOdometer: "",
    endDate: ""
  });
  
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [calculationMode, setCalculationMode] = useState('mpg'); // 'mpg' or 'gallons'
  const [vehicles, setVehicles] = useState([]);
  const [showFuelDataTips, setShowFuelDataTips] = useState(false);

  // Get jurisdictions for dropdowns
  const jurisdictions = getJurisdictions();

  // Populate vehicle list from fuel data
  useEffect(() => {
    if (fuelData && fuelData.length > 0) {
      const uniqueVehicles = [...new Set(fuelData.map(entry => entry.vehicle_id))];
      setVehicles(uniqueVehicles);
    }
  }, [fuelData]);

  // Mark field as touched on blur
  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched({ ...touched, [name]: true });
    validateField(name, tripData[name]);
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
        if (!value) error = 'Miles is required';
        if (isNaN(parseFloat(value)) || parseFloat(value) <= 0) error = 'Enter a valid number greater than 0';
        break;
      case 'gallons':
        if (calculationMode === 'mpg' && (!value || parseFloat(value) <= 0)) {
          error = 'Enter a valid number greater than 0';
        }
        break;
      case 'fuelCost':
        if (!value && parseFloat(value) !== 0) error = 'Fuel cost is required';
        break;
      default:
        break;
    }
    
    setErrors(prev => ({ ...prev, [name]: error }));
    return !error;
  };

  // Validate all fields
  const validateForm = () => {
    const newErrors = {};
    let isValid = true;
    
    // Define required fields based on calculation mode
    const requiredFields = ['date', 'vehicleId', 'startJurisdiction', 'endJurisdiction', 'miles', 'fuelCost'];
    
    if (calculationMode === 'mpg') {
      requiredFields.push('gallons');
    }
    
    requiredFields.forEach(field => {
      const valid = validateField(field, tripData[field]);
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
    
    setTripData({
      ...tripData,
      [name]: value
    });
    
    // Auto-calculate based on mode
    if (calculationMode === 'mpg' && (name === 'miles' || name === 'gallons')) {
      // No automatic calculation in mpg mode
    } else if (calculationMode === 'gallons' && name === 'miles') {
      // Calculate gallons based on miles and assumed MPG
      const miles = parseFloat(value) || 0;
      const assumedMpg = 6.5; // Default MPG assumption for trucks
      
      if (miles > 0) {
        const calculatedGallons = (miles / assumedMpg).toFixed(3);
        setTripData(prev => ({
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
      ...tripData,
      miles: parseFloat(tripData.miles) || 0,
      gallons: parseFloat(tripData.gallons) || 0,
      fuelCost: parseFloat(tripData.fuelCost) || 0
    };
    
    // Call parent component's add function
    onAddTrip(newTrip);
    
    // Reset form
    setTripData({
      date: "",
      vehicleId: "",
      loadId: "",
      startJurisdiction: "",
      endJurisdiction: "",
      miles: "",
      gallons: "",
      fuelCost: ""
    });
    
    // Reset validation states
    setErrors({});
    setTouched({});
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <Plus size={20} className="text-blue-600 mr-2" />
          Add New Trip
        </h3>
        
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => setCalculationMode(calculationMode === 'mpg' ? 'gallons' : 'mpg')}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
          >
            <RefreshCw size={14} className="mr-1" />
            Switch to {calculationMode === 'mpg' ? 'calculate gallons' : 'enter gallons manually'}
          </button>
        </div>
      </div>
      
      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div>
                <label htmlFor="date" className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Calendar size={16} className="text-gray-400 mr-1" /> Date *
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={tripData.date}
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
                <label htmlFor="vehicleId" className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Truck size={16} className="text-gray-400 mr-1" /> Vehicle ID *
                </label>
                {vehicles.length > 0 ? (
                  <select
                    id="vehicleId"
                    name="vehicleId"
                    value={tripData.vehicleId}
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
                    {vehicles.map((vehicle) => (
                      <option key={vehicle} value={vehicle}>{vehicle}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    id="vehicleId"
                    name="vehicleId"
                    placeholder="Enter truck/vehicle ID"
                    value={tripData.vehicleId}
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
                <label htmlFor="loadId" className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Truck size={16} className="text-gray-400 mr-1" /> Load Reference (optional)
                </label>
                <input
                  type="text"
                  id="loadId"
                  name="loadId"
                  placeholder="Enter load ID or reference"
                  value={tripData.loadId}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500 shadow-sm text-sm"
                />
              </div>
            </div>
            
            <div className="space-y-6">
              <div>
                <label htmlFor="startJurisdiction" className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <MapPin size={16} className="text-gray-400 mr-1" /> Starting Jurisdiction *
                </label>
                <select
                  id="startJurisdiction"
                  name="startJurisdiction"
                  value={tripData.startJurisdiction}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`mt-1 block w-full rounded-md ${
                    errors.startJurisdiction && touched.startJurisdiction
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  } shadow-sm text-sm`}
                  required
                >
                  <option value="">Select Jurisdiction</option>
                  {jurisdictions.map((j) => (
                    <option key={`start-${j.code}`} value={j.code}>{j.name} ({j.code})</option>
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
                  value={tripData.endJurisdiction}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`mt-1 block w-full rounded-md ${
                    errors.endJurisdiction && touched.endJurisdiction
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  } shadow-sm text-sm`}
                  required
                >
                  <option value="">Select Jurisdiction</option>
                  {jurisdictions.map((j) => (
                    <option key={`end-${j.code}`} value={j.code}>{j.name} ({j.code})</option>
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
          </div>
          
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
                value={tripData.miles}
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
                <Fuel size={16} className="text-gray-400 mr-1" /> Gallons Used {calculationMode === 'mpg' ? '*' : ''}
              </label>
              <input
                type="number"
                id="gallons"
                name="gallons"
                placeholder="0.0"
                min="0"
                step="0.1"
                value={tripData.gallons}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`mt-1 block w-full rounded-md ${
                  errors.gallons && touched.gallons
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                } shadow-sm text-sm`}
                required={calculationMode === 'mpg'}
                readOnly={calculationMode === 'gallons'}
              />
              {errors.gallons && touched.gallons && calculationMode === 'mpg' && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle size={12} className="mr-1" />
                  {errors.gallons}
                </p>
              )}
              {calculationMode === 'gallons' && (
                <p className="mt-1 text-xs text-gray-500">
                  Automatically calculated based on miles (6.5 MPG)
                </p>
              )}
            </div>
            
            <div>
              <label htmlFor="fuelCost" className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                <DollarSign size={16} className="text-gray-400 mr-1" /> Fuel Cost ($) *
              </label>
              <input
                type="number"
                id="fuelCost"
                name="fuelCost"
                placeholder="0.00"
                min="0"
                step="0.01"
                value={tripData.fuelCost}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`mt-1 block w-full rounded-md ${
                  errors.fuelCost && touched.fuelCost
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                } shadow-sm text-sm`}
                required
              />
              {errors.fuelCost && touched.fuelCost && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle size={12} className="mr-1" />
                  {errors.fuelCost}
                </p>
              )}
            </div>
          </div>
          
          {/* Fuel data tips */}
          {fuelData && fuelData.length > 0 && (
            <div className="mt-4">
              <button
                type="button"
                onClick={() => setShowFuelDataTips(!showFuelDataTips)}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
              >
                <Info size={14} className="mr-1" />
                {showFuelDataTips ? 'Hide fuel data suggestions' : 'Show fuel data suggestions'}
              </button>
              
              {showFuelDataTips && (
                <div className="mt-2 bg-blue-50 p-4 rounded-md">
                  <h4 className="font-medium text-blue-800 mb-2">Suggestions from your fuel records:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-blue-800">Recent jurisdictions:</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {Array.from(new Set(fuelData.slice(0, 5).map(entry => entry.state))).map(state => (
                          <span key={state} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {state}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-blue-800">Recent vehicles:</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {Array.from(new Set(fuelData.slice(0, 5).map(entry => entry.vehicle_id))).map(vehicle => (
                          <span key={vehicle} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {vehicle}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
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