// src/components/ifta/SimplifiedTripEntryForm.js
"use client";

import { useState } from "react";
import {
  Plus,
  Truck,
  Calendar,
  MapPin,
  AlertCircle,
  RefreshCw,
  CheckCircle,
  Route,
  ChevronDown,
  ChevronRight
} from "lucide-react";

export default function SimplifiedTripEntryForm({ onAddTrip, isLoading = false, vehicles = [] }) {
  const [formData, setFormData] = useState({
    vehicleId: "",
    date: new Date().toISOString().split('T')[0],
    startJurisdiction: "",
    endJurisdiction: "",
    miles: "",
    gallons: "",
    fuelCost: "",
    driverId: "",
    notes: ""
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Get jurisdictions list
  const jurisdictions = [
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.vehicleId) newErrors.vehicleId = "Vehicle is required";
    if (!formData.date) newErrors.date = "Date is required";
    if (!formData.startJurisdiction) newErrors.startJurisdiction = "Starting jurisdiction is required";
    if (!formData.endJurisdiction) newErrors.endJurisdiction = "Ending jurisdiction is required";
    if (!formData.miles || parseFloat(formData.miles) <= 0) {
      newErrors.miles = "Miles must be greater than 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      const success = await onAddTrip(formData);

      if (success) {
        // Reset form
        setFormData({
          vehicleId: "",
          date: new Date().toISOString().split('T')[0],
          startJurisdiction: "",
          endJurisdiction: "",
          miles: "",
          gallons: "",
          fuelCost: "",
          driverId: "",
          notes: ""
        });

        // Show success message
        setSuccessMessage("Trip added successfully!");
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (error) {
      console.error("Error adding trip:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-4 text-white">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold flex items-center">
            <Plus size={18} className="mr-2" />
            Add New Trip
          </h3>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-white hover:text-blue-100 flex items-center text-sm"
          >
            {isExpanded ? (
              <>
                <ChevronDown size={16} className="mr-1" />
                Hide
              </>
            ) : (
              <>
                <ChevronRight size={16} className="mr-1" />
                Show
              </>
            )}
          </button>
        </div>
      </div>

      {isExpanded && (
        <form onSubmit={handleSubmit} className="p-6">
          {/* Success message */}
          {successMessage && (
            <div className="mb-6 bg-green-50 border-l-4 border-green-400 p-4 rounded-md flex items-start">
              <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 mr-2 flex-shrink-0" />
              <p className="text-sm text-green-700">{successMessage}</p>
            </div>
          )}

          {/* Basic Information Section */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900 flex items-center border-b border-gray-200 pb-2">
              <Route size={16} className="mr-2 text-blue-500" />
              Trip Information
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="vehicleId" className="block text-sm font-medium text-gray-700 mb-1">
                  Vehicle <span className="text-red-500">*</span>
                </label>
                {vehicles.length > 0 ? (
                  <select
                    id="vehicleId"
                    name="vehicleId"
                    value={formData.vehicleId}
                    onChange={handleChange}
                    className={`block w-full rounded-lg border ${errors.vehicleId ? 'border-red-300' : 'border-gray-300'
                      } px-3 py-2 text-sm`}
                    required
                  >
                    <option value="">Select Vehicle</option>
                    {vehicles.map((vehicle) => (
                      <option key={vehicle.id || vehicle} value={vehicle.id || vehicle}>
                        {vehicle.name || vehicle.id || vehicle}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    id="vehicleId"
                    name="vehicleId"
                    placeholder="Enter vehicle ID"
                    value={formData.vehicleId}
                    onChange={handleChange}
                    className={`block w-full rounded-lg border ${errors.vehicleId ? 'border-red-300' : 'border-gray-300'
                      } px-3 py-2 text-sm`}
                    required
                  />
                )}
                {errors.vehicleId && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle size={12} className="mr-1" />
                    {errors.vehicleId}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                  Trip Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className={`block w-full rounded-lg border ${errors.date ? 'border-red-300' : 'border-gray-300'
                    } px-3 py-2 text-sm`}
                  required
                />
                {errors.date && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle size={12} className="mr-1" />
                    {errors.date}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="driverId" className="block text-sm font-medium text-gray-700 mb-1">
                  Driver ID
                </label>
                <input
                  type="text"
                  id="driverId"
                  name="driverId"
                  placeholder="Enter driver ID (optional)"
                  value={formData.driverId}
                  onChange={handleChange}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Route Information Section */}
          <div className="space-y-4 mt-6">
            <h4 className="text-md font-medium text-gray-900 flex items-center border-b border-gray-200 pb-2">
              <MapPin size={16} className="mr-2 text-green-500" />
              Route Details
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="startJurisdiction" className="block text-sm font-medium text-gray-700 mb-1">
                  Starting Jurisdiction <span className="text-red-500">*</span>
                </label>
                <select
                  id="startJurisdiction"
                  name="startJurisdiction"
                  value={formData.startJurisdiction}
                  onChange={handleChange}
                  className={`block w-full rounded-lg border ${errors.startJurisdiction ? 'border-red-300' : 'border-gray-300'
                    } px-3 py-2 text-sm`}
                  required
                >
                  <option value="">Select Starting State</option>
                  {jurisdictions.map((state) => (
                    <option key={state.code} value={state.code}>
                      {state.name} ({state.code})
                    </option>
                  ))}
                </select>
                {errors.startJurisdiction && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle size={12} className="mr-1" />
                    {errors.startJurisdiction}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="endJurisdiction" className="block text-sm font-medium text-gray-700 mb-1">
                  Ending Jurisdiction <span className="text-red-500">*</span>
                </label>
                <select
                  id="endJurisdiction"
                  name="endJurisdiction"
                  value={formData.endJurisdiction}
                  onChange={handleChange}
                  className={`block w-full rounded-lg border ${errors.endJurisdiction ? 'border-red-300' : 'border-gray-300'
                    } px-3 py-2 text-sm`}
                  required
                >
                  <option value="">Select Ending State</option>
                  {jurisdictions.map((state) => (
                    <option key={state.code} value={state.code}>
                      {state.name} ({state.code})
                    </option>
                  ))}
                </select>
                {errors.endJurisdiction && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle size={12} className="mr-1" />
                    {errors.endJurisdiction}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Trip Metrics Section */}
          <div className="space-y-4 mt-6">
            <h4 className="text-md font-medium text-gray-900 flex items-center border-b border-gray-200 pb-2">
              <Truck size={16} className="mr-2 text-orange-500" />
              Trip Metrics
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="miles" className="block text-sm font-medium text-gray-700 mb-1">
                  Miles Driven <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="miles"
                  name="miles"
                  placeholder="0.0"
                  min="0"
                  step="0.1"
                  value={formData.miles}
                  onChange={handleChange}
                  className={`block w-full rounded-lg border ${errors.miles ? 'border-red-300' : 'border-gray-300'
                    } px-3 py-2 text-sm`}
                  required
                />
                {errors.miles && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle size={12} className="mr-1" />
                    {errors.miles}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="gallons" className="block text-sm font-medium text-gray-700 mb-1">
                  Gallons Used
                </label>
                <input
                  type="number"
                  id="gallons"
                  name="gallons"
                  placeholder="0.0"
                  min="0"
                  step="0.1"
                  value={formData.gallons}
                  onChange={handleChange}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label htmlFor="fuelCost" className="block text-sm font-medium text-gray-700 mb-1">
                  Fuel Cost ($)
                </label>
                <input
                  type="number"
                  id="fuelCost"
                  name="fuelCost"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  value={formData.fuelCost}
                  onChange={handleChange}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Notes Section */}
          <div className="mt-6">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              rows="2"
              placeholder="Add any additional trip notes..."
              value={formData.notes}
              onChange={handleChange}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            ></textarea>
          </div>

          {/* Form actions */}
          <div className="mt-6 border-t border-gray-200 pt-4 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none flex items-center"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw size={16} className="animate-spin mr-2" />
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
      )}
    </div>
  );
}