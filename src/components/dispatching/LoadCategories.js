// src/components/dispatching/LoadCategories.js
"use client";

import {
  Clock,
  Truck,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Package,
  Loader,
  LayoutGrid
} from "lucide-react";

const statusConfig = {
  "All": {
    icon: LayoutGrid,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-900/30",
    activeBg: "bg-blue-600 dark:bg-blue-500",
    activeText: "text-white"
  },
  "Pending": {
    icon: Clock,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-100 dark:bg-amber-900/40",
    activeBg: "bg-amber-600 dark:bg-amber-500",
    activeText: "text-white"
  },
  "Assigned": {
    icon: Package,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-100 dark:bg-blue-900/40",
    activeBg: "bg-blue-600 dark:bg-blue-500",
    activeText: "text-white"
  },
  "In Transit": {
    icon: Truck,
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-100 dark:bg-purple-900/40",
    activeBg: "bg-purple-600 dark:bg-purple-500",
    activeText: "text-white"
  },
  "Loading": {
    icon: Loader,
    color: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-indigo-100 dark:bg-indigo-900/40",
    activeBg: "bg-indigo-600 dark:bg-indigo-500",
    activeText: "text-white"
  },
  "Unloading": {
    icon: Loader,
    color: "text-teal-600 dark:text-teal-400",
    bg: "bg-teal-100 dark:bg-teal-900/40",
    activeBg: "bg-teal-600 dark:bg-teal-500",
    activeText: "text-white"
  },
  "Delivered": {
    icon: CheckCircle,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-100 dark:bg-emerald-900/40",
    activeBg: "bg-emerald-600 dark:bg-emerald-500",
    activeText: "text-white"
  },
  "Completed": {
    icon: CheckCircle,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-100 dark:bg-emerald-900/40",
    activeBg: "bg-emerald-600 dark:bg-emerald-500",
    activeText: "text-white"
  },
  "Cancelled": {
    icon: XCircle,
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-100 dark:bg-red-900/40",
    activeBg: "bg-red-600 dark:bg-red-500",
    activeText: "text-white"
  },
  "Delayed": {
    icon: AlertTriangle,
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-100 dark:bg-orange-900/40",
    activeBg: "bg-orange-600 dark:bg-orange-500",
    activeText: "text-white"
  }
};

export default function LoadCategories({
  loads = [],
  selectedStatus = "All",
  onStatusChange,
  isLoading = false,
  className = ""
}) {
  // Calculate counts for each status
  const getStatusCounts = () => {
    const counts = {
      "All": loads.length,
      "Pending": 0,
      "Assigned": 0,
      "In Transit": 0,
      "Loading": 0,
      "Unloading": 0,
      "Delivered": 0,
      "Completed": 0,
      "Cancelled": 0,
      "Delayed": 0
    };

    loads.forEach(load => {
      if (counts.hasOwnProperty(load.status)) {
        counts[load.status]++;
      }
    });

    return counts;
  };

  const statusCounts = getStatusCounts();

  // Filter out statuses with 0 count (except All and selected)
  const visibleStatuses = Object.keys(statusConfig).filter(status => {
    if (status === "All" || status === selectedStatus) return true;
    return statusCounts[status] > 0;
  });

  if (isLoading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 ${className}`}>
        <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4"></div>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 ${className}`}>
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Filter by Status
      </h3>

      <div className="space-y-1.5">
        {visibleStatuses.map((status) => {
          const config = statusConfig[status];
          const Icon = config.icon;
          const isActive = selectedStatus === status;
          const count = statusCounts[status];

          return (
            <button
              key={status}
              onClick={() => onStatusChange(status)}
              className={`w-full flex items-center justify-between p-2.5 rounded-lg transition-all duration-200 ${
                isActive
                  ? `${config.activeBg} ${config.activeText} shadow-sm`
                  : `hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300`
              }`}
            >
              <div className="flex items-center">
                <div className={`p-1.5 rounded-md mr-2.5 ${
                  isActive ? 'bg-white/20' : config.bg
                }`}>
                  <Icon size={14} className={isActive ? 'text-white' : config.color} />
                </div>
                <span className={`text-sm font-medium ${
                  isActive ? 'text-white' : 'text-gray-700 dark:text-gray-300'
                }`}>
                  {status}
                </span>
              </div>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                isActive
                  ? 'bg-white/20 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
