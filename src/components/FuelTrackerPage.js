// src/components/FuelTrackerPage.js
import { useState, useEffect, useCallback, useMemo } from "react";
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
  Calculator,
  Download
} from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";

// Import custom hooks and components
import useFuel from "@/hooks/useFuel";
import { usePagination, Pagination, SimplePagination } from "@/hooks/usePagination";
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
import ExportReportModal from "@/components/common/ExportReportModal";
import TutorialCard from "@/components/shared/TutorialCard";
import { MapPin, Receipt, TrendingUp, BarChart } from "lucide-react";

export default function FuelTrackerPage() {
  const router = useRouter();
  const { t } = useTranslation('fuel');

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
  const [exportModalOpen, setExportModalOpen] = useState(false);
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

  // Filter fuel entries based on search
  const filteredFuelEntries = useMemo(() => {
    if (!filters.search) return fuelEntries;

    const searchLower = filters.search.toLowerCase();
    return fuelEntries.filter(entry =>
      (entry.location && entry.location.toLowerCase().includes(searchLower)) ||
      (entry.state && entry.state.toLowerCase().includes(searchLower)) ||
      (entry.vehicle_name && entry.vehicle_name.toLowerCase().includes(searchLower))
    );
  }, [fuelEntries, filters.search]);

  // Pagination
  const {
    paginatedData,
    currentPage,
    totalPages,
    goToPage,
    hasNextPage,
    hasPrevPage,
    showingText,
    pageNumbers,
    totalItems
  } = usePagination(filteredFuelEntries, { itemsPerPage: 10 });

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
          const { data, error } = await supabase
            .from('vehicles')
            .select('id, name, license_plate')
            .eq('user_id', user.id);

          if (!error && data && data.length > 0) {
            setVehicleData(data);
          }
        } catch (vehicleError) {
          // Continue without vehicle data - silently handle error
        }
      } catch (error) {
        // Authentication error - will redirect to login
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
        text: t('operationMessages.entryAddedWithExpense')
      });

      setTimeout(() => setOperationMessage(null), 3000);
      return true;
    } catch (error) {
      setOperationMessage({
        type: 'error',
        text: error.message || t('operationMessages.failedToAdd')
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
        text: t('operationMessages.entryUpdatedSuccess')
      });

      setTimeout(() => setOperationMessage(null), 3000);
      return true;
    } catch (error) {
      setOperationMessage({
        type: 'error',
        text: error.message || t('operationMessages.failedToUpdate')
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
        text: deleteLinkedExpense && fuelEntryToDelete.expense_id
          ? t('operationMessages.entryDeletedWithLinked')
          : t('operationMessages.entryDeletedSuccess')
      });

      // Clear the message after a few seconds
      setTimeout(() => setOperationMessage(null), 3000);
    } catch (error) {
      setOperationMessage({
        type: 'error',
        text: error.message || t('operationMessages.failedToDelete')
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

  // Export columns configuration
  const exportColumns = useMemo(() => [
    { key: 'date', header: t('export.columnDate'), format: 'date' },
    { key: 'location', header: t('export.columnLocation') },
    { key: 'state', header: t('export.columnState') },
    { key: 'gallons', header: t('export.columnGallons'), format: 'number' },
    { key: 'price_per_gallon', header: t('export.columnPricePerGal'), format: 'currency' },
    { key: 'total_amount', header: t('export.columnTotal'), format: 'currency' },
    { key: 'vehicle_name', header: t('export.columnVehicle') }
  ], [t]);

  // Get export data - must be before conditional returns
  const getExportData = useCallback(() => {
    return filteredFuelEntries.map(entry => ({
      date: entry.date || '',
      location: entry.location || '',
      state: entry.state || '',
      gallons: parseFloat(entry.gallons || 0),
      price_per_gallon: parseFloat(entry.price_per_gallon || 0),
      total_amount: parseFloat(entry.total_amount || 0),
      vehicle_name: entry.vehicle_name || ''
    }));
  }, [filteredFuelEntries]);

  // Get export summary info - must be before conditional returns
  const getExportSummaryInfo = useCallback(() => {
    const totalGallons = filteredFuelEntries.reduce((sum, e) => sum + parseFloat(e.gallons || 0), 0);
    const totalAmount = filteredFuelEntries.reduce((sum, e) => sum + parseFloat(e.total_amount || 0), 0);
    const avgPricePerGallon = totalGallons > 0 ? totalAmount / totalGallons : 0;
    const uniqueStates = [...new Set(filteredFuelEntries.map(e => e.state).filter(Boolean))].length;

    return {
      [t('export.totalEntries')]: filteredFuelEntries.length.toString(),
      [t('export.totalGallons')]: totalGallons.toFixed(2),
      [t('export.totalSpent')]: `$${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      [t('export.avgPricePerGal')]: `$${avgPricePerGallon.toFixed(3)}`,
      [t('export.states')]: uniqueStates.toString()
    };
  }, [filteredFuelEntries, t]);

  // Get date range for export - must be before conditional returns
  const getExportDateRange = useCallback(() => {
    if (filteredFuelEntries.length === 0) return null;

    const dates = filteredFuelEntries
      .filter(e => e.date)
      .map(e => new Date(e.date))
      .sort((a, b) => a - b);

    if (dates.length === 0) return null;

    return {
      start: dates[0].toISOString().split('T')[0],
      end: dates[dates.length - 1].toISOString().split('T')[0]
    };
  }, [filteredFuelEntries]);

  // Handle export
  const handleExportData = () => {
    if (filteredFuelEntries.length === 0) return;
    setExportModalOpen(true);
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

    filteredFuelEntries.forEach(entry => {
      if (!stateCategories[entry.state]) {
        stateCategories[entry.state] = 0;
      }
      stateCategories[entry.state] += parseFloat(entry.total_amount);
    });

    return stateCategories;
  };

  // Get the top 3 most expensive fuel entries
  const getTopFuelEntries = () => {
    return [...filteredFuelEntries]
      .sort((a, b) => parseFloat(b.total_amount) - parseFloat(a.total_amount))
      .slice(0, 3);
  };

  return (
    <DashboardLayout activePage="fuel">
      <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <div className="max-w-7xl mx-auto">
          {/* Header with background */}
          <div className="mb-8 bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-700 dark:to-blue-600 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="mb-4 md:mb-0">
                <h1 className="text-3xl font-bold mb-1">{t('page.title')}</h1>
                <p className="text-blue-100 dark:text-blue-200">{t('page.subtitle')}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleExportData}
                  disabled={filteredFuelEntries.length === 0}
                  className="px-4 py-2.5 bg-blue-700 dark:bg-blue-800 text-white rounded-xl hover:bg-blue-800 dark:hover:bg-blue-900 transition-all duration-200 shadow-md flex items-center font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download size={18} className="mr-2" />
                  {t('page.exportButton')}
                </button>
                <button
                  onClick={() => { setCurrentFuelEntry(null); setFormModalOpen(true); }}
                  className="px-4 py-2.5 bg-white text-blue-600 rounded-xl hover:bg-blue-50 transition-all duration-200 shadow-md hover:shadow-lg flex items-center font-semibold"
                >
                  <Plus size={18} className="mr-2" />
                  {t('page.addFuelButton')}
                </button>
                <button
                  onClick={handleGoToIFTA}
                  className="px-4 py-2.5 bg-white/20 backdrop-blur-sm text-white border border-white/30 rounded-xl hover:bg-white/30 transition-all duration-200 shadow-md flex items-center font-semibold"
                >
                  <Calculator size={18} className="mr-2" />
                  {t('page.iftaCalculatorButton')}
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

          {/* Tutorial Card */}
          <TutorialCard
            pageId="fuel"
            title={t('page.title')}
            description={t('page.subtitle')}
            features={[
              {
                icon: Fuel,
                title: t('tutorial.logPurchasesTitle'),
                description: t('tutorial.logPurchasesDescription')
              },
              {
                icon: Receipt,
                title: t('tutorial.receiptUploadTitle'),
                description: t('tutorial.receiptUploadDescription')
              },
              {
                icon: MapPin,
                title: t('tutorial.stateTrackingTitle'),
                description: t('tutorial.stateTrackingDescription')
              },
              {
                icon: Calculator,
                title: t('tutorial.iftaReportsTitle'),
                description: t('tutorial.iftaReportsDescription')
              }
            ]}
            tips={[
              t('tutorial.tipExpenseSync'),
              t('tutorial.tipStateRecord'),
              t('tutorial.tipReceipts'),
              t('tutorial.tipVehicleLink')
            ]}
            accentColor="blue"
            userId={user?.id}
          />

          {/* Statistics */}
          <FuelStats
            stats={stats}
            isLoading={loading}
            period={filters.dateRange === 'This Quarter' ? t('period.thisQuarter') : filters.dateRange === 'Last Quarter' ? t('period.lastQuarter') : t('period.selectedPeriod')}
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
                    {t('page.topFuelPurchases')}
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
                    {t('page.statesTitle')}
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
                    {t('page.filterTitle')}
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
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm mb-6 border border-gray-200 dark:border-gray-700 transition-colors duration-200">
                <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                  <h3 className="font-medium text-gray-700 dark:text-gray-200 flex items-center">
                    <FileText size={18} className="mr-2 text-blue-500 dark:text-blue-400" />
                    {t('page.recordsTitle')}
                  </h3>
                  <button
                    onClick={() => { setCurrentFuelEntry(null); setFormModalOpen(true); }}
                    className="flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                  >
                    <Plus size={16} className="mr-1" />
                    {t('page.addNewButton')}
                  </button>
                </div>
                
                {/* Loading State */}
                {loading ? (
                  <div className="flex justify-center items-center py-12">
                    <RefreshCw size={32} className="animate-spin text-blue-500" />
                  </div>
                ) : filteredFuelEntries.length === 0 ? (
                  <EmptyState
                    message={t('emptyStateMessages.noEntriesFound')}
                    description={
                      filters.search || filters.state || filters.vehicleId || filters.dateRange !== 'This Quarter'
                        ? t('emptyStateMessages.adjustFilters')
                        : t('emptyStateMessages.startTracking')
                    }
                    icon={<Fuel size={28} className="text-gray-400" />}
                    actionText={t('page.addFuelButton')}
                    onAction={() => {
                      setCurrentFuelEntry(null);
                      setFormModalOpen(true);
                    }}
                  />
                ) : (
                  <>
                    {/* Mobile/Tablet Card View */}
                    <div className="xl:hidden p-4 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {paginatedData.map(entry => (
                          <FuelEntryCard
                            key={entry.id}
                            fuelEntry={entry}
                            onEdit={handleEditFuelEntry}
                            onDelete={handleDeleteFuelEntry}
                            onViewReceipt={handleViewReceipt}
                          />
                        ))}
                      </div>

                      {/* Mobile Pagination */}
                      <SimplePagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={goToPage}
                        hasNextPage={hasNextPage}
                        hasPrevPage={hasPrevPage}
                        className="mt-4"
                      />
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden xl:block">
                      <div>
                        <table className="w-full">
                          <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                {t('table.location')}
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                {t('table.date')}
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                {t('table.gallons')}
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                {t('table.amount')}
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                {t('table.vehicle')}
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                {t('table.receipt')}
                              </th>
                              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                {t('table.actions')}
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {paginatedData.map(entry => (
                              <FuelEntryItem
                                key={entry.id}
                                fuelEntry={entry}
                                onEdit={handleEditFuelEntry}
                                onDelete={handleDeleteFuelEntry}
                                onViewReceipt={handleViewReceipt}
                              />
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Table Footer with Pagination */}
                      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
                        <Pagination
                          currentPage={currentPage}
                          totalPages={totalPages}
                          pageNumbers={pageNumbers}
                          onPageChange={goToPage}
                          hasNextPage={hasNextPage}
                          hasPrevPage={hasPrevPage}
                          showingText={showingText}
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Total Summary - Mobile/Tablet Only */}
                {filteredFuelEntries.length > 0 && (
                  <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 flex items-center justify-between xl:hidden">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {t('page.fuelEntriesCount', { count: totalItems })}
                    </span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {t('page.total')} {formatCurrency(filteredFuelEntries.reduce((sum, entry) => sum + parseFloat(entry.total_amount), 0))}
                    </span>
                  </div>
                )}
              </div>

              {/* State Summary */}
              {filteredFuelEntries.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden mb-6 border border-gray-200 dark:border-gray-700 transition-colors duration-200">
                  <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="font-medium flex items-center text-gray-700 dark:text-gray-200">
                      <BarChart2 size={18} className="mr-2 text-blue-500 dark:text-blue-400" />
                      {t('page.iftaStateSummary')}
                    </h3>
                  </div>
                  <div className="p-0">
                    <StateSummary
                      fuelData={filteredFuelEntries}
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

      {/* Export Report Modal */}
      <ExportReportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        title={t('export.title')}
        description={t('export.description')}
        data={getExportData()}
        columns={exportColumns}
        filename="fuel_report"
        summaryInfo={getExportSummaryInfo()}
        dateRange={getExportDateRange()}
        pdfConfig={{
          title: t('export.pdfTitle'),
          subtitle: t('export.pdfSubtitle')
        }}
        onExportComplete={() => {
          setOperationMessage({
            type: 'success',
            text: t('export.success')
          });
          setTimeout(() => setOperationMessage(null), 3000);
        }}
      />
    </DashboardLayout>
  );
}