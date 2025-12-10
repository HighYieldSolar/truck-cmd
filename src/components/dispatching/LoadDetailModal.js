// src/components/dispatching/LoadDetailModal.js
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { updateCompletedLoadEarnings, removeCompletedLoadEarnings, assignDriver, updateLoadStatus } from "@/lib/services/loadService";
import Link from "next/link";
import { 
  X, 
  Check, 
  Edit, 
  RefreshCw, 
  Map,
  MapPin,
  Users,
  MessageSquare,
  PhoneCall,
  Navigation,
  Upload,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  ChevronRight,
  Truck as TruckIcon,
  Building2,
  DollarSign,
  UserPlus,
  Package,
  Calendar,
  Save,
  XCircle
} from "lucide-react";
import StatusBadge from "./StatusBadge";
import DocumentViewerModal from './DocumentViewerModal';
import PODUploadModal from './PODUploadModal';
import { formatDateForDisplayMMDDYYYY, getCurrentDateLocal, prepareDateForDB } from "@/lib/utils/dateUtils";

export default function LoadDetailModal({ 
  load, 
  onClose, 
  onStatusChange, 
  drivers = [], 
  trucks = [], 
  onAssignDriver, 
  onAssignTruck,
  onUpdate 
}) {
  const [selectedDriver, setSelectedDriver] = useState(load.driver_id || load.driverId || "");
  const [selectedTruck, setSelectedTruck] = useState(load.vehicle_id || load.vehicleId || load.truckId || "");
  const [editMode, setEditMode] = useState(false);
  const [updatedLoad, setUpdatedLoad] = useState({
    ...load,
    pickup_date: load.pickupDate || load.pickup_date,
    delivery_date: load.deliveryDate || load.delivery_date
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadView, setLoadView] = useState('details');
  const [availableTrucks, setAvailableTrucks] = useState([]);
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [loadingFleet, setLoadingFleet] = useState(false);
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);
  const [showPodUpload, setShowPodUpload] = useState(false);
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Load drivers and trucks on mount
  useEffect(() => {
    loadFleetData();
  }, []);

  const loadFleetData = async () => {
    try {
      setLoadingFleet(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load drivers
      const { data: driversData, error: driversError } = await supabase
        .from("drivers")
        .select("id, name, status")
        .eq("user_id", user.id)
        .eq("status", "Active")
        .order("name");

      if (!driversError && driversData) {
        setAvailableDrivers(driversData);
      }

      // Load trucks
      const { data: trucksData, error: trucksError } = await supabase
        .from("vehicles")
        .select("id, name, license_plate, status")
        .eq("user_id", user.id)
        .eq("status", "Active")
        .order("name");

      if (!trucksError && trucksData) {
        setAvailableTrucks(trucksData);
      }
    } catch (err) {
      console.error("Error loading fleet data:", err);
    } finally {
      setLoadingFleet(false);
    }
  };

  // Format dates for display (fixed timezone issue)
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return formatDateForDisplayMMDDYYYY(dateString);
  };

  // Validate edit mode form fields
  const validateEditForm = () => {
    const errors = [];

    // Customer validation
    if (!updatedLoad.customer || !updatedLoad.customer.trim()) {
      errors.push("Customer is required");
    }

    // Origin validation
    if (!updatedLoad.origin || !updatedLoad.origin.trim()) {
      errors.push("Origin is required");
    }

    // Destination validation
    if (!updatedLoad.destination || !updatedLoad.destination.trim()) {
      errors.push("Destination is required");
    }

    // Rate validation
    const rate = parseFloat(updatedLoad.rate);
    if (isNaN(rate)) {
      errors.push("Rate must be a valid number");
    } else if (rate < 0) {
      errors.push("Rate cannot be negative");
    } else if (rate > 1000000) {
      errors.push("Rate value seems too high");
    }

    // Date validation
    if (updatedLoad.pickup_date && updatedLoad.delivery_date) {
      const pickup = new Date(updatedLoad.pickup_date);
      const delivery = new Date(updatedLoad.delivery_date);
      if (delivery < pickup) {
        errors.push("Delivery date cannot be before pickup date");
      }
    }

    return errors;
  };

  const handleSave = async () => {
    setError("");

    // Validate form before submission
    const validationErrors = validateEditForm();
    if (validationErrors.length > 0) {
      setError(validationErrors.join(". "));
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Check status and rate changes
      const wasCompleted = load.status === "Completed";
      const isNowCompleted = updatedLoad.status === "Completed";
      const statusChanged = load.status !== updatedLoad.status;
      const oldRate = parseFloat(load.rate || 0);
      const newRate = parseFloat(updatedLoad.rate);
      const rateChanged = oldRate !== newRate;

      // First, update the non-status fields
      const updateData = {
        customer: updatedLoad.customer,
        origin: updatedLoad.origin,
        destination: updatedLoad.destination,
        pickup_date: updatedLoad.pickup_date,
        delivery_date: updatedLoad.delivery_date,
        rate: parseFloat(updatedLoad.rate),
        description: updatedLoad.description || "",
        updated_at: new Date().toISOString()
      };

      // If status hasn't changed, include it in the update
      if (!statusChanged) {
        updateData.status = updatedLoad.status;
      }

      const { data, error } = await supabase
        .from("loads")
        .update(updateData)
        .eq("id", load.id)
        .select()
        .single();

      if (error) throw error;

      // If status changed, use updateLoadStatus which triggers notifications
      if (statusChanged) {
        const statusUpdateResult = await updateLoadStatus(load.id, updatedLoad.status);

        if (!statusUpdateResult) {
          throw new Error("Failed to update load status");
        }

        if (wasCompleted && !isNowCompleted) {
          // Status changed from Completed to something else - remove earnings
          const earningsRemoved = await removeCompletedLoadEarnings(load.id);

          if (!earningsRemoved) {
            setError("Load updated but earnings removal failed. Please check earnings manually.");
          } else {
            setSuccess("Load status updated and earnings removed successfully");
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        } else if (!wasCompleted && isNowCompleted) {
          // Status changed to Completed - this would typically be handled by the complete load flow
          // but we'll show a message
          setSuccess("Load marked as completed. Use the complete load form to record earnings.");
        } else {
          setSuccess("Load status updated successfully");
        }
      } else if (wasCompleted && isNowCompleted && rateChanged) {
        // Status is still Completed but rate changed - update earnings
        const earningsUpdated = await updateCompletedLoadEarnings(load.id, oldRate, newRate);

        if (!earningsUpdated) {
          setError("Load updated but earnings update failed. Please check earnings manually.");
        } else {
          setSuccess("Load details and earnings updated successfully");
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } else {
        setSuccess("Load details updated successfully");
      }

      setEditMode(false);

      // Call parent update function if provided
      if (onUpdate) {
        onUpdate(data);
      }

      // Refresh the page after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 1000);

    } catch (err) {
      console.error("Error updating load:", err);
      setError(err.message || "Failed to update load");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignment = async () => {
    setError("");
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get driver and truck info
      let driverName = null;
      let truckInfo = null;

      if (selectedDriver) {
        const driver = availableDrivers.find(d => d.id === selectedDriver);
        driverName = driver ? driver.name : null;
      }

      if (selectedTruck) {
        const truck = availableTrucks.find(t => t.id === selectedTruck);
        if (truck) {
          truckInfo = `${truck.name} (${truck.license_plate})`;
        }
      }

      // Check if we're assigning a new driver (triggers notification)
      const previousDriverId = load.driver_id || load.driverId;
      const isNewDriverAssignment = selectedDriver && selectedDriver !== previousDriverId;

      // If assigning a new driver, use the loadService which creates notifications
      if (isNewDriverAssignment && driverName) {
        // Use the assignDriver service function which creates the notification
        const result = await assignDriver(load.id, driverName);

        if (!result) {
          throw new Error("Failed to assign driver");
        }

        // Also update driver_id and truck info separately
        const { error: updateError } = await supabase
          .from("loads")
          .update({
            driver_id: selectedDriver,
            vehicle_id: selectedTruck || null,
            truck_info: truckInfo,
            updated_at: new Date().toISOString()
          })
          .eq("id", load.id);

        if (updateError) throw updateError;

      } else {
        // No new driver assignment, just update fields directly
        const updateData = {
          driver_id: selectedDriver || null,
          driver: driverName,
          vehicle_id: selectedTruck || null,
          truck_info: truckInfo,
          status: selectedDriver ? "Assigned" : load.status,
          updated_at: new Date().toISOString()
        };

        const { error } = await supabase
          .from("loads")
          .update(updateData)
          .eq("id", load.id);

        if (error) throw error;
      }

      // Get the updated load data
      const { data: updatedData } = await supabase
        .from("loads")
        .select()
        .eq("id", load.id)
        .single();

      setSuccess("Assignment updated successfully");
      setShowAssignmentForm(false);

      // Update local state
      setUpdatedLoad(prev => ({
        ...prev,
        driver_id: selectedDriver || null,
        driver: driverName,
        vehicle_id: selectedTruck || null,
        truck_info: truckInfo,
        status: selectedDriver ? "Assigned" : load.status
      }));

      // Call parent callbacks if provided
      if (onAssignDriver && selectedDriver) {
        onAssignDriver(load.id, selectedDriver);
      }
      if (onAssignTruck && selectedTruck) {
        onAssignTruck(load.id, selectedTruck);
      }
      if (onUpdate && updatedData) {
        onUpdate(updatedData);
      }

      // Refresh after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 1000);

    } catch (err) {
      console.error("Error updating assignment:", err);
      setError(err.message || "Failed to update assignment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderDetailsView = () => (
    <div className="p-6 bg-gray-50 dark:bg-gray-900">
      {/* Success/Error Messages */}
      {success && (
        <div className="mb-4 bg-green-50 dark:bg-green-900/30 border-l-4 border-green-400 dark:border-green-500 p-4 rounded-md flex items-start">
          <CheckCircle className="h-5 w-5 text-green-400 dark:text-green-500 mt-0.5 mr-2 flex-shrink-0" />
          <p className="text-sm text-green-700 dark:text-green-300">{success}</p>
        </div>
      )}

      {error && (
        <div className="mb-4 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-400 dark:border-red-500 p-4 rounded-md flex items-start">
          <AlertCircle className="h-5 w-5 text-red-400 dark:text-red-500 mt-0.5 mr-2 flex-shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Load Information Card */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Load Information</h3>
              {!editMode && (
                <button
                  onClick={() => setEditMode(true)}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                >
                  <Edit size={16} className="inline mr-1" />
                  Edit
                </button>
              )}
            </div>
            
            {editMode ? (
              <div className="space-y-4">
                {load.status === "Completed" && (
                  <div className="space-y-3 mb-4">
                    <div className="bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-400 dark:border-yellow-500 p-4 rounded-md">
                      <div className="flex">
                        <AlertCircle className="h-5 w-5 text-yellow-400 dark:text-yellow-500 mr-2 flex-shrink-0" />
                        <div className="text-sm text-yellow-700 dark:text-yellow-300">
                          <p className="font-medium">Editing Completed Load</p>
                          <p>Changes to the rate will automatically update earnings records.</p>
                        </div>
                      </div>
                    </div>
                    {updatedLoad.status !== "Completed" && (
                      <div className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-400 dark:border-red-500 p-4 rounded-md">
                        <div className="flex">
                          <AlertCircle className="h-5 w-5 text-red-400 dark:text-red-500 mr-2 flex-shrink-0" />
                          <div className="text-sm text-red-700 dark:text-red-300">
                            <p className="font-medium">Warning: Status Change</p>
                            <p>Changing status from "Completed" to "{updatedLoad.status}" will remove the earnings record for this load.</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                  <select
                    value={updatedLoad.status}
                    onChange={(e) => setUpdatedLoad({...updatedLoad, status: e.target.value})}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Assigned">Assigned</option>
                    <option value="In Transit">In Transit</option>
                    <option value="Loading">Loading</option>
                    <option value="Unloading">Unloading</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="Delayed">Delayed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Customer</label>
                  <input
                    type="text"
                    value={updatedLoad.customer}
                    onChange={(e) => setUpdatedLoad({...updatedLoad, customer: e.target.value})}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pickup Date</label>
                    <input
                      type="date"
                      value={updatedLoad.pickup_date}
                      onChange={(e) => setUpdatedLoad({...updatedLoad, pickup_date: e.target.value})}
                      className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Delivery Date</label>
                    <input
                      type="date"
                      value={updatedLoad.delivery_date}
                      onChange={(e) => setUpdatedLoad({...updatedLoad, delivery_date: e.target.value})}
                      className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Origin</label>
                  <input
                    type="text"
                    value={updatedLoad.origin}
                    onChange={(e) => setUpdatedLoad({...updatedLoad, origin: e.target.value})}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Destination</label>
                  <input
                    type="text"
                    value={updatedLoad.destination}
                    onChange={(e) => setUpdatedLoad({...updatedLoad, destination: e.target.value})}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rate ($)</label>
                  <input
                    type="number"
                    value={updatedLoad.rate}
                    onChange={(e) => setUpdatedLoad({...updatedLoad, rate: parseFloat(e.target.value)})}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => {
                      setEditMode(false);
                      setUpdatedLoad({...load});
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-blue-500 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw size={16} className="inline mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={16} className="inline mr-2" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Load Number</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{load.load_number || load.loadNumber}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Customer</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{load.customer}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Rate</span>
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">${load.rate?.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Status</span>
                  <StatusBadge status={load.status} />
                </div>
              </div>
            )}
          </div>

          {/* Assignment Card */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Assignment</h3>
              {!showAssignmentForm && (
                <button
                  onClick={() => setShowAssignmentForm(true)}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                >
                  <UserPlus size={16} className="inline mr-1" />
                  {(load.driver_id || load.driverId) ? 'Change' : 'Assign'}
                </button>
              )}
            </div>

            {showAssignmentForm ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Driver</label>
                  <select
                    value={selectedDriver}
                    onChange={(e) => setSelectedDriver(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    disabled={loadingFleet}
                  >
                    <option value="">No driver assigned</option>
                    {availableDrivers.map((driver) => (
                      <option key={driver.id} value={driver.id}>
                        {driver.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Truck</label>
                  <select
                    value={selectedTruck}
                    onChange={(e) => setSelectedTruck(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    disabled={loadingFleet}
                  >
                    <option value="">No truck assigned</option>
                    {availableTrucks.map((truck) => (
                      <option key={truck.id} value={truck.id}>
                        {truck.name} ({truck.license_plate})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => {
                      setShowAssignmentForm(false);
                      setSelectedDriver(load.driver_id || load.driverId || "");
                      setSelectedTruck(load.vehicle_id || load.vehicleId || load.truckId || "");
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAssignment}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-blue-500 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50"
                    disabled={isSubmitting || loadingFleet}
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw size={16} className="inline mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Check size={16} className="inline mr-2" />
                        Update Assignment
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center">
                  <Users size={16} className="text-gray-400 dark:text-gray-500 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Driver</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{load.driver || "Not assigned"}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <TruckIcon size={16} className="text-gray-400 dark:text-gray-500 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Truck</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{load.truck_info || load.truckInfo || "Not assigned"}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Route Information Card */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Route Details</h3>

            <div className="space-y-4">
              <div className="flex items-start">
                <MapPin size={20} className="text-green-500 dark:text-green-400 mr-3 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Pickup</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{load.origin}</p>
                  <div className="flex items-center mt-1">
                    <Calendar size={14} className="text-gray-400 dark:text-gray-500 mr-1" />
                    <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(load.pickup_date || load.pickupDate)}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center">
                <div className="w-0.5 h-8 bg-gray-300 dark:bg-gray-600 ml-2.5"></div>
              </div>

              <div className="flex items-start">
                <MapPin size={20} className="text-red-500 dark:text-red-400 mr-3 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Delivery</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{load.destination}</p>
                  <div className="flex items-center mt-1">
                    <Calendar size={14} className="text-gray-400 dark:text-gray-500 mr-1" />
                    <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(load.delivery_date || load.deliveryDate)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Map Placeholder */}
            <div className="mt-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 h-48 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center">
              <div className="text-center">
                <Map size={40} className="text-blue-500 dark:text-blue-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">Route Map</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Interactive map coming soon</p>
              </div>
            </div>
          </div>

          {/* Notes Section */}
          {load.description && (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Notes</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{load.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderActionsView = () => (
    <div className="p-6 bg-gray-50 dark:bg-gray-900">
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-6">Quick Actions</h3>

      {/* Primary Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {/* Assign Resources */}
        {!(load.driver_id || load.driverId) && (
          <button
            onClick={() => {
              setLoadView('details');
              setShowAssignmentForm(true);
            }}
            className="flex items-center justify-center px-6 py-4 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
          >
            <UserPlus size={20} className="mr-2" />
            Assign Driver & Truck
          </button>
        )}

        {/* Update Status / Edit Details */}
        <button
          onClick={() => {
            setLoadView('details');
            setEditMode(true);
          }}
          className="flex items-center justify-center px-6 py-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          <RefreshCw size={20} className="mr-2" />
          {load.status === "Completed" ? "Edit Details" : "Update Status"}
        </button>

        {/* Complete Load */}
        <Link
          href={`/dashboard/dispatching/complete/${load.id}`}
          className={`flex items-center justify-center px-6 py-4 rounded-lg font-medium transition-colors ${
            load.status === "Completed" || load.status === "Cancelled"
              ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              : 'bg-green-600 dark:bg-green-500 text-white hover:bg-green-700 dark:hover:bg-green-600'
          }`}
          onClick={(e) => {
            if (load.status === "Completed" || load.status === "Cancelled") {
              e.preventDefault();
            } else {
              onClose();
            }
          }}
        >
          <CheckCircle size={20} className="mr-2" />
          {load.status === "Completed"
            ? "Already Completed"
            : load.status === "Cancelled"
              ? "Load Cancelled"
              : "Mark as Complete"
          }
        </Link>
      </div>

      {/* Communication Actions */}
      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Communication</h4>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
        <ActionButton
          icon={<MessageSquare size={20} />}
          title="Message Driver"
          description="Send notification"
          color="blue"
          disabled={!(load.driver_id || load.driverId)}
        />
        <ActionButton
          icon={<PhoneCall size={20} />}
          title="Call Driver"
          description="Make phone call"
          color="blue"
          disabled={!(load.driver_id || load.driverId)}
        />
        <ActionButton
          icon={<Navigation size={20} />}
          title="Get Directions"
          description="Open in Maps"
          color="blue"
        />
      </div>

      {/* Document Actions */}
      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Documents</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <ActionButton
          icon={<Upload size={20} />}
          title="Upload POD"
          description="Add proof of delivery"
          color="blue"
          onClick={() => setShowPodUpload(true)}
        />
        <ActionButton
          icon={<FileText size={20} />}
          title="View Documents"
          description="See all files"
          color="blue"
          onClick={() => setShowDocumentViewer(true)}
        />
      </div>

      {/* Status Note */}
      {(load.status === "Completed" || load.status === "Cancelled") && (
        <div className="mt-6 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <AlertCircle size={16} className="inline mr-2" />
            Some actions are unavailable for {load.status.toLowerCase()} loads.
          </p>
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 dark:bg-black/70 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800 z-10 rounded-t-xl">
          <div className="flex items-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Load #{load.load_number || load.loadNumber}
            </h2>
            <StatusBadge status={editMode ? updatedLoad.status : load.status} className="ml-3" />
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/40 rounded-lg transition-colors"
            disabled={isSubmitting}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex space-x-8">
            <TabButton
              label="Details"
              isActive={loadView === 'details'}
              onClick={() => setLoadView('details')}
            />
            <TabButton
              label="Quick Actions"
              isActive={loadView === 'actions'}
              onClick={() => setLoadView('actions')}
            />
          </div>
        </div>
        
        {/* Content */}
        {loadView === 'details' && renderDetailsView()}
        {loadView === 'actions' && renderActionsView()}
      </div>

      {showDocumentViewer && (
        <DocumentViewerModal loadId={load.id} onClose={() => setShowDocumentViewer(false)} />
      )}

      {showPodUpload && (
        <PODUploadModal
          loadId={load.id}
          loadNumber={load.load_number || load.loadNumber}
          onClose={() => setShowPodUpload(false)}
          onSuccess={() => {
            setSuccess("Documents uploaded successfully");
            // Refresh the page after a delay
            setTimeout(() => {
              window.location.reload();
            }, 1500);
          }}
        />
      )}
    </div>
  );
}

// Helper Components
function TabButton({ label, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`pb-4 relative ${isActive
        ? 'text-blue-600 dark:text-blue-400 font-medium'
        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
    >
      {label}
      {isActive && (
        <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full"></span>
      )}
    </button>
  );
}

function ActionButton({ icon, title, description, color = 'blue', onClick, disabled = false }) {
  const colorClasses = disabled
    ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
    : color === 'red'
      ? 'hover:bg-red-50 dark:hover:bg-red-900/30 hover:border-red-200 dark:hover:border-red-700 text-red-600 dark:text-red-400 cursor-pointer'
      : 'hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-200 dark:hover:border-blue-700 text-blue-600 dark:text-blue-400 cursor-pointer';

  return (
    <button
      className={`flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors ${colorClasses}`}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
    >
      <div className="mb-2">{icon}</div>
      <span className={`text-sm font-medium ${disabled ? 'text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-gray-100'}`}>
        {title}
      </span>
      <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">{description}</span>
    </button>
  );
}