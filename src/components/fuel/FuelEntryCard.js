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
  CheckCircle
} from "lucide-react";
import { formatDateForDisplayMMDDYYYY } from "@/lib/utils/dateUtils";
import TableActions from "@/components/shared/TableActions";

export default function FuelEntryCard({ fuelEntry, onEdit, onDelete, onViewReceipt }) {
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
    return 'Unknown Vehicle';
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
            <div className="ml-3 min-w-0">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                {fuelEntry.location}
              </h3>
              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                <MapPin size={12} className="mr-1 flex-shrink-0" />
                <span className="truncate">{fuelEntry.state_name} ({fuelEntry.state})</span>
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
              <div className="text-xs text-gray-500 dark:text-gray-400">Date</div>
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{formatDate(fuelEntry.date)}</div>
            </div>
          </div>

          {/* Price per Gallon */}
          <div className="flex items-center">
            <DollarSign size={14} className="text-gray-400 dark:text-gray-500 mr-2 flex-shrink-0" />
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Price/Gal</div>
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">${formatPrice(fuelEntry.price_per_gallon)}</div>
            </div>
          </div>

          {/* Vehicle */}
          <div className="flex items-center">
            <Truck size={14} className="text-gray-400 dark:text-gray-500 mr-2 flex-shrink-0" />
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Vehicle</div>
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-[120px]">{getVehicleName()}</div>
            </div>
          </div>

          {/* Fuel Type */}
          <div className="flex items-center">
            <Fuel size={14} className="text-gray-400 dark:text-gray-500 mr-2 flex-shrink-0" />
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Type</div>
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{fuelEntry.fuel_type || 'Diesel'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Card Footer - Actions */}
      <div className="px-4 py-3 flex items-center justify-between border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center">
          {fuelEntry.expense_id ? (
            <span className="inline-flex items-center text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/40 px-2 py-1 rounded-full">
              <CheckCircle size={12} className="mr-1" />
              Synced to Expenses
            </span>
          ) : (
            <span className="inline-flex items-center text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/40 px-2 py-1 rounded-full">
              Pending
            </span>
          )}
        </div>

        <TableActions
          onView={fuelEntry.receipt_image ? handleViewReceipt : undefined}
          onEdit={() => onEdit(fuelEntry)}
          onDelete={() => onDelete(fuelEntry)}
          size="lg"
        />
      </div>
    </div>
  );
}
