"use client";

import Link from "next/link";
import {
  Users,
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

export default function DriverListComponent({ drivers, handleDriverSelect }) {
  const { t } = useTranslation('fleet');
  // Status badge styling with dark mode
  const getStatusColors = (status) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'Inactive':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'On Leave':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  // Calculate days until license expiry
  const getLicenseStatus = (driver) => {
    if (!driver.license_expiry) return null;

    const now = new Date();
    const expiry = new Date(driver.license_expiry);
    const daysUntilExpiry = Math.floor((expiry - now) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) {
      return { text: t('drivers.expired'), class: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' };
    } else if (daysUntilExpiry < 30) {
      return { text: t('drivers.daysUntilExpiry', { days: daysUntilExpiry }), class: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' };
    } else {
      return { text: t('drivers.valid'), class: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' };
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
      <div className="bg-gray-50 dark:bg-gray-700/50 px-5 py-4 border-b border-gray-200 dark:border-gray-600 flex justify-between items-center">
        <h3 className="font-medium text-gray-700 dark:text-gray-200 flex items-center">
          <Users size={18} className="mr-2 text-blue-600 dark:text-blue-400" />
          {t('drivers.recentDrivers')}
        </h3>
        <Link
          href="/dashboard/fleet/drivers"
          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center"
        >
          {t('drivers.viewAll')}
          <ArrowRight size={14} className="ml-1" />
        </Link>
      </div>
      <div className="p-4">
        {drivers.length === 0 ? (
          <div className="text-center py-8">
            <div className="mx-auto h-12 w-12 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center mb-4">
              <Users size={24} className="text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">{t('emptyState.noDrivers')}</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">{t('drivers.addFirstDriverHint')}</p>
            <Link
              href="/dashboard/fleet/drivers"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              <Plus size={16} className="mr-2" />
              {t('drivers.addDriver')}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {drivers.map(driver => {
              const licenseStatus = getLicenseStatus(driver);

              return (
                <div
                  key={driver.id}
                  className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md dark:hover:bg-gray-700/50 transition-all cursor-pointer bg-white dark:bg-gray-800"
                  onClick={() => handleDriverSelect(driver)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate">{driver.name}</h4>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusColors(driver.status)}`}>
                      {driver.status}
                    </span>
                  </div>
                  <div className="flex items-center text-gray-500 dark:text-gray-400 mb-3">
                    <Users size={14} className="mr-2" />
                    <span className="text-sm">{driver.position || t('drivers.defaultPosition')}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">{t('drivers.phone')}</p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{driver.phone || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">{t('drivers.license')}</p>
                      <div className="flex items-center">
                        {licenseStatus ? (
                          <span className={`px-1.5 py-0.5 text-xs rounded-full ${licenseStatus.class}`}>
                            {licenseStatus.text}
                          </span>
                        ) : (
                          <span className="font-medium text-gray-900 dark:text-gray-100">N/A</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">{t('drivers.hireDate')}</p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{formatDate(driver.hire_date)?.split(' ').slice(0, 2).join(' ') || 'N/A'}</p>
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
