// src/components/fuel/FuelDeletionModal.js
import { useState } from "react";
import { RefreshCw, AlertTriangle, X, Trash2, FileText, DollarSign, Fuel } from "lucide-react";

/**
 * Specialized deletion modal for fuel entries with linked expenses
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {function} props.onClose - Function to close the modal
 * @param {function} props.onConfirm - Function called with deleteLinkedExpense flag when confirmed
 * @param {Object} props.fuelEntry - The fuel entry to delete
 * @param {boolean} props.isDeleting - Whether the delete operation is in progress
 */
export default function FuelDeletionModal({
  isOpen,
  onClose,
  onConfirm,
  fuelEntry,
  isDeleting = false
}) {
  const [deleteLinkedExpense, setDeleteLinkedExpense] = useState(true);

  if (!isOpen || !fuelEntry) return null;

  const hasLinkedExpense = !!fuelEntry.expense_id;
  const formattedAmount = parseFloat(fuelEntry.total_amount).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD'
  });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 p-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center">
            <Trash2 size={20} className="text-red-500 dark:text-red-400 mr-2" />
            Delete Fuel Entry
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            disabled={isDeleting}
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/40">
                <Fuel className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Delete &quot;{fuelEntry.location}&quot; fuel purchase?
              </h3>

              <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <p><span className="font-medium text-gray-700 dark:text-gray-300">Date:</span> {new Date(fuelEntry.date).toLocaleDateString()}</p>
                <p><span className="font-medium text-gray-700 dark:text-gray-300">Gallons:</span> {fuelEntry.gallons.toFixed(3)}</p>
                <p><span className="font-medium text-gray-700 dark:text-gray-300">Amount:</span> {formattedAmount}</p>
              </div>

              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                This action cannot be undone. This fuel entry will be permanently deleted from your records.
              </p>

              {/* Option for linked expense if applicable */}
              {hasLinkedExpense && (
                <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div className="flex items-start mb-2">
                    <DollarSign size={18} className="text-red-500 dark:text-red-400 mr-2 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">This fuel entry has a linked expense record</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">The expense created from this fuel entry appears in your Expenses section.</p>
                    </div>
                  </div>

                  <label className="flex items-center mt-3 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={deleteLinkedExpense}
                      onChange={() => setDeleteLinkedExpense(!deleteLinkedExpense)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded mr-2 bg-white dark:bg-gray-700"
                    />
                    <span className="flex items-center">
                      <FileText size={16} className="text-gray-500 dark:text-gray-400 mr-1.5" />
                      Also delete the linked expense record
                    </span>
                  </label>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 ml-6">
                    If unchecked, the expense record will remain in your expenses but will no longer be linked to this fuel entry.
                  </p>
                </div>
              )}
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
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(hasLinkedExpense ? deleteLinkedExpense : false)}
            className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 flex items-center transition-colors disabled:opacity-60"
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <RefreshCw size={16} className="animate-spin mr-2" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 size={16} className="mr-2" />
                Delete Fuel Entry
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
