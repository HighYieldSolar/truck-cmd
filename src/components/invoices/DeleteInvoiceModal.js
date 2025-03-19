// src/components/invoices/DeleteInvoiceModal.js
import { useState } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

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
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-center mb-4 text-red-600">
          <AlertCircle size={40} />
        </div>
        <h3 className="text-lg font-medium text-center mb-2">Delete Invoice</h3>
        <p className="text-center text-gray-500 mb-6">
          Are you sure you want to delete invoice #{invoice.invoice_number}? This action cannot be undone.
        </p>
        
        {/* Show option to delete load if there's an associated load */}
        {hasAssociatedLoad && (
          <div className="mb-6">
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
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 flex items-center"
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <RefreshCw size={16} className="mr-2 animate-spin" />
                Deleting...
              </>
            ) : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}