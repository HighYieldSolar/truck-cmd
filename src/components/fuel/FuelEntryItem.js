"use client";

import { FileImage, Edit, Trash2, MapPin, Truck, DollarSign, Calendar, Fuel, ReceiptText } from "lucide-react";

export default function FuelEntryItem({ fuelEntry, onEdit, onDelete, onViewReceipt }) {
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
        <div className="text-sm text-gray-900 flex items-center">
          <Truck size={14} className="text-gray-400 mr-1" />
          {fuelEntry.vehicle_id}
        </div>
        {fuelEntry.odometer && (
          <div className="text-sm text-gray-500">{fuelEntry.odometer.toLocaleString()} mi</div>
        )}
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        {fuelEntry.receipt_image ? (
          <div className="flex items-center">
            <button 
              onClick={() => onViewReceipt(fuelEntry)} 
              className="flex items-center text-blue-600 hover:text-blue-900"
            >
              <FileImage size={16} className="mr-1" />
              <span>View</span>
            </button>
          </div>
        ) : (
          <span className="inline-flex items-center text-sm text-gray-500">
            <ReceiptText size={14} className="text-gray-400 mr-1" />
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
    </tr>
  );
}