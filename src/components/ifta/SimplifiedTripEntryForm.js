// src/components/ifta/SimplifiedTripEntryForm.js
import { useState } from "react";
import { 
  Plus, 
  Truck, 
  Calendar, 
  MapPin, 
  Fuel, 
  DollarSign, 
  AlertTriangle,
  RefreshCw,
  Info,
  ChevronDown
} from "lucide-react";

// Helper function to get US states and Canadian provinces
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

export default function SimplifiedTripEntryForm({ onAddTrip, isLoading = false, vehicles = [] }) {
  const [tripForm, setTripForm] = useState({
    vehicleId: "",
    date: new Date().toISOString().split('T')[0],
    startJurisdiction: "",
    endJurisdiction: "",
    miles: "",
    gallons: "",
    fuelCost: "",
    notes: ""
  });
  
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showTips, setShowTips] = useState(false);
  const [formExpanded, setFormExpanded] = useState(true);

  // Define the toggle function after the state declaration
  const toggleFormExpanded = () => {
    setFormExpanded(!formExpanded);
  };

  // Get all states for dropdowns
  const jurisdictions = getJurisdictions();

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
        if (!value || parseFloat(value) <= 0) {
          error = 'Enter a valid number greater than 0';
        }
        break;
      case 'gallons':
        if (parseFloat(value) < 0) {
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

  // Validate the entire form
  const validateForm = () => {
    const newErrors = {};
    let isValid = true;
    
    // Validate required fields
    const requiredFields = ['date', 'vehicleId', 'startJurisdiction', 'endJurisdiction', 'miles'];
    
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
    
    // Clear any errors on change
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
    
    // For efficiency, auto-copy same state if both are empty
    if (name === 'startJurisdiction' && !tripForm.endJurisdiction) {
      setTripForm(prev => ({
        ...prev,
        [name]: value,
        endJurisdiction: value
      }));
    }
    
    // If miles is entered and there's no gallons, suggest based on 6.5 MPG
    if (name === 'miles' && !tripForm.gallons && value) {
      const miles = parseFloat(value);
      if (!isNaN(miles) && miles > 0) {
        const suggestedGallons = (miles / 6.5).toFixed(3);
        setTripForm(prev => ({
          ...prev,
          [name]: value,
          gallons: suggestedGallons
        }));
      }
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
      fuelCost: parseFloat(tripForm.fuelCost) || 0
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
      gallons: "",
      fuelCost: "",
      notes: ""
    });
    
    // Reset validation states
    setErrors({});
    setTouched({});
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-blue-50 to-white">
        <div className="flex items-center">
          <Plus size={20} className="text-blue-600 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Add Trip for IFTA</h3>
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
          
          <button
            type="button"
            onClick={toggleFormExpanded}
            className="text-sm text-gray-600 hover:text-gray-800 flex items-center"
          >
            <ChevronDown 
              size={16} 
              className={`transform transition-transform ${formExpanded ? 'rotate-180' : ''}`}
            />
          </button>
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
                <li>Record each interstate trip, including deadhead miles</li>
                <li>Enter miles first - gallons will be auto-suggested at 6.5 MPG</li>
                <li>If your trip didn&apos;t change states, use the same state for both start and end</li>
                <li>For better accuracy, use the State Mileage Tracker for exact state crossings</li>
              </ul>
            </div>
          </div>
        </div>
      )}
      
      {formExpanded && (
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Trip basics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="vehicleId" className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Truck size={16} className="text-gray-400 mr-1" /> Vehicle *
                </label>
                {vehicles.length > 0 ? (
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
                    {vehicles.map((vehicle) => (
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
                    <AlertTriangle size={12} className="mr-1" />
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
                    <AlertTriangle size={12} className="mr-1" />
                    {errors.date}
                  </p>
                )}
              </div>
              
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
                    <AlertTriangle size={12} className="mr-1" />
                    {errors.miles}
                  </p>
                )}
              </div>
            </div>
            
            {/* Jurisdictions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="startJurisdiction" className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <MapPin size={16} className="text-gray-400 mr-1" /> Starting State *
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
                  {jurisdictions.map((state) => (
                    <option key={`start-${state.code}`} value={state.code}>{state.name} ({state.code})</option>
                  ))}
                </select>
                {errors.startJurisdiction && touched.startJurisdiction && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertTriangle size={12} className="mr-1" />
                    {errors.startJurisdiction}
                  </p>
                )}
              </div>
              
              <div>
                <label htmlFor="endJurisdiction" className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <MapPin size={16} className="text-gray-400 mr-1" /> Ending State *
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
                  {jurisdictions.map((state) => (
                    <option key={`end-${state.code}`} value={state.code}>{state.name} ({state.code})</option>
                  ))}
                </select>
                {errors.endJurisdiction && touched.endJurisdiction && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertTriangle size={12} className="mr-1" />
                    {errors.endJurisdiction}
                  </p>
                )}
              </div>
            </div>
            
            {/* Fuel information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    <AlertTriangle size={12} className="mr-1" />
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
                    <AlertTriangle size={12} className="mr-1" />
                    {errors.fuelCost}
                  </p>
                )}
              </div>
            </div>
            
            {/* Notes */}
            <div>
              <label htmlFor="notes" className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                Notes (Optional)
              </label>
              <textarea
                id="notes"
                name="notes"
                rows="2"
                placeholder="Any additional notes about this trip"
                value={tripForm.notes}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500 shadow-sm text-sm"
              ></textarea>
            </div>
            
            {/* Submit button */}
            <div className="pt-4 flex justify-end">
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
      )}
    </div>
  );
}