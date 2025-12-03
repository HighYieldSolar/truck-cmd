"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Plus,
  Search,
  RefreshCw,
  Wrench,
  Edit,
  Trash2,
  ChevronLeft,
  Download,
  Calendar,
  X,
  CheckCircle,
  Clock,
  AlertTriangle,
  DollarSign,
  Truck,
  FileText,
  Bell,
  Settings,
  ClipboardList
} from "lucide-react";
import {
  fetchMaintenanceRecords,
  deleteMaintenanceRecord,
  completeMaintenanceRecord,
  MAINTENANCE_TYPES,
  MAINTENANCE_STATUSES
} from "@/lib/services/maintenanceService";
import { fetchTrucks } from "@/lib/services/truckService";
import { formatDateForDisplayMMDDYYYY } from "@/lib/utils/dateUtils";
import MaintenanceFormModal from "@/components/fleet/MaintenanceFormModal";
import DeleteConfirmationModal from "@/components/common/DeleteConfirmationModal";
import OperationMessage from "@/components/ui/OperationMessage";
import { usePagination, Pagination } from "@/hooks/usePagination";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { UpgradePrompt } from "@/components/billing/UpgradePrompt";

const STORAGE_KEY = 'maintenance_filters';

export default function MaintenancePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [trucks, setTrucks] = useState([]);

  // Feature access check
  const { canAccess, currentTier, loading: featureLoading } = useFeatureAccess();
  const hasMaintenanceAccess = canAccess('maintenanceScheduling');

  // Filters with localStorage persistence
  const [filters, setFilters] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          return JSON.parse(saved);
        }
      } catch (e) {
        console.error('Error loading saved filters:', e);
      }
    }
    return {
      status: 'all',
      type: 'all',
      truck: 'all',
      search: '',
    };
  });

  // Modals
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [recordToEdit, setRecordToEdit] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [recordToComplete, setRecordToComplete] = useState(null);

  // Operation messages
  const [operationMessage, setOperationMessage] = useState(null);

  // Save filters to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
    }
  }, [filters]);

  // Calculate stats
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return {
      total: records.length,
      pending: records.filter(r => r.status !== 'Completed' && r.status !== 'Cancelled').length,
      overdue: records.filter(r => {
        if (r.status === 'Completed' || r.status === 'Cancelled') return false;
        const dueDate = new Date(r.due_date);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate < today;
      }).length,
      completed: records.filter(r => r.status === 'Completed').length,
      totalCost: records.filter(r => r.status === 'Completed').reduce((sum, r) => sum + (r.cost || 0), 0)
    };
  }, [records]);

  // Apply filters
  const filteredRecords = useMemo(() => {
    if (!records) return [];

    let results = [...records];

    // Apply search term
    if (filters.search) {
      const term = filters.search.toLowerCase();
      results = results.filter(record =>
        record.maintenance_type?.toLowerCase().includes(term) ||
        record.description?.toLowerCase().includes(term) ||
        record.service_provider?.toLowerCase().includes(term) ||
        record.trucks?.name?.toLowerCase().includes(term)
      );
    }

    // Apply status filter
    if (filters.status !== 'all') {
      results = results.filter(record => record.status === filters.status);
    }

    // Apply type filter
    if (filters.type !== 'all') {
      results = results.filter(record => record.maintenance_type === filters.type);
    }

    // Apply truck filter
    if (filters.truck !== 'all') {
      results = results.filter(record => record.truck_id === filters.truck);
    }

    return results;
  }, [records, filters]);

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
  } = usePagination(filteredRecords, { itemsPerPage: 10 });

  // Load data function
  const loadData = useCallback(async (userId) => {
    try {
      const [maintenanceData, trucksData] = await Promise.all([
        fetchMaintenanceRecords(userId),
        fetchTrucks(userId)
      ]);
      setRecords(maintenanceData);
      setTrucks(trucksData);
    } catch (error) {
      console.error('Error loading data:', error);
      setOperationMessage({
        type: 'error',
        text: 'Failed to load maintenance records. Please try again later.'
      });
    }
  }, []);

  // Get user and load initial data with real-time subscription
  useEffect(() => {
    let channel;

    async function initData() {
      try {
        setLoading(true);

        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError) throw userError;

        if (!user) {
          window.location.href = '/login';
          return;
        }

        setUser(user);
        await loadData(user.id);

        // Set up real-time subscription
        channel = supabase
          .channel('maintenance-changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'maintenance_records',
              filter: `user_id=eq.${user.id}`
            },
            (payload) => {
              if (payload.eventType === 'INSERT') {
                // Fetch the complete record with truck data
                loadData(user.id);
              } else if (payload.eventType === 'UPDATE') {
                loadData(user.id);
              } else if (payload.eventType === 'DELETE') {
                setRecords(prev => prev.filter(r => r.id !== payload.old.id));
              }
            }
          )
          .subscribe();
      } catch (error) {
        console.error('Error initializing:', error);
        setOperationMessage({
          type: 'error',
          text: 'Failed to initialize. Please refresh the page.'
        });
      } finally {
        setLoading(false);
      }
    }

    initData();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [loadData]);

  // Handle adding a new record
  const handleAddRecord = () => {
    setRecordToEdit(null);
    setFormModalOpen(true);
  };

  // Handle editing a record
  const handleEditRecord = (record) => {
    setRecordToEdit(record);
    setFormModalOpen(true);
  };

  // Handle record form submission
  const handleRecordSubmit = async () => {
    try {
      if (!user) return;

      await loadData(user.id);

      setOperationMessage({
        type: 'success',
        text: recordToEdit ? 'Maintenance record updated successfully!' : 'Maintenance record added successfully!'
      });

      return true;
    } catch (error) {
      console.error('Error after saving record:', error);
      setOperationMessage({
        type: 'error',
        text: 'Failed to save maintenance record. Please try again.'
      });
      return false;
    }
  };

  // Handle deleting a record
  const handleDeleteClick = (record) => {
    setRecordToDelete(record);
    setDeleteModalOpen(true);
  };

  // Confirm record deletion
  const confirmDelete = async () => {
    if (!recordToDelete) return;

    try {
      setIsDeleting(true);
      await deleteMaintenanceRecord(recordToDelete.id);

      setRecords(prev => prev.filter(r => r.id !== recordToDelete.id));
      setDeleteModalOpen(false);
      setRecordToDelete(null);

      setOperationMessage({
        type: 'success',
        text: 'Maintenance record deleted successfully!'
      });
    } catch (error) {
      console.error('Error deleting record:', error);
      setOperationMessage({
        type: 'error',
        text: 'Failed to delete maintenance record. Please try again.'
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle completing a record
  const handleCompleteClick = (record) => {
    setRecordToComplete(record);
    // Open the form modal in edit mode with completion focus
    setRecordToEdit({ ...record, _completing: true });
    setFormModalOpen(true);
  };

  // Reset all filters
  const resetFilters = () => {
    setFilters({
      status: 'all',
      type: 'all',
      truck: 'all',
      search: '',
    });
  };

  // Check if filters are active
  const hasActiveFilters = filters.status !== 'all' || filters.type !== 'all' || filters.truck !== 'all' || filters.search !== '';

  // Format dates for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return formatDateForDisplayMMDDYYYY(dateString);
    } catch {
      return dateString || "N/A";
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return "N/A";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Get status colors with dark mode
  const getStatusColors = (status, dueDate) => {
    // Check if overdue
    if (status !== 'Completed' && status !== 'Cancelled' && dueDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const due = new Date(dueDate);
      due.setHours(0, 0, 0, 0);
      if (due < today) {
        return {
          bg: 'bg-red-100 dark:bg-red-900/40',
          text: 'text-red-800 dark:text-red-300',
          dot: 'bg-red-500'
        };
      }
    }

    switch (status) {
      case 'Completed':
        return {
          bg: 'bg-green-100 dark:bg-green-900/40',
          text: 'text-green-800 dark:text-green-300',
          dot: 'bg-green-500'
        };
      case 'In Progress':
        return {
          bg: 'bg-blue-100 dark:bg-blue-900/40',
          text: 'text-blue-800 dark:text-blue-300',
          dot: 'bg-blue-500'
        };
      case 'Scheduled':
        return {
          bg: 'bg-purple-100 dark:bg-purple-900/40',
          text: 'text-purple-800 dark:text-purple-300',
          dot: 'bg-purple-500'
        };
      case 'Cancelled':
        return {
          bg: 'bg-gray-100 dark:bg-gray-700',
          text: 'text-gray-800 dark:text-gray-300',
          dot: 'bg-gray-500'
        };
      case 'Pending':
      default:
        return {
          bg: 'bg-yellow-100 dark:bg-yellow-900/40',
          text: 'text-yellow-800 dark:text-yellow-300',
          dot: 'bg-yellow-500'
        };
    }
  };

  // Check if record is overdue
  const isOverdue = (record) => {
    if (record.status === 'Completed' || record.status === 'Cancelled') return false;
    if (!record.due_date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(record.due_date);
    due.setHours(0, 0, 0, 0);
    return due < today;
  };

  // Export to CSV
  const exportToCSV = useCallback(() => {
    const headers = ['Vehicle', 'Type', 'Description', 'Due Date', 'Status', 'Cost', 'Service Provider', 'Completed Date'];
    const rows = filteredRecords.map(record => [
      record.trucks?.name || '',
      record.maintenance_type || '',
      record.description || '',
      formatDate(record.due_date),
      record.status || '',
      record.cost || '',
      record.service_provider || '',
      formatDate(record.completed_date)
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `maintenance_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);

    setOperationMessage({
      type: 'success',
      text: `Exported ${filteredRecords.length} maintenance records to CSV`
    });
  }, [filteredRecords]);

  // Loading skeleton
  if (loading || featureLoading) {
    return (
      <DashboardLayout activePage="fleet">
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-100 dark:bg-gray-900 min-h-screen">
          <div className="max-w-7xl mx-auto">
            {/* Header skeleton */}
            <div className="mb-8 bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-700 dark:to-blue-600 rounded-xl shadow-md p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div className="mb-4 md:mb-0">
                  <div className="h-8 bg-white/20 rounded w-64 mb-2 animate-pulse"></div>
                  <div className="h-4 bg-white/20 rounded w-48 animate-pulse"></div>
                </div>
                <div className="flex gap-3">
                  <div className="h-10 bg-white/20 rounded w-32 animate-pulse"></div>
                  <div className="h-10 bg-white/20 rounded w-36 animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Stats skeleton */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2 animate-pulse"></div>
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
                </div>
              ))}
            </div>

            {/* Table skeleton */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse"></div>
              </div>
              <div className="p-6 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-100 dark:bg-gray-700 rounded animate-pulse"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Show upgrade prompt for Basic/Premium users (Fleet+ only feature)
  if (!hasMaintenanceAccess) {
    return (
      <DashboardLayout activePage="fleet">
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-100 dark:bg-gray-900 min-h-screen">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-6 bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-700 dark:to-blue-600 rounded-2xl shadow-lg p-6 text-white">
              <div className="flex items-center gap-3">
                <Link
                  href="/dashboard/fleet"
                  className="p-2 rounded-full hover:bg-white/20 transition-colors"
                >
                  <ChevronLeft size={20} />
                </Link>
                <div className="bg-white/20 p-2.5 rounded-xl">
                  <Wrench size={28} />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold">Maintenance Scheduling</h1>
                  <p className="text-blue-100 dark:text-blue-200 text-sm md:text-base">
                    Upgrade to Fleet plan to access maintenance scheduling
                  </p>
                </div>
              </div>
            </div>

            {/* Upgrade Prompt */}
            <UpgradePrompt feature="maintenanceScheduling" currentTier={currentTier} />

            {/* Feature Preview */}
            <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                What you'll get with Maintenance Scheduling:
              </h3>
              <ul className="space-y-3 text-gray-600 dark:text-gray-300">
                <li className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
                    <Calendar size={16} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <span>Schedule preventive maintenance for your entire fleet</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/40 flex items-center justify-center flex-shrink-0">
                    <Bell size={16} className="text-green-600 dark:text-green-400" />
                  </div>
                  <span>Get alerts when maintenance is due or overdue</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center flex-shrink-0">
                    <DollarSign size={16} className="text-purple-600 dark:text-purple-400" />
                  </div>
                  <span>Track maintenance costs and service history</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center flex-shrink-0">
                    <Settings size={16} className="text-orange-600 dark:text-orange-400" />
                  </div>
                  <span>Multiple maintenance types: oil change, tire rotation, inspections, and more</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center flex-shrink-0">
                    <ClipboardList size={16} className="text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <span>Service provider tracking and warranty management</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activePage="fleet">
      <div className="p-4 sm:p-6 lg:p-8 bg-gray-100 dark:bg-gray-900 min-h-screen">
        <div className="max-w-7xl mx-auto">
          {/* Operation Message */}
          <OperationMessage
            message={operationMessage}
            onDismiss={() => setOperationMessage(null)}
          />

          {/* Header with background */}
          <div className="mb-8 bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-700 dark:to-blue-600 rounded-xl shadow-md p-6 text-white">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="mb-4 md:mb-0">
                <div className="flex items-center">
                  <Link
                    href="/dashboard/fleet"
                    className="mr-2 p-2 rounded-full hover:bg-white/20 transition-colors"
                  >
                    <ChevronLeft size={20} />
                  </Link>
                  <div>
                    <h1 className="text-3xl font-bold mb-1">Maintenance Management</h1>
                    <p className="text-blue-100">Schedule, track and manage vehicle maintenance</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleAddRecord}
                  className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors shadow-sm flex items-center font-medium"
                >
                  <Plus size={18} className="mr-2" />
                  Schedule Maintenance
                </button>
                <button
                  onClick={exportToCSV}
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg transition-colors shadow-sm flex items-center font-medium"
                >
                  <Download size={18} className="mr-2" />
                  Export CSV
                </button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            {/* Total Records */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border-l-4 border-blue-500 p-4 border-t border-r border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Records</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                </div>
                <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center">
                  <FileText size={20} className="text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>

            {/* Pending */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border-l-4 border-yellow-500 p-4 border-t border-r border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pending}</p>
                </div>
                <div className="h-10 w-10 bg-yellow-100 dark:bg-yellow-900/40 rounded-full flex items-center justify-center">
                  <Clock size={20} className="text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </div>

            {/* Overdue */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border-l-4 border-red-500 p-4 border-t border-r border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Overdue</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.overdue}</p>
                </div>
                <div className="h-10 w-10 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center">
                  <AlertTriangle size={20} className="text-red-600 dark:text-red-400" />
                </div>
              </div>
            </div>

            {/* Completed */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border-l-4 border-green-500 p-4 border-t border-r border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Completed</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.completed}</p>
                </div>
                <div className="h-10 w-10 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center">
                  <CheckCircle size={20} className="text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>

            {/* Total Cost */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border-l-4 border-purple-500 p-4 border-t border-r border-b border-gray-200 dark:border-gray-700 col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Spent</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(stats.totalCost)}</p>
                </div>
                <div className="h-10 w-10 bg-purple-100 dark:bg-purple-900/40 rounded-full flex items-center justify-center">
                  <DollarSign size={20} className="text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Main Table Container */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
            {/* Inline Filter Bar */}
            <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-center">
                  <Wrench size={18} className="mr-2 text-blue-600 dark:text-blue-400" />
                  <h3 className="font-medium text-gray-700 dark:text-gray-200">
                    Maintenance Records
                  </h3>
                  <span className="ml-3 text-sm text-gray-500 dark:text-gray-400">
                    {filteredRecords.length} of {records.length} records
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-wrap">
                  {/* Search */}
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={filters.search}
                      onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                      placeholder="Search records..."
                      className="pl-9 pr-3 py-2 w-full sm:w-48 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Status Filter */}
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Statuses</option>
                    {MAINTENANCE_STATUSES.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>

                  {/* Type Filter */}
                  <select
                    value={filters.type}
                    onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                    className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Types</option>
                    {MAINTENANCE_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>

                  {/* Truck Filter */}
                  <select
                    value={filters.truck}
                    onChange={(e) => setFilters(prev => ({ ...prev, truck: e.target.value }))}
                    className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Vehicles</option>
                    {trucks.map(truck => (
                      <option key={truck.id} value={truck.id}>{truck.name}</option>
                    ))}
                  </select>

                  {/* Reset Button */}
                  {hasActiveFilters && (
                    <button
                      onClick={resetFilters}
                      className="flex items-center px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <X size={14} className="mr-1" />
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Table or Empty State */}
            {filteredRecords.length === 0 ? (
              <div className="p-12 text-center">
                {records.length === 0 ? (
                  <div className="max-w-sm mx-auto">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Wrench size={32} className="text-gray-400 dark:text-gray-500" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                      No maintenance records yet
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">
                      Get started by scheduling your first maintenance task.
                    </p>
                    <button
                      onClick={handleAddRecord}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                    >
                      <Plus size={18} className="mr-2" />
                      Schedule Maintenance
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search size={32} className="text-gray-400 dark:text-gray-500" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                      No matching records
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      Try adjusting your search or filter criteria.
                    </p>
                    <button
                      onClick={resetFilters}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors"
                    >
                      <RefreshCw size={16} className="mr-2" />
                      Reset Filters
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full table-fixed">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                      <tr>
                        <th className="w-[14%] px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                          Vehicle
                        </th>
                        <th className="w-[14%] px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="w-[16%] px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="w-[10%] px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                          Due Date
                        </th>
                        <th className="w-[12%] px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="w-[10%] px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                          Cost
                        </th>
                        <th className="w-[12%] px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                          Provider
                        </th>
                        <th className="w-[12%] px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {paginatedData.map(record => {
                        const statusColors = getStatusColors(record.status, record.due_date);
                        const overdue = isOverdue(record);
                        return (
                          <tr key={record.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${overdue ? 'bg-red-50 dark:bg-red-900/10' : ''}`}>
                            <td className="px-4 py-4">
                              <div className="flex items-center">
                                <Truck size={16} className="text-gray-400 mr-2 flex-shrink-0" />
                                <span className="text-gray-900 dark:text-gray-100 truncate">
                                  {record.trucks?.name || 'N/A'}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <span className="text-gray-900 dark:text-gray-100 truncate block">
                                {record.maintenance_type}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <span className="text-gray-700 dark:text-gray-300 truncate block" title={record.description}>
                                {record.description || '-'}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center">
                                <Calendar size={14} className={`mr-1.5 flex-shrink-0 ${overdue ? 'text-red-500' : 'text-gray-400'}`} />
                                <span className={`text-sm ${overdue ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-700 dark:text-gray-300'}`}>
                                  {formatDate(record.due_date)}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusColors.bg} ${statusColors.text}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${statusColors.dot} mr-1.5`}></span>
                                {overdue ? 'Overdue' : record.status}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <span className="text-gray-900 dark:text-gray-100">
                                {record.cost ? formatCurrency(record.cost) : '-'}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <span className="text-gray-700 dark:text-gray-300 truncate block">
                                {record.service_provider || '-'}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex justify-center items-center space-x-1">
                                {record.status !== 'Completed' && record.status !== 'Cancelled' && (
                                  <button
                                    onClick={() => handleCompleteClick(record)}
                                    className="p-1.5 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-md transition-colors"
                                    title="Mark Complete"
                                  >
                                    <CheckCircle size={16} />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleEditRecord(record)}
                                  className="p-1.5 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-md transition-colors"
                                  title="Edit Record"
                                >
                                  <Edit size={16} />
                                </button>
                                <button
                                  onClick={() => handleDeleteClick(record)}
                                  className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors"
                                  title="Delete Record"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-700">
                  {paginatedData.map(record => {
                    const statusColors = getStatusColors(record.status, record.due_date);
                    const overdue = isOverdue(record);
                    return (
                      <div key={record.id} className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 ${overdue ? 'bg-red-50 dark:bg-red-900/10' : ''}`}>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center">
                              <Truck size={16} className="text-gray-400 mr-2 flex-shrink-0" />
                              <span className="text-gray-900 dark:text-gray-100 font-medium truncate">
                                {record.trucks?.name || 'N/A'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {record.maintenance_type}
                            </p>
                          </div>
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusColors.bg} ${statusColors.text} ml-2 flex-shrink-0`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusColors.dot} mr-1.5`}></span>
                            {overdue ? 'Overdue' : record.status}
                          </span>
                        </div>

                        {record.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                            {record.description}
                          </p>
                        )}

                        <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Due:</span>
                            <span className={`ml-1 ${overdue ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-900 dark:text-gray-100'}`}>
                              {formatDate(record.due_date)}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Cost:</span>
                            <span className="ml-1 text-gray-900 dark:text-gray-100">
                              {record.cost ? formatCurrency(record.cost) : '-'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {record.service_provider && (
                              <span>Provider: {record.service_provider}</span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            {record.status !== 'Completed' && record.status !== 'Cancelled' && (
                              <button
                                onClick={() => handleCompleteClick(record)}
                                className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                              >
                                <CheckCircle size={18} />
                              </button>
                            )}
                            <button
                              onClick={() => handleEditRecord(record)}
                              className="p-2 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-lg transition-colors"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(record)}
                              className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* Pagination */}
            {filteredRecords.length > 0 && (
              <div className="px-5 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={goToPage}
                  hasNextPage={hasNextPage}
                  hasPrevPage={hasPrevPage}
                  pageNumbers={pageNumbers}
                  showingText={showingText}
                />
              </div>
            )}
          </div>

          {/* Tips Section */}
          <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-5">
            <div className="flex items-start">
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center mr-4">
                <Wrench size={20} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-2">
                  Maintenance Tips
                </h3>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2 mt-1.5 flex-shrink-0"></span>
                    Schedule preventive maintenance to reduce unexpected breakdowns and repair costs.
                  </li>
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2 mt-1.5 flex-shrink-0"></span>
                    Track odometer readings to stay on top of mileage-based service intervals.
                  </li>
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2 mt-1.5 flex-shrink-0"></span>
                    Keep service provider information for quick reference and warranty claims.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <MaintenanceFormModal
        isOpen={formModalOpen}
        onClose={() => {
          setFormModalOpen(false);
          setRecordToEdit(null);
        }}
        record={recordToEdit}
        userId={user?.id}
        trucks={trucks}
        onSubmit={handleRecordSubmit}
      />

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setRecordToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Delete Maintenance Record"
        message={`Are you sure you want to delete this ${recordToDelete?.maintenance_type} maintenance record? This action cannot be undone.`}
        isDeleting={isDeleting}
      />
    </DashboardLayout>
  );
}
