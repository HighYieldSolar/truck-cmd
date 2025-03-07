"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import Image from "next/image";
import {
  fetchInvoices,
  deleteInvoice,
  getInvoiceStats,
  updateInvoiceStatus,
  recordPayment
} from "@/lib/services/invoiceService";
import {
  LayoutDashboard, 
  FileText, 
  Truck, 
  Wallet, 
  Users, 
  Calculator, 
  Search, 
  Plus, 
  Filter, 
  ChevronDown, 
  Download, 
  MoreHorizontal, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  ExternalLink, 
  DollarSign, 
  Mail, 
  Calendar,
  Edit,
  Trash2,
  RefreshCw,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  X,
  BarChart2,
  Eye,
  Send,
  FileDown
} from "lucide-react";

// Sidebar Component
const Sidebar = ({ activePage = "invoices" }) => {
  const menuItems = [
    { name: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard size={18} /> },
    { name: 'Invoices', href: '/dashboard/invoices', icon: <FileText size={18} /> },
    { name: 'Dispatching', href: '/dashboard/dispatching', icon: <Truck size={18} /> },
    { name: 'Expenses', href: '/dashboard/expenses', icon: <Wallet size={18} /> },
    { name: 'Customers', href: '/dashboard/customers', icon: <Users size={18} /> },
    { name: 'IFTA Calculator', href: '/dashboard/ifta', icon: <Calculator size={18} /> },
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
      </nav>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ title, value, change, positive, icon, color = "blue" }) => {
  const colorClasses = {
    blue: "text-blue-600",
    green: "text-green-600",
    yellow: "text-yellow-600",
    red: "text-red-600"
  };
  
  return (
    <div className="bg-white rounded-lg shadow px-5 py-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">{value}</p>
        </div>
        <div className="rounded-md p-2 bg-opacity-10 bg-gray-100">
          {icon}
        </div>
      </div>
      {change !== undefined && change !== null && (
        <div className="mt-3">
          <p className={`text-sm flex items-center ${positive ? 'text-green-600' : 'text-red-600'}`}>
            {positive ? (
              <ArrowUp size={16} className="mr-1" />
            ) : (
              <ArrowDown size={16} className="mr-1" />
            )}
            <span>{change}% from last month</span>
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
    case 'sent':
      bgColor = 'bg-blue-100';
      textColor = 'text-blue-800';
      icon = <Mail size={14} className="mr-1" />;
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
    case 'partially paid':
      bgColor = 'bg-indigo-100';
      textColor = 'text-indigo-800';
      icon = <DollarSign size={14} className="mr-1" />;
      break;
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
      {icon}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

// Invoice Table Component
const InvoiceTable = ({ invoices, onView, onEdit, onDelete, onMarkPaid, onSend, onDownload }) => {
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
                <div className="text-sm text-gray-500">{new Date(invoice.invoice_date).toLocaleDateString()}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-500">{new Date(invoice.due_date).toLocaleDateString()}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">${parseFloat(invoice.total).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <StatusBadge status={invoice.status} />
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex items-center justify-end space-x-2">
                  <button 
                    onClick={() => onView(invoice.id)}
                    className="text-gray-600 hover:text-gray-900"
                    title="View Details"
                  >
                    <Eye size={18} />
                  </button>
                  <button 
                    onClick={() => onEdit(invoice.id)}
                    className="text-blue-600 hover:text-blue-900"
                    title="Edit"
                  >
                    <Edit size={18} />
                  </button>
                  <button 
                    className="text-green-600 hover:text-green-900"
                    title="Mark as Paid"
                    onClick={() => onMarkPaid(invoice.id)}
                    disabled={invoice.status.toLowerCase() === 'paid'}
                  >
                    <DollarSign size={18} />
                  </button>
                  <button 
                    className="text-purple-600 hover:text-purple-900"
                    title="Send Invoice"
                    onClick={() => onSend(invoice.id)}
                  >
                    <Mail size={18} />
                  </button>
                  <button 
                    className="text-indigo-600 hover:text-indigo-900"
                    title="Download PDF"
                    onClick={() => onDownload(invoice.id)}
                  >
                    <Download size={18} />
                  </button>
                  <button 
                    onClick={() => onDelete(invoice.id)}
                    className="text-red-600 hover:text-red-900"
                    title="Delete"
                  >
                    <Trash2 size={18} />
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

// Invoice Filter Component
const InvoiceFilters = ({ filters, setFilters }) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 md:space-x-4">
      <div className="relative inline-block w-full md:w-auto">
        <select
          value={filters.status}
          onChange={(e) => setFilters({...filters, status: e.target.value})}
          className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        >
          <option value="all">All Invoices</option>
          <option value="draft">Draft</option>
          <option value="pending">Pending</option>
          <option value="sent">Sent</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>
      
      <div className="relative inline-block w-full md:w-auto">
        <select
          value={filters.dateRange}
          onChange={(e) => setFilters({...filters, dateRange: e.target.value})}
          className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        >
          <option value="all">All Time</option>
          <option value="thisMonth">This Month</option>
          <option value="last30">Last 30 Days</option>
          <option value="last90">Last 90 Days</option>
          <option value="thisYear">This Year</option>
          <option value="custom">Custom Range</option>
        </select>
      </div>
      
      {filters.dateRange === 'custom' && (
        <div className="flex space-x-2 w-full md:w-auto">
          <input
            type="date"
            value={filters.startDate || ''}
            onChange={(e) => setFilters({...filters, startDate: e.target.value})}
            className="block w-full pl-3 pr-3 py-2 text-base border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
          <input
            type="date"
            value={filters.endDate || ''}
            onChange={(e) => setFilters({...filters, endDate: e.target.value})}
            className="block w-full pl-3 pr-3 py-2 text-base border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
      )}
      
      <div className="relative flex-grow">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={16} className="text-gray-400" />
        </div>
        <input
          type="text"
          value={filters.search}
          onChange={(e) => setFilters({...filters, search: e.target.value})}
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder="Search invoices..."
        />
      </div>
    </div>
  );
};

// Delete Confirmation Modal
const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, invoiceNumber, isDeleting }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-center mb-4 text-red-600">
          <AlertTriangle size={40} />
        </div>
        <h3 className="text-lg font-medium text-center text-gray-900 mb-2">
          Delete Invoice
        </h3>
        <p className="text-center text-gray-500 mb-6">
          Are you sure you want to delete invoice <strong>{invoiceNumber}</strong>? This action cannot be undone.
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

// Record Payment Modal
const RecordPaymentModal = ({ isOpen, onClose, onSubmit, invoice, isSubmitting }) => {
  const [paymentData, setPaymentData] = useState({
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    method: 'Credit Card',
    notes: ''
  });

  useEffect(() => {
    if (isOpen && invoice) {
      // Reset form and set default values
      setPaymentData({
        amount: parseFloat(invoice.total) - parseFloat(invoice.amount_paid || 0),
        date: new Date().toISOString().split('T')[0],
        method: 'Credit Card',
        notes: ''
      });
    }
  }, [isOpen, invoice]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPaymentData(prev => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(paymentData);
  };

  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Record Payment for Invoice {invoice?.invoice_number}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                Payment Amount ($)
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  name="amount"
                  id="amount"
                  step="0.01"
                  min="0.01"
                  max={parseFloat(invoice?.total) - parseFloat(invoice?.amount_paid || 0)}
                  value={paymentData.amount}
                  onChange={handleChange}
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                  placeholder="0.00"
                  required
                />
                <div className="absolute inset-y-0 right-0 flex items-center">
                  <label htmlFor="currency" className="sr-only">Currency</label>
                  <div className="px-2 text-gray-500 sm:text-sm">
                    USD
                  </div>
                </div>
              </div>
              {invoice && (
                <p className="mt-1 text-xs text-gray-500">
                  Invoice Total: ${parseFloat(invoice.total).toFixed(2)} | 
                  Already Paid: ${parseFloat(invoice.amount_paid || 0).toFixed(2)} | 
                  Remaining: ${(parseFloat(invoice.total) - parseFloat(invoice.amount_paid || 0)).toFixed(2)}
                </p>
              )}
            </div>
            
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                Payment Date
              </label>
              <input
                type="date"
                name="date"
                id="date"
                value={paymentData.date}
                onChange={handleChange}
                className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                required
              />
            </div>
            
            <div>
              <label htmlFor="method" className="block text-sm font-medium text-gray-700">
                Payment Method
              </label>
              <select
                id="method"
                name="method"
                value={paymentData.method}
                onChange={handleChange}
                className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                required
              >
                <option value="Credit Card">Credit Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cash">Cash</option>
                <option value="Check">Check</option>
                <option value="PayPal">PayPal</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                Notes (Optional)
              </label>
              <textarea
                id="notes"
                name="notes"
                rows="3"
                value={paymentData.notes}
                onChange={handleChange}
                className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                placeholder="Any additional information about this payment"
              ></textarea>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end space-x-3">
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
                  Processing...
                </>
              ) : (
                <>
                  <DollarSign size={16} className="mr-2" />
                  Record Payment
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Send Invoice Modal
const SendInvoiceModal = ({ isOpen, onClose, onSubmit, invoice, isSubmitting }) => {
  const [emailData, setEmailData] = useState({
    to: '',
    subject: '',
    message: ''
  });

  useEffect(() => {
    if (isOpen && invoice) {
      // Prepare default email data
      setEmailData({
        to: '', // Would normally be populated from customer data
        subject: `Invoice ${invoice.invoice_number} from Your Company`,
        message: `Dear customer,\n\nAttached is invoice ${invoice.invoice_number} for $${parseFloat(invoice.total).toFixed(2)}, due on ${new Date(invoice.due_date).toLocaleDateString()}.\n\nPlease let us know if you have any questions.\n\nBest regards,\nYour Company`
      });
    }
  }, [isOpen, invoice]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEmailData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(emailData);
  };

  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Send Invoice {invoice?.invoice_number}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="to" className="block text-sm font-medium text-gray-700">
                Recipient Email
              </label>
              <input
                type="email"
                name="to"
                id="to"
                value={emailData.to}
                onChange={handleChange}
                className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                placeholder="recipient@example.com"
                required
              />
            </div>
            
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
                Subject
              </label>
              <input
                type="text"
                name="subject"
                id="subject"
                value={emailData.subject}
                onChange={handleChange}
                className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                placeholder="Subject line"
                required
              />
            </div>
            
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                rows="5"
                value={emailData.message}
                onChange={handleChange}
                className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                placeholder="Enter your message here"
                required
              ></textarea>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="flex items-start">
                <Mail size={20} className="text-blue-500 flex-shrink-0 mr-2" />
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Invoice will be attached as PDF</h4>
                  <p className="text-xs text-gray-500">
                    Your customer will receive the email with the invoice attached as a PDF file.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end space-x-3">
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
                  Sending...
                </>
              ) : (
                <>
                  <Send size={16} className="mr-2" />
                  Send Invoice
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Empty State Component
const EmptyState = ({ onCreateInvoice }) => {
  return (
    <div className="text-center py-12">
      <FileText size={48} className="mx-auto text-gray-400 mb-4" />
      <h3 className="text-lg font-medium text-gray-900">No invoices found</h3>
      <p className="mt-1 text-sm text-gray-500">
        Get started by creating your first invoice
      </p>
      <div className="mt-6">
        <button
          onClick={onCreateInvoice}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus size={16} className="mr-2" />
          Create Invoice
        </button>
      </div>
    </div>
  );
};

// Main Invoice Dashboard Component
export default function InvoiceDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [error, setError] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    paid: 0,
    pending: 0,
    overdue: 0,
    count: 0
  });
  
  // Filters state
  const [filters, setFilters] = useState({
    status: 'all',
    dateRange: 'all',
    startDate: '',
    endDate: '',
    search: ''
  });
  
  // Modal states
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [invoiceToPayment, setInvoiceToPayment] = useState(null);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [invoiceToSend, setInvoiceToSend] = useState(null);
  const [isSending, setIsSending] = useState(false);

  // Load invoices with filters
  const loadInvoices = useCallback(async (userId) => {
    try {
      setInvoicesLoading(true);
      setError(null);
      
      // Fetch invoices
      const data = await fetchInvoices(userId, filters);
      setInvoices(data);
      
      // Fetch stats
      const statsData = await getInvoiceStats(userId);
      setStats(statsData);
    } catch (err) {
      console.error("Error loading invoices:", err);
      setError("Failed to load invoices. Please try again.");
    } finally {
      setInvoicesLoading(false);
    }
  }, [filters]);

  // Initialize data on component mount
  useEffect(() => {
    async function initializeData() {
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
        await loadInvoices(user.id);
        
        setLoading(false);
      } catch (err) {
        console.error("Error initializing data:", err);
        setError("Authentication error. Please try logging in again.");
        setLoading(false);
      }
    }
    
    initializeData();
  }, [loadInvoices]);

  // Reload invoices when filters change
  useEffect(() => {
    if (user) {
      loadInvoices(user.id);
    }
  }, [user, loadInvoices]);

  // Handle view invoice
  const handleViewInvoice = (id) => {
    window.location.href = `/dashboard/invoices/${id}`;
  };

  // Handle edit invoice
  const handleEditInvoice = (id) => {
    window.location.href = `/dashboard/invoices/${id}/edit`;
  };

  // Handle delete invoice
  const handleDeleteInvoice = (id) => {
    const invoice = invoices.find(inv => inv.id === id);
    setInvoiceToDelete(invoice);
    setDeleteModalOpen(true);
  };

  // Confirm delete invoice
  const confirmDeleteInvoice = async () => {
    if (invoiceToDelete) {
      try {
        setIsDeleting(true);
        await deleteInvoice(invoiceToDelete.id);
        
        // Refresh the invoices list
        if (user) {
          await loadInvoices(user.id);
        }
        
        // Close the modal
        setDeleteModalOpen(false);
        setInvoiceToDelete(null);
      } catch (err) {
        console.error("Error deleting invoice:", err);
        setError("Failed to delete invoice. Please try again.");
      } finally {
        setIsDeleting(false);
      }
    }
  };

  // Handle mark as paid
  const handleMarkAsPaid = (id) => {
    const invoice = invoices.find(inv => inv.id === id);
    setInvoiceToPayment(invoice);
    setPaymentModalOpen(true);
  };

  // Submit payment
  const submitPayment = async (paymentData) => {
    if (invoiceToPayment) {
      try {
        setIsSubmittingPayment(true);
        
        // Record the payment
        await recordPayment(invoiceToPayment.id, {
          amount: paymentData.amount,
          date: paymentData.date,
          method: paymentData.method,
          notes: paymentData.notes
        });
        
        // Refresh the invoices list
        if (user) {
          await loadInvoices(user.id);
        }
        
        // Close the modal
        setPaymentModalOpen(false);
        setInvoiceToPayment(null);
      } catch (err) {
        console.error("Error recording payment:", err);
        setError("Failed to record payment. Please try again.");
      } finally {
        setIsSubmittingPayment(false);
      }
    }
  };

  // Handle send invoice
  const handleSendInvoice = (id) => {
    const invoice = invoices.find(inv => inv.id === id);
    setInvoiceToSend(invoice);
    setSendModalOpen(true);
  };

  // Submit send invoice
  const submitSendInvoice = async (emailData) => {
    if (invoiceToSend) {
      try {
        setIsSending(true);
        
        // In a real implementation, this would call your service to send the email
        // This is a placeholder for the actual email sending logic
        console.log("Sending invoice:", invoiceToSend.id, emailData);
        
        // Update the invoice status to 'Sent'
        await updateInvoiceStatus(invoiceToSend.id, 'Sent');
        
        // Refresh the invoices list
        if (user) {
          await loadInvoices(user.id);
        }
        
        // Close the modal
        setSendModalOpen(false);
        setInvoiceToSend(null);
      } catch (err) {
        console.error("Error sending invoice:", err);
        setError("Failed to send invoice. Please try again.");
      } finally {
        setIsSending(false);
      }
    }
  };

  // Handle download invoice
  const handleDownloadInvoice = (id) => {
    // In a real implementation, this would call your service to generate and download a PDF
    // This is just a placeholder for the actual PDF generation logic
    console.log("Downloading invoice:", id);
    alert("Invoice PDF download initiated");
  };

  // Create new invoice
  const handleCreateInvoice = () => {
    window.location.href = '/dashboard/invoices/new';
  };

  // Loading state
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
      <Sidebar activePage="invoices" />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between p-4 bg-white shadow-sm">
          <h1 className="text-xl font-semibold text-gray-900">Invoices</h1>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={handleCreateInvoice}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
            >
              <Plus size={16} className="mr-2" />
              New Invoice
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 bg-gray-100">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Error Alert */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard 
                title="Total Outstanding" 
                value={`${stats.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
                icon={<FileText size={22} className="text-blue-600" />}
              />
              <StatCard 
                title="Paid" 
                value={`${stats.paid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
                icon={<CheckCircle size={22} className="text-green-600" />}
                change="8.5"
                positive={true}
                color="green"
              />
              <StatCard 
                title="Pending" 
                value={`${stats.pending.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
                icon={<Clock size={22} className="text-yellow-600" />}
                color="yellow"
              />
              <StatCard 
                title="Overdue" 
                value={`${stats.overdue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
                icon={<AlertCircle size={22} className="text-red-600" />}
                change="3.2"
                positive={false}
                color="red"
              />
            </div>
            
            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow">
              <InvoiceFilters 
                filters={filters}
                setFilters={setFilters}
              />
            </div>
            
            {/* Invoices List */}
            {invoicesLoading ? (
              <div className="flex justify-center items-center py-12">
                <RefreshCw size={32} className="animate-spin text-blue-500" />
                <span className="ml-2 text-gray-600">Loading invoices...</span>
              </div>
            ) : invoices.length === 0 ? (
              <EmptyState onCreateInvoice={handleCreateInvoice} />
            ) : (
              <InvoiceTable 
                invoices={invoices}
                onView={handleViewInvoice}
                onEdit={handleEditInvoice}
                onDelete={handleDeleteInvoice}
                onMarkPaid={handleMarkAsPaid}
                onSend={handleSendInvoice}
                onDownload={handleDownloadInvoice}
              />
            )}
            
            {/* Pagination */}
            {invoices.length > 0 && (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{invoices.length}</span> of{' '}
                    <span className="font-medium">{stats.count}</span> invoices
                  </p>
                </div>
                <nav className="inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                    <span className="sr-only">Previous</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
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
            )}
          </div>
        </main>
      </div>

      {/* Modals */}
      <DeleteConfirmationModal 
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setInvoiceToDelete(null);
        }}
        onConfirm={confirmDeleteInvoice}
        invoiceNumber={invoiceToDelete?.invoice_number}
        isDeleting={isDeleting}
      />
      
      <RecordPaymentModal 
        isOpen={paymentModalOpen}
        onClose={() => {
          setPaymentModalOpen(false);
          setInvoiceToPayment(null);
        }}
        onSubmit={submitPayment}
        invoice={invoiceToPayment}
        isSubmitting={isSubmittingPayment}
      />
      
      <SendInvoiceModal 
        isOpen={sendModalOpen}
        onClose={() => {
          setSendModalOpen(false);
          setInvoiceToSend(null);
        }}
        onSubmit={submitSendInvoice}
        invoice={invoiceToSend}
        isSubmitting={isSending}
      />
    </div>
  );