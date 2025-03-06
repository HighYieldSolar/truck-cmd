"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import Image from "next/image";
import { fetchCustomers as getCustomers } from "@/lib/services/customerService";
import {
  LayoutDashboard,
  Truck,
  FileText,
  Wallet,
  Users,
  Package,
  CheckCircle,
  Calculator,
  Fuel,
  Settings,
  LogOut,
  Bell,
  Search,
  Filter,
  Plus,
  MapPin,
  Calendar,
  Clock,
  ChevronDown,
  AlertCircle,
  Check,
  CheckCircle as CheckCircleIcon,
  X,
  Edit,
  Trash2,
  ArrowRight,
  MoreHorizontal,
  RefreshCw,
  Upload,
  Download,
  Map,
  Navigation,
  PhoneCall,
  MessageSquare,
  Info,
  ChevronRight,
  Package as PackageIcon,
  DollarSign,
} from "lucide-react";

// Sidebar Component for consistent navigation
const Sidebar = ({ activePage = "dispatching" }) => {
  const menuItems = [
    { name: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard size={18} /> },
    { name: 'Dispatching', href: '/dashboard/dispatching', icon: <Truck size={18} /> },
    { name: 'Invoices', href: '/dashboard/invoices', icon: <FileText size={18} /> },
    { name: 'Expenses', href: '/dashboard/expenses', icon: <Wallet size={18} /> },
    { name: 'Customers', href: '/dashboard/customers', icon: <Users size={18} /> },
    { name: 'Fleet', href: '/dashboard/fleet', icon: <Package size={18} /> },
    { name: 'Compliance', href: '/dashboard/compliance', icon: <CheckCircle size={18} /> },
    { name: 'IFTA Calculator', href: '/dashboard/ifta', icon: <Calculator size={18} /> },
    { name: 'Fuel Tracker', href: '/dashboard/fuel', icon: <Fuel size={18} /> },
  ];

  return (
    <div className="hidden md:flex w-64 flex-col bg-white shadow-lg">
      <div className="p-4 border-b">
        <Image 
          src="/images/tc-name-tp-bg.png" 
          alt="Truck Command Logo"
          width={150}
          height={50}
          className="h-10"
        />
      </div>
      
      <nav className="flex-1 px-2 py-4 overflow-y-auto">
        <div className="space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                activePage === item.name.toLowerCase() 
                  ? 'bg-blue-50 text-blue-700' 
                  : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
              }`}
            >
              <span className="mr-3">{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          ))}
        </div>
        
        <div className="pt-4 mt-4 border-t">
          <Link 
            href="/dashboard/settings" 
            className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md hover:text-blue-600 transition-colors"
          >
            <Settings size={18} className="mr-3" />
            <span>Settings</span>
          </Link>
          <button 
            onClick={async () => {
              try {
                await supabase.auth.signOut();
                window.location.href = '/login';
              } catch (error) {
                console.error('Error logging out:', error);
              }
            }} 
            className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md hover:text-blue-600 transition-colors"
          >
            <LogOut size={18} className="mr-3" />
            <span>Logout</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

// Status Badge Component
const StatusBadge = ({ status }) => {
  const statusStyles = {
    "Pending": "bg-yellow-100 text-yellow-800",
    "Assigned": "bg-blue-100 text-blue-800",
    "In Transit": "bg-purple-100 text-purple-800",
    "Loading": "bg-indigo-100 text-indigo-800",
    "Unloading": "bg-teal-100 text-teal-800",
    "Delivered": "bg-green-100 text-green-800",
    "Cancelled": "bg-red-100 text-red-800",
    "Completed": "bg-green-100 text-green-800",
    "Delayed": "bg-orange-100 text-orange-800"
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[status] || "bg-gray-100 text-gray-800"}`}>
      {status}
    </span>
  );
};

