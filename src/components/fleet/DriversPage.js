"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Plus,
  Search,
  RefreshCw,
  Users,
  Edit,
  Trash2,
  AlertTriangle,
  ChevronLeft,
  Download,
  Clock,
  CheckCircle,
  X,
  Lock
} from "lucide-react";
import { fetchDrivers, deleteDriver, checkDriverDocumentStatus, getDriverStats } from "@/lib/services/driverService";
import { formatDateForDisplayMMDDYYYY } from "@/lib/utils/dateUtils";
import { getUserFriendlyError } from "@/lib/utils/errorMessages";
import { usePagination, Pagination } from "@/hooks/usePagination";
import { OperationMessage, EmptyState } from "@/components/ui/OperationMessage";
import DriverFormModal from "@/components/fleet/DriverFormModal";
import DeleteConfirmationModal from "@/components/common/DeleteConfirmationModal";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { LimitReachedPrompt } from "@/components/billing/UpgradePrompt";
import TutorialCard from "@/components/shared/TutorialCard";
import TableActions from "@/components/shared/TableActions";
import { FileText, Shield, Calendar as CalendarDoc, Bell } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";

// Local storage key for filter persistence
const STORAGE_KEY = 'driver_filters';

// Loading skeleton component
function LoadingSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Stats skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
        ))}
      </div>
    </div>
  );
}

