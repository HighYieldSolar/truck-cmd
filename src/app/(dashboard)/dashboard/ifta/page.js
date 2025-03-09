"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Calculator,
  FileDown,
  Plus,
  Trash2,
  Save,
  RefreshCw,
  AlertCircle,
  Info,
  Download,
  Truck,
  Calendar,
  MapPin,
  Fuel,
  DollarSign,
  Filter,
  ChevronDown,
  ChevronsUpDown
} from "lucide-react";

// Import custom components
import IFTARatesTable from "@/components/ifta/IFTARatesTable";
import TripEntryForm from "@/components/ifta/TripEntryForm";
import TripsList from "@/components/ifta/TripsList";
import IFTASummary from "@/components/ifta/IFTASummary";
import QuarterSelector from "@/components/ifta/QuarterSelector";
import StateDataGrid from "@/components/ifta/StateDataGrid";
import DeleteConfirmationModal from "@/components/common/DeleteConfirmationModal";
import ReportGenerator from "@/components/ifta/ReportGenerator";

// Import services and hooks
import { fetchFuelEntries } from "@/lib/services/fuelService";
import useIFTA from "@/hooks/useIFTA";

export default function IFTACalculatorPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [activeQuarter, setActiveQuarter] = useState("");
  const [fuelData, setFuelData] = useState([]);
  const [fuelDataLoading, setFuelDataLoading] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [tripToDelete, setTripToDelete] = useState(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  // Get IFTA data and functions from our custom hook
  const {
    trips,
    rates,
    stats,
    loading,
    error,
    loadTrips,
    addTrip,
    updateTrip,
    deleteTrip,
    loadRates,
    calculateSummary
  } = useIFTA(user?.id, activeQuarter);

  // Check if the user is authenticated
  useEffect(() => {
    async function checkAuth() {
      try {
        setInitialLoading(true);
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
          throw error;
        }
        
        if (!user) {
          // Redirect to login if not authenticated
          router.push('/login');
          return;
        }
        
        setUser(user);
        
        // Set default active quarter
        const now = new Date();
        const quarter = Math.ceil((now.getMonth() + 1) / 3);
        setActiveQuarter(`${now.getFullYear()}-Q${quarter}`);
      } catch (error) {
        console.error('Error checking authentication:', error);
      } finally {
        setInitialLoading(false);
      }
    }
    
    checkAuth();
  }, [router]);

  // Load trips when the active quarter changes
  useEffect(() => {
    if (user && activeQuarter) {
      loadTrips(activeQuarter);
      loadRates();
      loadFuelData();
    }
  }, [user, activeQuarter, loadTrips, loadRates, loadFuelData]);

  // Load fuel data from fuel tracker to assist with IFTA calculations
  const loadFuelData = useCallback(async () => {
    if (!user || !activeQuarter) return;
    
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
      setFuelData(fuelEntries || []);
    } catch (error) {
      console.error('Error loading fuel data:', error);
    } finally {
      setFuelDataLoading(false);
    }
  }, [user, activeQuarter]);

  // Handle adding a new trip
  const handleAddTrip = async (tripData) => {
    try {
      await addTrip({
        ...tripData,
        quarter: activeQuarter
      });
      return true;
    } catch (error) {
      console.error('Error adding trip:', error);
      return false;
    }
  };

  // Open the delete confirmation modal
  const handleDeleteTrip = (trip) => {
    setTripToDelete(trip);
    setDeleteModalOpen(true);
  };

  // Confirm deletion of a trip
  const confirmDeleteTrip = async () => {
    if (!tripToDelete) return;
    
    try {
      await deleteTrip(tripToDelete.id);
      setDeleteModalOpen(false);
      setTripToDelete(null);
    } catch (error) {
      console.error('Error deleting trip:', error);
    }
  };

  // Export IFTA data as CSV
  const handleExportData = () => {
    if (!trips || trips.length === 0) return;

    // Create array of data for CSV
    const csvRows = [
      // Header row
      ['Trip ID', 'Date', 'Vehicle ID', 'Start Jurisdiction', 'End Jurisdiction', 'Miles', 'Gallons', 'MPG', 'Fuel Cost'].join(','),
      // Data rows
      ...trips.map(trip => [
        trip.id,
        trip.date,
        trip.vehicleId,
        trip.startJurisdiction,
        trip.endJurisdiction,
        trip.miles,
        trip.gallons,
        (trip.miles / trip.gallons).toFixed(2),
        trip.fuelCost
      ].join(','))
    ];

    // Create blob and download link
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ifta_data_${activeQuarter}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Show loading indicator while checking auth
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
              >
                <FileDown size={16} className="mr-2" />
                Generate Report
              </button>
              <button
                onClick={handleExportData}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none"
              >
                <Download size={16} className="mr-2" />
                Export Data
              </button>
            </div>
          </div>

          {/* Show error if present */}
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
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

          {/* Info Banner */}
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-md mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <Info className="h-5 w-5 text-blue-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  Use this calculator to track your mileage and fuel purchases by jurisdiction for IFTA reporting. 
                  Keep your records up-to-date for easier quarterly filings.
                </p>
              </div>
            </div>
          </div>

          {/* Quarter Selector */}
          <div className="mb-6">
            <QuarterSelector 
              activeQuarter={activeQuarter} 
              setActiveQuarter={setActiveQuarter} 
              isLoading={loading}
            />
          </div>

          {/* IFTA Summary */}
          <div className="mb-6">
            <IFTASummary 
              trips={trips} 
              rates={rates}
              stats={stats}
              isLoading={loading} 
            />
          </div>

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
              isLoading={loading}
            />
          </div>

          {/* State Data Grid */}
          <div className="mb-6">
            <StateDataGrid
              trips={trips}
              rates={rates}
              fuelData={fuelData}
              isLoading={loading || fuelDataLoading}
            />
          </div>

          {/* IFTA Rates Table */}
          <div className="mb-6">
            <IFTARatesTable rates={rates} isLoading={loading} />
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
        message={`Are you sure you want to delete this trip? This action cannot be undone.`}
        itemName={tripToDelete ? `Trip from ${tripToDelete.startJurisdiction} to ${tripToDelete.endJurisdiction}` : ""}
        isDeleting={loading}
      />

      {/* Report Generator Modal */}
      {reportModalOpen && (
        <ReportGenerator
          isOpen={reportModalOpen}
          onClose={() => setReportModalOpen(false)}
          trips={trips}
          rates={rates}
          stats={stats}
          quarter={activeQuarter}
          fuelData={fuelData}
        />
      )}
    </DashboardLayout>
  );
}