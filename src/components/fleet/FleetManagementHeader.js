"use client";

import Link from "next/link";
import {
  Plus,
  Download,
  Truck,
  Users
} from "lucide-react";

export default function FleetManagementHeader({ onExport }) {
  return (
    <div className="mb-8 bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-700 dark:to-blue-600 rounded-xl shadow-md p-6 text-white">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="mb-4 md:mb-0">
          <h1 className="text-3xl font-bold mb-1">Fleet Management</h1>
          <p className="text-blue-100">Manage your vehicles, drivers, and fleet operations</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard/fleet/trucks"
            className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors shadow-sm flex items-center font-medium"
          >
            <Truck size={18} className="mr-2" />
            Manage Vehicles
          </Link>
          <Link
            href="/dashboard/fleet/drivers"
            className="px-4 py-2 bg-blue-700 dark:bg-blue-800 text-white rounded-lg hover:bg-blue-800 dark:hover:bg-blue-900 transition-colors shadow-sm flex items-center font-medium"
          >
            <Users size={18} className="mr-2" />
            Manage Drivers
          </Link>
        </div>
      </div>
    </div>
  );
}
