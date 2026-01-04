// src/components/dashboard/DispatchingPage.js
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { fetchCustomers } from "@/lib/services/customerService";
import { usePagination } from "@/hooks/usePagination";
import { getUserFriendlyError } from "@/lib/utils/errorMessages";
import { OperationMessage, EmptyState } from "@/components/ui/OperationMessage";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { LimitReachedPrompt } from "@/components/billing/UpgradePrompt";
import {
  Plus,
  Truck,
  RefreshCw,
  Package,
  Lock,
  Download,
  UserCheck,
  Route,
  FileCheck,
  Filter,
  BarChart2
} from "lucide-react";
import TutorialCard from "@/components/shared/TutorialCard";
import { useTranslation } from "@/context/LanguageContext";

// Import dispatching components
import LoadStats from "@/components/dispatching/LoadStats";
import LoadFilterBar from "@/components/dispatching/LoadFilterBar";
import LoadCard, { LoadCardSkeleton } from "@/components/dispatching/LoadCard";
import LoadTableRow, { LoadTableRowSkeleton } from "@/components/dispatching/LoadTableRow";
import TopLoads from "@/components/dispatching/TopLoads";
import LoadCategories from "@/components/dispatching/LoadCategories";
import LoadDetailModal from "@/components/dispatching/LoadDetailModal";
import NewLoadModal from "@/components/dispatching/NewLoadModal";
import DeleteLoadModal from "@/components/dispatching/DeleteLoadModal";
import ExportReportModal from "@/components/common/ExportReportModal";
import DispatchingMap from "@/components/dispatching/DispatchingMap";

// Fetch drivers from the database
const fetchDrivers = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    return data || [];
  } catch (err) {
    return [];
  }
};

// Fetch trucks/vehicles from the database
const fetchTrucks = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    return data || [];
  } catch (err) {
    return [];
  }
};

