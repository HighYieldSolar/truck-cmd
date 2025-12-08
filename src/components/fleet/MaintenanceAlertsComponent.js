"use client";

import Link from "next/link";
import {
  FileCog,
  CheckCircle,
  ArrowRight
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
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden mb-6 border border-gray-200 dark:border-gray-700">
      <div className="bg-blue-500 dark:bg-blue-600 px-5 py-4 text-white">
        <h3 className="font-semibold flex items-center">
          <FileCog size={18} className="mr-2" />
          Upcoming Maintenance
        </h3>
      </div>
      <div className="p-4">
        {upcomingMaintenance.length === 0 ? (
          <div className="text-center py-6 text-gray-500 dark:text-gray-400">
            <CheckCircle size={36} className="mx-auto mb-2 text-green-500 dark:text-green-400" />
            <p>No upcoming maintenance</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingMaintenance.map(item => {
              const dueDate = new Date(item.due_date);
              const today = new Date();
              const daysLeft = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

              return (
                <Link
                  key={item.id}
                  href="/dashboard/fleet/maintenance"
                  className="block p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">{item.maintenance_type}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{item.vehicles?.name || 'Unknown Vehicle'}</p>
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ml-2 ${daysLeft <= 7
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                      }`}>
                      {daysLeft} days
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Due: {formatDate(item.due_date)}
                  </div>
                </Link>
              );
            })}

            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600 text-center">
              <Link
                href="/dashboard/fleet/maintenance"
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center justify-center w-full"
              >
                View all maintenance
                <ArrowRight size={14} className="ml-1" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
