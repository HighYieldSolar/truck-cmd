/* eslint-disable @next/next/no-img-element */
// src/components/dashboard/CustomersPage.js - PART 1
"use client";

import { useState, useEffect, useCallback } from "react";
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
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Mail, 
  Phone, 
  Building, 
  ChevronDown,
  X,
  AlertCircle,
  RefreshCw,
  BarChart2,
  UserPlus,
  ClipboardList,
  FileCheck,
  Info
} from "lucide-react";
import { 
  fetchCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer
} from "@/lib/services/customerService";
import CustomerFormModal from '@/lib/services/CustomerFormModal';


// Component definitions and utility functions go here
// (Do not export CustomersPage here, it will be exported in the later parts)

// EmptyState Component
const EmptyState = ({ filters, openNewCustomerModal }) => {
  return (
    <div className="text-center py-16">
      <h3 className="mt-2 text-sm font-medium text-gray-900">No customers found</h3>
      <p className="mt-1 text-sm text-gray-500">
        {filters.search ? `No results for "${filters.search}"` : "Get started by adding a new customer."}
      </p>
      <div className="mt-6">
        <button
          onClick={openNewCustomerModal}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
        >
          <Plus size={16} className="mr-2" />
          Add Customer
        </button>
      </div>
    </div>
  );
};

// Navigation Sidebar Component

    // Menu items array
  // Sidebar component implementation

// Other component definitions
// ...

// src/components/dashboard/CustomersPage.js - PART 2 (Basic UI Components)

// =========== BASIC UI COMPONENTS ===========

