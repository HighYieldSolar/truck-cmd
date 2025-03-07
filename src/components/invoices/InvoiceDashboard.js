"use client";

import { useState, useEffect } from "react";
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
  ArrowUp,
  ArrowDown,
  Sliders,
  RefreshCw
} from "lucide-react";
import { getInvoiceStats, fetchInvoices, updateInvoiceStatus } from "@/lib/services/invoiceService";

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

// Status Badge Component 
const StatusBadge = ({ status }) => {
  let bgColor = 'bg-gray-100';
  let textColor = 'text-gray-800';
  let icon = null;

  switch (status.toLowerCase()) {
    case 'paid':
      bgColor = 'bg-green-100';
      textColor = 'text-green-800';
      icon = <CheckCircle size={14} className="mr-1" />;
      break;
    case 'pending':
      bgColor = 'bg-yellow-100';
      textColor = 'text-yellow-800';
      icon = <Clock size={14} className="mr-1" />;
      break;
    case 'overdue':
      bgColor = 'bg-red-100';
      textColor = 'text-red-800';
      icon = <AlertCircle size={14} className="mr-1" />;
      break;
    case 'draft':
      bgColor = 'bg-gray-100';
      textColor = 'text-gray-800';
      icon = <FileText size={14} className="mr-1" />;
      break;
    case 'sent':
      bgColor = 'bg-blue-100';
      textColor = 'text-blue-800';
      icon = <FileText size={14} className="mr-1" />;
      break;
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
      {icon}
      {status}
    </span>
  );
};

// Invoice Filters Component
const InvoiceFilters = ({ status, setStatus, dateRange, setDateRange, search, setSearch }) => {
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

  return (
    <div className="flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 md:space-x-4">
      <div className="relative inline-block w-full md:w-auto">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
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
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        >
          {dateRangeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      
      <div className="relative flex-grow">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={16} className="text-gray-400" />
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder="Search invoices..."
        />
      </div>
    </div>
  );
};

// Recent Invoices Table Component
const InvoicesTable = ({ invoices, onMarkAsPaid, onDelete, loading }) => {
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  // Handle marking an invoice as paid
  const handleMarkAsPaid = async (invoiceId) => {
    try {
      await onMarkAsPaid(invoiceId);
    } catch (error) {
      console.error("Error marking invoice as paid:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <RefreshCw size={24} className="animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">Loading invoices...</span>
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow">
        <FileText size={48} className="mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900">No invoices found</h3>
        <p className="mt-2 text-gray-500 mb-6">Get started by creating your first invoice</p>
        <Link
          href="/dashboard/invoices/new"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus size={16} className="mr-2" />
          Create Invoice
        </Link>
      </div>
    );
  }

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
                <div className="text-sm font-medium text-blue-600 hover:text-blue-800">
                  <Link href={`/dashboard/invoices/${invoice.id}`}>
                    {invoice.invoice_number}
                  </Link>
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
                <StatusBadge status={invoice.status} />
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex items-center justify-end space-x-2">
                  <Link 
                    href={`/dashboard/invoices/${invoice.id}`}
                    className="text-blue-600 hover:text-blue-900"
                    title="View Details"
                  >
                    <FileText size={18} />
                  </Link>
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
const DeleteInvoiceModal = ({ isOpen, onClose, onConfirm, invoiceNumber }) => {
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
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700"
          >
            Delete
          </button>
        </div>
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
  const [status, setStatus] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [search, setSearch] = useState('');
  
  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState(null);

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
  }, []);

  // Load dashboard data
  const loadDashboardData = async (userId) => {
    try {
      setInvoicesLoading(true);
      
      // Fetch invoices and stats in parallel
      const [invoiceStats, invoicesData] = await Promise.all([
        getInvoiceStats(userId),
        fetchInvoices(userId)
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

  // Apply filters when they change
  useEffect(() => {
    if (invoices.length > 0) {
      let filtered = [...invoices];
      
      // Filter by status
      if (status !== 'all') {
        filtered = filtered.filter(invoice => 
          invoice.status.toLowerCase() === status.toLowerCase()
        );
      }
      
      // Filter by date range
      if (dateRange !== 'all') {
        const now = new Date();
        let dateFrom = new Date();
        
        switch (dateRange) {
          case 'last30':
            dateFrom.setDate(now.getDate() - 30);
            break;
          case 'last90':
            dateFrom.setDate(now.getDate() - 90);
            break;
          case 'thisMonth':
            dateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          case 'lastMonth':
            dateFrom = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
            filtered = filtered.filter(invoice => {
              const invoiceDate = new Date(invoice.invoice_date);
              return invoiceDate >= dateFrom && invoiceDate <= lastDay;
            });
            break;
          case 'thisYear':
            dateFrom = new Date(now.getFullYear(), 0, 1);
            break;
          default:
            break;
        }
        
        if (dateRange !== 'lastMonth') {
          filtered = filtered.filter(invoice => {
            const invoiceDate = new Date(invoice.invoice_date);
            return invoiceDate >= dateFrom;
          });
        }
      }
      
      // Filter by search term
      if (search) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter(invoice => 
          invoice.invoice_number.toLowerCase().includes(searchLower) ||
          invoice.customer.toLowerCase().includes(searchLower)
        );
      }
      
      setFilteredInvoices(filtered);
    }
  }, [status, dateRange, search, invoices]);

  // Handle marking an invoice as paid
  const handleMarkAsPaid = async (invoiceId) => {
    try {
      await updateInvoiceStatus(invoiceId, 'Paid');
      
      // Update local state
      const updatedInvoices = invoices.map(invoice => {
        if (invoice.id === invoiceId) {
          return { ...invoice, status: 'Paid' };
        }
        return invoice;
      });
      
      setInvoices(updatedInvoices);
      
      // Reload stats
      if (user) {
        const invoiceStats = await getInvoiceStats(user.id);
        setStats(invoiceStats);
      }
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
        // Delete from database
        const response = await fetch(`/api/invoices/${invoiceToDelete.id}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          throw new Error('Failed to delete invoice');
        }
        
        // Update local state
        const updatedInvoices = invoices.filter(invoice => invoice.id !== invoiceToDelete.id);
        setInvoices(updatedInvoices);
        
        // Reload stats
        const invoiceStats = await getInvoiceStats(user.id);
        setStats(invoiceStats);
        
        // Close modal
        setDeleteModalOpen(false);
        setInvoiceToDelete(null);
      }
    } catch (err) {
      console.error('Error deleting invoice:', err);
      setError('Failed to delete invoice. Please try again.');
    }
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
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoice Management</h1>
          <p className="text-gray-600 mt-1">Create, track, and manage your invoices</p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-3">
          <Link
            href="/dashboard/invoices/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus size={16} className="mr-2" />
            Create Invoice
          </Link>
          <button
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
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

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
          change="+12.5%"
          positive={true}
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
          change="+5.3%"
          positive={false}
        />
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <InvoiceFilters 
          status={status}
          setStatus={setStatus}
          dateRange={dateRange}
          setDateRange={setDateRange}
          search={search}
          setSearch={setSearch}
        />
      </div>

      {/* Invoices Table */}
      <InvoicesTable 
        invoices={filteredInvoices}
        onMarkAsPaid={handleMarkAsPaid}
        onDelete={handleDeleteInvoice}
        loading={invoicesLoading}
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
      />
    </div>
  );
}