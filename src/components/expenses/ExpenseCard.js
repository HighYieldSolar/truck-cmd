'use client';

import { Pencil, Trash2, Eye, Receipt, CheckCircle } from 'lucide-react';
import TableActions from '@/components/shared/TableActions';
import { useTranslation } from "@/context/LanguageContext";

/**
 * Expense Card Component (Mobile View)
 *
 * Displays expense data in a card format for mobile devices.
 * Follows the design spec mobile card pattern.
 */
export default function ExpenseCard({ expense, onEdit, onDelete, onViewReceipt }) {
  const { t } = useTranslation('expenses');

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
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Get category color
  const getCategoryColor = (category) => {
    const colors = {
      Fuel: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
      Maintenance: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
      Insurance: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
      Tolls: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
      Office: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
      Permits: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
      Meals: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
      Other: 'bg-slate-100 dark:bg-slate-900/30 text-slate-700 dark:text-slate-400'
    };
    return colors[category] || colors.Other;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-200">
      {/* Card Header */}
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate flex-1 mr-2">
          {expense.description || t('card.noDescription')}
        </h4>
        <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
          {formatCurrency(expense.amount)}
        </span>
      </div>

      {/* Card Body - 2x2 Grid */}
      <div className="p-4 grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('card.date')}</p>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {formatDate(expense.date)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('card.category')}</p>
          <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${getCategoryColor(expense.category)}`}>
            {expense.category || 'Other'}
          </span>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('card.payment')}</p>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {expense.payment_method || t('common.na')}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('card.deductible')}</p>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center gap-1">
            {expense.deductible !== false ? (
              <>
                <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                {t('card.yes')}
              </>
            ) : (
              t('card.no')
            )}
          </p>
        </div>
      </div>

      {/* Card Footer */}
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
        {/* Receipt Indicator */}
        <div className="flex items-center gap-2">
          {expense.receipt_image ? (
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
              <Receipt className="h-3 w-3 mr-1" />
              {t('card.receipt')}
            </span>
          ) : (
            <span className="text-xs text-gray-400 dark:text-gray-500">{t('card.noReceipt')}</span>
          )}
        </div>

        {/* Action Buttons */}
        <TableActions
          onView={expense.receipt_image ? () => onViewReceipt(expense) : undefined}
          onEdit={() => onEdit(expense)}
          onDelete={() => onDelete(expense)}
          size="md"
        />
      </div>
    </div>
  );
}
