// src/components/dashboard/DispatchingPage.js
"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { fetchCustomers } from "@/lib/services/customerService";
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
    // Try to get drivers data
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .eq('user_id', userId);
      
    if (error) throw error;
    
    // Return the data, or an empty array if no data
    return data || [];
  } catch (error) {
    console.error('Error fetching drivers:', error);
    return [];
  }
};

// Fetch trucks from the database
const fetchTrucks = async (userId) => {
  try {
    // Try vehicles table first
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('user_id', userId);
      
    // If that fails, try trucks table
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
        // Active means any status that is not Completed or Cancelled
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
      
      const nextWeekEnd = new Date(today);
      nextWeekEnd.setDate(nextWeekEnd.getDate() + 7);
      
      const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      
      switch (filters.dateRange) {
        case 'today':
          query = query.eq('pickup_date', today.toISOString().split('T')[0]);
          break;
        case 'tomorrow':
          query = query.eq('pickup_date', tomorrow.toISOString().split('T')[0]);
          break;
        case 'thisWeek':
          query = query.gte('pickup_date', today.toISOString().split('T')[0])
                      .lte('pickup_date', nextWeekEnd.toISOString().split('T')[0]);
          break;
        case 'thisMonth':
          query = query.gte('pickup_date', today.toISOString().split('T')[0])
                      .lte('pickup_date', monthEnd.toISOString().split('T')[0]);
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
      // Default sort by creation date (newest first)
      query = query.order('created_at', { ascending: false });
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    // If no loads found yet, return empty array
    if (!data || data.length === 0) {
      return [];
    }
    
    // Map database schema to component-friendly format
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
  const [loadingLoads, setLoadingLoads] = useState(false);
  
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
    sortBy: "pickupDate"
  });
  
  // State for modals
  const [selectedLoad, setSelectedLoad] = useState(null);
  const [showNewLoadModal, setShowNewLoadModal] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [loadToDelete, setLoadToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Error handling state
  const [error, setError] = useState(null);

  // Define loadLoadsData BEFORE any useEffect that uses it
  const loadLoadsData = useCallback(async (userId) => {
    try {
      setLoadingLoads(true);
      const loadData = await fetchLoads(userId, filters);
      setLoads(loadData);
      setTotalLoads(loadData.length);
      setLoadStats(calculateLoadStats(loadData));
    } catch (error) {
      console.error('Error loading loads:', error);
      setError('Failed to load loads data. Please try refreshing the page.');
    } finally {
      setLoadingLoads(false);
    }
  }, [filters]); // Include filters as a dependency

  // Now use loadLoadsData in useEffect
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // Get user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
      
        if (userError) throw userError;
        
        if (!user) {
          // Redirect to login page if not authenticated
          window.location.href = '/login';
          return;
        }
        
        setUser(user);
        
        // Fetch all required data in parallel
        const [cusData, drvData, trkData] = await Promise.all([
          fetchCustomers(user.id),
          fetchDrivers(user.id),
          fetchTrucks(user.id)
        ]);
        
        setCustomers(cusData);
        setDrivers(drvData);
        setTrucks(trkData);
        
        // Now fetch loads (this might take longer so do it separately)
        await loadLoadsData(user.id);
      
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load data. Please try refreshing the page.');
        setLoading(false);
      }
    }

    fetchData();
  }, [loadLoadsData]); // Add loadLoadsData as a dependency
  
  // Effect to reload loads when filters change
  useEffect(() => {
    if (user) {
      loadLoadsData(user.id);
    }
  }, [user, loadLoadsData]); // Include loadLoadsData here

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
      // Update the load in the local state
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
      // Update the load in the local state
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
      
      // Update the selected load if it's open
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
      // Update the load in the local state
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
      
      // Update the selected load if it's open
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
      
      // Delete the load from the database
      const { error } = await supabase
        .from('loads')
        .delete()
        .eq('id', loadToDelete.id);
      
      if (error) throw error;
      
      // Update the UI by removing the deleted load
      const updatedLoads = loads.filter(load => load.id !== loadToDelete.id);
      setLoads(updatedLoads);
      setTotalLoads(updatedLoads.length);
      setLoadStats(calculateLoadStats(updatedLoads));
      
      // Close the modal
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
      {/* Main Content */}
      <div className="p-4 bg-gray-100">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Dispatching</h1>
              <p className="text-gray-600">Create and manage your loads and dispatching</p>
            </div>
            <div className="mt-4 md:mt-0 flex space-x-3">
              <button 
                onClick={() => setShowNewLoadModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus size={16} className="mr-2" />
                Create Load
              </button>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
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
          
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard 
              title="Active Loads" 
              value={loadStats.activeLoads} 
              color="blue" 
            />
            <StatCard 
              title="Pending Loads" 
              value={loadStats.pendingLoads} 
              color="yellow" 
            />
            <StatCard 
              title="In Transit" 
              value={loadStats.inTransitLoads} 
              color="purple" 
            />
            <StatCard 
              title="Completed" 
              value={loadStats.completedLoads} 
              color="green" 
            />
          </div>
          
          {/* Filter Bar */}
          <FilterBar filters={filters} setFilters={setFilters} />
          
          {/* Loads Grid */}
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">
              Loads ({loads.length})
            </h2>
            <div className="text-sm text-gray-500">
              {filters.status !== "All" || filters.search || filters.dateRange !== "all" ? (
                <button 
                  onClick={() => setFilters({search: "", status: "All", dateRange: "all", sortBy: "pickupDate"})}
                  className="inline-flex items-center text-blue-600 hover:text-blue-800"
                >
                  <RefreshCw size={12} className="mr-1" />
                  Clear Filters
                </button>
              ) : null}
            </div>
          </div>
          
          {/* Loads Grid */}
          {loadingLoads ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw size={32} className="animate-spin text-blue-500" />
            </div>
          ) : loads.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <div className="mx-auto w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <PackageIcon size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No loads found</h3>
              <p className="text-gray-500 mb-4">
                {filters.status !== "All" || filters.search || filters.dateRange !== "all" 
                  ? "Try adjusting your filters or search criteria."
                  : "Get started by creating your first load."}
              </p>
              <button 
                onClick={() => setShowNewLoadModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus size={16} className="mr-2" />
                Create Load
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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

      {/* Load Detail Modal */}
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

      {/* New Load Modal */}
      {showNewLoadModal && (
        <NewLoadModal
          onClose={() => setShowNewLoadModal(false)}
          onSave={handleSaveNewLoad}
          customers={customers}
        />
      )}

      {/* Delete Load Modal */}
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