// Load Card Component for active loads
// Load Card Component for active loads
const LoadCard = ({ load, onSelect, onDelete }) => {
  return (
    <div 
      className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onSelect(load)}
    >
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-medium text-gray-900">#{load.loadNumber}</h3>
          <StatusBadge status={load.status} />
        </div>
        <div className="mb-2">
          <p className="text-sm text-gray-500">Customer: <span className="text-gray-900">{load.customer}</span></p>
        </div>
        <div className="flex items-center text-sm text-gray-500 mb-3">
          <MapPin size={16} className="text-gray-400 mr-1" />
          <span className="truncate">{load.origin}</span>
          <ArrowRight size={14} className="mx-1" />
          <span className="truncate">{load.destination}</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center">
            <Calendar size={14} className="text-gray-400 mr-1" />
            <span className="text-gray-900">{load.pickupDate}</span>
          </div>
          <div className="flex items-center">
            <Clock size={14} className="text-gray-400 mr-1" />
            <span className="text-gray-900">{load.deliveryDate}</span>
          </div>
          <div className="flex items-center">
            <Truck size={14} className="text-gray-400 mr-1" />
            <span className="text-gray-900">{load.driver || "Unassigned"}</span>
          </div>
          <div className="flex items-center">
            <DollarSign size={14} className="text-gray-400 mr-1" />
            <span className="text-gray-900">${load.rate.toLocaleString()}</span>
          </div>
        </div>
        
        {/* Step 5: Show completion date for completed loads */}
        {load.status === "Completed" && load.completedAt && (
          <div className="mt-2 text-xs text-gray-500">
            <div className="flex items-center">
              <CheckCircleIcon size={12} className="text-green-500 mr-1" /> 
              Completed on {new Date(load.completedAt).toLocaleDateString()}
            </div>
          </div>
        )}
        
        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between">
          {/* Step 2: Add Complete button to Load Card */}
          {load.status !== "Completed" && load.status !== "Cancelled" && (
            <Link
              href={`/dashboard/dispatching/complete/${load.id}`}
              className="text-sm text-green-600 hover:text-green-800 flex items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <CheckCircleIcon size={14} className="mr-1" />
              Mark Complete
            </Link>
          )}
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(load);
            }}
            className="text-red-600 hover:text-red-800 text-sm inline-flex items-center"
          >
            <Trash2 size={14} className="mr-1" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

