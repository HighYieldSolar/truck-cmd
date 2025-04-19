// src/components/common/EmptyState.js
import { PlusCircle } from "lucide-react";

export default function EmptyState({
  message = "No data found",
  description = "",
  icon = null,
  actionText = "",
  onAction = null
}) {
  return (
    <div className="text-center py-12 px-6">
      <div className="mx-auto mb-6 w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
        {icon}
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-1">{message}</h3>
      {description && (
        <p className="text-gray-500 max-w-md mx-auto mb-5">{description}</p>
      )}
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="mt-2 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusCircle size={16} className="mr-2" />
          {actionText}
        </button>
      )}
    </div>
  );
}