// Navigation Sidebar Component
const Sidebar = ({ activePage = "customers" }) => {
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
        <img 
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
            className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md hover:text-blue-600 transition-colors"
            onClick={async () => {
              try {
                await supabase.auth.signOut();
                window.location.href = '/login';
              } catch (error) {
                console.error('Error signing out:', error);
              }
            }}
          >
            <LogOut size={18} className="mr-3" />
            <span>Logout</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

// Header Component
const Header = ({ user, filters, setFilters }) => {
  return (
    <header className="flex items-center justify-between p-4 bg-white shadow-sm">
      <button className="md:hidden p-2 text-gray-600">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      
      <div className="relative flex-1 max-w-md mx-4">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={18} className="text-gray-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder="Search customers..."
          value={filters.search}
          onChange={(e) => setFilters({...filters, search: e.target.value})}
        />
      </div>
      
      <div className="flex items-center">
        <button className="p-2 text-gray-600 hover:text-blue-600 mx-2 relative">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
            3
          </span>
        </button>
        
        <div className="h-8 w-px bg-gray-200 mx-2"></div>
        
        <div className="relative">
          <button className="flex items-center text-sm font-medium text-gray-700 hover:text-blue-600">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold mr-2">
              {user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <span className="hidden sm:block">{user?.user_metadata?.full_name?.split(' ')[0] || 'User'}</span>
            <ChevronDown size={16} className="ml-1" />
          </button>
        </div>
      </div>
    </header>
  );
};

// Page Header Component
const PageHeader = ({ openNewCustomerModal }) => {
  return (
    <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Customer Management</h1>
        <p className="text-gray-600">View, add, and manage your customer relationships</p>
      </div>
      <div className="mt-4 md:mt-0 flex space-x-3">
        <button 
          onClick={openNewCustomerModal} 
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
        >
          <Plus size={16} className="mr-2" />
          Add Customer
        </button>
      </div>
    </div>
  );
};

// Statistic Card Component
const StatCard = ({ title, value, icon, color = "blue" }) => {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    yellow: "bg-yellow-100 text-yellow-600",
    red: "bg-red-100 text-red-600",
    purple: "bg-purple-100 text-purple-600",
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <div className={`p-2 rounded-md ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
};

// Filter Component
const CustomerFilters = ({ filters, setFilters }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
        <div className="flex-1">
          <label htmlFor="search" className="block text-xs font-medium text-gray-700 mb-1">Search</label>
          <div className="relative">
            <input
              type="text"
              id="search"
              placeholder="Search by name, email, or phone"
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
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Pending">Pending</option>
          </select>
        </div>

        <div className="sm:w-40">
          <label htmlFor="customerType" className="block text-xs font-medium text-gray-700 mb-1">Customer Type</label>
          <select
            id="customerType"
            className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
            value={filters.customerType}
            onChange={(e) => setFilters({...filters, customerType: e.target.value})}
          >
            <option value="All">All Types</option>
            <option value="Shipper">Shipper</option>
            <option value="Consignee">Consignee</option>
            <option value="Broker">Broker</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="sm:w-40">
          <label htmlFor="viewMode" className="block text-xs font-medium text-gray-700 mb-1">View Mode</label>
          <div className="flex rounded-md shadow-sm">
            <button
              onClick={() => setFilters({...filters, viewMode: 'grid'})}
              className={`px-4 py-2 text-sm font-medium ${
                filters.viewMode === 'grid' 
                  ? 'bg-blue-100 text-blue-700 border-blue-300' 
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              } border rounded-l-md flex-1`}
            >
              Grid
            </button>
            <button
              onClick={() => setFilters({...filters, viewMode: 'table'})}
              className={`px-4 py-2 text-sm font-medium ${
                filters.viewMode === 'table' 
                  ? 'bg-blue-100 text-blue-700 border-blue-300' 
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              } border-t border-b border-r rounded-r-md flex-1`}
            >
              Table
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Add these component definitions to your CustomersPage.js file

// Customer Card Component for the grid view
const CustomerCard = ({ customer, onEdit, onDelete }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-medium text-gray-900">{customer.company_name}</h3>
          <div className={`px-2 py-1 text-xs rounded-full ${
            customer.status === 'Active' ? 'bg-green-100 text-green-800' :
            customer.status === 'Inactive' ? 'bg-red-100 text-red-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            {customer.status}
          </div>
        </div>
        
        {customer.contact_name && (
          <div className="flex items-center text-sm text-gray-500 mb-2">
            <Users size={16} className="text-gray-400 mr-2" />
            <span>{customer.contact_name}</span>
          </div>
        )}
        
        {customer.email && (
          <div className="flex items-center text-sm text-gray-500 mb-2">
            <Mail size={16} className="text-gray-400 mr-2" />
            <span className="truncate">{customer.email}</span>
          </div>
        )}
        
        {customer.phone && (
          <div className="flex items-center text-sm text-gray-500 mb-2">
            <Phone size={16} className="text-gray-400 mr-2" />
            <span>{customer.phone}</span>
          </div>
        )}
        
        {customer.address && (
          <div className="flex items-center text-sm text-gray-500 mb-2">
            <Building size={16} className="text-gray-400 mr-2" />
            <span className="truncate">
              {customer.address}
              {customer.city && `, ${customer.city}`}
              {customer.state && `, ${customer.state}`}
            </span>
          </div>
        )}
        
        <div className="flex items-center text-sm text-gray-500 mt-4">
          <span className={`px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800`}>
            {customer.customer_type}
          </span>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end space-x-2">
          <button 
            onClick={() => onEdit(customer)} 
            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-full"
            title="Edit"
          >
            <Edit size={16} />
          </button>
          <button 
            onClick={() => onDelete(customer.id)} 
            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

// Customer Table Row Component for the table view
const CustomerTableRow = ({ customer, onEdit, onDelete }) => {
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
            <Building size={18} className="text-blue-600" />
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{customer.company_name}</div>
            <div className="text-sm text-gray-500">{customer.customer_type}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">{customer.contact_name || 'N/A'}</div>
        <div className="text-sm text-gray-500">{customer.email || 'No email'}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">{customer.phone || 'N/A'}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`px-2 py-1 text-xs rounded-full ${
          customer.status === 'Active' ? 'bg-green-100 text-green-800' :
          customer.status === 'Inactive' ? 'bg-red-100 text-red-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {customer.status}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <button 
          onClick={() => onEdit(customer)} 
          className="text-blue-600 hover:text-blue-900 mr-3"
        >
          <Edit size={16} />
        </button>
        <button 
          onClick={() => onDelete(customer.id)} 
          className="text-red-600 hover:text-red-900"
        >
          <Trash2 size={16} />
        </button>
      </td>
    </tr>
  );
};

// Empty State Component when no customers are found


// Delete Confirmation Modal Component
const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, customerName, isDeleting }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-center mb-4 text-red-600">
          <AlertCircle size={40} />
        </div>
        <h3 className="text-lg font-medium text-center text-gray-900 mb-2">
          Delete Customer
        </h3>
        <p className="text-center text-gray-500 mb-6">
          Are you sure you want to delete <strong>{customerName}</strong>? This action cannot be undone.
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

// =========== EVENT HANDLERS & INTEGRATION ===========

// Main Customer Management Page Component (updated with all functionalities and components integrated)
export default function CustomersPage() {
  // State variables declared in Part 1
  const [user, setUser] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [error, setError] = useState(null);
  
  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    status: 'All',
    customerType: 'All',
    viewMode: 'grid'
  });
  
  // Modal states
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Customer stats
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    shippers: 0,
    consignees: 0,
    brokers: 0
  });

  // Define loadCustomers as a callback so it can be reused in effects
  const loadCustomers = useCallback(async (userId) => {
    try {
      setLoadingCustomers(true);
      const data = await fetchCustomers(userId);
      setCustomers(data);
      
      // Calculate stats
      const total = data.length;
      const active = data.filter(c => c.status === 'Active').length;
      const inactive = data.filter(c => c.status === 'Inactive').length;
      const shippers = data.filter(c => c.customer_type === 'Shipper').length;
      const consignees = data.filter(c => c.customer_type === 'Consignee').length;
      const brokers = data.filter(c => c.customer_type === 'Broker').length;
      
      setStats({
        total,
        active,
        inactive,
        shippers,
        consignees,
        brokers
      });
    } catch (error) {
      console.error('Error loading customers:', error);
      setError('Failed to load customers. Please try refreshing the page.');
    } finally {
      setLoadingCustomers(false);
    }
  }, []);

  // Initial data loading
  useEffect(() => {
    async function initUser() {
      try {
        setLoading(true);
        
        // Get authenticated user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) throw userError;
        
        if (!user) {
          // Redirect to login if not authenticated
          window.location.href = '/login';
          return;
        }
        
        setUser(user);
        
        // Load customers for this user
        await loadCustomers(user.id);
        
        setLoading(false);
      } catch (error) {
        console.error('Error initializing user:', error);
        setError('Authentication error. Please try logging in again.');
        setLoading(false);
      }
    }
    
    initUser();
  }, [loadCustomers]);

  // Filter customers based on search and filter criteria
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = 
      !filters.search ||
      customer.company_name.toLowerCase().includes(filters.search.toLowerCase()) ||
      (customer.contact_name && customer.contact_name.toLowerCase().includes(filters.search.toLowerCase())) ||
      (customer.email && customer.email.toLowerCase().includes(filters.search.toLowerCase())) ||
      (customer.phone && customer.phone.toLowerCase().includes(filters.search.toLowerCase()));
    
    const matchesStatus = filters.status === 'All' || customer.status === filters.status;
    const matchesType = filters.customerType === 'All' || customer.customer_type === filters.customerType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // =========== EVENT HANDLERS ===========
