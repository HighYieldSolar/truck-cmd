"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Plus,
  Search,
  RefreshCw,
  Truck,
  Edit,
  Trash2,
  ChevronLeft,
  Download,
  FileText,
  Calendar,
  X,
  CheckCircle,
  Wrench,
  AlertTriangle,
  Clock,
  Lock
} from "lucide-react";
import { fetchTrucks, deleteTruck } from "@/lib/services/truckService";
import { formatDateForDisplayMMDDYYYY } from "@/lib/utils/dateUtils";
import TruckFormModal from "@/components/fleet/TruckFormModal";
import DeleteConfirmationModal from "@/components/common/DeleteConfirmationModal";
import OperationMessage from "@/components/ui/OperationMessage";
import { usePagination, Pagination } from "@/hooks/usePagination";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { LimitReachedPrompt } from "@/components/billing/UpgradePrompt";

const STORAGE_KEY = 'truck_filters';

export default function TrucksPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trucks, setTrucks] = useState([]);

  // Feature access for resource limits
  const { checkResourceUpgrade, getResourceLimit } = useFeatureAccess();

  // Statistics for vehicles
  const stats = useMemo(() => {
    const active = trucks.filter(t => t.status === 'Active').length;
    const inMaintenance = trucks.filter(t => t.status === 'In Maintenance').length;
    const outOfService = trucks.filter(t => t.status === 'Out of Service').length;
    const idle = trucks.filter(t => t.status === 'Idle').length;

    return {
      total: trucks.length,
      active,
      inMaintenance,
      outOfService,
      idle
    };
  }, [trucks]);

  // Stat cards configuration
  const statCards = [
    {
      label: "Total Vehicles",
      value: stats.total,
      icon: Truck,
      iconBg: "bg-blue-100 dark:bg-blue-900/40",
      iconColor: "text-blue-600 dark:text-blue-400",
      borderColor: "border-l-blue-500",
      footerBg: "bg-blue-50 dark:bg-blue-900/20",
      description: "All registered vehicles"
    },
    {
      label: "Active",
      value: stats.active,
      icon: CheckCircle,
      iconBg: "bg-green-100 dark:bg-green-900/40",
      iconColor: "text-green-600 dark:text-green-400",
      borderColor: "border-l-green-500",
      footerBg: "bg-green-50 dark:bg-green-900/20",
      description: "Ready for operation"
    },
    {
      label: "In Maintenance",
      value: stats.inMaintenance,
      icon: Wrench,
      iconBg: "bg-yellow-100 dark:bg-yellow-900/40",
      iconColor: "text-yellow-600 dark:text-yellow-400",
      borderColor: "border-l-yellow-500",
      footerBg: "bg-yellow-50 dark:bg-yellow-900/20",
      description: "Currently being serviced"
    },
    {
      label: "Out of Service",
      value: stats.outOfService,
      icon: AlertTriangle,
      iconBg: "bg-red-100 dark:bg-red-900/40",
      iconColor: "text-red-600 dark:text-red-400",
      borderColor: "border-l-red-500",
      footerBg: "bg-red-50 dark:bg-red-900/20",
      description: "Needs attention"
    }
  ];

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
      year: 'all',
      search: '',
    };
  });

  // Modals
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [truckToEdit, setTruckToEdit] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [truckToDelete, setTruckToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Operation messages
  const [operationMessage, setOperationMessage] = useState(null);

  // Save filters to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
    }
  }, [filters]);

  // Get available years for filter
  const availableYears = useMemo(() => {
    const years = trucks
      .map(truck => truck.year)
      .filter(year => year)
      .filter((year, index, self) => self.indexOf(year) === index)
      .sort((a, b) => b - a);
    return years;
  }, [trucks]);

  // Apply filters
  const filteredTrucks = useMemo(() => {
    if (!trucks) return [];

    let results = [...trucks];

    // Apply search term
    if (filters.search) {
      const term = filters.search.toLowerCase();
      results = results.filter(truck =>
        truck.name?.toLowerCase().includes(term) ||
        truck.make?.toLowerCase().includes(term) ||
        truck.model?.toLowerCase().includes(term) ||
        truck.vin?.toLowerCase().includes(term) ||
        truck.license_plate?.toLowerCase().includes(term)
      );
    }

    // Apply status filter
    if (filters.status !== 'all') {
      results = results.filter(truck => truck.status === filters.status);
    }

    // Apply year filter
    if (filters.year !== 'all') {
      results = results.filter(truck => String(truck.year) === String(filters.year));
    }

    return results;
  }, [trucks, filters]);

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
  } = usePagination(filteredTrucks, { itemsPerPage: 10 });

  // Load trucks function
  const loadTrucks = useCallback(async (userId) => {
    try {
      const data = await fetchTrucks(userId);
      setTrucks(data);
    } catch (error) {
      console.error('Error loading trucks:', error);
      setOperationMessage({
        type: 'error',
        text: 'Failed to load vehicles. Please try again later.'
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
        await loadTrucks(user.id);

        // Set up real-time subscription
        channel = supabase
          .channel('trucks-changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'trucks',
              filter: `user_id=eq.${user.id}`
            },
            (payload) => {
              if (payload.eventType === 'INSERT') {
                setTrucks(prev => [payload.new, ...prev]);
              } else if (payload.eventType === 'UPDATE') {
                setTrucks(prev => prev.map(t => t.id === payload.new.id ? payload.new : t));
              } else if (payload.eventType === 'DELETE') {
                setTrucks(prev => prev.filter(t => t.id !== payload.old.id));
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
  }, [loadTrucks]);

  // Handle adding a new truck
  const handleAddTruck = () => {
    setTruckToEdit(null);
    setFormModalOpen(true);
  };

  // Handle editing a truck
  const handleEditTruck = (truck) => {
    setTruckToEdit(truck);
    setFormModalOpen(true);
  };

  // Handle truck form submission
  const handleTruckSubmit = async () => {
    try {
      if (!user) return;

      await loadTrucks(user.id);
      localStorage.removeItem("truckFormData");

      setOperationMessage({
        type: 'success',
        text: truckToEdit ? 'Vehicle updated successfully!' : 'Vehicle added successfully!'
      });

      return true;
    } catch (error) {
      console.error('Error after saving truck:', error);
      setOperationMessage({
        type: 'error',
        text: 'Failed to save vehicle. Please try again.'
      });
      return false;
    }
  };

  // Handle deleting a truck
  const handleDeleteClick = (truck) => {
    setTruckToDelete(truck);
    setDeleteModalOpen(true);
  };

  // Confirm truck deletion
  const confirmDelete = async () => {
    if (!truckToDelete) return;

    try {
      setIsDeleting(true);
      await deleteTruck(truckToDelete.id);

      setTrucks(prev => prev.filter(t => t.id !== truckToDelete.id));
      setDeleteModalOpen(false);
      setTruckToDelete(null);

      setOperationMessage({
        type: 'success',
        text: 'Vehicle deleted successfully!'
      });
    } catch (error) {
      console.error('Error deleting truck:', error);
      setOperationMessage({
        type: 'error',
        text: 'Failed to delete vehicle. Please try again.'
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Reset all filters
  const resetFilters = () => {
    setFilters({
      status: 'all',
      year: 'all',
      search: '',
    });
  };

  // Check if filters are active
  const hasActiveFilters = filters.status !== 'all' || filters.year !== 'all' || filters.search !== '';

  // Format dates for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return formatDateForDisplayMMDDYYYY(dateString);
    } catch {
      return dateString || "N/A";
    }
  };

  // Get status colors with dark mode
  const getStatusColors = (status) => {
    switch (status) {
      case 'Active':
        return {
          bg: 'bg-green-100 dark:bg-green-900/40',
          text: 'text-green-800 dark:text-green-300',
          dot: 'bg-green-500'
        };
      case 'In Maintenance':
        return {
          bg: 'bg-yellow-100 dark:bg-yellow-900/40',
          text: 'text-yellow-800 dark:text-yellow-300',
          dot: 'bg-yellow-500'
        };
      case 'Out of Service':
        return {
          bg: 'bg-red-100 dark:bg-red-900/40',
          text: 'text-red-800 dark:text-red-300',
          dot: 'bg-red-500'
        };
      case 'Idle':
        return {
          bg: 'bg-blue-100 dark:bg-blue-900/40',
          text: 'text-blue-800 dark:text-blue-300',
          dot: 'bg-blue-500'
        };
      default:
        return {
          bg: 'bg-gray-100 dark:bg-gray-700',
          text: 'text-gray-800 dark:text-gray-300',
          dot: 'bg-gray-500'
        };
    }
  };

  // Export to CSV
  const exportToCSV = useCallback(() => {
    const headers = ['Name', 'Year', 'Make', 'Model', 'VIN', 'License Plate', 'Status', 'Added On'];
    const rows = filteredTrucks.map(truck => [
      truck.name || '',
      truck.year || '',
      truck.make || '',
      truck.model || '',
      truck.vin || '',
      truck.license_plate || '',
      truck.status || '',
      formatDate(truck.created_at)
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `vehicles_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);

    setOperationMessage({
      type: 'success',
      text: `Exported ${filteredTrucks.length} vehicles to CSV`
    });
  }, [filteredTrucks]);

  // Loading skeleton
  if (loading) {
    return (
      <DashboardLayout activePage="fleet">
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
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

  return (
    <DashboardLayout activePage="fleet">
      <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
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
                    <h1 className="text-3xl font-bold mb-1">Vehicle Management</h1>
                    <p className="text-blue-100">Add, edit and manage vehicles in your fleet</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                {(() => {
                  const truckLimit = checkResourceUpgrade('trucks', trucks.length);
                  if (truckLimit.needsUpgrade) {
                    return (
                      <Link
                        href="/dashboard/billing"
                        className="px-4 py-2 bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200 transition-colors shadow-sm flex items-center font-medium"
                      >
                        <Lock size={18} className="mr-2" />
                        Limit Reached ({trucks.length}/{truckLimit.limit})
                      </Link>
                    );
                  }
                  return (
                    <button
                      onClick={handleAddTruck}
                      className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors shadow-sm flex items-center font-medium"
                    >
                      <Plus size={18} className="mr-2" />
                      Add Vehicle
                    </button>
                  );
                })()}
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

          {/* Statistics Cards */}
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

          {/* Vehicle Limit Warning Banner */}
          {(() => {
            const truckLimit = checkResourceUpgrade('trucks', trucks.length);
            const limit = getResourceLimit('trucks');
            if (truckLimit.needsUpgrade) {
              return (
                <LimitReachedPrompt
                  limitName="trucks"
                  currentCount={trucks.length}
                  limit={limit}
                  nextTier={truckLimit.nextTier}
                  resourceName="Vehicles"
                  className="mb-6"
                />
              );
            }
            if (limit !== Infinity && trucks.length >= limit - 1 && trucks.length > 0) {
              return (
                <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Lock size={20} className="text-amber-600 dark:text-amber-400" />
                    <p className="text-amber-800 dark:text-amber-200 text-sm">
                      <span className="font-medium">Approaching limit:</span> You have {trucks.length} of {limit} vehicles.
                      <Link href="/dashboard/billing" className="ml-2 underline hover:no-underline">
                        Upgrade for more vehicles
                      </Link>
                    </p>
                  </div>
                </div>
              );
            }
            return null;
          })()}

          {/* Out of Service Alert */}
          {stats.outOfService > 0 && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex">
                <AlertTriangle className="h-5 w-5 text-red-500 dark:text-red-400 mr-3 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">Vehicle Status Alert</p>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    {stats.outOfService} vehicle{stats.outOfService !== 1 ? 's are' : ' is'} currently out of service. Please schedule maintenance or repairs.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Main Table Container */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
            {/* Inline Filter Bar */}
            <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-center">
                  <Truck size={18} className="mr-2 text-blue-600 dark:text-blue-400" />
                  <h3 className="font-medium text-gray-700 dark:text-gray-200">
                    Vehicles List
                  </h3>
                  <span className="ml-3 text-sm text-gray-500 dark:text-gray-400">
                    {filteredTrucks.length} of {trucks.length} vehicles
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  {/* Search */}
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={filters.search}
                      onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                      placeholder="Search vehicles..."
                      className="pl-9 pr-3 py-2 w-full sm:w-56 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Status Filter */}
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="In Maintenance">In Maintenance</option>
                    <option value="Out of Service">Out of Service</option>
                    <option value="Idle">Idle</option>
                  </select>

                  {/* Year Filter */}
                  <select
                    value={filters.year}
                    onChange={(e) => setFilters(prev => ({ ...prev, year: e.target.value }))}
                    className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Years</option>
                    {availableYears.map(year => (
                      <option key={year} value={year}>{year}</option>
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
            {filteredTrucks.length === 0 ? (
              <div className="p-12 text-center">
                {trucks.length === 0 ? (
                  <div className="max-w-sm mx-auto">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Truck size={32} className="text-gray-400 dark:text-gray-500" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                      No vehicles yet
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">
                      Get started by adding your first vehicle to your fleet.
                    </p>
                    {(() => {
                      const truckLimit = checkResourceUpgrade('trucks', trucks.length);
                      if (truckLimit.needsUpgrade) {
                        return (
                          <Link
                            href="/dashboard/billing"
                            className="inline-flex items-center px-4 py-2 bg-amber-100 text-amber-800 rounded-lg font-medium hover:bg-amber-200 transition-colors"
                          >
                            <Lock size={18} className="mr-2" />
                            Upgrade to Add Vehicles
                          </Link>
                        );
                      }
                      return (
                        <button
                          onClick={handleAddTruck}
                          className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                        >
                          <Plus size={18} className="mr-2" />
                          Add Vehicle
                        </button>
                      );
                    })()}
                  </div>
                ) : (
                  <div>
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search size={32} className="text-gray-400 dark:text-gray-500" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                      No matching vehicles
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
                <div className="hidden md:block">
                  <table className="w-full table-fixed">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                      <tr>
                        <th className="w-[18%] px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                          Vehicle
                        </th>
                        <th className="w-[20%] px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                          Year/Make/Model
                        </th>
                        <th className="w-[12%] px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                          License
                        </th>
                        <th className="w-[14%] px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                          VIN
                        </th>
                        <th className="w-[14%] px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="w-[10%] px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                          Added
                        </th>
                        <th className="w-[12%] px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {paginatedData.map(truck => {
                        const statusColors = getStatusColors(truck.status);
                        return (
                          <tr key={truck.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                            <td className="px-4 py-4">
                              <Link
                                href={`/dashboard/fleet/trucks/${truck.id}`}
                                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium truncate block"
                              >
                                {truck.name}
                              </Link>
                            </td>
                            <td className="px-4 py-4">
                              <span className="text-gray-900 dark:text-gray-100 truncate block">
                                {truck.year} {truck.make} {truck.model}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <span className="text-gray-700 dark:text-gray-300 truncate block">
                                {truck.license_plate || 'N/A'}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <span className="text-gray-700 dark:text-gray-300 font-mono text-sm truncate block">
                                {truck.vin ? `...${truck.vin.slice(-6)}` : 'N/A'}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusColors.bg} ${statusColors.text}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${statusColors.dot} mr-1.5`}></span>
                                {truck.status}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm">
                                <Calendar size={14} className="mr-1.5 flex-shrink-0" />
                                <span className="truncate">{formatDate(truck.created_at)}</span>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex justify-center items-center space-x-1">
                                <button
                                  onClick={() => handleEditTruck(truck)}
                                  className="p-1.5 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-md transition-colors"
                                  title="Edit Vehicle"
                                >
                                  <Edit size={16} />
                                </button>
                                <button
                                  onClick={() => handleDeleteClick(truck)}
                                  className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors"
                                  title="Delete Vehicle"
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
                  {paginatedData.map(truck => {
                    const statusColors = getStatusColors(truck.status);
                    return (
                      <div key={truck.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <Link
                              href={`/dashboard/fleet/trucks/${truck.id}`}
                              className="text-blue-600 dark:text-blue-400 font-medium hover:text-blue-800 dark:hover:text-blue-300 block truncate"
                            >
                              {truck.name}
                            </Link>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {truck.year} {truck.make} {truck.model}
                            </p>
                          </div>
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusColors.bg} ${statusColors.text} ml-2 flex-shrink-0`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusColors.dot} mr-1.5`}></span>
                            {truck.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">License:</span>
                            <span className="ml-1 text-gray-900 dark:text-gray-100">{truck.license_plate || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">VIN:</span>
                            <span className="ml-1 text-gray-900 dark:text-gray-100 font-mono">
                              {truck.vin ? `...${truck.vin.slice(-6)}` : 'N/A'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                            <Calendar size={12} className="mr-1" />
                            Added {formatDate(truck.created_at)}
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleEditTruck(truck)}
                              className="p-2 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-lg transition-colors"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(truck)}
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
            {filteredTrucks.length > 0 && (
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
                <FileText size={20} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-2">
                  Vehicle Management Tips
                </h3>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2 mt-1.5 flex-shrink-0"></span>
                    Keep vehicle records updated for accurate IFTA reporting and compliance tracking.
                  </li>
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2 mt-1.5 flex-shrink-0"></span>
                    Schedule regular maintenance to prevent unexpected breakdowns.
                  </li>
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2 mt-1.5 flex-shrink-0"></span>
                    Track service history to identify recurring issues and predict maintenance needs.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <TruckFormModal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        truck={truckToEdit}
        userId={user?.id}
        onSubmit={handleTruckSubmit}
      />

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setTruckToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Delete Vehicle"
        message={`Are you sure you want to delete "${truckToDelete?.name}"? This action cannot be undone.`}
        isDeleting={isDeleting}
      />
    </DashboardLayout>
  );
}
