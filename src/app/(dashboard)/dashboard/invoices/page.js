"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import {
  FileText,
  Plus,
  Download,
  Search,
  Clock,
  CheckCircle,
  RefreshCw,
  ArrowRight,
  Edit,
  Eye,
  Trash2,
  DollarSign,
  AlertCircle,
  X,
  Lock
} from "lucide-react";
import {
  fetchInvoices,
  updateInvoiceStatus,
  recordPayment,
  deleteInvoice,
  checkAndUpdateOverdueInvoices
} from "@/lib/services/invoiceService";
import { LimitReachedPrompt } from "@/components/billing/UpgradePrompt";
import { formatDateForDisplayMMDDYYYY } from "@/lib/utils/dateUtils";
import { getUserFriendlyError } from "@/lib/utils/errorMessages";
import { usePagination, Pagination } from "@/hooks/usePagination";
import { OperationMessage, EmptyState } from "@/components/ui/OperationMessage";

// Import components
import InvoiceStatsComponent from "@/components/invoices/InvoiceStatsComponent";
import DeleteInvoiceModal from "@/components/invoices/DeleteInvoiceModal";
import ExportReportModal from "@/components/common/ExportReportModal";
import TutorialCard from "@/components/shared/TutorialCard";
import PaymentModal from "@/components/invoices/PaymentModal";

// Local storage key for filter persistence
const STORAGE_KEY = 'invoice_filters';