// =========== EVENT HANDLERS ===========
  
const handleSaveCustomer = async (formData) => {
  try {
    setIsSubmitting(true);
    setError(null);
    
    if (currentCustomer) {
      // Update existing customer
      const updatedCustomer = await updateCustomer(currentCustomer.id, formData);
      
      if (updatedCustomer) {
        // Update the customer in the local state
        const updatedCustomers = customers.map(c => 
          c.id === updatedCustomer.id ? updatedCustomer : c
        );
        setCustomers(updatedCustomers);
      } else {
        throw new Error("Failed to update customer");
      }
    } else {
      // Create new customer
      const newCustomer = await createCustomer(user.id, formData);
      
      if (newCustomer) {
        // Add the new customer to the local state
        setCustomers([...customers, newCustomer]);
      } else {
        throw new Error("Failed to create customer");
      }
    }
    
    // Close the modal and reset current customer
    setFormModalOpen(false);
    setCurrentCustomer(null);
    
  } catch (error) {
    console.error('Error saving customer:', error);
    setError('Failed to save customer. Please try again.');
  } finally {
    setIsSubmitting(false);
  }
};

// Add this function right here
const openNewCustomerModal = () => {
  setCurrentCustomer(null);
  setFormModalOpen(true);
};

// Also add these handler functions since they're used but not defined
const handleEditCustomer = (customer) => {
  setCurrentCustomer(customer);
  setFormModalOpen(true);
};

