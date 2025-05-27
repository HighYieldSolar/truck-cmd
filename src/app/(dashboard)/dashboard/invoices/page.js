"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  FileText,
  Plus,
  Download,
  Filter,
  Search,
  Calendar,
  Clock,
  CheckCircle,
  RefreshCw,
  ArrowRight,
  Edit,
  Eye,
  Trash2,
  DollarSign,
  Mail,
  Printer,
  AlertCircle
} from "lucide-react";
import {
  fetchInvoices,
  updateInvoiceStatus,
  recordPayment,
  deleteInvoice,
  emailInvoice,
  checkAndUpdateOverdueInvoices
} from "@/lib/services/invoiceService";

// Import components
import InvoiceListComponent from "@/components/invoices/InvoiceListComponent";
import InvoiceStatsComponent from "@/components/invoices/InvoiceStatsComponent";
import PaymentDueSoonComponent from "@/components/invoices/PaymentDueSoonComponent";
import OverdueInvoicesComponent from "@/components/invoices/OverdueInvoicesComponent";
import QuickActionsComponent from "@/components/invoices/QuickActionsComponent";
import InvoiceStatusBadge from "@/components/invoices/InvoiceStatusBadge";
import DeleteInvoiceModal from "@/components/invoices/DeleteInvoiceModal";
import EmailInvoiceModal from "@/components/invoices/EmailInvoiceModal";

