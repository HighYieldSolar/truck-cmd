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

// Import custom components
import TripEntryForm from "@/components/ifta/TripEntryForm";
import TripsList from "@/components/ifta/TripsList";
import IFTASummary from "@/components/ifta/IFTASummary";
import QuarterSelector from "@/components/ifta/QuarterSelector";
import DeleteConfirmationModal from "@/components/common/DeleteConfirmationModal";
import ReportGenerator from "@/components/ifta/ReportGenerator";

// Import IFTA-Fuel integration components
import IFTAFuelSync from "@/components/ifta/IFTAFuelSync";
import EnhancedIFTASummary from "@/components/ifta/EnhancedIFTASummary";

// Import load integration component
import LoadToIFTAImporter from "@/components/ifta/LoadToIFTAImporter";

// Import services
import { fetchFuelEntries } from "@/lib/services/fuelService";
import { saveIFTAReport } from "@/lib/services/iftaService";
import { getLoadToIftaStats } from "@/lib/services/loadIftaService";

// NEW: Import mileage service
import { calculateStateMileage } from "@/lib/services/mileageService";

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
  
  // NEW: State for mileage integration
  const [mileageData, setMileageData] = useState([]);
  const [mileageModalOpen, setMileageModalOpen] = useState(false);
  const [completedMileageTrips, setCompletedMileageTrips] = useState([]);
  const [selectedMileageTrip, setSelectedMileageTrip] = useState(null);
  const [mileageImportLoading, setMileageImportLoading] = useState(false);
  const [showMileageImporter, setShowMileageImporter] = useState(true);
  const [mileageImportSuccess, setMileageImportSuccess] = useState(false);

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

  // NEW: Load state mileage trips for the selected quarter
  const loadMileageTrips = useCallback(async () => {
    if (!user?.id || !activeQuarter) return;
    
    try {
      // Parse the quarter into date range
      const [year, quarter] = activeQuarter.split('-Q');
      const quarterStartMonth = (parseInt(quarter) - 1) * 3;
      const startDate = new Date(parseInt(year), quarterStartMonth, 1);
      const endDate = new Date(parseInt(year), quarterStartMonth + 3, 0);
      
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      // Fetch completed mileage trips within this quarter
      const { data, error } = await supabase
        .from('driver_mileage_trips')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .gte('start_date', startDateStr)
        .lte('end_date', endDateStr)
        .order('end_date', { ascending: false });
        
      if (error) throw error;
      
      // Check if these mileage trips have already been imported
      const mileageTripIds = (data || []).map(trip => trip.id);
      
      // Get all IFTA trips that reference these mileage trips
      let alreadyImportedTripIds = [];
      
      if (mileageTripIds.length > 0) {
        const { data: existingImports, error: importsError } = await supabase
          .from('ifta_trip_records')
          .select('mileage_trip_id')
          .in('mileage_trip_id', mileageTripIds)
          .eq('user_id', user.id)
          .eq('quarter', quarter);
          
        if (importsError) throw importsError;
        
        alreadyImportedTripIds = (existingImports || [])
          .map(trip => trip.mileage_trip_id)
          .filter(id => id);
      }
      
      // Mark trips that are already imported
      const processedTrips = (data || []).map(trip => ({
        ...trip,
        alreadyImported: alreadyImportedTripIds.includes(trip.id)
      }));
      
      setCompletedMileageTrips(processedTrips);
      setShowMileageImporter(processedTrips.filter(t => !t.alreadyImported).length > 0);
      
    } catch (error) {
      console.error('Error loading mileage trips:', error);
      setError('Failed to load state mileage trips. Some features may be limited.');
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
      
      return data;
    } catch (error) {
      console.error('Error loading trips:', error);
      setError('Failed to load trip records. ' + error.message);
      return null;
    } finally {
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
          
          // NEW: Load mileage trips
          await loadMileageTrips();
          
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
  }, [user, activeQuarter, initialLoading, dataLoaded, loadFuelData, loadTrips, loadMileageTrips]);

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

  // Export IFTA data as CSV
  const handleExportData = () => {
    if (!trips || trips.length === 0) return;

    try {
      // Create array of data for CSV
      const csvRows = [
        // Header row
        ['Trip ID', 'Date', 'Vehicle ID', 'Driver ID', 'Start Jurisdiction', 'End Jurisdiction', 'Miles', 'Gallons', 'Fuel Cost', 'Starting Odometer', 'Ending Odometer', 'Load ID', 'Mileage Trip ID'].join(','),
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
          trip.ending_odometer || 0,
          trip.load_id || '',
          trip.mileage_trip_id || ''
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
      setError(null);
      
      const savedReport = await saveIFTAReport(user.id, reportData);
      
      return true;
    } catch (error) {
      console.error('Error saving report:', error);
      setError('Failed to save report: ' + (error.message || "Unknown error"));
      return false;
    }
  };
  
  // Handle imported trips from load management
  const handleImportedTrips = async (newTrips) => {
    // Refresh the trips list to include the newly imported trips
    await loadTrips();
  };
  
  // NEW: Handle State Mileage Trip selection
  const handleSelectMileageTrip = async (trip) => {
    try {
      setSelectedMileageTrip(trip);
      
      // Fetch all crossings for this trip to calculate state miles
      const { data: crossings, error } = await supabase
        .from('driver_mileage_crossings')
        .select('*')
        .eq('trip_id', trip.id)
        .order('timestamp', { ascending: true });
        
      if (error) throw error;
      
      // Calculate mileage by state
      let stateMileageData = [];
      
      if (crossings && crossings.length >= 2) {
        for (let i = 0; i < crossings.length - 1; i++) {
          const currentState = crossings[i].state;
          const currentOdometer = crossings[i].odometer;
          const nextOdometer = crossings[i + 1].odometer;
          const milesDriven = nextOdometer - currentOdometer;
          
          // Add or update state mileage
          const existingEntry = stateMileageData.find(entry => entry.state === currentState);
          if (existingEntry) {
            existingEntry.miles += milesDriven;
          } else {
            stateMileageData.push({
              state: currentState,
              state_name: crossings[i].state_name,
              miles: milesDriven
            });
          }
        }
      }
      
      // Sort by miles (highest first)
      stateMileageData = stateMileageData.sort((a, b) => b.miles - a.miles);
      
      setMileageData(stateMileageData);
      setMileageModalOpen(true);
      
    } catch (error) {
      console.error('Error loading mileage trip details:', error);
      setError('Failed to load state mileage details. Please try again.');
    }
  };
  
  // NEW: Import mileage data as IFTA trips
  const handleImportMileageTrip = async () => {
    if (!selectedMileageTrip || !mileageData || mileageData.length === 0) {
      return;
    }
    
    try {
      setMileageImportLoading(true);
      setError(null);
      
      // Create array of trip records for each state
      const tripRecords = mileageData.map(stateData => ({
        user_id: user.id,
        quarter: activeQuarter,
        start_date: selectedMileageTrip.start_date,
        end_date: selectedMileageTrip.end_date,
        vehicle_id: selectedMileageTrip.vehicle_id,
        mileage_trip_id: selectedMileageTrip.id, // Reference to the original mileage trip
        start_jurisdiction: stateData.state,
        end_jurisdiction: stateData.state, // Same state for these records since we're importing state by state
        total_miles: stateData.miles,
        gallons: 0, // To be filled by user or calculated based on MPG
        fuel_cost: 0, // To be filled by user
        notes: `Imported from State Mileage Tracker: ${stateData.state_name} (${stateData.miles.toFixed(1)} miles)`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_imported: true,
        source: 'mileage_tracker'
      }));
      
      // Insert the trip records
      const { data, error: insertError } = await supabase
        .from('ifta_trip_records')
        .insert(tripRecords)
        .select();
        
      if (insertError) throw insertError;
      
      // Close modal and show success
      setMileageModalOpen(false);
      setMileageImportSuccess(true);
      
      // Clear state
      setTimeout(() => {
        setMileageImportSuccess(false);
      }, 3000);
      
      // Refresh data
      await loadTrips();
      await loadMileageTrips();
      
    } catch (error) {
      console.error('Error importing mileage data:', error);
      setError('Failed to import mileage data: ' + (error.message || "Unknown error"));
    } finally {
      setMileageImportLoading(false);
    }
  };
  
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
                disabled={trips.length === 0}
              >
                <FileDown size={16} className="mr-2" />
                Generate Report
              </button>
              <button
                onClick={handleExportData}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none"
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
          
          {/* Success message for mileage import */}
          {mileageImportSuccess && (
            <div className="mb-6 bg-green-50 border-l-4 border-green-400 p-4 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700">
                    Successfully imported state mileage data into IFTA records.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Quarter Selector */}
          <div className="mb-6">
            <QuarterSelector 
              activeQuarter={activeQuarter} 
              setActiveQuarter={setActiveQuarter} 
              isLoading={false} 
            />
          </div>

          {/* NEW: State Mileage Importer */}
          {!databaseError && showMileageImporter && (
            <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <div className="flex items-center">
                  <MapPin size={20} className="text-blue-600 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900">Import State Mileage Data</h3>
                </div>
                <Link
                  href="/dashboard/mileage"
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                >
                  <Truck size={14} className="mr-1" />
                  View Mileage Tracker
                </Link>
              </div>
              
              <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
                <div className="flex items-start">
                  <div className="mr-3 flex-shrink-0">
                    <MapPin size={20} className="text-blue-500" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-blue-800">Use Your State Mileage Data for IFTA</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Import your detailed state-by-state mileage data directly from the State Mileage Tracker into your IFTA report.
                      This ensures your IFTA reporting is accurate, with precise mileage for each jurisdiction.
                    </p>
                    <p className="text-sm text-blue-700 mt-1">
                      For this quarter ({activeQuarter}), we found {completedMileageTrips.filter(t => !t.alreadyImported).length} completed mileage trips 
                      that can be imported into your IFTA records.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="px-6 py-4">
                <h3 className="text-md font-medium mb-3">Available Mileage Trips</h3>
                
                {completedMileageTrips.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-gray-500">No completed mileage trips found for this quarter.</p>
                    <Link 
                      href="/dashboard/mileage"
                      className="inline-flex items-center mt-2 text-blue-600 hover:text-blue-800"
                    >
                      <MapPin size={16} className="mr-1" />
                      Go to State Mileage Tracker
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {completedMileageTrips
                      .filter(trip => !trip.alreadyImported)
                      .slice(0, 4)
                      .map(trip => (
                        <div 
                          key={trip.id} 
                          className="p-3 border rounded-lg bg-white hover:bg-gray-50 cursor-pointer"
                          onClick={() => handleSelectMileageTrip(trip)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium text-gray-900">
                                {trip.vehicle_id}
                              </div>
                              <div className="text-sm text-gray-500">
                                {new Date(trip.start_date).toLocaleDateString()} - {new Date(trip.end_date).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="flex items-center text-blue-600">
                              <ArrowRight size={16} />
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
                
                {completedMileageTrips.filter(t => !t.alreadyImported).length > 4 && (
                  <div className="mt-4 text-center">
                    <button
                      onClick={() => setMileageModalOpen(true)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      View all {completedMileageTrips.filter(t => !t.alreadyImported).length} available trips
                    </button>
                  </div>
                )}
              </div>
              
              <div className="px-6 py-4 bg-gray-50 flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  <span>
                    {completedMileageTrips.filter(t => !t.alreadyImported).length} available trip{completedMileageTrips.filter(t => !t.alreadyImported).length !== 1 ? 's' : ''} • 
                    {completedMileageTrips.filter(t => t.alreadyImported).length} already imported
                  </span>
                </div>
                <div>
                  <Link
                    href="/dashboard/mileage"
                    className="inline-flex items-center px-4 py-2 border border-transparent bg-blue-600 text-white text-sm rounded-md shadow-sm hover:bg-blue-700"
                  >
                    <Plus size={16} className="mr-2" />
                    Record New State Crossings
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Load to IFTA Importer - Show only if we have available loads */}
          {!databaseError && showLoadImporter && (
            <div className="mb-6">
              <LoadToIFTAImporter 
                userId={user?.id} 
                quarter={activeQuarter} 
                onImportComplete={handleImportedTrips}
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
                  isLoading={false}
                />
              ) : (
                <IFTASummary 
                  trips={trips} 
                  stats={stats}
                  isLoading={false} 
                />
              )}
            </div>
          )}

          {/* Trip Entry Form */}
          <div className="mb-6">
            <TripEntryForm 
              onAddTrip={handleAddTrip} 
              isLoading={false}
              fuelData={fuelData}
            />
          </div>

          {/* Trips List */}
          <div className="mb-6">
            <TripsList 
              trips={trips} 
              onRemoveTrip={handleDeleteTrip} 
              isLoading={false}
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

      {/* NEW: State Mileage Import Modal */}
      {mileageModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      Import State Mileage Data
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        {selectedMileageTrip ? (
                          <>Vehicle {selectedMileageTrip.vehicle_id}: {new Date(selectedMileageTrip.start_date).toLocaleDateString()} - {new Date(selectedMileageTrip.end_date).toLocaleDateString()}</>
                        ) : (
                          'Select a mileage trip to import'
                        )}
                      </p>
                    </div>
                    
                    {selectedMileageTrip && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">State Mileage Breakdown</h4>
                        
                        {mileageData.length === 0 ? (
                          <p className="text-sm text-gray-500">No state crossings found for this trip.</p>
                        ) : (
                          <div className="max-h-60 overflow-y-auto pr-2">
                            {mileageData.map(state => (
                              <div key={state.state} className="mb-2 border border-gray-200 rounded-md p-2">
                                <div className="flex justify-between">
                                  <span className="font-medium">{state.state_name} ({state.state})</span>
                                  <span className="font-medium">{state.miles.toFixed(1)} miles</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="mt-4">
                      <p className="text-sm text-gray-500">
                        This will create separate IFTA records for each state with the correct mileage. The data will be imported exactly as recorded in your state mileage tracker.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleImportMileageTrip}
                  disabled={!selectedMileageTrip || mileageData.length === 0 || mileageImportLoading}
                  className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm ${
                    (!selectedMileageTrip || mileageData.length === 0 || mileageImportLoading) ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {mileageImportLoading ? (
                    <>
                      <RefreshCw size={16} className="mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    'Import State Mileage'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setMileageModalOpen(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}