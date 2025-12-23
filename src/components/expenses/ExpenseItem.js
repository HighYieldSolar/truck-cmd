'use client';

import { useState, useEffect } from 'react';
import {
  Eye,
  EyeOff,
  Pencil,
  Trash2,
  Fuel,
  Wrench,
  Shield,
  MapPin,
  Briefcase,
  FileCheck,
  Coffee,
  Tag,
  Truck,
  CheckCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import TableActions from '@/components/shared/TableActions';
import { formatDateForDisplayMMDDYYYY } from '@/lib/utils/dateUtils';
import { useTranslation } from "@/context/LanguageContext";

/**
 * Expense Table Row Item (Desktop View)
 *
 * Displays expense data in a table row format for desktop.
 * Follows the design spec table pattern with dark mode support.
 */
export default function ExpenseItem({ expense, onEdit, onDelete, onViewReceipt }) {
  const { t } = useTranslation('expenses');
  const [vehicleInfo, setVehicleInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load vehicle information
  useEffect(() => {
    const loadVehicleInfo = async () => {
      if (!expense.vehicle_id) return;

      try {
        setLoading(true);

        const { data: vehicleData, error: vehicleError } = await supabase
          .from('vehicles')
          .select('name, license_plate')
          .eq('id', expense.vehicle_id)
          .single();

        if (!vehicleError && vehicleData) {
          setVehicleInfo(vehicleData);
        }
      } catch (error) {
        // Failed to load vehicle info
      } finally {
        setLoading(false);
      }
    };

    loadVehicleInfo();
  }, [expense.vehicle_id]);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return formatDateForDisplayMMDDYYYY(dateString);
  };

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value || 0);
  };

  // Get category icon
  const getCategoryIcon = () => {
    const iconClass = 'h-4 w-4';
    const icons = {
      Fuel: <Fuel className={`${iconClass} text-amber-600 dark:text-amber-400`} />,
      Maintenance: <Wrench className={`${iconClass} text-blue-600 dark:text-blue-400`} />,
      Insurance: <Shield className={`${iconClass} text-green-600 dark:text-green-400`} />,
      Tolls: <MapPin className={`${iconClass} text-purple-600 dark:text-purple-400`} />,
      Office: <Briefcase className={`${iconClass} text-gray-600 dark:text-gray-400`} />,
      Permits: <FileCheck className={`${iconClass} text-indigo-600 dark:text-indigo-400`} />,
      Meals: <Coffee className={`${iconClass} text-red-600 dark:text-red-400`} />,
      Other: <Tag className={`${iconClass} text-gray-600 dark:text-gray-400`} />
    };
    return icons[expense.category] || icons.Other;
  };

  // Get category badge styles
  const getCategoryBadgeClass = () => {
    const classes = {
      Fuel: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300',
      Maintenance: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
      Insurance: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
      Tolls: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300',
      Office: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300',
      Permits: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300',
      Meals: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
      Other: 'bg-slate-100 dark:bg-slate-900/30 text-slate-800 dark:text-slate-300'
    };
    return classes[expense.category] || classes.Other;
  };

  // Get vehicle display
  const getVehicleDisplay = () => {
    if (loading) {
      return (
        <span className="text-xs text-gray-400 dark:text-gray-500">
          {t('item.loading')}
        </span>
      );
    }

    if (vehicleInfo?.name) {
      return (
        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          <Truck className="h-3 w-3 mr-1" />
          <span>
            {vehicleInfo.name}
            {vehicleInfo.license_plate && ` (${vehicleInfo.license_plate})`}
          </span>
        </div>
      );
    }

    if (expense.vehicle_id) {
      const displayId = expense.vehicle_id.length > 12
        ? `${expense.vehicle_id.substring(0, 8)}...`
        : expense.vehicle_id;

      return (
        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          <Truck className="h-3 w-3 mr-1" />
          <span>{displayId}</span>
        </div>
      );
    }

    return null;
  };

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
      {/* Description */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 flex-shrink-0">
            {getCategoryIcon()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {expense.description || t('item.noDescription')}
            </p>
            {getVehicleDisplay()}
          </div>
        </div>
      </td>

      {/* Date */}
      <td className="px-4 py-3 whitespace-nowrap">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {formatDate(expense.date)}
        </span>
      </td>

      {/* Category */}
      <td className="px-4 py-3 whitespace-nowrap">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryBadgeClass()}`}>
          {expense.category || 'Other'}
        </span>
      </td>

      {/* Amount */}
      <td className="px-4 py-3 whitespace-nowrap text-right">
        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {formatCurrency(expense.amount)}
        </span>
      </td>

      {/* Payment Method */}
      <td className="px-4 py-3 whitespace-nowrap">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {expense.payment_method || 'N/A'}
        </span>
      </td>

      {/* Actions */}
      <td className="px-4 py-3 whitespace-nowrap text-right">
        <TableActions
          onView={expense.receipt_image ? () => onViewReceipt(expense) : undefined}
          onEdit={() => onEdit(expense)}
          onDelete={() => onDelete(expense)}
          size="md"
        />
      </td>
    </tr>
  );
}
