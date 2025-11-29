'use client';

import {
  Fuel,
  Wrench,
  Shield,
  MapPin,
  Briefcase,
  FileCheck,
  Coffee,
  Tag,
  Eye,
  Pencil
} from 'lucide-react';

/**
 * Top Expenses Sidebar Widget
 *
 * Displays the highest expenses for quick access.
 * Supports dark mode.
 */
export default function TopExpenses({
  expenses,
  onViewReceipt,
  onEditExpense
}) {
  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value || 0);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  // Get category icon with dark mode support
  const getCategoryIcon = (category) => {
    const iconClass = 'h-4 w-4';
    const icons = {
      Fuel: <Fuel className={`${iconClass} text-amber-600 dark:text-amber-400`} />,
      Maintenance: <Wrench className={`${iconClass} text-blue-600 dark:text-blue-400`} />,
      Insurance: <Shield className={`${iconClass} text-green-600 dark:text-green-400`} />,
      Tolls: <MapPin className={`${iconClass} text-purple-600 dark:text-purple-400`} />,
      Office: <Briefcase className={`${iconClass} text-gray-600 dark:text-gray-400`} />,
      Permits: <FileCheck className={`${iconClass} text-indigo-600 dark:text-indigo-400`} />,
      Meals: <Coffee className={`${iconClass} text-red-600 dark:text-red-400`} />,
      Other: <Tag className={`${iconClass} text-gray-600 dark:text-gray-400`} />
    };
    return icons[category] || icons.Other;
  };

  // Empty state
  if (!expenses || expenses.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
          <Tag className="h-6 w-6 text-gray-400 dark:text-gray-500" />
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No expenses yet
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {expenses.map((expense, index) => (
        <div
          key={expense.id}
          className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          {/* Top Row: Category, Description, Amount */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="p-1.5 rounded-lg bg-white dark:bg-gray-800 shadow-sm flex-shrink-0">
                {getCategoryIcon(expense.category)}
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {expense.description || 'No description'}
              </span>
            </div>
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex-shrink-0">
              {formatCurrency(expense.amount)}
            </span>
          </div>

          {/* Bottom Row: Date, Payment Method, Actions */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatDate(expense.date)}
              {expense.payment_method && (
                <>
                  <span className="mx-1">•</span>
                  {expense.payment_method}
                </>
              )}
            </p>

            {/* Actions */}
            <div className="flex items-center gap-1">
              {expense.receipt_image && (
                <button
                  onClick={() => onViewReceipt(expense)}
                  className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
                  title="View Receipt"
                >
                  <Eye className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                onClick={() => onEditExpense(expense)}
                className="p-1 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
                title="Edit"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
