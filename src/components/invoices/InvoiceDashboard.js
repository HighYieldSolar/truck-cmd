"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import {
  FileText,
  Plus,
  Download,
  DollarSign,
  AlertCircle,
  Clock,
  CheckCircle,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Sliders,
  RefreshCw,
  BarChart2,
  CreditCard,
  Calendar,
  Mail,
  Printer,
  Truck
} from "lucide-react";
import InvoiceStatusBadge from "@/components/invoices/InvoiceStatusBadge";
import { fetchInvoices, updateInvoiceStatus, getInvoiceStats, recordPayment, deleteInvoice, emailInvoice } from "@/lib/services/invoiceService";
import { subscribeToInvoices } from "@/lib/supabaseRealtime";

// Import custom components that we'll need to create
import InvoiceManagementHeader from "@/components/invoices/InvoiceManagementHeader";
import InvoiceStatsComponent from "@/components/invoices/InvoiceStatsComponent";
import PaymentDueSoonComponent from "@/components/invoices/PaymentDueSoonComponent";
import OverdueInvoicesComponent from "@/components/invoices/OverdueInvoicesComponent";
import QuickActionsComponent from "@/components/invoices/QuickActionsComponent";
import InvoiceListComponent from "@/components/invoices/InvoiceListComponent";
import InvoiceReportsComponent from "@/components/invoices/InvoiceReportsComponent";

