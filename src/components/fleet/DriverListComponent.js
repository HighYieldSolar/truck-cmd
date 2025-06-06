"use client";

import Link from "next/link";
import { 
  Users,
  Plus
} from "lucide-react";
import { formatDateForDisplayMMDDYYYY } from "@/lib/utils/dateUtils";

// Format dates for display
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  
  try {
    return formatDateForDisplayMMDDYYYY(dateString);
  } catch (error) {
    return dateString || "N/A";
  }
};

export default function DriverListComponent({ drivers, handleDriverSelect }) {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
      <div className="bg-gray-50 px-5 py-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="font-medium text-gray-800 flex items-center">
          <Users size={18} className="mr-2 text-blue-600" />
          Drivers
        </h3>
        <Link href="/dashboard/fleet/drivers" className="text-sm text-blue-600 hover:text-blue-800">
          View All
        </Link>
      </div>
      <div className="p-4">
        {drivers.length === 0 ? (
          <div className="text-center py-8">
            <div className="mx-auto h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Users size={24} className="text-blue-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No drivers found</h3>
            <p className="text-gray-500 mb-4">Add your first driver to start managing your team.</p>
            <Link
              href="/dashboard/fleet/drivers"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus size={16} className="mr-2" />
              Add Driver
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {drivers.map(driver => {
              const statusColors = {
                'Active': 'bg-green-100 text-green-800',
                'Inactive': 'bg-red-100 text-red-800',
                'On Leave': 'bg-blue-100 text-blue-800'
              };
              
              // Calculate days until license expiry
              const getLicenseStatus = () => {
                if (!driver.license_expiry) return null;
                
                const now = new Date();
                const expiry = new Date(driver.license_expiry);
                const daysUntilExpiry = Math.floor((expiry - now) / (1000 * 60 * 60 * 24));
                
                if (daysUntilExpiry < 0) {
                  return { text: 'Expired', class: 'bg-red-100 text-red-800' };
                } else if (daysUntilExpiry < 30) {
                  return { text: `${daysUntilExpiry} days`, class: 'bg-yellow-100 text-yellow-800' };
                } else {
                  return { text: 'Valid', class: 'bg-green-100 text-green-800' };
                }
              };
              
              const licenseStatus = getLicenseStatus();
              
              return (
                <div 
                  key={driver.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => handleDriverSelect(driver)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-900">{driver.name}</h4>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${statusColors[driver.status] || 'bg-gray-100 text-gray-800'}`}>
                      {driver.status}
                    </span>
                  </div>
                  <div className="flex items-center text-gray-500 mb-3">
                    <Users size={14} className="mr-2" />
                    <span className="text-sm">{driver.position || 'Driver'}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-gray-500">Phone</p>
                      <p className="font-medium text-gray-900">{driver.phone || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">License</p>
                      <div className="flex items-center">
                        {licenseStatus ? (
                          <span className={`px-1.5 py-0.5 text-xs rounded-full ${licenseStatus.class}`}>
                            {licenseStatus.text}
                          </span>
                        ) : (
                          <span className="font-medium text-gray-900">N/A</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-500">Hire Date</p>
                      <p className="font-medium text-gray-900">{formatDate(driver.hire_date)?.split(' ').slice(0, 2).join(' ') || 'N/A'}</p>
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