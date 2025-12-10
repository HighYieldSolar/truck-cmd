"use client";

import { useState, useEffect } from "react";
import {
  X,
  Wrench,
  Calendar,
  Truck,
  DollarSign,
  FileText,
  MapPin,
  Hash,
  AlertCircle,
  CheckCircle,
  Loader2
} from "lucide-react";
import { createMaintenanceRecord, updateMaintenanceRecord, MAINTENANCE_TYPES, MAINTENANCE_STATUSES } from "@/lib/services/maintenanceService";
import { fetchTrucks } from "@/lib/services/truckService";

export default function MaintenanceFormModal({ isOpen, onClose, record, userId, trucks = [], onSubmit }) {
  const initialFormData = {
    truck_id: "",
    maintenance_type: "Oil Change",
    description: "",
    due_date: new Date().toISOString().split('T')[0],
    completed_date: "",
    status: "Pending",
    cost: "",
    odometer_at_service: "",
    service_provider: "",
    invoice_number: ""
  };

  const [formData, setFormData] = useState(initialFormData);
  const [localTrucks, setLocalTrucks] = useState([]);
  const [errors, setErrors] = useState({});
  const [validationAttempted, setValidationAttempted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState(null);

  // Define required fields with labels
  const requiredFields = {
    truck_id: 'Vehicle',
    maintenance_type: 'Maintenance Type',
    due_date: 'Due Date'
  };

  // Use passed trucks or load them if not provided
  const availableTrucks = trucks.length > 0 ? trucks : localTrucks;

  // Load trucks for dropdown only if not passed as prop
  useEffect(() => {
    if (isOpen && userId && trucks.length === 0) {
      loadTrucks();
    }
  }, [isOpen, userId, trucks.length]);

  // Load form data when editing
  useEffect(() => {
    if (record) {
      // Check if this is a "Mark Complete" action
      const isCompleting = record._completing === true;
      const todayDate = new Date().toISOString().split('T')[0];

      setFormData({
        truck_id: record.truck_id || "",
        maintenance_type: record.maintenance_type || "Oil Change",
        description: record.description || "",
        due_date: record.due_date || "",
        // If completing, set completed_date to today if not already set
        completed_date: isCompleting ? (record.completed_date || todayDate) : (record.completed_date || ""),
        // If completing, set status to "Completed"
        status: isCompleting ? "Completed" : (record.status || "Pending"),
        cost: record.cost || "",
        odometer_at_service: record.odometer_at_service || "",
        service_provider: record.service_provider || "",
        invoice_number: record.invoice_number || ""
      });
    } else {
      setFormData(initialFormData);
    }
    setErrors({});
    setValidationAttempted(false);
    setSubmitMessage(null);
  }, [record, isOpen]);

  const loadTrucks = async () => {
    try {
      const data = await fetchTrucks(userId);
      setLocalTrucks(data);
    } catch (error) {
      // Failed to load trucks - handle silently as dropdown will be empty
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Get list of missing required fields
  const getMissingFields = () => {
    return Object.entries(requiredFields)
      .filter(([field]) => !formData[field] || !formData[field].toString().trim())
      .map(([, label]) => label);
  };

  const validateForm = () => {
    const newErrors = {};

    // Check required fields
    if (!formData.truck_id) {
      newErrors.truck_id = "Please select a vehicle";
    }
    if (!formData.maintenance_type) {
      newErrors.maintenance_type = "Please select a maintenance type";
    }
    if (!formData.due_date) {
      newErrors.due_date = "Due date is required";
    }

    // Format validations
    if (formData.cost) {
      const costNum = parseFloat(formData.cost);
      if (isNaN(costNum)) {
        newErrors.cost = "Cost must be a valid number";
      } else if (costNum < 0) {
        newErrors.cost = "Cost cannot be negative";
      } else if (costNum > 1000000) {
        newErrors.cost = "Cost value seems too high";
      }
    }
    if (formData.odometer_at_service) {
      const odometerNum = parseFloat(formData.odometer_at_service);
      if (isNaN(odometerNum)) {
        newErrors.odometer_at_service = "Odometer must be a valid number";
      } else if (odometerNum < 0) {
        newErrors.odometer_at_service = "Odometer cannot be negative";
      }
    }

    setErrors(newErrors);
    setValidationAttempted(true);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      const recordData = {
        user_id: userId,
        truck_id: formData.truck_id,
        maintenance_type: formData.maintenance_type,
        description: formData.description || null,
        due_date: formData.due_date,
        completed_date: formData.completed_date || null,
        status: formData.status,
        cost: formData.cost ? parseFloat(formData.cost) : null,
        odometer_at_service: formData.odometer_at_service ? parseFloat(formData.odometer_at_service) : null,
        service_provider: formData.service_provider || null,
        invoice_number: formData.invoice_number || null
      };

      if (record) {
        await updateMaintenanceRecord(record.id, recordData);
        setSubmitMessage({ type: "success", text: "Maintenance record updated successfully!" });
      } else {
        await createMaintenanceRecord(recordData);
        setSubmitMessage({ type: "success", text: "Maintenance record created successfully!" });
      }

      if (onSubmit) await onSubmit();

      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      setSubmitMessage({ type: "error", text: error.message || "Failed to save maintenance record" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-700 dark:to-blue-600 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mr-3">
                <Wrench size={22} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  {record?._completing ? "Complete Maintenance" : record ? "Edit Maintenance Record" : "Schedule Maintenance"}
                </h2>
                <p className="text-blue-100 text-sm">
                  {record?._completing ? "Add completion details and save" : record ? "Update the maintenance details" : "Add a new maintenance task"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              aria-label="Close"
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X size={22} className="text-white" />
            </button>
          </div>
        </div>

        {/* Messages */}
        {submitMessage && (
          <div className={`mx-6 mt-4 p-4 rounded-lg flex items-start ${
            submitMessage.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800"
              : "bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800"
          }`}>
            {submitMessage.type === "success" ? (
              <CheckCircle className="h-5 w-5 text-emerald-500 mr-3 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0" />
            )}
            <p className={`text-sm ${
              submitMessage.type === "success"
                ? "text-emerald-800 dark:text-emerald-200"
                : "text-red-800 dark:text-red-200"
            }`}>
              {submitMessage.text}
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          {/* Required Fields Legend & Validation Summary */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                <span className="text-red-500 mr-1">*</span>
                <span>Required fields</span>
              </div>
              {validationAttempted && Object.keys(errors).length > 0 && (
                <div className="flex items-center text-xs text-red-500 dark:text-red-400">
                  <AlertCircle size={12} className="mr-1" />
                  <span>{Object.keys(errors).length} field(s) need attention</span>
                </div>
              )}
            </div>

            {/* Validation Error Summary */}
            {validationAttempted && Object.keys(errors).length > 0 && (
              <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-800 dark:text-red-200">
                      Please complete the required fields:
                    </p>
                    <ul className="mt-1 text-sm text-red-700 dark:text-red-300 list-disc list-inside">
                      {Object.values(errors).map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {/* Vehicle & Type Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Truck size={14} className="inline mr-1.5" />
                  Vehicle <span className="text-red-500">*</span>
                </label>
                <select
                  name="truck_id"
                  value={formData.truck_id}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 rounded-lg border ${
                    errors.truck_id
                      ? "border-red-300 dark:border-red-600"
                      : "border-gray-300 dark:border-gray-600"
                  } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
                >
                  <option value="">Select a vehicle</option>
                  {availableTrucks.map(truck => (
                    <option key={truck.id} value={truck.id}>
                      {truck.name} - {truck.year} {truck.make} {truck.model}
                    </option>
                  ))}
                </select>
                {errors.truck_id && (
                  <p className="mt-1.5 text-sm text-red-500 dark:text-red-400">{errors.truck_id}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Wrench size={14} className="inline mr-1.5" />
                  Maintenance Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="maintenance_type"
                  value={formData.maintenance_type}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 rounded-lg border ${
                    errors.maintenance_type
                      ? "border-red-300 dark:border-red-600"
                      : "border-gray-300 dark:border-gray-600"
                  } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
                >
                  {MAINTENANCE_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                {errors.maintenance_type && (
                  <p className="mt-1.5 text-sm text-red-500 dark:text-red-400">{errors.maintenance_type}</p>
                )}
              </div>
            </div>

            {/* Dates & Status Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Calendar size={14} className="inline mr-1.5" />
                  Due Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="due_date"
                  value={formData.due_date}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 rounded-lg border ${
                    errors.due_date
                      ? "border-red-300 dark:border-red-600"
                      : "border-gray-300 dark:border-gray-600"
                  } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
                />
                {errors.due_date && (
                  <p className="mt-1.5 text-sm text-red-500 dark:text-red-400">{errors.due_date}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Calendar size={14} className="inline mr-1.5" />
                  Completed Date
                </label>
                <input
                  type="date"
                  name="completed_date"
                  value={formData.completed_date}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  {MAINTENANCE_STATUSES.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Cost & Odometer Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <DollarSign size={14} className="inline mr-1.5" />
                  Cost
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                  <input
                    type="text"
                    name="cost"
                    value={formData.cost}
                    onChange={handleChange}
                    placeholder="0.00"
                    className={`w-full pl-8 pr-4 py-2.5 rounded-lg border ${
                      errors.cost
                        ? "border-red-300 dark:border-red-600"
                        : "border-gray-300 dark:border-gray-600"
                    } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
                  />
                </div>
                {errors.cost && (
                  <p className="mt-1.5 text-sm text-red-500 dark:text-red-400">{errors.cost}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <MapPin size={14} className="inline mr-1.5" />
                  Odometer at Service
                </label>
                <input
                  type="text"
                  name="odometer_at_service"
                  value={formData.odometer_at_service}
                  onChange={handleChange}
                  placeholder="Current mileage"
                  className={`w-full px-4 py-2.5 rounded-lg border ${
                    errors.odometer_at_service
                      ? "border-red-300 dark:border-red-600"
                      : "border-gray-300 dark:border-gray-600"
                  } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
                />
                {errors.odometer_at_service && (
                  <p className="mt-1.5 text-sm text-red-500 dark:text-red-400">{errors.odometer_at_service}</p>
                )}
              </div>
            </div>

            {/* Service Provider & Invoice Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Service Provider
                </label>
                <input
                  type="text"
                  name="service_provider"
                  value={formData.service_provider}
                  onChange={handleChange}
                  placeholder="Shop or mechanic name"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Hash size={14} className="inline mr-1.5" />
                  Invoice Number
                </label>
                <input
                  type="text"
                  name="invoice_number"
                  value={formData.invoice_number}
                  onChange={handleChange}
                  placeholder="Invoice or work order #"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <FileText size={14} className="inline mr-1.5" />
                Description / Notes
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                placeholder="Additional details about this maintenance..."
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`px-5 py-2.5 rounded-lg font-medium transition-colors flex items-center disabled:opacity-60 ${
              record?._completing
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                {record?._completing && <CheckCircle size={18} className="mr-2" />}
                {record?._completing ? "Mark Complete" : record ? "Update Record" : "Create Record"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
