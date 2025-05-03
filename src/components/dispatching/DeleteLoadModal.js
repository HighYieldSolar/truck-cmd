// src/components/dispatching/DeleteLoadModal.js
"use client";

import { AlertCircle, RefreshCw, X } from "lucide-react";

export default function DeleteLoadModal({ isOpen, onClose, onConfirm, loadNumber, isDeleting }) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-red-100 mr-3">
              <AlertCircle size={24} className="text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              Delete Load
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 rounded-lg p-1 hover:bg-gray-100 transition-colors"
            disabled={isDeleting}
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6">
          <p className="text-center text-gray-600 mb-6">
            Are you sure you want to delete Load <strong className="text-gray-900">#{loadNumber}</strong>? This action cannot be undone.
          </p>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-medium text-red-800 mb-1">
              This will permanently delete:
            </h3>
            <ul className="text-sm text-red-700 list-disc pl-4 space-y-1">
              <li>All load details and documentation</li>
              <li>Assignment information</li>
              <li>Any associated delivery notes</li>
            </ul>
          </div>
        </div>
        
        {/* Actions */}
        <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none flex items-center transition-colors"
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