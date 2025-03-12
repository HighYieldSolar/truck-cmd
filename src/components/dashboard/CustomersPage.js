// src/components/dashboard/CustomersPage.js
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { 
  Plus, 
  Search, 
  RefreshCw,
  AlertCircle,
  Users,
  Building,
  Mail,
  Phone,
  MapPin,
  Edit,
  Trash2,
  Download,
  Filter,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { fetchCustomers, deleteCustomer } from "@/lib/services/customerService";
import DeleteConfirmationModal from "@/components/common/DeleteConfirmationModal";
import EmptyState from "@/components/common/EmptyState";
import CustomerFormModal from "@/lib/services/CustomerFormModal";

// Customer Item Component
const CustomerItem = ({ customer, onEdit, onDelete, isExpanded, onToggleExpand }) => {
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
            <Building size={18} className="text-blue-600" />
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{customer.company_name}</div>
            <div className="text-sm text-gray-500">{customer.customer_type || "Business"}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center text-sm text-gray-900">
          <Mail size={16} className="text-gray-400 mr-2" />
          {customer.email || "—"}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center text-sm text-gray-900">
          <Phone size={16} className="text-gray-400 mr-2" />
          {customer.phone || "—"}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center text-sm text-gray-900">
          <MapPin size={16} className="text-gray-400 mr-2" />
          {customer.city ? (
            <>
              {customer.city}
              {customer.state ? `, ${customer.state}` : ""}
            </>
          ) : (
            "—"
          )}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <button
          onClick={() => onToggleExpand()}
          className="text-blue-600 hover:text-blue-900 mr-3"
          aria-label={isExpanded ? "Collapse details" : "View details"}
        >
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        <button
          onClick={() => onEdit(customer)}
          className="text-blue-600 hover:text-blue-900 mr-3"
          aria-label="Edit customer"
        >
          <Edit size={16} />
        </button>
        <button
          onClick={() => onDelete(customer)}
          className="text-red-600 hover:text-red-900"
          aria-label="Delete customer"
        >
          <Trash2 size={16} />
        </button>
      </td>
    </tr>
  );
};

