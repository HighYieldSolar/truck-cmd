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

// Main Customer Management Page Component
export default function CustomersPage() {
  // =========== STATE MANAGEMENT ===========
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

  // =========== DATA FETCHING ===========
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
  // These will be defined in Part 3

  // =========== COMPONENT STRUCTURE ===========
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar Component will go here */}
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header will go here */}
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 bg-gray-100">
          <div className="max-w-7xl mx-auto">
            {/* Page Content will go here */}
          </div>
        </main>
      </div>

      {/* Modals will go here */}
    </div>
  );
}

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
  
  // Handle creating or updating customer
  const handleSaveCustomer = async (formData) => {
    if (!user) return;
    
    try {
      setIsSubmitting(true);
      
      if (currentCustomer) {
        // Update existing customer
        const updatedCustomer = await updateCustomer(currentCustomer.id, formData);
        
        if (updatedCustomer) {
          // Update the customer in the local state
          setCustomers(customers.map(c => 
            c.id === updatedCustomer.id ? updatedCustomer : c
          ));
        }
      } else {
        // Create new customer
        const newCustomer = await createCustomer(user.id, formData);
        
        if (newCustomer) {
          // Add the new customer to the local state
          setCustomers([...customers, newCustomer]);
        }
      }
      
      // Close modal and reset current customer
      setFormModalOpen(false);
      setCurrentCustomer(null);
      
      // Recalculate stats
      const updatedCustomers = await fetchCustomers(user.id);
      const total = updatedCustomers.length;
      const active = updatedCustomers.filter(c => c.status === 'Active').length;
      const inactive = updatedCustomers.filter(c => c.status === 'Inactive').length;
      const shippers = updatedCustomers.filter(c => c.customer_type === 'Shipper').length;
      const consignees = updatedCustomers.filter(c => c.customer_type === 'Consignee').length;
      const brokers = updatedCustomers.filter(c => c.customer_type === 'Broker').length;
      
      setStats({
        total,
        active,
        inactive,
        shippers,
        consignees,
        brokers
      });
    } catch (error) {
      console.error('Error saving customer:', error);
      setError('Failed to save customer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle customer edit
  const handleEditCustomer = (customer) => {
    setCurrentCustomer(customer);
    setFormModalOpen(true);
  };

  // Handle customer delete
  const handleDeleteCustomer = (id) => {
    const customerToRemove = customers.find(c => c.id === id);
    setCustomerToDelete(customerToRemove);
    setDeleteModalOpen(true);
  };

  // Confirm customer deletion
  const confirmDeleteCustomer = async () => {
    if (!customerToDelete) return;
    
    try {
      setIsDeleting(true);
      
      // Delete from database
      const success = await deleteCustomer(customerToDelete.id);
      
      if (success) {
        // Remove from local state
        setCustomers(customers.filter(c => c.id !== customerToDelete.id));
        
        // Recalculate stats
        if (user) {
          const updatedCustomers = await fetchCustomers(user.id);
          const total = updatedCustomers.length;
          const active = updatedCustomers.filter(c => c.status === 'Active').length;
          const inactive = updatedCustomers.filter(c => c.status === 'Inactive').length;
          const shippers = updatedCustomers.filter(c => c.customer_type === 'Shipper').length;
          const consignees = updatedCustomers.filter(c => c.customer_type === 'Consignee').length;
          const brokers = updatedCustomers.filter(c => c.customer_type === 'Broker').length;
          
          setStats({
            total,
            active,
            inactive,
            shippers,
            consignees,
            brokers
          });
        }
      } else {
        setError('Failed to delete customer. Please try again.');
      }
      
      // Close modal and reset customer to delete
      setDeleteModalOpen(false);
      setCustomerToDelete(null);
    } catch (error) {
      console.error('Error deleting customer:', error);
      setError('Failed to delete customer. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Open new customer modal
  const openNewCustomerModal = () => {
    setCurrentCustomer(null);
    setFormModalOpen(true);
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

// =========== COMPLETE CUSTOMER FORM MODAL ===========
// This is the complete version of the CustomerFormModal with all the form fields included

const CustomerFormModal = ({ isOpen, onClose, customer, onSave, isSubmitting }) => {
  const [formData, setFormData] = useState({
    company_name: '',
    contact_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    customer_type: 'Shipper',
    status: 'Active',
    notes: ''
  });
  
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (customer) {
      setFormData({
        ...customer
      });
    } else {
      // Reset form for new customer
      setFormData({
        company_name: '',
        contact_name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zip: '',
        customer_type: 'Shipper',
        status: 'Active',
        notes: ''
      });
    }
    
    // Reset errors when opening/closing modal
    setErrors({});
  }, [customer, isOpen]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.company_name) {
      newErrors.company_name = 'Company name is required';
    }
    
    if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: undefined
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    await onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b p-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {customer ? "Edit Customer" : "Add New Customer"}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={isSubmitting}
          >
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="company_name" className="block text-sm font-medium text-gray-700">
                Company Name *
              </label>
              <input
                type="text"
                id="company_name"
                name="company_name"
                value={formData.company_name}
                onChange={handleChange}
                className={`block w-full border ${errors.company_name ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'} rounded-md shadow-sm p-2`}
                required
              />
              {errors.company_name && (
                <p className="text-red-500 text-xs mt-1">{errors.company_name}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <label htmlFor="contact_name" className="block text-sm font-medium text-gray-700">
                Contact Person
              </label>
              <input
                type="text"
                id="contact_name"
                name="contact_name"
                value={formData.contact_name}
                onChange={handleChange}
                className="block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`block w-full border ${errors.email ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'} rounded-md shadow-sm p-2`}
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                Address
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                City
              </label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                  State
                </label>
                <input
                  type="text"
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="zip" className="block text-sm font-medium text-gray-700">
                  ZIP Code
                </label>
                <input
                  type="text"
                  id="zip"
                  name="zip"
                  value={formData.zip}
                  onChange={handleChange}
                  className="block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="customer_type" className="block text-sm font-medium text-gray-700">
                Customer Type
              </label>
              <select
                id="customer_type"
                name="customer_type"
                value={formData.customer_type}
                onChange={handleChange}
                className="block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Shipper">Shipper</option>
                <option value="Consignee">Consignee</option>
                <option value="Broker">Broker</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                rows="3"
                value={formData.notes}
                onChange={handleChange}
                className="block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
              ></textarea>
            </div>
          </div>
          
          <div className="mt-8 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 flex items-center"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw size={16} className="animate-spin mr-2" />
                  {customer ? "Updating..." : "Creating..."}
                </>
              ) : (
                customer ? "Update Customer" : "Create Customer"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};