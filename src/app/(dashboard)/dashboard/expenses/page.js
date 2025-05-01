// src/app/(dashboard)/dashboard/expenses/page.js
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Plus, 
  FileText, 
  Trash2, 
  Edit,
  RefreshCw,
  AlertCircle,
  Wallet,
  Calendar,
  Search,
  BarChart2,
  Filter,
  Eye
} from "lucide-react";

// Import expense service functions
import { 
  fetchExpenses, 
  getExpenseStats,
  deleteExpense 
} from "@/lib/services/expenseService";

// Import components
import DashboardLayout from "@/components/layout/DashboardLayout";
import ExpenseFormModal from "@/components/expenses/ExpenseFormModal";
import DeleteConfirmationModal from "@/components/common/DeleteConfirmationModal";
import ReceiptViewer from "@/components/expenses/ReceiptViewer";
import ExpenseItem from "@/components/expenses/ExpenseItem";

export default function ExpensesPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState([]); // Raw expenses data
  const [filteredExpenses, setFilteredExpenses] = useState([]); // Filtered expenses for display
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
    
    // Test connection
    setTimeout(() => {
      console.log('Testing subscription connection...');
      const activeChannels = supabase.getChannels();
      console.log('Active channels:', activeChannels);
    }, 2000);
    
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
      <main className="flex-1 overflow-y-auto p-4 bg-gray-100">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Expense Tracking</h1>
              <p className="text-gray-600">Track and manage your business expenses</p>
            </div>
            <div className="mt-4 md:mt-0 flex flex-wrap gap-3">
              <button
                onClick={handleAddExpense}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
              >
                <Plus size={16} className="mr-2" />
                Add Expense
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

          {/* Stats Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow px-5 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">TOTAL</p>
                  <p className="text-2xl font-semibold text-gray-900 mt-1">{formatCurrency(stats.total)}</p>
                </div>
                <div className="rounded-md p-2 bg-red-100 text-red-600">
                  <Wallet size={20} />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-sm text-gray-500">This Month expenses</p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow px-5 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">TOP CATEGORY</p>
                  <p className="text-2xl font-semibold text-blue-600 mt-1">
                    {stats.topCategory ? stats.topCategory.name : "None"}
                  </p>
                </div>
                <div className="rounded-md p-2 bg-blue-100 text-blue-600">
                  <BarChart2 size={20} />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-sm text-gray-500">
                  {stats.topCategory 
                    ? `${formatCurrency(stats.topCategory.amount)}` 
                    : "No data available"}
                </p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow px-5 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">DAILY AVERAGE</p>
                  <p className="text-2xl font-semibold text-purple-600 mt-1">{formatCurrency(stats.dailyAverage)}</p>
                </div>
                <div className="rounded-md p-2 bg-purple-100 text-purple-600">
                  <Calendar size={20} />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-sm text-gray-500">Average spending per day</p>
              </div>
            </div>
          </div>

          {/* Expense Categories */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
            {/* Left Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Top Expenses */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="bg-red-500 px-5 py-4 text-white">
                  <h3 className="font-semibold flex items-center">
                    <FileText size={18} className="mr-2" />
                    Top Expenses
                  </h3>
                </div>
                <div className="p-4">
                  {dataLoading ? (
                    <div className="flex justify-center items-center py-4">
                      <RefreshCw size={24} className="animate-spin text-gray-400" />
                    </div>
                  ) : filteredExpenses.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-gray-500">No expenses found</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredExpenses
                        .slice(0, 5)
                        .sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount))
                        .map(expense => (
                        <div 
                          key={expense.id}
                          className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900 truncate max-w-[150px]">
                                {expense.description}
                              </div>
                              <p className="text-xs text-gray-500">
                                {expense.category}
                              </p>
                            </div>
                            <span className="text-sm font-medium text-red-600">
                              {formatCurrency(expense.amount)}
                            </span>
                          </div>
                          
                          <div className="mt-2 pt-2 border-t border-gray-200 flex justify-end space-x-2">
                            {expense.receipt_image && (
                              <button
                                onClick={() => handleViewReceipt(expense)}
                                className="text-blue-600 hover:text-blue-800 p-1"
                                title="View Receipt"
                              >
                                <Eye size={14} />
                              </button>
                            )}
                            <button
                              onClick={() => handleEditExpense(expense)}
                              className="text-green-600 hover:text-green-800 p-1"
                              title="Edit Expense"
                            >
                              <Edit size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Expense Categories */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
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
                  ) : Object.keys(stats.byCategory).filter(cat => stats.byCategory[cat] > 0).length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-gray-500">No categories found</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {Object.entries(stats.byCategory)
                        .filter(([_, amount]) => amount > 0)
                        .sort(([_, amountA], [__, amountB]) => amountB - amountA)
                        .map(([category, amount]) => (
                          <div
                            key={category}
                            className="p-3 rounded-lg flex items-center justify-between bg-gray-50 hover:bg-blue-50 transition-colors"
                            onClick={() => setFilters(prev => ({ ...prev, category }))}
                          >
                            <span className="text-sm font-medium text-gray-700">{category}</span>
                            <span className="text-xs font-medium px-2 py-1 bg-white rounded-full text-gray-600 shadow-sm">
                              {formatCurrency(amount)}
                            </span>
                          </div>
                        ))
                      }
                      
                      <div className="pt-2 mt-2 border-t border-gray-200">
                        <div
                          className="p-3 rounded-lg flex items-center justify-between bg-gray-50 hover:bg-blue-50 transition-colors"
                          onClick={() => setFilters(prev => ({ ...prev, category: 'All' }))}
                        >
                          <span className="text-sm font-medium text-gray-700">All Categories</span>
                          <span className="text-xs font-medium px-2 py-1 bg-white rounded-full text-gray-600 shadow-sm">
                            {formatCurrency(Object.values(stats.byCategory).reduce((sum, amount) => sum + amount, 0))}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Main Content */}
            <div className="lg:col-span-3">
              {/* Filters */}
              <div className="bg-white rounded-lg shadow mb-6">
                <div className="bg-gray-50 px-5 py-4 border-b border-gray-200">
                  <h3 className="font-medium flex items-center text-gray-700">
                    <Filter size={18} className="mr-2 text-gray-500" />
                    Filter Expenses
                  </h3>
                </div>
                
                <div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Category filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      name="category"
                      value={filters.category}
                      onChange={handleFilterChange}
                      className="block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                    >
                      <option value="All">All Categories</option>
                      <option value="Fuel">Fuel</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Insurance">Insurance</option>
                      <option value="Tolls">Tolls</option>
                      <option value="Office">Office</option>
                      <option value="Permits">Permits</option>
                      <option value="Meals">Meals</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  
                  {/* Date range filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                    <select
                      name="dateRange"
                      value={filters.dateRange}
                      onChange={handleFilterChange}
                      className="block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                    >
                      <option value="This Month">This Month</option>
                      <option value="Last Month">Last Month</option>
                      <option value="This Quarter">This Quarter</option>
                      <option value="Last Quarter">Last Quarter</option>
                      <option value="This Year">This Year</option>
                      <option value="All Time">All Time</option>
                      <option value="Custom">Custom Range</option>
                    </select>
                  </div>
                  
                  {/* Sort by filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                    <select
                      name="sortBy"
                      value={filters.sortBy}
                      onChange={handleFilterChange}
                      className="block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                    >
                      <option value="date">Date</option>
                      <option value="amount">Amount</option>
                      <option value="category">Category</option>
                      <option value="description">Description</option>
                    </select>
                  </div>
                  
                  {/* Search field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search size={16} className="text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="search"
                        value={filters.search}
                        onChange={handleSearchChange}
                        className="block w-full pl-10 rounded-md border border-gray-300 py-2 px-3 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                        placeholder="Search expenses..."
                      />
                    </div>
                  </div>
                  
                  {/* Reset filters button */}
                  <div className="md:col-span-4 flex justify-end mt-4">
                    <button
                      onClick={handleResetFilters}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <RefreshCw size={16} className="mr-2" />
                      Reset Filters
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Expense Records */}
              <div className="bg-white rounded-lg shadow mb-6">
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
                
                <div className="p-4">
                  {dataLoading ? (
                    <div className="flex justify-center items-center py-10">
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
                    <div className="overflow-x-auto">
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
                      
                      <div className="mt-4 px-6 py-3 border-t border-gray-200 text-right">
                        <p className="text-sm text-gray-500">
                          Total: {formatCurrency(filteredExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0))}
                        </p>
                      </div>
                    </div>
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