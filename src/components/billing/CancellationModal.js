"use client";

import { useState } from "react";
import {
  X,
  AlertTriangle,
  RefreshCw
} from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";

export default function CancellationModal({ isOpen, onClose, onConfirm, endDate }) {
  const { t } = useTranslation('billing');
  const [step, setStep] = useState(1); // 1: reason, 2: confirm
  const [reason, setReason] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);

  const cancellationReasons = [
    { value: "too_expensive", label: t('cancellation.tooExpensive') },
    { value: "not_using", label: t('cancellation.notUsing') },
    { value: "missing_features", label: t('cancellation.missingFeatures') },
    { value: "found_alternative", label: t('cancellation.foundAlternative') },
    { value: "technical_issues", label: t('cancellation.technicalIssues') },
    { value: "temporary", label: t('cancellation.temporary') },
    { value: "other", label: t('cancellation.other') }
  ];

  const handleReasonSelect = (selectedReason) => {
    setReason(selectedReason);
    setStep(2);
  };

  const handleCancel = async () => {
    setLoading(true);

    await onConfirm({
      reason: cancellationReasons.find(r => r.value === reason)?.label || reason,
      feedback
    });

    resetAndClose();
    setLoading(false);
  };

  const resetAndClose = () => {
    setStep(1);
    setReason("");
    setFeedback("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto transition-colors duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-700 dark:to-blue-600 rounded-t-xl p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white">
              {step === 1 && t('cancellation.whyLeaving')}
              {step === 2 && t('cancellation.confirmCancellation')}
            </h3>
            <button
              onClick={resetAndClose}
              aria-label="Close"
              className="text-white/80 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Progress indicator */}
          <div className="flex gap-2 mt-4">
            {[1, 2].map((s) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  s <= step ? 'bg-white' : 'bg-white/30'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 1: Reason Selection */}
          {step === 1 && (
            <div className="space-y-3">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {t('cancellation.helpUsUnderstand')}
              </p>
              {cancellationReasons.map((reasonOption) => (
                <button
                  key={reasonOption.value}
                  onClick={() => handleReasonSelect(reasonOption.value)}
                  className="w-full text-left px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors group"
                >
                  <span className="text-gray-700 dark:text-gray-300 group-hover:text-blue-700 dark:group-hover:text-blue-300">
                    {reasonOption.label}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Step 2: Final Confirmation */}
          {step === 2 && (
            <div className="space-y-4">
              {/* Warning message */}
              <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-md">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-red-500 dark:text-red-400 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-red-800 dark:text-red-200 font-medium">{t('cancellation.areYouSure')}</p>
                    <p className="text-red-700 dark:text-red-300 text-sm mt-1">
                      {t('cancellation.subscriptionActiveUntil', { date: endDate })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Additional feedback if not already provided */}
              {!feedback && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('cancellation.anyFinalFeedback')}
                  </label>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value.slice(0, 500))}
                    placeholder={t('cancellation.tellUsMore')}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500 resize-none transition-colors"
                  />
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
                <button
                  onClick={handleCancel}
                  disabled={loading}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <RefreshCw size={16} className="mr-2 animate-spin" />
                      {t('cancellation.canceling')}
                    </>
                  ) : (
                    t('cancellation.yesCancelSubscription')
                  )}
                </button>
                <button
                  onClick={resetAndClose}
                  disabled={loading}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {t('cancellation.keepMySubscription')}
                </button>
              </div>

              {/* Back button */}
              <button
                onClick={() => setStep(step - 1)}
                className="w-full text-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                {t('cancellation.goBack')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
