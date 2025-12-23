"use client";

import Link from "next/link";
import {
  Truck,
  Plus,
  ArrowRight
} from "lucide-react";
import { formatDateForDisplayMMDDYYYY } from "@/lib/utils/dateUtils";
import { useTranslation } from "@/context/LanguageContext";

// Format dates for display
const formatDate = (dateString) => {
  if (!dateString) return "N/A";

  try {
    return formatDateForDisplayMMDDYYYY(dateString);
  } catch (error) {
    return dateString || "N/A";
  }
};

export default function VehicleListComponent({ trucks, handleTruckSelect }) {
  const { t } = useTranslation('fleet');
  // Status badge styling with dark mode
  const getStatusColors = (status) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'In Maintenance':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case 'Out of Service':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'Idle':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700 mb-6">
      <div className="bg-gray-50 dark:bg-gray-700/50 px-5 py-4 border-b border-gray-200 dark:border-gray-600 flex justify-between items-center">
        <h3 className="font-medium text-gray-700 dark:text-gray-200 flex items-center">
          <Truck size={18} className="mr-2 text-blue-600 dark:text-blue-400" />
          {t('vehicles.recentVehicles')}
        </h3>
        <Link
          href="/dashboard/fleet/trucks"
          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center"
        >
          {t('vehicles.viewAll')}
          <ArrowRight size={14} className="ml-1" />
        </Link>
      </div>
      <div className="p-4">
        {trucks.length === 0 ? (
          <div className="text-center py-8">
            <div className="mx-auto h-12 w-12 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center mb-4">
              <Truck size={24} className="text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">{t('emptyState.noVehiclesFound')}</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">{t('emptyState.addFirstVehicle')}</p>
            <Link
              href="/dashboard/fleet/trucks"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              <Plus size={16} className="mr-2" />
              {t('vehicles.addVehicle')}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {trucks.map(truck => {
              return (
                <div
                  key={truck.id}
                  className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md dark:hover:bg-gray-700/50 transition-all cursor-pointer bg-white dark:bg-gray-800"
                  onClick={() => handleTruckSelect(truck)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate">{truck.name}</h4>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusColors(truck.status)}`}>
                      {truck.status}
                    </span>
                  </div>
                  <div className="flex items-center text-gray-500 dark:text-gray-400 mb-3">
                    <Truck size={14} className="mr-2" />
                    <span className="text-sm">{truck.year} {truck.make} {truck.model}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">{t('vehicles.vin')}</p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{truck.vin ? `...${truck.vin.slice(-6)}` : 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">{t('vehicles.license')}</p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{truck.license_plate || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">{t('vehicles.added')}</p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{formatDate(truck.created_at)?.split(' ').slice(0, 2).join(' ')}</p>
                    </div>
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
