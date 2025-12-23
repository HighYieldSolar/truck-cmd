"use client";

import {
  Truck,
  Activity,
  FileCog,
  AlertTriangle,
  Users
} from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";

export default function FleetStatsComponent({ truckStats, driverStats }) {
  const { t } = useTranslation('fleet');

  // Calculate utilization rate
  const utilizationRate = truckStats.total > 0
    ? Math.round((truckStats.active / truckStats.total) * 100)
    : 0;

  const statCards = [
    {
      label: t('stats.totalVehicles'),
      value: truckStats.total,
      icon: Truck,
      iconBg: "bg-blue-100 dark:bg-blue-900/40",
      iconColor: "text-blue-600 dark:text-blue-400",
      borderColor: "border-l-blue-500 dark:border-l-blue-500",
      footerBg: "bg-blue-50 dark:bg-blue-900/20",
      description: t('stats.allVehiclesInFleet')
    },
    {
      label: t('stats.activeVehicles'),
      value: truckStats.active,
      icon: Activity,
      iconBg: "bg-green-100 dark:bg-green-900/40",
      iconColor: "text-green-600 dark:text-green-400",
      borderColor: "border-l-green-500 dark:border-l-green-500",
      footerBg: "bg-green-50 dark:bg-green-900/20",
      description: t('stats.utilizationRate', { rate: utilizationRate })
    },
    {
      label: t('stats.inMaintenance'),
      value: truckStats.maintenance,
      icon: FileCog,
      iconBg: "bg-orange-100 dark:bg-orange-900/40",
      iconColor: "text-orange-600 dark:text-orange-400",
      borderColor: "border-l-orange-500 dark:border-l-orange-500",
      footerBg: "bg-orange-50 dark:bg-orange-900/20",
      description: t('stats.beingServiced')
    },
    {
      label: t('stats.outOfService'),
      value: truckStats.outOfService,
      icon: AlertTriangle,
      iconBg: "bg-red-100 dark:bg-red-900/40",
      iconColor: "text-red-600 dark:text-red-400",
      borderColor: "border-l-red-500 dark:border-l-red-500",
      footerBg: "bg-red-50 dark:bg-red-900/20",
      description: t('stats.needsAttention')
    },
    {
      label: t('stats.totalDrivers'),
      value: driverStats.total,
      icon: Users,
      iconBg: "bg-purple-100 dark:bg-purple-900/40",
      iconColor: "text-purple-600 dark:text-purple-400",
      borderColor: "border-l-purple-500 dark:border-l-purple-500",
      footerBg: "bg-purple-50 dark:bg-purple-900/20",
      description: t('stats.allRegisteredDrivers')
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
      {statCards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={index}
            className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700 border-l-4 ${card.borderColor} hover:shadow-md transition-all`}
          >
            <div className="flex items-center justify-between p-4">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold tracking-wide">
                  {card.label}
                </p>
                <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-gray-100">
                  {card.value}
                </p>
              </div>
              <div className={`p-3 rounded-xl ${card.iconBg}`}>
                <Icon size={20} className={card.iconColor} />
              </div>
            </div>
            <div className={`px-4 py-2 ${card.footerBg} border-t border-gray-100 dark:border-gray-700`}>
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {card.description}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
