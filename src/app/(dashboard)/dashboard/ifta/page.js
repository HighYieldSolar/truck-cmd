// src/app/(dashboard)/dashboard/ifta/page.js
"use client";

import { useState, useEffect, useCallback } from "react";
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
  
  // Component state for authentication and loading
  const [user, setUser] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  
  // Data state
  const [activeQuarter, setActiveQuarter] = useState("");
  const [trips, setTrips] = useState([]);
  const [fuelData, setFuelData] = useState([]);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [dataFetchKey, setDataFetchKey] = useState(0); // Use a counter to trigger data loading
  
  // Modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [tripToDelete, setTripToDelete] = useState(null);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  
  // Error and message state
  const [error, setError] = useState(null);
  const [databaseError, setDatabaseError] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);
  
  // Feature toggles
  const [showMileageImporter, setShowMileageImporter] = useState(true);
  const [debugMode, setDebugMode] = useState(false);

  // Load trips for the selected quarter
  const loadTrips = useCallback(async () => {
    if (!user?.id || !activeQuarter) return [];
    
    try {
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
          return [];
        } else {
          throw tripsError;
        }
      }
      
      console.log("Loaded trips:", data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('Error loading trips:', error);
      setError('Failed to load trip records. ' + error.message);
      return [];
    }
  }, [user?.id, activeQuarter]);

  // Load fuel data from fuel tracker
  const loadFuelData = useCallback(async () => {
    if (!user?.id || !activeQuarter) return [];
    
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
        
        return processedEntries;
      } else {
        console.warn("No fuel entries returned or invalid format");
        return [];
      }
    } catch (error) {
      console.error('Error loading fuel data:', error);
      setError('Failed to load fuel data. Your calculations may be incomplete.');
      return [];
    }
  }, [user?.id, activeQuarter]);

  // Extract unique vehicles from trips and fuel data
  const getUniqueVehicles = useCallback(() => {
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
  }, [trips, fuelData]);

  // Initialize data and check authentication
  useEffect(() => {
    async function initializeData() {
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
      } catch (err) {
        console.error('Error checking authentication:', err);
        setError('Authentication error. Please try logging in again.');
      } finally {
        setInitialLoading(false);
      }
    }
    
    initializeData();
  }, [router]);

  // Save active quarter to local storage when it changes
  useEffect(() => {
    if (activeQuarter) {
      localStorage.setItem('ifta-selected-quarter', activeQuarter);
      
      // When quarter changes, reset data loaded flag and increment data fetch key
      if (!initialLoading) {
        setIsDataLoaded(false);
        setDataFetchKey(prev => prev + 1);
      }
    }
  }, [activeQuarter, initialLoading]);

  // Load data when user, quarter, or dataFetchKey changes
  useEffect(() => {
    async function loadAllData() {
      if (!user?.id || !activeQuarter || initialLoading) return;
      
      try {
        setLoading(true);
        setError(null);
        setDatabaseError(null);
        
        console.log(`Loading all data for quarter: ${activeQuarter}, data fetch key: ${dataFetchKey}`);
        
        // Load both data types in parallel for efficiency
        const [tripsData, fuelEntries] = await Promise.all([
          loadTrips(),
          loadFuelData()
        ]);
        
        // Update state with fetched data
        setTrips(tripsData);
        setFuelData(fuelEntries);
        setIsDataLoaded(true);
        
        console.log(`Data loaded: ${tripsData.length} trips, ${fuelEntries.length} fuel entries`);
      } catch (error) {
        console.error("Error loading data:", error);
        // Individual load functions already set specific errors
      } finally {
        setLoading(false);
      }
    }
    
    loadAllData();
  }, [user?.id, activeQuarter, dataFetchKey, initialLoading, loadTrips, loadFuelData]);

  // Force refresh of fuel data
  const forceFuelSync = useCallback(() => {
    // Increment the data fetch key to trigger a reload
    setDataFetchKey(prev => prev + 1);
    
    // Show success message
    setStatusMessage({
      type: 'success',
      text: 'Refreshing fuel data...'
    });
    
    // Clear message after delay
    setTimeout(() => setStatusMessage(null), 3000);
  }, []);

  // Handle sync completion from IFTA Fuel Sync component
  const handleSyncComplete = useCallback((results) => {
    console.log("Sync completed successfully:", results);
    // Update UI based on results
    if (results && !results.isBalanced) {
      setStatusMessage({
        type: 'warning',
        text: `Found ${results.discrepancies ? results.discrepancies.length : 0} discrepancies between fuel and IFTA data`
      });
    } else {
      setStatusMessage({
        type: 'success',
        text: 'Fuel and IFTA data are in sync!'
      });
    }
    setTimeout(() => setStatusMessage(null), 3000);
  }, []);

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
      
      // Add the new trip to the current trips array
      if (data && data.length > 0) {
        setTrips(prevTrips => [data[0], ...prevTrips]);
      }
      
      // Trigger a refresh to ensure all data is in sync
      setDataFetchKey(prev => prev + 1);
      
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
  const handleDeleteTrip = useCallback((trip) => {
    setTripToDelete(trip);
    setDeleteModalOpen(true);
  }, []);

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
      
      // Update local state immediately
      setTrips(prevTrips => prevTrips.filter(trip => trip.id !== tripToDelete.id));
      
      // Show success message
      setStatusMessage({
        type: 'success',
        text: 'Trip deleted successfully!'
      });
      
      // Clear status message after 3 seconds
      setTimeout(() => setStatusMessage(null), 3000);
      
      setDeleteModalOpen(false);
      setTripToDelete(null);
      
      // Trigger a refresh to ensure all data is in sync
      setDataFetchKey(prev => prev + 1);
    } catch (error) {
      console.error('Error deleting trip:', error);
      setError('Failed to delete trip: ' + (error.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  // Handler for exporting data
  const handleExportData = useCallback(() => {
    if (!trips || trips.length === 0) {
      setError("No trip data available to export. Please add trips first.");
      return;
    }
    
    // Open the export modal
    setExportModalOpen(true);
  }, [trips]);

  // Handle trips import completion
  const handleImportComplete = useCallback(() => {
    // Show success message
    setStatusMessage({
      type: 'success',
      text: 'Trips imported successfully!'
    });
    
    // Clear status message after 3 seconds
    setTimeout(() => setStatusMessage(null), 3000);
    
    // Trigger data refresh
    setDataFetchKey(prev => prev + 1);
  }, []);

  // Get list of unique vehicles
  const uniqueVehicles = getUniqueVehicles();
  
  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  // Debugging info for the console
  if (debugMode) {
    console.log("Render with state:", {
      user: user?.id,
      activeQuarter,
      trips: trips.length,
      fuelData: fuelData.length,
      isDataLoaded,
      loading,
      dataFetchKey
    });
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

            {/* Enhanced IFTA Fuel Sync - Always render but show loading state if needed */}
            {!databaseError && (
              <div className="mb-6">
                {loading && !isDataLoaded ? (
                  <LoadingPlaceholder />
                ) : (
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

            {/* State Mileage Importer - Always render but show loading state if needed */}
            {!databaseError && showMileageImporter && (
              <div className="mb-6">
                {loading && !isDataLoaded ? (
                  <LoadingPlaceholder />
                ) : (
                  <StateMileageImporter 
                    userId={user?.id} 
                    quarter={activeQuarter} 
                    onImportComplete={handleImportComplete}
                    showImportedTrips={true}
                  />
                )}
              </div>
            )}

            {/* Simplified IFTA Summary - Always render but pass loading prop */}
            {!databaseError && (
              <div className="mb-6">
                <SimplifiedIFTASummary
                  userId={user?.id}
                  quarter={activeQuarter}
                  trips={trips}
                  fuelData={fuelData}
                  isLoading={loading && !isDataLoaded}
                />
              </div>
            )}

            {/* Simplified Trip Entry Form - Always show this */}
            <div className="mb-6">
              <SimplifiedTripEntryForm
                onAddTrip={handleAddTrip} 
                isLoading={loading}
                vehicles={uniqueVehicles}
              />
            </div>

            {/* Simplified Trips List - Always show this with loading state */}
            <div className="mb-6">
              <SimplifiedTripsList
                trips={trips} 
                onDeleteTrip={handleDeleteTrip} 
                isLoading={loading && !isDataLoaded}
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
                  <div>Data Loaded: {isDataLoaded ? 'Yes' : 'No'}</div>
                  <div>Loading State: {loading ? 'Loading' : 'Not Loading'}</div>
                  <div>Data Fetch Key: {dataFetchKey}</div>
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