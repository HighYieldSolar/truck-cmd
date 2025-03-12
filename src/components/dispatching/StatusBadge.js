// src/components/dispatching/StatusBadge.js
"use client";

/**
 * Status badge component for displaying the status of a load.
 * 
 * @param {Object} props
 * @param {string} props.status - The status to display
 * @param {string} [props.className] - Additional CSS classes
 */
export default function StatusBadge({ status, className = "" }) {
  const statusStyles = {
    "Pending": "bg-yellow-100 text-yellow-800",
    "Assigned": "bg-blue-100 text-blue-800",
    "In Transit": "bg-purple-100 text-purple-800",
    "Loading": "bg-indigo-100 text-indigo-800",
    "Unloading": "bg-teal-100 text-teal-800",
    "Delivered": "bg-green-100 text-green-800",
    "Cancelled": "bg-red-100 text-red-800",
    "Completed": "bg-green-100 text-green-800",
    "Delayed": "bg-orange-100 text-orange-800"
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[status] || "bg-gray-100 text-gray-800"} ${className}`}>
      {status}
    </span>
  );
}