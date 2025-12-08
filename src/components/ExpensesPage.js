'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Wallet,
  RefreshCw,
  BarChart2,
  FileText,
  Download,
  TrendingUp,
  DollarSign,
  Calendar,
  Receipt
} from 'lucide-react';

// Import services
import {
  fetchExpenses,
  deleteExpense
} from '@/lib/services/expenseService';

// Import utilities
import { getUserFriendlyError } from '@/lib/utils/errorMessages';
import { usePagination, Pagination, SimplePagination } from '@/hooks/usePagination';

// Import components
import DashboardLayout from '@/components/layout/DashboardLayout';
import { OperationMessage, EmptyState } from '@/components/ui/OperationMessage';
import ExpenseFormModal from '@/components/expenses/ExpenseFormModal';
import ExpenseDeletionModal from '@/components/expenses/ExpenseDeletionModal';
import ReceiptViewer from '@/components/expenses/ReceiptViewer';
import ExpenseStats from '@/components/expenses/ExpenseStats';
import ExpenseFilterBar from '@/components/expenses/ExpenseFilterBar';
import ExpenseCard from '@/components/expenses/ExpenseCard';
import ExpenseItem from '@/components/expenses/ExpenseItem';
import ExpenseCategories from '@/components/expenses/ExpenseCategories';
import TopExpenses from '@/components/expenses/TopExpenses';
import ExpenseChart from '@/components/expenses/ExpenseChart';

