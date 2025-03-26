"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import {
  Calculator,
  FileDown,
  Plus,
  Trash2,
  AlertTriangle,
  Info,
  Download,
  Truck,
  Calendar,
  MapPin,
  Fuel,
  DollarSign,
  Clock,
  Database,
  RefreshCw,
  Link as LinkIcon,
  ArrowRight,
  CheckCircle
} from "lucide-react";
import Link from "next/link";

// Import utilities
import { runDatabaseDiagnostics } from "@/lib/utils/databaseCheck";

// Import custom components - add dynamic imports if needed
import EnhancedTripEntryForm from "@/components/ifta/EnhancedTripEntryForm";
import TripsList from "@/components/ifta/TripsList";
import IFTASummary from "@/components/ifta/IFTASummary";
import QuarterSelector from "@/components/ifta/QuarterSelector";
import DeleteConfirmationModal from "@/components/common/DeleteConfirmationModal";
import ReportGenerator from "@/components/ifta/ReportGenerator";
import EnhancedExportModal from "@/components/ifta/EnhancedExportModal";

// Dynamic imports to fix potential loading issues
import dynamic from 'next/dynamic';

// Dynamically import the DashboardLayout component to ensure it's fully loaded
const DashboardLayout = dynamic(
  () => import('@/components/layout/DashboardLayout').then(mod => mod.default), 
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }
);

// Dynamically import the StateMileageImporter component
const StateMileageImporter = dynamic(
  () => import('@/components/ifta/StateMileageImporter').then(mod => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="p-4 bg-white shadow rounded-lg mb-6">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }
);

// Dynamically import the LoadToIFTAImporter component
const LoadToIFTAImporter = dynamic(() => import('@/components/ifta/LoadToIFTAImporter'), {
  ssr: false,
  loading: () => (
    <div className="p-4 bg-white shadow rounded-lg mb-6">
      <div className="animate-pulse flex space-x-4">
        <div className="flex-1 space-y-4 py-1">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    </div>
  )
});

// Dynamically import the IFTAFuelSync component
const IFTAFuelSync = dynamic(() => import('@/components/ifta/IFTAFuelSync'), {
  ssr: false,
  loading: () => (
    <div className="p-4 bg-white shadow rounded-lg mb-6">
      <div className="animate-pulse flex space-x-4">
        <div className="flex-1 space-y-4 py-1">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    </div>
  )
});

// Dynamically import the EnhancedIFTASummary component
const EnhancedIFTASummary = dynamic(() => import('@/components/ifta/EnhancedIFTASummary'), {
  ssr: false,
  loading: () => (
    <div className="p-4 bg-white shadow rounded-lg mb-6">
      <div className="animate-pulse flex space-x-4">
        <div className="flex-1 space-y-4 py-1">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    </div>
  )
});

// Import services
import { fetchFuelEntries } from "@/lib/services/fuelService";
import { saveIFTAReport } from "@/lib/services/iftaService";
import { getLoadToIftaStats } from "@/lib/services/loadIftaService";
import { getMileageToIftaStats } from "@/lib/services/iftaMileageService";

