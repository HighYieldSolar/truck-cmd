// src/components/FuelTrackerPage.js
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Plus, 
  FileDown, 
  Download, 
  Fuel, 
  RefreshCw,
  AlertCircle,
  CheckCircle,
  BarChart2,
  Filter,
  FileText
} from "lucide-react";

// Import custom hooks and components
import useFuel from "@/hooks/useFuel";
import { exportFuelDataForIFTA } from "@/lib/services/fuelService";
import DashboardLayout from "@/components/layout/DashboardLayout";
import FuelStats from "@/components/fuel/FuelStats";
import StateSummary from "@/components/fuel/StateSummary";
import FuelEntryItem from "@/components/fuel/FuelEntryItem";
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
  
  // Export IFTA data
  const handleExportIFTA = async () => {
    try {
      if (!user) return;
      
      const iftaData = await exportFuelDataForIFTA(user.id, filters);
      
      // Create a CSV from the data
      const headers = ['State', 'State Name', 'Gallons', 'Amount', 'Purchases', 'Average Price'];
      const csvRows = [
        headers.join(','), // Header row
        ...iftaData.map(state => [
          state.state,
          `"${state.state_name}"`, // Ensure state names with commas are quoted
          state.gallons.toFixed(3),
          state.amount.toFixed(2),
          state.purchases,
          state.average_price.toFixed(3)
        ].join(','))
      ];
      const csvContent = csvRows.join('\n');

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
      <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-100">
        <div className="max-w-7xl mx-auto">
          {/* Header with background */}
          <div className="mb-8 bg-gradient-to-r from-blue-600 to-blue-400 rounded-xl shadow-md p-6 text-white">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="mb-4 md:mb-0">
                <h1 className="text-3xl font-bold mb-1">Fuel Tracker</h1>
                <p className="text-blue-100">Track fuel purchases and generate IFTA reports by state</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => { setCurrentFuelEntry(null); setFormModalOpen(true); }}
                  className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors shadow-sm flex items-center font-medium"
                >
                  <Plus size={18} className="mr-2" />
                  Add Fuel Purchase
                </button>
                <button 
                  onClick={handleExportIFTA}
                  className="px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors shadow-sm flex items-center font-medium"
                  disabled={fuelEntries.length === 0}
                >
                  <Download size={18} className="mr-2" />
                  Export IFTA
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
            <div className="lg:col-span-1">
              {/* Top 3 Fuel Purchases Card */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6 border border-gray-200">
                <div className="bg-green-500 px-5 py-4 text-white">
                  <h3 className="font-semibold flex items-center">
                    <Fuel size={18} className="mr-2" />
                    Top Fuel Purchases
                  </h3>
                </div>
                <div className="p-4">
                  {loading ? (
                    <div className="flex justify-center items-center py-4">
                      <RefreshCw size={24} className="animate-spin text-gray-400" />
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
              <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6 border border-gray-200">
                <div className="bg-blue-500 px-5 py-4 text-white">
                  <h3 className="font-semibold flex items-center">
                    <BarChart2 size={18} className="mr-2" />
                    States
                  </h3>
                </div>
                <div className="p-4">
                  {loading ? (
                    <div className="flex justify-center items-center py-4">
                      <RefreshCw size={24} className="animate-spin text-gray-400" />
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
              <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6 border border-gray-200">
                <div className="bg-gray-50 px-5 py-4 border-b border-gray-200">
                  <h3 className="font-medium flex items-center text-gray-700">
                    <Filter size={18} className="mr-2 text-gray-500" />
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
              <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6 border border-gray-200">
                <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="font-medium text-gray-700 flex items-center">
                    <FileText size={18} className="mr-2 text-blue-500" />
                    Fuel Purchase Records
                  </h3>
                  <button
                    onClick={() => { setCurrentFuelEntry(null); setFormModalOpen(true); }}
                    className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                  >
                    <Plus size={16} className="mr-1" />
                    Add New
                  </button>
                </div>
                
                <div className="overflow-x-auto">
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
                            {fuelEntries.reduce((sum, entry) => sum + parseFloat(entry.gallons), 0).toFixed(3)} gal
                          </td>
                          <td colSpan="5" className="px-6 py-4 text-left text-sm font-medium text-gray-900">
                            {formatCurrency(fuelEntries.reduce((sum, entry) => sum + parseFloat(entry.total_amount), 0))}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  )}
                </div>
                
                {fuelEntries.length > 0 && (
                  <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      Showing {fuelEntries.length} entries
                    </div>
                    <div className="text-sm font-medium text-gray-700">
                      Total: {formatCurrency(fuelEntries.reduce((sum, entry) => sum + parseFloat(entry.total_amount), 0))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* State Summary */}
              {fuelEntries.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6 border border-gray-200">
                  <div className="px-5 py-4 border-b border-gray-200">
                    <h3 className="font-medium flex items-center text-gray-700">
                      <BarChart2 size={18} className="mr-2 text-blue-500" />
                      IFTA State Summary
                    </h3>
                  </div>
                  <div className="p-0">
                    <StateSummary 
                      fuelData={fuelEntries} 
                      onExportForIFTA={handleExportIFTA}
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