// Filter Bar Component
// In your FilterBar component
const FilterBar = ({ filters, setFilters }) => {
  const statusOptions = [
    "All",
    "Pending",
    "Assigned",
    "In Transit",
    "Loading",
    "Unloading",
    "Delivered",
    "Completed",
    "Cancelled",
    "Delayed"
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
        {/* Your existing filter controls */}
        <div className="flex-1">
          <label htmlFor="search" className="block text-xs font-medium text-gray-700 mb-1">Search</label>
          <div className="relative">
            <input
              type="text"
              id="search"
              placeholder="Search by load #, customer, or driver"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400" />
            </div>
          </div>
        </div>

        <div className="sm:w-40">
          <label htmlFor="status" className="block text-xs font-medium text-gray-700 mb-1">Status</label>
          <select
            id="status"
            className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value})}
          >
            {statusOptions.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>

        {/* Rest of your existing filter controls */}
      </div>
      
      {/* Add the quick filter buttons here */}
      <div className="flex flex-wrap gap-2 mt-4">
        <button
          onClick={() => setFilters({...filters, status: "All"})}
          className={`px-3 py-1 text-xs rounded-full ${
            filters.status === "All" 
              ? 'bg-blue-100 text-blue-800 border border-blue-300' 
              : 'bg-gray-100 text-gray-800 border border-gray-200'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilters({...filters, status: "Active"})}
          className={`px-3 py-1 text-xs rounded-full flex items-center ${
            filters.status === "Active" 
              ? 'bg-blue-100 text-blue-800 border border-blue-300' 
              : 'bg-gray-100 text-gray-800 border border-gray-200'
          }`}
        >
          <Truck size={10} className="mr-1" />
          Active
        </button>
        <button
          onClick={() => setFilters({...filters, status: "Completed"})}
          className={`px-3 py-1 text-xs rounded-full flex items-center ${
            filters.status === "Completed" 
              ? 'bg-green-100 text-green-800 border border-green-300' 
              : 'bg-gray-100 text-gray-800 border border-gray-200'
          }`}
        >
          <CheckCircleIcon size={10} className="mr-1" />
          Completed
        </button>
      </div>
    </div>
  );
};

// Load Detail Modal Component
const LoadDetailModal = ({ load, onClose, onStatusChange, drivers, onAssignDriver }) => {
  const [selectedDriver, setSelectedDriver] = useState(load.driver || "");
  const [editMode, setEditMode] = useState(false);
  const [updatedLoad, setUpdatedLoad] = useState({...load});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    setIsSubmitting(true);
    try {

      {load.status === "Completed" && load.completedAt && (
        <div className="ml-4 bg-green-100 text-green-800 px-3 py-1 text-xs rounded-full flex items-center">
          <CheckCircleIcon size={12} className="mr-1" />
          Completed {new Date(load.completedAt).toLocaleString()}
        </div>
      )}
      
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
        
        {/* Content */}
        <div className="p-6">
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
                      <p className="text-base text-gray-900">{load.pickupDate}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Delivery Date</p>
                      <p className="text-base text-gray-900">{load.deliveryDate}</p>
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
              
              {/* Quick Actions */}
              <div className="mt-6 border-t border-gray-200 pt-4">
                <h4 className="text-md font-medium text-gray-900 mb-3">Quick Actions</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button className="flex flex-col items-center justify-center p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-200 transition-colors">
                    <MessageSquare size={20} className="text-blue-600 mb-1" />
                    <span className="text-xs text-gray-700">Message Driver</span>
                  </button>
                  <button className="flex flex-col items-center justify-center p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-200 transition-colors">
                    <PhoneCall size={20} className="text-blue-600 mb-1" />
                    <span className="text-xs text-gray-700">Call Driver</span>
                  </button>
                  <button className="flex flex-col items-center justify-center p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-200 transition-colors">
                    <Navigation size={20} className="text-blue-600 mb-1" />
                    <span className="text-xs text-gray-700">Get Directions</span>
                  </button>
                  <button className="flex flex-col items-center justify-center p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-200 transition-colors">
                    <Upload size={20} className="text-blue-600 mb-1" />
                    <span className="text-xs text-gray-700">Upload POD</span>
                  </button>
                  <button className="flex flex-col items-center justify-center p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-200 transition-colors">
                    <FileText size={20} className="text-blue-600 mb-1" />
                    <span className="text-xs text-gray-700">Create Invoice</span>
                  </button>
                  <button className="flex flex-col items-center justify-center p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-red-50 hover:border-red-200 transition-colors">
                    <AlertCircle size={20} className="text-red-600 mb-1" />
                    <span className="text-xs text-gray-700">Report Issue</span>
                  </button>
                  <button 
                    onClick={() => {
                     onClose();
                     router.push(`/dashboard/dispatching/complete/${load.id}`);
                   }}
                    className="flex flex-col items-center justify-center p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-green-50 hover:border-green-200 transition-colors"
                    disabled={load.status === "Completed" || load.status === "Cancelled"}
                  >
                     <CheckCircleIcon size={20} className="text-green-600 mb-1" />
                    <span className="text-xs text-gray-700">Mark Complete</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
// Delete Load Component
const DeleteLoadModal = ({ isOpen, onClose, onConfirm, loadNumber, isDeleting }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-center mb-4 text-red-600">
          <AlertCircle size={40} />
        </div>
        <h3 className="text-lg font-medium text-center text-gray-900 mb-2">
          Delete Load
        </h3>
        <p className="text-center text-gray-500 mb-6">
          Are you sure you want to delete Load <strong>#{loadNumber}</strong>? This action cannot be undone.
        </p>
        <div className="flex justify-center space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 flex items-center"
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <RefreshCw size={16} className="animate-spin mr-2" />
                Deleting...
              </>
            ) : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
};

// New Load Modal Component
const NewLoadModal = ({ onClose, onSave, customers }) => {
  const [formData, setFormData] = useState({
    customer: "",
    origin: "",
    destination: "",
    pickupDate: "",
    deliveryDate: "",
    rate: "",
    description: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Generate a load number for new loads
      const loadNumber = `L${Math.floor(10000 + Math.random() * 90000)}`;
      
      // Get user ID from session
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      
      // Format data for the database
      const dbData = {
        user_id: user.id,
        load_number: loadNumber,
        customer: formData.customer,
        origin: formData.origin,
        destination: formData.destination,
        pickup_date: formData.pickupDate,
        delivery_date: formData.deliveryDate,
        rate: parseFloat(formData.rate) || 0,
        status: "Pending",
        description: formData.description,
        created_at: new Date()
      };
      
      // Calculate distance using Google Maps API or estimate 
      // For now, use a simple estimation based on origin/destination
      const distance = Math.floor(Math.random() * 500) + 100; // Placeholder
      dbData.distance = distance;
      
      // Insert into database
      const { data, error } = await supabase
        .from('loads')
        .insert([dbData])
        .select();
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        throw new Error("Failed to create load - no data returned");
      }
      
      // Map database response to component format
      const newLoad = {
        id: data[0].id,
        loadNumber: data[0].load_number,
        customer: data[0].customer,
        origin: data[0].origin,
        destination: data[0].destination,
        pickupDate: data[0].pickup_date,
        deliveryDate: data[0].delivery_date,
        rate: data[0].rate,
        status: data[0].status,
        distance: data[0].distance,
        description: data[0].description,
        driver: ""
      };
      
      onSave(newLoad);
      onClose();
    } catch (error) {
      console.error("Error creating load:", error);
      alert("Failed to create load. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900">Create New Load</h2>
          <button 
            onClick={onClose}
            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-full"
            disabled={isSubmitting}
          >
            <X size={18} />
          </button>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer *</label>
              <select
  name="customer"
  value={formData.customer}
  onChange={handleChange}
  className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
  required
>
  <option value="">Select Customer</option>
  {customers.map(customer => (
    <option key={customer.id} value={customer.company_name}>{customer.company_name}</option>
  ))}
</select>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Origin *</label>
                <input
                  type="text"
                  name="origin"
                  placeholder="City, State"
                  value={formData.origin}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Destination *</label>
                <input
                  type="text"
                  name="destination"
                  placeholder="City, State"
                  value={formData.destination}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Date *</label>
                <input
                  type="date"
                  name="pickupDate"
                  value={formData.pickupDate}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Date *</label>
                <input
                  type="date"
                  name="deliveryDate"
                  value={formData.deliveryDate}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rate ($) *</label>
              <input
                type="number"
                name="rate"
                placeholder="0.00"
                value={formData.rate}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
              <textarea
                name="description"
                placeholder="Enter any special instructions or notes..."
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
              ></textarea>
            </div>
          </div>
          
          <div className="mt-8 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 text-sm"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm flex items-center"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw size={16} className="mr-2 animate-spin" />
                  Creating...
                </>
              ) : "Create Load"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Statistic Card Component
const StatCard = ({ title, value, color }) => {
  const colorClasses = {
    blue: "bg-blue-500",
    green: "bg-green-500",
    yellow: "bg-yellow-500",
    red: "bg-red-500",
    purple: "bg-purple-500"
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
      <div className="flex items-center">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color]} bg-opacity-10 mr-4`}>
          <div className={`w-8 h-8 rounded-lg ${colorClasses[color]} flex items-center justify-center text-white`}>
            {color === "blue" && <Truck size={16} />}
            {color === "yellow" && <Clock size={16} />}
            {color === "purple" && <Navigation size={16} />}
            {color === "green" && <CheckCircleIcon size={16} />}
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
};