// Invoice Stats Card Component
const StatCard = ({ title, value, icon, bgColor, textColor, change, positive }) => {
  return (
    <div className={`${bgColor} rounded-lg shadow p-5`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-2xl font-semibold ${textColor} mt-1`}>{value}</p>
        </div>
        <div className="rounded-md p-2 bg-white bg-opacity-30">
          {icon}
        </div>
      </div>
      {change && (
        <div className="mt-3">
          <p className={`text-sm flex items-center ${positive ? 'text-green-600' : 'text-red-600'}`}>
            {positive ? (
              <ArrowUp size={16} className="mr-1" />
            ) : (
              <ArrowDown size={16} className="mr-1" />
            )}
            <span>{change} from last month</span>
          </p>
        </div>
      )}
    </div>
  );
};

// Invoice Filters Component
const InvoiceFilters = ({ filters, setFilters, onApplyFilters }) => {
  const [localFilters, setLocalFilters] = useState({ ...filters });

  const handleFilterChange = (key, value) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    setFilters(localFilters);
    onApplyFilters(localFilters);
  };

  const handleResetFilters = () => {
    const resetFilters = {
      status: 'all',
      dateRange: 'all',
      search: '',
      sortBy: 'invoice_date',
      sortDirection: 'desc'
    };
    setLocalFilters(resetFilters);
    setFilters(resetFilters);
    onApplyFilters(resetFilters);
  };

  const statusOptions = [
    { value: 'all', label: 'All Invoices' },
    { value: 'paid', label: 'Paid' },
    { value: 'pending', label: 'Pending' },
    { value: 'overdue', label: 'Overdue' },
    { value: 'draft', label: 'Draft' },
    { value: 'sent', label: 'Sent' }
  ];

  const dateRangeOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'last30', label: 'Last 30 Days' },
    { value: 'last90', label: 'Last 90 Days' },
    { value: 'thisMonth', label: 'This Month' },
    { value: 'lastMonth', label: 'Last Month' },
    { value: 'thisYear', label: 'This Year' },
  ];

  const sortOptions = [
    { value: 'invoice_date', label: 'Invoice Date' },
    { value: 'due_date', label: 'Due Date' },
    { value: 'total', label: 'Amount' },
    { value: 'status', label: 'Status' },
    { value: 'customer', label: 'Customer' }
  ];

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6 text-black">
      <div className="flex flex-col md:flex-row flex-wrap md:items-center gap-3">
        <div className="relative w-full md:w-auto">
          <select
            value={localFilters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="relative w-full md:w-auto">
          <select
            value={localFilters.dateRange}
            onChange={(e) => handleFilterChange('dateRange', e.target.value)}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            {dateRangeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="relative w-full md:w-auto">
          <select
            value={localFilters.sortBy}
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                Sort by: {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="relative w-full md:w-auto">
          <select
            value={localFilters.sortDirection}
            onChange={(e) => handleFilterChange('sortDirection', e.target.value)}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>

        <div className="relative w-full md:w-auto md:flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-gray-400" />
          </div>
          <input
            type="text"
            value={localFilters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Search invoices..."
          />
        </div>

        <div className="flex w-full md:w-auto justify-end space-x-2">
          <button
            onClick={handleApplyFilters}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
          >
            Apply
          </button>
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};

// Recent Invoices Table Component
const InvoicesTable = ({ invoices, onMarkAsPaid, onDelete, loading, onViewInvoice }) => {
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  // Handle marking an invoice as paid
  const handleMarkAsPaid = async (invoiceId) => {
    try {
      // Find the invoice to get its total amount
      const invoice = invoices.find(inv => inv.id === invoiceId);
      if (!invoice) {
        throw new Error('Invoice not found');
      }

      // Check if the invoice is already paid or has payments
      if (invoice.status === 'Paid' || (invoice.amount_paid && parseFloat(invoice.amount_paid) >= parseFloat(invoice.total))) {
        console.log('Invoice is already paid or has sufficient payments');
        return;
      }

      // Calculate remaining balance to pay
      const amountPaid = parseFloat(invoice.amount_paid) || 0;
      const total = parseFloat(invoice.total) || 0;
      const remainingBalance = total - amountPaid;

      if (remainingBalance <= 0) {
        console.log('Invoice already has full payment amount');
        // Just update status if needed
        if (invoice.status !== 'Paid') {
          await updateInvoiceStatus(invoiceId, 'Paid');
        }
        return;
      }

      // First record payment for the remaining balance
      const paymentData = {
        amount: remainingBalance,
        method: 'manual',
        date: new Date().toISOString().split('T')[0],
        reference: 'Marked as paid',
        description: `Payment for invoice ${invoice.invoice_number}`,
        status: 'completed'
      };

      console.log('Recording payment for remaining balance:', remainingBalance);

      // Record payment first - this should also update the invoice status to Paid
      // if the payment completes the total
      await recordPayment(invoiceId, paymentData);

      // Update will be handled by the real-time subscription
    } catch (err) {
      console.error('Error marking invoice as paid:', err);
      setError('Failed to update invoice. Please try again.');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {invoices.length === 0 ? (
        <div className="p-6 text-center text-gray-500">
          No invoices found.
        </div>
      ) : (
        <div className="flow-root">
          <ul className="-mb-8">
            {invoices.map((invoice, index) => (
              <li key={invoice.id}>
                <div className="relative pb-8">
                  {index < invoices.length - 1 && (
                    <span className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                  )}
                  <div className="relative flex items-start space-x-3">
                    <div className="flex-1 min-w-0">
                      <div className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <p className="text-sm font-medium text-blue-600 hover:text-blue-800 cursor-pointer" onClick={() => onViewInvoice(invoice.id)}>
                              Invoice #{invoice.invoice_number}
                            </p>
                            <span className="text-xs text-gray-500">
                              Amount: ${invoice.total?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div className="text-sm text-gray-700">
                            <p>Customer: {invoice.customer}</p>
                            <p>Date: {formatDate(invoice.invoice_date)}</p>
                            <p>Due Date: {formatDate(invoice.due_date)}</p>
                            <p>Status: <InvoiceStatusBadge status={invoice.status} /></p>
                          </div>
                        </div>
                        <div className="mt-2 sm:mt-0 flex items-center space-x-2">
                          <button
                            onClick={() => onViewInvoice(invoice.id)}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Details"
                          >
                            <FileText size={18} />
                          </button>
                          {invoice.status.toLowerCase() !== 'paid' && (
                            <button
                              onClick={() => handleMarkAsPaid(invoice.id)}
                              className="text-green-600 hover:text-green-900"
                              title="Mark as Paid"
                            >
                              <DollarSign size={18} />
                            </button>
                          )}
                          <button
                            onClick={() => onDelete(invoice)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path></svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// Delete Invoice Modal Component
const DeleteInvoiceModal = ({ isOpen, onClose, onConfirm, invoice, isDeleting }) => {
  const [deleteAssociatedLoad, setDeleteAssociatedLoad] = useState(false);

  if (!isOpen || !invoice) return null;

  // Check if invoice has an associated load
  const hasAssociatedLoad = invoice.load_id || (invoice.loads && invoice.loads.length > 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-center mb-4 text-red-600">
          <AlertCircle size={40} />
        </div>
        <h3 className="text-lg font-medium text-center mb-2">Delete Invoice</h3>
        <p className="text-center text-gray-500 mb-6">
          Are you sure you want to delete invoice {invoice.invoice_number}? This action cannot be undone.
        </p>

        {/* Show option to delete load if there's an associated load */}
        {hasAssociatedLoad && (
          <div className="mb-6">
            <div className="flex items-center">
              <input
                id="delete-load-checkbox"
                type="checkbox"
                checked={deleteAssociatedLoad}
                onChange={() => setDeleteAssociatedLoad(!deleteAssociatedLoad)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="delete-load-checkbox" className="ml-2 block text-sm text-gray-700">
                Also delete associated load
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-1 ml-6">
              If checked, the load linked to this invoice will also be deleted.
            </p>
          </div>
        )}

        <div className="flex justify-center space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(deleteAssociatedLoad)}
            className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 flex items-center"
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <RefreshCw size={16} className="mr-2 animate-spin" />
                Deleting...
              </>
            ) : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
};

// Quick Action Card Component
const QuickActionCard = ({ title, icon, onClick, bgColor = 'bg-blue-50' }) => {
  return (
    <button
      onClick={onClick}
      className={`${bgColor} p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow flex flex-col items-center justify-center`}
    >
      <div className="rounded-full bg-white p-3 shadow-sm mb-3">
        {icon}
      </div>
      <span className="text-gray-800 font-medium text-sm">{title}</span>
    </button>
  );
};

// Due Soon Widget Component
const DueSoonWidget = ({ invoices, onViewInvoice }) => {
  const today = new Date();
  const dueSoon = invoices
    .filter(invoice => {
      if (invoice.status.toLowerCase() !== 'pending') return false;
      const dueDate = new Date(invoice.due_date);
      const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
      return daysUntilDue >= 0 && daysUntilDue <= 7;
    })
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
    .slice(0, 5);

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Due Soon</h3>
        <Link href="/dashboard/invoices?filter=pending" className="text-sm text-blue-600 hover:text-blue-800 flex items-center">
          View All <ChevronRight size={16} className="ml-1" />
        </Link>
      </div>
      <div className="p-4">
        {dueSoon.length === 0 ? (
          <div className="text-center py-4">
            <CheckCircle size={32} className="mx-auto text-green-500 mb-2" />
            <p className="text-gray-500">No invoices due soon!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {dueSoon.map(invoice => {
              const dueDate = new Date(invoice.due_date);
              const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
              let badgeColor = 'bg-yellow-100 text-yellow-800';
              if (daysUntilDue <= 2) badgeColor = 'bg-red-100 text-red-800';

              return (
                <div
                  key={invoice.id}
                  className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg cursor-pointer border border-gray-100"
                  onClick={() => onViewInvoice(invoice.id)}
                >
                  <div>
                    <p className="font-medium text-gray-900">{invoice.customer}</p>
                    <p className="text-sm text-gray-500">#{invoice.invoice_number}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${invoice.total.toLocaleString()}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${badgeColor}`}>
                      {daysUntilDue === 0 ? 'Due today' : `Due in ${daysUntilDue} days`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// Overdue Widget Component
const OverdueWidget = ({ invoices, onViewInvoice }) => {
  const overdue = invoices
    .filter(invoice => invoice.status.toLowerCase() === 'overdue')
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
    .slice(0, 5);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Overdue Invoices</h3>
        <Link href="/dashboard/invoices?filter=overdue" className="text-sm text-blue-600 hover:text-blue-800 flex items-center">
          View All <ChevronRight size={16} className="ml-1" />
        </Link>
      </div>
      <div className="p-4">
        {overdue.length === 0 ? (
          <div className="text-center py-4">
            <CheckCircle size={32} className="mx-auto text-green-500 mb-2" />
            <p className="text-gray-500">No overdue invoices!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {overdue.map(invoice => {
              const dueDate = new Date(invoice.due_date);
              const today = new Date();
              const daysOverdue = Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24));

              return (
                <div
                  key={invoice.id}
                  className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg cursor-pointer border border-gray-100"
                  onClick={() => onViewInvoice(invoice.id)}
                >
                  <div>
                    <p className="font-medium text-gray-900">{invoice.customer}</p>
                    <p className="text-sm text-gray-500">Due: {formatDate(invoice.due_date)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${invoice.total.toLocaleString()}</p>
                    <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-800">
                      {daysOverdue} days overdue
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// Main InvoiceDashboard Component
export default function InvoiceDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [invoicesLoading, setInvoicesLoading] = useState(true);
  const [error, setError] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [filters, setFilters] = useState({
    status: 'all',
    dateRange: 'all',
    search: '',
    sortBy: 'invoice_date',
    sortDirection: 'desc'
  });
  const [stats, setStats] = useState({
    total: 0,
    paid: 0,
    pending: 0,
    overdue: 0,
    draft: 0
  });
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [upcomingPayments, setUpcomingPayments] = useState([]);
  const [overdueInvoices, setOverdueInvoices] = useState([]);

  // Load dashboard data - memoized with useCallback
  const loadDashboardData = useCallback(async (userId) => {
    try {
      setInvoicesLoading(true);

      // Fetch invoices and stats in parallel
      const [invoiceStats, invoicesData] = await Promise.all([
        getInvoiceStats(userId),
        fetchInvoices(userId, filters)
      ]);

      setStats(invoiceStats);
      setInvoices(invoicesData);
      setFilteredInvoices(invoicesData);

      // Set recent invoices (4 most recent)
      const recent = [...invoicesData].sort((a, b) =>
        new Date(b.invoice_date) - new Date(a.invoice_date)
      ).slice(0, 4);
      setRecentInvoices(recent);

      // Set upcoming payments (due within 7 days)
      const today = new Date();
      const upcoming = invoicesData
        .filter(invoice => {
          if (invoice.status.toLowerCase() !== 'pending') return false;
          const dueDate = new Date(invoice.due_date);
          const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
          return daysUntilDue >= 0 && daysUntilDue <= 7;
        })
        .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
        .slice(0, 5);
      setUpcomingPayments(upcoming);

      // Set overdue invoices
      const overdue = invoicesData
        .filter(invoice => invoice.status.toLowerCase() === 'overdue')
        .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
        .slice(0, 5);
      setOverdueInvoices(overdue);

    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load invoice data. Please try again.');
    } finally {
      setInvoicesLoading(false);
    }
  }, [filters]); // Include filters as a dependency

  // Get user and load initial data
  useEffect(() => {
    async function initialize() {
      try {
        setLoading(true);

        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError) throw userError;

        if (!user) {
          window.location.href = '/login';
          return;
        }

        setUser(user);

        // Load dashboard data
        await loadDashboardData(user.id);

        setLoading(false);
      } catch (err) {
        console.error('Error initializing:', err);
        setError('Failed to load data. Please try again.');
        setLoading(false);
      }
    }

    initialize();
  }, [loadDashboardData]); // Now we can safely include loadDashboardData as a dependency

  // Subscribe to real-time updates
  useEffect(() => {
    if (user) {
      const unsubscribe = subscribeToInvoices(user.id, (payload) => {
        // Refresh data when changes occur
        loadDashboardData(user.id);
      });

      // Clean up subscription on unmount
      return () => {
        unsubscribe();
      };
    }
  }, [user, loadDashboardData]); // Include loadDashboardData here too

  // Apply filters
  const applyFilters = useCallback(async (newFilters) => {
    if (user) {
      try {
        setInvoicesLoading(true);
        const data = await fetchInvoices(user.id, newFilters);
        setFilteredInvoices(data);
      } catch (err) {
        console.error('Error applying filters:', err);
        setError('Failed to filter invoices. Please try again.');
      } finally {
        setInvoicesLoading(false);
      }
    }
  }, [user]);

  // Handle marking an invoice as paid
  const handleMarkAsPaid = async (invoiceId) => {
    try {
      await updateInvoiceStatus(invoiceId, 'Paid');
      // Update will be handled by the real-time subscription
    } catch (err) {
      console.error('Error marking invoice as paid:', err);
      setError('Failed to update invoice. Please try again.');
    }
  };

  // Handle deleting an invoice
  const handleDeleteInvoice = (invoice) => {
    setInvoiceToDelete(invoice);
    setDeleteModalOpen(true);
  };

  // Confirm invoice deletion
  const confirmDeleteInvoice = async (deleteAssociatedLoad = false) => {
    try {
      if (invoiceToDelete && user) {
        setIsDeleting(true);

        // Delete from database with option to delete associated load
        await deleteInvoice(invoiceToDelete.id, deleteAssociatedLoad);

        // Update will be handled by the real-time subscription

        // Close modal
        setDeleteModalOpen(false);
        setInvoiceToDelete(null);
      }
    } catch (err) {
      console.error('Error deleting invoice:', err);
      setError('Failed to delete invoice. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle view invoice
  const handleViewInvoice = (invoiceId) => {
    window.location.href = `/dashboard/invoices/${invoiceId}`;
  };

  // Format currency for display
  const formatCurrency = (amount) => {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-100">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <InvoiceManagementHeader />

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
        <InvoiceStatsComponent
          stats={stats}
        />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left sidebar content */}
          <div className="lg:col-span-1">
            {/* Payment Due Soon Alerts card */}
            <PaymentDueSoonComponent
              upcomingPayments={upcomingPayments}
              handleViewInvoice={handleViewInvoice}
            />

            {/* Overdue Invoices */}
            <OverdueInvoicesComponent
              overdueInvoices={overdueInvoices}
              handleViewInvoice={handleViewInvoice}
            />

            {/* Quick Actions */}
            <QuickActionsComponent />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Invoice List Component */}
            <InvoiceListComponent
              invoices={recentInvoices}
              handleViewInvoice={handleViewInvoice}
              handleMarkAsPaid={handleMarkAsPaid}
              handleDeleteInvoice={handleDeleteInvoice}
              filters={filters}
              setFilters={setFilters}
              onApplyFilters={applyFilters}
              loading={invoicesLoading}
            />
          </div>
        </div>

        {/* Invoice Reports Section */}
        <InvoiceReportsComponent />

        {/* Delete Invoice Modal */}
        <DeleteInvoiceModal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={confirmDeleteInvoice}
          invoice={invoiceToDelete}
          isDeleting={isDeleting}
        />
      </div>
    </div>
  );
}