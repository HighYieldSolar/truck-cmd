"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import {
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  DollarSign,
  ChevronRight,
  Plus,
  Download,
  RefreshCw,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  BarChart2,
  CreditCard,
  Mail,
  Eye,
  ExternalLink
} from "lucide-react";

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
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
      {icon}
      {status}
    </span>
  );
};

// Invoice Stat Card Component
const StatCard = ({ title, value, icon, bgColor, textColor, change, positive }) => {
  return (
    <div className={`${bgColor} rounded-lg shadow p-5`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">{value}</p>
        </div>
        <div className="rounded-md p-2 bg-white bg-opacity-30">
          {icon}
        </div>
      </div>
      {change && (
        <div className="mt-3">
          <p className={`text-sm flex items-center ${positive ? 'text-green-600' : 'text-red-600'}`}>
            {positive ? (
              <ArrowUpRight size={16} className="mr-1" />
            ) : (
              <ArrowDownRight size={16} className="mr-1" />
            )}
            <span>{change} from last month</span>
          </p>
        </div>
      )}
    </div>
  );
};

// Recent Invoice Item Component
const RecentInvoiceItem = ({ invoice, onViewInvoice }) => {
  return (
    <div className="flex justify-between items-center py-3 border-b border-gray-100 last:border-b-0">
      <div className="flex items-center">
        <div className="bg-blue-50 p-2 rounded-full mr-3">
          <FileText size={18} className="text-blue-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">
            Invoice #{invoice.invoice_number}
          </p>
          <p className="text-xs text-gray-500">{invoice.customer}</p>
        </div>
      </div>
      <div className="flex flex-col items-end">
        <p className="text-sm font-medium text-gray-900">
          ${invoice.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        <StatusBadge status={invoice.status} />
      </div>
      <button
        onClick={() => onViewInvoice(invoice.id)}
        className="text-blue-600 hover:text-blue-800 ml-2"
        title="View Details"
      >
        <ExternalLink size={18} />
      </button>
    </div>
  );
};

// Empty State Component
const EmptyState = ({ message, icon, buttonText, buttonLink }) => {
  return (
    <div className="text-center py-8">
      <div className="mx-auto mb-4 w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
        {icon}
      </div>
      <h3 className="text-lg font-medium text-gray-900">No invoices found</h3>
      <p className="mt-2 text-gray-500">{message}</p>
      {buttonText && buttonLink && (
        <Link
          href={buttonLink}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          {buttonText}
        </Link>
      )}
    </div>
  );
};

// Due This Month Item Component
const DueThisMonthItem = ({ invoice }) => {
  // Calculate days until due
  const today = new Date();
  const dueDate = new Date(invoice.due_date);
  const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
  
  let statusText = `Due in ${daysUntilDue} days`;
  let statusColor = "text-yellow-600";
  
  if (daysUntilDue <= 2) {
    statusText = `Due ${daysUntilDue <= 0 ? 'today' : 'tomorrow'}!`;
    statusColor = "text-red-600";
  } else if (daysUntilDue > 7) {
    statusColor = "text-green-600";
  }

  return (
    <div className="flex justify-between items-center py-3 border-b border-gray-100 last:border-b-0">
      <div className="flex items-center">
        <div className="bg-blue-50 p-2 rounded-full mr-3">
          <Calendar size={18} className="text-blue-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">
            {invoice.customer}
          </p>
          <p className="text-xs text-gray-500">Invoice #{invoice.invoice_number}</p>
        </div>
      </div>
      <div className="flex flex-col items-end">
        <p className="text-sm font-medium text-gray-900">
          ${invoice.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        <p className={`text-xs ${statusColor}`}>{statusText}</p>
      </div>
    </div>
  );
};

// Quick Action Button Component
const QuickActionButton = ({ icon, label, onClick, color = "blue" }) => {
  const bgColorClass = `bg-${color}-50 hover:bg-${color}-100`;
  const textColorClass = `text-${color}-700`;
  const iconColorClass = `text-${color}-600`;

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-4 rounded-lg border border-gray-200 ${bgColorClass} transition-colors`}
    >
      <div className={`p-2 mb-2 rounded-full bg-white ${iconColorClass}`}>
        {icon}
      </div>
      <span className={`text-sm font-medium ${textColorClass}`}>{label}</span>
    </button>
  );
};

// Main InvoiceDashboard Component
export default function InvoiceDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  
  // Invoice states
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [dueInvoices, setDueInvoices] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    paid: 0,
    pending: 0,
    overdue: 0
  });

  // Load data from Supabase
  useEffect(() => {
    async function fetchData() {
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
        
        // Fetch recent invoices
        const { data: invoicesData, error: invoicesError } = await supabase
          .from('invoices')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);
          
        if (invoicesError) throw invoicesError;
        
        setRecentInvoices(invoicesData || []);
        
        // Get current month for due invoices
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        
        // Fetch invoices due this month
        const { data: dueInvoicesData, error: dueInvoicesError } = await supabase
          .from('invoices')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'Pending')
          .gte('due_date', firstDayOfMonth.toISOString().split('T')[0])
          .lte('due_date', lastDayOfMonth.toISOString().split('T')[0])
          .order('due_date', { ascending: true });
          
        if (dueInvoicesError) throw dueInvoicesError;
        
        setDueInvoices(dueInvoicesData || []);
        
        // Calculate invoice statistics
        const { data: allInvoices, error: allInvoicesError } = await supabase
          .from('invoices')
          .select('id, status, total')
          .eq('user_id', user.id);
          
        if (allInvoicesError) throw allInvoicesError;
        
        if (allInvoices) {
          const totalAmount = allInvoices.reduce((sum, invoice) => sum + (invoice.total || 0), 0);
          const paidAmount = allInvoices
            .filter(invoice => invoice.status === 'Paid')
            .reduce((sum, invoice) => sum + (invoice.total || 0), 0);
          const pendingAmount = allInvoices
            .filter(invoice => invoice.status === 'Pending')
            .reduce((sum, invoice) => sum + (invoice.total || 0), 0);
          const overdueAmount = allInvoices
            .filter(invoice => invoice.status === 'Overdue')
            .reduce((sum, invoice) => sum + (invoice.total || 0), 0);
          
          setStats({
            total: totalAmount,
            paid: paidAmount,
            pending: pendingAmount,
            overdue: overdueAmount
          });
        }
      } catch (error) {
        console.error('Error loading invoice dashboard data:', error);
        setError('Failed to load invoice data. Please try refreshing the page.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);

  const handleViewInvoice = (invoiceId) => {
    window.location.href = `/dashboard/invoices/${invoiceId}`;
  };

  // Format numbers as currency
  const formatCurrency = (value) => {
    return value.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw size={32} className="animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <QuickActionButton 
            icon={<Plus size={20} />} 
            label="New Invoice" 
            onClick={() => window.location.href = '/dashboard/invoices/new'} 
            color="blue"
          />
          <QuickActionButton 
            icon={<CreditCard size={20} />} 
            label="Record Payment" 
            onClick={() => window.location.href = '/dashboard/invoices?filter=pending'} 
            color="green"
          />
          <QuickActionButton 
            icon={<Mail size={20} />} 
            label="Send Reminder" 
            onClick={() => window.location.href = '/dashboard/invoices?filter=overdue'} 
            color="yellow"
          />
          <QuickActionButton 
            icon={<BarChart2 size={20} />} 
            label="View Reports" 
            onClick={() => window.location.href = '/dashboard/reports/invoices'} 
            color="purple"
          />
        </div>
      </div>

      {/* Two-column layout for Recent Invoices and Due This Month */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">Recent Invoices</h2>
            <Link href="/dashboard/invoices" className="text-sm text-blue-600 hover:text-blue-800 flex items-center">
              View All <ChevronRight size={16} className="ml-1" />
            </Link>
          </div>
          <div className="p-6">
            {recentInvoices.length === 0 ? (
              <EmptyState 
                message="Create your first invoice to get started" 
                icon={<FileText size={24} className="text-gray-400" />}
                buttonText="Create Invoice"
                buttonLink="/dashboard/invoices/new"
              />
            ) : (
              recentInvoices.map(invoice => (
                <RecentInvoiceItem 
                  key={invoice.id} 
                  invoice={invoice} 
                  onViewInvoice={handleViewInvoice} 
                />
              ))
            )}
          </div>
        </div>

        {/* Due This Month */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">Due This Month</h2>
            <Link href="/dashboard/invoices?filter=due" className="text-sm text-blue-600 hover:text-blue-800 flex items-center">
              View All <ChevronRight size={16} className="ml-1" />
            </Link>
          </div>
          <div className="p-6">
            {dueInvoices.length === 0 ? (
              <EmptyState 
                message="No invoices due this month" 
                icon={<Calendar size={24} className="text-gray-400" />}
                buttonText="View All Invoices"
                buttonLink="/dashboard/invoices"
              />
            ) : (
              dueInvoices.map(invoice => (
                <DueThisMonthItem key={invoice.id} invoice={invoice} />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Payment Performance (Summary) */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Payment Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-500">Average Days to Payment</p>
            <p className="text-2xl font-bold text-gray-900">12.5</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-500">Collection Rate</p>
            <p className="text-2xl font-bold text-gray-900">87%</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-500">Open Invoices</p>
            <p className="text-2xl font-bold text-gray-900">{recentInvoices.filter(inv => inv.status === 'Pending' || inv.status === 'Overdue').length}</p>
          </div>
        </div>
        <div className="flex justify-end">
          <Link 
            href="/dashboard/reports/invoices" 
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
          >
            View Detailed Reports <ChevronRight size={16} className="ml-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}