// Fetch drivers from the database
const fetchDrivers = async (userId) => {
  try {
    // Check if the drivers table exists
    const { data: tablesData, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'drivers');
    
    // If there's an error or the table doesn't exist, return sample data
    if (tablesError || !tablesData || tablesData.length === 0) {
      console.log('Using sample driver data because table might not exist');
      return [
        { id: 1, user_id: userId, name: "John Smith", phone: "555-123-4567", license: "CDL12345" },
        { id: 2, user_id: userId, name: "Maria Garcia", phone: "555-987-6543", license: "CDL67890" },
        { id: 3, user_id: userId, name: "Robert Johnson", phone: "555-456-7890", license: "CDL24680" },
        { id: 4, user_id: userId, name: "Li Wei", phone: "555-222-3333", license: "CDL13579" },
        { id: 5, user_id: userId, name: "James Wilson", phone: "555-444-5555", license: "CDL97531" }
      ];
    }
    
    // Try to fetch from the drivers table
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .eq('user_id', userId);
      
    if (error) throw error;
    
    // If there are no drivers yet, return sample data
    if (!data || data.length === 0) {
      return [
        { id: 1, user_id: userId, name: "John Smith", phone: "555-123-4567", license: "CDL12345" },
        { id: 2, user_id: userId, name: "Maria Garcia", phone: "555-987-6543", license: "CDL67890" },
        { id: 3, user_id: userId, name: "Robert Johnson", phone: "555-456-7890", license: "CDL24680" },
        { id: 4, user_id: userId, name: "Li Wei", phone: "555-222-3333", license: "CDL13579" },
        { id: 5, user_id: userId, name: "James Wilson", phone: "555-444-5555", license: "CDL97531" }
      ];
    }
    
    return data;
  } catch (error) {
    console.error("Error fetching drivers:", error);
    // Return sample data on error
    return [
      { id: 1, user_id: userId, name: "John Smith", phone: "555-123-4567", license: "CDL12345" },
      { id: 2, user_id: userId, name: "Maria Garcia", phone: "555-987-6543", license: "CDL67890" },
      { id: 3, user_id: userId, name: "Robert Johnson", phone: "555-456-7890", license: "CDL24680" },
      { id: 4, user_id: userId, name: "Li Wei", phone: "555-222-3333", license: "CDL13579" },
      { id: 5, user_id: userId, name: "James Wilson", phone: "555-444-5555", license: "CDL97531" }
    ];
  }
};

