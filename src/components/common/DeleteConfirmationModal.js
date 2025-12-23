"use client";

import { RefreshCw, AlertTriangle, X } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";

/**
 * A reusable confirmation modal for delete operations
 *
 * @param {Object} props Component props
 * @param {boolean} props.isOpen Whether the modal is open
 * @param {Function} props.onClose Function to close the modal
 * @param {Function} props.onConfirm Function to call when deletion is confirmed
 * @param {string} props.title Modal title
 * @param {string} props.message Confirmation message
 * @param {string} props.itemName Name of the item being deleted (optional)
 * @param {boolean} props.isDeleting Whether delete operation is in progress
 * @param {string} props.confirmButtonText Text for confirm button (defaults to "Delete")
 */
export default function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  itemName,
  isDeleting = false,
  confirmButtonText
}) {
  const { t } = useTranslation('common');

  // Use translated defaults if not provided
  const displayTitle = title || t('deleteConfirmation.title');
  const displayMessage = message || t('deleteConfirmation.message');
  const displayConfirmText = confirmButtonText || t('buttons.delete');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full mx-4 border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 p-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {displayTitle}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            disabled={isDeleting}
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                {itemName ? t('deleteConfirmation.deleteItem', { itemName }) : t('deleteConfirmation.confirmTitle')}
              </h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {displayMessage}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 flex justify-end space-x-3 rounded-b-xl border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            disabled={isDeleting}
          >
            {t('buttons.cancel')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 focus:outline-none flex items-center transition-colors disabled:opacity-50"
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <RefreshCw size={16} className="animate-spin mr-2" />
                {t('deleteConfirmation.deleting')}
              </>
            ) : (
              displayConfirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
}