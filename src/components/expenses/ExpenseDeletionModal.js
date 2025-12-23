'use client';

import { AlertTriangle, Trash2, X, RefreshCw } from 'lucide-react';
import { useTranslation } from "@/context/LanguageContext";

/**
 * Expense Deletion Modal
 *
 * Confirmation modal for deleting expenses following the design spec pattern.
 */
export default function ExpenseDeletionModal({
  isOpen,
  onClose,
  onConfirm,
  expense,
  isDeleting
}) {
  const { t } = useTranslation('expenses');

  if (!isOpen || !expense) return null;

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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Positioning */}
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Modal Content */}
        <div
          className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md transform transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Icon Header */}
          <div className="pt-6 px-6 text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {t('deleteModal.title')}
            </h3>
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-4">
              {t('deleteModal.description')}
            </p>

            {/* Entry Details Card */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">{t('deleteModal.descriptionLabel')}</span>
                <span className="font-medium text-gray-900 dark:text-gray-100 text-right truncate ml-2 max-w-[180px]">
                  {expense.description || t('deleteModal.noDescription')}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">{t('deleteModal.dateLabel')}</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {formatDate(expense.date)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">{t('deleteModal.categoryLabel')}</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {expense.category || t('categories.other')}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">{t('deleteModal.amountLabel')}</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {formatCurrency(expense.amount)}
                </span>
              </div>
            </div>

            {/* Warning about receipt */}
            {expense.receipt_image && (
              <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  <strong>{t('deleteModal.note')}</strong> {t('deleteModal.receiptWarning')}
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl flex gap-3 justify-end">
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              {t('deleteModal.cancel')}
            </button>
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isDeleting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  {t('deleteModal.deleting')}
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  {t('deleteModal.delete')}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
