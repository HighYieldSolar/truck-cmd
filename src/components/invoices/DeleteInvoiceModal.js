"use client";

// src/components/invoices/DeleteInvoiceModal.js
import { useState } from 'react';
import { AlertCircle, RefreshCw, Trash2, X } from 'lucide-react';

/**
 * A modal to confirm invoice deletion with option to delete associated load
 * 
 * @param {Object} props Component props
 * @param {boolean} props.isOpen Whether the modal is open
 * @param {Function} props.onClose Function to close the modal
 * @param {Function} props.onConfirm Function to call when deletion is confirmed
 * @param {Object} props.invoice The invoice being deleted
 * @param {boolean} props.isDeleting Whether deletion is in progress
 */
export default function DeleteInvoiceModal({
  isOpen,
  onClose,
  onConfirm,
  invoice,
  isDeleting = false
}) {
  const [deleteAssociatedLoad, setDeleteAssociatedLoad] = useState(false);

  if (!isOpen || !invoice) return null;

  // Check if this invoice has an associated load
  const hasAssociatedLoad = invoice.load_id || (invoice.loads && invoice.loads.length > 0);

  // Handle form submission
  const handleConfirm = () => {
    onConfirm(deleteAssociatedLoad);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="bg-red-500 text-white px-5 py-4 rounded-t-xl flex items-center justify-between">
          <h3 className="text-lg font-bold flex items-center">
            <AlertCircle size={20} className="mr-2" />
            Delete Confirmation
          </h3>
          <button
            onClick={onClose}
            className="text-white hover:bg-red-600 p-1 rounded-full focus:outline-none"
            disabled={isDeleting}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Trash2 size={28} className="text-red-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Delete Invoice</h3>
            <p className="text-gray-600">
              Are you sure you want to delete invoice #{invoice.invoice_number}? This action cannot be undone.
            </p>
          </div>

          {/* Show option to delete load if there's an associated load */}
          {hasAssociatedLoad && (
            <div className="mb-6 border-t border-b border-gray-200 py-4 px-2">
              <div className="flex items-center">
                <input
                  id="delete-load-checkbox"
                  type="checkbox"
                  checked={deleteAssociatedLoad}
                  onChange={() => setDeleteAssociatedLoad(!deleteAssociatedLoad)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="delete-load-checkbox" className="ml-2 block text-sm text-gray-700">
                  Also delete associated load
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-1 ml-6">
                If checked, the load linked to this invoice will also be deleted.
              </p>
            </div>
          )}

          <div className="flex justify-center space-x-4">
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors min-w-[100px]"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isDeleting}
              className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors flex items-center justify-center min-w-[100px]"
            >
              {isDeleting ? (
                <>
                  <RefreshCw size={16} className="animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}