// src/components/dispatching/LoadDetailModal.js
"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
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
  ChevronRight
} from "lucide-react";
import StatusBadge from "./StatusBadge";

export default function LoadDetailModal({ load, onClose, onStatusChange, drivers, onAssignDriver }) {
  const [selectedDriver, setSelectedDriver] = useState(load.driver || "");
  const [editMode, setEditMode] = useState(false);
  const [updatedLoad, setUpdatedLoad] = useState({...load});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadView, setLoadView] = useState('details'); // details, timeline, actions

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      // Format data for the database
      const dbData = {
        status: updatedLoad.status,
        customer: updatedLoad.customer,
        pickup_date: updatedLoad.pickupDate,
        delivery_date: updatedLoad.deliveryDate,
        origin: updatedLoad.origin,
        destination: updatedLoad.destination,
        rate: updatedLoad.rate
      };
      
      const { data, error } = await supabase
        .from('loads')
        .update(dbData)
        .eq('id', updatedLoad.id);
        
      if (error) throw error;
      
      // Update the local state
      onStatusChange(updatedLoad);
      setEditMode(false);
    } catch (error) {
      console.error("Error updating load:", error);
      alert("Failed to update load. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDriverAssign = async () => {
    setIsSubmitting(true);
    try {
      // Update the driver in the database
      const { data, error } = await supabase
        .from('loads')
        .update({
          driver: selectedDriver,
          status: load.status === "Pending" ? "Assigned" : load.status
        })
        .eq('id', load.id);
        
      if (error) throw error;
      
      // Update the local state
      onAssignDriver(load.id, selectedDriver);
      onClose();
    } catch (error) {
      console.error("Error assigning driver:", error);
      alert("Failed to assign driver. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format dates for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // Different tab views
  const renderDetailsView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Left Column */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Load Information</h3>
        
        {editMode ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={updatedLoad.status}
                onChange={(e) => setUpdatedLoad({...updatedLoad, status: e.target.value})}
                className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
              <input
                type="text"
                value={updatedLoad.customer}
                onChange={(e) => setUpdatedLoad({...updatedLoad, customer: e.target.value})}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Date</label>
                <input
                  type="date"
                  value={updatedLoad.pickupDate}
                  onChange={(e) => setUpdatedLoad({...updatedLoad, pickupDate: e.target.value})}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Date</label>
                <input
                  type="date"
                  value={updatedLoad.deliveryDate}
                  onChange={(e) => setUpdatedLoad({...updatedLoad, deliveryDate: e.target.value})}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Origin</label>
              <input
                type="text"
                value={updatedLoad.origin}
                onChange={(e) => setUpdatedLoad({...updatedLoad, origin: e.target.value})}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
              <input
                type="text"
                value={updatedLoad.destination}
                onChange={(e) => setUpdatedLoad({...updatedLoad, destination: e.target.value})}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rate ($)</label>
              <input
                type="number"
                value={updatedLoad.rate}
                onChange={(e) => setUpdatedLoad({...updatedLoad, rate: parseFloat(e.target.value)})}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Customer</p>
                <p className="text-base text-gray-900">{load.customer}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Rate</p>
                <p className="text-base text-gray-900">${load.rate.toLocaleString()}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Pickup Date</p>
                <p className="text-base text-gray-900">{formatDate(load.pickupDate)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Delivery Date</p>
                <p className="text-base text-gray-900">{formatDate(load.deliveryDate)}</p>
              </div>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-500">Origin</p>
              <div className="flex items-center">
                <MapPin size={16} className="text-gray-400 mr-2" />
                <p className="text-base text-gray-900">{load.origin}</p>
              </div>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-500">Destination</p>
              <div className="flex items-center">
                <MapPin size={16} className="text-gray-400 mr-2" />
                <p className="text-base text-gray-900">{load.destination}</p>
              </div>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-500">Distance</p>
              <p className="text-base text-gray-900">{load.distance} miles</p>
            </div>
          </div>
        )}
        
        {/* Driver Assignment Section */}
        <div className="mt-6 border-t border-gray-200 pt-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Driver Assignment</h3>
          <div className="flex items-center space-x-4">
            <select
              value={selectedDriver}
              onChange={(e) => setSelectedDriver(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
              disabled={load.status === "Completed" || load.status === "Cancelled" || isSubmitting}
            >
              <option value="">Select Driver</option>
              {drivers.map(driver => (
                <option key={driver.id} value={driver.name}>{driver.name}</option>
              ))}
            </select>
            <button
              onClick={handleDriverAssign}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm disabled:bg-blue-300 disabled:cursor-not-allowed"
              disabled={!selectedDriver || load.driver === selectedDriver || load.status === "Completed" || load.status === "Cancelled" || isSubmitting}
            >
              {isSubmitting ? 
                <RefreshCw size={16} className="animate-spin" /> : 
                "Assign"
              }
            </button>
          </div>
          
          {load.driver && (
            <div className="mt-4 bg-blue-50 p-3 rounded-lg border border-blue-100">
              <div className="flex items-start">
                <Users size={20} className="text-blue-500 mr-2 mt-1" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Currently Assigned</p>
                  <p className="text-sm text-gray-700">{load.driver}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Right Column */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Route Information</h3>
        
        {/* Map Placeholder */}
        <div className="bg-gray-100 h-56 rounded-lg border border-gray-200 flex items-center justify-center mb-4">
          <div className="text-center">
            <Map size={24} className="text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">Route Map</p>
          </div>
        </div>
        
        {/* Status Timeline */}
        <div className="mt-6">
          <h4 className="text-md font-medium text-gray-900 mb-3">Status Updates</h4>
          <div className="space-y-4">
            {[
              { status: "Created", date: "Mar 2, 2025 • 10:30 AM", user: "Admin" },
              load.driver ? { status: "Assigned", date: "Mar 2, 2025 • 11:15 AM", user: "Admin" } : null,
              load.status === "In Transit" || load.status === "Loading" || load.status === "Unloading" || load.status === "Delivered" || load.status === "Completed" 
                ? { status: "In Transit", date: "Mar 3, 2025 • 8:45 AM", user: load.driver } : null,
              load.status === "Delivered" || load.status === "Completed"
                ? { status: "Delivered", date: "Mar 5, 2025 • 2:30 PM", user: load.driver } : null,
              load.status === "Completed"
                ? { status: "Completed", date: "Mar 6, 2025 • 9:15 AM", user: "Admin" } : null,
            ].filter(Boolean).map((update, index) => (
              <div key={index} className="flex items-start">
                <div className="flex-shrink-0 h-4 w-4 rounded-full bg-blue-500 mt-1"></div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">{update.status}</p>
                  <p className="text-xs text-gray-500">{update.date} by {update.user}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderActionsView = () => (
    <div className="p-4">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <button className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-200 transition-colors">
          <MessageSquare size={24} className="text-blue-600 mb-2" />
          <span className="text-sm text-gray-700">Message Driver</span>
        </button>
        <button className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-200 transition-colors">
          <PhoneCall size={24} className="text-blue-600 mb-2" />
          <span className="text-sm text-gray-700">Call Driver</span>
        </button>
        <button className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-200 transition-colors">
          <Navigation size={24} className="text-blue-600 mb-2" />
          <span className="text-sm text-gray-700">Get Directions</span>
        </button>
        <button className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-200 transition-colors">
          <Upload size={24} className="text-blue-600 mb-2" />
          <span className="text-sm text-gray-700">Upload Documents</span>
        </button>
        <button className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-200 transition-colors">
          <FileText size={24} className="text-blue-600 mb-2" />
          <span className="text-sm text-gray-700">Create Invoice</span>
        </button>
        <button className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-red-50 hover:border-red-200 transition-colors">
          <AlertCircle size={24} className="text-red-600 mb-2" />
          <span className="text-sm text-gray-700">Report Issue</span>
        </button>

        {/* Mark Complete Button - Special Highlighted Button */}
        <Link 
          href={`/dashboard/dispatching/complete/${load.id}`}
          className="col-span-full flex flex-col items-center justify-center p-4 bg-green-50 rounded-lg border border-green-200 hover:bg-green-100 hover:border-green-300 transition-colors"
          onClick={() => onClose()}
        >
          <CheckCircle size={24} className="text-green-600 mb-2" />
          <span className="text-sm font-medium text-green-800">Mark as Complete</span>
        </Link>
      </div>

      {/* If the load is already completed or cancelled, show message */}
      {(load.status === "Completed" || load.status === "Cancelled") && (
        <div className="mt-6 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <div className="flex">
            <AlertCircle size={20} className="text-yellow-500 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">
                {load.status === "Completed" ? "Load is already completed" : "Load is cancelled"}
              </h3>
              <p className="mt-1 text-sm text-yellow-700">
                Some actions may be unavailable for {load.status.toLowerCase()} loads.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10 shadow-sm">
          <div className="flex items-center">
            <h2 className="text-xl font-semibold text-gray-900">Load #{load.loadNumber}</h2>
            <StatusBadge status={editMode ? updatedLoad.status : load.status} className="ml-3" />
          </div>
          <div className="flex items-center space-x-2">
            {!editMode ? (
              <button 
                onClick={() => setEditMode(true)}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full"
                disabled={isSubmitting}
              >
                <Edit size={18} />
              </button>
            ) : (
              <button 
                onClick={handleSave}
                className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? <RefreshCw size={18} className="animate-spin" /> : <Check size={18} />}
              </button>
            )}
            <button 
              onClick={onClose}
              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-full"
              disabled={isSubmitting}
            >
              <X size={18} />
            </button>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="px-6 pt-4 border-b border-gray-200">
          <div className="flex space-x-8">
            <button
              onClick={() => setLoadView('details')}
              className={`pb-4 relative ${loadView === 'details' 
                ? 'text-blue-600 font-medium' 
                : 'text-gray-500 hover:text-gray-700'}`}
            >
              Details
              {loadView === 'details' && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded"></span>
              )}
            </button>
            <button
              onClick={() => setLoadView('actions')}
              className={`pb-4 relative ${loadView === 'actions' 
                ? 'text-blue-600 font-medium' 
                : 'text-gray-500 hover:text-gray-700'}`}
            >
              Quick Actions
              {loadView === 'actions' && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded"></span>
              )}
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {loadView === 'details' && renderDetailsView()}
          {loadView === 'actions' && renderActionsView()}
        </div>

        {/* Complete Load Action Button - Always visible at bottom */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <Link
            href={`/dashboard/dispatching/complete/${load.id}`}
            className={`flex items-center justify-center w-full py-3 rounded-md text-white font-medium shadow-sm transition-colors ${
              load.status === "Completed" || load.status === "Cancelled"
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-green-600 hover:bg-green-700'
            }`}
            onClick={() => {
              if (load.status !== "Completed" && load.status !== "Cancelled") {
                onClose();
              }
            }}
            {...(load.status === "Completed" || load.status === "Cancelled" 
              ? { 'aria-disabled': true, tabIndex: -1, onClick: (e) => e.preventDefault() }
              : {}
            )}
          >
            <CheckCircle size={18} className="mr-2" />
            {load.status === "Completed" 
              ? "Load Already Completed" 
              : load.status === "Cancelled"
                ? "Cannot Complete Cancelled Load"
                : "Mark as Complete"
            }
            <ChevronRight size={18} className="ml-2" />
          </Link>
        </div>
      </div>
    </div>
  );
}