// Fetch loads from the database with filters
const fetchLoads = async (userId, filters = {}) => {
  try {
    let query = supabase
      .from('loads')
      .select('*')
      .eq('user_id', userId);

    // Apply status filter
    if (filters.status && filters.status !== 'All') {
      if (filters.status === 'Active') {
        query = query.not('status', 'in', '("Completed","Cancelled")');
      } else {
        query = query.eq('status', filters.status);
      }
    }

    // Apply search filter
    if (filters.search) {
      query = query.or(`load_number.ilike.%${filters.search}%,customer.ilike.%${filters.search}%,driver.ilike.%${filters.search}%,origin.ilike.%${filters.search}%,destination.ilike.%${filters.search}%`);
    }

    // Apply date filter
    if (filters.dateRange && filters.dateRange !== 'all') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const thisWeekStart = new Date(today);
      thisWeekStart.setDate(today.getDate() - today.getDay());
      const thisWeekEnd = new Date(thisWeekStart);
      thisWeekEnd.setDate(thisWeekStart.getDate() + 6);

      const lastWeekStart = new Date(thisWeekStart);
      lastWeekStart.setDate(lastWeekStart.getDate() - 7);
      const lastWeekEnd = new Date(thisWeekStart);
      lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);

      const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const thisMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

      const thisQuarterStart = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1);
      const thisQuarterEnd = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3 + 3, 0);

      const lastQuarterStart = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3 - 3, 1);
      const lastQuarterEnd = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 0);

      const dateField = filters.sortBy === 'pickupDate' ? 'pickup_date' : 'delivery_date';

      switch (filters.dateRange) {
        case 'today':
          query = query.gte(dateField, today.toISOString().split('T')[0])
            .lt(dateField, tomorrow.toISOString().split('T')[0]);
          break;
        case 'tomorrow':
          const dayAfterTomorrow = new Date(tomorrow);
          dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
          query = query.gte(dateField, tomorrow.toISOString().split('T')[0])
            .lt(dateField, dayAfterTomorrow.toISOString().split('T')[0]);
          break;
        case 'thisWeek':
          query = query.gte(dateField, thisWeekStart.toISOString().split('T')[0])
            .lte(dateField, thisWeekEnd.toISOString().split('T')[0]);
          break;
        case 'lastWeek':
          query = query.gte(dateField, lastWeekStart.toISOString().split('T')[0])
            .lte(dateField, lastWeekEnd.toISOString().split('T')[0]);
          break;
        case 'thisMonth':
          query = query.gte(dateField, thisMonthStart.toISOString().split('T')[0])
            .lte(dateField, thisMonthEnd.toISOString().split('T')[0]);
          break;
        case 'lastMonth':
          query = query.gte(dateField, lastMonthStart.toISOString().split('T')[0])
            .lte(dateField, lastMonthEnd.toISOString().split('T')[0]);
          break;
        case 'thisQuarter':
          query = query.gte(dateField, thisQuarterStart.toISOString().split('T')[0])
            .lte(dateField, thisQuarterEnd.toISOString().split('T')[0]);
          break;
        case 'lastQuarter':
          query = query.gte(dateField, lastQuarterStart.toISOString().split('T')[0])
            .lte(dateField, lastQuarterEnd.toISOString().split('T')[0]);
          break;
        case 'Custom':
          if (filters.startDate) {
            query = query.gte(dateField, filters.startDate);
          }
          if (filters.endDate) {
            query = query.lte(dateField, filters.endDate);
          }
          break;
      }
    }

    // Apply sorting
    if (filters.sortBy) {
      switch (filters.sortBy) {
        case 'pickupDate':
          query = query.order('pickup_date', { ascending: true });
          break;
        case 'deliveryDate':
          query = query.order('delivery_date', { ascending: true });
          break;
        case 'completedDate':
          query = query.order('completed_at', { ascending: false });
          break;
        case 'status':
          query = query.order('status', { ascending: true });
          break;
        case 'customer':
          query = query.order('customer', { ascending: true });
          break;
        case 'rate':
          query = query.order('rate', { ascending: false });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query;

    if (error) throw error;

    if (!data || data.length === 0) {
      return [];
    }

    return data.map(load => ({
      id: load.id,
      loadNumber: load.load_number,
      customer: load.customer,
      origin: load.origin || '',
      destination: load.destination || '',
      pickupDate: load.pickup_date,
      deliveryDate: load.delivery_date,
      status: load.status,
      driver: load.driver || '',
      driverId: load.driver_id || null,
      truckId: load.truck_id || null,
      truckInfo: load.truck_info || null,
      rate: load.rate || 0,
      distance: load.distance || 0,
      description: load.description || '',
      completedAt: load.completed_at || null
    }));
  } catch (err) {
    throw err;
  }
};

// Calculate load statistics
const calculateLoadStats = (loads) => {
  const activeLoads = loads.filter(l => !['Completed', 'Cancelled'].includes(l.status)).length;
  const completedLoads = loads.filter(l => l.status === 'Completed').length;
  const totalRevenue = loads
    .filter(l => l.status === 'Completed')
    .reduce((sum, l) => sum + (parseFloat(l.rate) || 0), 0);

  return {
    totalLoads: loads.length,
    activeLoads,
    completedLoads,
    totalRevenue
  };
};

