"use client";

import Link from "next/link";
import {
  Wrench,
  FileCog,
  BarChart2,
  Users,
  Zap
} from "lucide-react";

export default function QuickActionsComponent() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
      <div className="bg-gray-50 dark:bg-gray-700/50 px-5 py-4 border-b border-gray-200 dark:border-gray-600">
        <h3 className="font-medium text-gray-700 dark:text-gray-200 flex items-center">
          <Zap size={18} className="mr-2 text-blue-600 dark:text-blue-400" />
          Quick Actions
        </h3>
      </div>
      <div className="p-4 grid grid-cols-2 gap-3">
        <Link
          href="/dashboard/fleet/maintenance"
          className="flex flex-col items-center justify-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-200 dark:hover:border-blue-700 transition-colors"
        >
          <Wrench size={20} className="text-blue-600 dark:text-blue-400 mb-2" />
          <span className="text-xs font-medium text-gray-700 dark:text-gray-200 text-center">Maintenance</span>
        </Link>
        <Link
          href="/dashboard/compliance"
          className="flex flex-col items-center justify-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-200 dark:hover:border-blue-700 transition-colors"
        >
          <FileCog size={20} className="text-blue-600 dark:text-blue-400 mb-2" />
          <span className="text-xs font-medium text-gray-700 dark:text-gray-200 text-center">Manage Documents</span>
        </Link>
        <Link
          href="/dashboard/fleet/trucks"
          className="flex flex-col items-center justify-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-200 dark:hover:border-blue-700 transition-colors"
        >
          <BarChart2 size={20} className="text-blue-600 dark:text-blue-400 mb-2" />
          <span className="text-xs font-medium text-gray-700 dark:text-gray-200 text-center">Vehicle Reports</span>
        </Link>
        <Link
          href="/dashboard/fleet/drivers"
          className="flex flex-col items-center justify-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-200 dark:hover:border-blue-700 transition-colors"
        >
          <Users size={20} className="text-blue-600 dark:text-blue-400 mb-2" />
          <span className="text-xs font-medium text-gray-700 dark:text-gray-200 text-center">Driver Reports</span>
        </Link>
      </div>
    </div>
  );
}
