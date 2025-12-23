"use client";

import { CheckCircle, AlertTriangle, Clock, FileText, PauseCircle } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";

export default function ComplianceSummary({ stats }) {
  const { t } = useTranslation('compliance');

  const statCards = [
    {
      label: t('stats.total'),
      value: stats.total,
      icon: FileText,
      iconBg: "bg-blue-100 dark:bg-blue-900/40",
      iconColor: "text-blue-600 dark:text-blue-400",
      valueColor: "text-gray-900 dark:text-gray-100",
      borderColor: "border-l-blue-500 dark:border-l-blue-500",
      footerBg: "bg-blue-50 dark:bg-blue-900/20",
      footerText: "text-gray-600 dark:text-gray-400",
      description: t('statsDescriptions.total')
    },
    {
      label: t('status.active'),
      value: stats.active,
      icon: CheckCircle,
      iconBg: "bg-green-100 dark:bg-green-900/40",
      iconColor: "text-green-600 dark:text-green-400",
      valueColor: "text-gray-900 dark:text-gray-100",
      borderColor: "border-l-green-500 dark:border-l-green-500",
      footerBg: "bg-green-50 dark:bg-green-900/20",
      footerText: "text-gray-600 dark:text-gray-400",
      description: t('statsDescriptions.active')
    },
    {
      label: t('status.expiringSoon'),
      value: stats.expiringSoon,
      icon: Clock,
      iconBg: "bg-orange-100 dark:bg-orange-900/40",
      iconColor: "text-orange-600 dark:text-orange-400",
      valueColor: "text-gray-900 dark:text-gray-100",
      borderColor: "border-l-orange-500 dark:border-l-orange-500",
      footerBg: "bg-orange-50 dark:bg-orange-900/20",
      footerText: "text-gray-600 dark:text-gray-400",
      description: t('statsDescriptions.expiringSoon')
    },
    {
      label: t('status.expired'),
      value: stats.expired,
      icon: AlertTriangle,
      iconBg: "bg-red-100 dark:bg-red-900/40",
      iconColor: "text-red-600 dark:text-red-400",
      valueColor: "text-gray-900 dark:text-gray-100",
      borderColor: "border-l-red-500 dark:border-l-red-500",
      footerBg: "bg-red-50 dark:bg-red-900/20",
      footerText: "text-gray-600 dark:text-gray-400",
      description: t('statsDescriptions.expired')
    },
    {
      label: t('status.pending'),
      value: stats.pending,
      icon: PauseCircle,
      iconBg: "bg-purple-100 dark:bg-purple-900/40",
      iconColor: "text-purple-600 dark:text-purple-400",
      valueColor: "text-gray-900 dark:text-gray-100",
      borderColor: "border-l-purple-500 dark:border-l-purple-500",
      footerBg: "bg-purple-50 dark:bg-purple-900/20",
      footerText: "text-gray-600 dark:text-gray-400",
      description: t('statsDescriptions.pending')
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
                <p className={`text-2xl font-bold mt-1 ${card.valueColor}`}>
                  {card.value}
                </p>
              </div>
              <div className={`p-3 rounded-xl ${card.iconBg}`}>
                <Icon size={20} className={card.iconColor} />
              </div>
            </div>
            <div className={`px-4 py-2 ${card.footerBg} border-t border-gray-100 dark:border-gray-200`}>
              <span className={`text-xs ${card.footerText}`}>
                {card.description}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
