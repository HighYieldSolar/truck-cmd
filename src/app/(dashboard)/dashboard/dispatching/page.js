"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import Image from "next/image";
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
const LoadCard = ({ load, onSelect }) => {
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
      </div>
    </div>
  );
};

// Filter Bar Component
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

        <div className="sm:w-40">
          <label htmlFor="dateRange" className="block text-xs font-medium text-gray-700 mb-1">Date Range</label>
          <select
            id="dateRange"
            className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
            value={filters.dateRange}
            onChange={(e) => setFilters({...filters, dateRange: e.target.value})}
          >
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="tomorrow">Tomorrow</option>
            <option value="thisWeek">This Week</option>
            <option value="nextWeek">Next Week</option>
            <option value="thisMonth">This Month</option>
          </select>
        </div>

        <div className="sm:w-40">
          <label htmlFor="sortBy" className="block text-xs font-medium text-gray-700 mb-1">Sort By</label>
          <select
            id="sortBy"
            className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
            value={filters.sortBy}
            onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
          >
            <option value="pickupDate">Pickup Date</option>
            <option value="deliveryDate">Delivery Date</option>
            <option value="status">Status</option>
            <option value="customer">Customer</option>
            <option value="rate">Rate (High to Low)</option>
          </select>
        </div>
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
      // In a real app, you would update the load in the database
      const { data, error } = await supabase
        .from('loads')
        .update({
          status: updatedLoad.status,
          customer: updatedLoad.customer,
          pickup_date: updatedLoad.pickupDate,
          delivery_date: updatedLoad.deliveryDate,
          origin: updatedLoad.origin,
          destination: updatedLoad.destination,
          rate: updatedLoad.rate
        })
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
      // In a real app, you would update the driver in the database
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
                </div>
              </div>
            </div>
          </div>
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
      // In a real app, save to database
      const loadNumber = `L${Math.floor(10000 + Math.random() * 90000)}`;
      const distance = Math.floor(Math.random() * 1000) + 100; // Random distance for demo
      
      const { data, error } = await supabase
        .from('loads')
        .insert([
          {
            load_number: loadNumber,
            customer: formData.customer,
            origin: formData.origin,
            destination: formData.destination,
            pickup_date: formData.pickupDate,
            delivery_date: formData.deliveryDate,
            rate: parseFloat(formData.rate) || 0,
            status: "Pending",
            distance: distance,
            description: formData.description
          }
        ])
        .select();
      
      if (error) throw error;
      
      const newLoad = {
        id: data[0].id,
        loadNumber: loadNumber,
        customer: formData.customer,
        origin: formData.origin,
        destination: formData.destination,
        pickupDate: formData.pickupDate,
        deliveryDate: formData.deliveryDate,
        rate: parseFloat(formData.rate) || 0,
        status: "Pending",
        distance: distance,
        description: formData.description,
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
                  <option key={customer.id} value={customer.name}>{customer.name}</option>
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

// Main Dispatching Dashboard Component
export default function DispatchingPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingLoads, setLoadingLoads] = useState(false);
  
  // State for the loads
  const [loads, setLoads] = useState([]);
  const [totalLoads, setTotalLoads] = useState(0);
  
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
  
  // Sample data for customers and drivers
  const customers = [
    { id: 1, name: "ABC Shipping" },
    { id: 2, name: "XYZ Logistics" },
    { id: 3, name: "Global Transport Inc." },
    { id: 4, name: "Fast Freight Services" },
    { id: 5, name: "Acme Delivery" }
  ];
  
  const drivers = [
    { id: 1, name: "John Smith" },
    { id: 2, name: "Maria Garcia" },
    { id: 3, name: "Robert Johnson" },
    { id: 4, name: "Li Wei" },
    { id: 5, name: "James Wilson" }
  ];

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // Get user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) throw userError;
        
        if (user) {
          setUser(user);
          
          // Fetch loads from database
          await fetchLoads();
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);

  const fetchLoads = async () => {
    try {
      setLoadingLoads(true);
      
      // In a real app, you would fetch from your database
      // For now, we'll use sample data
      const { data, error } = await supabase
        .from('loads')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      // If we don't have any data yet (first run), let's use sample data
      if (!data || data.length === 0) {
        const sampleLoads = [
          {
            id: 1,
            loadNumber: "L12345",
            customer: "ABC Shipping",
            origin: "Chicago, IL",
            destination: "New York, NY",
            pickupDate: "2025-03-05",
            deliveryDate: "2025-03-07",
            status: "In Transit",
            driver: "John Smith",
            rate: 2800,
            distance: 790
          },
          {
            id: 2,
            loadNumber: "L12346",
            customer: "XYZ Logistics",
            origin: "Dallas, TX",
            destination: "Houston, TX",
            pickupDate: "2025-03-06",
            deliveryDate: "2025-03-06",
            status: "Pending",
            driver: "",
            rate: 950,
            distance: 240
          },
          {
            id: 3,
            loadNumber: "L12347",
            customer: "Global Transport Inc.",
            origin: "Seattle, WA",
            destination: "Portland, OR",
            pickupDate: "2025-03-04",
            deliveryDate: "2025-03-04",
            status: "Completed",
            driver: "Maria Garcia",
            rate: 1200,
            distance: 174
          },
          {
            id: 4,
            loadNumber: "L12348",
            customer: "Fast Freight Services",
            origin: "Miami, FL",
            destination: "Orlando, FL",
            pickupDate: "2025-03-07",
            deliveryDate: "2025-03-07",
            status: "Assigned",
            driver: "Robert Johnson",
            rate: 750,
            distance: 235
          },
          {
            id: 5,
            loadNumber: "L12349",
            customer: "Acme Delivery",
            origin: "Los Angeles, CA",
            destination: "San Francisco, CA",
            pickupDate: "2025-03-08",
            deliveryDate: "2025-03-09",
            status: "Pending",
            driver: "",
            rate: 1750,
            distance: 383
          },
          {
            id: 6,
            loadNumber: "L12350",
            customer: "XYZ Logistics",
            origin: "Denver, CO",
            destination: "Kansas City, MO",
            pickupDate: "2025-03-06",
            deliveryDate: "2025-03-07",
            status: "Assigned",
            driver: "Li Wei",
            rate: 1600,
            distance: 600
          }
        ];
        
        setLoads(sampleLoads);
        setTotalLoads(sampleLoads.length);
      } else {
        // Map database format to our component format
        const formattedLoads = data.map(load => ({
          id: load.id,
          loadNumber: load.load_number,
          customer: load.customer,
          origin: load.origin,
          destination: load.destination,
          pickupDate: load.pickup_date,
          deliveryDate: load.delivery_date,
          status: load.status,
          driver: load.driver || "",
          rate: load.rate,
          distance: load.distance
        }));
        
        setLoads(formattedLoads);
        setTotalLoads(formattedLoads.length);
      }
    } catch (error) {
      console.error('Error fetching loads:', error);
    } finally {
      setLoadingLoads(false);
    }
  };

  // Filter loads based on search and filter criteria
  const filteredLoads = loads.filter(load => {
    // Filter by search term
    if (filters.search && !load.loadNumber.toLowerCase().includes(filters.search.toLowerCase()) &&
        !load.customer.toLowerCase().includes(filters.search.toLowerCase()) &&
        !(load.driver && load.driver.toLowerCase().includes(filters.search.toLowerCase()))) {
      return false;
    }
    
    // Filter by status
    if (filters.status !== "All" && load.status !== filters.status) {
      return false;
    }
    
    // Filter by date range
    if (filters.dateRange !== "all") {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const pickupDate = new Date(load.pickupDate);
      
      if (filters.dateRange === "today" && pickupDate.toDateString() !== today.toDateString()) {
        return false;
      } else if (filters.dateRange === "tomorrow" && pickupDate.toDateString() !== tomorrow.toDateString()) {
        return false;
      }
      // Other date range filters would be implemented here
    }
    
    return true;
  });
  
  // Sort the filtered loads
  const sortedLoads = [...filteredLoads].sort((a, b) => {
    if (filters.sortBy === "pickupDate") {
      return new Date(a.pickupDate) - new Date(b.pickupDate);
    } else if (filters.sortBy === "deliveryDate") {
      return new Date(a.deliveryDate) - new Date(b.deliveryDate);
    } else if (filters.sortBy === "status") {
      return a.status.localeCompare(b.status);
    } else if (filters.sortBy === "customer") {
      return a.customer.localeCompare(b.customer);
    } else if (filters.sortBy === "rate") {
      return b.rate - a.rate; // High to Low
    }
    return 0;
  });

  // Handle selecting a load to view details
  const handleSelectLoad = (load) => {
    setSelectedLoad(load);
  };

  // Handle closing the load detail modal
  const handleCloseModal = () => {
    setSelectedLoad(null);
  };

  // Handle status change for a load
  const handleStatusChange = (updatedLoad) => {
    // Update the load in the local state
    const updatedLoads = loads.map(load => {
      if (load.id === updatedLoad.id) {
        return updatedLoad;
      }
      return load;
    });
    
    setLoads(updatedLoads);
    setSelectedLoad(updatedLoad);
  };

  // Handle assigning a driver to a load
  const handleAssignDriver = (loadId, driverName) => {
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
    
    // Update the selected load if it's open
    if (selectedLoad && selectedLoad.id === loadId) {
      setSelectedLoad({
        ...selectedLoad,
        driver: driverName,
        status: selectedLoad.status === "Pending" ? "Assigned" : selectedLoad.status
      });
    }
  };

  // Handle creating a new load
  const handleCreateLoad = (newLoad) => {
    setLoads([newLoad, ...loads]);
    setTotalLoads(totalLoads + 1);
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
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard 
                title="Active Loads" 
                value={loads.filter(l => l.status !== "Completed" && l.status !== "Cancelled").length} 
                color="blue" 
              />
              <StatCard 
                title="Pending Loads" 
                value={loads.filter(l => l.status === "Pending").length} 
                color="yellow" 
              />
              <StatCard 
                title="In Transit" 
                value={loads.filter(l => l.status === "In Transit").length} 
                color="purple" 
              />
              <StatCard 
                title="Completed" 
                value={loads.filter(l => l.status === "Completed").length} 
                color="green" 
              />
            </div>
            
            {/* Filter Bar */}
            <FilterBar filters={filters} setFilters={setFilters} />
            
            {/* Loads Grid */}
            <div className="mb-4 flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">
                Loads ({filteredLoads.length} of {totalLoads})
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
            ) : filteredLoads.length === 0 ? (
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
                {sortedLoads.map(load => (
                  <LoadCard
                    key={load.id}
                    load={load}
                    onSelect={handleSelectLoad}
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
          onSave={handleCreateLoad}
          customers={customers}
        />
      )}
    </div>
  );
}