// Fetch customers from the database
const fetchCustomers = async (userId) => {
  try {
    const customers = await getCustomers(userId);
    
    // If no customers exist yet, you might want to show sample data
    if (!customers || customers.length === 0) {
      return [
        { id: 1, user_id: userId, company_name: "ABC Shipping", contact_name: "John Doe", email: "john@abcshipping.com" },
        { id: 2, user_id: userId, company_name: "XYZ Logistics", contact_name: "Jane Smith", email: "jane@xyzlogistics.com" },
        { id: 3, user_id: userId, company_name: "Global Transport Inc.", contact_name: "Mike Johnson", email: "mike@globaltransport.com" },
        { id: 4, user_id: userId, company_name: "Fast Freight Services", contact_name: "Sarah Brown", email: "sarah@fastfreight.com" },
        { id: 5, user_id: userId, company_name: "Acme Delivery", contact_name: "Tom Wilson", email: "tom@acmedelivery.com" }
      ];
    }
    
    return customers;
  } catch (error) {
    console.error("Error fetching customers:", error);
    return [];
  }
};

// Fetch loads from the database with filters
const fetchLoads = async (userId, filters = {}) => {
  try {
    let query = supabase
      .from('loads')
      .select('*')
      .eq('user_id', userId);
    
    // Apply status filter
    if (filters.status && filters.status !== 'All') {
      if (filters.status === 'Active') {
        // Active means any status that is not Completed or Cancelled
        query = query.not('status', 'in', '("Completed","Cancelled")');
      } else {
        query = query.eq('status', filters.status);
      }
    }
    
    // Apply search filter
    if (filters.search) {
      query = query.or(`load_number.ilike.%${filters.search}%,customer.ilike.%${filters.search}%,driver.ilike.%${filters.search}%`);
    }
    
    // Apply date filter
    if (filters.dateRange && filters.dateRange !== 'all') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const nextWeekEnd = new Date(today);
      nextWeekEnd.setDate(nextWeekEnd.getDate() + 7);
      
      const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      
      switch (filters.dateRange) {
        case 'today':
          query = query.eq('pickup_date', today.toISOString().split('T')[0]);
          break;
        case 'tomorrow':
          query = query.eq('pickup_date', tomorrow.toISOString().split('T')[0]);
          break;
        case 'thisWeek':
          query = query.gte('pickup_date', today.toISOString().split('T')[0])
                      .lte('pickup_date', nextWeekEnd.toISOString().split('T')[0]);
          break;
        case 'thisMonth':
          query = query.gte('pickup_date', today.toISOString().split('T')[0])
                      .lte('pickup_date', monthEnd.toISOString().split('T')[0]);
          break;
      }
    }
  


    // Apply sorting
    if (filters.sortBy) {
      switch (filters.sortBy) {
        case 'pickupDate':
          query = query.order('pickup_date', { ascending: true });
          break;
        case 'deliveryDate':
          query = query.order('delivery_date', { ascending: true });
          break;
        case 'status':
          query = query.order('status', { ascending: true });
          break;
        case 'customer':
          query = query.order('customer', { ascending: true });
          break;
        case 'rate':
          query = query.order('rate', { ascending: false });
          break;
      }
    } else {
      // Default sort by creation date (newest first)
      query = query.order('created_at', { ascending: false });
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    // If no loads found yet, don't return sample data - let the UI handle the empty state
    if (!data || data.length === 0) {
      return [];
    }
    
    // Map database schema to component-friendly format
    return data.map(load => ({
      id: load.id,
      loadNumber: load.load_number,
      customer: load.customer,
      origin: load.origin || '',
      destination: load.destination || '',
      pickupDate: load.pickup_date,
      deliveryDate: load.delivery_date,
      status: load.status,
      driver: load.driver || '',
      rate: load.rate || 0,
      distance: load.distance || 0,
      description: load.description || '',
      completedAt: load.completed_at || null
    }));
  } catch (error) {
    console.error("Error fetching loads:", error);
    return [];
  }
};


