// src/components/dashboard/CustomersPage.js
"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Plus,
  Search,
  RefreshCw,
  AlertCircle,
  Users,
  Mail,
  Phone,
  MapPin,
  Edit,
  Trash2,
  Download,
  Filter,
  ChevronDown,
  ChevronUp,
  Eye,
  UserPlus,
  FileText,
  Building,
  User,
  X,
  Package,
  Briefcase,
  Truck
} from "lucide-react";
import { fetchCustomers, deleteCustomer } from "@/lib/services/customerService";
import DeleteConfirmationModal from "@/components/common/DeleteConfirmationModal";
import EmptyState from "@/components/common/EmptyState";
import NewCustomerModal from "@/components/customers/NewCustomerModal";
import StatusBadge from "@/components/compliance/StatusBadge";

// Customer Summary Component (like ComplianceSummary)
const CustomerSummary = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 hover:shadow-md transition-all">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide">Total</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalCustomers}</p>
          </div>
          <div className="bg-blue-100 p-3 rounded-xl">
            <Users size={20} className="text-blue-600" />
          </div>
        </div>
        <div className="px-4 py-2 bg-gray-50">
          <span className="text-xs text-gray-500">All customers</span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 hover:shadow-md transition-all">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide">Active</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{stats.activeCustomers}</p>
          </div>
          <div className="bg-green-100 p-3 rounded-xl">
            <Users size={20} className="text-green-600" />
          </div>
        </div>
        <div className="px-4 py-2 bg-gray-50">
          <span className="text-xs text-gray-500">Currently active</span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 hover:shadow-md transition-all">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide">New</p>
            <p className="text-2xl font-bold text-purple-600 mt-1">{stats.newCustomers}</p>
          </div>
          <div className="bg-purple-100 p-3 rounded-xl">
            <UserPlus size={20} className="text-purple-600" />
          </div>
        </div>
        <div className="px-4 py-2 bg-gray-50">
          <span className="text-xs text-gray-500">Added this month</span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 hover:shadow-md transition-all">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide">Brokers</p>
            <p className="text-2xl font-bold text-orange-600 mt-1">{stats.brokerCustomers}</p>
          </div>
          <div className="bg-orange-100 p-3 rounded-xl">
            <Briefcase size={20} className="text-orange-600" />
          </div>
        </div>
        <div className="px-4 py-2 bg-gray-50">
          <span className="text-xs text-gray-500">Broker customers</span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 hover:shadow-md transition-all">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide">Shippers</p>
            <p className="text-2xl font-bold text-cyan-600 mt-1">{stats.shipperCustomers}</p>
          </div>
          <div className="bg-cyan-100 p-3 rounded-xl">
            <Package size={20} className="text-cyan-600" />
          </div>
        </div>
        <div className="px-4 py-2 bg-gray-50">
          <span className="text-xs text-gray-500">Shipper customers</span>
        </div>
      </div>
    </div>
  );
};

// Customer Filters Component (like ComplianceFilters)
const CustomerFilters = ({ filters, onFilterChange, onSearch }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 mb-6">
      <div className="bg-gray-50 px-5 py-4 border-b border-gray-200">
        <h3 className="font-medium flex items-center text-gray-700">
          <Filter size={18} className="mr-2 text-gray-500" />
          Filter Customers
        </h3>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              name="status"
              value={filters.status}
              onChange={onFilterChange}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 bg-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending Approval</option>
            </select>
          </div>

          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              name="type"
              value={filters.type}
              onChange={onFilterChange}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 bg-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="direct">Direct Customer</option>
              <option value="broker">Broker</option>
              <option value="freight-forwarder">Freight Forwarder</option>
              <option value="3pl">3PL</option>
              <option value="shipper">Shipper</option>
              <option value="business">Business</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
            <select
              name="state"
              value={filters.state}
              onChange={onFilterChange}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 bg-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All States</option>
              {filters.availableStates.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search size={16} className="text-gray-400" />
              </div>
              <input
                type="text"
                value={filters.search}
                onChange={onSearch}
                className="block w-full pl-10 rounded-lg border border-gray-300 px-3 py-2 text-gray-900 bg-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Search customers..."
              />
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-gray-200 flex justify-between">
          <div className="text-sm text-gray-500">
            Showing {filters.filteredCount} of {filters.totalCount} customers
          </div>
          <button
            onClick={filters.onReset}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
            disabled={!filters.isFiltered}
          >
            <RefreshCw size={14} className="mr-1" />
            Reset filters
          </button>
        </div>
      </div>
    </div>
  );
};

