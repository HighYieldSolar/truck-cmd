// src/components/dashboard/ExpensesPage.js
"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { 
  Plus, 
  Search, 
  Download, 
  RefreshCw,
  AlertCircle,
  DollarSign,
  ArrowDown,
  ArrowUp,
  Receipt,
  Wallet,
  Fuel,
  Truck,
  Edit,
  Trash2
} from "lucide-react";
import { 
  fetchExpenses, 
  deleteExpense,
  getExpenseStats
} from "@/lib/services/expenseService";
import ExpenseFormModal from "@/components/ExpenseFormModal";
import DeleteConfirmationModal from "@/components/common/DeleteConfirmationModal";
import EmptyState from "@/components/common/EmptyState";

// Expense Stats Card Component
const ExpenseStatsCard = ({ title, amount = 0, change, changeType, icon, color }) => {
  const bgColorClass = `bg-${color}-50`;
  const textColorClass = `text-${color}-600`;
  const iconBgColorClass = `bg-${color}-100`;
  
  // Ensure amount is a number before calling toLocaleString
  const formattedAmount = typeof amount === 'number' ? amount.toLocaleString() : '0';
  
  return (
    <div className="bg-white p-5 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
        <div className={`${iconBgColorClass} p-2 rounded-lg`}>
          {icon}
        </div>
      </div>
      <div className="flex items-baseline mb-2">
        <h2 className="text-2xl font-bold">${formattedAmount}</h2>
      </div>
      {change && (
        <div className="flex items-center">
          {changeType === 'increase' ? (
            <ArrowUp size={16} className="text-red-500" />
          ) : (
            <ArrowDown size={16} className="text-green-500" />
          )}
          <span 
            className={`text-sm ml-1 ${
              changeType === 'increase' ? 'text-red-500' : 'text-green-500'
            }`}
          >
            {change}% from last month
          </span>
        </div>
      )}
    </div>
  );
};

// Expense Item Component
const ExpenseItem = ({ expense, onEdit, onDelete }) => {
  // Get category icon based on expense type
  const getCategoryIcon = (category) => {
    switch (category.toLowerCase()) {
      case 'fuel':
        return <Fuel size={18} className="text-yellow-500" />;
      case 'maintenance':
        return <Truck size={18} className="text-blue-500" />;
      case 'insurance':
        return <DollarSign size={18} className="text-green-500" />;
      case 'tolls':
        return <DollarSign size={18} className="text-red-500" />;
      case 'office':
        return <DollarSign size={18} className="text-purple-500" />;
      default:
        return <Wallet size={18} className="text-gray-500" />;
    }
  };

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
            {getCategoryIcon(expense.category)}
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{expense.description}</div>
            <div className="text-sm text-gray-500">{expense.category}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">${expense.amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
        <div className="text-sm text-gray-500">{expense.payment_method}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">{new Date(expense.date).toLocaleDateString()}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {expense.vehicle_id ? (
          <div className="text-sm text-gray-900">{expense.vehicle_id}</div>
        ) : (
          <div className="text-sm text-gray-400">—</div>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <button 
          onClick={() => onEdit(expense)} 
          className="text-blue-600 hover:text-blue-900 mr-3"
          aria-label="Edit expense"
        >
          <Edit size={16} />
        </button>
        <button 
          onClick={() => onDelete(expense.id)} 
          className="text-red-600 hover:text-red-900"
          aria-label="Delete expense"
        >
          <Trash2 size={16} />
        </button>
      </td>
    </tr>
  );
};

