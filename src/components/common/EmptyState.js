// src/components/common/EmptyState.js
"use client";

export default function EmptyState({ 
  message = "No data to display",
  description = "There is no data available for the current filters.",
  icon,
  actionText = "",
  onAction = null
}) {
  return (
    <div className="text-center py-12 bg-white rounded-lg shadow">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-medium text-gray-900">{message}</h3>
      <p className="mt-2 text-gray-500 max-w-md mx-auto">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="mt-6 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}