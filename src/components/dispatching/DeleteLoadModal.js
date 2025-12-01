// src/components/dispatching/DeleteLoadModal.js
"use client";

import { AlertTriangle, X, Loader2, Trash2 } from "lucide-react";

export default function DeleteLoadModal({
  isOpen,
  onClose,
  onConfirm,
  loadNumber,
  isDeleting = false
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 dark:bg-black/70 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full transform transition-all">
          {/* Close button */}
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="absolute top-4 right-4 p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X size={20} />
          </button>

          {/* Content */}
          <div className="p-6">
            {/* Warning Icon */}
            <div className="mx-auto w-14 h-14 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle size={28} className="text-red-600 dark:text-red-400" />
            </div>

            {/* Title */}
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 text-center mb-2">
              Delete Load
            </h3>

            {/* Description */}
            <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
              Are you sure you want to delete load{' '}
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                #{loadNumber}
              </span>
              ? This action cannot be undone.
            </p>

            {/* Warning Box */}
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
              <h4 className="text-sm font-medium text-red-800 dark:text-red-300 mb-2">
                This will permanently delete:
              </h4>
              <ul className="text-sm text-red-700 dark:text-red-400 list-disc pl-4 space-y-1">
                <li>All load details and documentation</li>
                <li>Assignment information</li>
                <li>Any associated delivery notes</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 text-white bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 rounded-lg font-medium transition-colors disabled:opacity-50 inline-flex items-center justify-center"
              >
                {isDeleting ? (
                  <>
                    <Loader2 size={18} className="mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={18} className="mr-2" />
                    Delete Load
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
