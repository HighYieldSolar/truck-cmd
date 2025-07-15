// src/components/dashboard/DispatchingPage.js
"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { fetchCustomers } from "@/lib/services/customerService";
import useDatabaseSync from "@/hooks/useDatabaseSync";
import {
  Plus,
  Search,
  MapPin,
  Calendar,
  Clock,
  ArrowRight,
  Truck,
  FileText,
  Wallet,
  CheckCircle as CheckCircleIcon,
  Edit,
  Trash2,
  RefreshCw,
  AlertCircle,
  Package as PackageIcon,
  DollarSign,
  Filter
} from "lucide-react";

// Import your components
import StatusBadge from "@/components/dispatching/StatusBadge";
import LoadCard from "@/components/dispatching/LoadCard";
import FilterBar from "@/components/dispatching/FilterBar";
import LoadDetailModal from "@/components/dispatching/LoadDetailModal";
import NewLoadModal from "@/components/dispatching/NewLoadModal";
import DeleteLoadModal from "@/components/dispatching/DeleteLoadModal";
import StatCard from "@/components/common/StatCard";

// Fetch drivers from the database
const fetchDrivers = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .eq('user_id', userId);
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching drivers:', error);
    return [];
  }
};

// Fetch trucks from the database
const fetchTrucks = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('user_id', userId);
      
    if (error || !data || data.length === 0) {
      const { data: trucksData, error: trucksError } = await supabase
        .from('trucks')
        .select('*')
        .eq('user_id', userId);
        
      if (trucksError) throw trucksError;
      return trucksData || [];
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching trucks:', error);
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
      query = query.or(`load_number.ilike.%${filters.search}%,customer.ilike.%${filters.search}%,driver.ilike.%${filters.search}%`);
    }
    
    // Apply date filter
    if (filters.dateRange && filters.dateRange !== 'all') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // This week calculation
      const thisWeekStart = new Date(today);
      thisWeekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
      const thisWeekEnd = new Date(thisWeekStart);
      thisWeekEnd.setDate(thisWeekStart.getDate() + 6); // End of week (Saturday)
      
      // Last week calculation
      const lastWeekStart = new Date(thisWeekStart);
      lastWeekStart.setDate(lastWeekStart.getDate() - 7);
      const lastWeekEnd = new Date(thisWeekStart);
      lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);
      
      // This month calculation
      const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const thisMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      
      // Last month calculation
      const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
      
      // Quarter calculations
      const thisQuarterStart = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1);
      const thisQuarterEnd = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3 + 3, 0);
      
      const lastQuarterStart = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3 - 3, 1);
      const lastQuarterEnd = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 0);
      
      // Use pickup_date for filtering only when sorting by pickup date, otherwise use delivery_date
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
      }
    }

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
  } catch (error) {
    console.error("Error fetching loads:", error);
    return [];
  }
};

// Calculate load statistics
const calculateLoadStats = (loads) => {
  const activeLoads = loads.filter(l => !['Completed', 'Cancelled'].includes(l.status)).length;
  const pendingLoads = loads.filter(l => l.status === 'Pending').length;
  const inTransitLoads = loads.filter(l => l.status === 'In Transit').length;
  const completedLoads = loads.filter(l => l.status === 'Completed').length;
  
  return {
    activeLoads,
    pendingLoads,
    inTransitLoads,
    completedLoads
  };
};

