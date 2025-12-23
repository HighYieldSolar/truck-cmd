// src/components/dispatching/StatusBadge.js
"use client";

import { Clock, Truck, CheckCircle, XCircle, AlertTriangle, Package, Loader } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";

/**
 * Status badge component for displaying the status of a load.
 * Full dark mode support included.
 *
 * @param {Object} props
 * @param {string} props.status - The status to display
 * @param {string} [props.className] - Additional CSS classes
 * @param {boolean} [props.showIcon] - Whether to show status icon
 * @param {string} [props.size] - Size variant: 'xs' | 'sm' | 'md' | 'lg'
 */
export default function StatusBadge({ status, className = "", showIcon = false, size = "md" }) {
  const { t } = useTranslation('dispatching');

  // Map status to translation key
  const statusToKey = {
    "Pending": "pending",
    "Assigned": "assigned",
    "In Transit": "inTransit",
    "Loading": "loading",
    "Unloading": "unloading",
    "Delivered": "delivered",
    "Completed": "completed",
    "Cancelled": "cancelled",
    "Delayed": "delayed"
  };

  const statusStyles = {
    "Pending": {
      bg: "bg-amber-100 dark:bg-amber-900/40",
      text: "text-amber-800 dark:text-amber-300",
      border: "border-amber-200 dark:border-amber-700",
      icon: Clock
    },
    "Assigned": {
      bg: "bg-blue-100 dark:bg-blue-900/40",
      text: "text-blue-800 dark:text-blue-300",
      border: "border-blue-200 dark:border-blue-700",
      icon: Package
    },
    "In Transit": {
      bg: "bg-purple-100 dark:bg-purple-900/40",
      text: "text-purple-800 dark:text-purple-300",
      border: "border-purple-200 dark:border-purple-700",
      icon: Truck
    },
    "Loading": {
      bg: "bg-indigo-100 dark:bg-indigo-900/40",
      text: "text-indigo-800 dark:text-indigo-300",
      border: "border-indigo-200 dark:border-indigo-700",
      icon: Loader
    },
    "Unloading": {
      bg: "bg-teal-100 dark:bg-teal-900/40",
      text: "text-teal-800 dark:text-teal-300",
      border: "border-teal-200 dark:border-teal-700",
      icon: Loader
    },
    "Delivered": {
      bg: "bg-emerald-100 dark:bg-emerald-900/40",
      text: "text-emerald-800 dark:text-emerald-300",
      border: "border-emerald-200 dark:border-emerald-700",
      icon: CheckCircle
    },
    "Cancelled": {
      bg: "bg-red-100 dark:bg-red-900/40",
      text: "text-red-800 dark:text-red-300",
      border: "border-red-200 dark:border-red-700",
      icon: XCircle
    },
    "Completed": {
      bg: "bg-emerald-100 dark:bg-emerald-900/40",
      text: "text-emerald-800 dark:text-emerald-300",
      border: "border-emerald-200 dark:border-emerald-700",
      icon: CheckCircle
    },
    "Delayed": {
      bg: "bg-orange-100 dark:bg-orange-900/40",
      text: "text-orange-800 dark:text-orange-300",
      border: "border-orange-200 dark:border-orange-700",
      icon: AlertTriangle
    }
  };

  const defaultStyle = {
    bg: "bg-gray-100 dark:bg-gray-700",
    text: "text-gray-800 dark:text-gray-300",
    border: "border-gray-200 dark:border-gray-600",
    icon: Clock
  };

  const style = statusStyles[status] || defaultStyle;
  const Icon = style.icon;

  const sizeClasses = {
    xs: "px-1.5 py-0.5 text-[10px]",
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-0.5 text-xs",
    lg: "px-3 py-1 text-sm"
  };

  const iconSizes = {
    xs: 8,
    sm: 10,
    md: 12,
    lg: 14
  };

  // Get translated status label
  const translatedStatus = statusToKey[status]
    ? t(`statusLabels.${statusToKey[status]}`)
    : status;

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium border ${style.bg} ${style.text} ${style.border} ${sizeClasses[size]} ${className}`}
    >
      {showIcon && <Icon size={iconSizes[size]} className="mr-1" />}
      {translatedStatus}
    </span>
  );
}