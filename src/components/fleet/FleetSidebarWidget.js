"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  AlertTriangle,
  XCircle,
  Link2,
  Unlink,
  Wrench,
  Zap,
  Truck,
  Users,
  UserCircle,
  ChevronRight,
  Plus,
  FileText,
  AlertCircle,
  CheckCircle,
  User
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

export default function FleetSidebarWidget({
  drivers = [],
  vehicles = [],
  documentReminders = [],
  vehicleReminders = [],
  upcomingMaintenance = [],
  handleDriverSelect,
  handleVehicleSelect
}) {
  const [activeTab, setActiveTab] = useState("actions");
  const [healthData, setHealthData] = useState({
    score: 100,
    status: 'excellent',
    totalItems: 0,
    compliantItems: 0,
    expiringItems: 0,
    expiredItems: 0,
    issues: []
  });

  // Calculate health score
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDaysFromNow = new Date(today);
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    let totalItems = 0;
    let compliantItems = 0;
    let expiringItems = 0;
    let expiredItems = 0;
    const issues = [];

    // Check driver documents
    drivers.forEach(driver => {
      if (driver.license_expiry) {
        totalItems++;
        const licenseDate = new Date(driver.license_expiry);
        if (licenseDate < today) {
          expiredItems++;
          issues.push({ type: 'expired', entity: driver.name, doc: 'CDL License', date: driver.license_expiry });
        } else if (licenseDate <= thirtyDaysFromNow) {
          expiringItems++;
          issues.push({ type: 'expiring', entity: driver.name, doc: 'CDL License', date: driver.license_expiry });
        } else {
          compliantItems++;
        }
      }

      if (driver.medical_card_expiry) {
        totalItems++;
        const medicalDate = new Date(driver.medical_card_expiry);
        if (medicalDate < today) {
          expiredItems++;
          issues.push({ type: 'expired', entity: driver.name, doc: 'Medical Card', date: driver.medical_card_expiry });
        } else if (medicalDate <= thirtyDaysFromNow) {
          expiringItems++;
          issues.push({ type: 'expiring', entity: driver.name, doc: 'Medical Card', date: driver.medical_card_expiry });
        } else {
          compliantItems++;
        }
      }
    });

    // Check vehicle documents
    vehicles.forEach(vehicle => {
      if (vehicle.registration_expiry) {
        totalItems++;
        const regDate = new Date(vehicle.registration_expiry);
        if (regDate < today) {
          expiredItems++;
          issues.push({ type: 'expired', entity: vehicle.name, doc: 'Registration', date: vehicle.registration_expiry });
        } else if (regDate <= thirtyDaysFromNow) {
          expiringItems++;
          issues.push({ type: 'expiring', entity: vehicle.name, doc: 'Registration', date: vehicle.registration_expiry });
        } else {
          compliantItems++;
        }
      }

      if (vehicle.insurance_expiry) {
        totalItems++;
        const insDate = new Date(vehicle.insurance_expiry);
        if (insDate < today) {
          expiredItems++;
          issues.push({ type: 'expired', entity: vehicle.name, doc: 'Insurance', date: vehicle.insurance_expiry });
        } else if (insDate <= thirtyDaysFromNow) {
          expiringItems++;
          issues.push({ type: 'expiring', entity: vehicle.name, doc: 'Insurance', date: vehicle.insurance_expiry });
        } else {
          compliantItems++;
        }
      }

      if (vehicle.inspection_expiry) {
        totalItems++;
        const inspDate = new Date(vehicle.inspection_expiry);
        if (inspDate < today) {
          expiredItems++;
          issues.push({ type: 'expired', entity: vehicle.name, doc: 'DOT Inspection', date: vehicle.inspection_expiry });
        } else if (inspDate <= thirtyDaysFromNow) {
          expiringItems++;
          issues.push({ type: 'expiring', entity: vehicle.name, doc: 'DOT Inspection', date: vehicle.inspection_expiry });
        } else {
          compliantItems++;
        }
      }
    });

    // Calculate score
    let score = 100;
    if (totalItems > 0) {
      const expiredPenalty = (expiredItems / totalItems) * 50;
      const expiringPenalty = (expiringItems / totalItems) * 20;
      score = Math.max(0, Math.round(100 - expiredPenalty - expiringPenalty));
    }

    let status = 'excellent';
    if (score < 50) status = 'critical';
    else if (score < 70) status = 'warning';
    else if (score < 90) status = 'good';

    issues.sort((a, b) => {
      if (a.type === 'expired' && b.type !== 'expired') return -1;
      if (a.type !== 'expired' && b.type === 'expired') return 1;
      return new Date(a.date) - new Date(b.date);
    });

    setHealthData({
      score,
      status,
      totalItems,
      compliantItems,
      expiringItems,
      expiredItems,
      issues: issues.slice(0, 3)
    });
  }, [drivers, vehicles]);

  // Assignment calculations
  const assignments = vehicles
    .filter(v => v.assigned_driver_id)
    .map(vehicle => {
      const driver = drivers.find(d => d.id === vehicle.assigned_driver_id);
      return { vehicle, driver, status: driver ? 'assigned' : 'invalid' };
    });

  const unassignedVehicles = vehicles.filter(v => !v.assigned_driver_id);
  const assignedDriverIds = vehicles.filter(v => v.assigned_driver_id).map(v => v.assigned_driver_id);
  const unassignedDrivers = drivers.filter(d => !assignedDriverIds.includes(d.id));
  const totalVehicles = vehicles.length;
  const assignedCount = assignments.length;
  const assignmentRate = totalVehicles > 0 ? Math.round((assignedCount / totalVehicles) * 100) : 0;

  // Combined alerts
  const allAlerts = [
    ...documentReminders.map(r => ({ ...r, category: 'driver' })),
    ...vehicleReminders.map(r => ({ ...r, category: 'vehicle' }))
  ].sort((a, b) => a.daysRemaining - b.daysRemaining);

  const alertCount = allAlerts.length + upcomingMaintenance.length;

  // Tab configuration
  const tabs = [
    { id: "actions", label: "Actions", icon: Zap },
    { id: "health", label: "Health", icon: ShieldCheck },
    { id: "assignments", label: "Assign", icon: Link2 },
    { id: "alerts", label: "Alerts", icon: AlertTriangle, badge: alertCount > 0 ? alertCount : null }
  ];

  const getHealthConfig = () => {
    switch (healthData.status) {
      case 'critical':
        return { color: 'text-red-600 dark:text-red-400', ringColor: 'stroke-red-500', label: 'Critical' };
      case 'warning':
        return { color: 'text-amber-600 dark:text-amber-400', ringColor: 'stroke-amber-500', label: 'Needs Attention' };
      case 'good':
        return { color: 'text-blue-600 dark:text-blue-400', ringColor: 'stroke-blue-500', label: 'Good' };
      default:
        return { color: 'text-green-600 dark:text-green-400', ringColor: 'stroke-green-500', label: 'Excellent' };
    }
  };

  const healthConfig = getHealthConfig();
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (healthData.score / 100) * circumference;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm mb-6 border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Tab Header */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 rounded-t-xl">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1 px-1.5 py-3 text-xs font-medium transition-colors ${
                activeTab === tab.id
                  ? "text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-800 border-b-2 border-blue-600 dark:border-blue-400 -mb-px"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              <Icon size={14} className="flex-shrink-0" />
              <span className="hidden sm:inline">{tab.label}</span>
              {tab.badge && (
                <span className="min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center flex-shrink-0">
                  {tab.badge > 99 ? '99+' : tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {/* Health Tab */}
        {activeTab === "health" && (
          <div>
            <div className="flex items-center gap-4 mb-4">
              {/* Compact Progress Ring */}
              <div className="relative w-20 h-20 flex-shrink-0">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="40" cy="40" r={radius} fill="none" stroke="currentColor" strokeWidth="6" className="text-gray-200 dark:text-gray-700" />
                  <circle cx="40" cy="40" r={radius} fill="none" strokeWidth="6" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} className={healthConfig.ringColor} style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-lg font-bold ${healthConfig.color}`}>{healthData.score}%</span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="flex-1 grid grid-cols-3 gap-1 text-center">
                <div className="bg-green-50 dark:bg-green-900/20 rounded p-1.5">
                  <p className="text-sm font-semibold text-green-600 dark:text-green-400">{healthData.compliantItems}</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">Valid</p>
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded p-1.5">
                  <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">{healthData.expiringItems}</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">Expiring</p>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 rounded p-1.5">
                  <p className="text-sm font-semibold text-red-600 dark:text-red-400">{healthData.expiredItems}</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">Expired</p>
                </div>
              </div>
            </div>

            {/* Top Issues */}
            {healthData.issues.length > 0 && (
              <div className="space-y-1.5 mb-3">
                {healthData.issues.map((issue, index) => (
                  <div key={index} className={`text-xs p-2 rounded flex items-center justify-between ${
                    issue.type === 'expired'
                      ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                      : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300'
                  }`}>
                    <span className="truncate">{issue.entity} - {issue.doc}</span>
                    <span className="font-medium ml-2 whitespace-nowrap">{issue.type === 'expired' ? 'Expired' : 'Soon'}</span>
                  </div>
                ))}
              </div>
            )}

            {healthData.issues.length === 0 && healthData.totalItems > 0 && (
              <div className="text-center py-2 text-sm text-green-600 dark:text-green-400">
                <CheckCircle size={16} className="inline mr-1" />
                All documents up to date!
              </div>
            )}

            <Link href="/dashboard/compliance" className="flex items-center justify-center text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mt-2">
              View Compliance <ChevronRight size={14} className="ml-1" />
            </Link>
          </div>
        )}

        {/* Assignments Tab */}
        {activeTab === "assignments" && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{assignedCount}/{totalVehicles}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Vehicles Assigned</p>
              </div>
              <div className="w-14 h-14 relative">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="28" cy="28" r="24" fill="none" stroke="currentColor" strokeWidth="5" className="text-gray-200 dark:text-gray-700" />
                  <circle cx="28" cy="28" r="24" fill="none" strokeWidth="5" strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 24}`} strokeDashoffset={`${2 * Math.PI * 24 * (1 - assignmentRate / 100)}`} className="stroke-purple-500" style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold text-purple-600 dark:text-purple-400">{assignmentRate}%</span>
                </div>
              </div>
            </div>

            {/* Active Pairings */}
            {assignments.length > 0 && (
              <div className="space-y-1.5 mb-3">
                <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase">Active Pairings</p>
                {assignments.slice(0, 3).map(({ vehicle, driver }) => (
                  <div key={vehicle.id} className="flex items-center justify-between p-1.5 bg-gray-50 dark:bg-gray-700/50 rounded text-xs">
                    <div className="flex items-center min-w-0 flex-1">
                      <Truck size={12} className="text-purple-500 mr-1.5 flex-shrink-0" />
                      <span className="truncate text-gray-700 dark:text-gray-300">{vehicle.name}</span>
                    </div>
                    <Link2 size={10} className="text-purple-400 mx-1.5" />
                    <div className="flex items-center min-w-0 flex-1 justify-end">
                      <span className="truncate text-gray-700 dark:text-gray-300">{driver?.name || 'Unknown'}</span>
                      <UserCircle size={12} className="text-blue-500 ml-1.5 flex-shrink-0" />
                    </div>
                  </div>
                ))}
                {assignments.length > 3 && (
                  <p className="text-[10px] text-gray-400 text-center">+{assignments.length - 3} more</p>
                )}
              </div>
            )}

            {/* Unassigned Summary */}
            {(unassignedVehicles.length > 0 || unassignedDrivers.length > 0) && (
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                <div className="text-center p-2 bg-amber-50 dark:bg-amber-900/20 rounded">
                  <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">{unassignedVehicles.length}</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">Unassigned Vehicles</p>
                </div>
                <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                  <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">{unassignedDrivers.length}</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">Available Drivers</p>
                </div>
              </div>
            )}

            <Link href="/dashboard/fleet/trucks" className="flex items-center justify-center text-xs text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 mt-3">
              Manage Assignments <ChevronRight size={14} className="ml-1" />
            </Link>
          </div>
        )}

        {/* Alerts Tab */}
        {activeTab === "alerts" && (
          <div>
            {allAlerts.length === 0 && upcomingMaintenance.length === 0 ? (
              <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                <CheckCircle size={28} className="mx-auto mb-2 text-green-500 dark:text-green-400" />
                <p className="text-sm">No alerts at this time</p>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Document Alerts */}
                {allAlerts.slice(0, 3).map(item => {
                  const isVehicle = item.category === 'vehicle';
                  const Icon = isVehicle ? Truck : User;
                  const name = isVehicle ? item.vehicle : item.driver;
                  return (
                    <div
                      key={item.id}
                      className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded hover:bg-orange-50 dark:hover:bg-orange-900/20 cursor-pointer transition-colors"
                      onClick={() => {
                        if (item.category === 'driver' && handleDriverSelect) handleDriverSelect({ id: item.driverId });
                        else if (item.category === 'vehicle' && handleVehicleSelect) handleVehicleSelect({ id: item.vehicleId });
                      }}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center min-w-0 flex-1">
                          <Icon size={12} className={isVehicle ? 'text-blue-500 mr-1.5' : 'text-purple-500 mr-1.5'} />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">{name}</p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400">{item.type} - {formatDate(item.expiryDate)}</p>
                          </div>
                        </div>
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                          item.daysRemaining <= 0
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                            : item.daysRemaining <= 7
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                              : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
                        }`}>
                          {item.daysRemaining <= 0 ? 'Expired' : `${item.daysRemaining}d`}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {/* Maintenance Alerts */}
                {upcomingMaintenance.slice(0, 2).map(item => (
                  <div key={item.id} className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center min-w-0 flex-1">
                        <Wrench size={12} className="text-amber-500 mr-1.5" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">{item.vehicles?.name || 'Vehicle'}</p>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{item.title}</p>
                        </div>
                      </div>
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">{formatDate(item.due_date)}</span>
                    </div>
                  </div>
                ))}

                {(allAlerts.length > 3 || upcomingMaintenance.length > 2) && (
                  <p className="text-[10px] text-gray-400 text-center pt-1">
                    +{Math.max(0, allAlerts.length - 3) + Math.max(0, upcomingMaintenance.length - 2)} more alerts
                  </p>
                )}

                <Link href="/dashboard/compliance" className="flex items-center justify-center text-xs text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-300 mt-2">
                  View All Alerts <ChevronRight size={14} className="ml-1" />
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Quick Actions Tab */}
        {activeTab === "actions" && (
          <div className="space-y-2">
            <Link
              href="/dashboard/fleet/trucks"
              className="flex items-center w-full p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
            >
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center mr-3">
                <Truck size={16} className="text-blue-600 dark:text-blue-300" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Manage Vehicles</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">View and add trucks</p>
              </div>
            </Link>

            <Link
              href="/dashboard/fleet/drivers"
              className="flex items-center w-full p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
            >
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-800 rounded-full flex items-center justify-center mr-3">
                <Users size={16} className="text-purple-600 dark:text-purple-300" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Manage Drivers</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">View and add drivers</p>
              </div>
            </Link>

            <Link
              href="/dashboard/fleet/maintenance"
              className="flex items-center w-full p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
            >
              <div className="w-8 h-8 bg-amber-100 dark:bg-amber-800 rounded-full flex items-center justify-center mr-3">
                <Wrench size={16} className="text-amber-600 dark:text-amber-300" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Maintenance</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">Schedule & track repairs</p>
              </div>
            </Link>

            <Link
              href="/dashboard/compliance"
              className="flex items-center w-full p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
            >
              <div className="w-8 h-8 bg-orange-100 dark:bg-orange-800 rounded-full flex items-center justify-center mr-3">
                <FileText size={16} className="text-orange-600 dark:text-orange-300" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Compliance Center</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">Manage documents</p>
              </div>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