// Main Dispatching Dashboard Component
export default function DispatchingPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  
  // State for the loads
  const [loads, setLoads] = useState([]);
  const [totalLoads, setTotalLoads] = useState(0);
  const [loadStats, setLoadStats] = useState({
    activeLoads: 0,
    pendingLoads: 0,
    inTransitLoads: 0,
    completedLoads: 0
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
    sortBy: "deliveryDate"
  });
  
  // State for modals
  const [selectedLoad, setSelectedLoad] = useState(null);
  const [showNewLoadModal, setShowNewLoadModal] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [loadToDelete, setLoadToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Error handling state
  const [error, setError] = useState(null);

  const loadLoadsData = useCallback(async (userId) => {
    if (!userId) return;
    try {
      setDataLoading(true);
      const loadData = await fetchLoads(userId, filters);
      setLoads(loadData);
      setTotalLoads(loadData.length);
      setLoadStats(calculateLoadStats(loadData));
    } catch (error) {
      console.error('Error loading loads:', error);
      setError('Failed to load loads data. Please try refreshing the page.');
    } finally {
      setDataLoading(false);
    }
  }, [filters]);

  // Database sync hook (still used for auto-refresh functionality)
  useDatabaseSync({
    autoRefresh: true, 
    refreshInterval: 5 * 60 * 1000,
    onRefresh: async () => {
      if (user) {
        await loadLoadsData(user.id);
      }
    }
  });

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
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load data. Please try refreshing the page.');
        setLoading(false);
      }
    }

    fetchData();
  }, [loadLoadsData]);
  
  useEffect(() => {
    if (user) {
      loadLoadsData(user.id);
    }
  }, [user, loadLoadsData]);

  // Handle selecting a load to view details
  const handleSelectLoad = (load) => {
    setSelectedLoad(load);
  };

  // Handle closing the load detail modal
  const handleCloseModal = () => {
    setSelectedLoad(null);
  };

  // Handle status change for a load
  const handleStatusChange = async (updatedLoad) => {
    try {
      const updatedLoads = loads.map(load => {
        if (load.id === updatedLoad.id) {
          return updatedLoad;
        }
        return load;
      });
      
      setLoads(updatedLoads);
      setSelectedLoad(updatedLoad);
      setLoadStats(calculateLoadStats(updatedLoads));
    } catch (error) {
      console.error('Error updating load status:', error);
      alert('Failed to update load status. Please try again.');
    }
  };

  // Handle assigning a driver to a load
  const handleAssignDriver = async (loadId, driverName, driverId) => {
    try {
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
    } catch (error) {
      console.error('Error assigning driver:', error);
      alert('Failed to assign driver. Please try again.');
    }
  };

  // Handle assigning a truck to a load
  const handleAssignTruck = async (loadId, truckInfo, truckId) => {
    try {
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
    } catch (error) {
      console.error('Error assigning truck:', error);
      alert('Failed to assign truck. Please try again.');
    }
  };

  // Handle creating a new load
  const handleSaveNewLoad = (newLoad) => {
    const updatedLoads = [newLoad, ...loads];
    setLoads(updatedLoads);
    setTotalLoads(updatedLoads.length);
    setLoadStats(calculateLoadStats(updatedLoads));
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
      setTotalLoads(updatedLoads.length);
      setLoadStats(calculateLoadStats(updatedLoads));
      
      setDeleteModalOpen(false);
      setLoadToDelete(null);
      
    } catch (error) {
      console.error('Error deleting load:', error);
      alert('Failed to delete load. Please try again.');
    } finally {
      setIsDeleting(false);
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
    <DashboardLayout activePage="dispatching">
      <main className="flex-1 overflow-y-auto bg-gray-100">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {/* Header with gradient background - matching dashboard style */}
          <div className="mb-6">
            <div className="relative rounded-xl overflow-hidden shadow-sm">
              {/* Gradient background with overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-400"></div>
              
              {/* Content */}
              <div className="relative p-6 md:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div className="mb-4 sm:mb-0">
                    <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center">
                      <Truck size={28} className="mr-3" />
                      Load Management
                    </h1>
                    <p className="mt-1 text-blue-100">Create and manage your loads and dispatching</p>
                  </div>
                  <div className="flex space-x-3">
                    <button 
                      onClick={() => setShowNewLoadModal(true)}
                      className="inline-flex items-center px-4 py-2.5 bg-white text-blue-600 rounded-lg hover:bg-blue-50 font-medium shadow-lg transition-all duration-200"
                    >
                      <Plus size={18} className="mr-2" />
                      Create Load
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Error message */}
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-xl">
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
          
          {/* Statistics Cards - updated styling */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard 
              title="Active Loads" 
              value={loadStats.activeLoads} 
              color="blue"
              icon={<Truck size={24} />}
            />
            <StatCard 
              title="Pending Loads" 
              value={loadStats.pendingLoads} 
              color="yellow" 
              icon={<Clock size={24} />}
            />
            <StatCard 
              title="In Transit" 
              value={loadStats.inTransitLoads} 
              color="purple" 
              icon={<MapPin size={24} />}
            />
            <StatCard 
              title="Completed" 
              value={loadStats.completedLoads} 
              color="green" 
              icon={<CheckCircleIcon size={24} />}
            />
          </div>
          
          {/* Enhanced Filter Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
            <FilterBar filters={filters} setFilters={setFilters} />
          </div>
          
          {/* Load List Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="mb-4 sm:mb-0">
                  <h2 className="text-lg font-semibold text-gray-900">Loads</h2>
                  <p className="mt-1 text-sm text-gray-500">{loads.length} total loads</p>
                </div>
                {filters.status !== "All" || filters.search || filters.dateRange !== "all" ? (
                  <button 
                    onClick={() => setFilters({search: "", status: "All", dateRange: "all", sortBy: "deliveryDate"})}
                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
                  >
                    <RefreshCw size={14} className="mr-1" />
                    Clear Filters
                  </button>
                ) : null}
              </div>
            </div>
            
            {/* Content */}
            <div className="p-6">
              {dataLoading ? (
                <div className="flex items-center justify-center h-64">
                  <RefreshCw size={32} className="animate-spin text-blue-500" />
                </div>
              ) : loads.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <PackageIcon size={32} className="text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No loads found</h3>
                  <p className="text-gray-500 mb-6">
                    {filters.status !== "All" || filters.search || filters.dateRange !== "all" 
                      ? "Try adjusting your filters or search criteria."
                      : "Get started by creating your first load."}
                  </p>
                  <button 
                    onClick={() => setShowNewLoadModal(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus size={16} className="mr-2" />
                    Create Load
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {loads.map(load => (
                    <LoadCard
                      key={load.id}
                      load={load}
                      onSelect={handleSelectLoad}
                      onDelete={handleDeleteLoad}
                    />
                  ))}
                </div>
              )}
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
          drivers={drivers}
          trucks={trucks}
          onAssignDriver={handleAssignDriver}
          onAssignTruck={handleAssignTruck}
        />
      )}

      {showNewLoadModal && (
        <NewLoadModal
          onClose={() => setShowNewLoadModal(false)}
          onSave={handleSaveNewLoad}
          customers={customers}
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
    </DashboardLayout>
  );
}