export default function DriversPage() {
  const { t } = useTranslation('fleet');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [drivers, setDrivers] = useState([]);

  // Feature access for resource limits
  const { checkResourceUpgrade, getResourceLimit } = useFeatureAccess();

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    valid: 0,
    expiringSoon: 0,
    expired: 0
  });

  // Filter state with localStorage persistence
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
      status: 'all',
      documentStatus: 'all',
      search: ''
    };
  });

  // Modal states
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [driverToEdit, setDriverToEdit] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [driverToDelete, setDriverToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Calculate document expiry statistics
  const calculateExpiryStats = useCallback((driversData) => {
    let expiringSoon = 0;
    let expired = 0;
    let valid = 0;

    driversData.forEach(driver => {
      const status = checkDriverDocumentStatus(driver);

      if (status.licenseStatus === 'expired' || status.medicalCardStatus === 'expired') {
        expired++;
      } else if (status.licenseStatus === 'expiring' || status.medicalCardStatus === 'expiring') {
        expiringSoon++;
      } else {
        valid++;
      }
    });

    setStats({
      total: driversData.length,
      expiringSoon,
      expired,
      valid
    });
  }, []);

  // Load data
  const loadData = useCallback(async (userId) => {
    try {
      const data = await fetchDrivers(userId);
      setDrivers(data);
      calculateExpiryStats(data);
    } catch (error) {
      setMessage({ type: 'error', text: getUserFriendlyError(error) });
    }
  }, [calculateExpiryStats]);

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

        // Set up real-time subscription - selective updates without full reload
        channel = supabase
          .channel('drivers-changes')
          .on('postgres_changes',
            { event: '*', schema: 'public', table: 'drivers', filter: `user_id=eq.${user.id}` },
            (payload) => {
              // Update local state directly based on event type (no full reload)
              if (payload.eventType === 'INSERT') {
                setDrivers(prev => {
                  const updated = [payload.new, ...prev];
                  calculateExpiryStats(updated);
                  return updated;
                });
              } else if (payload.eventType === 'UPDATE') {
                setDrivers(prev => {
                  const updated = prev.map(d => d.id === payload.new.id ? payload.new : d);
                  calculateExpiryStats(updated);
                  return updated;
                });
              } else if (payload.eventType === 'DELETE') {
                setDrivers(prev => {
                  const updated = prev.filter(d => d.id !== payload.old.id);
                  calculateExpiryStats(updated);
                  return updated;
                });
              }
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

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [loadData]);

  // Apply filters to drivers
  const filteredDrivers = useMemo(() => {
    let results = [...drivers];

    // Apply search term
    if (filters.search) {
      const term = filters.search.toLowerCase();
      results = results.filter(driver =>
        driver.name?.toLowerCase().includes(term) ||
        driver.license_number?.toLowerCase().includes(term) ||
        driver.phone?.toLowerCase().includes(term) ||
        driver.email?.toLowerCase().includes(term)
      );
    }

    // Apply status filter
    if (filters.status !== 'all') {
      results = results.filter(driver => driver.status === filters.status);
    }

    // Apply document status filter
    if (filters.documentStatus !== 'all') {
      results = results.filter(driver => {
        const status = checkDriverDocumentStatus(driver);

        switch (filters.documentStatus) {
          case 'expired':
            return status.licenseStatus === 'expired' || status.medicalCardStatus === 'expired';
          case 'expiring':
            return status.licenseStatus === 'expiring' || status.medicalCardStatus === 'expiring';
          case 'valid':
            return status.licenseStatus === 'valid' && status.medicalCardStatus === 'valid';
          default:
            return true;
        }
      });
    }

    return results;
  }, [drivers, filters]);

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
  } = usePagination(filteredDrivers, { itemsPerPage: 10 });

  // Reset filters
  const resetFilters = useCallback(() => {
    setFilters({
      status: 'all',
      documentStatus: 'all',
      search: ''
    });
  }, []);

  // Handle adding a driver
  const handleAddDriver = useCallback(() => {
    setDriverToEdit(null);
    setFormModalOpen(true);
  }, []);

  // Handle editing a driver
  const handleEditDriver = useCallback((driver) => {
    setDriverToEdit(driver);
    setFormModalOpen(true);
  }, []);

  // Handle driver form submission
  const handleDriverSubmit = useCallback(async () => {
    if (!user) return;
    await loadData(user.id);
    setFormModalOpen(false);
    setDriverToEdit(null);
    setMessage({ type: 'success', text: driverToEdit ? t('driversPage.driverUpdated') : t('driversPage.driverAdded') });
  }, [user, loadData, driverToEdit, t]);

  // Handle deleting a driver
  const handleDeleteClick = useCallback((driver) => {
    setDriverToDelete(driver);
    setDeleteModalOpen(true);
  }, []);

  // Confirm driver deletion
  const confirmDelete = useCallback(async () => {
    if (!driverToDelete || !user) return;

    try {
      setIsDeleting(true);
      await deleteDriver(driverToDelete.id);
      await loadData(user.id);
      setDeleteModalOpen(false);
      setDriverToDelete(null);
      setMessage({ type: 'success', text: t('driversPage.driverDeleted') });
    } catch (error) {
      setMessage({ type: 'error', text: getUserFriendlyError(error) });
    } finally {
      setIsDeleting(false);
    }
  }, [driverToDelete, user, loadData]);

  // Export drivers to CSV
  const handleExport = useCallback(() => {
    if (drivers.length === 0) return;

    const headers = ["Name", "Position", "Phone", "Email", "License Number", "License Expiry", "Medical Card Expiry", "Status"];
    const csvData = drivers.map(d => [
      d.name || "",
      d.position || "",
      d.phone || "",
      d.email || "",
      d.license_number || "",
      d.license_expiry || "",
      d.medical_card_expiry || "",
      d.status || ""
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
    link.setAttribute('download', `drivers_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [drivers]);

  // Status badge styling
  const getStatusBadge = useCallback((status) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'Inactive':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'On Leave':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  }, []);

  // Document status badge
  const getDocumentStatusBadge = useCallback((driver) => {
    const status = checkDriverDocumentStatus(driver);

    if (status.licenseStatus === 'expired' || status.medicalCardStatus === 'expired') {
      return { text: t('driversPage.expired'), class: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' };
    } else if (status.licenseStatus === 'expiring' || status.medicalCardStatus === 'expiring') {
      return { text: t('driversPage.expiringSoon'), class: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' };
    } else {
      return { text: t('driversPage.valid'), class: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' };
    }
  }, [t]);

  // Stat cards data
  const statCards = [
    {
      label: t('stats.totalDrivers'),
      value: stats.total,
      icon: Users,
      iconBg: "bg-blue-100 dark:bg-blue-900/40",
      iconColor: "text-blue-600 dark:text-blue-400",
      borderColor: "border-l-blue-500",
      footerBg: "bg-blue-50 dark:bg-blue-900/20",
      description: t('stats.allRegisteredDrivers')
    },
    {
      label: t('driversPage.validDocuments'),
      value: stats.valid,
      icon: CheckCircle,
      iconBg: "bg-green-100 dark:bg-green-900/40",
      iconColor: "text-green-600 dark:text-green-400",
      borderColor: "border-l-green-500",
      footerBg: "bg-green-50 dark:bg-green-900/20",
      description: t('driversPage.allDocumentsCurrent')
    },
    {
      label: t('driversPage.expiringSoon'),
      value: stats.expiringSoon,
      icon: Clock,
      iconBg: "bg-orange-100 dark:bg-orange-900/40",
      iconColor: "text-orange-600 dark:text-orange-400",
      borderColor: "border-l-orange-500",
      footerBg: "bg-orange-50 dark:bg-orange-900/20",
      description: t('driversPage.within30Days')
    },
    {
      label: t('driversPage.expired'),
      value: stats.expired,
      icon: AlertTriangle,
      iconBg: "bg-red-100 dark:bg-red-900/40",
      iconColor: "text-red-600 dark:text-red-400",
      borderColor: "border-l-red-500",
      footerBg: "bg-red-50 dark:bg-red-900/20",
      description: t('driversPage.needsImmediateAttention')
    }
  ];

  if (loading) {
    return (
      <DashboardLayout activePage="fleet">
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
    <DashboardLayout activePage="fleet">
      <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          {/* Header with gradient */}
          <div className="mb-8 bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-700 dark:to-blue-600 rounded-xl shadow-md p-6 text-white">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="mb-4 md:mb-0">
                <div className="flex items-center">
                  <Link href="/dashboard/fleet" className="mr-2 p-2 rounded-full hover:bg-white/20 transition-colors">
                    <ChevronLeft size={20} />
                  </Link>
                  <div>
                    <h1 className="text-3xl font-bold mb-1">{t('driversPage.title')}</h1>
                    <p className="text-blue-100">{t('driversPage.subtitle')}</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                {(() => {
                  const driverLimit = checkResourceUpgrade('drivers', drivers.length);
                  if (driverLimit.needsUpgrade) {
                    return (
                      <Link
                        href="/dashboard/upgrade"
                        className="px-4 py-2 bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200 transition-colors shadow-sm flex items-center font-medium"
                      >
                        <Lock size={18} className="mr-2" />
                        {t('driversPage.limitReached')} ({drivers.length}/{driverLimit.limit})
                      </Link>
                    );
                  }
                  return (
                    <button
                      onClick={handleAddDriver}
                      className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors shadow-sm flex items-center font-medium"
                    >
                      <Plus size={18} className="mr-2" />
                      {t('drivers.addDriver')}
                    </button>
                  );
                })()}
                <button
                  onClick={handleExport}
                  className="px-4 py-2 bg-blue-700 dark:bg-blue-800 text-white rounded-lg hover:bg-blue-800 dark:hover:bg-blue-900 transition-colors shadow-sm flex items-center font-medium"
                  disabled={drivers.length === 0}
                >
                  <Download size={18} className="mr-2" />
                  {t('driversPage.export')}
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
          {user && (
            <TutorialCard
              pageId="drivers"
              title={t('driversPage.tutorialTitle')}
              description={t('driversPage.tutorialDescription')}
              accentColor="green"
              userId={user.id}
              features={[
                {
                  icon: Plus,
                  title: t('driversPage.tutorialFeature1Title'),
                  description: t('driversPage.tutorialFeature1Desc')
                },
                {
                  icon: Shield,
                  title: t('driversPage.tutorialFeature2Title'),
                  description: t('driversPage.tutorialFeature2Desc')
                },
                {
                  icon: Bell,
                  title: t('driversPage.tutorialFeature3Title'),
                  description: t('driversPage.tutorialFeature3Desc')
                },
                {
                  icon: Download,
                  title: t('driversPage.tutorialFeature4Title'),
                  description: t('driversPage.tutorialFeature4Desc')
                }
              ]}
              tips={[
                t('driversPage.tip1'),
                t('driversPage.tip2'),
                t('driversPage.tip3'),
                t('driversPage.tip4')
              ]}
            />
          )}

          {/* Statistics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {statCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <div
                  key={index}
                  className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700 border-l-4 ${card.borderColor} hover:shadow-md transition-all`}
                >
                  <div className="flex items-center justify-between p-4">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold tracking-wide">
                        {card.label}
                      </p>
                      <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-gray-100">
                        {card.value}
                      </p>
                    </div>
                    <div className={`p-3 rounded-xl ${card.iconBg}`}>
                      <Icon size={20} className={card.iconColor} />
                    </div>
                  </div>
                  <div className={`px-4 py-2 ${card.footerBg} border-t border-gray-100 dark:border-gray-700`}>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {card.description}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Driver Limit Warning Banner */}
          {(() => {
            const driverLimit = checkResourceUpgrade('drivers', drivers.length);
            const limit = getResourceLimit('drivers');
            if (driverLimit.needsUpgrade) {
              return (
                <LimitReachedPrompt
                  limitName="drivers"
                  currentCount={drivers.length}
                  limit={limit}
                  nextTier={driverLimit.nextTier}
                  resourceName="Drivers"
                  className="mb-6"
                />
              );
            }
            if (limit !== Infinity && drivers.length >= limit - 1 && drivers.length > 0) {
              return (
                <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Lock size={20} className="text-amber-600 dark:text-amber-400" />
                    <p className="text-amber-800 dark:text-amber-200 text-sm">
                      <span className="font-medium">{t('driversPage.approachingLimit')}</span> {t('driversPage.youHaveXOfYDrivers', { current: drivers.length, limit })}
                      <Link href="/dashboard/upgrade" className="ml-2 underline hover:no-underline">
                        {t('driversPage.upgradeForMoreDrivers')}
                      </Link>
                    </p>
                  </div>
                </div>
              );
            }
            return null;
          })()}

          {/* Expired documents alert */}
          {stats.expired > 0 && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex">
                <AlertTriangle className="h-5 w-5 text-red-500 dark:text-red-400 mr-3 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">{t('driversPage.documentExpirationAlert')}</p>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    {stats.expired !== 1
                      ? t('driversPage.driversHaveExpiredDocsPlural', { count: stats.expired })
                      : t('driversPage.driversHaveExpiredDocs', { count: stats.expired })}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Inline Filter Bar */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search Input */}
              <div className="flex-1 relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  placeholder={t('driversPage.searchPlaceholder')}
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
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 w-full sm:w-auto transition-colors min-h-[44px]"
                >
                  <option value="all">{t('driversPage.allStatuses')}</option>
                  <option value="Active">{t('driversPage.active')}</option>
                  <option value="Inactive">{t('driversPage.inactive')}</option>
                  <option value="On Leave">{t('driversPage.onLeave')}</option>
                </select>

                <select
                  value={filters.documentStatus}
                  onChange={(e) => setFilters(prev => ({ ...prev, documentStatus: e.target.value }))}
                  className="px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 w-full sm:w-auto transition-colors min-h-[44px]"
                >
                  <option value="all">{t('driversPage.allDocuments')}</option>
                  <option value="valid">{t('driversPage.valid')}</option>
                  <option value="expiring">{t('driversPage.expiringSoon')}</option>
                  <option value="expired">{t('driversPage.expired')}</option>
                </select>

                {/* Reset Filters Button */}
                <button
                  onClick={resetFilters}
                  className="px-3 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Reset Filters"
                  disabled={filters.status === "all" && filters.documentStatus === "all" && filters.search === ""}
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Drivers Table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="bg-gray-50 dark:bg-gray-700/50 px-5 py-4 border-b border-gray-200 dark:border-gray-600 flex justify-between items-center">
              <h3 className="font-medium text-gray-700 dark:text-gray-200">{t('driversPage.drivers')}</h3>
              {(() => {
                const driverLimit = checkResourceUpgrade('drivers', drivers.length);
                if (driverLimit.needsUpgrade) {
                  return (
                    <Link
                      href="/dashboard/upgrade"
                      className="flex items-center text-sm text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300"
                    >
                      <Lock size={16} className="mr-1" />
                      {t('driversPage.upgradeForMore')}
                    </Link>
                  );
                }
                return (
                  <button
                    onClick={handleAddDriver}
                    className="flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                  >
                    <Plus size={16} className="mr-1" />
                    {t('drivers.addDriver')}
                  </button>
                );
              })()}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block">
              <table className="w-full table-fixed divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th scope="col" className="w-[22%] px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('driversPage.driver')}
                    </th>
                    <th scope="col" className="w-[14%] px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('driversPage.position')}
                    </th>
                    <th scope="col" className="w-[14%] px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('driversPage.phone')}
                    </th>
                    <th scope="col" className="w-[14%] px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('driversPage.licenseNumber')}
                    </th>
                    <th scope="col" className="w-[12%] px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('driversPage.status')}
                    </th>
                    <th scope="col" className="w-[12%] px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('driversPage.documents')}
                    </th>
                    <th scope="col" className="w-[12%] px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('driversPage.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {paginatedData.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center">
                        {drivers.length === 0 ? (
                          <div className="max-w-sm mx-auto">
                            <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                              <Users className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">{t('driversPage.noDriversFound')}</h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-4">{t('driversPage.getStartedAddFirstDriver')}</p>
                            {(() => {
                              const driverLimit = checkResourceUpgrade('drivers', drivers.length);
                              if (driverLimit.needsUpgrade) {
                                return (
                                  <Link
                                    href="/dashboard/upgrade"
                                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-amber-800 bg-amber-100 hover:bg-amber-200"
                                  >
                                    <Lock size={16} className="mr-2" />
                                    {t('driversPage.upgradeToAddDrivers')}
                                  </Link>
                                );
                              }
                              return (
                                <button
                                  onClick={handleAddDriver}
                                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                                >
                                  <Plus size={16} className="mr-2" />
                                  {t('drivers.addDriver')}
                                </button>
                              );
                            })()}
                          </div>
                        ) : (
                          <div>
                            <p className="text-gray-500 dark:text-gray-400 mb-2">{t('driversPage.noDriversMatchFilters')}</p>
                            <button
                              onClick={resetFilters}
                              className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                            >
                              <RefreshCw size={14} className="mr-1" />
                              {t('driversPage.resetFilters')}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ) : (
                    paginatedData.map(driver => {
                      const docStatus = getDocumentStatusBadge(driver);

                      return (
                        <tr key={driver.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          <td className="px-4 py-3">
                            <button
                              onClick={() => window.location.href = `/dashboard/fleet/drivers/${driver.id}`}
                              className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline truncate block max-w-full text-left"
                              title={driver.name}
                            >
                              {driver.name}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-gray-900 dark:text-gray-100 truncate">
                            {driver.position || t('drivers.defaultPosition')}
                          </td>
                          <td className="px-4 py-3 text-gray-900 dark:text-gray-100 truncate">
                            {driver.phone || t('driversPage.na')}
                          </td>
                          <td className="px-4 py-3 text-gray-900 dark:text-gray-100 truncate">
                            {driver.license_number || t('driversPage.na')}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(driver.status)}`}>
                              {driver.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${docStatus.class}`}>
                              {docStatus.text}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <TableActions
                              onEdit={() => handleEditDriver(driver)}
                              onDelete={() => handleDeleteClick(driver)}
                              size="md"
                            />
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
                drivers.length === 0 ? (
                  (() => {
                    const driverLimit = checkResourceUpgrade('drivers', drivers.length);
                    if (driverLimit.needsUpgrade) {
                      return (
                        <div className="text-center py-8">
                          <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                            <Users className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                          </div>
                          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">{t('driversPage.noDriversFound')}</h3>
                          <p className="text-gray-500 dark:text-gray-400 mb-4">{t('driversPage.upgradeYourPlan')}</p>
                          <Link
                            href="/dashboard/upgrade"
                            className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-amber-800 bg-amber-100 hover:bg-amber-200"
                          >
                            <Lock size={16} className="mr-2" />
                            {t('driversPage.upgradePlan')}
                          </Link>
                        </div>
                      );
                    }
                    return (
                      <EmptyState
                        icon={Users}
                        title={t('driversPage.noDriversFound')}
                        description={t('driversPage.getStartedAddFirstDriver')}
                        action={{
                          label: t('drivers.addDriver'),
                          onClick: handleAddDriver,
                          icon: Plus
                        }}
                      />
                    );
                  })()
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400 mb-4">{t('driversPage.noDriversMatchFilters')}</p>
                    <button
                      onClick={resetFilters}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                    >
                      <RefreshCw size={14} className="mr-2" />
                      {t('driversPage.resetFilters')}
                    </button>
                  </div>
                )
              ) : (
                paginatedData.map(driver => {
                  const docStatus = getDocumentStatusBadge(driver);

                  return (
                    <div
                      key={driver.id}
                      className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <button
                          onClick={() => window.location.href = `/dashboard/fleet/drivers/${driver.id}`}
                          className="font-medium text-blue-600 dark:text-blue-400 hover:underline text-left"
                        >
                          {driver.name}
                        </button>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(driver.status)}`}>
                          {driver.status}
                        </span>
                      </div>
                      <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                        <p><span className="font-medium">{t('driversPage.position')}:</span> {driver.position || t('drivers.defaultPosition')}</p>
                        <p><span className="font-medium">{t('driversPage.phone')}:</span> {driver.phone || t('driversPage.na')}</p>
                        <p><span className="font-medium">{t('driversPage.documents')}:</span> <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${docStatus.class}`}>{docStatus.text}</span></p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600 flex justify-end">
                        <TableActions
                          onEdit={() => handleEditDriver(driver)}
                          onDelete={() => handleDeleteClick(driver)}
                          size="lg"
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Pagination */}
            {filteredDrivers.length > 0 && (
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

        {/* Modals */}
        <DriverFormModal
          isOpen={formModalOpen}
          onClose={() => {
            setFormModalOpen(false);
            setDriverToEdit(null);
          }}
          driver={driverToEdit}
          userId={user?.id}
          onSubmit={handleDriverSubmit}
        />

        <DeleteConfirmationModal
          isOpen={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setDriverToDelete(null);
          }}
          onConfirm={confirmDelete}
          title={t('driversPage.deleteDriver')}
          message={t('driversPage.confirmDeleteDriver', { name: driverToDelete?.name })}
          isDeleting={isDeleting}
        />
      </main>
    </DashboardLayout>
  );
}
