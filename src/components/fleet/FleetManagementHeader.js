"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Plus, 
  Download
} from "lucide-react";

export default function FleetManagementHeader() {
  return (
    <div className="mb-8 bg-gradient-to-r from-blue-600 to-blue-400 rounded-xl shadow-md p-6 text-white">
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
            <Plus size={18} className="mr-2" />
            Add Vehicle
          </Link>
          <Link
            href="/dashboard/fleet/drivers"
            className="px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors shadow-sm flex items-center font-medium"
          >
            <Plus size={18} className="mr-2" />
            Add Driver
          </Link>
        </div>
      </div>
    </div>
  );
}