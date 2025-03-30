// src/components/FuelTrackerPage.js - Modified to use the enhanced VehicleSelector
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Plus, 
  FileDown, 
  Download, 
  Fuel, 
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle
} from "lucide-react";

// Import custom hooks and components
import useFuel from "@/hooks/useFuel";
import { exportFuelDataForIFTA } from "@/lib/services/fuelService";
import DashboardLayout from "@/components/layout/DashboardLayout";
import FilterBar from "@/components/fuel/FilterBar";
import FuelStats from "@/components/fuel/FuelStats";
import StateSummary from "@/components/fuel/StateSummary";
import FuelEntryItem from "@/components/fuel/FuelEntryItem";
// Import updated components
import FuelEntryForm from "@/components/fuel/FuelEntryForm";
import ReceiptViewerModal from "@/components/fuel/ReceiptViewerModal";
import FuelDeletionModal from "@/components/fuel/FuelDeletionModal";
import EmptyState from "@/components/common/EmptyState";

export default function FuelTrackerPage() {
  const router = useRouter();
  
  // State for user authentication
  const [user, setUser] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  
  // Filters state
  const [filters, setFilters] = useState({
    search: "",
    state: "",
    dateRange: "This Quarter",
    startDate: "",
    endDate: "",
    vehicleId: ""
  });
  
  // Modal states
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [currentFuelEntry, setCurrentFuelEntry] = useState(null);
  const [receiptViewerOpen, setReceiptViewerOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [selectedVehicleInfo, setSelectedVehicleInfo] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [fuelEntryToDelete, setFuelEntryToDelete] = useState(null);
  
  // Add dedicated loading state for deletion
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // State for showing operation messages
  const [operationMessage, setOperationMessage] = useState(null);
  
  // State for vehicle data
  const [vehicleData, setVehicleData] = useState([]);
  
  // Get the fuel data and functions from our custom hook
  const {
    fuelEntries,
    stats,
    vehicles,
    loading,
    error,
    loadFuelEntries,
    addFuelEntry,
    updateFuelEntry,
    deleteFuelEntry
  } = useFuel(user?.id);
  
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
        
        // Load vehicles for the selector
        try {
          // First try to get trucks from the vehicles table
          let { data, error } = await supabase
            .from('vehicles')
            .select('id, name, license_plate')
            .eq('user_id', user.id);
          
          // If that fails, try the trucks table instead
          if (error || !data || data.length === 0) {
            const { data: trucksData, error: trucksError } = await supabase
              .from('trucks')
              .select('id, name, license_plate')
              .eq('user_id', user.id);
              
            if (!trucksError) {
              data = trucksData;
            }
          }
          
          // If we found vehicle data, save it
          if (data && data.length > 0) {
            setVehicleData(data);
          }
        } catch (vehicleError) {
          console.error("Error loading vehicles:", vehicleError);
          // Continue without vehicle data
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
      } finally {
        setInitialLoading(false);
      }
    }
    
    checkAuth();
  }, [router]);
  
  // Load fuel entries when filters change
  useEffect(() => {
    if (user) {
      loadFuelEntries(filters);
    }
  }, [user, filters, loadFuelEntries]);
  
  // Handle adding a new fuel entry
  const handleAddFuelEntry = async (formData) => {
    try {
      await addFuelEntry(formData);
      
      setOperationMessage({
        type: 'success',
        text: 'Fuel entry added and expense record created.'
      });
      
      setTimeout(() => setOperationMessage(null), 3000);
      return true;
    } catch (error) {
      console.error('Error adding fuel entry:', error);
      
      setOperationMessage({
        type: 'error',
        text: `Error adding fuel entry: ${error.message}`
      });
      
      setTimeout(() => setOperationMessage(null), 5000);
      return false;
    }
  };
  
  // Handle updating a fuel entry
  const handleUpdateFuelEntry = async (id, formData) => {
    try {
      await updateFuelEntry(id, formData);
      
      setOperationMessage({
        type: 'success',
        text: 'Fuel entry updated successfully.'
      });
      
      setTimeout(() => setOperationMessage(null), 3000);
      return true;
    } catch (error) {
      console.error('Error updating fuel entry:', error);
      
      setOperationMessage({
        type: 'error',
        text: `Error updating fuel entry: ${error.message}`
      });
      
      setTimeout(() => setOperationMessage(null), 5000);
      return false;
    }
  };
  
  // Handle saving a fuel entry (either new or edit)
  const handleSaveFuelEntry = async (formData) => {
    if (currentFuelEntry) {
      return handleUpdateFuelEntry(currentFuelEntry.id, formData);
    } else {
      return handleAddFuelEntry(formData);
    }
  };
  
  // Open the form modal for editing a fuel entry
  const handleEditFuelEntry = (fuelEntry) => {
    setCurrentFuelEntry(fuelEntry);
    setFormModalOpen(true);
  };
  
  // Open the delete confirmation modal
  const handleDeleteFuelEntry = (fuelEntry) => {
    setFuelEntryToDelete(fuelEntry);
    setDeleteModalOpen(true);
  };
  
  // Confirm deletion of a fuel entry
  const handleConfirmDelete = async (deleteLinkedExpense = false) => {
    if (!fuelEntryToDelete) return;
    
    try {
      setDeleteLoading(true); // Use dedicated loading state for deletion
      
      // Pass the deleteLinkedExpense flag to the deleteFuelEntry function
      await deleteFuelEntry(fuelEntryToDelete.id, deleteLinkedExpense);
      
      setDeleteModalOpen(false);
      setFuelEntryToDelete(null);
      
      // Show a success message
      setOperationMessage({
        type: 'success',
        text: `Fuel entry deleted successfully${deleteLinkedExpense && fuelEntryToDelete.expense_id ? ' along with linked expense' : ''}.`
      });
      
      // Clear the message after a few seconds
      setTimeout(() => setOperationMessage(null), 3000);
    } catch (error) {
      console.error('Error deleting fuel entry:', error);
      setOperationMessage({
        type: 'error',
        text: `Error deleting fuel entry: ${error.message}`
      });
    } finally {
      setDeleteLoading(false);
    }
  };
  
  // Open the receipt viewer modal
  const handleViewReceipt = (fuelEntry, vehicleInfo) => {
    console.log("Opening receipt viewer with:", { fuelEntry, vehicleInfo });
    // Add additional logging to verify receipt image URL
    if (fuelEntry?.receipt_image) {
      console.log("Receipt image URL:", fuelEntry.receipt_image);
    }
    
    setSelectedReceipt(fuelEntry);
    setSelectedVehicleInfo(vehicleInfo);
    setReceiptViewerOpen(true);
  };

  
  // Reset all filters
  const handleResetFilters = () => {
    setFilters({
      search: "",
      state: "",
      dateRange: "This Quarter",
      startDate: "",
      endDate: "",
      vehicleId: ""
    });
  };
  
  // Export IFTA data
  const handleExportIFTA = async () => {
    try {
      if (!user) return;
      
      const iftaData = await exportFuelDataForIFTA(user.id, filters);
      
      // Create a CSV from the data
      const headers = ['State', 'State Name', 'Gallons', 'Amount', 'Purchases', 'Average Price'];
      const csvContent = [
        headers.join(','),
        ...iftaData.map(state => [
          state.state,
          state.state_name,
          state.gallons.toFixed(3),
          state.amount.toFixed(2),
          state.purchases,
          state.average_price.toFixed(3)
        ].join(','))
      ].join('\n');
      
      // Create a download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `fuel_ifta_data_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setOperationMessage({
        type: 'success',
        text: 'IFTA data exported successfully.'
      });
      
      setTimeout(() => setOperationMessage(null), 3000);
    } catch (error) {
      console.error('Error exporting IFTA data:', error);
      
      setOperationMessage({
        type: 'error',
        text: `Error exporting IFTA data: ${error.message}`
      });
      
      setTimeout(() => setOperationMessage(null), 5000);
    }
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
    <DashboardLayout activePage="fuel tracker">
      <main className="flex-1 overflow-y-auto p-4 bg-gray-100">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Fuel Tracker</h1>
              <p className="text-gray-600">Track fuel purchases by state for IFTA reporting</p>
            </div>
            <div className="mt-4 md:mt-0 flex flex-wrap gap-3">
              <button
                onClick={() => {
                  setCurrentFuelEntry(null);
                  setFormModalOpen(true);
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
              >
                <Plus size={16} className="mr-2" />
                Add Fuel Purchase
              </button>
              <button
                onClick={handleExportIFTA}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none"
              >
                <Download size={16} className="mr-2" />
                Export IFTA
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
          
          {/* Show operation message if present */}
          {operationMessage && (
            <div className={`mb-6 ${
              operationMessage.type === 'success' 
                ? 'bg-green-50 border-l-4 border-green-400' 
                : operationMessage.type === 'warning'
                ? 'bg-yellow-50 border-l-4 border-yellow-400'
                : 'bg-red-50 border-l-4 border-red-400'
            } p-4 rounded-md`}>
              <div className="flex">
                <div className="flex-shrink-0">
                  {operationMessage.type === 'success' ? (
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  ) : operationMessage.type === 'warning' ? (
                    <AlertCircle className="h-5 w-5 text-yellow-400" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-400" />
                  )}
                </div>
                <div className="ml-3">
                  <p className={`text-sm ${
                    operationMessage.type === 'success' ? 'text-green-700' : 
                    operationMessage.type === 'warning' ? 'text-yellow-700' :
                    'text-red-700'
                  }`}>
                    {operationMessage.text}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Fuel Stats */}
          <FuelStats 
            stats={stats} 
            isLoading={loading} 
            period={filters.dateRange === 'This Quarter' ? 'This Quarter' : filters.dateRange === 'Last Quarter' ? 'Last Quarter' : 'Selected Period'} 
          />

          {/* Filters */}
          <FilterBar 
            filters={filters} 
            setFilters={setFilters} 
            vehicles={vehicles} 
            onReset={handleResetFilters} 
          />
          
          {/* Per-state Summary */}
          {fuelEntries.length > 0 && (
            <div className="mb-6">
              <StateSummary 
                fuelData={fuelEntries} 
                onExportForIFTA={handleExportIFTA} 
              />
            </div>
          )}
          
          {/* Fuel Entries Table */}
          <div className="bg-white shadow overflow-hidden rounded-md mb-6">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Fuel Purchases</h3>
              <div className="text-sm text-gray-500">
                Showing {fuelEntries.length} entries
              </div>
            </div>
            
            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-8 text-center">
                  <RefreshCw size={32} className="animate-spin mx-auto mb-4 text-blue-500" />
                  <p className="text-gray-500">Loading fuel purchases...</p>
                </div>
              ) : fuelEntries.length === 0 ? (
                <EmptyState 
                  message="No fuel entries found"
                  description={
                    filters.search || filters.state || filters.vehicleId || filters.dateRange !== 'This Quarter'
                      ? "Try adjusting your search or filters."
                      : "Start tracking your fuel purchases by adding your first entry."
                  }
                  icon={<Fuel size={28} className="text-gray-400" />}
                  actionText="Add Fuel Purchase"
                  onAction={() => {
                    setCurrentFuelEntry(null);
                    setFormModalOpen(true);
                  }}
                />
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Gallons
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Vehicle
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Receipt
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Expense Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {fuelEntries.map(entry => (
                      <FuelEntryItem 
                        key={entry.id} 
                        fuelEntry={entry} 
                        onEdit={handleEditFuelEntry}
                        onDelete={handleDeleteFuelEntry}
                        onViewReceipt={handleViewReceipt}
                      />
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan="2" className="px-6 py-4 text-left text-sm font-medium text-gray-900">
                        Total
                      </td>
                      <td className="px-6 py-4 text-left text-sm font-medium text-gray-900">
                        {fuelEntries.reduce((sum, entry) => sum + entry.gallons, 0).toFixed(3)} gal
                      </td>
                      <td colSpan="5" className="px-6 py-4 text-left text-sm font-medium text-gray-900">
                        ${fuelEntries.reduce((sum, entry) => sum + entry.total_amount, 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          </div>
        </div>
      </main>

{/* Modals */}
<FuelEntryForm 
  isOpen={formModalOpen}
  onClose={() => {
    setFormModalOpen(false);
    setCurrentFuelEntry(null);
  }}
  fuelEntry={currentFuelEntry}
  onSave={handleSaveFuelEntry}
  isSubmitting={loading}
  vehicles={vehicles} // This is still needed but only for compatibility
/>

  {/* ReceiptViewerModal */}
  <ReceiptViewerModal
    isOpen={receiptViewerOpen}
    onClose={() => {
      setReceiptViewerOpen(false);
      setSelectedReceipt(null);
      setSelectedVehicleInfo(null);
    }}
    receipt={selectedReceipt}
    vehicleInfo={selectedVehicleInfo}
  />
      
      {/* Custom Fuel Deletion Modal */}
      <FuelDeletionModal 
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setFuelEntryToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        fuelEntry={fuelEntryToDelete}
        isDeleting={deleteLoading}
      />
    </DashboardLayout>
  );
}