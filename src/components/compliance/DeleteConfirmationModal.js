"use client";

import { AlertCircle, RefreshCw } from "lucide-react";

export default function DeleteConfirmationModal({ isOpen, onClose, onConfirm, complianceTitle, isDeleting }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 ">
      <div className="bg-white rounded-lg shadow-xl p-6 border border-gray-200 max-w-md w-full">
        <div className="flex items-center justify-center mb-4 text-red-600">
          <AlertCircle size={40} />
        </div>
        <h3 className="text-lg font-medium text-gray-900 text-center mb-6">Delete Compliance Record</h3>
        <p className="text-center text-gray-500 mb-6">
          Are you sure you want to delete &quot;{complianceTitle}&quot;? This action cannot be undone.
        </p>
        <div className="flex justify-center space-x-4 border-t border-gray-200 mt-4 pt-4">
          <button
            onClick={onClose}
            className="btn btn-secondary"
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 flex items-center"
            disabled={isDeleting} className="btn btn-danger"
          >
            {isDeleting ? (
              <>
                <RefreshCw size={16} className="mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}