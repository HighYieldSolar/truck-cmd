"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabaseClient";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  AlertCircle,
  Plus,
  Download,
  Filter,
  Search,
  FileText,
  Clock,
  CheckCircle,
  RefreshCw,
  ArrowRight,
  Edit,
  Eye,
  Trash2,
  Shield,
  X
} from "lucide-react";
import { COMPLIANCE_TYPES } from "@/lib/constants/complianceConstants";
import {
  fetchComplianceItems,
  createComplianceItem,
  updateComplianceItem,
  deleteComplianceItem,
  uploadComplianceDocument,
  deleteComplianceDocument,
  getComplianceStats,
  subscribeToComplianceChanges,
  unsubscribeFromComplianceChanges,
  getDaysUntilExpiration,
  computeStatus
} from "@/lib/services/complianceService";
import { formatDateForDisplayMMDDYYYY } from "@/lib/utils/dateUtils";
import { getUserFriendlyError } from "@/lib/utils/errorMessages";
import { usePagination, Pagination } from "@/hooks/usePagination";
import { OperationMessage, EmptyState } from "@/components/ui/OperationMessage";

// Import components
import ComplianceFormModal from "@/components/compliance/ComplianceFormModal";
import ViewComplianceModal from "@/components/compliance/ViewComplianceModal";
import DeleteConfirmationModal from "@/components/compliance/DeleteConfirmationModal";
import ComplianceSummary from "@/components/compliance/ComplianceSummary";

// Feature gating
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { UpgradePrompt } from "@/components/billing/UpgradePrompt";

// Local storage key for form persistence
const STORAGE_KEY = 'compliance_filters';

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

