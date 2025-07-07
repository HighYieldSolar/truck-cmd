"use client";

import { useState } from "react";
import { X, AlertTriangle, RefreshCw } from "lucide-react";

export default function CancellationModal({ isOpen, onClose, onConfirm, endDate }) {
  const [reason, setReason] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);

  const cancellationReasons = [
    "Too expensive",
    "Not using it enough",
    "Missing features I need",
    "Found a better alternative",
    "Technical issues",
    "Customer service",
    "Temporary - will be back",
    "Other"
  ];

  const handleCancel = async () => {
    setLoading(true);
    
    // Pass the cancellation data to parent
    await onConfirm({
      reason,
      feedback
    });
    
    // Reset form
    setReason("");
    setFeedback("");
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-400 rounded-t-lg p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white">Cancel Subscription</h3>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Warning message */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-md mb-6">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-blue-500 mt-0.5 mr-3" />
              <div>
                <p className="text-blue-800 font-medium">Important Notice</p>
                <p className="text-blue-700 text-sm mt-1">
                  Your subscription will remain active until <span className="font-semibold">{endDate}</span>. 
                  You'll continue to have full access to all features until then.
                </p>
              </div>
            </div>
          </div>

          {/* Optional Reason dropdown */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Help us improve (optional)
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            >
              <option value="">Select a reason</option>
              {cancellationReasons.map((reasonOption) => (
                <option key={reasonOption} value={reasonOption}>
                  {reasonOption}
                </option>
              ))}
            </select>
          </div>

          {/* Optional Feedback textarea */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional feedback (optional)
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value.slice(0, 500))}
              placeholder="Tell us more about your experience..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-gray-900 resize-none"
            />
            <div className="mt-1 text-right">
              <span className="text-sm text-gray-500">{feedback.length}/500</span>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 my-6"></div>

          {/* Action buttons */}
          <div className="flex items-center justify-end space-x-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              Keep Subscription
            </button>
            <button
              onClick={handleCancel}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="mr-2 animate-spin" />
                  Canceling...
                </>
              ) : (
                'Yes, Cancel Subscription'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}