// Calculate load statistics
const calculateLoadStats = (loads) => {
  const activeLoads = loads.filter(l => !['Completed', 'Cancelled'].includes(l.status)).length;
  const pendingLoads = loads.filter(l => l.status === 'Pending').length;
  const inTransitLoads = loads.filter(l => l.status === 'In Transit').length;
  const completedLoads = loads.filter(l => l.status === 'Completed').length;
  
  return {
    activeLoads,
    pendingLoads,
    inTransitLoads,
    completedLoads
  };
};

// Main Dispatching Dashboard Component
export default function DispatchingPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingLoads, setLoadingLoads] = useState(false);
  
  // State for the loads
  const [loads, setLoads] = useState([]);
  const [totalLoads, setTotalLoads] = useState(0);
  const [loadStats, setLoadStats] = useState({
    activeLoads: 0,
    pendingLoads: 0,
    inTransitLoads: 0,
    completedLoads: 0
  });
  
  // State for customers and drivers
  const [customers, setCustomers] = useState([]);
  const [drivers, setDrivers] = useState([]);
  
  // State for filtering and selection
  const [filters, setFilters] = useState({
    search: "",
    status: "All",
    dateRange: "all",
    sortBy: "pickupDate"
  });
  
  // State for modals
  const [selectedLoad, setSelectedLoad] = useState(null);
  const [showNewLoadModal, setShowNewLoadModal] = useState(false);

    // Add these three lines right here:
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [loadToDelete, setLoadToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
  
  // Error handling state
  const [error, setError] = useState(null);

  // Define loadLoadsData BEFORE any useEffect that uses it
  const loadLoadsData = useCallback(async (userId) => {
    try {
      setLoadingLoads(true);
      const loadData = await fetchLoads(userId, filters);
      setLoads(loadData);
      setTotalLoads(loadData.length);
      setLoadStats(calculateLoadStats(loadData));
    } catch (error) {
      console.error('Error loading loads:', error);
      setError('Failed to load loads data. Please try refreshing the page.');
    } finally {
      setLoadingLoads(false);
    }
  }, [filters]); // Include filters as a dependency

  // Now use loadLoadsData in useEffect
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // Get user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
      
        if (userError) throw userError;
        
        if (!user) {
          // Redirect to login page if not authenticated
          window.location.href = '/login';
          return;
        }
        
        setUser(user);
        
        // Fetch all required data in parallel
        const [cusData, drvData] = await Promise.all([
          fetchCustomers(user.id),
          fetchDrivers(user.id)
        ]);
        
        setCustomers(cusData);
        setDrivers(drvData);
        
        // Now fetch loads (this might take longer so do it separately)
        await loadLoadsData(user.id);
      
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load data. Please try refreshing the page.');
        setLoading(false);
      }
    }

    fetchData();
  }, [loadLoadsData]); // Add loadLoadsData as a dependency
  
  // Effect to reload loads when filters change
  useEffect(() => {
    if (user) {
      loadLoadsData(user.id);
    }
  }, [user, loadLoadsData]); // Include loadLoadsData here

  // Handle selecting a load to view details
  const handleSelectLoad = (load) => {
    setSelectedLoad(load);
  };

  // Handle closing the load detail modal
  const handleCloseModal = () => {
    setSelectedLoad(null);
  };

  // Handle status change for a load
  const handleStatusChange = async (updatedLoad) => {
    try {
      // Update the load in the local state
      const updatedLoads = loads.map(load => {
        if (load.id === updatedLoad.id) {
          return updatedLoad;
        }
        return load;
      });
      
      setLoads(updatedLoads);
      setSelectedLoad(updatedLoad);
      setLoadStats(calculateLoadStats(updatedLoads));
    } catch (error) {
      console.error('Error updating load status:', error);
      alert('Failed to update load status. Please try again.');
    }
  };

  // Handle assigning a driver to a load
  const handleAssignDriver = async (loadId, driverName) => {
    try {
      // Update the load in the local state
      const updatedLoads = loads.map(load => {
        if (load.id === loadId) {
          return {
            ...load,
            driver: driverName,
            status: load.status === "Pending" ? "Assigned" : load.status
          };
        }
        return load;
      });
      
      setLoads(updatedLoads);
      setLoadStats(calculateLoadStats(updatedLoads));
      
      // Update the selected load if it's open
      if (selectedLoad && selectedLoad.id === loadId) {
        setSelectedLoad({
          ...selectedLoad,
          driver: driverName,
          status: selectedLoad.status === "Pending" ? "Assigned" : selectedLoad.status
        });
      }
    } catch (error) {
      console.error('Error assigning driver:', error);
      alert('Failed to assign driver. Please try again.');
    }
  };

  // Handle creating a new load
  const handleSaveNewLoad = (newLoad) => {
    const updatedLoads = [newLoad, ...loads];
    setLoads(updatedLoads);
    setTotalLoads(updatedLoads.length);
    setLoadStats(calculateLoadStats(updatedLoads));
  };

  // Handle deleting a load
