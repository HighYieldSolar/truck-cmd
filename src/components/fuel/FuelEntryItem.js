// src/components/fuel/FuelEntryItem.js
import { useState } from "react";
import { CheckCircle, FileImage, Edit, Trash2, MapPin, Truck, DollarSign, Calendar, Fuel, ExternalLink, Calculator } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useEffect } from "react";

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
  
  // Format date string to localized format
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
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
            <div className="text-sm font-medium text-gray-900">{vehicleInfo.name}</div>
            <div className="text-xs text-gray-500">{vehicleInfo.license_plate}</div>
          </>
        );
      } else if (vehicleInfo.name) {
        return <div className="text-sm font-medium text-gray-900">{vehicleInfo.name}</div>;
      } else if (vehicleInfo.license_plate) {
        return <div className="text-sm font-medium text-gray-900">{vehicleInfo.license_plate}</div>;
      }
    }
    
    // Fallback to just showing the ID (shortened)
    const shortId = fuelEntry.vehicle_id ? 
      (fuelEntry.vehicle_id.length > 8 ? 
        `${fuelEntry.vehicle_id.substring(0, 8)}...` : 
        fuelEntry.vehicle_id) : 
      'N/A';
      
    return <div className="text-sm font-medium text-gray-500">{shortId}</div>;
  };
  
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="flex-shrink-0 bg-blue-100 rounded-full h-10 w-10 flex items-center justify-center text-blue-700">
            <Fuel size={18} />
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{fuelEntry.location}</div>
            <div className="text-sm text-gray-500 flex items-center">
              <MapPin size={14} className="text-gray-400 mr-1" />
              {fuelEntry.state_name} ({fuelEntry.state})
              
              {/* Add IFTA link */}
              <Link 
                href={`/dashboard/ifta?quarter=${iftaQuarter}`}
                className="ml-2 text-blue-600 hover:text-blue-800 inline-flex items-center"
                onMouseEnter={() => setIftaLinkHovered(true)}
                onMouseLeave={() => setIftaLinkHovered(false)}
              >
                <Calculator size={14} className="mr-1" />
                <span className={iftaLinkHovered ? "underline" : ""}>IFTA</span>
              </Link>
            </div>
          </div>
        </div>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">{formatDate(fuelEntry.date)}</div>
        <div className="text-sm text-gray-500 flex items-center">
          <Calendar size={14} className="text-gray-400 mr-1" />
          {fuelEntry.payment_method || 'Credit Card'}
        </div>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">{fuelEntry.gallons.toFixed(3)} gal</div>
        <div className="text-sm text-gray-500 flex items-center">
          <DollarSign size={14} className="text-gray-400 mr-1" />
          ${formatPrice(fuelEntry.price_per_gallon)}/gal
        </div>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">${formatAmount(fuelEntry.total_amount)}</div>
        <div className="text-sm text-gray-500">
          {fuelEntry.fuel_type || 'Diesel'}
        </div>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <Truck size={14} className="text-gray-400 mr-2 flex-shrink-0" />
          <div>
            {formatVehicleDisplay()}
          </div>
        </div>
        {fuelEntry.odometer && (
          <div className="text-sm text-gray-500 ml-6">{fuelEntry.odometer.toLocaleString()} mi</div>
        )}
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        {fuelEntry.receipt_image ? (
          <button 
            onClick={() => onViewReceipt(fuelEntry)} 
            className="flex items-center text-blue-600 hover:text-blue-900"
          >
            <FileImage size={16} className="mr-1" />
            <span>View</span>
          </button>
        ) : (
          <span className="inline-flex items-center text-sm text-gray-500">
            <FileImage size={14} className="text-gray-400 mr-1" />
            No receipt
          </span>
        )}
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <button 
          onClick={() => onEdit(fuelEntry)} 
          className="text-blue-600 hover:text-blue-900 mr-3"
          aria-label="Edit fuel entry"
        >
          <Edit size={16} />
        </button>
        <button 
          onClick={() => onDelete(fuelEntry)} 
          className="text-red-600 hover:text-red-900"
          aria-label="Delete fuel entry"
        >
          <Trash2 size={16} />
        </button>
      </td>

      <td className="px-6 py-4 whitespace-nowrap text-sm">
        {fuelEntry.expense_id ? (
          <div className="flex items-center text-green-600">
            <CheckCircle size={16} className="mr-1" />
            <span>Added to expenses</span>
            <Link 
              href={`/dashboard/expenses?id=${fuelEntry.expense_id}`}
              className="ml-2 text-blue-600 hover:text-blue-800 inline-flex items-center"
            >
              <ExternalLink size={14} className="mr-1" />
              View
            </Link>
          </div>
        ) : (
          <span className="text-gray-500">
            Processing...
          </span>
        )}
      </td>
    </tr>
  );
}