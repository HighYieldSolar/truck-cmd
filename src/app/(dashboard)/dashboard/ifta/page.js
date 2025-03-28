// src/app/(dashboard)/dashboard/ifta/page.js
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  ArrowRight,
  CheckCircle
} from "lucide-react";

// Import components
import DashboardLayout from "@/components/layout/DashboardLayout";
import QuarterSelector from "@/components/ifta/QuarterSelector";
import DeleteConfirmationModal from "@/components/common/DeleteConfirmationModal";
import IFTAFuelToggle from "@/components/ifta/IFTAFuelToggle";
import StateMileageImporter from "@/components/ifta/StateMileageImporter";
import EnhancedIFTAFuelSync from "@/components/ifta/EnhancedIFTAFuelSync";

// Import simplified components for IFTA
import SimplifiedIFTASummary from "@/components/ifta/SimplifiedIFTASummary";
import SimplifiedExportModal from "@/components/ifta/SimplifiedExportModal";
import SimplifiedTripEntryForm from "@/components/ifta/SimplifiedTripEntryForm";
import SimplifiedTripsList from "@/components/ifta/SimplifiedTripsList";

// Import services
import { fetchFuelEntries } from "@/lib/services/fuelService";

// Loading placeholder component for conditional rendering
function LoadingPlaceholder() {
  return (
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
  );
}

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
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [error, setError] = useState(null);
  const [databaseError, setDatabaseError] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);
  const [debugMode, setDebugMode] = useState(false);
  
  // Data loading state
  const [dataLoaded, setDataLoaded] = useState(false);
  
  // State for mileage import
  const [showMileageImporter, setShowMileageImporter] = useState(true);

  // Load fuel data from fuel tracker
  const loadFuelData = useCallback(async () => {
    if (!user?.id || !activeQuarter || dataLoadingRef.current) return [];
    
    try {
      console.log("Loading fuel data for quarter:", activeQuarter);
      
      // Parse the quarter into dateRange filter
      const [year, quarter] = activeQuarter.split('-Q');
      const quarterStartMonth = (parseInt(quarter) - 1) * 3;
      const startDate = new Date(parseInt(year), quarterStartMonth, 1);
      const endDate = new Date(parseInt(year), quarterStartMonth + 3, 0);
      
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      console.log(`Fuel date range: ${startDateStr} to ${endDateStr}`);
      
      const filters = {
        dateRange: 'Custom',
        startDate: startDateStr,
        endDate: endDateStr
      };
      
      // Use the fetchFuelEntries service function
      const fuelEntries = await fetchFuelEntries(user.id, filters);
      
      if (fuelEntries && Array.isArray(fuelEntries)) {
        console.log("Loaded fuel entries:", fuelEntries.length);
        // Process fuel entries into the format expected by IFTA calculations
        const processedEntries = fuelEntries.map(entry => ({
          ...entry,
          state: entry.state || 'Unknown',
          gallons: parseFloat(entry.gallons) || 0
        }));
        
        setFuelData(processedEntries);
        return processedEntries;
      } else {
        console.warn("No fuel entries returned or invalid format");
        setFuelData([]);
        return [];
      }
    } catch (error) {
      console.error('Error loading fuel data:', error);
      setError('Failed to load fuel data. Your calculations may be incomplete.');
      setFuelData([]);
      return [];
    }
  }, [user?.id, activeQuarter]);

  // Load trips for the selected quarter
  const loadTrips = useCallback(async () => {
    if (!user?.id || !activeQuarter || dataLoadingRef.current) return [];
    
    try {
      dataLoadingRef.current = true;
      console.log("Loading trips for user", user.id, "and quarter", activeQuarter);
      
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
      
      console.log("Loaded trips:", data?.length || 0);
      setTrips(data || []);
      
      // Get the current fuel data or load it if needed
      const currentFuelData = fuelData.length > 0 ? fuelData : await loadFuelData();
      
      return data || [];
    } catch (error) {
      console.error('Error loading trips:', error);
      setError('Failed to load trip records. ' + error.message);
      return [];
    } finally {
      dataLoadingRef.current = false;
    }
  }, [user?.id, activeQuarter, fuelData, loadFuelData]);

  // Calculate stats based on trips and fuel data
  const calculateStats = useCallback((tripsData, fuelEntries) => {
    // This is a simplified stats calculation that just focuses on
    // total miles, total gallons, and jurisdictions
    
    if (!tripsData || tripsData.length === 0) {
      return {
        totalMiles: 0,
        totalGallons: 0,
        avgMpg: 0,
        uniqueJurisdictions: 0,
        userId: user?.id
      };
    }

    // Calculate total miles from trips
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
    
    // Calculate average MPG
    const avgMpg = totalGallons > 0 ? (totalMiles / totalGallons) : 0;
    
    // Count unique jurisdictions
    const uniqueJurisdictions = new Set();
    tripsData.forEach(trip => {
      if (trip.start_jurisdiction) uniqueJurisdictions.add(trip.start_jurisdiction);
      if (trip.end_jurisdiction) uniqueJurisdictions.add(trip.end_jurisdiction);
    });
    
    return {
      totalMiles,
      totalGallons,
      avgMpg,
      uniqueJurisdictions: uniqueJurisdictions.size,
      userId: user?.id
    };
  }, [user?.id]);

  // Initialize data and check authentication
  useEffect(() => {
    async function initializeData() {
      if (!isFirstRender.current) return;
      isFirstRender.current = false;
      
      try {
        setInitialLoading(true);
        
        // Try to load last selected quarter from local storage
        const savedQuarter = localStorage.getItem('ifta-selected-quarter');
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }
        
        if (!session) {
          router.push('/login');
          return;
        }
        
        setUser(session.user);
        
        // Set quarter (from saved or default)
        if (savedQuarter) {
          setActiveQuarter(savedQuarter);
        } else {
          // Set default active quarter
          const now = new Date();
          const quarter = Math.ceil((now.getMonth() + 1) / 3);
          setActiveQuarter(`${now.getFullYear()}-Q${quarter}`);
        }
        
        setInitialLoading(false);
      } catch (err) {
        console.error('Error checking authentication:', err);
        setError('Authentication error. Please try logging in again.');
        setInitialLoading(false);
      }
    }
    
    initializeData();
  }, [router]);

  // Save active quarter to local storage when it changes
  useEffect(() => {
    if (activeQuarter) {
      localStorage.setItem('ifta-selected-quarter', activeQuarter);
    }
  }, [activeQuarter]);

  // Load data once when parameters are available
  useEffect(() => {
    if (user && activeQuarter && !initialLoading && !dataLoaded) {
      const loadAllData = async () => {
        if (dataLoadingRef.current) return;
        dataLoadingRef.current = true;
        
        try {
          setError(null);
          setDatabaseError(null);
          setLoading(true);
          
          console.log("Loading data for quarter:", activeQuarter);
          
          // Load fuel data first
          const fuelEntries = await loadFuelData();
          console.log("Loaded fuel entries:", fuelEntries?.length || 0);
          
          // Then load trips - explicitly passing activeQuarter to ensure latest value is used
          const tripsData = await loadTrips();
          console.log("Loaded trips:", tripsData?.length || 0);
          
          // Update trips state directly here as backup
          if (tripsData) {
            setTrips(tripsData);
          }
          
          // Mark data as loaded after successful fetch
          setDataLoaded(true);
        } catch (err) {
          console.error("Error loading data:", err);
          // Errors are already handled in the individual load functions
        } finally {
          dataLoadingRef.current = false;
          setLoading(false);
        }
      };
      
      loadAllData();
    }
  }, [user, activeQuarter, initialLoading, dataLoaded, loadFuelData, loadTrips]);

  // Reset dataLoaded when quarter changes
  useEffect(() => {
    setDataLoaded(false);
  }, [activeQuarter]);

  // Force sync fuel data with IFTA
  const forceFuelSync = useCallback(async () => {
    try {
      setLoading(true);
      // Load fresh fuel data
      const freshFuelData = await loadFuelData();
      // Load fresh trips
      await loadTrips();
      // Update stats with fresh data
      setStatusMessage({
        type: 'success',
        text: 'Fuel data synced successfully!'
      });
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (error) {
      console.error("Error syncing fuel data:", error);
      setError("Failed to sync fuel data: " + error.message);
    } finally {
      setLoading(false);
    }
  }, [loadFuelData, loadTrips]);

  // Handle sync completion from IFTA Fuel Sync component
  const handleSyncComplete = (results) => {
    console.log("Sync completed successfully:", results);
    // Update UI based on results
    if (!results.isBalanced) {
      setStatusMessage({
        type: 'warning',
        text: `Found ${results.discrepancies.length} discrepancies between fuel and IFTA data`
      });
    } else {
      setStatusMessage({
        type: 'success',
        text: 'Fuel and IFTA data are in sync!'
      });
    }
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Handle adding a new trip
  const handleAddTrip = async (tripData) => {
    try {
      setLoading(true);
      setError(null);
      
      // Format data for insertion
      const newTrip = {
        user_id: user.id,
        quarter: activeQuarter,
        start_date: tripData.date,
        end_date: tripData.date, // Simplified to use same date for start/end
        vehicle_id: tripData.vehicleId,
        driver_id: tripData.driverId || null,
        start_jurisdiction: tripData.startJurisdiction,
        end_jurisdiction: tripData.endJurisdiction,
        total_miles: parseFloat(tripData.miles),
        gallons: parseFloat(tripData.gallons || 0),
        fuel_cost: parseFloat(tripData.fuelCost || 0),
        notes: tripData.notes || "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { data, error: insertError } = await supabase
        .from('ifta_trip_records')
        .insert([newTrip])
        .select();
        
      if (insertError) {
        if (insertError.code === '42P01') {
          setDatabaseError("The IFTA trips database table doesn't exist. Please contact support.");
          throw new Error("Database table doesn't exist");
        } else {
          throw insertError;
        }
      }
      
      // Show success message
      setStatusMessage({
        type: 'success',
        text: 'Trip added successfully!'
      });
      
      // Clear status message after 3 seconds
      setTimeout(() => setStatusMessage(null), 3000);
      
      // Reload trips to update the list
      await loadTrips();
      
      return true;
    } catch (error) {
      console.error('Error adding trip:', error);
      setError('Failed to add trip: ' + (error.message || "Unknown error"));
      return false;
    } finally {
      setLoading(false);
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
      setLoading(true);
      setError(null);
      
      const { error: deleteError } = await supabase
        .from('ifta_trip_records')
        .delete()
        .eq('id', tripToDelete.id);
        
      if (deleteError) throw deleteError;
      
      // Show success message
      setStatusMessage({
        type: 'success',
        text: 'Trip deleted successfully!'
      });
      
      // Clear status message after 3 seconds
      setTimeout(() => setStatusMessage(null), 3000);
      
      // Reload trips to update the list
      await loadTrips();
      
      setDeleteModalOpen(false);
      setTripToDelete(null);
    } catch (error) {
      console.error('Error deleting trip:', error);
      setError('Failed to delete trip: ' + (error.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  // Handler for exporting data
  const handleExportData = () => {
    if (!trips || trips.length === 0) {
      setError("No trip data available to export. Please add trips first.");
      return;
    }
    
    // Open the export modal
    setExportModalOpen(true);
  };

  // Handle trips import completion
  const handleImportComplete = async () => {
    try {
      console.log("Import completed, reloading trips...");
      setLoading(true);
      await loadTrips();
      console.log("Trips reloaded successfully after import");
      
      // Show success message
      setStatusMessage({
        type: 'success',
        text: 'Trips imported successfully!'
      });
      
      // Clear status message after 3 seconds
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
      console.error("Error reloading trips after import:", err);
      setError("Failed to refresh trips after import: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Calculate current stats based on trips and fuel data
  const currentStats = calculateStats(trips, fuelData);

  // Extract unique vehicles from trips and fuel data
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
    <DashboardLayout activePage="ifta">
      <div className="flex flex-col min-h-screen bg-gray-100">
        <main className="flex-1 p-4 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">IFTA Mileage &amp; Fuel Tracker</h1>
                <p className="text-gray-600">Track mileage and fuel by state for IFTA reporting</p>
              </div>
              <div className="mt-4 md:mt-0 flex flex-wrap gap-3">
                <button
                  onClick={forceFuelSync}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                  disabled={loading}
                >
                  <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Sync Fuel Data
                </button>
                <button
                  onClick={handleExportData}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={trips.length === 0}
                >
                  <FileDown size={16} className="mr-2" />
                  Export for IFTA
                </button>
                <Link
                  href="/dashboard/fuel"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                >
                  <Fuel size={16} className="mr-2" />
                  Fuel Tracker
                </Link>
              </div>
            </div>

            {/* Success/error messages */}
            {statusMessage && (
              <div className={`mb-6 ${
                statusMessage.type === 'success' 
                  ? 'bg-green-50 border-l-4 border-green-400' 
                  : 'bg-yellow-50 border-l-4 border-yellow-400'
              } p-4 rounded-md`}>
                <div className="flex">
                  <div className="flex-shrink-0">
                    {statusMessage.type === 'success' ? (
                      <CheckCircle className="h-5 w-5 text-green-400" />
                    ) : (
                      <Info className="h-5 w-5 text-yellow-400" />
                    )}
                  </div>
                  <div className="ml-3">
                    <p className={`text-sm ${
                      statusMessage.type === 'success' ? 'text-green-700' : 'text-yellow-700'
                    }`}>
                      {statusMessage.text}
                    </p>
                  </div>
                </div>
              </div>
            )}

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

            {/* IFTA/Fuel Toggle */}
            <div className="mb-6">
              <IFTAFuelToggle
                currentPage="ifta"
                currentQuarter={activeQuarter}
              />
            </div>

            {/* Enhanced IFTA Fuel Sync */}
            {!databaseError && (
              <div className="mb-6">
                {loading && !dataLoaded ? <LoadingPlaceholder /> : (
                  <EnhancedIFTAFuelSync
                    userId={user?.id}
                    quarter={activeQuarter}
                    fuelData={fuelData}
                    trips={trips}
                    onSyncComplete={handleSyncComplete}
                    onError={(error) => setError(error.message)}
                  />
                )}
              </div>
            )}

            {/* State Mileage Importer */}
            {!databaseError && showMileageImporter && (
              <div className="mb-6">
                {loading && !dataLoaded ? <LoadingPlaceholder /> : (
                  <StateMileageImporter 
                    userId={user?.id} 
                    quarter={activeQuarter} 
                    onImportComplete={handleImportComplete}
                    showImportedTrips={true}
                  />
                )}
              </div>
            )}

            {/* Simplified IFTA Summary */}
            {!databaseError && (
              <div className="mb-6">
                {loading && !dataLoaded ? <LoadingPlaceholder /> : (
                  <SimplifiedIFTASummary
                    userId={user?.id}
                    quarter={activeQuarter}
                    trips={trips}
                    fuelData={fuelData}
                    isLoading={loading}
                  />
                )}
              </div>
            )}

            {/* Simplified Trip Entry Form */}
            <div className="mb-6">
              <SimplifiedTripEntryForm
                onAddTrip={handleAddTrip} 
                isLoading={loading}
                vehicles={uniqueVehicles}
              />
            </div>

            {/* Simplified Trips List */}
            <div className="mb-6">
              <SimplifiedTripsList
                trips={trips} 
                onDeleteTrip={handleDeleteTrip} 
                isLoading={loading}
              />
            </div>

            {/* Debug Mode */}
            {debugMode && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border text-xs">
                <h3 className="font-medium text-gray-700 mb-2">Debug Information</h3>
                <div className="space-y-1 text-gray-600">
                  <div>Active Quarter: {activeQuarter}</div>
                  <div>Trips: {trips.length}</div>
                  <div>Fuel Entries: {fuelData.length}</div>
                  <div>Data Loaded: {dataLoaded ? 'Yes' : 'No'}</div>
                  <div>Loading State: {loading ? 'Loading' : 'Not Loading'}</div>
                  <div>Data Loading Ref: {dataLoadingRef.current ? 'True' : 'False'}</div>
                </div>
              </div>
            )}

            {/* Debug Mode Toggle */}
            <div className="mt-4 text-xs text-gray-500">
              <label className="flex items-center">
                <input 
                  type="checkbox" 
                  checked={debugMode}
                  onChange={(e) => setDebugMode(e.target.checked)}
                  className="mr-2 h-3 w-3"
                />
                Debug Mode
              </label>
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
        isDeleting={loading && deleteModalOpen}
      />

      {/* Export Modal */}
      {exportModalOpen && (
        <SimplifiedExportModal
          isOpen={exportModalOpen}
          onClose={() => setExportModalOpen(false)}
          trips={trips}
          quarter={activeQuarter}
          fuelData={fuelData}
        />
      )}
    </DashboardLayout>
  );
}