// src/components/FuelTrackerPage.js
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Fuel,
  RefreshCw,
  BarChart2,
  Filter,
  FileText,
  Calculator
} from "lucide-react";

// Import custom hooks and components
import useFuel from "@/hooks/useFuel";
import DashboardLayout from "@/components/layout/DashboardLayout";
import FuelStats from "@/components/fuel/FuelStats";
import StateSummary from "@/components/fuel/StateSummary";
import FuelEntryItem from "@/components/fuel/FuelEntryItem";
import FuelEntryCard from "@/components/fuel/FuelEntryCard";
import FuelEntryForm from "@/components/fuel/FuelEntryForm";
import ReceiptViewerModal from "@/components/fuel/ReceiptViewerModal";
import FuelDeletionModal from "@/components/fuel/FuelDeletionModal";
import EmptyState from "@/components/common/EmptyState";
import StatusAlert from "@/components/common/StatusAlert";
import FuelFilterBar from "@/components/fuel/FuelFilterBar";
import FuelCategories from "@/components/fuel/FuelCategories";
import TopFuelEntries from "@/components/fuel/TopFuelEntries";
import FuelChart from "@/components/fuel/FuelChart";

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
    setSelectedReceipt(fuelEntry);
    setSelectedVehicleInfo(vehicleInfo);
    setReceiptViewerOpen(true);
  };

  // State selection filter
  const handleStateSelect = (state) => {
    setFilters(prev => ({
      ...prev,
      state: state === 'All' ? '' : state
    }));
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
  
  // Navigate to IFTA Calculator page
  const handleGoToIFTA = () => {
    router.push('/dashboard/ifta');
  };
  
  // Format currency 
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };
  
  // Show loading indicator while checking auth
  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  // Generate state categories for the sidebar
  const generateStateCategories = () => {
    // Group by state and calculate total per state
    const stateCategories = {};
    
    fuelEntries.forEach(entry => {
      if (!stateCategories[entry.state]) {
        stateCategories[entry.state] = 0;
      }
      stateCategories[entry.state] += parseFloat(entry.total_amount);
    });
    
    return stateCategories;
  };
  
  // Get the top 3 most expensive fuel entries
  const getTopFuelEntries = () => {
    return [...fuelEntries]
      .sort((a, b) => parseFloat(b.total_amount) - parseFloat(a.total_amount))
      .slice(0, 3);
  };

  return (
    <DashboardLayout activePage="fuel">
      <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
        <div className="max-w-7xl mx-auto">
          {/* Header with background */}
          <div className="mb-8 bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-700 dark:to-blue-600 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="mb-4 md:mb-0">
                <h1 className="text-3xl font-bold mb-1">Fuel Tracker</h1>
                <p className="text-blue-100 dark:text-blue-200">Track fuel purchases and generate IFTA reports by state</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => { setCurrentFuelEntry(null); setFormModalOpen(true); }}
                  className="px-4 py-2.5 bg-white text-blue-600 rounded-xl hover:bg-blue-50 transition-all duration-200 shadow-md hover:shadow-lg flex items-center font-semibold"
                >
                  <Plus size={18} className="mr-2" />
                  Add Fuel Purchase
                </button>
                <button
                  onClick={handleGoToIFTA}
                  className="px-4 py-2.5 bg-white/20 backdrop-blur-sm text-white border border-white/30 rounded-xl hover:bg-white/30 transition-all duration-200 shadow-md flex items-center font-semibold"
                >
                  <Calculator size={18} className="mr-2" />
                  IFTA Calculator
                </button>
              </div>
            </div>
          </div>

          {/* Status messages */}
          {error && (
            <div className="mb-6">
              <StatusAlert 
                type="error"
                message={error}
                onClose={() => setError(null)}
              />
            </div>
          )}
          
          {operationMessage && (
            <div className="mb-6">
              <StatusAlert 
                type={operationMessage.type}
                message={operationMessage.text}
                onClose={() => setOperationMessage(null)}
                duration={5000}
              />
            </div>
          )}

          {/* Statistics */}
          <FuelStats 
            stats={stats}
            isLoading={loading} 
            period={filters.dateRange === 'This Quarter' ? 'This Quarter' : filters.dateRange === 'Last Quarter' ? 'Last Quarter' : 'Selected Period'}
            className="mb-6" 
          />

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Top 3 Fuel Purchases Card */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700 transition-colors duration-200">
                <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                  <h3 className="font-semibold text-gray-800 dark:text-gray-100 flex items-center">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center mr-3">
                      <Fuel size={16} className="text-amber-600 dark:text-amber-400" />
                    </div>
                    Top Fuel Purchases
                  </h3>
                </div>
                <div className="p-4">
                  {loading ? (
                    <div className="flex justify-center items-center py-8">
                      <RefreshCw size={24} className="animate-spin text-gray-400 dark:text-gray-500" />
                    </div>
                  ) : (
                    <TopFuelEntries
                      entries={getTopFuelEntries()}
                      onViewReceipt={handleViewReceipt}
                      onEditFuelEntry={handleEditFuelEntry}
                    />
                  )}
                </div>
              </div>

              {/* States Categories */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700 transition-colors duration-200">
                <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                  <h3 className="font-semibold text-gray-800 dark:text-gray-100 flex items-center">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center mr-3">
                      <BarChart2 size={16} className="text-purple-600 dark:text-purple-400" />
                    </div>
                    States
                  </h3>
                </div>
                <div className="p-4">
                  {loading ? (
                    <div className="flex justify-center items-center py-8">
                      <RefreshCw size={24} className="animate-spin text-gray-400 dark:text-gray-500" />
                    </div>
                  ) : (
                    <FuelCategories
                      categories={generateStateCategories()}
                      onCategorySelect={handleStateSelect}
                      selectedCategory={filters.state || 'All'}
                    />
                  )}
                </div>
              </div>
            </div>
            
            {/* Main Content */}
            <div className="lg:col-span-3">
              {/* Filters */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden mb-6 border border-gray-200 dark:border-gray-700 transition-colors duration-200">
                <div className="bg-gray-50 dark:bg-gray-700/50 px-5 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="font-medium flex items-center text-gray-700 dark:text-gray-200">
                    <Filter size={18} className="mr-2 text-gray-500 dark:text-gray-400" />
                    Filter Fuel Purchases
                  </h3>
                </div>
                <div className="p-4">
                  <FuelFilterBar
                    filters={filters}
                    setFilters={setFilters}
                    vehicles={vehicleData}
                    onReset={handleResetFilters}
                  />
                </div>
              </div>
              
              {/* Fuel Entries Records */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden mb-6 border border-gray-200 dark:border-gray-700 transition-colors duration-200">
                <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                  <h3 className="font-medium text-gray-700 dark:text-gray-200 flex items-center">
                    <FileText size={18} className="mr-2 text-blue-500 dark:text-blue-400" />
                    Fuel Purchase Records
                  </h3>
                  <button
                    onClick={() => { setCurrentFuelEntry(null); setFormModalOpen(true); }}
                    className="flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                  >
                    <Plus size={16} className="mr-1" />
                    Add New
                  </button>
                </div>
                
                {/* Loading State */}
                {loading ? (
                  <div className="flex justify-center items-center py-12">
                    <RefreshCw size={32} className="animate-spin text-blue-500" />
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
                  <>
                    {/* Mobile Card View - Hidden on lg screens */}
                    <div className="lg:hidden p-4 space-y-3">
                      {fuelEntries.map(entry => (
                        <FuelEntryCard
                          key={entry.id}
                          fuelEntry={entry}
                          onEdit={handleEditFuelEntry}
                          onDelete={handleDeleteFuelEntry}
                          onViewReceipt={handleViewReceipt}
                        />
                      ))}
                      {/* Mobile Total Summary */}
                      <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl p-4 text-white">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="text-blue-100 text-sm">Total ({fuelEntries.length} entries)</div>
                            <div className="text-2xl font-bold">
                              {formatCurrency(fuelEntries.reduce((sum, entry) => sum + parseFloat(entry.total_amount), 0))}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-blue-100 text-sm">Gallons</div>
                            <div className="text-xl font-semibold">
                              {fuelEntries.reduce((sum, entry) => sum + parseFloat(entry.gallons), 0).toFixed(1)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Desktop Table View - Hidden on mobile */}
                    <div className="hidden lg:block overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700">
                        <thead>
                          <tr className="bg-gray-50/80 dark:bg-gray-700/50">
                            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                              Location
                            </th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                              Date
                            </th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                              Gallons
                            </th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                              Amount
                            </th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                              Vehicle
                            </th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                              Receipt / Status
                            </th>
                            <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
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
                        <tfoot className="bg-gray-50 dark:bg-gray-700/50">
                          <tr>
                            <td colSpan="2" className="px-4 py-4 text-left text-sm font-medium text-gray-900 dark:text-gray-100">
                              Total
                            </td>
                            <td className="px-4 py-4 text-left text-sm font-medium text-gray-900 dark:text-gray-100">
                              {fuelEntries.reduce((sum, entry) => sum + parseFloat(entry.gallons), 0).toFixed(3)} gal
                            </td>
                            <td colSpan="4" className="px-4 py-4 text-left text-sm font-medium text-gray-900 dark:text-gray-100">
                              {formatCurrency(fuelEntries.reduce((sum, entry) => sum + parseFloat(entry.total_amount), 0))}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </>
                )}
                
                {/* Desktop Footer - Hidden on mobile since we have summary card */}
                {fuelEntries.length > 0 && (
                  <div className="hidden lg:flex px-6 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 items-center justify-between">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Showing {fuelEntries.length} entries
                    </div>
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      Total: {formatCurrency(fuelEntries.reduce((sum, entry) => sum + parseFloat(entry.total_amount), 0))}
                    </div>
                  </div>
                )}
              </div>

              {/* State Summary */}
              {fuelEntries.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden mb-6 border border-gray-200 dark:border-gray-700 transition-colors duration-200">
                  <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="font-medium flex items-center text-gray-700 dark:text-gray-200">
                      <BarChart2 size={18} className="mr-2 text-blue-500 dark:text-blue-400" />
                      IFTA State Summary
                    </h3>
                  </div>
                  <div className="p-0">
                    <StateSummary
                      fuelData={fuelEntries}
                      onExportForIFTA={handleGoToIFTA}
                    />
                  </div>
                </div>
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
        vehicles={vehicles}
      />

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