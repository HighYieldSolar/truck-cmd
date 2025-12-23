"use client";

import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  User,
  Truck
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

export default function DocumentAlertsComponent({
  documentReminders = [],
  vehicleReminders = [],
  handleDriverSelect,
  handleVehicleSelect
}) {
  const { t } = useTranslation('fleet');

  // Combine and sort all reminders by days remaining
  const allReminders = [
    ...documentReminders.map(r => ({ ...r, category: 'driver' })),
    ...vehicleReminders.map(r => ({ ...r, category: 'vehicle' }))
  ].sort((a, b) => a.daysRemaining - b.daysRemaining);

  const handleClick = (item) => {
    if (item.category === 'driver' && handleDriverSelect) {
      handleDriverSelect({ id: item.driverId });
    } else if (item.category === 'vehicle' && handleVehicleSelect) {
      handleVehicleSelect({ id: item.vehicleId });
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden mb-6 border border-gray-200 dark:border-gray-700">
      <div className="bg-orange-500 dark:bg-orange-600 px-5 py-4 text-white">
        <h3 className="font-semibold flex items-center">
          <AlertTriangle size={18} className="mr-2" />
          {t('documentAlerts.title')}
        </h3>
      </div>
      <div className="p-4">
        {allReminders.length === 0 ? (
          <div className="text-center py-6 text-gray-500 dark:text-gray-400">
            <CheckCircle size={36} className="mx-auto mb-2 text-green-500 dark:text-green-400" />
            <p>{t('documentAlerts.noDocumentsExpiringSoon')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {allReminders.slice(0, 5).map(item => {
              const isVehicle = item.category === 'vehicle';
              const Icon = isVehicle ? Truck : User;
              const name = isVehicle ? item.vehicle : item.driver;

              return (
                <div
                  key={item.id}
                  className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/20 cursor-pointer transition-colors"
                  onClick={() => handleClick(item)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-start flex-1 min-w-0">
                      <div className={`p-1.5 rounded-full mr-2 flex-shrink-0 ${
                        isVehicle
                          ? 'bg-blue-100 dark:bg-blue-900/30'
                          : 'bg-purple-100 dark:bg-purple-900/30'
                      }`}>
                        <Icon size={12} className={
                          isVehicle
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-purple-600 dark:text-purple-400'
                        } />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">{name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {item.type} {t('documentAlerts.expires')} {formatDate(item.expiryDate)}
                        </p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ml-2 flex-shrink-0 ${
                      item.daysRemaining <= 0
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                        : item.daysRemaining <= 7
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                          : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
                    }`}>
                      {item.daysRemaining <= 0 ? t('documentAlerts.expired') : `${item.daysRemaining}d`}
                    </span>
                  </div>
                </div>
              );
            })}

            {allReminders.length > 5 && (
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                {t('documentAlerts.moreAlerts', { count: allReminders.length - 5 })}
              </p>
            )}

            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600 text-center">
              <Link
                href="/dashboard/compliance"
                className="text-sm text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-300 flex items-center justify-center w-full"
              >
                {t('documentAlerts.viewComplianceDetails')}
                <ArrowRight size={14} className="ml-1" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
