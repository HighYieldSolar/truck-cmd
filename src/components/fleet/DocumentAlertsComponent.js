"use client";

import Link from "next/link";
import { 
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import { formatDateForDisplayMMDDYYYY } from "@/lib/utils/dateUtils";

// Format dates for display
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  
  try {
    return formatDateForDisplayMMDDYYYY(dateString);
  } catch (error) {
    return dateString || "N/A";
  }
};

export default function DocumentAlertsComponent({ documentReminders, handleDriverSelect }) {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6 border border-gray-200">
      <div className="bg-orange-500 px-5 py-4 text-white">
        <h3 className="font-semibold flex items-center">
          <AlertTriangle size={18} className="mr-2" />
          Document Alerts
        </h3>
      </div>
      <div className="p-4">
        {documentReminders.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <CheckCircle size={36} className="mx-auto mb-2 text-green-500" />
            <p>No documents expiring soon</p>
          </div>
        ) : (
          <div className="space-y-3">
            {documentReminders.slice(0, 5).map(item => {
              return (
                <div 
                  key={item.id}
                  className="p-3 bg-gray-50 rounded-lg hover:bg-orange-50 cursor-pointer transition-colors"
                  onClick={() => handleDriverSelect({id: item.driverId})}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm truncate">{item.driver}</p>
                      <p className="text-sm text-gray-500">{item.type} expires on {formatDate(item.expiryDate)}</p>
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      item.daysRemaining <= 7 ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'
                    }`}>
                      {item.daysRemaining} days
                    </span>
                  </div>
                </div>
              );
            })}
          
            {documentReminders.length > 5 && (
              <div className="mt-2 pt-2 border-t border-gray-200 text-center">
                <Link 
                  href="/dashboard/fleet/drivers"
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center justify-center w-full"
                >
                  View all expirations
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}