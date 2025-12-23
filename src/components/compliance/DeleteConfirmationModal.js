"use client";

import { AlertCircle, RefreshCw, Trash2, X } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";

export default function DeleteConfirmationModal({ isOpen, onClose, onConfirm, complianceTitle, isDeleting }) {
  const { t } = useTranslation('compliance');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="bg-red-500 dark:bg-red-600 text-white px-5 py-4 rounded-t-xl flex items-center justify-between">
          <h3 className="text-lg font-bold flex items-center">
            <AlertCircle size={20} className="mr-2" />
            {t('deleteModal.title')}
          </h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-white hover:bg-red-600 dark:hover:bg-red-700 p-1 rounded-full focus:outline-none transition-colors"
            disabled={isDeleting}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
              <Trash2 size={28} className="text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{t('deleteModal.deleteRecord')}</h3>
            <p className="text-gray-600 dark:text-gray-400">
              {t('deleteModal.confirmText', { title: complianceTitle })}
            </p>
          </div>

          <div className="flex justify-center space-x-4">
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors min-w-[100px]"
            >
              {t('common:buttons.cancel')}
            </button>
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors flex items-center justify-center min-w-[100px]"
            >
              {isDeleting ? (
                <>
                  <RefreshCw size={16} className="animate-spin mr-2" />
                  {t('deleteModal.deleting')}
                </>
              ) : (
                t('common:buttons.delete')
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}