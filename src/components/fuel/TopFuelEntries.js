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
      <div className="text-center py-8 text-gray-500">
        <Fuel size={36} className="mx-auto mb-2 text-gray-400" />
        <p>No fuel purchases found</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map(entry => (
        <div 
          key={entry.id}
          className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center mb-1">
                <Fuel size={16} className="text-yellow-600 mr-2" />
                <span className="text-sm font-medium text-gray-900 truncate max-w-[150px]">
                  {entry.location}
                </span>
              </div>
              <p className="text-xs text-gray-500 flex items-center">
                <span>{formatDate(entry.date)}</span>
                <span className="mx-1">•</span>
                <span>{entry.gallons.toFixed(3)} gal</span>
              </p>
            </div>
            <span className="text-sm font-medium text-red-600">
              {formatCurrency(entry.total_amount)}
            </span>
          </div>
          
          <div className="mt-2 pt-2 border-t border-gray-200 flex justify-end space-x-2">
            {entry.receipt_image && (
              <button
                onClick={() => onViewReceipt(entry)}
                className="text-blue-600 hover:text-blue-800 p-1"
                title="View Receipt"
              >
                <Image size={14} alt="View Receipt" />
              </button>
            )}
            <button
              onClick={() => onEditFuelEntry(entry)}
              className="text-green-600 hover:text-green-800 p-1"
              title="Edit Fuel Entry"
            >
              <Edit size={14} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}