const handleDeleteLoad = (load) => {
  setLoadToDelete(load);
  setDeleteModalOpen(true);
};

// Confirm delete load
const confirmDeleteLoad = async () => {
  if (!loadToDelete) return;
  
  try {
    setIsDeleting(true);
    
    // Delete the load from the database
    const { error } = await supabase
      .from('loads')
      .delete()
      .eq('id', loadToDelete.id);
    
    if (error) throw error;
    
    // Update the UI by removing the deleted load
    const updatedLoads = loads.filter(load => load.id !== loadToDelete.id);
    setLoads(updatedLoads);
    setTotalLoads(updatedLoads.length);
    setLoadStats(calculateLoadStats(updatedLoads));
    
    // Close the modal
    setDeleteModalOpen(false);
    setLoadToDelete(null);
    
  } catch (error) {
    console.error('Error deleting load:', error);
    alert('Failed to delete load. Please try again.');
  } finally {
    setIsDeleting(false);
  }
};

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar activePage="dispatching" />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between p-4 bg-white shadow-sm">
          <h1 className="text-xl font-semibold text-gray-900">Dispatching</h1>
          
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setShowNewLoadModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus size={16} className="mr-2" />
              Create Load
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 bg-gray-100">
          <div className="max-w-7xl mx-auto">
            {/* Error message */}
            {error && (
              <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard 
                title="Active Loads" 
                value={loadStats.activeLoads} 
                color="blue" 
              />
              <StatCard 
                title="Pending Loads" 
                value={loadStats.pendingLoads} 
                color="yellow" 
              />
              <StatCard 
                title="In Transit" 
                value={loadStats.inTransitLoads} 
                color="purple" 
              />
              <StatCard 
                title="Completed" 
                value={loadStats.completedLoads} 
                color="green" 
              />
            </div>
            
            {/* Filter Bar */}
            <FilterBar filters={filters} setFilters={setFilters} />
            
            {/* Loads Grid */}
            <div className="mb-4 flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">
                Loads ({loads.length})
              </h2>
              <div className="text-sm text-gray-500">
                {filters.status !== "All" || filters.search || filters.dateRange !== "all" ? (
                  <button 
                    onClick={() => setFilters({search: "", status: "All", dateRange: "all", sortBy: "pickupDate"})}
                    className="inline-flex items-center text-blue-600 hover:text-blue-800"
                  >
                    <RefreshCw size={12} className="mr-1" />
                    Clear Filters
                  </button>
                ) : null}
              </div>
            </div>

            
            
            {/* Loads Grid */}
            {loadingLoads ? (
              <div className="flex items-center justify-center h-64">
                <RefreshCw size={32} className="animate-spin text-blue-500" />
              </div>
            ) : loads.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                <div className="mx-auto w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <PackageIcon size={32} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No loads found</h3>
                <p className="text-gray-500 mb-4">
                  {filters.status !== "All" || filters.search || filters.dateRange !== "all" 
                    ? "Try adjusting your filters or search criteria."
                    : "Get started by creating your first load."}
                </p>
                <button 
                  onClick={() => setShowNewLoadModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus size={16} className="mr-2" />
                  Create Load
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {loads.map(load => (
                  <LoadCard
                  key={load.id}
                  load={load}
                  onSelect={handleSelectLoad}
                  onDelete={handleDeleteLoad}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>



      {/* Load Detail Modal */}
      {selectedLoad && (
        <LoadDetailModal
          load={selectedLoad}
          onClose={handleCloseModal}
          onStatusChange={handleStatusChange}
          drivers={drivers}
          onAssignDriver={handleAssignDriver}
        />
      )}

      {/* New Load Modal */}
      {showNewLoadModal && (
        <NewLoadModal
          onClose={() => setShowNewLoadModal(false)}
          onSave={handleSaveNewLoad}
          customers={customers}
        />
      )}

{/* Delete Load Modal */}
{deleteModalOpen ? (
  <DeleteLoadModal
    isOpen={deleteModalOpen}
    onClose={() => {
      setDeleteModalOpen(false);
      setLoadToDelete(null);
    }}
    onConfirm={confirmDeleteLoad}
    loadNumber={loadToDelete?.loadNumber}
    isDeleting={isDeleting}
  />
) : null}
    </div>
  );
}