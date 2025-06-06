// src/components/expenses/ExpenseItem.js
"use client";

import { 
  Eye, 
  Edit, 
  Trash2,
  Fuel,
  Wrench,
  Shield,
  MapPin,
  Briefcase,
  FileCheck,
  Coffee,
  Tag,
  Truck
} from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { formatDateForDisplayMMDDYYYY } from "@/lib/utils/dateUtils";

export default function ExpenseItem({ expense, onEdit, onDelete, onViewReceipt }) {
  const [vehicleInfo, setVehicleInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  
  // Load vehicle information when component mounts
  useEffect(() => {
    const loadVehicleInfo = async () => {
      // Only try to load if we have a vehicle_id
      if (!expense.vehicle_id) return;
      
      try {
        setLoading(true);
        setLoadError(null);
        
        // First try to get from the vehicles table
        let { data: vehicleData, error: vehicleError } = await supabase
          .from('vehicles')
          .select('name, license_plate')
          .eq('id', expense.vehicle_id)
          .single();
          
        if (vehicleError) {
          // If that fails, try the trucks table
          const { data: truckData, error: truckError } = await supabase
            .from('trucks')
            .select('name, license_plate')
            .eq('id', expense.vehicle_id)
            .single();
            
          if (truckError) {
            setLoadError("Could not find vehicle information");
          } else {
            setVehicleInfo(truckData);
          }
        } else {
          setVehicleInfo(vehicleData);
        }
      } catch (error) {
        console.error('Error loading vehicle info:', error);
        setLoadError(error.message);
      } finally {
        setLoading(false);
      }
    };
    
    loadVehicleInfo();
  }, [expense.vehicle_id]);
  
  // Format date for display (fixed timezone issue)
  const formatDate = (dateString) => {
    if (!dateString) return "";
    return formatDateForDisplayMMDDYYYY(dateString);
  };
  
  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };
  
  // Get category icon
  const getCategoryIcon = () => {
    switch (expense.category) {
      case 'Fuel':
        return <Fuel size={18} className="text-yellow-600" />;
      case 'Maintenance':
        return <Wrench size={18} className="text-blue-600" />;
      case 'Insurance':
        return <Shield size={18} className="text-green-600" />;
      case 'Tolls':
        return <MapPin size={18} className="text-purple-600" />;
      case 'Office':
        return <Briefcase size={18} className="text-gray-600" />;
      case 'Permits':
        return <FileCheck size={18} className="text-indigo-600" />;
      case 'Meals':
        return <Coffee size={18} className="text-red-600" />;
      default:
        return <Tag size={18} className="text-gray-600" />;
    }
  };
  
  // Get category badge class
  const getCategoryBadgeClass = () => {
    const categoryClasses = {
      'Fuel': 'bg-yellow-100 text-yellow-800',
      'Maintenance': 'bg-blue-100 text-blue-800',
      'Insurance': 'bg-green-100 text-green-800',
      'Tolls': 'bg-purple-100 text-purple-800',
      'Office': 'bg-gray-100 text-gray-800',
      'Permits': 'bg-indigo-100 text-indigo-800',
      'Meals': 'bg-red-100 text-red-800'
    };
    
    return categoryClasses[expense.category] || 'bg-gray-100 text-gray-800';
  };
  
  // Format vehicle info display
  const getVehicleDisplay = () => {
    if (loading) {
      return <span className="text-xs text-gray-400">Loading vehicle info...</span>;
    }
    
    if (vehicleInfo && vehicleInfo.name) {
      return (
        <div className="flex items-center text-xs text-gray-500">
          <Truck size={14} className="mr-1" />
          <span>{vehicleInfo.name} {vehicleInfo.license_plate && `(${vehicleInfo.license_plate})`}</span>
        </div>
      );
    }
    
    // Display vehicle ID if no detailed info is available
    if (expense.vehicle_id) {
      const displayId = expense.vehicle_id.length > 20 
        ? `${expense.vehicle_id.substring(0, 8)}...` 
        : expense.vehicle_id;
        
      return (
        <div className="flex items-center text-xs text-gray-500">
          <Truck size={14} className="mr-1" />
          <span>Vehicle: {displayId}</span>
        </div>
      );
    }
    
    return null;
  };

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center">
          <div className="mr-3">
            {getCategoryIcon()}
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">
              {expense.description}
            </div>
            {getVehicleDisplay()}
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {formatDate(expense.date)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryBadgeClass()}`}>
          {expense.category}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
        {formatCurrency(expense.amount)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {expense.payment_method}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right">
        <div className="flex justify-end space-x-1">
          {expense.receipt_image && (
            <button
              onClick={() => onViewReceipt(expense)}
              className="p-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100"
              title="View Receipt"
            >
              <Eye size={16} />
            </button>
          )}
          <button
            onClick={() => onEdit(expense)}
            className="p-1.5 bg-green-50 text-green-600 rounded-md hover:bg-green-100"
            title="Edit Expense"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={() => onDelete(expense)}
            className="p-1.5 bg-red-50 text-red-600 rounded-md hover:bg-red-100"
            title="Delete Expense"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
}