"use client";

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
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
  BarChart2
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
import StatCard from "@/components/common/StatCard";
import EmptyState from "@/components/common/EmptyState";

// Helper function for consistent date formatting
function formatDateForDisplay(dateString) {
  if (!dateString) return "";
  
  // Create a date object from the date string
  // Use date constructor directly which will use local timezone
  const date = new Date(dateString);
  
  // Format date in a user-friendly way
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return date.toLocaleDateString(undefined, options);
}

// PDF export function - simplified version
const exportToPDF = (expenses) => {
  // Create a simple HTML structure for the PDF
  const html = `
    <html>
      <head>
        <title>Expense Report</title>
        <style>
          body { font-family: Arial, sans-serif; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .header { margin-bottom: 20px; }
          .header h1 { color: #333; }
          .summary { margin: 20px 0; }
          .footer { margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Expense Report</h1>
          <p>Generated on ${new Date().toLocaleDateString()}</p>
        </div>
        
        <div class="summary">
          <p><strong>Total Expenses:</strong> $${expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0).toFixed(2)}</p>
          <p><strong>Number of Expenses:</strong> ${expenses.length}</p>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Date</th>
              <th>Category</th>
              <th>Amount</th>
              <th>Payment Method</th>
            </tr>
          </thead>
          <tbody>
            ${expenses.map(expense => `
              <tr>
                <td>${expense.description}</td>
                <td>${formatDateForDisplay(expense.date)}</td>
                <td>${expense.category}</td>
                <td>$${parseFloat(expense.amount).toFixed(2)}</td>
                <td>${expense.payment_method}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="footer">
          <p>Truck Command - Expense Management System</p>
        </div>
      </body>
    </html>
  `;
  
  // Open a new window with this HTML content
  const printWindow = window.open('', '_blank');
  printWindow.document.write(html);
  printWindow.document.close();
  
  // Wait for content to load then print
  printWindow.onload = function() {
    printWindow.print();
    // Close the window after print dialogue is closed (optional)
    // printWindow.onafterprint = function() { printWindow.close(); };
  };
};

// Main Expenses Page Component
export default function ExpensesPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    topCategory: null,
    dailyAverage: 0,
    byCategory: {}
  });
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
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  // Load expenses when filters or user changes
  const loadExpenses = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const data = await fetchExpenses(user.id, filters);
      setExpenses(data);
      
      // Get the expense statistics
      const period = filters.dateRange === 'Custom' ? 'custom' : 
                    filters.dateRange === 'This Month' ? 'month' : 
                    filters.dateRange === 'This Quarter' ? 'quarter' : 'year';
      
      const statsData = await getExpenseStats(user.id, period);
      
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
        byCategory: statsData.byCategory
      });
      
    } catch (error) {
      console.error('Error loading expenses:', error);
      setError('Failed to load expenses. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user, filters]);

  useEffect(() => {
    if (user) {
      loadExpenses();
    }
  }, [user, loadExpenses]);

  // Initialize Supabase realtime subscription for expenses
  useEffect(() => {
    if (!user) return;
    
    // Subscribe to expense changes
    const channel = supabase
      .channel(`expenses-changes-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'expenses',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Expense change detected:', payload);
          // Reload expenses when there's a change
          loadExpenses();
        }
      )
      .subscribe();
    
    // Cleanup function
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, loadExpenses]);

  // Handle opening the expense form to add a new expense
  const handleAddExpense = () => {
    setCurrentExpense(null);
    setFormModalOpen(true);
  };

  // Handle opening the expense form to edit an existing expense
  const handleEditExpense = (expense) => {
    // Make a copy of the expense to avoid modifying the original
    // No need for date manipulation here - the ExpenseFormModal will handle it
    setCurrentExpense({...expense});
    setFormModalOpen(true);
  };

  // Handle opening the delete confirmation modal
  const handleDeleteExpense = (expense) => {
    setExpenseToDelete(expense);
    setDeleteModalOpen(true);
  };
  
  // Handle opening the receipt viewer modal
  const handleViewReceipt = (expense) => {
    setSelectedReceipt(expense);
    setReceiptViewerOpen(true);
  };

  // Handle saving an expense (either create or update)
  const handleSaveExpense = (expense) => {
    loadExpenses();
    setFormModalOpen(false);
  };

  // Handle confirming expense deletion
  const handleConfirmDelete = async () => {
    if (!expenseToDelete) return;
    
    try {
      setIsSubmitting(true);
      await deleteExpense(expenseToDelete.id);
      loadExpenses();
      setDeleteModalOpen(false);
      setExpenseToDelete(null);
    } catch (error) {
      console.error('Error deleting expense:', error);
      setError('Failed to delete expense. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle exporting expenses as PDF
  const handleExportPDF = () => {
    if (expenses.length === 0) return;
    exportToPDF(expenses);
  };

  // Reset all filters
  const handleResetFilters = () => {
    setFilters({
      search: "",
      category: "All",
      dateRange: "This Month",
      startDate: "",
      endDate: "",
      sortBy: "date",
      sortDirection: "desc"
    });
  };

  // Filters component for expenses
  const ExpenseFilters = () => {
    const handleChange = (e) => {
      const { name, value } = e.target;
      setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleCustomDateChange = (e) => {
      const { name, value } = e.target;
      setFilters(prev => ({ 
        ...prev, 
        [name]: value,
        dateRange: prev.dateRange === 'Custom' ? 'Custom' : 'Custom'
      }));
    };

    return (
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <div className="flex flex-col md:flex-row flex-wrap space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-gray-400" />
              </div>
              <input
                type="text"
                id="search"
                name="search"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 flex-1"
                placeholder="Search expenses..."
                value={filters.search}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="w-full">
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              id="category"
              name="category"              
              className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              value={filters.category}
              onChange={handleChange}
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

          <div className="w-full">
            <label htmlFor="dateRange" className="block text-sm font-medium text-gray-700 mb-1">
              Date Range
            </label>
            <select
              id="dateRange"
              name="dateRange"              
              className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              value={filters.dateRange}
              onChange={handleChange}
            >
              <option value="All Time">All Time</option>
              <option value="This Month">This Month</option>
              <option value="Last Month">Last Month</option>
              <option value="This Quarter">This Quarter</option>
              <option value="Last Quarter">Last Quarter</option>
              <option value="This Year">This Year</option>
              <option value="Custom">Custom Range</option>
            </select>
          </div>
        </div>

        {filters.dateRange === "Custom" && (
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mt-4">
            <div className="flex-1">
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                className="block w-full pl-3 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                value={filters.startDate}
                onChange={handleCustomDateChange}
              />
            </div>
            <div className="flex-1">
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                className="block w-full pl-3 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                value={filters.endDate}
                onChange={handleCustomDateChange}
              />
            </div>
          </div>
        )}

        <div className="flex justify-end mt-4">
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
          >
            Reset Filters
          </button>
        </div>
      </div>
    );
  };

  // Expense table component
  const ExpenseTable = () => {
    if (loading && user) {
      return (
        <div className="flex justify-center items-center py-10">
          <RefreshCw size={32} className="animate-spin text-blue-500" />
        </div>
      );
    }

    if (expenses.length === 0) {
      return (
        <EmptyState 
          message="No expenses found"
          description="Try adjusting your filters or add your first expense."
          icon={<Wallet size={24} className="text-gray-400" />}
        />
      );
    }

    return (      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {expenses.map((expense) => (
          <div key={expense.id} className="bg-white rounded-lg shadow p-4 flex flex-col">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-lg font-semibold text-gray-800">{expense.description}</p>
                {expense.vehicle_id && (
                  <p className="text-sm text-gray-500">Vehicle: {expense.vehicle_id}</p>
                )}
              </div>
              {expense.receipt_image && (
                <button
                  onClick={() => handleViewReceipt(expense)}
                  className="text-gray-600 hover:text-gray-900"
                  title="View Receipt"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 22h16a2 2 0 0 0 2-2V7c0-0.28-0.12-0.55-0.32-0.72L16.8 1.6c-0.18-0.17-0.41-0.28-0.65-0.3H4c-1.1 0-2 0.9-2 2v16.59c0 1.1 0.9 2 2 2Z"></path>
                    <path d="M8 11h8"></path>
                    <path d="M8 15h5"></path>
                    <path d="M14 7V1.6"></path>
                  </svg>
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between text-sm text-gray-600 mb-2">
              <span className="mr-2">Date: {formatDateForDisplay(expense.date)}</span>
              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getCategoryColor(expense.category)}`}>
                {expense.category}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-lg font-medium text-gray-900">
                ${parseFloat(expense.amount).toFixed(2)}
              </p>
              <p className="text-sm text-gray-500">
                {expense.payment_method}
              </p>
            </div>

            <div className="flex justify-end mt-4 space-x-2">
              <button
                onClick={() => handleEditExpense(expense)}
                className="text-blue-600 hover:text-blue-900"
                title="Edit Expense"
              >
                <Edit size={18} />
              </button>
              <button
                onClick={() => handleDeleteExpense(expense)}
                className="text-red-600 hover:text-red-900"
                title="Delete Expense"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
        <div className="md:col-span-2 lg:col-span-3">
          <div className="bg-gray-50 rounded-lg p-4 flex justify-between items-center w-full">
            <p className="text-sm font-medium text-gray-900">
              Total
            </p>
            <p className="text-sm font-medium text-gray-900">
              ${expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0).toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Expense stats component
  const ExpenseStats = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard 
          title={`Total Expenses (${filters.dateRange === 'Custom' ? 'Custom Range' : filters.dateRange})`}
          value={`$${stats.total.toFixed(2)}`}
          icon={<Wallet size={20} className="text-red-600" />}
          color="red"
        />
        
        <StatCard 
          title="Top Category"
          value={stats.topCategory ? `${stats.topCategory.name} ($${stats.topCategory.amount.toFixed(2)})` : "No Data"}
          icon={<BarChart2 size={20} className="text-blue-600" />}
          color="blue"
        />
        
        <StatCard 
          title="Daily Average"
          value={`$${stats.dailyAverage.toFixed(2)}`}
          icon={<Calendar size={20} className="text-purple-600" />}
          color="purple"
        />
      </div>
    );
  };

  // Category breakdown component
  const CategoryBreakdown = () => {
    // Filter out categories with zero amount
    const activeCategories = Object.entries(stats.byCategory)
      .filter(([_, amount]) => amount > 0)
      .sort(([_, amountA], [__, amountB]) => amountB - amountA);

    if (activeCategories.length === 0) {
      return null;
    }

    // Calculate total for percentages
    const total = activeCategories.reduce((sum, [_, amount]) => sum + amount, 0);

    return (
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Expense Breakdown by Category</h3>
        <div className="space-y-4">
          {activeCategories.map(([category, amount]) => {
            const percentage = (amount / total) * 100;
            
            return (
              <div key={category}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{category}</span>
                  <span className="text-sm font-medium text-gray-700">
                    ${amount.toFixed(2)} ({percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full ${getCategoryProgressColor(category)}`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
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
              <button
                onClick={handleExportPDF}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none"
                disabled={expenses.length === 0}
              >
                <FileText size={16} className="mr-2" />
                Export PDF
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

          {/* Expense Stats */}
          <ExpenseStats />

          {/* Filters */}
          <ExpenseFilters />
          
          {/* Expense Breakdown */}
          <CategoryBreakdown />
          
          {/* Expenses Table */}
          <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Expenses</h3>
              <div className="text-sm text-gray-500">
                {expenses.length} {expenses.length === 1 ? 'expense' : 'expenses'} found
              </div>
            </div>
            
            <ExpenseTable />
          </div>
        </div>
      </main>

      {/* Expense Form Modal */}
      <ExpenseFormModal 
        isOpen={formModalOpen} 
        onClose={() => {
          setFormModalOpen(false);
          setCurrentExpense(null);
        }} 
        expense={currentExpense}
        onSave={handleSaveExpense}
      />
      
      {/* Delete Confirmation Modal */}
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
        isDeleting={isSubmitting}
      />
      
      {/* Receipt Viewer Modal */}
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

// Helper functions
function getCategoryColor(category) {
  switch (category) {
    case 'Fuel':
      return 'bg-yellow-100 text-yellow-800';
    case 'Maintenance':
      return 'bg-blue-100 text-blue-800';
    case 'Insurance':
      return 'bg-green-100 text-green-800';
    case 'Tolls':
      return 'bg-purple-100 text-purple-800';
    case 'Office':
      return 'bg-gray-100 text-gray-800';
    case 'Permits':
      return 'bg-indigo-100 text-indigo-800';
    case 'Meals':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function getCategoryProgressColor(category) {
  switch (category) {
    case 'Fuel':
      return 'bg-yellow-500';
    case 'Maintenance':
      return 'bg-blue-500';
    case 'Insurance':
      return 'bg-green-500';
    case 'Tolls':
      return 'bg-purple-500';
    case 'Office':
      return 'bg-gray-500';
    case 'Permits':
      return 'bg-indigo-500';
      case 'Meals':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  }