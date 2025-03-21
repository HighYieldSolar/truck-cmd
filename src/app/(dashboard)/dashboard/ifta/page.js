"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Calculator,
  FileDown,
  Plus,
  Trash2,
  RefreshCw,
  AlertTriangle,
  Info,
  Download,
  Truck,
  Calendar,
  MapPin,
  Fuel,
  DollarSign,
  Clock,
  Database
} from "lucide-react";

// Import utilities
import { runDatabaseDiagnostics } from "@/lib/utils/databaseCheck";

// Import custom components
import TripEntryForm from "@/components/ifta/TripEntryForm";
import TripsList from "@/components/ifta/TripsList";
import IFTASummary from "@/components/ifta/IFTASummary";
import QuarterSelector from "@/components/ifta/QuarterSelector";
import DeleteConfirmationModal from "@/components/common/DeleteConfirmationModal";
import ReportGenerator from "@/components/ifta/ReportGenerator";

// Import new IFTA-Fuel integration components
import IFTAFuelSync from "@/components/ifta/IFTAFuelSync";
import EnhancedIFTASummary from "@/components/ifta/EnhancedIFTASummary";

// Import services
import { fetchFuelEntries } from "@/lib/services/fuelService";
import { saveIFTAReport } from "@/lib/services/iftaService";

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
  const [tripLoading, setTripLoading] = useState(false);
  const [fuelDataLoading, setFuelDataLoading] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [tripToDelete, setTripToDelete] = useState(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
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

  // New state for fuel integration
  const [syncResult, setSyncResult] = useState(null);
  const [useEnhancedSummary, setUseEnhancedSummary] = useState(true);
  const [diagnosisMode, setDiagnosisMode] = useState(false);
  const [diagnosisResults, setDiagnosisResults] = useState(null);

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

  // Define calculateStats with useCallback and include the calculation logic inside
  const calculateStats = useCallback((tripsData, fuelEntries) => {
    // Calculate stats directly inside useCallback
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
    
    // Set the stats state directly
    setStats({
      totalMiles,
      totalGallons,
      avgMpg,
      fuelCostPerMile,
      uniqueJurisdictions: uniqueJurisdictions.size,
      userId: user?.id
    });
  }, [user?.id]); // Only depend on user?.id since it's used inside

  // Load fuel data from fuel tracker to assist with IFTA calculations
  const loadFuelData = useCallback(async () => {
    if (!user?.id || !activeQuarter || dataLoadingRef.current) return null;
    
    try {
      setFuelDataLoading(true);
      
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
    } finally {
      setFuelDataLoading(false);
    }
  }, [user?.id, activeQuarter]);

  // Load trips for the selected quarter
  const loadTrips = useCallback(async () => {
    if (!user?.id || !activeQuarter || dataLoadingRef.current) return;
    
    try {
      setTripLoading(true);
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
    } catch (error) {
      console.error('Error loading trips:', error);
      setError('Failed to load trip records. ' + error.message);
    } finally {
      setTripLoading(false);
      dataLoadingRef.current = false;
    }
  }, [user?.id, activeQuarter, fuelData, loadFuelData, calculateStats]);

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

// Add this state near your other state declarations
const [dataLoaded, setDataLoaded] = useState(false);

// Then modify your useEffect
useEffect(() => {
  if (user && activeQuarter && !initialLoading && !dataLoaded) {
    const loadAllData = async () => {
      if (dataLoadingRef.current) return;
      dataLoadingRef.current = true;
      
      try {
        setError(null);
        setDatabaseError(null);
        const fuelEntries = await loadFuelData();
        await loadTrips();
        // Mark data as loaded after successful fetch
        setDataLoaded(true);
      } catch (err) {
        console.error("Error loading data:", err);
        // Handle errors...
      } finally {
        dataLoadingRef.current = false;
      }
    };
    
    loadAllData();
  }
}, [user, activeQuarter, initialLoading, dataLoaded, loadFuelData, loadTrips]);

// Add another useEffect to reset dataLoaded when quarter changes
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
      setLoading(true);
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

  // Export IFTA data as CSV
  const handleExportData = () => {
    if (!trips || trips.length === 0) return;

    try {
      // Create array of data for CSV
      const csvRows = [
        // Header row
        ['Trip ID', 'Date', 'Vehicle ID', 'Driver ID', 'Start Jurisdiction', 'End Jurisdiction', 'Miles', 'Gallons', 'Fuel Cost', 'Starting Odometer', 'Ending Odometer'].join(','),
        // Data rows
        ...trips.map(trip => [
          trip.id,
          trip.start_date,
          trip.vehicle_id,
          trip.driver_id || '',
          trip.start_jurisdiction,
          trip.end_jurisdiction,
          trip.total_miles,
          trip.gallons || 0,
          trip.fuel_cost || 0,
          trip.starting_odometer || 0,
          trip.ending_odometer || 0
        ].join(','))
      ];

      // Create blob and download link
      const csvString = csvRows.join('\n');
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `ifta_data_${activeQuarter.replace('-', '_')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error exporting data:', err);
      setError('Failed to export data: ' + (err.message || "Unknown error"));
    }
  };

  // Handle generating a report or saving report data
  const handleSaveReport = async (reportData) => {
    try {
      setLoading(true);
      setError(null);
      
      const savedReport = await saveIFTAReport(user.id, reportData);
      
      return true;
    } catch (error) {
      console.error('Error saving report:', error);
      setError('Failed to save report: ' + (error.message || "Unknown error"));
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Combine all loading states for UI to avoid flicker
  const isLoading = initialLoading || loading || tripLoading || fuelDataLoading;

  // Show stable loading indicator only for initial load
  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <DashboardLayout activePage="ifta calculator">
      <main className="flex-1 overflow-y-auto p-4 bg-gray-100">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">IFTA Tax Calculator</h1>
              <p className="text-gray-600">Track and calculate your Interstate Fuel Tax Agreement (IFTA) data</p>
            </div>
            <div className="mt-4 md:mt-0 flex space-x-3">
              <button
                onClick={() => setReportModalOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                disabled={trips.length === 0 || loading}
              >
                <FileDown size={16} className="mr-2" />
                Generate Report
              </button>
              <button
                onClick={handleExportData}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none"
                disabled={trips.length === 0 || loading}
              >
                <Download size={16} className="mr-2" />
                Export Data
              </button>
              <button
                onClick={runDiagnostics}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
              >
                <Database size={16} className="mr-2" />
                Diagnose
              </button>
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

          {/* Show diagnostics results if available */}
          {diagnosisMode && diagnosisResults && (
            <div className={`mb-6 ${diagnosisResults.success ? 'bg-green-50 border-l-4 border-green-500' : 'bg-yellow-50 border-l-4 border-yellow-500'} p-4 rounded-md`}>
              <div className="flex">
                <div className="flex-shrink-0">
                  <Database className={`h-5 w-5 ${diagnosisResults.success ? 'text-green-400' : 'text-yellow-400'}`} />
                </div>
                <div className="ml-3">
                  <h3 className={`text-lg font-medium ${diagnosisResults.success ? 'text-green-800' : 'text-yellow-800'}`}>
                    Database Diagnosis Results
                  </h3>
                  {diagnosisResults.success ? (
                    <p className="text-sm text-green-700">All database tables are properly configured.</p>
                  ) : (
                    <div>
                      <p className="text-sm text-yellow-700">Database issues detected:</p>
                      <ul className="list-disc list-inside text-sm text-yellow-700 mt-1">
                        {diagnosisResults.issues.map((issue, i) => (
                          <li key={i}>{issue}</li>
                        ))}
                      </ul>
                      <p className="text-sm text-yellow-700 mt-2">
                        Please contact support to resolve these database issues.
                      </p>
                    </div>
                  )}
                  <button
                    onClick={() => setDiagnosisMode(false)}
                    className="mt-2 inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                  >
                    Hide Diagnostics
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
              isLoading={loading || tripLoading}
            />
          </div>

          {/* IFTA-Fuel Sync - Only show if no database errors */}
          {!databaseError && (
            <div className="mb-6">
              <IFTAFuelSync 
                userId={user?.id} 
                quarter={activeQuarter} 
                onSyncComplete={handleSyncComplete}
              />
            </div>
          )}

          {/* IFTA Summary - Only show if no database errors */}
          {!databaseError && (
            <div className="mb-6">
              {useEnhancedSummary ? (
                <EnhancedIFTASummary
                  userId={user?.id}
                  quarter={activeQuarter}
                  syncResult={syncResult}
                  isLoading={loading || tripLoading}
                />
              ) : (
                <IFTASummary 
                  trips={trips} 
                  stats={stats}
                  isLoading={loading || tripLoading} 
                />
              )}
            </div>
          )}

          {/* Trip Entry Form */}
          <div className="mb-6">
            <TripEntryForm 
              onAddTrip={handleAddTrip} 
              isLoading={loading}
              fuelData={fuelData}
            />
          </div>

          {/* Trips List */}
          <div className="mb-6">
            <TripsList 
              trips={trips} 
              onRemoveTrip={handleDeleteTrip} 
              isLoading={tripLoading}
            />
          </div>
        </div>
      </main>

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
        isDeleting={loading}
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
    </DashboardLayout>
  );
}