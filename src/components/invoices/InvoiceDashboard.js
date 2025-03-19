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
    <div className="bg-white p-4 rounded-lg shadow mb-6">
      <div className="flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 md:space-x-4">
        <div className="relative inline-block w-full md:w-auto">
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
        
        <div className="relative inline-block w-full md:w-auto">
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
        
        <div className="relative inline-block w-full md:w-auto">
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
        
        <div className="relative inline-block w-full md:w-auto">
          <select
            value={localFilters.sortDirection}
            onChange={(e) => handleFilterChange('sortDirection', e.target.value)}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>
        
        <div className="relative flex-grow">
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
        
        <div className="flex space-x-2">
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
    <div className="overflow-x-auto bg-white rounded-lg shadow">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Invoice #
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Customer
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Due Date
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Amount
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
          {invoices.map((invoice) => (
            <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-blue-600 hover:text-blue-800 cursor-pointer" onClick={() => onViewInvoice(invoice.id)}>
                  {invoice.invoice_number}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{invoice.customer}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-500">{formatDate(invoice.invoice_date)}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-500">{formatDate(invoice.due_date)}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">${invoice.total?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <InvoiceStatusBadge status={invoice.status} />
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex items-center justify-end space-x-2">
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
                    className="text-gray-600 hover:text-gray-900"
                    title="Download PDF"
                  >
                    <Download size={18} />
                  </button>
                  <button 
                    onClick={() => onDelete(invoice.id)}
                    className="text-red-600 hover:text-red-900"
                    title="Delete"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18"></path>
                      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Delete Invoice Modal Component
const DeleteInvoiceModal = ({ isOpen, onClose, onConfirm, invoiceNumber, isDeleting }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-center mb-4 text-red-600">
          <AlertCircle size={40} />
        </div>
        <h3 className="text-lg font-medium text-center mb-2">Delete Invoice</h3>
        <p className="text-center text-gray-500 mb-6">
          Are you sure you want to delete invoice {invoiceNumber}? This action cannot be undone.
        </p>
        <div className="flex justify-center space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
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
  const [stats, setStats] = useState({
    total: 0,
    paid: 0,
    pending: 0,
    overdue: 0,
    count: 0
  });
  
  // Invoice state
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  
  // Filter state
  const [filters, setFilters] = useState({
    status: 'all',
    dateRange: 'all',
    search: '',
    sortBy: 'invoice_date',
    sortDirection: 'desc'
  });
  
  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Initialize user and load data
  useEffect(() => {
    async function initialize() {
      try {
        setLoading(true);
        
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) throw userError;
        
        if (!user) {
          // Redirect to login if not authenticated
          window.location.href = '/login';
          return;
        }
        
        setUser(user);
        await loadDashboardData(user.id);
        setLoading(false);
      } catch (err) {
        console.error('Error initializing dashboard:', err);
        setError('Failed to load dashboard. Please try again.');
        setLoading(false);
      }
    }
    
    initialize();
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps
  // We're disabling the exhaustive-deps warning because loadDashboardData is defined in the component
  // Including it would cause unnecessary re-renders

  // Set up real-time subscription
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
  }, [user]);  // eslint-disable-line react-hooks/exhaustive-deps
  // We're disabling the exhaustive-deps warning because loadDashboardData is defined in the component
  // Including it would cause unnecessary re-renders

  // Load dashboard data
  const loadDashboardData = async (userId) => {
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
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load invoice data. Please try again.');
    } finally {
      setInvoicesLoading(false);
    }
  };

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
  const handleDeleteInvoice = (invoiceId) => {
    const invoice = invoices.find(inv => inv.id === invoiceId);
    if (invoice) {
      setInvoiceToDelete(invoice);
      setDeleteModalOpen(true);
    }
  };

  // Confirm invoice deletion
  const confirmDeleteInvoice = async () => {
    try {
      if (invoiceToDelete && user) {
        setIsDeleting(true);
        
        // Delete from database
        await deleteInvoice(invoiceToDelete.id);
        
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
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoice Management</h1>
          <p className="text-gray-600 mt-1">Create, track, and manage your trucking invoices</p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-3">
          <Link
            href="/dashboard/invoices/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
          >
            <Plus size={16} className="mr-2" />
            Create Invoice
          </Link>
          <button
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
          >
            <Download size={16} className="mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Error display */}
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard 
          title="Total Invoices" 
          value={formatCurrency(stats.total)} 
          icon={<FileText size={22} className="text-gray-600" />}
          bgColor="bg-white"
          textColor="text-gray-900"
        />
        <StatCard 
          title="Paid" 
          value={formatCurrency(stats.paid)} 
          icon={<CheckCircle size={22} className="text-green-600" />}
          bgColor="bg-green-50"
          textColor="text-green-700"
        />
        <StatCard 
          title="Pending" 
          value={formatCurrency(stats.pending)} 
          icon={<Clock size={22} className="text-yellow-600" />}
          bgColor="bg-yellow-50"
          textColor="text-yellow-700"
        />
        <StatCard 
          title="Overdue" 
          value={formatCurrency(stats.overdue)} 
          icon={<AlertCircle size={22} className="text-red-600" />}
          bgColor="bg-red-50"
          textColor="text-red-700"
        />
      </div>

      {/* Quick Actions */}
      <div className="mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <QuickActionCard 
            title="New Invoice" 
            icon={<Plus size={20} className="text-blue-600" />} 
            onClick={() => window.location.href = '/dashboard/invoices/new'} 
            bgColor="bg-blue-50"
          />
          <QuickActionCard 
            title="Record Payment" 
            icon={<DollarSign size={20} className="text-green-600" />} 
            onClick={() => {
              setFilters({...filters, status: 'pending'});
              applyFilters({...filters, status: 'pending'});
            }} 
            bgColor="bg-green-50"
          />
          <QuickActionCard 
            title="Send Reminder" 
            icon={<Mail size={20} className="text-orange-600" />} 
            onClick={() => {
              setFilters({...filters, status: 'overdue'});
              applyFilters({...filters, status: 'overdue'});
            }} 
            bgColor="bg-orange-50"
          />
          <QuickActionCard 
            title="Generate Report" 
            icon={<BarChart2 size={20} className="text-purple-600" />} 
            bgColor="bg-purple-50"
          />
        </div>
      </div>

      {/* Two-column widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <DueSoonWidget invoices={invoices} onViewInvoice={handleViewInvoice} />
        <OverdueWidget invoices={invoices} onViewInvoice={handleViewInvoice} />
      </div>

      {/* Filters */}
      <InvoiceFilters 
        filters={filters}
        setFilters={setFilters}
        onApplyFilters={applyFilters}
      />

      {/* Invoices Table */}
      <InvoicesTable 
        invoices={filteredInvoices}
        onMarkAsPaid={handleMarkAsPaid}
        onDelete={handleDeleteInvoice}
        loading={invoicesLoading}
        onViewInvoice={handleViewInvoice}
      />

      {/* Pagination */}
      {filteredInvoices.length > 0 && (
        <div className="mt-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{filteredInvoices.length}</span> of{' '}
              <span className="font-medium">{invoices.length}</span> invoices
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                <span className="sr-only">Previous</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-blue-600 hover:bg-gray-50">
                1
              </button>
              <button className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                <span className="sr-only">Next</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteInvoiceModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setInvoiceToDelete(null);
        }}
        onConfirm={confirmDeleteInvoice}
        invoiceNumber={invoiceToDelete?.invoice_number}
        isDeleting={isDeleting}
      />
    </div>
  );
}