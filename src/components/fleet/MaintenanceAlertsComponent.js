"use client";

import { 
  FileCog,
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

export default function MaintenanceAlertsComponent({ upcomingMaintenance }) {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6 border border-gray-200">
      <div className="bg-blue-500 px-5 py-4 text-white">
        <h3 className="font-semibold flex items-center">
          <FileCog size={18} className="mr-2" />
          Upcoming Maintenance
        </h3>
      </div>
      <div className="p-4">
        {upcomingMaintenance.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <CheckCircle size={36} className="mx-auto mb-2 text-green-500" />
            <p>No upcoming maintenance</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingMaintenance.map(item => {
              const dueDate = new Date(item.due_date);
              const today = new Date();
              const daysLeft = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
              
              return (
                <div key={item.id} className="p-3 bg-gray-50 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">{item.maintenance_type}</p>
                      <p className="text-sm text-gray-500">{item.trucks?.name || 'Unknown Vehicle'}</p>
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      daysLeft <= 7 ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {daysLeft} days
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    Due: {formatDate(item.due_date)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}