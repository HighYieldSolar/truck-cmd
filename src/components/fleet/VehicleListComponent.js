"use client";

import Link from "next/link";
import { 
  Truck,
  Plus
} from "lucide-react";

// Format dates for display
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  
  try {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    return dateString || "N/A";
  }
};

export default function VehicleListComponent({ trucks, handleTruckSelect }) {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 mb-6">
      <div className="bg-gray-50 px-5 py-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="font-medium text-gray-800 flex items-center">
          <Truck size={18} className="mr-2 text-blue-600" />
          Vehicles
        </h3>
        <Link href="/dashboard/fleet/trucks" className="text-sm text-blue-600 hover:text-blue-800">
          View All
        </Link>
      </div>
      <div className="p-4">
        {trucks.length === 0 ? (
          <div className="text-center py-8">
            <div className="mx-auto h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Truck size={24} className="text-blue-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No vehicles found</h3>
            <p className="text-gray-500 mb-4">Add your first vehicle to start managing your fleet.</p>
            <Link
              href="/dashboard/fleet/trucks"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus size={16} className="mr-2" />
              Add Vehicle
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {trucks.map(truck => {
              const statusColors = {
                'Active': 'bg-green-100 text-green-800',
                'In Maintenance': 'bg-yellow-100 text-yellow-800',
                'Out of Service': 'bg-red-100 text-red-800',
                'Idle': 'bg-blue-100 text-blue-800'
              };
              
              return (
                <div 
                  key={truck.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => handleTruckSelect(truck)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-900">{truck.name}</h4>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${statusColors[truck.status] || 'bg-gray-100 text-gray-800'}`}>
                      {truck.status}
                    </span>
                  </div>
                  <div className="flex items-center text-gray-500 mb-3">
                    <Truck size={14} className="mr-2" />
                    <span className="text-sm">{truck.year} {truck.make} {truck.model}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-gray-500">VIN</p>
                      <p className="font-medium text-gray-900">{truck.vin ? truck.vin.slice(-6) : 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">License</p>
                      <p className="font-medium text-gray-900">{truck.license_plate || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Added</p>
                      <p className="font-medium text-gray-900">{formatDate(truck.created_at)?.split(' ').slice(0, 2).join(' ')}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}