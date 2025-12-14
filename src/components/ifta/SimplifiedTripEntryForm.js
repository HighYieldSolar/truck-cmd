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
  Info,
  Fuel
} from "lucide-react";
import { getCurrentDateLocal, prepareDateForDB } from "@/lib/utils/dateUtils";

export default function SimplifiedTripEntryForm({ onAddTrip, isLoading = false, vehicles = [] }) {
  const [formData, setFormData] = useState({
    vehicleId: "",
    date: getCurrentDateLocal(),
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
    { code: "WY", name: "Wyoming" }
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
      const success = await onAddTrip({
        ...formData,
        date: prepareDateForDB(formData.date)
      });

      if (success) {
        // Reset form but keep vehicle selection for convenience
        const currentVehicle = formData.vehicleId;
        setFormData({
          vehicleId: currentVehicle,
          date: getCurrentDateLocal(),
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
      setErrors(prev => ({ ...prev, submit: error.message || 'Failed to add trip' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <p className="text-sm text-blue-800 flex items-center">
          <Info size={16} className="mr-2 flex-shrink-0" />
          Enter trip details manually. For bulk imports, use the "Import from Mileage Tracker" option above.
        </p>
      </div>
      {/* Success message */}
      {successMessage && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-md flex items-start">
          <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 mr-2 flex-shrink-0" />
          <p className="text-sm text-green-700">{successMessage}</p>
        </div>
      )}

      {/* Form Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Vehicle Selection */}
        <div className="lg:col-span-1">
          <label htmlFor="vehicleId" className="block text-sm font-medium text-gray-700 mb-1">
            Vehicle <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Truck className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            {vehicles.length > 0 ? (
              <select
                id="vehicleId"
                name="vehicleId"
                value={formData.vehicleId}
                onChange={handleChange}
                className={`block w-full pl-10 pr-3 py-2.5 rounded-lg border ${errors.vehicleId ? 'border-red-300' : 'border-gray-300'
                  } focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm`}
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
                className={`block w-full pl-10 pr-3 py-2.5 rounded-lg border ${errors.vehicleId ? 'border-red-300' : 'border-gray-300'
                  } focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm`}
                required
              />
            )}
          </div>
          {errors.vehicleId && (
            <p className="mt-1 text-xs text-red-600">{errors.vehicleId}</p>
          )}
        </div>

        {/* Date */}
        <div className="lg:col-span-1">
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
            Trip Date <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className={`block w-full pl-10 pr-3 py-2.5 rounded-lg border ${errors.date ? 'border-red-300' : 'border-gray-300'
                } focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm`}
              required
            />
          </div>
          {errors.date && (
            <p className="mt-1 text-xs text-red-600">{errors.date}</p>
          )}
        </div>

        {/* Start Jurisdiction */}
        <div className="lg:col-span-1">
          <label htmlFor="startJurisdiction" className="block text-sm font-medium text-gray-700 mb-1">
            From <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <select
              id="startJurisdiction"
              name="startJurisdiction"
              value={formData.startJurisdiction}
              onChange={handleChange}
              className={`block w-full pl-10 pr-3 py-2.5 rounded-lg border ${errors.startJurisdiction ? 'border-red-300' : 'border-gray-300'
                } focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm`}
              required
            >
              <option value="">Starting State</option>
              {jurisdictions.map((state) => (
                <option key={state.code} value={state.code}>
                  {state.code} - {state.name}
                </option>
              ))}
            </select>
          </div>
          {errors.startJurisdiction && (
            <p className="mt-1 text-xs text-red-600">{errors.startJurisdiction}</p>
          )}
        </div>

        {/* End Jurisdiction */}
        <div className="lg:col-span-1">
          <label htmlFor="endJurisdiction" className="block text-sm font-medium text-gray-700 mb-1">
            To <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <select
              id="endJurisdiction"
              name="endJurisdiction"
              value={formData.endJurisdiction}
              onChange={handleChange}
              className={`block w-full pl-10 pr-3 py-2.5 rounded-lg border ${errors.endJurisdiction ? 'border-red-300' : 'border-gray-300'
                } focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm`}
              required
            >
              <option value="">Ending State</option>
              {jurisdictions.map((state) => (
                <option key={state.code} value={state.code}>
                  {state.code} - {state.name}
                </option>
              ))}
            </select>
          </div>
          {errors.endJurisdiction && (
            <p className="mt-1 text-xs text-red-600">{errors.endJurisdiction}</p>
          )}
        </div>
      </div>

      {/* Second Row - Trip Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Miles */}
        <div>
          <label htmlFor="miles" className="block text-sm font-medium text-gray-700 mb-1">
            Miles <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Route className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="number"
              id="miles"
              name="miles"
              placeholder="0"
              min="0"
              step="0.1"
              value={formData.miles}
              onChange={handleChange}
              className={`block w-full pl-10 pr-3 py-2.5 rounded-lg border ${errors.miles ? 'border-red-300' : 'border-gray-300'
                } focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm`}
              required
            />
          </div>
          {errors.miles && (
            <p className="mt-1 text-xs text-red-600">{errors.miles}</p>
          )}
        </div>

        {/* Gallons */}
        <div>
          <label htmlFor="gallons" className="block text-sm font-medium text-gray-700 mb-1">
            Gallons <span className="text-gray-400 text-xs">(optional)</span>
          </label>
          <div className="relative">
            <Fuel className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="number"
              id="gallons"
              name="gallons"
              placeholder="0"
              min="0"
              step="0.01"
              value={formData.gallons}
              onChange={handleChange}
              className="block w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
        </div>

        {/* Notes */}
        <div className="md:col-span-2">
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
            Notes <span className="text-gray-400 text-xs">(optional)</span>
          </label>
          <textarea
            id="notes"
            name="notes"
            rows="1"
            placeholder="Any additional trip details..."
            value={formData.notes}
            onChange={handleChange}
            className="block w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
          ></textarea>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting || isLoading}
          className="px-6 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center transition-colors duration-200"
        >
          {isSubmitting ? (
            <>
              <RefreshCw size={16} className="animate-spin mr-2" />
              Adding Trip...
            </>
          ) : (
            <>
              <Plus size={16} className="mr-2" />
              Add Trip Record
            </>
          )}
        </button>
      </div>
    </form>
  );
}