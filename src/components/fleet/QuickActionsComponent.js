"use client";

import Link from "next/link";
import { 
  Calendar,
  FileCog,
  BarChart2,
  Users
} from "lucide-react";

export default function QuickActionsComponent() {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
      <div className="bg-gray-50 px-5 py-4 border-b border-gray-200">
        <h3 className="font-medium text-gray-800 flex items-center">
          Quick Actions
        </h3>
      </div>
      <div className="p-4 grid grid-cols-2 gap-3">
        <Link
          href="/dashboard/fleet/maintenance/schedule"
          className="flex flex-col items-center justify-center p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-200 transition-colors"
        >
          <Calendar size={20} className="text-blue-600 mb-2" />
          <span className="text-xs font-medium text-gray-700 text-center">Schedule Maintenance</span>
        </Link>
        <Link
          href="/dashboard/fleet/documents"
          className="flex flex-col items-center justify-center p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-200 transition-colors"
        >
          <FileCog size={20} className="text-blue-600 mb-2" />
          <span className="text-xs font-medium text-gray-700 text-center">Manage Documents</span>
        </Link>
        <Link
          href="/dashboard/fleet/trucks/reports"
          className="flex flex-col items-center justify-center p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-200 transition-colors"
        >
          <BarChart2 size={20} className="text-blue-600 mb-2" />
          <span className="text-xs font-medium text-gray-700 text-center">Vehicle Reports</span>
        </Link>
        <Link
          href="/dashboard/fleet/drivers/reports"
          className="flex flex-col items-center justify-center p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-200 transition-colors"
        >
          <Users size={20} className="text-blue-600 mb-2" />
          <span className="text-xs font-medium text-gray-700 text-center">Driver Reports</span>
        </Link>
      </div>
    </div>
  );
}