export default function CompliancePage() {
  // Feature access check
  const { canAccess, currentTier, loading: featureLoading } = useFeatureAccess();
  const hasComplianceAccess = canAccess('compliance');

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [user, setUser] = useState(null);

  // Compliance items state
  const [complianceItems, setComplianceItems] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    expiringSoon: 0,
    expired: 0,
    pending: 0
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
      type: "all",
      entity: "all",
      search: ""
    };
  });

  // Modal states
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  // Compute status for each item
  const computeItemStatus = useCallback((item) => {
    if (!item.expiration_date) return item.status || "Active";
    if (item.status === "Pending") return "Pending";
    return computeStatus(item.expiration_date, item.status);
  }, []);

  // Apply filters to compliance items
  const filteredItems = useMemo(() => {
    let result = [...complianceItems];

    // Filter by status
    if (filters.status !== "all") {
      result = result.filter(item => {
        const displayStatus = computeItemStatus(item).toLowerCase();
        return displayStatus === filters.status.toLowerCase();
      });
    }

    // Filter by compliance type
    if (filters.type !== "all") {
      result = result.filter(item => item.compliance_type === filters.type);
    }

    // Filter by entity type
    if (filters.entity !== "all") {
      result = result.filter(item => item.entity_type === filters.entity);
    }

    // Filter by search term
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(item =>
        (item.title && item.title.toLowerCase().includes(searchLower)) ||
        (item.entity_name && item.entity_name.toLowerCase().includes(searchLower)) ||
        (item.document_number && item.document_number.toLowerCase().includes(searchLower))
      );
    }

    return result;
  }, [complianceItems, filters, computeItemStatus]);

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
  } = usePagination(filteredItems, { itemsPerPage: 10 });

  // Get upcoming expirations (items expiring in the next 30 days)
  const upcomingExpirations = useMemo(() => {
    const today = new Date();
    return complianceItems
      .filter(item => {
        if (!item.expiration_date) return false;
        const daysUntil = getDaysUntilExpiration(item.expiration_date);
        return daysUntil !== null && daysUntil >= 0 && daysUntil <= 30;
      })
      .sort((a, b) => new Date(a.expiration_date) - new Date(b.expiration_date))
      .slice(0, 5);
  }, [complianceItems]);

  // Calculate category counts
  const categoryCounts = useMemo(() => {
    const counts = {};
    Object.keys(COMPLIANCE_TYPES).forEach(key => {
      counts[key] = complianceItems.filter(item => item.compliance_type === key).length;
    });
    return counts;
  }, [complianceItems]);

  // Fetch data
  const loadData = useCallback(async (userId) => {
    try {
      const [items, statsData] = await Promise.all([
        fetchComplianceItems(userId),
        getComplianceStats(userId)
      ]);
      setComplianceItems(items);
      setStats(statsData);
    } catch (error) {
      setMessage({ type: 'error', text: error.message || getUserFriendlyError(error) });
    }
  }, []);

  // Initialize
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
        await loadData(user.id);

        // Set up real-time subscription
        channel = subscribeToComplianceChanges(user.id, {
          onInsert: (newItem) => {
            setComplianceItems(prev => [newItem, ...prev]);
            loadData(user.id); // Refresh stats
          },
          onUpdate: (updatedItem) => {
            setComplianceItems(prev =>
              prev.map(item => item.id === updatedItem.id ? updatedItem : item)
            );
            loadData(user.id); // Refresh stats
          },
          onDelete: (deletedItem) => {
            setComplianceItems(prev =>
              prev.filter(item => item.id !== deletedItem.id)
            );
            loadData(user.id); // Refresh stats
          }
        });

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
        unsubscribeFromComplianceChanges(channel);
      }
    };
  }, [loadData]);

  // Handle filter changes
  const handleFilterChange = useCallback((e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  }, []);

  // Handle search
  const handleSearch = useCallback((e) => {
    setFilters(prev => ({ ...prev, search: e.target.value }));
  }, []);

  // Handle type selection from the sidebar
  const handleTypeSelect = useCallback((type) => {
    setFilters(prev => ({
      ...prev,
      type: prev.type === type ? 'all' : type
    }));
  }, []);

  // Reset filters
  const resetFilters = useCallback(() => {
    setFilters({
      status: "all",
      type: "all",
      entity: "all",
      search: ""
    });
  }, []);

  // Modal handlers
  const handleOpenFormModal = useCallback((item = null) => {
    setCurrentItem(item);
    setFormModalOpen(true);
  }, []);

  const handleOpenViewModal = useCallback((item) => {
    setCurrentItem(item);
    setViewModalOpen(true);
  }, []);

  const handleOpenDeleteModal = useCallback((item) => {
    setCurrentItem(item);
    setDeleteModalOpen(true);
  }, []);

  // Save compliance item
  const handleSaveComplianceItem = useCallback(async (formData) => {
    if (!user) return;

    try {
      setIsSubmitting(true);
      setMessage(null);

      // Upload document if provided
      let documentUrl = currentItem?.document_url;

      if (formData.document_file) {
        const uploadedUrl = await uploadComplianceDocument(user.id, formData.document_file);
        if (uploadedUrl) {
          documentUrl = uploadedUrl;
        }
      }

      // Prepare compliance data
      const complianceData = {
        title: formData.title,
        compliance_type: formData.compliance_type,
        entity_type: formData.entity_type,
        entity_name: formData.entity_name,
        document_number: formData.document_number,
        issue_date: formData.issue_date || null,
        expiration_date: formData.expiration_date,
        issuing_authority: formData.issuing_authority || null,
        notes: formData.notes || null,
        status: formData.status,
        document_url: documentUrl || null,
        user_id: user.id
      };

      if (currentItem) {
        await updateComplianceItem(currentItem.id, complianceData);
        setMessage({ type: 'success', text: 'Compliance record updated successfully' });
      } else {
        await createComplianceItem(complianceData);
        setMessage({ type: 'success', text: 'Compliance record created successfully' });
      }

      // Refresh data
      await loadData(user.id);

      // Close the modal
      setFormModalOpen(false);
      setCurrentItem(null);
    } catch (error) {
      setMessage({ type: 'error', text: error.message || getUserFriendlyError(error) });
    } finally {
      setIsSubmitting(false);
    }
  }, [currentItem, user, loadData]);

  // Delete compliance item
  const handleDeleteComplianceItem = useCallback(async () => {
    if (!currentItem || !user) return;

    try {
      setIsDeleting(true);
      setMessage(null);

      // Delete document from storage if exists
      if (currentItem.document_url) {
        await deleteComplianceDocument(currentItem.document_url);
      }

      // Delete the compliance item
      await deleteComplianceItem(currentItem.id);

      // Refresh data
      await loadData(user.id);

      setMessage({ type: 'success', text: 'Compliance record deleted successfully' });

      // Close the modal
      setDeleteModalOpen(false);
      setCurrentItem(null);
    } catch (error) {
      setMessage({ type: 'error', text: error.message || getUserFriendlyError(error) });
    } finally {
      setIsDeleting(false);
    }
  }, [currentItem, user, loadData]);

  // Export compliance data to CSV
  const handleExportData = useCallback(() => {
    if (complianceItems.length === 0) return;

    const headers = [
      "Title",
      "Type",
      "Entity",
      "Entity Name",
      "Document Number",
      "Issue Date",
      "Expiration Date",
      "Status",
      "Issuing Authority",
      "Notes"
    ];

    const csvData = complianceItems.map((item) => [
      item.title || "",
      COMPLIANCE_TYPES[item.compliance_type]?.name || item.compliance_type || "",
      item.entity_type || "",
      item.entity_name || "",
      item.document_number || "",
      item.issue_date || "",
      item.expiration_date || "",
      computeItemStatus(item) || "",
      item.issuing_authority || "",
      item.notes || ""
    ]);

    let csvContent = headers.join(",") + "\n";
    csvData.forEach(row => {
      const escapedRow = row.map(field => {
        const str = String(field);
        if (str.includes(",") || str.includes('"') || str.includes("\n")) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      });
      csvContent += escapedRow.join(",") + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `compliance_data_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [complianceItems, computeItemStatus]);

  // Get status badge styling
  const getStatusBadge = useCallback((status) => {
    const statusLower = status?.toLowerCase() || '';
    switch (statusLower) {
      case 'expired':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'expiring soon':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case 'pending':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'active':
      default:
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    }
  }, []);

  if (loading || featureLoading) {
    return (
      <DashboardLayout activePage="compliance">
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-100 dark:bg-gray-900">
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

  // Show upgrade prompt if user doesn't have compliance access (Basic plan)
  if (!hasComplianceAccess) {
    return (
      <DashboardLayout activePage="compliance">
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-6 bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-700 dark:to-blue-600 rounded-2xl shadow-lg p-6 text-white">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2.5 rounded-xl">
                  <Shield size={28} />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold">Compliance Management</h1>
                  <p className="text-blue-100 dark:text-blue-200 text-sm md:text-base">
                    Upgrade to Premium to access compliance tracking
                  </p>
                </div>
              </div>
            </div>

            {/* Upgrade Prompt */}
            <UpgradePrompt feature="compliance" currentTier={currentTier} />

            {/* Feature Preview */}
            <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                What you'll get with Compliance Tracking:
              </h3>
              <ul className="space-y-3 text-gray-600 dark:text-gray-300">
                <li className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
                    <FileText size={16} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <span>Track document expirations for licenses, registrations, and permits</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center flex-shrink-0">
                    <AlertCircle size={16} className="text-orange-600 dark:text-orange-400" />
                  </div>
                  <span>Get alerts before documents expire to stay DOT compliant</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/40 flex items-center justify-center flex-shrink-0">
                    <CheckCircle size={16} className="text-green-600 dark:text-green-400" />
                  </div>
                  <span>Store digital copies of all compliance documents</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center flex-shrink-0">
                    <Clock size={16} className="text-purple-600 dark:text-purple-400" />
                  </div>
                  <span>Track driver medical cards, CDLs, and vehicle inspections</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center flex-shrink-0">
                    <Download size={16} className="text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <span>Export compliance reports for audits</span>
                </li>
              </ul>
            </div>
          </div>
        </main>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activePage="compliance">
      <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-100 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          {/* Header with gradient */}
          <div className="mb-8 bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-700 dark:to-blue-600 rounded-xl shadow-md p-6 text-white">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="mb-4 md:mb-0">
                <h1 className="text-3xl font-bold mb-1">Compliance Management</h1>
                <p className="text-blue-100">Track and manage all your regulatory compliance documents</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => handleOpenFormModal()}
                  className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors shadow-sm flex items-center font-medium"
                >
                  <Plus size={18} className="mr-2" />
                  Add Record
                </button>
                <button
                  onClick={handleExportData}
                  className="px-4 py-2 bg-blue-700 dark:bg-blue-800 text-white rounded-lg hover:bg-blue-800 dark:hover:bg-blue-900 transition-colors shadow-sm flex items-center font-medium"
                  disabled={complianceItems.length === 0}
                >
                  <Download size={18} className="mr-2" />
                  Export Report
                </button>
              </div>
            </div>
          </div>

          {/* Operation message */}
          <OperationMessage
            message={message}
            onDismiss={() => setMessage(null)}
          />

          {/* Statistics */}
          <ComplianceSummary stats={stats} />

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Sidebar */}
            <div className="lg:col-span-1">
              {/* Upcoming Expirations Card */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden mb-6 border border-gray-200 dark:border-gray-700">
                <div className="bg-orange-500 dark:bg-orange-600 px-5 py-4 text-white">
                  <h3 className="font-semibold flex items-center">
                    <Clock size={18} className="mr-2" />
                    Upcoming Expirations
                  </h3>
                </div>
                <div className="p-4">
                  {upcomingExpirations.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <CheckCircle size={36} className="mx-auto mb-2 text-green-500 dark:text-green-400" />
                      <p>No documents expiring soon</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {upcomingExpirations.map(item => {
                        const daysLeft = getDaysUntilExpiration(item.expiration_date);

                        return (
                          <div
                            key={item.id}
                            className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/20 cursor-pointer transition-colors"
                            onClick={() => handleOpenViewModal(item)}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">{item.title}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{item.entity_name}</p>
                              </div>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ml-2 ${
                                daysLeft <= 7
                                  ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                  : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
                              }`}>
                                {daysLeft} days
                              </span>
                            </div>
                          </div>
                        );
                      })}

                      <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600 text-center">
                        <button
                          onClick={() => setFilters({ ...filters, status: 'expiring soon' })}
                          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center justify-center w-full"
                        >
                          View all expiring items
                          <ArrowRight size={14} className="ml-1" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Compliance Categories */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden mb-6 border border-gray-200 dark:border-gray-700">
                <div className="bg-blue-500 dark:bg-blue-600 px-5 py-4 text-white">
                  <h3 className="font-semibold flex items-center">
                    <FileText size={18} className="mr-2" />
                    Compliance Categories
                  </h3>
                </div>
                <div className="p-4">
                  {Object.entries(COMPLIANCE_TYPES).map(([key, type]) => {
                    const count = categoryCounts[key] || 0;
                    if (count === 0) return null;

                    return (
                      <div
                        key={key}
                        className={`mb-3 p-3 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                          filters.type === key
                            ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700 border'
                            : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                        }`}
                        onClick={() => handleTypeSelect(key)}
                      >
                        <div className="flex items-center">
                          {type.icon}
                          <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-200">{type.name}</span>
                        </div>
                        <span className="text-xs font-medium px-2 py-1 bg-white dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-300 shadow-sm">
                          {count}
                        </span>
                      </div>
                    );
                  })}

                  {Object.values(categoryCounts).every(count => count === 0) && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <FileText size={36} className="mx-auto mb-2 text-gray-400 dark:text-gray-500" />
                      <p>No compliance items found</p>
                    </div>
                  )}

                  <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600 text-center">
                    <button
                      onClick={() => handleOpenFormModal()}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center justify-center w-full"
                    >
                      Add compliance record
                      <Plus size={14} className="ml-1" />
                    </button>
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
                      placeholder="Search by title, entity, or document number..."
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
                      <option value="active">Active</option>
                      <option value="expiring soon">Expiring Soon</option>
                      <option value="expired">Expired</option>
                      <option value="pending">Pending</option>
                    </select>

                    <select
                      name="type"
                      value={filters.type}
                      onChange={handleFilterChange}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 min-w-[140px] transition-colors"
                    >
                      <option value="all">All Types</option>
                      {Object.entries(COMPLIANCE_TYPES).map(([key, type]) => (
                        <option key={key} value={key}>
                          {type.name}
                        </option>
                      ))}
                    </select>

                    <select
                      name="entity"
                      value={filters.entity}
                      onChange={handleFilterChange}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 min-w-[130px] transition-colors"
                    >
                      <option value="all">All Entities</option>
                      <option value="Vehicle">Vehicles</option>
                      <option value="Driver">Drivers</option>
                      <option value="Company">Company</option>
                      <option value="Other">Other</option>
                    </select>

                    {/* Reset Filters Button */}
                    <button
                      onClick={resetFilters}
                      className="px-3 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Reset Filters"
                      disabled={
                        filters.status === "all" &&
                        filters.type === "all" &&
                        filters.entity === "all" &&
                        filters.search === ""
                      }
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Compliance Table */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
                <div className="bg-gray-50 dark:bg-gray-700/50 px-5 py-4 border-b border-gray-200 dark:border-gray-600 flex justify-between items-center">
                  <h3 className="font-medium text-gray-700 dark:text-gray-200">Compliance Records</h3>
                  <button
                    onClick={() => handleOpenFormModal()}
                    className="flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                  >
                    <Plus size={16} className="mr-1" />
                    Add New
                  </button>
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block">
                  <table className="w-full table-fixed divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                      <tr>
                        <th scope="col" className="w-[28%] px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Compliance Item
                        </th>
                        <th scope="col" className="w-[18%] px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Entity
                        </th>
                        <th scope="col" className="w-[12%] px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Issue Date
                        </th>
                        <th scope="col" className="w-[12%] px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Expiration
                        </th>
                        <th scope="col" className="w-[14%] px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="w-[16%] px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {paginatedData.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="px-6 py-12 text-center">
                            {complianceItems.length === 0 ? (
                              <div className="max-w-sm mx-auto">
                                <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                                  <Shield className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">No compliance records</h3>
                                <p className="text-gray-500 dark:text-gray-400 mb-4">Start tracking your compliance documents and stay on top of expirations.</p>
                                <button
                                  onClick={() => handleOpenFormModal()}
                                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                                >
                                  <Plus size={16} className="mr-2" />
                                  Add Compliance Record
                                </button>
                              </div>
                            ) : (
                              <div>
                                <p className="text-gray-500 dark:text-gray-400 mb-2">No records match your current filters</p>
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
                        paginatedData.map(item => {
                          const displayStatus = computeItemStatus(item);

                          return (
                            <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                              <td className="px-4 py-3">
                                <button
                                  onClick={() => handleOpenViewModal(item)}
                                  className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline truncate block max-w-full text-left"
                                  title={item.title}
                                >
                                  {item.title}
                                </button>
                              </td>
                              <td className="text-gray-900 dark:text-gray-100 px-4 py-3">
                                <span className="truncate block" title={item.entity_name}>{item.entity_name}</span>
                              </td>
                              <td className="text-gray-900 dark:text-gray-100 px-4 py-3 text-sm">
                                {item.issue_date ? formatDateForDisplayMMDDYYYY(item.issue_date) : '-'}
                              </td>
                              <td className="text-gray-900 dark:text-gray-100 px-4 py-3 text-sm">
                                {item.expiration_date ? formatDateForDisplayMMDDYYYY(item.expiration_date) : '-'}
                              </td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(displayStatus)}`}>
                                  {displayStatus}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <div className="flex justify-center space-x-1">
                                  <button
                                    onClick={() => handleOpenViewModal(item)}
                                    className="p-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                                    title="View"
                                  >
                                    <Eye size={16} />
                                  </button>
                                  <button
                                    onClick={() => handleOpenFormModal(item)}
                                    className="p-1.5 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors"
                                    title="Edit"
                                  >
                                    <Edit size={16} />
                                  </button>
                                  <button
                                    onClick={() => handleOpenDeleteModal(item)}
                                    className="p-1.5 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                                    title="Delete"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden p-4 space-y-4">
                  {paginatedData.length === 0 ? (
                    complianceItems.length === 0 ? (
                      <EmptyState
                        icon={Shield}
                        title="No compliance records"
                        description="Start tracking your compliance documents and stay on top of expirations."
                        action={{
                          label: 'Add Compliance Record',
                          onClick: () => handleOpenFormModal(),
                          icon: Plus
                        }}
                      />
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500 dark:text-gray-400 mb-4">No records match your current filters</p>
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
                    paginatedData.map(item => {
                      const displayStatus = computeItemStatus(item);

                      return (
                        <div
                          key={item.id}
                          className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <button
                              onClick={() => handleOpenViewModal(item)}
                              className="font-medium text-blue-600 dark:text-blue-400 hover:underline text-left"
                            >
                              {item.title}
                            </button>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(displayStatus)}`}>
                              {displayStatus}
                            </span>
                          </div>
                          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                            <p><span className="font-medium">Entity:</span> {item.entity_name}</p>
                            <p><span className="font-medium">Issue:</span> {item.issue_date ? formatDateForDisplayMMDDYYYY(item.issue_date) : '-'}</p>
                            <p><span className="font-medium">Expires:</span> {item.expiration_date ? formatDateForDisplayMMDDYYYY(item.expiration_date) : '-'}</p>
                          </div>
                          <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600 flex justify-end space-x-2">
                            <button
                              onClick={() => handleOpenViewModal(item)}
                              className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50"
                            >
                              <Eye size={18} />
                            </button>
                            <button
                              onClick={() => handleOpenFormModal(item)}
                              className="p-2 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/50"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => handleOpenDeleteModal(item)}
                              className="p-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Pagination */}
                {filteredItems.length > 0 && (
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

        {/* Modals */}
        <ComplianceFormModal
          isOpen={formModalOpen}
          onClose={() => {
            setFormModalOpen(false);
            setCurrentItem(null);
          }}
          compliance={currentItem}
          onSave={handleSaveComplianceItem}
          isSubmitting={isSubmitting}
        />

        <ViewComplianceModal
          isOpen={viewModalOpen}
          onClose={() => {
            setViewModalOpen(false);
            setCurrentItem(null);
          }}
          compliance={currentItem}
        />

        <DeleteConfirmationModal
          isOpen={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setCurrentItem(null);
          }}
          onConfirm={handleDeleteComplianceItem}
          complianceTitle={currentItem?.title || "this compliance record"}
          isDeleting={isDeleting}
        />
      </main>
    </DashboardLayout>
  );
}
