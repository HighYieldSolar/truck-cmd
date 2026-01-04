// src/components/dispatching/LoadTableRow.js
"use client";

import Link from 'next/link';
import {
  MapPin,
  CheckCircle,
  Navigation,
  Phone,
  MessageSquare
} from "lucide-react";
import StatusBadge from './StatusBadge';
import { formatDateForDisplayMMDDYYYY } from "@/lib/utils/dateUtils";
import { TableActionsDropdown } from "@/components/shared/TableActions";
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

  const loadNumber = load.loadNumber || load.load_number || '';
  const customer = load.customer || '';
  const origin = load.origin || '';
  const destination = load.destination || '';
  const driver = load.driver || '';

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
      {/* Load Number & Customer - Stacked (18% width) */}
      <td className="px-3 py-3 max-w-0">
        <div className="space-y-0.5 overflow-hidden">
          <button
            onClick={() => onSelect(load)}
            className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline block truncate max-w-full"
            title={`#${loadNumber}`}
          >
            #{loadNumber || '-'}
          </button>
          <p
            className="text-sm text-gray-600 dark:text-gray-400 truncate"
            title={customer}
          >
            {customer || '-'}
          </p>
        </div>
      </td>

      {/* Route - Stacked Origin/Destination (20% width) */}
      <td className="px-3 py-3 max-w-0">
        <div className="space-y-1 overflow-hidden">
          <div className="flex items-center text-sm min-w-0">
            <MapPin size={12} className="text-emerald-500 dark:text-emerald-400 flex-shrink-0 mr-1.5" />
            <span
              className="text-gray-700 dark:text-gray-300 truncate"
              title={origin}
            >
              {origin || '-'}
            </span>
          </div>
          <div className="flex items-center text-sm min-w-0">
            <MapPin size={12} className="text-red-500 dark:text-red-400 flex-shrink-0 mr-1.5" />
            <span
              className="text-gray-700 dark:text-gray-300 truncate"
              title={destination}
            >
              {destination || '-'}
            </span>
          </div>
        </div>
      </td>

      {/* Dates - Stacked Pickup/Delivery (15% width) */}
      <td className="px-3 py-3 whitespace-nowrap">
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

      {/* Driver (14% width) */}
      <td className="px-3 py-3 max-w-0">
        <span
          className={`text-sm block truncate ${driver ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500 italic'}`}
          title={driver || t('loadCard.unassigned')}
        >
          {driver || t('loadCard.unassigned')}
        </span>
      </td>

      {/* Rate (10% width) */}
      <td className="px-3 py-3 whitespace-nowrap">
        <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
          {formatCurrency(load.rate)}
        </span>
      </td>

      {/* Status (11% width) */}
      <td className="px-3 py-3 whitespace-nowrap">
        <StatusBadge status={load.status} size="sm" />
      </td>

      {/* Actions */}
      <td className="px-3 py-3 whitespace-nowrap text-center">
        <TableActionsDropdown
          onView={() => onSelect(load)}
          onComplete={
            load.status !== "Completed" && load.status !== "Cancelled"
              ? () => {
                  window.location.href = `/dashboard/dispatching/complete/${load.id}`;
                }
              : undefined
          }
          onDelete={() => onDelete(load)}
          customActions={[
            {
              icon: Navigation,
              label: "Get Directions",
              onClick: () => {
                const address = load.destination || load.origin;
                if (address) {
                  window.open(
                    `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`,
                    "_blank"
                  );
                }
              },
              color: "blue"
            }
          ]}
          size="md"
          buttonStyle="dots"
        />
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
