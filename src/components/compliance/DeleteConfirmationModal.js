"use client";

import { AlertCircle, RefreshCw, Trash2, X } from "lucide-react";

export default function DeleteConfirmationModal({ isOpen, onClose, onConfirm, complianceTitle, isDeleting }) {
  if (!isOpen) return null;

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
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Delete Compliance Record</h3>
            <p className="text-gray-600">
              Are you sure you want to delete &quot;{complianceTitle}&quot;? This action cannot be undone.
            </p>
          </div>
          
          <div className="flex justify-center space-x-4">
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors min-w-[100px]"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
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