// Main Expenses Page Component
export default function ExpensesPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expensesLoading, setExpensesLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expenses, setExpenses] = useState([]);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('All');
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });
  
  // Modal states
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [currentExpense, setCurrentExpense] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Stats state
  const [summaries, setSummaries] = useState({
    total: 0,
    fuel: 0,
    maintenance: 0,
    other: 0
  });

  // Load expenses function
  const loadExpenses = useCallback(async (userId) => {
    try {
      setExpensesLoading(true);
      
      // Apply filters
      const filters = {
        search: searchTerm,
        category: categoryFilter !== 'All' ? categoryFilter : undefined,
        dateRange: dateFilter,
        ...(dateFilter === 'Custom' ? { startDate: dateRange.start, endDate: dateRange.end } : {}),
        sortBy: 'date',
        sortDirection: 'desc'
      };
      
      // Fetch expenses with applied filters
      const data = await fetchExpenses(userId, filters);
      setExpenses(data || []);
      
      // Fetch stats
      const stats = await getExpenseStats(userId, 'month');
      
      // Calculate summaries with default values if properties are undefined
      const totalExpenses = stats?.total || 0;
      const fuelExpenses = stats?.byCategory?.Fuel || 0;
      const maintenanceExpenses = stats?.byCategory?.Maintenance || 0;
      const otherExpenses = totalExpenses - fuelExpenses - maintenanceExpenses;
      
      setSummaries({
        total: totalExpenses,
        fuel: fuelExpenses,
        maintenance: maintenanceExpenses,
        other: otherExpenses
      });
    } catch (error) {
      console.error('Error loading expenses:', error);
      setError('Failed to load expenses. Please try refreshing the page.');
      // Set default values in case of error
      setSummaries({
        total: 0,
        fuel: 0,
        maintenance: 0,
        other: 0
      });
    } finally {
      setExpensesLoading(false);
    }
  }, [searchTerm, categoryFilter, dateFilter, dateRange]); // Include filters as dependencies

  // Initial data loading
  useEffect(() => {
    async function initializeData() {
      try {
        setLoading(true);
        
        // Get user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
      
        if (userError) throw userError;
        
        if (!user) {
          // Redirect to login page if not authenticated
          window.location.href = '/login';
          return;
        }
        
        setUser(user);
        
        // Fetch expenses
        await loadExpenses(user.id);
        
        setLoading(false);
      } catch (error) {
        console.error('Error initializing data:', error);
        setError('Authentication error. Please try logging in again.');
        setLoading(false);
      }
    }

    initializeData();
  }, [loadExpenses]);
  
  // Effect to reload expenses when filters change
  useEffect(() => {
    if (user) {
      loadExpenses(user.id);
    }
  }, [user, loadExpenses]);

  // Handle expense form submission
  const handleSaveExpense = async (formData) => {
    try {
      if (user) {
        // Reload expenses after save
        await loadExpenses(user.id);
      }
    } catch (error) {
      console.error('Error after saving expense:', error);
      setError('Something went wrong. Please try again.');
    }
  };

  // Handle expense edit
  const handleEditExpense = (expense) => {
    setCurrentExpense(expense);
    setFormModalOpen(true);
  };

  // Handle expense delete
  const handleDeleteExpense = (id) => {
    const expenseToRemove = expenses.find(e => e.id === id);
    setExpenseToDelete(expenseToRemove);
    setDeleteModalOpen(true);
  };

  // Confirm expense deletion
  const confirmDeleteExpense = async () => {
    if (expenseToDelete) {
      try {
        setIsDeleting(true);
        
        // Delete from Supabase
        await deleteExpense(expenseToDelete.id);
        
        // Reload expenses
        if (user) {
          await loadExpenses(user.id);
        }
        
        // Close modal
        setDeleteModalOpen(false);
        setExpenseToDelete(null);
      } catch (error) {
        console.error('Error deleting expense:', error);
        setError('Failed to delete expense. Please try again.');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  // Filter expenses based on search term and filters
  const filteredExpenses = expenses;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <DashboardLayout activePage="expenses">
      {/* Main Content */}
      <div className="p-4 bg-gray-100">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Expense Management</h1>
              <p className="text-gray-600">Track, categorize and manage your business expenses</p>
            </div>
            <div className="mt-4 md:mt-0 flex space-x-3">
              <button
                onClick={() => {
                  setCurrentExpense(null);
                  setFormModalOpen(true);
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
              >
                <Plus size={16} className="mr-2" />
                Add Expense
              </button>
              <button
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none"
              >
                <Download size={16} className="mr-2" />
                Export
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <ExpenseStatsCard 
              title="Total Expenses (MTD)"
              value={summaries.total} 
              change="8.2" 
              changeType="increase" 
              icon={<Wallet size={20} className="text-blue-600" />} 
              color="blue"
            />
            <ExpenseStatsCard 
              title="Fuel Expenses"
              value={summaries.fuel} 
              change="12.5" 
              changeType="increase" 
              icon={<Fuel size={20} className="text-yellow-600" />} 
              color="yellow"
            />
            <ExpenseStatsCard 
              title="Maintenance"
              value={summaries.maintenance} 
              change="5.3" 
              changeType="decrease" 
              icon={<Truck size={20} className="text-green-600" />} 
              color="green"
            />
            <ExpenseStatsCard 
              title="Other Expenses"
              value={summaries.other} 
              change="3.1" 
              changeType="increase" 
              icon={<DollarSign size={20} className="text-red-600" />} 
              color="red"
            />
          </div>

          {/* Filters */}
          <div className="mb-6 bg-white p-4 rounded-lg shadow-sm">
            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
              <div className="flex-1 flex flex-col space-y-2">
                <label htmlFor="category-filter" className="text-sm font-medium text-gray-700">
                  Category
                </label>
                <select
                  id="category-filter"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="block pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white"
                >
                  <option value="All">All Categories</option>
                  <option value="Fuel">Fuel</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Insurance">Insurance</option>
                  <option value="Tolls">Tolls</option>
                  <option value="Office">Office</option>
                  <option value="Meals">Meals</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div className="flex-1 flex flex-col space-y-2">
                <label htmlFor="date-filter" className="text-sm font-medium text-gray-700">
                  Date Range
                </label>
                <select
                  id="date-filter"
                  value={dateFilter}
                  onChange={(e) => {
                    // Handle date filter change
                    setDateFilter(e.target.value);
                    
                    // If "Custom" is selected, keep the current date range
                    // Otherwise, reset it
                    if (e.target.value !== 'Custom') {
                      setDateRange({ start: '', end: '' });
                    }
                  }}
                  className="block pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white"
                >
                  <option value="All">All Time</option>
                  <option value="This Month">This Month</option>
                  <option value="Last Month">Last Month</option>
                  <option value="This Quarter">This Quarter</option>
                  <option value="Custom">Custom Range</option>
                </select>
              </div>
              
              {dateFilter === 'Custom' && (
                <div className="flex-1 flex flex-col space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Custom Range
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                      className="block flex-1 pl-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white"
                    />
                    <input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                      className="block flex-1 pl-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white"
                    />
                  </div>
                </div>
              )}

              <div className="flex-none flex md:items-end">
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setCategoryFilter('All');
                    setDateFilter('All');
                    setDateRange({ start: '', end: '' });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                >
                  <RefreshCw size={16} className="mr-2 inline-block" />
                  Reset Filters
                </button>
              </div>
            </div>
          </div>
              
          {/* Expenses Table */}
          <div className="bg-white shadow overflow-hidden rounded-md">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center border-b border-gray-200">
              <div className="relative w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={16} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Search expenses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <span className="text-gray-500 text-sm">
                Showing {filteredExpenses.length} of {expenses.length} expenses
              </span>
            </div>
            <div className="overflow-x-auto">
              {expensesLoading ? (
                <div className="p-8 text-center">
                  <RefreshCw size={32} className="animate-spin mx-auto mb-4 text-blue-500" />
                  <p className="text-gray-500">Loading expenses...</p>
                </div>
              ) : filteredExpenses.length === 0 ? (
                <EmptyState 
                  message={searchTerm || categoryFilter !== 'All' || dateFilter !== 'All' 
                    ? "No expenses found matching your filters." 
                    : "You haven't recorded any expenses yet."}
                  icon={<Receipt size={28} className="text-gray-400" />}
                  buttonText="Add Your First Expense"
                  onAction={() => {
                    setCurrentExpense(null);
                    setFormModalOpen(true);
                  }}
                />
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Expense Details
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Vehicle
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
                      />
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan="2" className="px-6 py-4 text-left text-sm font-medium text-gray-900">
                        Total
                      </td>
                      <td colSpan="3" className="px-6 py-4 text-left text-sm font-medium text-gray-900">
                        ${filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

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
        onConfirm={confirmDeleteExpense}
        title="Delete Expense"
        itemName={expenseToDelete?.description}
        isDeleting={isDeleting}
      />
    </DashboardLayout>
  );
}