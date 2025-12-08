"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Users,
  Truck,
  Link2,
  Unlink,
  UserCircle,
  ChevronRight,
  AlertCircle
} from "lucide-react";

export default function DriverVehicleAssignmentsComponent({
  vehicles = [],
  drivers = [],
  onAssignmentChange
}) {
  const [expandedView, setExpandedView] = useState(false);

  // Get assigned pairings
  const assignments = vehicles
    .filter(v => v.assigned_driver_id)
    .map(vehicle => {
      const driver = drivers.find(d => d.id === vehicle.assigned_driver_id);
      return {
        vehicle,
        driver,
        status: driver ? 'assigned' : 'invalid'
      };
    });

  // Get unassigned vehicles
  const unassignedVehicles = vehicles.filter(v => !v.assigned_driver_id);

  // Get unassigned drivers
  const assignedDriverIds = vehicles
    .filter(v => v.assigned_driver_id)
    .map(v => v.assigned_driver_id);
  const unassignedDrivers = drivers.filter(d => !assignedDriverIds.includes(d.id));

  const totalVehicles = vehicles.length;
  const assignedCount = assignments.length;
  const assignmentRate = totalVehicles > 0 ? Math.round((assignedCount / totalVehicles) * 100) : 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden mb-6 border border-gray-200 dark:border-gray-700">
      <div className="bg-purple-500 dark:bg-purple-600 px-5 py-4 text-white">
        <h3 className="font-semibold flex items-center">
          <Link2 size={18} className="mr-2" />
          Driver-Vehicle Assignments
        </h3>
      </div>
      <div className="p-4">
        {/* Assignment Rate */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {assignedCount}/{totalVehicles}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Vehicles Assigned</p>
          </div>
          <div className="w-16 h-16 relative">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke="currentColor"
                strokeWidth="6"
                className="text-gray-200 dark:text-gray-700"
              />
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 28}`}
                strokeDashoffset={`${2 * Math.PI * 28 * (1 - assignmentRate / 100)}`}
                className="stroke-purple-500"
                style={{ transition: 'stroke-dashoffset 0.5s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold text-purple-600 dark:text-purple-400">{assignmentRate}%</span>
            </div>
          </div>
        </div>

        {/* Assignments List */}
        {assignments.length > 0 && (
          <div className="space-y-2 mb-3">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Active Pairings
            </p>
            {assignments.slice(0, expandedView ? undefined : 3).map(({ vehicle, driver }) => (
              <div
                key={vehicle.id}
                className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
              >
                <div className="flex items-center min-w-0 flex-1">
                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mr-2 flex-shrink-0">
                    <Truck size={14} className="text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {vehicle.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {vehicle.year} {vehicle.make}
                    </p>
                  </div>
                </div>
                <div className="flex items-center mx-2">
                  <div className="w-6 h-0.5 bg-purple-300 dark:bg-purple-600"></div>
                  <Link2 size={12} className="text-purple-500 mx-1" />
                  <div className="w-6 h-0.5 bg-purple-300 dark:bg-purple-600"></div>
                </div>
                <div className="flex items-center min-w-0 flex-1 justify-end">
                  <div className="min-w-0 text-right mr-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {driver?.name || 'Unknown'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {driver?.position || 'Driver'}
                    </p>
                  </div>
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                    {driver?.image_url ? (
                      <img
                        src={driver.image_url}
                        alt={driver.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <UserCircle size={14} className="text-blue-600 dark:text-blue-400" />
                    )}
                  </div>
                </div>
              </div>
            ))}
            {assignments.length > 3 && !expandedView && (
              <button
                onClick={() => setExpandedView(true)}
                className="w-full text-xs text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 py-1"
              >
                Show {assignments.length - 3} more...
              </button>
            )}
          </div>
        )}

        {/* Unassigned Section */}
        {(unassignedVehicles.length > 0 || unassignedDrivers.length > 0) && (
          <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-2 gap-3">
              {/* Unassigned Vehicles */}
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center">
                  <Unlink size={12} className="mr-1" />
                  Unassigned Vehicles
                </p>
                {unassignedVehicles.length === 0 ? (
                  <p className="text-xs text-green-600 dark:text-green-400">All assigned!</p>
                ) : (
                  <div className="space-y-1">
                    {unassignedVehicles.slice(0, 2).map(vehicle => (
                      <Link
                        key={vehicle.id}
                        href={`/dashboard/fleet/trucks/${vehicle.id}`}
                        className="block text-xs p-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 rounded truncate hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                      >
                        {vehicle.name}
                      </Link>
                    ))}
                    {unassignedVehicles.length > 2 && (
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        +{unassignedVehicles.length - 2} more
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Unassigned Drivers */}
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center">
                  <Users size={12} className="mr-1" />
                  Available Drivers
                </p>
                {unassignedDrivers.length === 0 ? (
                  <p className="text-xs text-blue-600 dark:text-blue-400">All assigned!</p>
                ) : (
                  <div className="space-y-1">
                    {unassignedDrivers.slice(0, 2).map(driver => (
                      <Link
                        key={driver.id}
                        href={`/dashboard/fleet/drivers/${driver.id}`}
                        className="block text-xs p-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded truncate hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                      >
                        {driver.name}
                      </Link>
                    ))}
                    {unassignedDrivers.length > 2 && (
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        +{unassignedDrivers.length - 2} more
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {vehicles.length === 0 && drivers.length === 0 && (
          <div className="text-center py-4">
            <AlertCircle size={24} className="mx-auto text-gray-400 dark:text-gray-500 mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Add vehicles and drivers to manage assignments
            </p>
          </div>
        )}

        {/* Manage Link */}
        <Link
          href="/dashboard/fleet/trucks"
          className="mt-3 flex items-center justify-center text-sm text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 transition-colors"
        >
          Manage Assignments
          <ChevronRight size={16} className="ml-1" />
        </Link>
      </div>
    </div>
  );
}