// Customer Table Component (like ComplianceTable)
const CustomerTable = ({ customers, onEdit, onDelete, onView, onAddNew }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 mb-6">
      <div className="bg-gray-50 px-5 py-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="font-medium text-gray-700">Customer Records</h3>
        <button
          onClick={onAddNew}
          className="flex items-center text-sm text-blue-600 hover:text-blue-800"
        >
          <Plus size={16} className="mr-1" />
          Add New
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer Name
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact Info
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Location
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {customers.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-10 text-center text-gray-500">
                  <div>
                    <Users size={32} className="mx-auto text-gray-400 mb-4" />
                    <p className="text-lg font-medium text-gray-900 mb-1">No customers found</p>
                    <p className="text-gray-500 mb-4">Add your first customer to get started</p>
                    <button
                      onClick={onAddNew}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus size={16} className="mr-2" />
                      Add Customer
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              customers.map(customer => (
                <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => onView(customer)}
                      className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {customer.company_name}
                    </button>
                    {customer.contact_name && (
                      <p className="text-xs text-gray-500 mt-1">
                        {customer.contact_name}
                      </p>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {customer.email && (
                        <div className="flex items-center">
                          <Mail size={14} className="text-gray-400 mr-2" />
                          {customer.email}
                        </div>
                      )}
                      {customer.phone && (
                        <div className="flex items-center mt-1">
                          <Phone size={14} className="text-gray-400 mr-2" />
                          {customer.phone}
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {customer.city && customer.state ? (
                        <div className="flex items-center">
                          <MapPin size={14} className="text-gray-400 mr-2" />
                          {customer.city}, {customer.state}
                        </div>
                      ) : customer.state ? (
                        <div className="flex items-center">
                          <MapPin size={14} className="text-gray-400 mr-2" />
                          {customer.state}
                        </div>
                      ) : (
                        <span className="text-gray-500">—</span>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {customer.customer_type || "Business"}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <StatusBadge status={customer.status || "Active"} />
                  </td>

                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center space-x-3">
                      <button
                        onClick={() => onView(customer)}
                        className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                        title="View Details"
                      >
                        <Eye size={18} />
                      </button>

                      <button
                        onClick={() => onEdit(customer)}
                        className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50"
                        title="Edit Customer"
                      >
                        <Edit size={18} />
                      </button>

                      <button
                        onClick={() => onDelete(customer)}
                        className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                        title="Delete Customer"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-gray-700 text-sm">
        Showing {customers.length} customers
      </div>
    </div>
  );
};

// View Customer Modal with modern UI
const ViewCustomerModal = ({ isOpen, onClose, customer }) => {
  if (!isOpen || !customer) return null;

  const getCustomerTypeIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'shipper':
        return <Package size={20} />;
      case 'broker':
        return <Briefcase size={20} />;
      case 'business':
        return <Building size={20} />;
      default:
        return <Users size={20} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-t-xl">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold mb-1">Customer Details</h2>
              <p className="text-blue-100 text-sm">{customer.company_name}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Status and Type Badges */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${getStatusColor(customer.status)}`}>
              {customer.status || "Active"}
            </span>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              {getCustomerTypeIcon(customer.customer_type)}
              {customer.customer_type ? customer.customer_type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) : "Business"}
            </span>
          </div>

          {/* Main Content Grid */}
          <div className="space-y-6">
            {/* Contact Information Card */}
            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Phone size={20} className="mr-2 text-gray-600" />
                Contact Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Contact Name</p>
                  <p className="text-base font-medium text-gray-900">{customer.contact_name || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Email</p>
                  <p className="text-base font-medium text-gray-900">
                    {customer.email ? (
                      <a href={`mailto:${customer.email}`} className="text-blue-600 hover:text-blue-800">
                        {customer.email}
                      </a>
                    ) : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Phone</p>
                  <p className="text-base font-medium text-gray-900">
                    {customer.phone ? (
                      <a href={`tel:${customer.phone}`} className="text-blue-600 hover:text-blue-800">
                        {customer.phone}
                      </a>
                    ) : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Customer Since</p>
                  <p className="text-base font-medium text-gray-900">
                    {customer.created_at
                      ? new Date(customer.created_at).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })
                      : "—"}
                  </p>
                </div>
              </div>
            </div>

            {/* Location Information Card */}
            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <MapPin size={20} className="mr-2 text-gray-600" />
                Location Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-600 mb-1">Address</p>
                  <p className="text-base font-medium text-gray-900">{customer.address || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">City</p>
                  <p className="text-base font-medium text-gray-900">{customer.city || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">State</p>
                  <p className="text-base font-medium text-gray-900">{customer.state || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">ZIP Code</p>
                  <p className="text-base font-medium text-gray-900">{customer.zip || "—"}</p>
                </div>
              </div>
            </div>

            {/* Notes Section */}
            {customer.notes && (
              <div className="bg-blue-50 rounded-lg p-5 border border-blue-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <FileText size={20} className="mr-2 text-blue-600" />
                  Notes
                </h3>
                <p className="text-base text-gray-700 whitespace-pre-wrap">{customer.notes}</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
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
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [stateFilter, setStateFilter] = useState('all');

  // Modal states
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Stats state
  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeCustomers: 0,
    newCustomers: 0,
    brokerCustomers: 0,
    shipperCustomers: 0
  });

  // Load customers function
  const loadCustomers = useCallback(async (userId) => {
    try {
      setCustomersLoading(true);

      const data = await fetchCustomers(userId);
      setCustomers(data || []);

      // Calculate stats
      if (data) {
        // Get the first day of current month
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        setStats({
          totalCustomers: data.length,
          activeCustomers: data.filter(c => c.status === 'active' || c.status === 'Active').length,
          newCustomers: data.filter(c => {
            // Consider customers added this month as "new"
            const createdDate = new Date(c.created_at);
            return createdDate >= firstDayOfMonth;
          }).length,
          brokerCustomers: data.filter(c => c.customer_type === 'broker' || c.customer_type === 'Broker').length,
          shipperCustomers: data.filter(c => c.customer_type === 'shipper' || c.customer_type === 'Shipper').length
        });
      }

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


  // Handle customer edit
  const handleEditCustomer = (customer) => {
    setCurrentCustomer(customer);
    setFormModalOpen(true);
  };

  // Handle customer view
  const handleViewCustomer = (customer) => {
    setCurrentCustomer(customer);
    setViewModalOpen(true);
  };

  // Handle customer delete
  const handleDeleteCustomer = (customer) => {
    setCustomerToDelete(customer);
    setDeleteModalOpen(true);
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
      // Apply status filter (handle case insensitive)
      if (statusFilter && statusFilter !== 'all') {
        return customer.status?.toLowerCase() === statusFilter.toLowerCase();
      }
      return true;
    })
    .filter(customer => {
      // Apply type filter
      if (typeFilter && typeFilter !== 'all') {
        return customer.customer_type === typeFilter;
      }
      return true;
    })
    .filter(customer => {
      // Apply state filter
      if (stateFilter && stateFilter !== 'all') {
        return customer.state === stateFilter;
      }
      return true;
    });

  // Get unique states for filter dropdown
  const availableStates = [...new Set(customers.map(c => c.state).filter(Boolean))].sort();

  // Reset all filters
  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setTypeFilter('all');
    setStateFilter('all');
  };

  // Check if any filters are applied
  const isFiltered = searchTerm !== '' || statusFilter !== 'all' || typeFilter !== 'all' || stateFilter !== 'all';

  // Handle filter change
  const handleFilterChange = (e) => {
    const { name, value } = e.target;

    switch (name) {
      case 'status':
        setStatusFilter(value);
        break;
      case 'type':
        setTypeFilter(value);
        break;
      case 'state':
        setStateFilter(value);
        break;
      default:
        break;
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
    <DashboardLayout activePage="customers">
      <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-100">
        <div className="max-w-7xl mx-auto">
          {/* Header with background */}
          <div className="mb-8 bg-gradient-to-r from-blue-600 to-blue-400 rounded-xl shadow-md p-6 text-white">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="mb-4 md:mb-0">
                <h1 className="text-3xl font-bold mb-1">Customer Management</h1>
                <p className="text-blue-100">Organize and manage all your customer relationships</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => {
                    setCurrentCustomer(null);
                    setFormModalOpen(true);
                  }}
                  className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors shadow-sm flex items-center font-medium"
                >
                  <Plus size={18} className="mr-2" />
                  Add Customer
                </button>
                <button
                  className="px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors shadow-sm flex items-center font-medium"
                >
                  <Download size={18} className="mr-2" />
                  Export Data
                </button>
              </div>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Statistics */}
          <CustomerSummary stats={stats} />

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Sidebar */}
            <div className="lg:col-span-1">
              {/* Customer Types */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6 border border-gray-200">
                <div className="bg-blue-500 px-5 py-4 text-white">
                  <h3 className="font-semibold flex items-center">
                    <Building size={18} className="mr-2" />
                    Customer Types
                  </h3>
                </div>
                <div className="p-4">
                  {(() => {
                    // Get unique customer types that are actually in use
                    const usedTypes = [...new Set(customers.map(c => c.customer_type).filter(Boolean))];
                    
                    // Map to display data
                    const typeMap = {
                      'direct': { label: 'Direct Customer', icon: Building },
                      'broker': { label: 'Broker', icon: Briefcase },
                      'freight-forwarder': { label: 'Freight Forwarder', icon: Truck },
                      '3pl': { label: '3PL', icon: Package },
                      'shipper': { label: 'Shipper', icon: Package },
                      'business': { label: 'Business', icon: Building },
                      'other': { label: 'Other', icon: Users }
                    };
                    
                    // Only show types that are in use
                    const typesToShow = usedTypes
                      .filter(type => type) // Filter out null/undefined
                      .map(type => {
                        const typeKey = type.toLowerCase();
                        const typeInfo = typeMap[typeKey] || { label: type, icon: Users };
                        const count = customers.filter(c => 
                          c.customer_type === type || 
                          c.customer_type?.toLowerCase() === typeKey
                        ).length;
                        
                        return {
                          value: typeKey,
                          label: typeInfo.label,
                          icon: typeInfo.icon,
                          count
                        };
                      })
                      .sort((a, b) => b.count - a.count); // Sort by count descending
                    
                    if (typesToShow.length === 0) {
                      return (
                        <div className="text-center py-8 text-gray-500">
                          <Users size={36} className="mx-auto mb-2 text-gray-400" />
                          <p className="text-sm">No customer types in use yet</p>
                        </div>
                      );
                    }
                    
                    return (
                      <>
                        {typesToShow.map(type => {
                          const Icon = type.icon;
                          return (
                            <div
                              key={type.value}
                              className={`mb-2 p-3 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                                typeFilter === type.value ? 'bg-blue-50 border-blue-200 border' : 'bg-gray-50 hover:bg-blue-50'
                              }`}
                              onClick={() => setTypeFilter(typeFilter === type.value ? 'all' : type.value)}
                            >
                              <div className="flex items-center">
                                <Icon size={16} className="text-blue-600 mr-2" />
                                <span className="text-sm font-medium text-gray-700">{type.label}</span>
                              </div>
                              <span className="text-xs font-medium px-2 py-1 bg-white rounded-full text-gray-600 shadow-sm">
                                {type.count}
                              </span>
                            </div>
                          );
                        })}
                      </>
                    );
                  })()}

                  <div className="mt-2 pt-2 border-t border-gray-200 text-center">
                    <button
                      onClick={() => {
                        setCurrentCustomer(null);
                        setFormModalOpen(true);
                      }}
                      className="text-sm text-blue-600 hover:text-blue-800 flex items-center justify-center w-full"
                    >
                      Add new customer
                      <Plus size={14} className="ml-1" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Popular States */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6 border border-gray-200">
                <div className="bg-blue-500 px-5 py-4 text-white">
                  <h3 className="font-semibold flex items-center">
                    <MapPin size={18} className="mr-2" />
                    Customer Locations
                  </h3>
                </div>
                <div className="p-4">
                  {availableStates.length > 0 ? (
                    availableStates.slice(0, 5).map(state => {
                      const count = customers.filter(c => c.state === state).length;

                      return (
                        <div
                          key={state}
                          className={`mb-3 p-3 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${stateFilter === state ? 'bg-blue-50 border-blue-200 border' : 'bg-gray-50 hover:bg-blue-50'
                            }`}
                          onClick={() => setStateFilter(stateFilter === state ? 'all' : state)}
                        >
                          <div className="flex items-center">
                            <MapPin size={16} className="text-blue-600 mr-2" />
                            <span className="text-sm font-medium text-gray-700">{state}</span>
                          </div>
                          <span className="text-xs font-medium px-2 py-1 bg-white rounded-full text-gray-600 shadow-sm">
                            {count}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <MapPin size={36} className="mx-auto mb-2 text-gray-400" />
                      <p>No location data available</p>
                    </div>
                  )}

                  {availableStates.length > 5 && (
                    <div className="mt-2 pt-2 border-t border-gray-200 text-center">
                      <button
                        onClick={() => {
                          // Show location filter
                        }}
                        className="text-sm text-blue-600 hover:text-blue-800 flex items-center justify-center w-full"
                      >
                        View all states
                        <ChevronDown size={14} className="ml-1" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {/* Filters */}
              <CustomerFilters
                filters={{
                  status: statusFilter,
                  type: typeFilter,
                  state: stateFilter,
                  search: searchTerm,
                  availableStates,
                  filteredCount: filteredCustomers.length,
                  totalCount: customers.length,
                  isFiltered,
                  onReset: resetFilters
                }}
                onFilterChange={handleFilterChange}
                onSearch={(e) => setSearchTerm(e.target.value)}
              />

              {/* Customers Table */}
              <CustomerTable
                customers={filteredCustomers}
                onEdit={handleEditCustomer}
                onDelete={handleDeleteCustomer}
                onView={handleViewCustomer}
                onAddNew={() => {
                  setCurrentCustomer(null);
                  setFormModalOpen(true);
                }}
              />
            </div>
          </div>
        </div>

        {/* Modals */}
        <NewCustomerModal
          isOpen={formModalOpen}
          onClose={() => {
            setFormModalOpen(false);
            setCurrentCustomer(null);
          }}
          onCustomerCreated={() => {
            if (user) {
              loadCustomers(user.id);
            }
          }}
          initialData={currentCustomer}
        />

        <ViewCustomerModal
          isOpen={viewModalOpen}
          onClose={() => {
            setViewModalOpen(false);
            setCurrentCustomer(null);
          }}
          customer={currentCustomer}
        />

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
      </main>
    </DashboardLayout>
  );
}