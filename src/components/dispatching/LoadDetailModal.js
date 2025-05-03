// src/components/dispatching/LoadDetailModal.js
"use client";

import { useState, useEffect } from "react";
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
  ChevronRight,
  Truck as TruckIcon,
  Building2,
  DollarSign
} from "lucide-react";
import StatusBadge from "./StatusBadge";
import DocumentViewerModal from './DocumentViewerModal';

export default function LoadDetailModal({ 
  load, 
  onClose, 
  onStatusChange, 
  drivers = [], 
  trucks = [], 
  onAssignDriver, 
  onAssignTruck 
}) {
  const [selectedDriver, setSelectedDriver] = useState(load.driverId || "");
  const [selectedTruck, setSelectedTruck] = useState(load.truckId || "");
  const [editMode, setEditMode] = useState(false);
  const [updatedLoad, setUpdatedLoad] = useState({...load});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadView, setLoadView] = useState('details');
  const [availableTrucks, setAvailableTrucks] = useState(trucks || []);
  const [availableDrivers, setAvailableDrivers] = useState(drivers || []);
  const [loadingFleet, setLoadingFleet] = useState(false);
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);

  // Format dates for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const renderDetailsView = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6">
      {/* Left Column */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Load Information</h3>
        
        {editMode ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={updatedLoad.status}
                onChange={(e) => setUpdatedLoad({...updatedLoad, status: e.target.value})}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
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
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Date</label>
                <input
                  type="date"
                  value={updatedLoad.pickupDate}
                  onChange={(e) => setUpdatedLoad({...updatedLoad, pickupDate: e.target.value})}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Date</label>
                <input
                  type="date"
                  value={updatedLoad.deliveryDate}
                  onChange={(e) => setUpdatedLoad({...updatedLoad, deliveryDate: e.target.value})}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Origin</label>
              <input
                type="text"
                value={updatedLoad.origin}
                onChange={(e) => setUpdatedLoad({...updatedLoad, origin: e.target.value})}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
              <input
                type="text"
                value={updatedLoad.destination}
                onChange={(e) => setUpdatedLoad({...updatedLoad, destination: e.target.value})}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rate ($)</label>
              <input
                type="number"
                value={updatedLoad.rate}
                onChange={(e) => setUpdatedLoad({...updatedLoad, rate: parseFloat(e.target.value)})}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h4 className="text-sm font-medium text-gray-500 mb-4">Customer Information</h4>
              <div className="space-y-3">
                <div className="flex items-center">
                  <Building2 size={16} className="text-gray-400 mr-3" />
                  <span className="text-sm text-gray-900">{load.customer}</span>
                </div>
                <div className="flex items-center">
                  <DollarSign size={16} className="text-gray-400 mr-3" />
                  <span className="text-sm text-gray-900">${load.rate.toLocaleString()}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h4 className="text-sm font-medium text-gray-500 mb-4">Schedule</h4>
              <div className="space-y-3">
                <div className="flex items-center">
                  <MapPin size={16} className="text-green-500 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Pickup</p>
                    <p className="text-sm text-gray-600">{load.origin}</p>
                    <p className="text-xs text-gray-500 mt-1">{formatDate(load.pickupDate)}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <MapPin size={16} className="text-blue-500 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Delivery</p>
                    <p className="text-sm text-gray-600">{load.destination}</p>
                    <p className="text-xs text-gray-500 mt-1">{formatDate(load.deliveryDate)}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h4 className="text-sm font-medium text-gray-500 mb-4">Assignment Details</h4>
              <div className="space-y-3">
                <div className="flex items-center">
                  <Users size={16} className="text-gray-400 mr-3" />
                  <span className="text-sm text-gray-900">{load.driver || "Unassigned"}</span>
                </div>
                {load.truckInfo && (
                  <div className="flex items-center">
                    <TruckIcon size={16} className="text-gray-400 mr-3" />
                    <span className="text-sm text-gray-900">{load.truckInfo}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Right Column */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Route Information</h3>
        
        {/* Map Placeholder */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 h-56 rounded-lg border border-gray-200 flex items-center justify-center mb-6">
          <div className="text-center">
            <Map size={48} className="text-blue-500 mx-auto mb-2" />
            <p className="text-gray-600 font-medium">Route Map</p>
            <p className="text-sm text-gray-500">Interactive map coming soon</p>
          </div>
        </div>
        
        {/* Status Timeline */}
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-700 mb-4">Status History</h4>
          <div className="space-y-4">
            {[
              { status: "Created", date: "Mar 2, 2025 • 10:30 AM", user: "Admin", color: "blue" },
              load.driver ? { status: "Assigned", date: "Mar 2, 2025 • 11:15 AM", user: "Admin", color: "purple" } : null,
              load.status === "In Transit" ? { status: "In Transit", date: "Mar 3, 2025 • 8:45 AM", user: load.driver, color: "yellow" } : null,
              load.status === "Delivered" ? { status: "Delivered", date: "Mar 5, 2025 • 2:30 PM", user: load.driver, color: "green" } : null,
              load.status === "Completed" ? { status: "Completed", date: "Mar 6, 2025 • 9:15 AM", user: "Admin", color: "green" } : null,
            ].filter(Boolean).map((update, index) => (
              <div key={index} className="flex items-start">
                <div className={`flex-shrink-0 h-4 w-4 rounded-full mt-1 ${
                  update.color === 'blue' ? 'bg-blue-500' :
                  update.color === 'purple' ? 'bg-purple-500' :
                  update.color === 'yellow' ? 'bg-yellow-500' :
                  'bg-green-500'
                }`}></div>
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
    <div className="p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-6">Quick Actions</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <ActionButton
          icon={<MessageSquare size={24} />}
          title="Message Driver"
          description="Send a text or notification"
          color="blue"
        />
        <ActionButton
          icon={<PhoneCall size={24} />}
          title="Call Driver"
          description="Make a phone call"
          color="blue"
        />
        <ActionButton
          icon={<Navigation size={24} />}
          title="Get Directions"
          description="Open in Maps app"
          color="blue"
        />
        <ActionButton
          icon={<Upload size={24} />}
          title="Upload Documents"
          description="Add proofs of delivery"
          color="blue"
        />
        <ActionButton
          icon={<FileText size={24} />}
          title="View Documents"
          description="See attached files"
          color="blue"
          onClick={() => setShowDocumentViewer(true)}
        />
        <ActionButton
          icon={<AlertCircle size={24} />}
          title="Report Issue"
          description="Flag a problem"
          color="red"
        />
      </div>

      {/* Complete Load Action */}
      <div className="mt-8">
        <Link
          href={`/dashboard/dispatching/complete/${load.id}`}
          className={`flex items-center justify-center w-full py-4 rounded-lg text-white font-medium shadow-sm transition-colors ${
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
          <CheckCircle size={20} className="mr-2" />
          {load.status === "Completed" 
            ? "Load Already Completed" 
            : load.status === "Cancelled"
              ? "Cannot Complete Cancelled Load"
              : "Mark as Complete"
          }
          <ChevronRight size={18} className="ml-2" />
        </Link>
        
        {(load.status === "Completed" || load.status === "Cancelled") && (
          <p className="mt-3 text-center text-sm text-gray-500">
            Some actions may be unavailable for {load.status.toLowerCase()} loads.
          </p>
        )}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10 rounded-t-xl">
          <div className="flex items-center">
            <h2 className="text-xl font-semibold text-gray-900">Load #{load.loadNumber}</h2>
            <StatusBadge status={editMode ? updatedLoad.status : load.status} className="ml-3" />
          </div>
          <div className="flex items-center space-x-2">
            {!editMode ? (
              <button 
                onClick={() => setEditMode(true)}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                disabled={isSubmitting}
              >
                <Edit size={18} />
              </button>
            ) : (
              <button 
                onClick={handleSave}
                className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                disabled={isSubmitting}
              >
                {isSubmitting ? <RefreshCw size={18} className="animate-spin" /> : <Check size={18} />}
              </button>
            )}
            <button 
              onClick={onClose}
              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              disabled={isSubmitting}
            >
              <X size={18} />
            </button>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="px-6 pt-4 border-b border-gray-200">
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
    </div>
  );
}

// Helper Components
function TabButton({ label, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`pb-4 relative ${isActive 
        ? 'text-blue-600 font-medium' 
        : 'text-gray-500 hover:text-gray-700'}`}
    >
      {label}
      {isActive && (
        <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-full"></span>
      )}
    </button>
  );
}

function ActionButton({ icon, title, description, color = 'blue', onClick }) {
  const colorClasses = color === 'red' 
    ? 'hover:bg-red-50 hover:border-red-200 text-red-600' 
    : 'hover:bg-blue-50 hover:border-blue-200 text-blue-600';

  return (
    <button 
      className={`flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg border border-gray-200 transition-colors ${colorClasses}`}
      onClick={onClick}
    >
      <div className="mb-2">{icon}</div>
      <span className="text-sm font-medium text-gray-900">{title}</span>
      <span className="text-xs text-gray-500 mt-1">{description}</span>
    </button>
  );
}