"use client";

import { useState, useEffect } from "react";
import { 
  Edit, 
  Trash2, 
  Image,
  Fuel,
  Wrench,
  Shield,
  Tag,
  Truck
} from "lucide-react";
import ReceiptViewer from "./ReceiptViewer";
import { supabase } from "@/lib/supabaseClient";

export default function ExpenseItem({ expense, onEdit, onDelete }) {
  const [receiptViewerOpen, setReceiptViewerOpen] = useState(false);
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
        
        console.log(`Attempting to load vehicle info for ID: ${expense.vehicle_id}`);
        
        // First try to get from the vehicles table
        let { data: vehicleData, error: vehicleError } = await supabase
          .from('vehicles')
          .select('name, license_plate')
          .eq('id', expense.vehicle_id)
          .single();
          
        if (vehicleError) {
          console.log(`No match in vehicles table: ${vehicleError.message}`);
          
          // If that fails, try the trucks table
          const { data: truckData, error: truckError } = await supabase
            .from('trucks')
            .select('name, license_plate')
            .eq('id', expense.vehicle_id)
            .single();
            
          if (truckError) {
            console.log(`No match in trucks table: ${truckError.message}`);
            setLoadError("Could not find vehicle information");
          } else {
            console.log('Found match in trucks table:', truckData);
            setVehicleInfo(truckData);
          }
        } else {
          console.log('Found match in vehicles table:', vehicleData);
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
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
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
      default:
        return <Tag size={18} className="text-gray-600" />;
    }
  };
  
  // Display alternate vehicle information for specific vehicle IDs
  const getSpecialVehicleMapping = (id) => {
    // Add any special mappings you know here
    // For example, if certain IDs should map to specific names
    const specialMappings = {
      'truck1': { name: 'Truck 1', license_plate: 'ABC123' },
      'truck2': { name: 'Truck 2', license_plate: 'XYZ789' },
      // Add more as needed
    };
    
    return specialMappings[id] || null;
  }
  
  // Format vehicle info display
  const getVehicleDisplay = () => {
    if (loading) {
      return <span className="text-xs text-gray-400">Loading vehicle info...</span>;
    }
    
    // First check if we have vehicle info from database
    if (vehicleInfo && vehicleInfo.name) {
      return (
        <div className="flex items-center text-xs text-gray-500">
          <Truck size={14} className="mr-1" />
          <span>{vehicleInfo.name} {vehicleInfo.license_plate && `(${vehicleInfo.license_plate})`}</span>
        </div>
      );
    }
    
    // Then check for special mappings
    const specialMapping = expense.vehicle_id ? getSpecialVehicleMapping(expense.vehicle_id) : null;
    if (specialMapping) {
      return (
        <div className="flex items-center text-xs text-gray-500">
          <Truck size={14} className="mr-1" />
          <span>{specialMapping.name} {specialMapping.license_plate && `(${specialMapping.license_plate})`}</span>
        </div>
      );
    }
    
    // Fallback to showing just the ID
    if (expense.vehicle_id) {
      // If the ID looks like a UUID, truncate it for display
      const isUuid = expense.vehicle_id.length > 20 && expense.vehicle_id.includes('-');
      const displayId = isUuid 
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
    <>
      <tr className="hover:bg-gray-50">
        <td className="px-6 py-4">
          <div className="text-sm font-medium text-gray-900">{expense.description}</div>
          {getVehicleDisplay()}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {formatDate(expense.date)}
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center">
            <span className="mr-2">{getCategoryIcon()}</span>
            <span className="text-sm text-gray-900">{expense.category}</span>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
          {formatCurrency(expense.amount)}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {expense.payment_method}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
          {expense.receipt_image && (
            <button
              onClick={() => setReceiptViewerOpen(true)}
              className="text-blue-600 hover:text-blue-900 mr-3"
              title="View Receipt"
            >
              <Image size={18} alt="View Receipt" />
            </button>
          )}
          <button
            onClick={onEdit}
            className="text-indigo-600 hover:text-indigo-900 mr-3"
            title="Edit Expense"
          >
            <Edit size={18} />
          </button>
          <button
            onClick={onDelete}
            className="text-red-600 hover:text-red-900"
            title="Delete Expense"
          >
            <Trash2 size={18} />
          </button>
        </td>
      </tr>
      
      {/* Receipt Viewer Modal */}
      <ReceiptViewer
        isOpen={receiptViewerOpen}
        onClose={() => setReceiptViewerOpen(false)}
        receipt={expense.receipt_image}
        expenseDetails={expense}
      />
    </>
  );
}