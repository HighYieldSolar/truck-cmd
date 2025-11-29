// src/components/fuel/TopFuelEntries.js
"use client";

import { 
  Fuel, 
  MapPin, 
  Image,
  Edit
} from "lucide-react";

export default function TopFuelEntries({ 
  entries, 
  onViewReceipt, 
  onEditFuelEntry 
}) {
  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (entries.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <Fuel size={36} className="mx-auto mb-2 text-gray-400 dark:text-gray-500" />
        <p>No fuel purchases found</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map((entry, index) => (
        <div
          key={entry.id}
          className="group p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-pointer transition-all duration-200 border border-transparent hover:border-blue-200 dark:hover:border-blue-700"
        >
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <div className="flex items-center mb-1.5">
                <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center mr-2.5 flex-shrink-0">
                  <Fuel size={14} className="text-amber-600 dark:text-amber-400" />
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {entry.location}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center ml-9">
                <span className="font-medium">{formatDate(entry.date)}</span>
                <span className="mx-1.5 text-gray-300 dark:text-gray-600">•</span>
                <span>{entry.gallons.toFixed(3)} gal</span>
              </p>
            </div>
            <div className="flex flex-col items-end ml-3">
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {formatCurrency(entry.total_amount)}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); onEditFuelEntry(entry); }}
                className="mt-1 opacity-0 group-hover:opacity-100 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 p-1 transition-opacity duration-200"
                title="Edit Fuel Entry"
              >
                <Edit size={14} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}