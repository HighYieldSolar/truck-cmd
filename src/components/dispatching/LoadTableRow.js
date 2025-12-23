// src/components/dispatching/LoadTableRow.js
"use client";

import Link from 'next/link';
import {
  MapPin,
  CheckCircle
} from "lucide-react";
import StatusBadge from './StatusBadge';
import { formatDateForDisplayMMDDYYYY } from "@/lib/utils/dateUtils";
import TableActions from "@/components/shared/TableActions";
import { useTranslation } from "@/context/LanguageContext";

export default function LoadTableRow({ load, onSelect, onEdit, onDelete }) {
  const { t } = useTranslation('dispatching');

  // Format currency
  const formatCurrency = (amount) => {
    return '$' + parseFloat(amount || 0).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return formatDateForDisplayMMDDYYYY(dateString);
  };

  // Truncate text
  const truncate = (text, maxLength = 20) => {
    if (!text) return '-';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
      {/* Load Number & Customer - Stacked */}
      <td className="px-3 py-3">
        <div className="space-y-0.5">
          <button
            onClick={() => onSelect(load)}
            className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline"
          >
            #{load.loadNumber || load.load_number}
          </button>
          <p className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-[160px]">
            {load.customer || '-'}
          </p>
        </div>
      </td>

      {/* Route - Stacked Origin/Destination */}
      <td className="px-3 py-3">
        <div className="space-y-1">
          <div className="flex items-center text-sm">
            <MapPin size={12} className="text-emerald-500 dark:text-emerald-400 flex-shrink-0 mr-1.5" />
            <span className="text-gray-700 dark:text-gray-300 truncate max-w-[120px]">{load.origin || '-'}</span>
          </div>
          <div className="flex items-center text-sm">
            <MapPin size={12} className="text-red-500 dark:text-red-400 flex-shrink-0 mr-1.5" />
            <span className="text-gray-700 dark:text-gray-300 truncate max-w-[120px]">{load.destination || '-'}</span>
          </div>
        </div>
      </td>

      {/* Dates - Stacked Pickup/Delivery */}
      <td className="px-3 py-3">
        <div className="space-y-1 text-sm">
          <div className="text-gray-700 dark:text-gray-300">
            <span className="text-gray-400 dark:text-gray-500 text-xs mr-1">P:</span>
            {formatDate(load.pickupDate || load.pickup_date)}
          </div>
          <div className="text-gray-700 dark:text-gray-300">
            <span className="text-gray-400 dark:text-gray-500 text-xs mr-1">D:</span>
            {formatDate(load.deliveryDate || load.delivery_date)}
          </div>
        </div>
      </td>

      {/* Driver */}
      <td className="px-3 py-3">
        <span className={`text-sm block truncate max-w-[100px] ${load.driver ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500 italic'}`}>
          {load.driver || t('loadCard.unassigned')}
        </span>
      </td>

      {/* Rate */}
      <td className="px-3 py-3 whitespace-nowrap">
        <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
          {formatCurrency(load.rate)}
        </span>
      </td>

      {/* Status */}
      <td className="px-3 py-3 whitespace-nowrap">
        <StatusBadge status={load.status} size="sm" />
      </td>

      {/* Actions */}
      <td className="px-3 py-3 whitespace-nowrap">
        <div className="flex items-center space-x-1">
          {load.status !== "Completed" && load.status !== "Cancelled" && (
            <Link
              href={`/dashboard/dispatching/complete/${load.id}`}
              className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors"
              title={t('loadCard.markComplete')}
              onClick={(e) => e.stopPropagation()}
            >
              <CheckCircle size={16} />
            </Link>
          )}
          <TableActions
            onView={() => onSelect(load)}
            onDelete={() => onDelete(load)}
            size="md"
          />
        </div>
      </td>
    </tr>
  );
}

// Loading skeleton row for table
export function LoadTableRowSkeleton() {
  return (
    <tr className="animate-pulse">
      {/* Load # & Customer skeleton */}
      <td className="px-3 py-3">
        <div className="space-y-1.5">
          <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </td>
      {/* Route skeleton */}
      <td className="px-3 py-3">
        <div className="space-y-1.5">
          <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </td>
      {/* Dates skeleton */}
      <td className="px-3 py-3">
        <div className="space-y-1.5">
          <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </td>
      <td className="px-3 py-3"><div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div></td>
      <td className="px-3 py-3"><div className="h-4 w-14 bg-gray-200 dark:bg-gray-700 rounded"></div></td>
      <td className="px-3 py-3"><div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded-full"></div></td>
      <td className="px-3 py-3"><div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div></td>
    </tr>
  );
}
