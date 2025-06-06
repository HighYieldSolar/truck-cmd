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
  CheckCircle,
  Route,
  Gauge,
  FileText,
  StickyNote
} from "lucide-react";

// Import components
import DashboardLayout from "@/components/layout/DashboardLayout";
import QuarterSelector from "@/components/ifta/QuarterSelector";
import DeleteConfirmationModal from "@/components/common/DeleteConfirmationModal";
import IFTAFuelToggle from "@/components/ifta/IFTAFuelToggle";
import StateMileageImporter from "@/components/ifta/StateMileageImporter";
import EnhancedIFTAFuelSync from "@/components/ifta/EnhancedIFTAFuelSync";
import VehicleSelector from "@/components/ifta/VehicleSelector";

// Import simplified components for IFTA
import SimplifiedIFTASummary from "@/components/ifta/SimplifiedIFTASummary";
import SimplifiedExportModal from "@/components/ifta/SimplifiedExportModal";
import SimplifiedTripEntryForm from "@/components/ifta/SimplifiedTripEntryForm";
import SimplifiedTripsList from "@/components/ifta/SimplifiedTripsList";

// Import services
import { fetchFuelEntries } from "@/lib/services/fuelService";
import { getQuarterDateRange } from "@/lib/utils/dateUtils";

export default function IFTACalculatorPage() {
  const router = useRouter();

  // Component state for authentication and loading
  const [user, setUser] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);

  // Data state
  const [activeQuarter, setActiveQuarter] = useState("");
  const [trips, setTrips] = useState([]);
  const [fuelData, setFuelData] = useState([]);

  // Add selected vehicle state
  const [selectedVehicle, setSelectedVehicle] = useState("all");

  // UI state
  const [loading, setLoading] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [dataFetchKey, setDataFetchKey] = useState(0);

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

  // Add ref for the state mileage importer section
  const mileageImporterRef = useRef(null);

  // Load trips for the selected quarter
  const loadTrips = useCallback(async () => {
    if (!user?.id || !activeQuarter) return [];

    try {
      console.log("Loading trips for user", user.id, "and quarter", activeQuarter);

      // Get trips without attempting to join the vehicles table first
      const { data, error: tripsError } = await supabase
        .from('ifta_trip_records')
        .select('*')
        .eq('user_id', user.id)
        .eq('quarter', activeQuarter)
        .order('start_date', { ascending: false });

      if (tripsError) {
        if (tripsError.code === '42P01') {
          console.error("ifta_trip_records table doesn't exist:", tripsError);
          setDatabaseError("The IFTA trips database table doesn't exist. Please contact support to set up your database.");
          return [];
        } else {
          throw tripsError;
        }
      }

      // Now that we have the trips, try to fetch vehicle information separately
      const trips = data || [];
      const vehicleIds = [...new Set(trips.map(trip => trip.vehicle_id))].filter(Boolean);
      const vehicleInfo = {};

      if (vehicleIds.length > 0) {
        try {
          // Try vehicles table first
          const { data: vehicleData } = await supabase
            .from('vehicles')
            .select('id, name, license_plate')
            .in('id', vehicleIds);

          if (vehicleData && vehicleData.length > 0) {
            vehicleData.forEach(vehicle => {
              vehicleInfo[vehicle.id] = {
                name: vehicle.name,
                license_plate: vehicle.license_plate
              };
            });
          } else {
            // Try trucks table as fallback
            const { data: trucksData } = await supabase
              .from('trucks')
              .select('id, name, license_plate')
              .in('id', vehicleIds);

            if (trucksData && trucksData.length > 0) {
              trucksData.forEach(truck => {
                vehicleInfo[truck.id] = {
                  name: truck.name,
                  license_plate: truck.license_plate
                };
              });
            }
          }
        } catch (vehicleError) {
          console.warn("Could not fetch vehicle details:", vehicleError);
          // Non-fatal error, continue with basic trip data
        }
      }

      // Process data to add helpful fields
      const processedTrips = trips.map(trip => {
        // Add vehicle name if available
        const vehicleDetails = vehicleInfo[trip.vehicle_id] || {};

        return {
          ...trip,
          vehicle_name: vehicleDetails.name || null,
          license_plate: vehicleDetails.license_plate || null
        };
      });

      console.log("Loaded trips:", processedTrips.length);
      return processedTrips;
    } catch (error) {
      console.error('Error loading trips:', error);
      setError('Failed to load trip records. ' + (error.message || 'Unknown error'));
      return [];
    }
  }, [user?.id, activeQuarter]);

  // Load fuel data from fuel tracker
  const loadFuelData = useCallback(async () => {
    if (!user?.id || !activeQuarter) return [];

    try {
      console.log("Loading fuel data for quarter:", activeQuarter);

      // Parse the quarter into dateRange filter using utility function
      const { startDate: startDateStr, endDate: endDateStr } = getQuarterDateRange(activeQuarter);

      const filters = {
        dateRange: 'Custom',
        startDate: startDateStr,
        endDate: endDateStr,
        iftaOnly: true  // Only fetch Diesel and Gasoline fuel types for IFTA
      };

      const fuelEntries = await fetchFuelEntries(user.id, filters);

      if (fuelEntries && Array.isArray(fuelEntries)) {
        console.log(`Loaded IFTA-eligible fuel entries: ${fuelEntries.length} (Diesel/Gasoline only)`);
        
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
    const vehicleMap = new Map();

    trips.forEach(trip => {
      if (trip.vehicle_id && !vehicleMap.has(trip.vehicle_id)) {
        vehicleMap.set(trip.vehicle_id, {
          id: String(trip.vehicle_id),
          name: trip.vehicle_name || String(trip.vehicle_id),
          license_plate: trip.license_plate
        });
      }
    });

    fuelData.forEach(entry => {
      if (entry.vehicle_id && !vehicleMap.has(entry.vehicle_id)) {
        vehicleMap.set(entry.vehicle_id, {
          id: String(entry.vehicle_id),
          name: entry.vehicle_name || String(entry.vehicle_id),
          license_plate: entry.license_plate
        });
      }
    });

    return Array.from(vehicleMap.values());
  }, [trips, fuelData]);

  // Get summary statistics
  const getStats = useCallback(() => {
    const totalTrips = trips.length;
    const totalMiles = trips.reduce((sum, trip) => sum + (parseFloat(trip.total_miles) || 0), 0);
    const totalGallons = fuelData.reduce((sum, entry) => sum + (parseFloat(entry.gallons) || 0), 0);
    const avgMpg = totalGallons > 0 ? totalMiles / totalGallons : 0;
    const uniqueJurisdictions = [...new Set([
      ...trips.map(t => t.start_jurisdiction),
      ...trips.map(t => t.end_jurisdiction),
      ...fuelData.map(f => f.state)
    ])].filter(Boolean).length;

    return {
      totalTrips,
      totalMiles,
      totalGallons,
      avgMpg,
      uniqueJurisdictions
    };
  }, [trips, fuelData]);

  // Initialize data and check authentication
  useEffect(() => {
    async function initializeData() {
      try {
        setInitialLoading(true);

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

        if (savedQuarter) {
          setActiveQuarter(savedQuarter);
        } else {
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

        const [tripsData, fuelEntries] = await Promise.all([
          loadTrips(),
          loadFuelData()
        ]);

        setTrips(tripsData);
        setFuelData(fuelEntries);
        setIsDataLoaded(true);

        console.log(`Data loaded: ${tripsData.length} trips, ${fuelEntries.length} fuel entries`);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadAllData();
  }, [user?.id, activeQuarter, dataFetchKey, initialLoading, loadTrips, loadFuelData]);

  // Force refresh of fuel data
  const forceFuelSync = useCallback(() => {
    setDataFetchKey(prev => prev + 1);

    setStatusMessage({
      type: 'success',
      text: 'Refreshing fuel data...'
    });

    setTimeout(() => setStatusMessage(null), 3000);
  }, []);

  // Handle sync completion from IFTA Fuel Sync component
  const handleSyncComplete = useCallback((results) => {
    console.log("Sync completed successfully:", results);
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

      const newTrip = {
        user_id: user.id,
        quarter: activeQuarter,
        start_date: tripData.date,
        end_date: tripData.date,
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

      setStatusMessage({
        type: 'success',
        text: 'Trip added successfully!'
      });

      setTimeout(() => setStatusMessage(null), 3000);

      if (data && data.length > 0) {
        setTrips(prevTrips => [data[0], ...prevTrips]);
      }

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

      setTrips(prevTrips => prevTrips.filter(trip => trip.id !== tripToDelete.id));

      setStatusMessage({
        type: 'success',
        text: 'Trip deleted successfully!'
      });

      setTimeout(() => setStatusMessage(null), 3000);

      setDeleteModalOpen(false);
      setTripToDelete(null);

      setDataFetchKey(prev => prev + 1);
    } catch (error) {
      console.error('Error deleting trip:', error);
      setError('Failed to delete trip: ' + (error.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  // Handle exporting data
  const handleExportData = useCallback(() => {
    if (!trips || trips.length === 0) {
      setError("No trip data available to export. Please add trips first.");
      return;
    }

    if (selectedVehicle !== "all") {
      const hasVehicleData = trips.some(trip => trip.vehicle_id === selectedVehicle);
      if (!hasVehicleData) {
        setError(`No trip data available for vehicle ${selectedVehicle}. Please select a different vehicle or add trips for this vehicle.`);
        return;
      }
    }

    setExportModalOpen(true);
  }, [trips, selectedVehicle]);

  // Handle trips import completion
  const handleImportComplete = useCallback(() => {
    setStatusMessage({
      type: 'success',
      text: 'Trips imported successfully!'
    });

    setTimeout(() => setStatusMessage(null), 3000);

    setDataFetchKey(prev => prev + 1);
  }, []);

  // Updated to scroll to importer and toggle it open if needed
  const handleShowMileageImporter = () => {
    // Make sure importer is visible
    setShowMileageImporter(true);

    // Scroll to the importer section with some offset
    setTimeout(() => {
      if (mileageImporterRef.current) {
        // Scroll to element with offset
        const yOffset = -100; // 100px offset from the top
        const element = mileageImporterRef.current;
        const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;

        window.scrollTo({
          top: y,
          behavior: 'smooth'
        });
      }
    }, 100);
  };

  // Get list of unique vehicles
  const uniqueVehicles = getUniqueVehicles();
  const stats = getStats();

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <DashboardLayout activePage="ifta">
      <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-100">
        <div className="max-w-7xl mx-auto">
          {/* Header with gradient background */}
          <div className="mb-8 bg-gradient-to-r from-blue-600 to-blue-400 rounded-xl shadow-md p-6 text-white">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="mb-4 md:mb-0">
                <h1 className="text-3xl font-bold mb-1">IFTA Mileage & Fuel Tracker</h1>
                <p className="text-blue-100">Track mileage and fuel by state for IFTA reporting</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={forceFuelSync}
                  className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors shadow-sm flex items-center font-medium"
                >
                  <RefreshCw size={18} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Sync Fuel Data
                </button>
                <button
                  onClick={handleExportData}
                  className="px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors shadow-sm flex items-center font-medium"
                  disabled={trips.length === 0}
                >
                  <FileDown size={18} className="mr-2" />
                  Export for IFTA
                </button>
                <Link
                  href="/dashboard/fuel"
                  className="px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors shadow-sm flex items-center font-medium"
                >
                  <Fuel size={18} className="mr-2" />
                  Fuel Tracker
                </Link>
              </div>
            </div>
          </div>

          {/* Success/error messages */}
          {statusMessage && (
            <div className={`mb-6 ${statusMessage.type === 'success'
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
                  <p className={`text-sm ${statusMessage.type === 'success' ? 'text-green-700' : 'text-yellow-700'
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

          {/* Statistics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 hover:shadow-md transition-all">
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide">Total Trips</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalTrips}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-xl">
                  <Route size={20} className="text-blue-600" />
                </div>
              </div>
              <div className="px-4 py-2 bg-gray-50">
                <span className="text-xs text-gray-500">Trip records</span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 hover:shadow-md transition-all">
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide">Total Miles</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">{Math.round(stats.totalMiles).toLocaleString()}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-xl">
                  <Truck size={20} className="text-green-600" />
                </div>
              </div>
              <div className="px-4 py-2 bg-gray-50">
                <span className="text-xs text-gray-500">Miles driven</span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 hover:shadow-md transition-all">
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide">Total Gallons</p>
                  <p className="text-2xl font-bold text-orange-500 mt-1">{Math.round(stats.totalGallons).toLocaleString()}</p>
                </div>
                <div className="bg-orange-100 p-3 rounded-xl">
                  <Fuel size={20} className="text-orange-600" />
                </div>
              </div>
              <div className="px-4 py-2 bg-gray-50">
                <span className="text-xs text-gray-500">Fuel consumed</span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 hover:shadow-md transition-all">
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide">Average MPG</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">{stats.avgMpg.toFixed(2)}</p>
                </div>
                <div className="bg-red-100 p-3 rounded-xl">
                  <Gauge size={20} className="text-red-600" />
                </div>
              </div>
              <div className="px-4 py-2 bg-gray-50">
                <span className="text-xs text-gray-500">Fleet efficiency</span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 hover:shadow-md transition-all">
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide">Jurisdictions</p>
                  <p className="text-2xl font-bold text-purple-600 mt-1">{stats.uniqueJurisdictions}</p>
                </div>
                <div className="bg-purple-100 p-3 rounded-xl">
                  <MapPin size={20} className="text-purple-600" />
                </div>
              </div>
              <div className="px-4 py-2 bg-gray-50">
                <span className="text-xs text-gray-500">States/provinces</span>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Sidebar */}
            <div className="lg:col-span-1">
              {/* Quick Actions */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6 border border-gray-200">
                <div className="bg-blue-500 px-5 py-4 text-white">
                  <h3 className="font-semibold flex items-center">
                    <Calculator size={18} className="mr-2" />
                    Quick Actions
                  </h3>
                </div>
                <div className="p-4">
                  <div className="space-y-3">
                    <button
                      onClick={handleShowMileageImporter}
                      className="w-full p-3 bg-gray-50 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors flex items-center justify-between"
                    >
                      <div className="flex items-center">
                        <FileText size={16} className="text-blue-600 mr-2" />
                        <span className="text-sm font-medium text-gray-700">Import Trips</span>
                      </div>
                      <ArrowRight size={14} className="text-gray-400" />
                    </button>

                    <Link
                      href="/dashboard/fuel"
                      className="w-full p-3 bg-gray-50 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors flex items-center justify-between"
                    >
                      <div className="flex items-center">
                        <Fuel size={16} className="text-blue-600 mr-2" />
                        <span className="text-sm font-medium text-gray-700">Fuel Tracker</span>
                      </div>
                      <ArrowRight size={14} className="text-gray-400" />
                    </Link>

                    <button
                      onClick={handleExportData}
                      disabled={trips.length === 0}
                      className="w-full p-3 bg-gray-50 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="flex items-center">
                        <Download size={16} className="text-blue-600 mr-2" />
                        <span className="text-sm font-medium text-gray-700">Export Report</span>
                      </div>
                      <ArrowRight size={14} className="text-gray-400" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Recent Trips */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6 border border-gray-200">
                <div className="bg-green-500 px-5 py-4 text-white">
                  <h3 className="font-semibold flex items-center">
                    <Clock size={18} className="mr-2" />
                    Recent Trips
                  </h3>
                </div>
                <div className="p-4">
                  {trips.slice(0, 5).length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Route size={36} className="mx-auto mb-2 text-gray-400" />
                      <p>No trips recorded yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {trips.slice(0, 5).map(trip => {
                        const tripDate = new Date(trip.start_date).toLocaleDateString();

                        return (
                          <div
                            key={trip.id}
                            className="p-3 bg-gray-50 rounded-lg hover:bg-green-50 cursor-pointer transition-colors"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="font-medium text-gray-900 text-sm">
                                  {trip.start_jurisdiction} → {trip.end_jurisdiction}
                                </p>
                                <p className="text-sm text-gray-500">{tripDate}</p>
                              </div>
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {trip.total_miles} mi
                              </span>
                            </div>
                          </div>
                        );
                      })}

                      <div className="mt-2 pt-2 border-t border-gray-200 text-center">
                        <button
                          onClick={() => { }}
                          className="text-sm text-blue-600 hover:text-blue-800 flex items-center justify-center w-full"
                        >
                          View all trips
                          <ArrowRight size={14} className="ml-1" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {/* Period Selection - Updated with gradient header */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6 border border-gray-200">
                <div className="bg-gradient-to-r from-purple-600 to-purple-500 px-5 py-4 text-white">
                  <h3 className="font-semibold flex items-center">
                    <Calendar size={18} className="mr-2" />
                    Reporting Period
                  </h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        IFTA Quarter
                      </label>
                      <QuarterSelector
                        activeQuarter={activeQuarter}
                        setActiveQuarter={setActiveQuarter}
                        isLoading={loading}
                      />
                      <p className="mt-2 text-xs text-gray-500">
                        Select the quarter for your IFTA reporting
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Vehicle Filter
                      </label>
                      <VehicleSelector
                        selectedVehicle={selectedVehicle}
                        setSelectedVehicle={setSelectedVehicle}
                        vehicles={uniqueVehicles}
                        isLoading={loading && !isDataLoaded}
                        userId={user?.id}
                      />
                      <p className="mt-2 text-xs text-gray-500">
                        Filter data by specific vehicle or view all
                      </p>
                    </div>
                  </div>
                </div>
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
                  {loading && !isDataLoaded ? (
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
                  ) : (
                    <EnhancedIFTAFuelSync
                      userId={user?.id}
                      quarter={activeQuarter}
                      fuelData={fuelData}
                      trips={trips}
                      selectedVehicle={selectedVehicle}
                      onSyncComplete={handleSyncComplete}
                      onError={(error) => setError(error.message)}
                    />
                  )}
                </div>
              )}

              {/* State Mileage Importer */}
              {!databaseError && showMileageImporter && (
                <div className="mb-6" ref={mileageImporterRef}>
                  {loading && !isDataLoaded ? (
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

              {/* Simplified IFTA Summary */}
              {!databaseError && (
                <div className="mb-6">
                  <SimplifiedIFTASummary
                    userId={user?.id}
                    quarter={activeQuarter}
                    trips={trips}
                    fuelData={fuelData}
                    selectedVehicle={selectedVehicle}
                    isLoading={loading && !isDataLoaded}
                  />
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
                  trips={selectedVehicle === "all" ? trips : trips.filter(trip => trip.vehicle_id === selectedVehicle)}
                  onDeleteTrip={handleDeleteTrip}
                  isLoading={loading && !isDataLoaded}
                />
              </div>
            </div>
          </div>
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
            selectedVehicle={selectedVehicle}
          />
        )}
      </main>
    </DashboardLayout>
  );
}