export default function ExpensesPage() {
  const router = useRouter();

  // Authentication state
  const [user, setUser] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);

  // Data state
  const [expenses, setExpenses] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    topCategory: null,
    dailyAverage: 0,
    byCategory: {},
    count: 0
  });
  const [loading, setLoading] = useState(true);

  // Filter state
  const [filters, setFilters] = useState({
    search: '',
    category: 'All',
    dateRange: 'This Month',
    startDate: '',
    endDate: '',
    sortBy: 'date',
    sortDirection: 'desc'
  });

  // Modal states
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [currentExpense, setCurrentExpense] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const [receiptViewerOpen, setReceiptViewerOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Feedback state
  const [operationMessage, setOperationMessage] = useState(null);

  // Filter expenses based on search
  const filteredExpenses = useMemo(() => {
    if (!filters.search) return expenses;

    const searchLower = filters.search.toLowerCase();
    return expenses.filter(expense =>
      (expense.description && expense.description.toLowerCase().includes(searchLower)) ||
      (expense.category && expense.category.toLowerCase().includes(searchLower)) ||
      (expense.payment_method && expense.payment_method.toLowerCase().includes(searchLower))
    );
  }, [expenses, filters.search]);

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
  } = usePagination(filteredExpenses, { itemsPerPage: 10 });

  // Check authentication
  useEffect(() => {
    async function checkAuth() {
      try {
        setInitialLoading(true);
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error) throw error;

        if (!user) {
          router.push('/login');
          return;
        }

        setUser(user);
      } catch (error) {
        setOperationMessage({
          type: 'error',
          text: getUserFriendlyError(error)
        });
      } finally {
        setInitialLoading(false);
      }
    }

    checkAuth();
  }, [router]);

  // Calculate stats from filtered expenses - this ensures stats always reflect current filters
  const calculateStatsFromExpenses = useCallback((expensesData) => {
    if (!expensesData || expensesData.length === 0) {
      return {
        total: 0,
        topCategory: null,
        dailyAverage: 0,
        byCategory: {},
        count: 0
      };
    }

    // Calculate total from filtered expenses
    const total = expensesData.reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0);

    // Calculate expenses by category from filtered data
    const byCategory = {};
    expensesData.forEach(expense => {
      if (expense.category) {
        if (!byCategory[expense.category]) {
          byCategory[expense.category] = 0;
        }
        byCategory[expense.category] += parseFloat(expense.amount) || 0;
      }
    });

    // Find top category from filtered data
    let topCategory = null;
    let maxAmount = 0;
    for (const [category, amount] of Object.entries(byCategory)) {
      if (amount > maxAmount) {
        maxAmount = amount;
        topCategory = { name: category, amount };
      }
    }

    // Calculate daily average based on date range
    const now = new Date();
    let daysInPeriod = 30; // default

    if (filters.dateRange === 'This Month') {
      daysInPeriod = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    } else if (filters.dateRange === 'Last Month') {
      daysInPeriod = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
    } else if (filters.dateRange === 'This Quarter' || filters.dateRange === 'Last Quarter') {
      daysInPeriod = 90;
    } else if (filters.dateRange === 'This Year') {
      daysInPeriod = 365;
    } else if (filters.dateRange === 'All Time') {
      // Calculate days from oldest to newest expense
      if (expensesData.length > 0) {
        const dates = expensesData.map(e => new Date(e.date)).filter(d => !isNaN(d));
        if (dates.length > 0) {
          const oldest = Math.min(...dates);
          const newest = Math.max(...dates);
          daysInPeriod = Math.max(1, Math.ceil((newest - oldest) / (1000 * 60 * 60 * 24)) + 1);
        }
      }
    } else if (filters.dateRange === 'Custom' && filters.startDate && filters.endDate) {
      const start = new Date(filters.startDate);
      const end = new Date(filters.endDate);
      daysInPeriod = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1);
    }

    const dailyAverage = total / daysInPeriod;

    return {
      total,
      topCategory,
      dailyAverage,
      byCategory,
      count: expensesData.length
    };
  }, [filters.dateRange, filters.startDate, filters.endDate]);

  // Load expenses when user or filters change
  const loadExpenses = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch expenses with all filters applied
      const expensesData = await fetchExpenses(user.id, filters);
      setExpenses(expensesData || []);

      // Calculate stats directly from the filtered expenses
      // This ensures stats always reflect the current filter selections
      const calculatedStats = calculateStatsFromExpenses(expensesData);
      setStats(calculatedStats);
    } catch (error) {
      setOperationMessage({
        type: 'error',
        text: getUserFriendlyError(error)
      });
    } finally {
      setLoading(false);
    }
  }, [user, filters, calculateStatsFromExpenses]);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

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
        () => {
          loadExpenses();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, loadExpenses]);

  // Handlers
  const handleAddExpense = () => {
    setCurrentExpense(null);
    setFormModalOpen(true);
  };

  const handleEditExpense = (expense) => {
    setCurrentExpense({ ...expense });
    setFormModalOpen(true);
  };

  const handleDeleteExpense = (expense) => {
    setExpenseToDelete(expense);
    setDeleteModalOpen(true);
  };

  const handleViewReceipt = (expense) => {
    setSelectedReceipt(expense);
    setReceiptViewerOpen(true);
  };

  const handleSaveExpense = async (expense) => {
    setFormModalOpen(false);
    setCurrentExpense(null);

    setOperationMessage({
      type: 'success',
      text: currentExpense ? 'Expense updated successfully.' : 'Expense added successfully.'
    });

    await loadExpenses();
  };

  const handleConfirmDelete = async () => {
    if (!expenseToDelete) return;

    try {
      setIsDeleting(true);
      await deleteExpense(expenseToDelete.id);

      setDeleteModalOpen(false);
      setExpenseToDelete(null);

      setOperationMessage({
        type: 'success',
        text: 'Expense deleted successfully.'
      });

      await loadExpenses();
    } catch (error) {
      setOperationMessage({
        type: 'error',
        text: getUserFriendlyError(error)
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCategorySelect = (category) => {
    setFilters(prev => ({
      ...prev,
      category
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      category: 'All',
      dateRange: 'This Month',
      startDate: '',
      endDate: '',
      sortBy: 'date',
      sortDirection: 'desc'
    });
  };

  // Export to CSV
  const handleExportData = () => {
    if (filteredExpenses.length === 0) return;

    const headers = ['Description', 'Date', 'Category', 'Amount', 'Payment Method', 'Notes', 'Deductible'];
    const csvData = filteredExpenses.map((expense) => [
      expense.description || '',
      expense.date || '',
      expense.category || '',
      expense.amount || '',
      expense.payment_method || '',
      expense.notes || '',
      expense.deductible === false ? 'No' : 'Yes'
    ]);

    let csvContent = headers.join(',') + '\n';
    csvData.forEach(row => {
      const escapedRow = row.map(field => {
        const str = String(field);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      });
      csvContent += escapedRow.join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `expenses_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value || 0);
  };

  // Get top expenses
  const getTopExpenses = () => {
    return [...expenses]
      .sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount))
      .slice(0, 3);
  };

  // Loading state
  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <RefreshCw className="h-12 w-12 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <DashboardLayout activePage="expenses">
      <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header with gradient background */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-700 dark:to-blue-600 rounded-xl shadow-lg p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              {/* Left: Title & Description */}
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Wallet className="h-6 w-6" />
                  Expense Tracking
                </h1>
                <p className="text-blue-100 mt-1">
                  Track and manage all your business expenses
                </p>
              </div>

              {/* Right: Action Buttons */}
              <div className="flex flex-wrap gap-3">
                {/* Primary Action */}
                <button
                  onClick={handleAddExpense}
                  className="inline-flex items-center px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors shadow-sm"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add Expense
                </button>

                {/* Secondary Action */}
                <button
                  onClick={handleExportData}
                  disabled={filteredExpenses.length === 0}
                  className="inline-flex items-center px-4 py-2 bg-blue-500/20 text-white border border-white/30 rounded-lg font-medium hover:bg-blue-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="h-5 w-5 mr-2" />
                  Export Report
                </button>
              </div>
            </div>
          </div>

          {/* Operation Message Banner */}
          <OperationMessage
            message={operationMessage}
            onDismiss={() => setOperationMessage(null)}
          />

          {/* Statistics Row */}
          <ExpenseStats
            stats={stats}
            isLoading={loading}
            dateRange={filters.dateRange}
          />

          {/* Main Content Grid - 4 columns */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar - 1 column */}
            <div className="space-y-6">
              {/* Top Expenses Widget */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-red-500" />
                    Top Expenses
                  </h3>
                </div>
                <div className="p-4">
                  {loading ? (
                    <div className="flex justify-center items-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin text-gray-400 dark:text-gray-500" />
                    </div>
                  ) : (
                    <TopExpenses
                      expenses={getTopExpenses()}
                      onViewReceipt={handleViewReceipt}
                      onEditExpense={handleEditExpense}
                    />
                  )}
                </div>
              </div>

              {/* Expense Categories Widget */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <BarChart2 className="h-4 w-4 text-blue-500" />
                    Expense Categories
                  </h3>
                </div>
                <div className="p-4">
                  {loading ? (
                    <div className="flex justify-center items-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin text-gray-400 dark:text-gray-500" />
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

            {/* Main content - 3 columns */}
            <div className="lg:col-span-3 space-y-6">
              {/* Filter Bar */}
              <ExpenseFilterBar
                filters={filters}
                setFilters={setFilters}
                onReset={handleResetFilters}
              />

              {/* Expense Records Table */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-500" />
                    Expense Records
                  </h3>
                  <button
                    onClick={handleAddExpense}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1"
                  >
                    <Plus className="h-4 w-4" />
                    Add New
                  </button>
                </div>

                {/* Loading State */}
                {loading ? (
                  <div className="flex justify-center items-center py-12">
                    <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
                  </div>
                ) : filteredExpenses.length === 0 ? (
                  <EmptyState
                    icon={Wallet}
                    title="No expenses found"
                    description={
                      filters.search || filters.category !== 'All' || filters.dateRange !== 'This Month'
                        ? 'Try adjusting your search or filters.'
                        : 'Start tracking your expenses by adding your first entry.'
                    }
                    action={{
                      label: 'Add Expense',
                      onClick: handleAddExpense,
                      icon: Plus
                    }}
                  />
                ) : (
                  <>
                    {/* Mobile Card View */}
                    <div className="lg:hidden p-4 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {paginatedData.map((expense) => (
                          <ExpenseCard
                            key={expense.id}
                            expense={expense}
                            onEdit={handleEditExpense}
                            onDelete={handleDeleteExpense}
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
                    <div className="hidden lg:block">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                Description
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                Date
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                Category
                              </th>
                              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                Amount
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                Payment
                              </th>
                              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {paginatedData.map((expense) => (
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

                {/* Total Summary */}
                {filteredExpenses.length > 0 && (
                  <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 flex items-center justify-between lg:hidden">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {totalItems} expenses
                    </span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      Total: {formatCurrency(filteredExpenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0))}
                    </span>
                  </div>
                )}
              </div>

              {/* Expense Chart */}
              {expenses.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <BarChart2 className="h-5 w-5 text-blue-500" />
                      Expense Analysis
                    </h3>
                  </div>
                  <div className="p-4">
                    <ExpenseChart
                      data={stats.byCategory}
                      period={filters.dateRange}
                    />
                  </div>
                </div>
              )}
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

      <ExpenseDeletionModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setExpenseToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        expense={expenseToDelete}
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