const handleDeleteCustomer = (customerId) => {
  const customerToRemove = customers.find(c => c.id === customerId);
  setCustomerToDelete(customerToRemove);
  setDeleteModalOpen(true);
};

const confirmDeleteCustomer = async () => {
  if (!customerToDelete) return;
  
  try {
    setIsDeleting(true);
    const success = await deleteCustomer(customerToDelete.id);
    
    if (success) {
      setCustomers(customers.filter(c => c.id !== customerToDelete.id));
      setDeleteModalOpen(false);
      setCustomerToDelete(null);
    } else {
      throw new Error("Failed to delete customer");
    }
  } catch (error) {
    console.error('Error deleting customer:', error);
    setError('Failed to delete customer. Please try again.');
  } finally {
    setIsDeleting(false);
  }
};


  // =========== RENDER COMPONENT ===========
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
      <Sidebar activePage="customers" />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header 
          user={user} 
          filters={filters} 
          setFilters={setFilters} 
        />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 bg-gray-100">
          <div className="max-w-7xl mx-auto">
            {/* Page Header */}
            <PageHeader openNewCustomerModal={openNewCustomerModal} />

            {/* Error message */}
            {error && (
              <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
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

            {/* Info Banner */}
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-md mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Info className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    Organize your shippers, consignees, and brokers in one central location. Use customer information across invoices and loads for consistent operations.
                  </p>
                </div>
              </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard 
                title="Total Customers" 
                value={stats.total} 
                icon={<Users size={20} className="text-blue-600" />} 
                color="blue" 
              />
              <StatCard 
                title="Active Customers" 
                value={stats.active} 
                icon={<CheckCircle size={20} className="text-green-600" />} 
                color="green" 
              />
              <StatCard 
                title="Shippers" 
                value={stats.shippers} 
                icon={<Truck size={20} className="text-yellow-600" />} 
                color="yellow" 
              />
              <StatCard 
                title="Brokers" 
                value={stats.brokers} 
                icon={<ClipboardList size={20} className="text-purple-600" />} 
                color="purple" 
              />
            </div>

            {/* Filters */}
            <CustomerFilters filters={filters} setFilters={setFilters} />

            {/* Loading state */}
            {loadingCustomers ? (
              <div className="flex items-center justify-center h-64">
                <RefreshCw size={32} className="animate-spin text-blue-500" />
              </div>
            ) : filteredCustomers.length === 0 ? (
              <EmptyState 
                filters={filters} 
                openNewCustomerModal={openNewCustomerModal} 
              />
            ) : (
              <>
                {/* Grid View */}
                {filters.viewMode === 'grid' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCustomers.map(customer => (
                      <CustomerCard 
                        key={customer.id} 
                        customer={customer} 
                        onEdit={handleEditCustomer}
                        onDelete={handleDeleteCustomer}
                      />
                    ))}
                  </div>
                )}
                
                {/* Table View */}
                {filters.viewMode === 'table' && (
                  <div className="bg-white shadow overflow-hidden rounded-md">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Customer
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Contact
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Phone
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredCustomers.map(customer => (
                            <CustomerTableRow 
                              key={customer.id} 
                              customer={customer} 
                              onEdit={handleEditCustomer}
                              onDelete={handleDeleteCustomer}
                            />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Customer Count */}
            <div className="mt-6 flex items-center justify-between text-sm text-gray-500">
              <div>
                Showing <span className="font-medium">{filteredCustomers.length}</span> of{" "}
                <span className="font-medium">{customers.length}</span> customers
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Modals */}
      <CustomerFormModal 
  isOpen={formModalOpen}
  onClose={() => {
    setFormModalOpen(false);
    setCurrentCustomer(null);
  }}
  customer={currentCustomer}
  onSave={handleSaveCustomer}
  isSubmitting={isSubmitting}
/>
      
      <DeleteConfirmationModal 
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setCustomerToDelete(null);
        }}
        onConfirm={confirmDeleteCustomer}
        customerName={customerToDelete?.company_name}
        isDeleting={isDeleting}
      />
    </div>
  );
}
