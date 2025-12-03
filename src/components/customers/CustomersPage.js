"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Plus,
  Download,
  RefreshCw,
  Users,
  Lock
} from "lucide-react";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { LimitReachedPrompt } from "@/components/billing/UpgradePrompt";

// Components
import CustomerStats from "./CustomerStats";
import CustomerFilterBar from "./CustomerFilterBar";
import TopCustomers from "./TopCustomers";
import CustomerCategories from "./CustomerCategories";
import CustomerTable from "./CustomerTable";
import CustomerForm from "./CustomerForm";
import CustomerViewModal from "./CustomerViewModal";
import CustomerDeletionModal from "./CustomerDeletionModal";

// Utilities
import { fetchCustomers, deleteCustomer } from "@/lib/services/customerService";
import { getUserFriendlyError } from "@/lib/utils/errorMessages";
import { usePagination } from "@/hooks/usePagination";
import { OperationMessage, EmptyState } from "@/components/ui/OperationMessage";

const ITEMS_PER_PAGE = 10;

export default function CustomersPage() {
  // User state
  const [user, setUser] = useState(null);

  // Data state
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Feature access for resource limits
  const { checkResourceUpgrade, getResourceLimit } = useFeatureAccess();

  // Message state
  const [message, setMessage] = useState(null);

  // Filter state
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    type: 'all',
    state: 'all',
    sortBy: 'name'
  });

  // Modal state
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Initialize user and load data
  useEffect(() => {
    async function initialize() {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;

        if (!user) {
          window.location.href = '/login';
          return;
        }

        setUser(user);
        await loadCustomers(user.id);
      } catch (error) {
        setMessage({ type: 'error', text: getUserFriendlyError(error) });
        setIsLoading(false);
      }
    }

    initialize();
  }, []);

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('customers_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'customers',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          loadCustomers(user.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Load customers
  const loadCustomers = async (userId) => {
    try {
      setIsLoading(true);
      const data = await fetchCustomers(userId);
      setCustomers(data || []);
    } catch (error) {
      setMessage({ type: 'error', text: getUserFriendlyError(error) });
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate stats
  const stats = useMemo(() => {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return {
      total: customers.length,
      active: customers.filter(c =>
        (c.status || 'Active').toLowerCase() === 'active'
      ).length,
      newThisMonth: customers.filter(c =>
        new Date(c.created_at) >= firstDayOfMonth
      ).length,
      brokers: customers.filter(c =>
        (c.customer_type || '').toLowerCase() === 'broker'
      ).length
    };
  }, [customers]);

  // Get available states for filter
  const availableStates = useMemo(() => {
    return [...new Set(customers.map(c => c.state).filter(Boolean))].sort();
  }, [customers]);

  // Filter and sort customers
  const filteredCustomers = useMemo(() => {
    let result = [...customers];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(c =>
        (c.company_name || '').toLowerCase().includes(searchLower) ||
        (c.contact_name || '').toLowerCase().includes(searchLower) ||
        (c.email || '').toLowerCase().includes(searchLower) ||
        (c.phone || '').includes(filters.search)
      );
    }

    // Status filter
    if (filters.status !== 'all') {
      result = result.filter(c =>
        (c.status || 'active').toLowerCase() === filters.status.toLowerCase()
      );
    }

    // Type filter
    if (filters.type !== 'all') {
      result = result.filter(c =>
        (c.customer_type || '').toLowerCase() === filters.type.toLowerCase()
      );
    }

    // State filter
    if (filters.state !== 'all') {
      result = result.filter(c => c.state === filters.state);
    }

    // Sort
    switch (filters.sortBy) {
      case 'newest':
        result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        break;
      case 'type':
        result.sort((a, b) => (a.customer_type || '').localeCompare(b.customer_type || ''));
        break;
      default: // name
        result.sort((a, b) => (a.company_name || '').localeCompare(b.company_name || ''));
    }

    return result;
  }, [customers, filters]);

  // Pagination
  const pagination = usePagination(filteredCustomers, { itemsPerPage: ITEMS_PER_PAGE });

  // Reset filters
  const resetFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      type: 'all',
      state: 'all',
      sortBy: 'name'
    });
  };

  // Handle type selection from sidebar
  const handleTypeSelect = (type) => {
    setFilters(prev => ({ ...prev, type }));
    pagination.reset();
  };

  // Handle view customer
  const handleViewCustomer = (customer) => {
    setSelectedCustomer(customer);
    setViewModalOpen(true);
  };

  // Handle edit customer
  const handleEditCustomer = (customer) => {
    setSelectedCustomer(customer);
    setFormModalOpen(true);
  };

  // Handle delete customer
  const handleDeleteCustomer = (customer) => {
    setSelectedCustomer(customer);
    setDeleteModalOpen(true);
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (!selectedCustomer) return;

    setIsDeleting(true);
    try {
      const success = await deleteCustomer(selectedCustomer.id);
      if (!success) {
        throw new Error('Failed to delete customer');
      }

      setMessage({ type: 'success', text: `${selectedCustomer.company_name} has been deleted.` });
      setDeleteModalOpen(false);
      setSelectedCustomer(null);

      if (user) {
        await loadCustomers(user.id);
      }
    } catch (error) {
      setMessage({ type: 'error', text: getUserFriendlyError(error) });
    } finally {
      setIsDeleting(false);
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    if (filteredCustomers.length === 0) {
      setMessage({ type: 'warning', text: 'No customers to export.' });
      return;
    }

    const headers = ['Company Name', 'Contact Name', 'Email', 'Phone', 'Address', 'City', 'State', 'ZIP', 'Type', 'Status'];
    const rows = filteredCustomers.map(c => [
      c.company_name || '',
      c.contact_name || '',
      c.email || '',
      c.phone || '',
      c.address || '',
      c.city || '',
      c.state || '',
      c.zip || '',
      c.customer_type || '',
      c.status || 'Active'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `customers_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    setMessage({ type: 'success', text: `Exported ${filteredCustomers.length} customers to CSV.` });
  };

  // Get recent customers for sidebar
  const recentCustomers = useMemo(() => {
    return [...customers]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5);
  }, [customers]);

  // Initial loading state
  if (isLoading && customers.length === 0) {
    return (
      <DashboardLayout activePage="customers">
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw size={32} className="animate-spin text-blue-500" />
            <p className="text-gray-600 dark:text-gray-400">Loading customers...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activePage="customers">
      <main className="flex-1 overflow-y-auto bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-700 dark:to-blue-600 rounded-xl shadow-lg p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="text-white">
                <h1 className="text-2xl md:text-3xl font-bold">Customer Management</h1>
                <p className="text-blue-100 mt-1">
                  Manage your customer relationships and contacts
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                {(() => {
                  const customerLimit = checkResourceUpgrade('customers', customers.length);
                  if (customerLimit.needsUpgrade) {
                    return (
                      <Link
                        href="/dashboard/billing"
                        className="px-4 py-2.5 bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200 transition-colors shadow-sm flex items-center gap-2 font-medium"
                      >
                        <Lock size={18} />
                        Limit Reached ({customers.length}/{customerLimit.limit})
                      </Link>
                    );
                  }
                  return (
                    <button
                      onClick={() => {
                        setSelectedCustomer(null);
                        setFormModalOpen(true);
                      }}
                      className="px-4 py-2.5 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors shadow-sm flex items-center gap-2 font-medium"
                    >
                      <Plus size={18} />
                      Add Customer
                    </button>
                  );
                })()}
                <button
                  onClick={exportToCSV}
                  className="px-4 py-2.5 bg-blue-700 dark:bg-blue-800 text-white rounded-lg hover:bg-blue-800 dark:hover:bg-blue-900 transition-colors shadow-sm flex items-center gap-2 font-medium"
                >
                  <Download size={18} />
                  Export
                </button>
              </div>
            </div>
          </div>

          {/* Operation Message */}
          <OperationMessage
            message={message}
            onDismiss={() => setMessage(null)}
          />

          {/* Stats */}
          <CustomerStats stats={stats} isLoading={isLoading} />

          {/* Customer Limit Warning Banner */}
          {(() => {
            const customerLimit = checkResourceUpgrade('customers', customers.length);
            const limit = getResourceLimit('customers');
            if (customerLimit.needsUpgrade) {
              return (
                <LimitReachedPrompt
                  limitName="customers"
                  currentCount={customers.length}
                  limit={limit}
                  nextTier={customerLimit.nextTier}
                  resourceName="Customers"
                  className="mb-6"
                />
              );
            }
            if (limit !== Infinity && customers.length >= Math.floor(limit * 0.8) && !customerLimit.needsUpgrade) {
              return (
                <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Lock size={20} className="text-amber-600 dark:text-amber-400" />
                    <p className="text-amber-800 dark:text-amber-200 text-sm">
                      <span className="font-medium">Approaching limit:</span> You have {customers.length} of {limit} customers.
                      <Link href="/dashboard/billing" className="ml-2 underline hover:no-underline">
                        Upgrade for unlimited customers
                      </Link>
                    </p>
                  </div>
                </div>
              );
            }
            return null;
          })()}

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              <TopCustomers
                customers={recentCustomers}
                isLoading={isLoading}
                onViewCustomer={handleViewCustomer}
              />
              <CustomerCategories
                customers={customers}
                selectedType={filters.type}
                onTypeSelect={handleTypeSelect}
                isLoading={isLoading}
              />
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3 space-y-6">
              {/* Filter Bar */}
              <CustomerFilterBar
                filters={filters}
                setFilters={setFilters}
                availableStates={availableStates}
                onReset={resetFilters}
              />

              {/* Empty State or Table */}
              {!isLoading && customers.length === 0 ? (
                (() => {
                  const customerLimit = checkResourceUpgrade('customers', customers.length);
                  if (customerLimit.needsUpgrade) {
                    return (
                      <div className="text-center py-12">
                        <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                          <Users className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">No customers yet</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-4">Upgrade your plan to add customers.</p>
                        <Link
                          href="/dashboard/billing"
                          className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-amber-800 bg-amber-100 hover:bg-amber-200"
                        >
                          <Lock size={16} className="mr-2" />
                          Upgrade Plan
                        </Link>
                      </div>
                    );
                  }
                  return (
                    <EmptyState
                      icon={Users}
                      title="No customers yet"
                      description="Start building your customer list by adding your first customer."
                      action={{
                        label: 'Add Customer',
                        icon: Plus,
                        onClick: () => {
                          setSelectedCustomer(null);
                          setFormModalOpen(true);
                        }
                      }}
                    />
                  );
                })()
              ) : (
                <CustomerTable
                  customers={pagination.paginatedData}
                  pagination={pagination}
                  onView={handleViewCustomer}
                  onEdit={handleEditCustomer}
                  onDelete={handleDeleteCustomer}
                  isLoading={isLoading}
                />
              )}
            </div>
          </div>
        </div>

        {/* Modals */}
        <CustomerForm
          isOpen={formModalOpen}
          onClose={() => {
            setFormModalOpen(false);
            setSelectedCustomer(null);
          }}
          onSuccess={() => {
            if (user) loadCustomers(user.id);
            setMessage({
              type: 'success',
              text: selectedCustomer
                ? 'Customer updated successfully.'
                : 'Customer created successfully.'
            });
          }}
          initialData={selectedCustomer}
        />

        <CustomerViewModal
          isOpen={viewModalOpen}
          onClose={() => {
            setViewModalOpen(false);
            setSelectedCustomer(null);
          }}
          customer={selectedCustomer}
          onEdit={handleEditCustomer}
        />

        <CustomerDeletionModal
          isOpen={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setSelectedCustomer(null);
          }}
          onConfirm={confirmDelete}
          customer={selectedCustomer}
          isDeleting={isDeleting}
        />
      </main>
    </DashboardLayout>
  );
}