// Customer Detail Row Component
const CustomerDetailRow = ({ customer, isExpanded }) => {
  if (!isExpanded) return null;

  return (
    <tr>
      <td colSpan="5" className="px-6 py-4 bg-gray-50 border-t border-b border-gray-200">
        <div className="text-sm text-gray-900">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Contact Information</h4>
              <div className="space-y-2">
                <p>
                  <span className="font-medium">Contact Person:</span>{" "}
                  {customer.contact_name || "—"}
                </p>
                <p>
                  <span className="font-medium">Email:</span> {customer.email || "—"}
                </p>
                <p>
                  <span className="font-medium">Phone:</span> {customer.phone || "—"}
                </p>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Address</h4>
              <div className="space-y-2">
                <p>{customer.address || "—"}</p>
                <p>
                  {customer.city}
                  {customer.state ? `, ${customer.state}` : ""}
                  {customer.zip ? ` ${customer.zip}` : ""}
                </p>
              </div>
            </div>
            {customer.notes && (
              <div className="md:col-span-2">
                <h4 className="font-medium mb-2">Notes</h4>
                <p className="text-gray-700">{customer.notes}</p>
              </div>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
};

// Main Customers Page Component
export default function CustomersPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [error, setError] = useState(null);
  const [customers, setCustomers] = useState([]);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [stateFilter, setStateFilter] = useState('All');
  
  // Modal states
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Detail expansion state
  const [expandedCustomerId, setExpandedCustomerId] = useState(null);

  // Stats state
  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeCustomers: 0,
    newCustomers: 0
  });

  // Load customers function
  const loadCustomers = useCallback(async (userId) => {
    try {
      setCustomersLoading(true);
      
      const data = await fetchCustomers(userId);
      setCustomers(data || []);
      
      // Calculate stats
      setStats({
        totalCustomers: data.length,
        activeCustomers: data.filter(c => c.status === 'Active').length,
        newCustomers: data.filter(c => {
          // Consider customers added in the last 30 days as "new"
          const createdDate = new Date(c.created_at);
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          return createdDate >= thirtyDaysAgo;
        }).length
      });
      
      return data;
    } catch (error) {
      console.error('Error loading customers:', error);
      setError('Failed to load customers. Please try refreshing the page.');
      return [];
    } finally {
      setCustomersLoading(false);
    }
  }, []);

  // Initial data loading
  useEffect(() => {
    async function checkUserAndLoadData() {
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
        
        // Fetch customers
        await loadCustomers(user.id);
        
        setLoading(false);
      } catch (error) {
        console.error('Error initializing data:', error);
        setError('Authentication error. Please try logging in again.');
        setLoading(false);
      }
    }

    checkUserAndLoadData();
  }, [loadCustomers]);

  // Handle saving a customer (for both add and edit)
  const handleSaveCustomer = async (customerData) => {
    try {
      if (user) {
        // If this is an edit (customerData has an id), update the customer in database
        if (customerData.id) {
          const { data, error } = await supabase
            .from('customers')
            .update({
              company_name: customerData.company_name,
              contact_name: customerData.contact_name,
              email: customerData.email,
              phone: customerData.phone,
              address: customerData.address,
              city: customerData.city,
              state: customerData.state,
              zip: customerData.zip,
              customer_type: customerData.customer_type,
              status: customerData.status,
              notes: customerData.notes,
              updated_at: new Date().toISOString()
            })
            .eq('id', customerData.id);
            
          if (error) throw error;
        } 
        // If this is a new customer, it will be handled by the CustomerFormModal
        
        // Reload customers after save
        await loadCustomers(user.id);
        
        // Close the modal
        setFormModalOpen(false);
        setCurrentCustomer(null);
      }
    } catch (error) {
      console.error('Error saving customer:', error);
      setError('Something went wrong. Please try again.');
    }
  };

  // Handle customer edit
  const handleEditCustomer = (customer) => {
    setCurrentCustomer(customer);
    setFormModalOpen(true);
  };

  // Handle customer delete
  const handleDeleteCustomer = (customer) => {
    setCustomerToDelete(customer);
    setDeleteModalOpen(true);
  };

  // Toggle customer details expansion
  const handleToggleExpand = (customerId) => {
    setExpandedCustomerId(expandedCustomerId === customerId ? null : customerId);
  };

  // Confirm customer deletion
  const confirmDeleteCustomer = async () => {
    if (customerToDelete) {
      try {
        setIsDeleting(true);
        
        // Delete from Supabase
        const success = await deleteCustomer(customerToDelete.id);
        
        if (!success) {
          throw new Error("Failed to delete customer");
        }
        
        // Reload customers
        if (user) {
          await loadCustomers(user.id);
        }
        
        // Close modal
        setDeleteModalOpen(false);
        setCustomerToDelete(null);
      } catch (error) {
        console.error('Error deleting customer:', error);
        setError('Failed to delete customer. Please try again.');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  // Filter customers based on search term and filters
  const filteredCustomers = customers
    .filter(customer => {
      // Apply search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          (customer.company_name && customer.company_name.toLowerCase().includes(searchLower)) ||
          (customer.contact_name && customer.contact_name.toLowerCase().includes(searchLower)) ||
          (customer.email && customer.email.toLowerCase().includes(searchLower)) ||
          (customer.phone && customer.phone.includes(searchTerm))
        );
      }
      return true;
    })
    .filter(customer => {
      // Apply state filter
      if (stateFilter && stateFilter !== 'All') {
        return customer.state === stateFilter;
      }
      return true;
    });

  // Get unique states for filter dropdown
  const availableStates = [...new Set(customers.map(c => c.state).filter(Boolean))].sort();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <DashboardLayout activePage="customers">
      {/* Main Content */}
      <div className="p-4 bg-gray-100">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Customer Management</h1>
              <p className="text-gray-600">Manage your customers and contacts</p>
            </div>
            <div className="mt-4 md:mt-0 flex space-x-3">
              <button
                onClick={() => {
                  setCurrentCustomer(null);
                  setFormModalOpen(true);
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
              >
                <Plus size={16} className="mr-2" />
                Add Customer
              </button>
              <button
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none"
              >
                <Download size={16} className="mr-2" />
                Export
              </button>
            </div>
          </div>

          {/* Show error if present */}
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

          {/* Stats Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100 mr-4">
                  <Users size={20} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Customers</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.totalCustomers}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100 mr-4">
                  <Users size={20} className="text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Active Customers</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.activeCustomers}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-100 mr-4">
                  <Users size={20} className="text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">New Customers (30d)</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.newCustomers}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-6 bg-white p-4 rounded-lg shadow-sm">
            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
              <div className="flex-1 flex flex-col space-y-2">
                <label htmlFor="search" className="text-sm font-medium text-gray-700">
                  Search
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={16} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="search"
                    placeholder="Search customers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
              </div>
              
              <div className="w-full md:w-56 flex flex-col space-y-2">
                <label htmlFor="state-filter" className="text-sm font-medium text-gray-700">
                  State
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Filter size={16} className="text-gray-400" />
                  </div>
                  <select
                    id="state-filter"
                    value={stateFilter}
                    onChange={(e) => setStateFilter(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="All">All States</option>
                    {availableStates.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="flex-none flex items-end">
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setStateFilter('All');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                >
                  <RefreshCw size={16} className="mr-2 inline-block" />
                  Reset Filters
                </button>
              </div>
            </div>
          </div>
              
          {/* Customers Table */}
          <div className="bg-white shadow overflow-hidden rounded-md">
            <div className="overflow-x-auto">
              {customersLoading ? (
                <div className="p-8 text-center">
                  <RefreshCw size={32} className="animate-spin mx-auto mb-4 text-blue-500" />
                  <p className="text-gray-500">Loading customers...</p>
                </div>
              ) : filteredCustomers.length === 0 ? (
                <EmptyState 
                  message={searchTerm || stateFilter !== 'All' 
                    ? "No customers found matching your search or filters." 
                    : "You haven't added any customers yet."}
                  icon={<Users size={28} className="text-gray-400" />}
                  buttonText="Add Your First Customer"
                  onAction={() => {
                    setCurrentCustomer(null);
                    setFormModalOpen(true);
                  }}
                />
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Phone
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredCustomers.map(customer => (
                      <React.Fragment key={customer.id}>
                        <CustomerItem 
                          customer={customer} 
                          onEdit={handleEditCustomer}
                          onDelete={handleDeleteCustomer}
                          isExpanded={expandedCustomerId === customer.id}
                          onToggleExpand={() => handleToggleExpand(customer.id)}
                        />
                        <CustomerDetailRow
                          customer={customer}
                          isExpanded={expandedCustomerId === customer.id}
                        />
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {formModalOpen && (
        <CustomerFormModal 
          isOpen={formModalOpen}
          onClose={() => {
            setFormModalOpen(false);
            setCurrentCustomer(null);
          }}
          userId={user?.id}
          existingCustomer={currentCustomer}
          onSave={handleSaveCustomer}
          isSubmitting={customersLoading}
        />
      )}
      
      {deleteModalOpen && (
        <DeleteConfirmationModal 
          isOpen={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setCustomerToDelete(null);
          }}
          onConfirm={confirmDeleteCustomer}
          title="Delete Customer"
          itemName={customerToDelete?.company_name}
          message="This will delete all customer information. This action cannot be undone."
          isDeleting={isDeleting}
        />
      )}
    </DashboardLayout>
  );
}