// Loading skeleton component
function LoadingSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Stats skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
          </div>
        ))}
      </div>

      {/* Content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 mb-6">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
            ))}
          </div>
        </div>
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Main Invoices Dashboard Component
export default function Page() {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [user, setUser] = useState(null);

  // Feature access for resource limits
  const { checkResourceUpgrade, getResourceLimit, loading: featureLoading } = useFeatureAccess();
  const [monthlyInvoiceCount, setMonthlyInvoiceCount] = useState(0);

  // Invoices state
  const [invoices, setInvoices] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    paid: 0,
    pending: 0,
    overdue: 0,
    draftCount: 0,
  });

  // Filter state - restore from localStorage
  const [filters, setFilters] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) return JSON.parse(saved);
      } catch (e) {
        // Ignore localStorage errors
      }
    }
    return {
      status: "all",
      dateRange: "all",
      search: "",
      sortBy: "invoice_date",
      sortDirection: "desc"
    };
  });

  // Modal states
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [currentInvoice, setCurrentInvoice] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);

  // Save filters to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
      } catch (e) {
        // Ignore localStorage errors
      }
    }
  }, [filters]);

  // Apply filters to invoices
  const filteredInvoices = useMemo(() => {
    let result = [...invoices];

    // Filter by status
    if (filters.status !== "all") {
      result = result.filter(item => item.status?.toLowerCase() === filters.status.toLowerCase());
    }

    // Filter by date range
    if (filters.dateRange !== "all") {
      const today = new Date();
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(today.getDate() - 30);

      const ninetyDaysAgo = new Date(today);
      ninetyDaysAgo.setDate(today.getDate() - 90);

      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDayOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      const firstDayOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const firstDayOfYear = new Date(today.getFullYear(), 0, 1);

      switch (filters.dateRange) {
        case "last30":
          result = result.filter(item => new Date(item.invoice_date) >= thirtyDaysAgo);
          break;
        case "last90":
          result = result.filter(item => new Date(item.invoice_date) >= ninetyDaysAgo);
          break;
        case "thisMonth":
          result = result.filter(item => new Date(item.invoice_date) >= firstDayOfMonth);
          break;
        case "lastMonth":
          result = result.filter(item =>
            new Date(item.invoice_date) >= firstDayOfLastMonth &&
            new Date(item.invoice_date) <= lastDayOfLastMonth
          );
          break;
        case "thisYear":
          result = result.filter(item => new Date(item.invoice_date) >= firstDayOfYear);
          break;
        default:
          break;
      }
    }

    // Filter by search term
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(item =>
        (item.invoice_number && item.invoice_number.toLowerCase().includes(searchLower)) ||
        (item.customer && item.customer.toLowerCase().includes(searchLower)) ||
        (item.description && item.description.toLowerCase().includes(searchLower))
      );
    }

    // Sort items
    result.sort((a, b) => {
      let valueA, valueB;

      switch (filters.sortBy) {
        case "invoice_date":
          valueA = new Date(a.invoice_date || 0);
          valueB = new Date(b.invoice_date || 0);
          break;
        case "due_date":
          valueA = new Date(a.due_date || 0);
          valueB = new Date(b.due_date || 0);
          break;
        case "total":
          valueA = parseFloat(a.total || 0);
          valueB = parseFloat(b.total || 0);
          break;
        case "status":
          valueA = a.status || "";
          valueB = b.status || "";
          break;
        case "customer":
          valueA = a.customer || "";
          valueB = b.customer || "";
          break;
        default:
          valueA = new Date(a.invoice_date || 0);
          valueB = new Date(b.invoice_date || 0);
      }

      if (filters.sortDirection === "asc") {
        return valueA > valueB ? 1 : -1;
      } else {
        return valueA < valueB ? 1 : -1;
      }
    });

    return result;
  }, [invoices, filters]);

  // Pagination
  const {
    paginatedData,
    currentPage,
    totalPages,
    goToPage,
    hasNextPage,
    hasPrevPage,
    pageNumbers,
    showingText
  } = usePagination(filteredInvoices, { itemsPerPage: 10 });

  // Get upcoming payments (due within 7 days)
  const upcomingPayments = useMemo(() => {
    const today = new Date();
    return invoices
      .filter(inv => {
        const status = inv.status?.toLowerCase();
        if (status !== 'pending' && status !== 'sent') return false;
        if (!inv.due_date) return false;
        const dueDate = new Date(inv.due_date);
        const differenceInTime = dueDate - today;
        const differenceInDays = Math.ceil(differenceInTime / (1000 * 3600 * 24));
        return differenceInDays >= 0 && differenceInDays <= 7;
      })
      .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
      .slice(0, 5);
  }, [invoices]);

  // Get overdue invoices
  const overdueInvoices = useMemo(() => {
    return invoices
      .filter(inv => inv.status?.toLowerCase() === 'overdue')
      .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
      .slice(0, 5);
  }, [invoices]);

  // Calculate stats
  const calculateStats = useCallback((items) => {
    if (!items) return;

    const total = items.reduce((sum, item) => sum + parseFloat(item.total || 0), 0);
    // Use case-insensitive comparison for status
    const paid = items.filter(item => item.status?.toLowerCase() === 'paid').length;
    const pending = items.filter(item => {
      const status = item.status?.toLowerCase();
      return status === 'pending' || status === 'sent';
    }).length;
    const overdue = items.filter(item => item.status?.toLowerCase() === 'overdue').length;
    const draftCount = items.filter(item => item.status?.toLowerCase() === 'draft').length;

    setStats({
      total,
      paid,
      pending,
      overdue,
      draftCount
    });
  }, []);

  // Fetch monthly invoice count for resource limits
  const fetchMonthlyInvoiceCount = useCallback(async (userId) => {
    try {
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

      const { count, error } = await supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', firstDayOfMonth)
        .lte('created_at', lastDayOfMonth);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      return 0;
    }
  }, []);

  // Fetch user and invoices on mount
  useEffect(() => {
    let channel = null;

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

        // Check for overdue invoices and update their status
        await checkAndUpdateOverdueInvoices(user.id);

        // Fetch invoices
        const items = await fetchInvoices(user.id);
        setInvoices(items);
        calculateStats(items);

        // Fetch monthly invoice count for resource limits
        const count = await fetchMonthlyInvoiceCount(user.id);
        setMonthlyInvoiceCount(count);

        // Set up real-time subscription
        channel = supabase
          .channel('invoices-changes')
          .on('postgres_changes',
            { event: '*', schema: 'public', table: 'invoices', filter: `user_id=eq.${user.id}` },
            async (payload) => {
              if (payload.eventType === 'INSERT') {
                setInvoices(prev => [payload.new, ...prev]);
                // Update monthly count when new invoice is created
                const newCount = await fetchMonthlyInvoiceCount(user.id);
                setMonthlyInvoiceCount(newCount);
              } else if (payload.eventType === 'UPDATE') {
                setInvoices(prev => prev.map(item => item.id === payload.new.id ? payload.new : item));
              } else if (payload.eventType === 'DELETE') {
                setInvoices(prev => prev.filter(item => item.id !== payload.old.id));
                // Update monthly count when invoice is deleted
                const newCount = await fetchMonthlyInvoiceCount(user.id);
                setMonthlyInvoiceCount(newCount);
              }
              // Recalculate stats
              fetchInvoices(user.id).then(items => calculateStats(items));
            }
          )
          .subscribe();

        setLoading(false);
      } catch (error) {
        setMessage({ type: 'error', text: getUserFriendlyError(error) });
        setLoading(false);
      }
    }

    initialize();

    // Cleanup subscription on unmount
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [calculateStats, fetchMonthlyInvoiceCount]);

  // Open export modal
  const handleExportData = useCallback(() => {
    if (filteredInvoices.length === 0) return;
    setExportModalOpen(true);
  }, [filteredInvoices]);

  // Export columns configuration
  const exportColumns = [
    { key: 'invoice_number', header: 'Invoice #' },
    { key: 'customer', header: 'Customer' },
    { key: 'invoice_date', header: 'Invoice Date', format: 'date' },
    { key: 'due_date', header: 'Due Date', format: 'date' },
    { key: 'total', header: 'Amount', format: 'currency' },
    { key: 'status', header: 'Status' }
  ];

  // Get export data
  const getExportData = useCallback(() => {
    return filteredInvoices.map(inv => ({
      invoice_number: inv.invoice_number || '',
      customer: inv.customer || '',
      description: inv.description || '',
      invoice_date: inv.invoice_date || '',
      due_date: inv.due_date || '',
      total: parseFloat(inv.total || 0),
      status: inv.status || ''
    }));
  }, [filteredInvoices]);

  // Get export summary info
  const getExportSummaryInfo = useCallback(() => {
    const totalAmount = filteredInvoices.reduce((sum, inv) => sum + parseFloat(inv.total || 0), 0);
    const paidCount = filteredInvoices.filter(inv => inv.status?.toLowerCase() === 'paid').length;
    const pendingCount = filteredInvoices.filter(inv => {
      const status = inv.status?.toLowerCase();
      return status === 'pending' || status === 'sent';
    }).length;
    const overdueCount = filteredInvoices.filter(inv => inv.status?.toLowerCase() === 'overdue').length;
    const paidAmount = filteredInvoices
      .filter(inv => inv.status?.toLowerCase() === 'paid')
      .reduce((sum, inv) => sum + parseFloat(inv.total || 0), 0);
    const outstandingAmount = filteredInvoices
      .filter(inv => inv.status?.toLowerCase() !== 'paid')
      .reduce((sum, inv) => sum + parseFloat(inv.total || 0), 0);

    return {
      'Total Invoices': filteredInvoices.length.toString(),
      'Total Amount': `$${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      'Paid': `${paidCount} ($${paidAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`,
      'Pending': pendingCount.toString(),
      'Overdue': overdueCount.toString(),
      'Outstanding': `$${outstandingAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    };
  }, [filteredInvoices]);

  // Get date range for export
  const getExportDateRange = useCallback(() => {
    if (filteredInvoices.length === 0) return null;

    const dates = filteredInvoices
      .filter(inv => inv.invoice_date)
      .map(inv => new Date(inv.invoice_date))
      .sort((a, b) => a - b);

    if (dates.length === 0) return null;

    return {
      start: dates[0].toISOString().split('T')[0],
      end: dates[dates.length - 1].toISOString().split('T')[0]
    };
  }, [filteredInvoices]);

  // Handle filter changes
  const handleFilterChange = useCallback((e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  }, []);

  // Handle search
  const handleSearch = useCallback((e) => {
    setFilters(prev => ({ ...prev, search: e.target.value }));
  }, []);

  // Reset filters
  const resetFilters = useCallback(() => {
    setFilters({
      status: "all",
      dateRange: "all",
      search: "",
      sortBy: "invoice_date",
      sortDirection: "desc"
    });
  }, []);

  // Handle opening payment modal for marking invoice as paid
  const handleMarkAsPaid = (invoiceId) => {
    const invoice = invoices.find(inv => inv.id === invoiceId);
    if (!invoice || invoice.status?.toLowerCase() === 'paid') return;

    // Set current invoice and open payment modal
    setCurrentInvoice(invoice);
    setPaymentModalOpen(true);
  };

  // Handle recording payment from modal
  const handleRecordPayment = async (paymentData) => {
    if (!currentInvoice) return;

    try {
      setIsRecordingPayment(true);

      // Format the payment data
      const formattedPayment = {
        amount: parseFloat(paymentData.amount),
        method: paymentData.method,
        date: paymentData.date,
        reference: paymentData.reference || '',
        notes: paymentData.notes || '',
        description: `Payment for invoice ${currentInvoice.invoice_number}`,
        status: 'completed'
      };

      // Record the payment (this will also update the status and amount_paid)
      await recordPayment(currentInvoice.id, formattedPayment);

      // Force refresh of stats by setting a session flag
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem('dashboard-refresh-needed', 'true');
      }

      // Calculate new values for local state update
      const currentTotal = parseFloat(currentInvoice.total) || 0;
      const currentPaid = parseFloat(currentInvoice.amount_paid) || 0;
      const newAmountPaid = currentPaid + parseFloat(paymentData.amount);
      const newStatus = newAmountPaid >= currentTotal ? 'Paid' : 'Partially Paid';

      // Update local state
      const updatedInvoices = invoices.map(inv =>
        inv.id === currentInvoice.id
          ? { ...inv, status: newStatus, amount_paid: newAmountPaid }
          : inv
      );

      setInvoices(updatedInvoices);
      calculateStats(updatedInvoices);
      setPaymentModalOpen(false);
      setCurrentInvoice(null);
      setMessage({ type: 'success', text: 'Payment recorded successfully' });
    } catch (error) {
      setMessage({ type: 'error', text: getUserFriendlyError(error) });
    } finally {
      setIsRecordingPayment(false);
    }
  };

  // Handle deleting invoice
  const handleDeleteInvoice = (invoice) => {
    setCurrentInvoice(invoice);
    setDeleteModalOpen(true);
  };

  // Confirm delete invoice
  const confirmDeleteInvoice = async (deleteAssociatedLoad = false) => {
    if (!currentInvoice) return;

    try {
      setIsDeleting(true);
      await deleteInvoice(currentInvoice.id, deleteAssociatedLoad);

      // Update local state
      const updatedInvoices = invoices.filter(inv => inv.id !== currentInvoice.id);
      setInvoices(updatedInvoices);
      calculateStats(updatedInvoices);

      setDeleteModalOpen(false);
      setCurrentInvoice(null);
      setMessage({ type: 'success', text: 'Invoice deleted successfully' });
    } catch (error) {
      setMessage({ type: 'error', text: getUserFriendlyError(error) });
    } finally {
      setIsDeleting(false);
    }
  };

  // Navigate to invoice detail page
  const handleViewInvoice = (invoiceId) => {
    window.location.href = `/dashboard/invoices/${invoiceId}`;
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `$${parseFloat(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Get status badge styling
  const getStatusBadge = useCallback((status) => {
    const statusLower = status?.toLowerCase() || '';
    switch (statusLower) {
      case 'paid':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'pending':
      case 'sent':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case 'overdue':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'draft':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    }
  }, []);

  // Get days until due or overdue
  const getDaysInfo = (dueDate, status) => {
    if (!dueDate) return null;
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (status === 'overdue' || diffDays < 0) {
      return { text: `${Math.abs(diffDays)} days overdue`, isOverdue: true };
    } else if (diffDays === 0) {
      return { text: 'Due today', isOverdue: false };
    } else if (diffDays <= 7) {
      return { text: `Due in ${diffDays} days`, isOverdue: false };
    }
    return null;
  };

  // Resource limit checks
  const invoiceLimit = getResourceLimit('invoicesPerMonth');
  const needsUpgradeForInvoices = checkResourceUpgrade('invoicesPerMonth', monthlyInvoiceCount + 1);
  const isAtInvoiceLimit = invoiceLimit !== null && monthlyInvoiceCount >= invoiceLimit;
  const isNearInvoiceLimit = invoiceLimit !== null && monthlyInvoiceCount >= Math.floor(invoiceLimit * 0.8) && !isAtInvoiceLimit;

  if (loading || featureLoading) {
    return (
      <DashboardLayout activePage="invoices">
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-7xl mx-auto">
            {/* Header skeleton */}
            <div className="mb-8 bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-700 dark:to-blue-600 rounded-xl shadow-md p-6">
              <div className="animate-pulse">
                <div className="h-8 bg-white/20 rounded w-64 mb-2"></div>
                <div className="h-4 bg-white/20 rounded w-96"></div>
              </div>
            </div>
            <LoadingSkeleton />
          </div>
        </main>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activePage="invoices">
      <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          {/* Header with gradient */}
          <div className="mb-8 bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-700 dark:to-blue-600 rounded-xl shadow-md p-6 text-white">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="mb-4 md:mb-0">
                <h1 className="text-3xl font-bold mb-1">Invoice Management</h1>
                <p className="text-blue-100">Track and manage all your customer invoices and payments</p>
              </div>
              <div className="flex flex-wrap gap-3">
                {isAtInvoiceLimit ? (
                  <button
                    disabled
                    className="px-4 py-2 bg-white/50 text-gray-400 rounded-lg shadow-sm flex items-center font-medium cursor-not-allowed"
                    title={`Monthly invoice limit reached (${monthlyInvoiceCount}/${invoiceLimit})`}
                  >
                    <Lock size={18} className="mr-2" />
                    Limit Reached
                  </button>
                ) : (
                  <Link
                    href="/dashboard/invoices/new"
                    className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors shadow-sm flex items-center font-medium"
                  >
                    <Plus size={18} className="mr-2" />
                    New Invoice
                  </Link>
                )}
                <button
                  onClick={handleExportData}
                  className="px-4 py-2 bg-blue-700 dark:bg-blue-800 text-white rounded-lg hover:bg-blue-800 dark:hover:bg-blue-900 transition-colors shadow-sm flex items-center font-medium"
                  disabled={invoices.length === 0}
                >
                  <Download size={18} className="mr-2" />
                  Export Data
                </button>
              </div>
            </div>
          </div>

          {/* Operation message */}
          <OperationMessage
            message={message}
            onDismiss={() => setMessage(null)}
          />

          {/* Tutorial Card */}
          <TutorialCard
            pageId="invoices"
            title="Invoice Management"
            description="Create, track, and manage professional invoices for your trucking services. Get paid faster with organized billing."
            features={[
              {
                icon: FileText,
                title: "Create Professional Invoices",
                description: "Generate detailed invoices with line items, tax calculations, and payment terms"
              },
              {
                icon: DollarSign,
                title: "Track Payments",
                description: "Monitor payment status, mark invoices as paid, and track outstanding balances"
              },
              {
                icon: Clock,
                title: "Due Date Alerts",
                description: "Stay on top of accounts receivable with upcoming and overdue payment alerts"
              },
              {
                icon: Download,
                title: "Export Reports",
                description: "Download invoice reports in PDF, CSV, or TXT format for your records"
              }
            ]}
            tips={[
              "Complete loads can be automatically converted to invoices",
              "Set appropriate payment terms (Net 15, Net 30) based on customer agreements",
              "Review overdue invoices regularly and follow up with customers",
              "Use the export feature to generate billing reports for accounting"
            ]}
            accentColor="blue"
            userId={user?.id}
          />

          {/* Limit reached prompt */}
          {isAtInvoiceLimit && (
            <div className="mb-6">
              <LimitReachedPrompt
                resource="invoicesPerMonth"
                current={monthlyInvoiceCount}
                limit={invoiceLimit}
              />
            </div>
          )}

          {/* Approaching limit warning */}
          {isNearInvoiceLimit && (
            <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-medium text-amber-800 dark:text-amber-200">
                    Approaching Invoice Limit
                  </h3>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                    You've used {monthlyInvoiceCount} of {invoiceLimit} invoices this month.
                    <Link href="/dashboard/upgrade" className="ml-1 underline font-medium hover:text-amber-900 dark:hover:text-amber-100">
                      Upgrade for unlimited invoices
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Statistics */}
          <InvoiceStatsComponent stats={stats} formatCurrency={formatCurrency} />

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Sidebar */}
            <div className="lg:col-span-1">
              {/* Payments Due Soon Card */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden mb-6 border border-gray-200 dark:border-gray-700">
                <div className="bg-orange-500 dark:bg-orange-600 px-5 py-4 text-white">
                  <h3 className="font-semibold flex items-center">
                    <Clock size={18} className="mr-2" />
                    Payments Due Soon
                  </h3>
                </div>
                <div className="p-4">
                  {upcomingPayments.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <CheckCircle size={36} className="mx-auto mb-2 text-green-500 dark:text-green-400" />
                      <p>No payments due soon</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {upcomingPayments.map(invoice => {
                        const daysInfo = getDaysInfo(invoice.due_date, invoice.status);
                        return (
                          <div
                            key={invoice.id}
                            className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/20 cursor-pointer transition-colors"
                            onClick={() => handleViewInvoice(invoice.id)}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">{invoice.customer}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">#{invoice.invoice_number}</p>
                              </div>
                              <div className="text-right ml-2">
                                <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">{formatCurrency(invoice.total)}</p>
                                {daysInfo && (
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                    daysInfo.text === 'Due today'
                                      ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                      : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
                                  }`}>
                                    {daysInfo.text}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600 text-center">
                        <button
                          onClick={() => setFilters({ ...filters, status: 'pending' })}
                          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center justify-center w-full"
                        >
                          View all pending invoices
                          <ArrowRight size={14} className="ml-1" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Overdue Invoices Card */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden mb-6 border border-gray-200 dark:border-gray-700">
                <div className="bg-red-500 dark:bg-red-600 px-5 py-4 text-white">
                  <h3 className="font-semibold flex items-center">
                    <AlertCircle size={18} className="mr-2" />
                    Overdue Invoices
                  </h3>
                </div>
                <div className="p-4">
                  {overdueInvoices.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <CheckCircle size={36} className="mx-auto mb-2 text-green-500 dark:text-green-400" />
                      <p>No overdue invoices</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {overdueInvoices.map(invoice => {
                        const daysInfo = getDaysInfo(invoice.due_date, invoice.status);
                        return (
                          <div
                            key={invoice.id}
                            className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer transition-colors"
                            onClick={() => handleViewInvoice(invoice.id)}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">{invoice.customer}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">#{invoice.invoice_number}</p>
                              </div>
                              <div className="text-right ml-2">
                                <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">{formatCurrency(invoice.total)}</p>
                                {daysInfo && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                                    {daysInfo.text}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600 text-center">
                        <button
                          onClick={() => setFilters({ ...filters, status: 'overdue' })}
                          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center justify-center w-full"
                        >
                          View all overdue invoices
                          <ArrowRight size={14} className="ml-1" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions Card */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden mb-6 border border-gray-200 dark:border-gray-700">
                <div className="bg-blue-500 dark:bg-blue-600 px-5 py-4 text-white">
                  <h3 className="font-semibold flex items-center">
                    <FileText size={18} className="mr-2" />
                    Quick Actions
                  </h3>
                </div>
                <div className="p-4">
                  {isAtInvoiceLimit ? (
                    <div className="mb-3 p-3 rounded-lg flex items-center bg-gray-100 dark:bg-gray-700 opacity-60 cursor-not-allowed w-full">
                      <div className="rounded-md bg-white dark:bg-gray-800 p-2 shadow-sm">
                        <Lock className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                      </div>
                      <span className="ml-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                        Limit Reached ({monthlyInvoiceCount}/{invoiceLimit})
                      </span>
                    </div>
                  ) : (
                    <Link
                      href="/dashboard/invoices/new"
                      className="mb-3 p-3 rounded-lg flex items-center cursor-pointer transition-colors bg-gray-50 dark:bg-gray-700/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 w-full"
                    >
                      <div className="rounded-md bg-white dark:bg-gray-800 p-2 shadow-sm">
                        <Plus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-200">Create Invoice</span>
                    </Link>
                  )}

                  <button
                    onClick={() => setFilters({ ...filters, status: 'pending' })}
                    className="mb-3 p-3 rounded-lg flex items-center cursor-pointer transition-colors bg-gray-50 dark:bg-gray-700/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 w-full"
                  >
                    <div className="rounded-md bg-white dark:bg-gray-800 p-2 shadow-sm">
                      <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-200">Record Payment</span>
                  </button>

                  <button
                    onClick={() => setFilters({ ...filters, status: 'draft' })}
                    className="mb-3 p-3 rounded-lg flex items-center cursor-pointer transition-colors bg-gray-50 dark:bg-gray-700/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 w-full"
                  >
                    <div className="rounded-md bg-white dark:bg-gray-800 p-2 shadow-sm">
                      <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-200">Draft Invoices</span>
                  </button>

                  <button
                    onClick={handleExportData}
                    className="p-3 rounded-lg flex items-center cursor-pointer transition-colors bg-gray-50 dark:bg-gray-700/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 w-full"
                    disabled={invoices.length === 0}
                  >
                    <div className="rounded-md bg-white dark:bg-gray-800 p-2 shadow-sm">
                      <Download className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                    </div>
                    <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-200">Export Invoices</span>
                  </button>

                  <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600 text-center">
                    {isAtInvoiceLimit ? (
                      <span className="text-sm text-gray-400 dark:text-gray-500 flex items-center justify-center w-full">
                        <Lock size={14} className="mr-1" />
                        Upgrade to create more invoices
                      </span>
                    ) : (
                      <Link
                        href="/dashboard/invoices/new"
                        className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center justify-center w-full"
                      >
                        Create new invoice
                        <Plus size={14} className="ml-1" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {/* Filters */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
                <div className="flex flex-col lg:flex-row gap-4">
                  {/* Search Input */}
                  <div className="flex-1 relative">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={filters.search}
                      onChange={handleSearch}
                      placeholder="Search by invoice #, customer, or description..."
                      className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                    {filters.search && (
                      <button
                        onClick={() => setFilters(prev => ({ ...prev, search: '' }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>

                  {/* Filter Dropdowns */}
                  <div className="flex flex-wrap gap-3">
                    <select
                      name="status"
                      value={filters.status}
                      onChange={handleFilterChange}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 min-w-[140px] transition-colors"
                    >
                      <option value="all">All Statuses</option>
                      <option value="paid">Paid</option>
                      <option value="pending">Pending</option>
                      <option value="overdue">Overdue</option>
                      <option value="draft">Draft</option>
                      <option value="sent">Sent</option>
                    </select>

                    <select
                      name="dateRange"
                      value={filters.dateRange}
                      onChange={handleFilterChange}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 min-w-[140px] transition-colors"
                    >
                      <option value="all">All Time</option>
                      <option value="last30">Last 30 Days</option>
                      <option value="last90">Last 90 Days</option>
                      <option value="thisMonth">This Month</option>
                      <option value="lastMonth">Last Month</option>
                      <option value="thisYear">This Year</option>
                    </select>

                    <select
                      name="sortBy"
                      value={filters.sortBy}
                      onChange={handleFilterChange}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 min-w-[130px] transition-colors"
                    >
                      <option value="invoice_date">Invoice Date</option>
                      <option value="due_date">Due Date</option>
                      <option value="total">Amount</option>
                      <option value="customer">Customer</option>
                      <option value="status">Status</option>
                    </select>

                    {/* Reset Filters Button */}
                    <button
                      onClick={resetFilters}
                      className="px-3 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Reset Filters"
                      disabled={
                        filters.status === "all" &&
                        filters.dateRange === "all" &&
                        filters.search === "" &&
                        filters.sortBy === "invoice_date"
                      }
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Invoice Table */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
                <div className="bg-gray-50 dark:bg-gray-700/50 px-5 py-4 border-b border-gray-200 dark:border-gray-600 flex justify-between items-center">
                  <h3 className="font-medium text-gray-700 dark:text-gray-200">Invoice Records</h3>
                  {isAtInvoiceLimit ? (
                    <span className="flex items-center text-sm text-gray-400 dark:text-gray-500">
                      <Lock size={16} className="mr-1" />
                      Limit Reached
                    </span>
                  ) : (
                    <Link
                      href="/dashboard/invoices/new"
                      className="flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                    >
                      <Plus size={16} className="mr-1" />
                      Add New
                    </Link>
                  )}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block">
                  <table className="w-full table-fixed divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                      <tr>
                        <th scope="col" className="w-[20%] px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Invoice
                        </th>
                        <th scope="col" className="w-[20%] px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Customer
                        </th>
                        <th scope="col" className="w-[12%] px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Invoice Date
                        </th>
                        <th scope="col" className="w-[12%] px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Due Date
                        </th>
                        <th scope="col" className="w-[12%] px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Amount
                        </th>
                        <th scope="col" className="w-[10%] px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="w-[14%] px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {paginatedData.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="px-6 py-12 text-center">
                            {invoices.length === 0 ? (
                              <div className="max-w-sm mx-auto">
                                <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                                  <FileText className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">No invoices yet</h3>
                                <p className="text-gray-500 dark:text-gray-400 mb-4">Create your first invoice to start tracking payments.</p>
                                {isAtInvoiceLimit ? (
                                  <button
                                    disabled
                                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gray-400 cursor-not-allowed"
                                  >
                                    <Lock size={16} className="mr-2" />
                                    Limit Reached
                                  </button>
                                ) : (
                                  <Link
                                    href="/dashboard/invoices/new"
                                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                                  >
                                    <Plus size={16} className="mr-2" />
                                    Create Invoice
                                  </Link>
                                )}
                              </div>
                            ) : (
                              <div>
                                <p className="text-gray-500 dark:text-gray-400 mb-2">No invoices match your current filters</p>
                                <button
                                  onClick={resetFilters}
                                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                                >
                                  <RefreshCw size={14} className="mr-1" />
                                  Reset Filters
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ) : (
                        paginatedData.map(invoice => (
                          <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                            <td className="px-4 py-3">
                              <button
                                onClick={() => handleViewInvoice(invoice.id)}
                                className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline truncate block max-w-full text-left"
                                title={`Invoice #${invoice.invoice_number}`}
                              >
                                #{invoice.invoice_number}
                              </button>
                            </td>
                            <td className="text-gray-900 dark:text-gray-100 px-4 py-3">
                              <span className="truncate block" title={invoice.customer}>{invoice.customer}</span>
                            </td>
                            <td className="text-gray-900 dark:text-gray-100 px-4 py-3 text-sm">
                              {invoice.invoice_date ? formatDateForDisplayMMDDYYYY(invoice.invoice_date) : '-'}
                            </td>
                            <td className="text-gray-900 dark:text-gray-100 px-4 py-3 text-sm">
                              {invoice.due_date ? formatDateForDisplayMMDDYYYY(invoice.due_date) : '-'}
                            </td>
                            <td className="text-gray-900 dark:text-gray-100 px-4 py-3 text-sm font-medium">
                              {formatCurrency(invoice.total)}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusBadge(invoice.status)}`}>
                                {invoice.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex justify-center space-x-1">
                                <button
                                  onClick={() => handleViewInvoice(invoice.id)}
                                  className="p-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                                  title="View"
                                >
                                  <Eye size={16} />
                                </button>
                                {invoice.status?.toLowerCase() !== 'paid' && (
                                  <button
                                    onClick={() => handleMarkAsPaid(invoice.id)}
                                    className="p-1.5 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors"
                                    title="Mark as Paid"
                                  >
                                    <DollarSign size={16} />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteInvoice(invoice)}
                                  className="p-1.5 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden p-4 space-y-4">
                  {paginatedData.length === 0 ? (
                    invoices.length === 0 ? (
                      isAtInvoiceLimit ? (
                        <EmptyState
                          icon={Lock}
                          title="Invoice Limit Reached"
                          description={`You've used ${monthlyInvoiceCount}/${invoiceLimit} invoices this month. Upgrade your plan for unlimited invoices.`}
                          action={{
                            label: 'Upgrade Plan',
                            onClick: () => window.location.href = '/dashboard/upgrade',
                            icon: Lock
                          }}
                        />
                      ) : (
                        <EmptyState
                          icon={FileText}
                          title="No invoices yet"
                          description="Create your first invoice to start tracking payments."
                          action={{
                            label: 'Create Invoice',
                            onClick: () => window.location.href = '/dashboard/invoices/new',
                            icon: Plus
                          }}
                        />
                      )
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500 dark:text-gray-400 mb-4">No invoices match your current filters</p>
                        <button
                          onClick={resetFilters}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                        >
                          <RefreshCw size={14} className="mr-2" />
                          Reset Filters
                        </button>
                      </div>
                    )
                  ) : (
                    paginatedData.map(invoice => (
                      <div
                        key={invoice.id}
                        className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <button
                            onClick={() => handleViewInvoice(invoice.id)}
                            className="font-medium text-blue-600 dark:text-blue-400 hover:underline text-left"
                          >
                            #{invoice.invoice_number}
                          </button>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusBadge(invoice.status)}`}>
                            {invoice.status}
                          </span>
                        </div>
                        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                          <p><span className="font-medium">Customer:</span> {invoice.customer}</p>
                          <p><span className="font-medium">Amount:</span> {formatCurrency(invoice.total)}</p>
                          <p><span className="font-medium">Invoice Date:</span> {invoice.invoice_date ? formatDateForDisplayMMDDYYYY(invoice.invoice_date) : '-'}</p>
                          <p><span className="font-medium">Due Date:</span> {invoice.due_date ? formatDateForDisplayMMDDYYYY(invoice.due_date) : '-'}</p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600 flex justify-end space-x-2">
                          <button
                            onClick={() => handleViewInvoice(invoice.id)}
                            className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50"
                          >
                            <Eye size={18} />
                          </button>
                          {invoice.status?.toLowerCase() !== 'paid' && (
                            <button
                              onClick={() => handleMarkAsPaid(invoice.id)}
                              className="p-2 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/50"
                            >
                              <DollarSign size={18} />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteInvoice(invoice)}
                            className="p-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Pagination */}
                {filteredInvoices.length > 0 && (
                  <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-600">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      pageNumbers={pageNumbers}
                      onPageChange={goToPage}
                      hasNextPage={hasNextPage}
                      hasPrevPage={hasPrevPage}
                      showingText={showingText}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Delete confirmation modal */}
        <DeleteInvoiceModal
          isOpen={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setCurrentInvoice(null);
          }}
          onConfirm={confirmDeleteInvoice}
          invoice={currentInvoice}
          isDeleting={isDeleting}
        />

        {/* Export Report Modal */}
        <ExportReportModal
          isOpen={exportModalOpen}
          onClose={() => setExportModalOpen(false)}
          title="Export Invoices Report"
          description="Export your invoice records in multiple formats. Choose PDF for professional reports, CSV for spreadsheets, or TXT for simple text records."
          data={getExportData()}
          columns={exportColumns}
          filename="invoices_report"
          summaryInfo={getExportSummaryInfo()}
          dateRange={getExportDateRange()}
          pdfConfig={{
            title: 'Invoice Report',
            subtitle: 'Billing & Accounts Receivable'
          }}
          onExportComplete={() => {
            setMessage({
              type: 'success',
              text: 'Report exported successfully!'
            });
          }}
        />

        {/* Payment Modal */}
        <PaymentModal
          isOpen={paymentModalOpen}
          onClose={() => {
            setPaymentModalOpen(false);
            setCurrentInvoice(null);
          }}
          onSubmit={handleRecordPayment}
          invoice={currentInvoice}
          isSubmitting={isRecordingPayment}
        />
      </main>
    </DashboardLayout>
  );
}
