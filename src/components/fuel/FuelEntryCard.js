// src/components/fuel/FuelEntryCard.js
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import {
  Fuel,
  MapPin,
  Calendar,
  DollarSign,
  Truck,
  FileImage,
  CheckCircle,
  Eye,
  Edit,
  Trash2
} from "lucide-react";
import { formatDateForDisplayMMDDYYYY } from "@/lib/utils/dateUtils";
import { useTranslation } from "@/context/LanguageContext";

export default function FuelEntryCard({ fuelEntry, onEdit, onDelete, onViewReceipt }) {
  const { t } = useTranslation('fuel');
  const [vehicleInfo, setVehicleInfo] = useState(null);
  const [showActions, setShowActions] = useState(false);

  // Fetch vehicle info if we only have the ID
  useEffect(() => {
    async function fetchVehicleInfo() {
      if (!fuelEntry.vehicle_id) return;

      const { data: vehicle, error } = await supabase
        .from('vehicles')
        .select('id, name, license_plate')
        .eq('id', fuelEntry.vehicle_id)
        .single();

      if (!error && vehicle) {
        setVehicleInfo(vehicle);
      }
    }

    fetchVehicleInfo();
  }, [fuelEntry.vehicle_id]);

  // Format price to 3 decimal places
  const formatPrice = (price) => parseFloat(price).toFixed(3);

  // Format amount to 2 decimal places
  const formatAmount = (amount) => {
    return parseFloat(amount).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Get vehicle display name
  const getVehicleName = () => {
    if (vehicleInfo?.name) return vehicleInfo.name;
    if (vehicleInfo?.license_plate) return vehicleInfo.license_plate;
    return t('fuelCard.unknownVehicle');
  };

  const handleViewReceipt = () => {
    onViewReceipt(fuelEntry, vehicleInfo);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden hover:shadow-md transition-all duration-200">
      {/* Card Header */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-start justify-between">
          <div className="flex items-center flex-1 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
              <Fuel size={18} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-3 min-w-0 flex-1">
              <h3
                className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate"
                title={fuelEntry.location || ''}
              >
                {fuelEntry.location || '-'}
              </h3>
              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                <MapPin size={12} className="mr-1 flex-shrink-0" />
                <span className="truncate" title={`${fuelEntry.state_name || ''} (${fuelEntry.state || ''})`}>
                  {fuelEntry.state_name || fuelEntry.state || '-'} ({fuelEntry.state || ''})
                </span>
              </div>
            </div>
          </div>
          <div className="text-right ml-3">
            <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
              ${formatAmount(fuelEntry.total_amount)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {fuelEntry.gallons.toFixed(1)} gal
            </div>
          </div>
        </div>
      </div>

      {/* Card Body - Details Grid */}
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50">
        <div className="grid grid-cols-2 gap-3">
          {/* Date */}
          <div className="flex items-center">
            <Calendar size={14} className="text-gray-400 dark:text-gray-500 mr-2 flex-shrink-0" />
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{t('fuelCard.date')}</div>
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{formatDate(fuelEntry.date)}</div>
            </div>
          </div>

          {/* Price per Gallon */}
          <div className="flex items-center">
            <DollarSign size={14} className="text-gray-400 dark:text-gray-500 mr-2 flex-shrink-0" />
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{t('fuelCard.pricePerGal')}</div>
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">${formatPrice(fuelEntry.price_per_gallon)}</div>
            </div>
          </div>

          {/* Vehicle */}
          <div className="flex items-center">
            <Truck size={14} className="text-gray-400 dark:text-gray-500 mr-2 flex-shrink-0" />
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{t('fuelCard.vehicle')}</div>
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-[120px]">{getVehicleName()}</div>
            </div>
          </div>

          {/* Fuel Type */}
          <div className="flex items-center">
            <Fuel size={14} className="text-gray-400 dark:text-gray-500 mr-2 flex-shrink-0" />
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{t('fuelCard.type')}</div>
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{fuelEntry.fuel_type || t('fuelTypesOptions.diesel')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Card Footer - Actions */}
      <div className="px-4 py-3 flex items-center justify-end border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center space-x-1">
          {/* View Receipt */}
          {fuelEntry.receipt_image && (
            <button
              onClick={handleViewReceipt}
              className="p-2 rounded-lg transition-colors text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30"
              title={t('fuelCard.viewReceipt')}
            >
              <Eye size={16} />
            </button>
          )}
          {/* Edit */}
          <button
            onClick={() => onEdit(fuelEntry)}
            className="p-2 rounded-lg transition-colors text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30"
            title={t('fuelCard.edit')}
          >
            <Edit size={16} />
          </button>
          {/* Delete */}
          <button
            onClick={() => onDelete(fuelEntry)}
            className="p-2 rounded-lg transition-colors text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
            title={t('fuelCard.delete')}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