export default function IFTACalculatorPage() {
  const router = useRouter();
  const isFirstRender = useRef(true);
  const dataLoadingRef = useRef(false);
  
  // Component state
  const [user, setUser] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [activeQuarter, setActiveQuarter] = useState("");
  const [trips, setTrips] = useState([]);
  const [fuelData, setFuelData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [tripToDelete, setTripToDelete] = useState(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [error, setError] = useState(null);
  const [databaseError, setDatabaseError] = useState(null);
  const [stats, setStats] = useState({
    totalMiles: 0,
    totalGallons: 0,
    avgMpg: 0,
    fuelCostPerMile: 0,
    uniqueJurisdictions: 0,
    userId: null
  });

  // State for fuel integration
  const [syncResult, setSyncResult] = useState(null);
  const [useEnhancedSummary, setUseEnhancedSummary] = useState(true);
  const [diagnosisMode, setDiagnosisMode] = useState(false);
  const [diagnosisResults, setDiagnosisResults] = useState(null);
  
  // Consolidated data loading state
  const [dataLoaded, setDataLoaded] = useState(false);
  
  // State for load integration
  const [loadImportStats, setLoadImportStats] = useState(null);
  const [showLoadImporter, setShowLoadImporter] = useState(false);
  
  // State for mileage integration
  const [mileageImportStats, setMileageImportStats] = useState(null);
  const [showMileageImporter, setShowMileageImporter] = useState(true);
  const [showImportedTrips, setShowImportedTrips] = useState(false);

  // Run database diagnostics
  const runDiagnostics = async () => {
    setDiagnosisMode(true);
    
    try {
      const results = await runDatabaseDiagnostics();
      setDiagnosisResults(results);
      
      if (!results.success) {
        setDatabaseError(results.issues.join('. '));
      }
    } catch (error) {
      console.error("Error running diagnostics:", error);
      setDiagnosisResults({
        success: false,
        issues: [error.message || "Unknown error running diagnostics"]
      });
    }
  };

  // Calculate stats with useCallback
  const calculateStats = useCallback((tripsData, fuelEntries) => {
    if (!tripsData || tripsData.length === 0) {
      setStats({
        totalMiles: 0,
        totalGallons: 0,
        avgMpg: 0,
        fuelCostPerMile: 0,
        uniqueJurisdictions: 0,
        userId: user?.id
      });
      return;
    }

    // Calculate total miles from trips, using odometer readings if available
    let totalMiles = 0;
    tripsData.forEach(trip => {
      if (trip.starting_odometer && trip.ending_odometer && trip.ending_odometer > trip.starting_odometer) {
        totalMiles += (trip.ending_odometer - trip.starting_odometer);
      } else {
        totalMiles += parseFloat(trip.total_miles || 0);
      }
    });
    
    // Get fuel data for the same period
    const totalGallons = fuelEntries.reduce((sum, entry) => sum + parseFloat(entry.gallons || 0), 0);
    const totalFuelCost = fuelEntries.reduce((sum, entry) => sum + parseFloat(entry.total_amount || 0), 0);
    
    // Calculate averages
    const avgMpg = totalGallons > 0 ? (totalMiles / totalGallons) : 0;
    const fuelCostPerMile = totalMiles > 0 ? (totalFuelCost / totalMiles) : 0;
    
    // Count unique jurisdictions
    const uniqueJurisdictions = new Set();
    tripsData.forEach(trip => {
      if (trip.start_jurisdiction) uniqueJurisdictions.add(trip.start_jurisdiction);
      if (trip.end_jurisdiction) uniqueJurisdictions.add(trip.end_jurisdiction);
    });
    
    setStats({
      totalMiles,
      totalGallons,
      avgMpg,
      fuelCostPerMile,
      uniqueJurisdictions: uniqueJurisdictions.size,
      userId: user?.id
    });
  }, [user?.id]);

  // Load fuel data from fuel tracker
  const loadFuelData = useCallback(async () => {
    if (!user?.id || !activeQuarter || dataLoadingRef.current) return null;
    
    try {
      // Parse the quarter into dateRange filter
      const [year, quarter] = activeQuarter.split('-Q');
      const quarterStartMonth = (parseInt(quarter) - 1) * 3;
      const startDate = new Date(parseInt(year), quarterStartMonth, 1);
      const endDate = new Date(parseInt(year), quarterStartMonth + 3, 0);
      
      const filters = {
        dateRange: 'Custom',
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      };
      
      const fuelEntries = await fetchFuelEntries(user.id, filters);
      if (fuelEntries) {
        setFuelData(fuelEntries);
        return fuelEntries;
      }
      return [];
    } catch (error) {
      console.error('Error loading fuel data:', error);
      setError('Failed to load fuel data. Your calculations may be incomplete.');
      return [];
    }
  }, [user?.id, activeQuarter]);

  // Load trips for the selected quarter
  const loadTrips = useCallback(async () => {
    if (!user?.id || !activeQuarter || dataLoadingRef.current) return;
    
    try {
      dataLoadingRef.current = true;
      
      const { data, error: tripsError } = await supabase
        .from('ifta_trip_records')
        .select('*')
        .eq('user_id', user.id)
        .eq('quarter', activeQuarter)
        .order('start_date', { ascending: false });
        
      if (tripsError) {
        if (tripsError.code === '42P01') { // PostgreSQL code for relation does not exist
          console.error("ifta_trip_records table doesn't exist:", tripsError);
          setDatabaseError("The IFTA trips database table doesn't exist. Please contact support to set up your database.");
          throw new Error("Database table 'ifta_trip_records' doesn't exist");
        } else {
          throw tripsError;
        }
      }
      
      setTrips(data || []);
      
      // Get the current fuel data or load it if needed
      const currentFuelData = fuelData.length > 0 ? fuelData : await loadFuelData();
      
      // Calculate summary statistics
      calculateStats(data || [], currentFuelData || []);
      
      // Get load import statistics
      try {
        const loadStats = await getLoadToIftaStats(user.id, activeQuarter);
        setLoadImportStats(loadStats);
        
        // Only show load importer if there are available loads
        setShowLoadImporter(loadStats.available > 0);
      } catch (err) {
        console.error("Error getting load import stats:", err);
        // Don't block the main functionality if this fails
      }
      
      // Get mileage import statistics
      try {
        const mileageStats = await getMileageToIftaStats(user.id, activeQuarter);
        setMileageImportStats(mileageStats);
        
        // Only show mileage importer if there are available trips or we're showing imported ones
        setShowMileageImporter(mileageStats.available > 0 || showImportedTrips);
      } catch (err) {
        console.error("Error getting mileage import stats:", err);
        // Don't block the main functionality if this fails
      }
      
      return data;
    } catch (error) {
      console.error('Error loading trips:', error);
      setError('Failed to load trip records. ' + error.message);
      return null;
    } finally {
      dataLoadingRef.current = false;
    }
  }, [user?.id, activeQuarter, fuelData, loadFuelData, calculateStats, showImportedTrips]);

  // Initialize data and check authentication
  useEffect(() => {
    async function initializeData() {
      if (!isFirstRender.current) return;
      isFirstRender.current = false;
      
      try {
        setInitialLoading(true);
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }
        
        if (!session) {
          router.push('/login');
          return;
        }
        
        setUser(session.user);
        
        // Set default active quarter
        const now = new Date();
        const quarter = Math.ceil((now.getMonth() + 1) / 3);
        setActiveQuarter(`${now.getFullYear()}-Q${quarter}`);
        
        setInitialLoading(false);
      } catch (err) {
        console.error('Error checking authentication:', err);
        setError('Authentication error. Please try logging in again.');
        setInitialLoading(false);
      }
    }
    
    initializeData();
  }, [router]);

  // Load data once when parameters are available
  useEffect(() => {
    if (user && activeQuarter && !initialLoading && !dataLoaded) {
      const loadAllData = async () => {
        if (dataLoadingRef.current) return;
        dataLoadingRef.current = true;
        
        try {
          setError(null);
          setDatabaseError(null);
          
          // Load fuel data first
          const fuelEntries = await loadFuelData();
          
          // Then load trips
          await loadTrips();
          
          // Mark data as loaded after successful fetch
          setDataLoaded(true);
        } catch (err) {
          console.error("Error loading data:", err);
          // Errors are already handled in the individual load functions
        } finally {
          dataLoadingRef.current = false;
        }
      };
      
      loadAllData();
    }
  }, [user, activeQuarter, initialLoading, dataLoaded, loadFuelData, loadTrips]);

  // Reset dataLoaded when quarter changes
  useEffect(() => {
    setDataLoaded(false);
  }, [activeQuarter]);

  // Handle sync result from the IFTA-Fuel Sync component
  const handleSyncComplete = (result) => {
    setSyncResult(result);
  };

  // Handle adding a new trip
  const handleAddTrip = async (tripData) => {
    try {
      setError(null);
      
      // Format data for insertion
      const newTrip = {
        user_id: user.id,
        quarter: activeQuarter,
        start_date: tripData.date,
        end_date: tripData.endDate || tripData.date,
        vehicle_id: tripData.vehicleId,
        driver_id: tripData.driverId || null,
        load_id: tripData.loadId || null,
        start_jurisdiction: tripData.startJurisdiction,
        end_jurisdiction: tripData.endJurisdiction,
        total_miles: parseFloat(tripData.miles),
        gallons: parseFloat(tripData.gallons || 0),
        fuel_cost: parseFloat(tripData.fuelCost || 0),
        starting_odometer: parseFloat(tripData.startOdometer || 0),
        ending_odometer: parseFloat(tripData.endOdometer || 0),
        notes: tripData.notes || "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { data, error: insertError } = await supabase
        .from('ifta_trip_records')
        .insert([newTrip])
        .select();
        
      if (insertError) {
        if (insertError.code === '42P01') { // PostgreSQL code for relation does not exist
          setDatabaseError("The IFTA trips database table doesn't exist. Please contact support.");
          throw new Error("Database table doesn't exist");
        } else {
          throw insertError;
        }
      }
      
      // Reload trips to update the list
      await loadTrips();
      
      return true;
    } catch (error) {
      console.error('Error adding trip:', error);
      setError('Failed to add trip: ' + (error.message || "Unknown error"));
      return false;
    }
  };

  // Handle deleting a trip
  const handleDeleteTrip = (trip) => {
    setTripToDelete(trip);
    setDeleteModalOpen(true);
  };

  // Confirm deletion of a trip
  const confirmDeleteTrip = async () => {
    if (!tripToDelete) return;
    
    try {
      setError(null);
      
      const { error: deleteError } = await supabase
        .from('ifta_trip_records')
        .delete()
        .eq('id', tripToDelete.id);
        
      if (deleteError) throw deleteError;
      
      // Reload trips to update the list
      await loadTrips();
      
      setDeleteModalOpen(false);
      setTripToDelete(null);
    } catch (error) {
      console.error('Error deleting trip:', error);
      setError('Failed to delete trip: ' + (error.message || "Unknown error"));
    }
  };

  // Handler for "Generate Report" button
  const handleGenerateReport = () => {
    if (!trips || trips.length === 0) {
      setError("No trip data available to generate a report. Please add trips first.");
      return;
    }
    
    // Open the report modal
    setReportModalOpen(true);
  };

  // Handler for "Export Data" button
  const handleExportData = () => {
    if (!trips || trips.length === 0) {
      setError("No trip data available to export. Please add trips first.");
      return;
    }
    
    // Open the enhanced export modal instead of directly exporting
    setExportModalOpen(true);
  };

  // Handle generating a report or saving report data
  const handleSaveReport = async (reportData) => {
    try {
      setError(null);
      
      const savedReport = await saveIFTAReport(user.id, reportData);
      
      return true;
    } catch (error) {
      console.error('Error saving report:', error);
      setError('Failed to save report: ' + (error.message || "Unknown error"));
      return false;
    }
  };
  
  // Handle imported trips
  const handleImportComplete = async () => {
    // Refresh the trips list to include the newly imported trips
    await loadTrips();
  };

  // Extract unique vehicles from trips and fuel data for the trip entry form
  const getUniqueVehicles = () => {
    const uniqueVehicles = new Set();
    
    // Add vehicles from trips
    trips.forEach(trip => {
      if (trip.vehicle_id) uniqueVehicles.add(trip.vehicle_id);
    });
    
    // Add vehicles from fuel data
    fuelData.forEach(entry => {
      if (entry.vehicle_id) uniqueVehicles.add(entry.vehicle_id);
    });
    
    return Array.from(uniqueVehicles);
  };
  
  const uniqueVehicles = getUniqueVehicles();
  
  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <DashboardLayout activePage="ifta calculator">
      {/* Fixed the scrolling issue by properly wrapping the content */}
      <div className="flex flex-col min-h-screen bg-gray-100">
        <main className="flex-1 p-4 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">IFTA Tax Calculator</h1>
                <p className="text-gray-600">Track and calculate your Interstate Fuel Tax Agreement (IFTA) data</p>
              </div>
              <div className="mt-4 md:mt-0 flex flex-wrap gap-3">
                <button
                  onClick={handleGenerateReport}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={trips.length === 0}
                >
                  <FileDown size={16} className="mr-2" />
                  Generate Report
                </button>
                <button
                  onClick={handleExportData}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={trips.length === 0}
                >
                  <Download size={16} className="mr-2" />
                  Export Data
                </button>
                <Link
                  href="/dashboard/mileage"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                >
                  <MapPin size={16} className="mr-2" />
                  State Mileage
                </Link>
              </div>
            </div>

            {/* Show database errors if present */}
            {databaseError && (
              <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Database className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-red-800">Database Configuration Error</h3>
                    <p className="text-sm text-red-700">{databaseError}</p>
                    <button
                      onClick={runDiagnostics}
                      className="mt-2 inline-flex items-center px-2 py-1 border border-red-300 text-xs font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none"
                    >
                      <Database size={12} className="mr-1" />
                      Run Database Diagnostics
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Show other errors if present */}
            {error && !databaseError && (
              <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Quarter Selector */}
            <div className="mb-6">
              <QuarterSelector 
                activeQuarter={activeQuarter} 
                setActiveQuarter={setActiveQuarter} 
                isLoading={loading} 
              />
            </div>

            {/* State Mileage Importer */}
            {!databaseError && showMileageImporter && (
              <div className="mb-6">
                <StateMileageImporter 
                  userId={user?.id} 
                  quarter={activeQuarter} 
                  onImportComplete={handleImportComplete}
                  showImportedTrips={showImportedTrips}
                />
              </div>
            )}

            {/* Load to IFTA Importer - Show only if we have available loads */}
            {!databaseError && showLoadImporter && (
              <div className="mb-6">
                <LoadToIFTAImporter 
                  userId={user?.id} 
                  quarter={activeQuarter} 
                  onImportComplete={handleImportComplete}
                  existingTrips={trips}
                />
              </div>
            )}

            {/* IFTA-Fuel Sync */}
            {!databaseError && (
              <div className="mb-6">
                <IFTAFuelSync 
                  userId={user?.id} 
                  quarter={activeQuarter} 
                  onSyncComplete={handleSyncComplete}
                />
              </div>
            )}

            {/* IFTA Summary */}
            {!databaseError && (
              <div className="mb-6">
                {useEnhancedSummary ? (
                  <EnhancedIFTASummary
                    userId={user?.id}
                    quarter={activeQuarter}
                    syncResult={syncResult}
                    isLoading={loading}
                  />
                ) : (
                  <IFTASummary 
                    trips={trips} 
                    stats={stats}
                    isLoading={loading} 
                  />
                )}
              </div>
            )}

            {/* Trip Entry Form */}
            <div className="mb-6">
              <EnhancedTripEntryForm 
                onAddTrip={handleAddTrip} 
                isLoading={loading}
                fuelData={fuelData}
                vehicles={uniqueVehicles}
              />
            </div>

            {/* Trips List */}
            <div className="mb-6">
              <TripsList 
                trips={trips} 
                onRemoveTrip={handleDeleteTrip} 
                isLoading={loading}
                showSourceBadges={true}
              />
            </div>
          </div>
        </main>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal 
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setTripToDelete(null);
        }}
        onConfirm={confirmDeleteTrip}
        title="Delete Trip"
        message="Are you sure you want to delete this trip? This action cannot be undone."
        itemName={tripToDelete ? `Trip from ${tripToDelete.start_jurisdiction} to ${tripToDelete.end_jurisdiction}` : ""}
        isDeleting={false}
      />

      {/* Report Generator Modal */}
      {reportModalOpen && (
        <ReportGenerator
          isOpen={reportModalOpen}
          onClose={() => setReportModalOpen(false)}
          trips={trips}
          stats={stats}
          quarter={activeQuarter}
          fuelData={fuelData}
          onSave={handleSaveReport}
        />
      )}

      {/* Enhanced Export Modal */}
      {exportModalOpen && (
        <EnhancedExportModal
          isOpen={exportModalOpen}
          onClose={() => setExportModalOpen(false)}
          trips={trips}
          quarter={activeQuarter}
          fuelData={fuelData}
          stats={stats}
        />
      )}
    </DashboardLayout>
  );
}