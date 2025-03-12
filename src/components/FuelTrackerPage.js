// Update the FuelTrackerPage.js file to add sync to expenses functionality

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
import { syncFuelToExpenses } from "@/lib/services/expenseFuelIntegration"; // Add this import
import DashboardLayout from "@/components/layout/DashboardLayout";
import FilterBar from "@/components/fuel/FilterBar";
import FuelStats from "@/components/fuel/FuelStats";
import StateSummary from "@/components/fuel/StateSummary";
import FuelEntryItem from "@/components/fuel/FuelEntryItem";
import FuelEntryForm from "@/components/fuel/FuelEntryForm";
import ReceiptViewerModal from "@/components/fuel/ReceiptViewerModal";
import DeleteConfirmationModal from "@/components/common/DeleteConfirmationModal";
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
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [fuelEntryToDelete, setFuelEntryToDelete] = useState(null);
  
  // Add sync to expenses state
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncMessage, setSyncMessage] = useState(null);
  
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
      return true;
    } catch (error) {
      console.error('Error adding fuel entry:', error);
      return false;
    }
  };
  
  // Handle updating a fuel entry
  const handleUpdateFuelEntry = async (id, formData) => {
    try {
      await updateFuelEntry(id, formData);
      return true;
    } catch (error) {
      console.error('Error updating fuel entry:', error);
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
  const confirmDeleteFuelEntry = async () => {
    if (!fuelEntryToDelete) return;
    
    try {
      await deleteFuelEntry(fuelEntryToDelete.id);
      setDeleteModalOpen(false);
      setFuelEntryToDelete(null);
    } catch (error) {
      console.error('Error deleting fuel entry:', error);
    }
  };
  
  // Open the receipt viewer modal
  const handleViewReceipt = (fuelEntry) => {
    setSelectedReceipt(fuelEntry);
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
  
  // Handle syncing fuel entry to expenses
  const handleSyncToExpense = async (fuelEntry) => {
    if (!user || !fuelEntry) return;
    
    try {
      setSyncLoading(true);
      setSyncMessage(null);
      
      // Call the sync function for a single fuel entry
      const result = await syncSingleFuelEntryToExpense(user.id, fuelEntry.id);
      
      // Reload fuel entries to update the UI
      await loadFuelEntries(filters);
      
      setSyncMessage({
        type: 'success',
        text: `Successfully synced fuel entry to expenses.`
      });
      
      // Clear the success message after 3 seconds
      setTimeout(() => setSyncMessage(null), 3000);
      
      return result;
    } catch (error) {
      console.error('Error syncing to expense:', error);
      setSyncMessage({
        type: 'error',
        text: `Error syncing to expenses: ${error.message}`
      });
    } finally {
      setSyncLoading(false);
    }
  };
  
  // Sync a single fuel entry to expenses
  const syncSingleFuelEntryToExpense = async (userId, fuelEntryId) => {
    try {
      // Get the specific fuel entry
      const { data: fuelEntry, error: fuelError } = await supabase
        .from('fuel_entries')
        .select('*')
        .eq('id', fuelEntryId)
        .single();
        
      if (fuelError) throw fuelError;
      
      if (!fuelEntry) {
        throw new Error('Fuel entry not found');
      }
      
      // Create expense entry
      const expenseData = {
        user_id: userId,
        description: `Fuel - ${fuelEntry.location}`,
        amount: fuelEntry.total_amount,
        date: fuelEntry.date,
        category: 'Fuel',
        payment_method: fuelEntry.payment_method || 'Credit Card',
        notes: `Vehicle: ${fuelEntry.vehicle_id}, ${fuelEntry.gallons} gallons at ${fuelEntry.state}`,
        receipt_image: fuelEntry.receipt_image,
        vehicle_id: fuelEntry.vehicle_id,
        deductible: true // Fuel is typically deductible for business
      };
      
      // Insert expense
      const { data: expense, error: expenseError } = await supabase
        .from('expenses')
        .insert([expenseData])
        .select();
        
      if (expenseError) throw expenseError;
      
      if (!expense || expense.length === 0) {
        throw new Error('Failed to create expense');
      }
      
      // Update fuel entry with expense_id reference
      const { error: updateError } = await supabase
        .from('fuel_entries')
        .update({ expense_id: expense[0].id })
        .eq('id', fuelEntryId);
        
      if (updateError) throw updateError;
      
      return expense[0];
    } catch (error) {
      console.error('Error syncing single fuel entry:', error);
      throw error;
    }
  };
  
  // Sync all fuel entries to expenses
  const handleSyncAllToExpenses = async () => {
    if (!user) return;
    
    try {
      setSyncLoading(true);
      setSyncMessage(null);
      
      // Call the syncFuelToExpenses function from the service
      const result = await syncFuelToExpenses(user.id);
      
      // Reload fuel entries to update the UI
      await loadFuelEntries(filters);
      
      setSyncMessage({
        type: 'success',
        text: `Successfully synced ${result.syncedCount} fuel entries to expenses.`
      });
      
      // Clear the success message after 5 seconds
      setTimeout(() => setSyncMessage(null), 5000);
    } catch (error) {
      console.error('Error syncing to expenses:', error);
      setSyncMessage({
        type: 'error',
        text: `Error syncing to expenses: ${error.message}`
      });
    } finally {
      setSyncLoading(false);
    }
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
    } catch (error) {
      console.error('Error exporting IFTA data:', error);
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
              <button
                onClick={handleSyncAllToExpenses}
                disabled={syncLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-purple-700 bg-purple-100 hover:bg-purple-200 focus:outline-none"
              >
                {syncLoading ? (
                  <RefreshCw size={16} className="mr-2 animate-spin" />
                ) : (
                  <RefreshCw size={16} className="mr-2" />
                )}
                Sync All to Expenses
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
          
          {/* Show sync message if present */}
          {syncMessage && (
            <div className={`mb-6 ${
              syncMessage.type === 'success' 
                ? 'bg-green-50 border-l-4 border-green-400' 
                : 'bg-red-50 border-l-4 border-red-400'
            } p-4 rounded-md`}>
              <div className="flex">
                <div className="flex-shrink-0">
                  {syncMessage.type === 'success' ? (
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-400" />
                  )}
                </div>
                <div className="ml-3">
                  <p className={`text-sm ${
                    syncMessage.type === 'success' ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {syncMessage.text}
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
                        onSyncToExpense={handleSyncToExpense}
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
        vehicles={vehicles}
      />
      
      <ReceiptViewerModal
        isOpen={receiptViewerOpen}
        onClose={() => {
          setReceiptViewerOpen(false);
          setSelectedReceipt(null);
        }}
        receipt={selectedReceipt}
      />
      
      <DeleteConfirmationModal 
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setFuelEntryToDelete(null);
        }}
        onConfirm={confirmDeleteFuelEntry}
        title="Delete Fuel Purchase"
        itemName={fuelEntryToDelete?.location}
        isDeleting={loading}
      />
    </DashboardLayout>
  );
}