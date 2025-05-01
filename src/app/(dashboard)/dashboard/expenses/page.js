// src/app/(dashboard)/dashboard/expenses/page.js
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";

// Import expense service functions
import { 
  fetchExpenses, 
  getExpenseStats,
  deleteExpense 
} from "@/lib/services/expenseService";

// Import components
import ExpenseFormModal from "@/components/expenses/ExpenseFormModal";
import DeleteConfirmationModal from "@/components/common/DeleteConfirmationModal";
import ReceiptViewer from "@/components/expenses/ReceiptViewer";
import ExpenseItem from "@/components/expenses/ExpenseItem";
import ExpenseChart from "@/components/expenses/ExpenseChart";
import ExpenseSummary from "@/components/expenses/ExpenseSummary";
import ExpenseCategories from "@/components/expenses/ExpenseCategories";
import TopExpenses from "@/components/expenses/TopExpenses";
import ExpenseFilters from "@/components/expenses/ExpenseFilters";

// Import icons
import { 
  Plus, 
  FileText, 
  RefreshCw,
  AlertCircle,
  Wallet,
  BarChart2,
  Filter,
  Download,
  ArrowRight
} from "lucide-react";

export default function ExpensesPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    topCategory: null,
    dailyAverage: 0,
    byCategory: {}
  });
  
  // Filter states
  const [filters, setFilters] = useState({
    search: "",
    category: "All",
    dateRange: "This Month",
    startDate: "",
    endDate: "",
    sortBy: "date",
    sortDirection: "desc"
  });
  
  // Modal states
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [currentExpense, setCurrentExpense] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const [receiptViewerOpen, setReceiptViewerOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState(null);

  // Check if the user is authenticated
  useEffect(() => {
    async function checkAuth() {
      try {
        setLoading(true);
        
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
          throw error;
        }
        
        if (!user) {
          // Redirect to login if not authenticated
          router.push('/login');
          return;
        }
        
        console.log("Authenticated user:", user.id);
        setUser(user);
      } catch (error) {
        console.error('Error checking authentication:', error);
        setError('Authentication error. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    
    checkAuth();
  }, [router]);

  // Load expenses and stats when user or filters change
  useEffect(() => {
    if (!user) return;
    
    async function loadData() {
      try {
        console.log("Loading expenses data for user:", user.id);
        setDataLoading(true);
        setError(null);
        
        // Fetch all expenses for the current user
        const expensesData = await fetchExpenses(user.id, filters);
        console.log("Fetched expenses:", expensesData);
        
        // Set both the raw and filtered expenses
        setExpenses(expensesData || []);
        setFilteredExpenses(expensesData || []);
        
        // Get the expense statistics
        const period = filters.dateRange === 'Custom' ? 'custom' : 
                      filters.dateRange === 'This Month' ? 'month' : 
                      filters.dateRange === 'This Quarter' ? 'quarter' : 'year';
        
        const statsData = await getExpenseStats(user.id, period);
        console.log("Expense stats:", statsData);
        
        // Find top category
        let topCategory = null;
        let maxAmount = 0;
        
        for (const [category, amount] of Object.entries(statsData.byCategory)) {
          if (amount > maxAmount) {
            maxAmount = amount;
            topCategory = { name: category, amount };
          }
        }
        
        // Calculate daily average
        const now = new Date();
        const daysInPeriod = filters.dateRange === 'This Month' ? 
          new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() : 
          filters.dateRange === 'This Quarter' ? 90 : 365;
        
        const dailyAverage = statsData.total / daysInPeriod;
        
        setStats({
          total: statsData.total,
          topCategory,
          dailyAverage,
          byCategory: statsData.byCategory,
          monthlyTrend: statsData.monthlyTrend || 0
        });
        
      } catch (error) {
        console.error('Error loading expenses:', error);
        setError('Failed to load expenses: ' + (error.message || 'Unknown error'));
      } finally {
        setDataLoading(false);
      }
    }
    
    loadData();
  }, [user, filters]);

  // Handle search input change
  const handleSearchChange = (e) => {
    const searchTerm = e.target.value;
    
    setFilters(prevFilters => ({
      ...prevFilters,
      search: searchTerm
    }));
    
    // Apply search filter immediately
    if (expenses && expenses.length > 0) {
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const filtered = expenses.filter(expense => 
          (expense.description && expense.description.toLowerCase().includes(searchLower)) ||
          (expense.category && expense.category.toLowerCase().includes(searchLower)) ||
          (expense.payment_method && expense.payment_method.toLowerCase().includes(searchLower))
        );
        setFilteredExpenses(filtered);
      } else {
        // If search is cleared, restore all expenses
        setFilteredExpenses(expenses);
      }
    }
  };

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle date range change
  const handleDateRangeChange = (value) => {
    setFilters(prev => ({
      ...prev,
      dateRange: value
    }));
  };

  // Handle custom date change
  const handleCustomDateChange = (startDate, endDate) => {
    setFilters(prev => ({
      ...prev,
      dateRange: 'Custom',
      startDate,
      endDate
    }));
  };

  // Reset all filters
  const handleResetFilters = () => {
    const defaultFilters = {
      search: "",
      category: "All",
      dateRange: "This Month",
      startDate: "",
      endDate: "",
      sortBy: "date",
      sortDirection: "desc"
    };
    setFilters(defaultFilters);
  };

  // Handle category selection
  const handleCategorySelect = (category) => {
    setFilters(prev => ({
      ...prev,
      category
    }));
  };

  // Modal handlers
  const handleAddExpense = () => {
    setCurrentExpense(null);
    setFormModalOpen(true);
  };

  const handleEditExpense = (expense) => {
    console.log("Editing expense:", expense);
    setCurrentExpense({...expense});
    setFormModalOpen(true);
  };

  const handleDeleteExpense = (expense) => {
    console.log("Preparing to delete expense:", expense);
    setExpenseToDelete(expense);
    setDeleteModalOpen(true);
  };
  
  const handleViewReceipt = (expense) => {
    console.log("Viewing receipt for expense:", expense);
    setSelectedReceipt(expense);
    setReceiptViewerOpen(true);
  };

  // Handle saving an expense (either create or update)
  const handleSaveExpense = async (expense) => {
    console.log('Expense saved successfully:', expense);
    
    // Force immediate refresh
    try {
      setDataLoading(true);
      const refreshedData = await fetchExpenses(user.id, filters);
      setExpenses(refreshedData || []);
      setFilteredExpenses(refreshedData || []);
    } catch (error) {
      console.error("Error refreshing expenses after save:", error);
    } finally {
      setDataLoading(false);
      setFormModalOpen(false);
    }
  };

  // Handle confirming expense deletion
  const handleConfirmDelete = async () => {
    if (!expenseToDelete) return;
    
    try {
      setIsDeleting(true);
      console.log("Deleting expense:", expenseToDelete.id);
      
      await deleteExpense(expenseToDelete.id);
      
      // Force immediate refresh
      const refreshedData = await fetchExpenses(user.id, filters);
      setExpenses(refreshedData || []);
      setFilteredExpenses(refreshedData || []);
      
      setDeleteModalOpen(false);
      setExpenseToDelete(null);
    } catch (error) {
      console.error('Error deleting expense:', error);
      setError('Failed to delete expense: ' + (error.message || 'Unknown error'));
    } finally {
      setIsDeleting(false);
    }
  };

  // Initialize Supabase realtime subscription for expenses
  useEffect(() => {
    if (!user) return;
    
    // Subscribe to expense changes with enhanced debug logging
    console.log(`Setting up expense subscription for user: ${user.id}`);
    
    const channel = supabase
      .channel(`expenses-changes-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',  // Listen for all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'expenses',
          filter: `user_id=eq.${user.id}`
        },
        async (payload) => {
          console.log('Expense change detected:', payload);
          
          // Force reload expenses
          try {
            setDataLoading(true);
            const refreshedData = await fetchExpenses(user.id, filters);
            console.log("Refreshed data after change:", refreshedData);
            
            setExpenses(refreshedData || []);
            setFilteredExpenses(refreshedData || []);
            
            // Update stats too
            const period = filters.dateRange === 'Custom' ? 'custom' : 
                          filters.dateRange === 'This Month' ? 'month' : 
                          filters.dateRange === 'This Quarter' ? 'quarter' : 'year';
            
            const statsData = await getExpenseStats(user.id, period);
            setStats(statsData);
          } catch (error) {
            console.error("Error refreshing data after change:", error);
          } finally {
            setDataLoading(false);
          }
        }
      )
      .subscribe((status) => {
        console.log(`Subscription status:`, status);
      });
    
    // Cleanup function
    return () => {
      console.log('Removing expense subscription channel');
      supabase.removeChannel(channel);
    };
  }, [user, filters]);

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  // Export expenses data to CSV
  const handleExportData = () => {
    if (filteredExpenses.length === 0) return;
    
    // Convert data to CSV
    const headers = [
      "Description",
      "Date",
      "Category",
      "Amount", 
      "Payment Method",
      "Notes",
      "Deductible"
    ];
    
    const csvData = filteredExpenses.map((expense) => [
      expense.description || "",
      expense.date || "",
      expense.category || "",
      expense.amount || "",
      expense.payment_method || "",
      expense.notes || "",
      expense.deductible === false ? "No" : "Yes"
    ]);
    
    // Create CSV content
    let csvContent = headers.join(",") + "\n";
    csvData.forEach(row => {
      // Escape fields with commas or quotes
      const escapedRow = row.map(field => {
        // Convert to string
        const str = String(field);
        if (str.includes(",") || str.includes('"') || str.includes("\n")) {
          // Escape double quotes with double quotes
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      });
      csvContent += escapedRow.join(",") + "\n";
    });
    
    // Download the CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `expenses_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Set loading state while checking auth
  if (loading && !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <DashboardLayout activePage="expenses">
      <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-100">
        <div className="max-w-7xl mx-auto">
          {/* Header with background */}
          <div className="mb-8 bg-gradient-to-r from-blue-600 to-blue-400 rounded-xl shadow-md p-6 text-white">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="mb-4 md:mb-0">
                <h1 className="text-3xl font-bold mb-1">Expense Tracking</h1>
                <p className="text-blue-100">Track and manage all your business expenses</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleAddExpense}
                  className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors shadow-sm flex items-center font-medium"
                >
                  <Plus size={18} className="mr-2" />
                  Add Expense
                </button>
                <button 
                  onClick={handleExportData}
                  className="px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors shadow-sm flex items-center font-medium"
                  disabled={filteredExpenses.length === 0}
                >
                  <Download size={18} className="mr-2" />
                  Export Report
                </button>
              </div>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Statistics */}
          <ExpenseSummary stats={stats} dateRange={filters.dateRange} />

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Sidebar */}
            <div className="lg:col-span-1">
              {/* Top 3 Expenses Card */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6 border border-gray-200">
                <div className="bg-red-500 px-5 py-4 text-white">
                  <h3 className="font-semibold flex items-center">
                    <Wallet size={18} className="mr-2" />
                    Top Expenses
                  </h3>
                </div>
                <div className="p-4">
                  {dataLoading ? (
                    <div className="flex justify-center items-center py-4">
                      <RefreshCw size={24} className="animate-spin text-gray-400" />
                    </div>
                  ) : (
                    <TopExpenses 
                      expenses={filteredExpenses
                        .slice(0, 3) // Limiting to only 3 expenses
                        .sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount))}
                      onViewReceipt={handleViewReceipt}
                      onEditExpense={handleEditExpense}
                    />
                  )}
                </div>
              </div>
              
              {/* Expense Categories */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6 border border-gray-200">
                <div className="bg-blue-500 px-5 py-4 text-white">
                  <h3 className="font-semibold flex items-center">
                    <BarChart2 size={18} className="mr-2" />
                    Expense Categories
                  </h3>
                </div>
                <div className="p-4">
                  {dataLoading ? (
                    <div className="flex justify-center items-center py-4">
                      <RefreshCw size={24} className="animate-spin text-gray-400" />
                    </div>
                  ) : (
                    <ExpenseCategories 
                      categories={stats.byCategory} 
                      onCategorySelect={handleCategorySelect}
                      selectedCategory={filters.category}
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
                    Filter Expenses
                  </h3>
                </div>
                <div className="p-4">
                  <ExpenseFilters 
                    filters={filters}
                    onSearchChange={handleSearchChange}
                    onFilterChange={handleFilterChange}
                    onDateRangeChange={handleDateRangeChange}
                    onCustomDateChange={handleCustomDateChange}
                    onResetFilters={handleResetFilters}
                  />
                </div>
              </div>
              
              {/* Expense Records */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6 border border-gray-200">
                <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="font-medium text-gray-700 flex items-center">
                    <FileText size={18} className="mr-2 text-blue-500" />
                    Expense Records
                  </h3>
                  <button
                    onClick={handleAddExpense}
                    className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                  >
                    <Plus size={16} className="mr-1" />
                    Add New
                  </button>
                </div>
                
                <div className="overflow-x-auto">
                  {dataLoading ? (
                    <div className="flex justify-center items-center py-12">
                      <RefreshCw size={32} className="animate-spin text-blue-500" />
                    </div>
                  ) : filteredExpenses.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <Wallet size={24} className="text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-1">No expenses found</h3>
                      <p className="text-gray-500 mb-6">Get started by adding your first expense</p>
                      <button
                        onClick={handleAddExpense}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                      >
                        <Plus size={16} className="mr-2" />
                        Add Expense
                      </button>
                    </div>
                  ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Description
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Category
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Payment Method
                          </th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredExpenses.map(expense => (
                          <ExpenseItem 
                            key={expense.id}
                            expense={expense}
                            onEdit={handleEditExpense}
                            onDelete={handleDeleteExpense}
                            onViewReceipt={handleViewReceipt}
                          />
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
                
                {filteredExpenses.length > 0 && (
                  <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      Showing {filteredExpenses.length} of {expenses.length} expenses
                    </div>
                    <div className="text-sm font-medium text-gray-700">
                      Total: {formatCurrency(filteredExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Expense Chart - Now below the expense records */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
                <div className="px-5 py-4 border-b border-gray-200">
                  <h3 className="font-medium flex items-center text-gray-700">
                    <BarChart2 size={18} className="mr-2 text-blue-500" />
                    Expense Analysis
                  </h3>
                </div>
                <div className="p-4">
                  {dataLoading ? (
                    <div className="flex justify-center items-center py-12">
                      <RefreshCw size={32} className="animate-spin text-blue-500" />
                    </div>
                  ) : (
                    <ExpenseChart 
                      data={stats.byCategory} 
                      period={filters.dateRange} 
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      <ExpenseFormModal 
        isOpen={formModalOpen} 
        onClose={() => {
          setFormModalOpen(false);
          setCurrentExpense(null);
        }} 
        expense={currentExpense}
        onSave={handleSaveExpense}
      />
      
      <DeleteConfirmationModal 
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setExpenseToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Expense"
        message="Are you sure you want to delete this expense? This action cannot be undone."
        itemName={expenseToDelete?.description}
        isDeleting={isDeleting}
      />
      
      <ReceiptViewer
        isOpen={receiptViewerOpen}
        onClose={() => {
          setReceiptViewerOpen(false);
          setSelectedReceipt(null);
        }}
        receipt={selectedReceipt}
      />
    </DashboardLayout>
  );
}