// Main Dispatching Dashboard Component
export default function DispatchingPage() {
  const { t } = useTranslation('dispatching');
  const searchParams = useSearchParams();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);

  // Feature access for resource limits
  const { checkResourceUpgrade, getResourceLimit, loading: featureLoading } = useFeatureAccess();
  const [monthlyLoadCount, setMonthlyLoadCount] = useState(0);

  // State for the loads
  const [loads, setLoads] = useState([]);
  const [loadStats, setLoadStats] = useState({
    totalLoads: 0,
    activeLoads: 0,
    completedLoads: 0,
    totalRevenue: 0
  });

  // State for customers, drivers, and trucks
  const [customers, setCustomers] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [trucks, setTrucks] = useState([]);

  // State for filtering and selection
  const [filters, setFilters] = useState({
    search: "",
    status: "All",
    dateRange: "all",
    sortBy: "created_at",
    driverId: "",
    vehicleId: "",
    startDate: "",
    endDate: ""
  });

  // State for modals
  const [selectedLoad, setSelectedLoad] = useState(null);
  const [editingLoad, setEditingLoad] = useState(null);
  const [showNewLoadModal, setShowNewLoadModal] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [loadToDelete, setLoadToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Check for addNew URL parameter to auto-open the modal
  useEffect(() => {
    if (searchParams.get('addNew') === 'true' && !loading && user) {
      setEditingLoad(null);
      setShowNewLoadModal(true);
      // Remove the query parameter from URL without navigation
      const url = new URL(window.location.href);
      url.searchParams.delete('addNew');
      router.replace(url.pathname, { scroll: false });
    }
  }, [searchParams, loading, user, router]);

  // Feedback message state
  const [message, setMessage] = useState(null);

  // Pagination
  const {
    currentPage,
    totalPages,
    paginatedData: paginatedLoads,
    goToPage,
    nextPage,
    prevPage,
    hasNextPage,
    hasPrevPage
  } = usePagination(loads, { itemsPerPage: 10 });

  // Fetch monthly load count for limit checking
  const fetchMonthlyLoadCount = useCallback(async (userId) => {
    if (!userId) return 0;
    try {
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

      const { count, error } = await supabase
        .from('loads')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', firstDayOfMonth)
        .lte('created_at', lastDayOfMonth);

      if (error) throw error;
      return count || 0;
    } catch (err) {
      return 0;
    }
  }, []);

  const loadLoadsData = useCallback(async (userId) => {
    if (!userId) return;
    try {
      setDataLoading(true);
      const [loadData, monthlyCount] = await Promise.all([
        fetchLoads(userId, filters),
        fetchMonthlyLoadCount(userId)
      ]);
      setLoads(loadData);
      setLoadStats(calculateLoadStats(loadData));
      setMonthlyLoadCount(monthlyCount);
    } catch (err) {
      setMessage({ type: 'error', text: getUserFriendlyError(err) });
    } finally {
      setDataLoading(false);
    }
  }, [filters, fetchMonthlyLoadCount]);

  // Initial data fetch
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError) throw userError;

        if (!user) {
          window.location.href = '/login';
          return;
        }

        setUser(user);

        const [cusData, drvData, trkData] = await Promise.all([
          fetchCustomers(user.id),
          fetchDrivers(user.id),
          fetchTrucks(user.id)
        ]);

        setCustomers(cusData);
        setDrivers(drvData);
        setTrucks(trkData);

        await loadLoadsData(user.id);

        setLoading(false);
      } catch (err) {
        setMessage({ type: 'error', text: getUserFriendlyError(err) });
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Reload when filters change
  useEffect(() => {
    if (user) {
      loadLoadsData(user.id);
    }
  }, [user, filters, loadLoadsData]);

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    const subscription = supabase
      .channel('loads_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'loads',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          loadLoadsData(user.id);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user, loadLoadsData]);

  // Handle selecting a load to view details
  const handleSelectLoad = (load) => {
    setSelectedLoad(load);
  };

  // Handle editing a load
  const handleEditLoad = (load) => {
    setEditingLoad(load);
    setShowNewLoadModal(true);
  };

  // Handle closing modals
  const handleCloseModal = () => {
    setSelectedLoad(null);
  };

  // Handle status change for a load
  const handleStatusChange = async (updatedLoad) => {
    const updatedLoads = loads.map(load => load.id === updatedLoad.id ? updatedLoad : load);
    setLoads(updatedLoads);
    setSelectedLoad(updatedLoad);
    setLoadStats(calculateLoadStats(updatedLoads));
  };

  // Handle assigning a driver to a load
  const handleAssignDriver = async (loadId, driverName, driverId) => {
    const updatedLoads = loads.map(load => {
      if (load.id === loadId) {
        return {
          ...load,
          driver: driverName,
          driverId: driverId,
          status: load.status === "Pending" ? "Assigned" : load.status
        };
      }
      return load;
    });

    setLoads(updatedLoads);
    setLoadStats(calculateLoadStats(updatedLoads));

    if (selectedLoad && selectedLoad.id === loadId) {
      setSelectedLoad({
        ...selectedLoad,
        driver: driverName,
        driverId: driverId,
        status: selectedLoad.status === "Pending" ? "Assigned" : selectedLoad.status
      });
    }
  };

  // Handle assigning a truck to a load
  const handleAssignTruck = async (loadId, truckInfo, truckId) => {
    const updatedLoads = loads.map(load => {
      if (load.id === loadId) {
        return {
          ...load,
          truckInfo: truckInfo,
          truckId: truckId
        };
      }
      return load;
    });

    setLoads(updatedLoads);

    if (selectedLoad && selectedLoad.id === loadId) {
      setSelectedLoad({
        ...selectedLoad,
        truckInfo: truckInfo,
        truckId: truckId
      });
    }
  };

  // Handle creating/updating a load
  const handleSaveLoad = (savedLoad) => {
    if (editingLoad) {
      const updatedLoads = loads.map(load => load.id === savedLoad.id ? savedLoad : load);
      setLoads(updatedLoads);
      setLoadStats(calculateLoadStats(updatedLoads));
      setMessage({ type: 'success', text: t('messages.loadUpdated') });
    } else {
      const updatedLoads = [savedLoad, ...loads];
      setLoads(updatedLoads);
      setLoadStats(calculateLoadStats(updatedLoads));
      setMessage({ type: 'success', text: t('messages.loadCreated') });
    }
    setEditingLoad(null);
  };

  // Handle deleting a load
  const handleDeleteLoad = (load) => {
    setLoadToDelete(load);
    setDeleteModalOpen(true);
  };

  // Confirm delete load
  const confirmDeleteLoad = async () => {
    if (!loadToDelete) return;

    try {
      setIsDeleting(true);

      const { error } = await supabase
        .from('loads')
        .delete()
        .eq('id', loadToDelete.id);

      if (error) throw error;

      const updatedLoads = loads.filter(load => load.id !== loadToDelete.id);
      setLoads(updatedLoads);
      setLoadStats(calculateLoadStats(updatedLoads));
      setMessage({ type: 'success', text: t('messages.loadDeleted') });

      setDeleteModalOpen(false);
      setLoadToDelete(null);
    } catch (err) {
      setMessage({ type: 'error', text: getUserFriendlyError(err) });
    } finally {
      setIsDeleting(false);
    }
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      search: "",
      status: "All",
      dateRange: "all",
      sortBy: "created_at",
      driverId: "",
      vehicleId: "",
      startDate: "",
      endDate: ""
    });
  };

  // Export columns configuration
  const exportColumns = [
    { key: 'loadNumber', header: 'Load #' },
    { key: 'customer', header: 'Customer' },
    { key: 'origin', header: 'Origin' },
    { key: 'destination', header: 'Destination' },
    { key: 'pickupDate', header: 'Pickup Date', format: 'date' },
    { key: 'deliveryDate', header: 'Delivery Date', format: 'date' },
    { key: 'driver', header: 'Driver' },
    { key: 'rate', header: 'Rate', format: 'currency' },
    { key: 'status', header: 'Status' }
  ];

  // Get export data
  const getExportData = useCallback(() => {
    return loads.map(load => ({
      loadNumber: load.loadNumber || '',
      customer: load.customer || '',
      origin: load.origin || '',
      destination: load.destination || '',
      pickupDate: load.pickupDate || '',
      deliveryDate: load.deliveryDate || '',
      driver: load.driver || 'Unassigned',
      rate: parseFloat(load.rate || 0),
      status: load.status || ''
    }));
  }, [loads]);

  // Get export summary info
  const getExportSummaryInfo = useCallback(() => {
    const totalRevenue = loads
      .filter(l => l.status === 'Completed')
      .reduce((sum, l) => sum + parseFloat(l.rate || 0), 0);
    const activeLoads = loads.filter(l => !['Completed', 'Cancelled'].includes(l.status)).length;
    const completedLoads = loads.filter(l => l.status === 'Completed').length;
    const assignedLoads = loads.filter(l => l.driver && l.driver !== '').length;
    const avgRate = loads.length > 0
      ? loads.reduce((sum, l) => sum + parseFloat(l.rate || 0), 0) / loads.length
      : 0;

    return {
      [t('page.exportSummary.totalLoads')]: loads.length.toString(),
      [t('page.exportSummary.activeLoads')]: activeLoads.toString(),
      [t('page.exportSummary.completed')]: completedLoads.toString(),
      [t('page.exportSummary.assigned')]: assignedLoads.toString(),
      [t('page.exportSummary.totalRevenue')]: `$${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      [t('page.exportSummary.avgRate')]: `$${avgRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    };
  }, [loads, t]);

  // Get date range for export
  const getExportDateRange = useCallback(() => {
    if (loads.length === 0) return null;

    const dates = loads
      .filter(l => l.pickupDate)
      .map(l => new Date(l.pickupDate))
      .sort((a, b) => a - b);

    if (dates.length === 0) return null;

    return {
      start: dates[0].toISOString().split('T')[0],
      end: dates[dates.length - 1].toISOString().split('T')[0]
    };
  }, [loads]);

  // Handle export
  const handleExportData = () => {
    if (loads.length === 0) return;
    setExportModalOpen(true);
  };

  // Handle status filter from sidebar
  const handleStatusFilterChange = (status) => {
    setFilters(prev => ({ ...prev, status }));
  };

  if (loading) {
    return (
      <DashboardLayout activePage="dispatching">
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            {/* Header Skeleton */}
            <div className="mb-6 h-32 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse"></div>
            {/* Stats Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-28 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse"></div>
              ))}
            </div>
            {/* Content Skeleton */}
            <div className="h-96 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse"></div>
          </div>
        </main>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activePage="dispatching">
      <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {/* Header with gradient background */}
          <div className="mb-6">
            <div className="relative rounded-xl overflow-hidden shadow-sm">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-700 dark:to-blue-600"></div>
              <div className="relative p-6 md:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div className="mb-4 sm:mb-0">
                    <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center">
                      <Truck size={28} className="mr-3" />
                      {t('page.title')}
                    </h1>
                    <p className="mt-1 text-blue-100">{t('page.subtitle')}</p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={handleExportData}
                      disabled={loads.length === 0}
                      className="inline-flex items-center px-4 py-2.5 bg-blue-700 dark:bg-blue-800 text-white rounded-lg hover:bg-blue-800 dark:hover:bg-blue-900 font-medium shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Download size={18} className="mr-2" />
                      {t('page.export')}
                    </button>
                    {(() => {
                      const loadLimit = checkResourceUpgrade('loadsPerMonth', monthlyLoadCount);
                      if (loadLimit.needsUpgrade) {
                        return (
                          <Link
                            href="/dashboard/upgrade"
                            className="inline-flex items-center px-4 py-2.5 bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200 font-medium shadow-lg transition-all duration-200"
                          >
                            <Lock size={18} className="mr-2" />
                            {t('page.limitReached')} ({monthlyLoadCount}/{loadLimit.limit})
                          </Link>
                        );
                      }
                      return (
                        <button
                          onClick={() => {
                            setEditingLoad(null);
                            setShowNewLoadModal(true);
                          }}
                          className="inline-flex items-center px-4 py-2.5 bg-white text-blue-600 rounded-lg hover:bg-blue-50 font-medium shadow-lg transition-all duration-200"
                        >
                          <Plus size={18} className="mr-2" />
                          {t('createLoad')}
                        </button>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tutorial Card */}
          {user && (
            <TutorialCard
              pageId="dispatching"
              title={t('page.tutorial.title')}
              description={t('page.tutorial.description')}
              accentColor="blue"
              userId={user.id}
              features={[
                {
                  icon: Plus,
                  title: t('page.tutorial.createLoads'),
                  description: t('page.tutorial.createLoadsDesc')
                },
                {
                  icon: UserCheck,
                  title: t('page.tutorial.assignDriverTruck'),
                  description: t('page.tutorial.assignDriverTruckDesc')
                },
                {
                  icon: Route,
                  title: t('page.tutorial.trackStatus'),
                  description: t('page.tutorial.trackStatusDesc')
                },
                {
                  icon: Filter,
                  title: t('page.tutorial.filterSearch'),
                  description: t('page.tutorial.filterSearchDesc')
                }
              ]}
              tips={[
                t('page.tips.assignBoth'),
                t('page.tips.markComplete'),
                t('page.tips.exportButton'),
                t('page.tips.clickAny')
              ]}
            />
          )}

          {/* Limit Warning Banner */}
          {(() => {
            const loadLimit = checkResourceUpgrade('loadsPerMonth', monthlyLoadCount);
            const limit = getResourceLimit('loadsPerMonth');
            if (limit !== Infinity && monthlyLoadCount >= limit * 0.8 && !loadLimit.needsUpgrade) {
              return (
                <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Lock size={20} className="text-amber-600" />
                    <p className="text-amber-800 dark:text-amber-200 text-sm">
                      <span className="font-medium">{t('page.limitWarning.approaching')}</span> {t('page.limitWarning.usedOf', { used: monthlyLoadCount, limit: limit })}
                      <Link href="/dashboard/upgrade" className="ml-2 underline hover:no-underline">
                        {t('page.limitWarning.upgrade')}
                      </Link>
                    </p>
                  </div>
                </div>
              );
            }
            return null;
          })()}

          {/* Operation Message */}
          <OperationMessage message={message} onDismiss={() => setMessage(null)} />

          {/* Statistics Cards */}
          <LoadStats
            stats={loadStats}
            isLoading={dataLoading}
            period="All Time"
          />

          {/* Fleet Map - Live vehicle locations */}
          <div className="mb-6">
            <DispatchingMap
              loads={loads}
              onVehicleSelect={(vehicle) => {
                // Could filter loads by this vehicle's driver
                console.log('Selected vehicle:', vehicle);
              }}
              onLoadSelect={(load) => {
                const foundLoad = loads.find(l => l.id === load.id);
                if (foundLoad) {
                  handleSelectLoad(foundLoad);
                }
              }}
            />
          </div>

          {/* Main Content - 4 Column Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar - Column 1 */}
            <div className="lg:col-span-1 space-y-6">
              <TopLoads
                loads={loads}
                isLoading={dataLoading}
                onSelectLoad={handleSelectLoad}
              />
              <LoadCategories
                loads={loads}
                selectedStatus={filters.status}
                onStatusChange={handleStatusFilterChange}
                isLoading={dataLoading}
              />
            </div>

            {/* Main Content - Columns 2-4 */}
            <div className="lg:col-span-3">
              {/* Filter Bar */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
                <LoadFilterBar
                  filters={filters}
                  setFilters={setFilters}
                  drivers={drivers}
                  vehicles={trucks}
                  onReset={resetFilters}
                />
              </div>

              {/* Load List Section */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div className="mb-4 sm:mb-0">
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('page.loadsTitle')}</h2>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {t('page.totalLoads', { count: loads.length })}
                        {filters.status !== 'All' && ` (${t('page.filteredBy', { status: filters.status })})`}
                      </p>
                    </div>
                    {dataLoading && (
                      <RefreshCw size={20} className="animate-spin text-blue-500" />
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  {dataLoading && loads.length === 0 ? (
                    <>
                      {/* Desktop Table Skeleton */}
                      <div className="hidden lg:block">
                        <table className="w-full table-fixed">
                          <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700">
                              {[
                                t('page.tableHeaders.load'),
                                t('page.tableHeaders.route'),
                                t('page.tableHeaders.dates'),
                                t('page.tableHeaders.driver'),
                                t('page.tableHeaders.rate'),
                                t('page.tableHeaders.status'),
                                t('page.tableHeaders.actions')
                              ].map((h, i) => (
                                <th key={i} className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <LoadTableRowSkeleton key={i} />
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {/* Mobile Card Skeleton */}
                      <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                          <LoadCardSkeleton key={i} />
                        ))}
                      </div>
                    </>
                  ) : loads.length === 0 ? (
                    <EmptyState
                      icon={Package}
                      title={t('emptyState.title')}
                      description={
                        filters.status !== "All" || filters.search || filters.dateRange !== "all"
                          ? t('common:filters.adjustFilters')
                          : t('emptyState.description')
                      }
                      action={{
                        label: t('createLoad'),
                        onClick: () => {
                          setEditingLoad(null);
                          setShowNewLoadModal(true);
                        }
                      }}
                    />
                  ) : (
                    <>
                      {/* Desktop Table View */}
                      <div className="hidden lg:block">
                        <table className="w-full table-fixed">
                          <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700">
                              <th className="w-[18%] px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('page.tableHeaders.load')}</th>
                              <th className="w-[20%] px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('page.tableHeaders.route')}</th>
                              <th className="w-[15%] px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('page.tableHeaders.dates')}</th>
                              <th className="w-[14%] px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('page.tableHeaders.driver')}</th>
                              <th className="w-[10%] px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('page.tableHeaders.rate')}</th>
                              <th className="w-[11%] px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('page.tableHeaders.status')}</th>
                              <th className="w-[12%] px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('page.tableHeaders.actions')}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {paginatedLoads.map(load => (
                              <LoadTableRow
                                key={load.id}
                                load={load}
                                onSelect={handleSelectLoad}
                                onEdit={handleEditLoad}
                                onDelete={handleDeleteLoad}
                              />
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile Card View */}
                      <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {paginatedLoads.map(load => (
                          <LoadCard
                            key={load.id}
                            load={load}
                            onSelect={handleSelectLoad}
                            onEdit={handleEditLoad}
                            onDelete={handleDeleteLoad}
                          />
                        ))}
                      </div>

                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div className="mt-6 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-4">
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {t('page.showingPage', { current: currentPage, total: totalPages })}
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={prevPage}
                              disabled={!hasPrevPage}
                              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${hasPrevPage
                                ? 'text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                                : 'text-gray-400 dark:text-gray-600 bg-gray-50 dark:bg-gray-800 cursor-not-allowed'
                                }`}
                            >
                              {t('common:pagination.previous')}
                            </button>
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                              let pageNum;
                              if (totalPages <= 5) {
                                pageNum = i + 1;
                              } else if (currentPage <= 3) {
                                pageNum = i + 1;
                              } else if (currentPage >= totalPages - 2) {
                                pageNum = totalPages - 4 + i;
                              } else {
                                pageNum = currentPage - 2 + i;
                              }
                              return (
                                <button
                                  key={pageNum}
                                  onClick={() => goToPage(pageNum)}
                                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${currentPage === pageNum
                                    ? 'text-white bg-blue-600'
                                    : 'text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    }`}
                                >
                                  {pageNum}
                                </button>
                              );
                            })}
                            <button
                              onClick={nextPage}
                              disabled={!hasNextPage}
                              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${hasNextPage
                                ? 'text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                                : 'text-gray-400 dark:text-gray-600 bg-gray-50 dark:bg-gray-800 cursor-not-allowed'
                                }`}
                            >
                              {t('common:pagination.next')}
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      {selectedLoad && (
        <LoadDetailModal
          load={selectedLoad}
          onClose={handleCloseModal}
          onStatusChange={handleStatusChange}
          onUpdate={handleStatusChange}
          drivers={drivers}
          trucks={trucks}
          onAssignDriver={handleAssignDriver}
          onAssignTruck={handleAssignTruck}
        />
      )}

      {showNewLoadModal && (
        <NewLoadModal
          onClose={() => {
            setShowNewLoadModal(false);
            setEditingLoad(null);
          }}
          onSubmit={handleSaveLoad}
        />
      )}

      {deleteModalOpen && (
        <DeleteLoadModal
          isOpen={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setLoadToDelete(null);
          }}
          onConfirm={confirmDeleteLoad}
          loadNumber={loadToDelete?.loadNumber}
          isDeleting={isDeleting}
        />
      )}

      {/* Export Report Modal */}
      <ExportReportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        title={t('page.exportModal.title')}
        description={t('page.exportModal.description')}
        data={getExportData()}
        columns={exportColumns}
        filename="loads_report"
        summaryInfo={getExportSummaryInfo()}
        dateRange={getExportDateRange()}
        pdfConfig={{
          title: t('page.exportModal.pdfTitle'),
          subtitle: t('page.exportModal.pdfSubtitle')
        }}
        onExportComplete={() => {
          setMessage({
            type: 'success',
            text: t('common:export.success')
          });
        }}
      />
    </DashboardLayout>
  );
}