// Main Invoices Dashboard Component
export default function Page() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  // Invoices state
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    paid: 0,
    pending: 0,
    overdue: 0,
    draftCount: 0,
  });

  // Filter state
  const [filters, setFilters] = useState({
    status: "all",
    dateRange: "all",
    search: "",
    sortBy: "invoice_date",
    sortDirection: "desc"
  });

  // Modal states
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [currentInvoice, setCurrentInvoice] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Apply filters to invoices
  const applyFilters = useCallback((items, currentFilters) => {
    if (!items) return [];

    let result = [...items];

    // Filter by status
    if (currentFilters.status !== "all") {
      result = result.filter(item => item.status === currentFilters.status);
    }

    // Filter by date range
    if (currentFilters.dateRange !== "all") {
      const today = new Date();
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(today.getDate() - 30);

      const ninetyDaysAgo = new Date(today);
      ninetyDaysAgo.setDate(today.getDate() - 90);

      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDayOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      const firstDayOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const firstDayOfYear = new Date(today.getFullYear(), 0, 1);

      switch (currentFilters.dateRange) {
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
    if (currentFilters.search) {
      const searchLower = currentFilters.search.toLowerCase();
      result = result.filter(item =>
        (item.invoice_number && item.invoice_number.toLowerCase().includes(searchLower)) ||
        (item.customer && item.customer.toLowerCase().includes(searchLower)) ||
        (item.description && item.description.toLowerCase().includes(searchLower))
      );
    }

    // Sort items
    result.sort((a, b) => {
      let valueA, valueB;

      switch (currentFilters.sortBy) {
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

      if (currentFilters.sortDirection === "asc") {
        return valueA > valueB ? 1 : -1;
      } else {
        return valueA < valueB ? 1 : -1;
      }
    });

    setFilteredInvoices(result);
  }, []);

  // Fetch user and invoices on mount
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

        // Check for overdue invoices and update their status
        await checkAndUpdateOverdueInvoices(user.id);

        // Fetch invoices
        const items = await fetchInvoices(user.id);
        setInvoices(items);
        applyFilters(items, filters);

        // Calculate stats
        calculateStats(items);

        setLoading(false);
      } catch (error) {
        console.error("Error initializing invoices dashboard:", error);
        setError("Failed to load invoice data. Please try again.");
        setLoading(false);
      }
    }

    initialize();
  }, [applyFilters, filters]);

  // Calculate invoice statistics
  const calculateStats = (items) => {
    if (!items) return;

    const total = items.reduce((sum, item) => sum + parseFloat(item.total || 0), 0);
    const paid = items.filter(item => item.status === 'paid').length;
    const pending = items.filter(item => item.status === 'pending' || item.status === 'sent').length;
    const overdue = items.filter(item => item.status === 'overdue').length;
    const draftCount = items.filter(item => item.status === 'draft').length;

    setStats({
      total,
      paid,
      pending,
      overdue,
      draftCount
    });
  };

  // Export invoice data to CSV
  const handleExportData = () => {
    if (invoices.length === 0) return;

    // Convert data to CSV
    const headers = [
      "Invoice Number",
      "Customer",
      "Description",
      "Invoice Date",
      "Due Date",
      "Total",
      "Status"
    ];

    const csvData = invoices.map((item) => [
      item.invoice_number || "",
      item.customer || "",
      item.description || "",
      item.invoice_date || "",
      item.due_date || "",
      item.total || "0.00",
      item.status || ""
    ]);

    // Create CSV content
    let csvContent = headers.join(",") + "\n";
    csvData.forEach(row => {
      // Escape fields with commas or quotes
      const escapedRow = row.map(field => {
        // Convert to string
        const str = String(field);
        if (str.includes(",") || str.includes('"') || str.includes("\n")) {
          // Escape double quotes with double quotes
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      });
      csvContent += escapedRow.join(",") + "\n";
    });

    // Download the CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `invoice_data_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle filter changes
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    applyFilters(invoices, newFilters);
  };

  // Handle marking invoice as paid
  const handleMarkAsPaid = async (invoiceId) => {
    try {
      setIsSubmitting(true);
      await recordPayment(invoiceId, { status: "paid", payment_date: new Date().toISOString() });

      // Update local state
      const updatedInvoices = invoices.map(inv =>
        inv.id === invoiceId ? { ...inv, status: "paid" } : inv
      );

      setInvoices(updatedInvoices);
      applyFilters(updatedInvoices, filters);
      calculateStats(updatedInvoices);

      setIsSubmitting(false);
    } catch (error) {
      console.error("Error marking invoice as paid:", error);
      setIsSubmitting(false);
    }
  };

  // Handle deleting invoice
  const handleDeleteInvoice = (invoice) => {
    setCurrentInvoice(invoice);
    setDeleteModalOpen(true);
  };

  // Confirm delete invoice
  const confirmDeleteInvoice = async () => {
    if (!currentInvoice) return;

    try {
      setIsDeleting(true);
      await deleteInvoice(currentInvoice.id);

      // Update local state
      const updatedInvoices = invoices.filter(inv => inv.id !== currentInvoice.id);
      setInvoices(updatedInvoices);
      applyFilters(updatedInvoices, filters);
      calculateStats(updatedInvoices);

      setDeleteModalOpen(false);
      setCurrentInvoice(null);
      setIsDeleting(false);
    } catch (error) {
      console.error("Error deleting invoice:", error);
      setIsDeleting(false);
    }
  };

  // Handle sending invoice via email
  const handleEmailInvoice = (invoice) => {
    setCurrentInvoice(invoice);
    setEmailModalOpen(true);
  };

  // Navigate to invoice detail page
  const handleViewInvoice = (invoiceId) => {
    window.location.href = `/dashboard/invoices/${invoiceId}`;
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `$${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw size={32} className="animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <DashboardLayout activePage="invoices">
      <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-100">
        <div className="max-w-7xl mx-auto">
          {/* Header with background */}
          <div className="mb-8 bg-gradient-to-r from-blue-600 to-blue-400 rounded-xl shadow-md p-6 text-white">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="mb-4 md:mb-0">
                <h1 className="text-3xl font-bold mb-1">Invoice Management</h1>
                <p className="text-blue-100">Track and manage all your customer invoices and payments</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/dashboard/invoices/new"
                  className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors shadow-sm flex items-center font-medium"
                >
                  <Plus size={18} className="mr-2" />
                  New Invoice
                </Link>
                <button
                  onClick={handleExportData}
                  className="px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors shadow-sm flex items-center font-medium"
                  disabled={invoices.length === 0}
                >
                  <Download size={18} className="mr-2" />
                  Export Data
                </button>
              </div>
            </div>
          </div>

          {/* Error display */}
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Stats row */}
          <div className="mb-6">
            <InvoiceStatsComponent stats={stats} formatCurrency={formatCurrency} />
          </div>

          {/* Main content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2">
              {/* Filters component */}
              <InvoiceListComponent
                invoices={filteredInvoices}
                filters={filters}
                setFilters={setFilters}
                onApplyFilters={handleFilterChange}
                handleViewInvoice={handleViewInvoice}
                handleMarkAsPaid={handleMarkAsPaid}
                handleDeleteInvoice={handleDeleteInvoice}
                loading={loading}
              />
            </div>
            <div className="space-y-6">
              <QuickActionsComponent
                onCreateInvoice={() => window.location.href = '/dashboard/invoices/new'}
                onExportData={handleExportData}
              />
              <OverdueInvoicesComponent
                invoices={invoices.filter(inv => inv.status === 'overdue')}
                onViewInvoice={handleViewInvoice}
              />
              <PaymentDueSoonComponent
                invoices={invoices.filter(inv => {
                  if (inv.status !== 'pending' && inv.status !== 'sent') return false;
                  if (!inv.due_date) return false;

                  const today = new Date();
                  const dueDate = new Date(inv.due_date);
                  const differenceInTime = dueDate - today;
                  const differenceInDays = Math.ceil(differenceInTime / (1000 * 3600 * 24));

                  return differenceInDays >= 0 && differenceInDays <= 7;
                })}
                onViewInvoice={handleViewInvoice}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Delete confirmation modal */}
      {deleteModalOpen && (
        <DeleteInvoiceModal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={confirmDeleteInvoice}
          invoice={currentInvoice}
          isDeleting={isDeleting}
        />
      )}

      {/* Email invoice modal */}
      {emailModalOpen && (
        <EmailInvoiceModal
          isOpen={emailModalOpen}
          onClose={() => setEmailModalOpen(false)}
          invoice={currentInvoice}
        />
      )}
    </DashboardLayout>
  );
}