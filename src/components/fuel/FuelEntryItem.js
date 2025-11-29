// src/components/fuel/FuelEntryItem.js
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { Fuel, MapPin, Calendar, DollarSign, Truck, FileImage, Edit, Trash2, CheckCircle, ExternalLink, Calculator } from "lucide-react";
import { formatDateForDisplayMMDDYYYY } from "@/lib/utils/dateUtils";

export default function FuelEntryItem({ fuelEntry, onEdit, onDelete, onViewReceipt }) {
  // Add state for IFTA link status
  const [iftaLinkHovered, setIftaLinkHovered] = useState(false);
  const [vehicleInfo, setVehicleInfo] = useState(null);
  
  // Fetch vehicle info if we only have the ID
  useEffect(() => {
    async function fetchVehicleInfo() {
      if (!fuelEntry.vehicle_id) return;
      
      // First check vehicles table
      let { data: vehicle, error } = await supabase
        .from('vehicles')
        .select('id, name, license_plate')
        .eq('id', fuelEntry.vehicle_id)
        .single();
        
      // If not found, check trucks table
      if (error || !vehicle) {
        const { data: truck, error: truckError } = await supabase
          .from('trucks')
          .select('id, name, license_plate')
          .eq('id', fuelEntry.vehicle_id)
          .single();
          
        if (!truckError && truck) {
          vehicle = truck;
        }
      }
      
      if (vehicle) {
        setVehicleInfo(vehicle);
      }
    }
    
    fetchVehicleInfo();
  }, [fuelEntry.vehicle_id]);
  
  // Format price to 3 decimal places
  const formatPrice = (price) => {
    return parseFloat(price).toFixed(3);
  };
  
  // Format amount to 2 decimal places
  const formatAmount = (amount) => {
    return parseFloat(amount).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };
  
  // Format date string to localized format (fixed timezone issue)
  const formatDate = (dateString) => {
    return formatDateForDisplayMMDDYYYY(dateString);
  };
  
  // Get current quarter for the fuel purchase date
  const getQuarterString = (dateString) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth();
    const quarter = Math.ceil((month + 1) / 3);
    
    return `${year}-Q${quarter}`;
  };
  
  // Create IFTA quarter parameter for linking to IFTA page
  const iftaQuarter = getQuarterString(fuelEntry.date);

  // Helper function to format vehicle display
  const formatVehicleDisplay = () => {
    if (vehicleInfo) {
      if (vehicleInfo.name && vehicleInfo.license_plate) {
        return (
          <>
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{vehicleInfo.name}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{vehicleInfo.license_plate}</div>
          </>
        );
      } else if (vehicleInfo.name) {
        return <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{vehicleInfo.name}</div>;
      } else if (vehicleInfo.license_plate) {
        return <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{vehicleInfo.license_plate}</div>;
      }
    }

    // Fallback to just showing the ID (shortened)
    const shortId = fuelEntry.vehicle_id ?
      (fuelEntry.vehicle_id.length > 8 ?
        `${fuelEntry.vehicle_id.substring(0, 8)}...` :
        fuelEntry.vehicle_id) :
      'N/A';

    return <div className="text-sm font-medium text-gray-500 dark:text-gray-400">{shortId}</div>;
  };
  
  // Update to pass vehicle info to receipt viewer
  const handleViewReceipt = () => {
    onViewReceipt(fuelEntry, vehicleInfo);
  };
  
  return (
    <tr className="group hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-colors duration-150">
      {/* Location */}
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="flex items-center">
          <div className="flex-shrink-0 w-9 h-9 bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/50 dark:to-blue-800/30 rounded-lg flex items-center justify-center">
            <Fuel size={16} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div className="ml-2.5">
            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 max-w-[160px] truncate">{fuelEntry.location}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center mt-0.5">
              <MapPin size={10} className="text-gray-400 dark:text-gray-500 mr-0.5" />
              {fuelEntry.state}
            </div>
          </div>
        </div>
      </td>

      {/* Date */}
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{formatDate(fuelEntry.date)}</div>
        <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{fuelEntry.fuel_type || 'Diesel'}</div>
      </td>

      {/* Gallons & Price */}
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{fuelEntry.gallons.toFixed(2)} gal</div>
        <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">${formatPrice(fuelEntry.price_per_gallon)}/gal</div>
      </td>

      {/* Amount */}
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="text-sm font-bold text-gray-900 dark:text-gray-100">${formatAmount(fuelEntry.total_amount)}</div>
      </td>

      {/* Vehicle */}
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="flex items-center">
          <div className="w-7 h-7 bg-gray-100 dark:bg-gray-700 rounded-md flex items-center justify-center mr-2">
            <Truck size={12} className="text-gray-500 dark:text-gray-400" />
          </div>
          <div className="max-w-[100px]">
            {formatVehicleDisplay()}
          </div>
        </div>
      </td>

      {/* Receipt & Status Combined */}
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="flex items-center space-x-1.5">
          {fuelEntry.receipt_image ? (
            <button
              onClick={handleViewReceipt}
              className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/40 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors"
            >
              <FileImage size={12} className="mr-1" />
              View
            </button>
          ) : (
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-md">
              <FileImage size={12} className="mr-1 opacity-50" />
              N/A
            </span>
          )}
          {fuelEntry.expense_id ? (
            <span className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/40 rounded-full">
              <CheckCircle size={10} className="mr-0.5" />
              Synced
            </span>
          ) : (
            <span className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/40 rounded-full">
              Pending
            </span>
          )}
        </div>
      </td>

      {/* Actions - Always visible */}
      <td className="px-4 py-3 whitespace-nowrap text-right">
        <div className="flex items-center justify-end space-x-0.5">
          <button
            onClick={() => onEdit(fuelEntry)}
            className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/40 rounded-md transition-colors"
            aria-label="Edit fuel entry"
            title="Edit"
          >
            <Edit size={15} />
          </button>
          <button
            onClick={() => onDelete(fuelEntry)}
            className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/40 rounded-md transition-colors"
            aria-label="Delete fuel entry"
            title="Delete"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </td>
    </tr>
  );
}