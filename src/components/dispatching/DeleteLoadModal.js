// src/components/dispatching/DeleteLoadModal.js
"use client";

import { AlertCircle, RefreshCw } from "lucide-react";

export default function DeleteLoadModal({ isOpen, onClose, onConfirm, loadNumber, isDeleting }) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-center mb-4 text-red-600">
          <AlertCircle size={40} />
        </div>
        <h3 className="text-lg font-medium text-center text-gray-900 mb-2">
          Delete Load
        </h3>
        <p className="text-center text-gray-500 mb-6">
          Are you sure you want to delete Load <strong>#{loadNumber}</strong>? This action cannot be undone.
        </p>
        <div className="flex justify-center space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 flex items-center"
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <RefreshCw size={16} className="animate-spin mr-2" />
                Deleting...
              </>
            ) : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}