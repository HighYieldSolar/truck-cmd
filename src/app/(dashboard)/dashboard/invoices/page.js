"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import Image from "next/image";
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
  Calendar
} from "lucide-react";

// Sidebar component
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

// Invoice stats card component
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
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            ) : (
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            )}
            <span>{change} from last month</span>
          </p>
        </div>
      )}
    </div>
  );
};

// Status badge component
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
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
      {icon}
      {status}
    </span>
  );
};

// Invoice table component
const InvoiceTable = ({ invoices, onViewInvoice, onDeleteInvoice }) => {
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
                    {invoice.invoiceNumber}
                  </Link>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{invoice.customer}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-500">{invoice.date}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-500">{invoice.dueDate}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">${invoice.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <StatusBadge status={invoice.status} />
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex items-center justify-end space-x-2">
                  <button 
                    onClick={() => onViewInvoice(invoice.id)}
                    className="text-blue-600 hover:text-blue-900"
                    title="View Details"
                  >
                    <ExternalLink size={18} />
                  </button>
                  <button 
                    className="text-green-600 hover:text-green-900"
                    title="Mark as Paid"
                  >
                    <DollarSign size={18} />
                  </button>
                  <button 
                    className="text-purple-600 hover:text-purple-900"
                    title="Send Invoice"
                  >
                    <Mail size={18} />
                  </button>
                  <button 
                    className="text-gray-600 hover:text-gray-900"
                    title="Download PDF"
                  >
                    <Download size={18} />
                  </button>
                  <button 
                    onClick={() => onDeleteInvoice(invoice.id)}
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

// Invoice filters component
const InvoiceFilters = ({ status, setStatus, dateRange, setDateRange }) => {
  const statusOptions = [
    { value: 'all', label: 'All Invoices' },
    { value: 'paid', label: 'Paid' },
    { value: 'pending', label: 'Pending' },
    { value: 'overdue', label: 'Overdue' },
    { value: 'draft', label: 'Draft' },
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
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder="Search invoices..."
        />
      </div>
    </div>
  );
};

// Main Invoices Page Component
export default function InvoicesPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState([]);
  const [status, setStatus] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    paid: 0,
    pending: 0,
    overdue: 0
  });

  useEffect(() => {
    async function getUser() {
      try {
        setLoading(true);
        
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
          throw error;
        }
        
        if (user) {
          setUser(user);
          // In a real app, you would fetch invoices data here
          fetchInvoices(user.id);
        }
      } catch (error) {
        console.error('Error getting user:', error);
      } finally {
        setLoading(false);
      }
    }
    
    getUser();
  }, []);

  // Mock data fetch - replace with actual API call in production
  const fetchInvoices = (userId) => {
    // Simulating API delay
    setTimeout(() => {
      const mockInvoices = [
        { 
          id: '1', 
          invoiceNumber: 'INV-2025-001', 
          customer: 'ABC Logistics', 
          date: '2025-03-01', 
          dueDate: '2025-03-15', 
          amount: 2500.00, 
          status: 'Paid' 
        },
        { 
          id: '2', 
          invoiceNumber: 'INV-2025-002', 
          customer: 'XYZ Transport', 
          date: '2025-03-03', 
          dueDate: '2025-03-17', 
          amount: 1875.50, 
          status: 'Pending' 
        },
        { 
          id: '3', 
          invoiceNumber: 'INV-2025-003', 
          customer: 'Global Shipping Co', 
          date: '2025-02-28', 
          dueDate: '2025-03-14', 
          amount: 3200.75, 
          status: 'Overdue' 
        },
        { 
          id: '4', 
          invoiceNumber: 'INV-2025-004', 
          customer: 'Fast Freight Inc', 
          date: '2025-03-02', 
          dueDate: '2025-03-16', 
          amount: 1950.25, 
          status: 'Paid' 
        },
        { 
          id: '5', 
          invoiceNumber: 'INV-2025-005', 
          customer: 'Midwest Movers', 
          date: '2025-03-04', 
          dueDate: '2025-03-18', 
          amount: 2100.00, 
          status: 'Draft' 
        },
      ];
      
      setInvoices(mockInvoices);
      
      // Calculate stats
      const total = mockInvoices.reduce((sum, invoice) => sum + invoice.amount, 0);
      const paid = mockInvoices.filter(invoice => invoice.status.toLowerCase() === 'paid').reduce((sum, invoice) => sum + invoice.amount, 0);
      const pending = mockInvoices.filter(invoice => invoice.status.toLowerCase() === 'pending').reduce((sum, invoice) => sum + invoice.amount, 0);
      const overdue = mockInvoices.filter(invoice => invoice.status.toLowerCase() === 'overdue').reduce((sum, invoice) => sum + invoice.amount, 0);
      
      setStats({
        total,
        paid,
        pending,
        overdue
      });
    }, 500);
  };

  const handleViewInvoice = (invoiceId) => {
    // Navigate to invoice detail page
    console.log(`Viewing invoice: ${invoiceId}`);
  };

  const handleDeleteInvoice = (invoiceId) => {
    // Delete invoice
    if (confirm("Are you sure you want to delete this invoice?")) {
      setInvoices(invoices.filter(invoice => invoice.id !== invoiceId));
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
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar activePage="invoices" />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between p-4 bg-white shadow-sm">
          <h1 className="text-xl font-semibold text-gray-900">Invoices</h1>
          
          <div className="flex items-center space-x-4">
            <Link 
              href="/dashboard/invoices/new" 
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
            >
              <Plus size={16} className="mr-2" />
              New Invoice
            </Link>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 bg-gray-100">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard 
                title="Total Invoices" 
                value={`$${stats.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
                icon={<FileText size={22} className="text-gray-600" />}
                bgColor="bg-white"
                textColor="text-gray-900"
              />
              <StatCard 
                title="Paid" 
                value={`$${stats.paid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
                icon={<CheckCircle size={22} className="text-green-600" />}
                bgColor="bg-green-50"
                textColor="text-green-700"
                change="+12.5%"
                positive={true}
              />
              <StatCard 
                title="Pending" 
                value={`$${stats.pending.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
                icon={<Clock size={22} className="text-yellow-600" />}
                bgColor="bg-yellow-50"
                textColor="text-yellow-700"
              />
              <StatCard 
                title="Overdue" 
                value={`$${stats.overdue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
                icon={<AlertCircle size={22} className="text-red-600" />}
                bgColor="bg-red-50"
                textColor="text-red-700"
                change="+5.3%"
                positive={false}
              />
            </div>
            
            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow">
              <InvoiceFilters 
                status={status}
                setStatus={setStatus}
                dateRange={dateRange}
                setDateRange={setDateRange}
              />
            </div>
            
            {/* Invoices Table */}
            <InvoiceTable 
              invoices={invoices}
              onViewInvoice={handleViewInvoice}
              onDeleteInvoice={handleDeleteInvoice}
            />
            
            {/* Pagination */}
            <div className="flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                  Previous
                </button>
                <button className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">1</span> to <span className="font-medium">5</span> of{' '}
                    <span className="font-medium">5</span> results
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
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}