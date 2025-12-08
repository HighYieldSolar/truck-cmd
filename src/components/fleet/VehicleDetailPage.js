"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { getTruckById, deleteTruck } from "@/lib/services/truckService";
import { formatDateForDisplayMMDDYYYY } from "@/lib/utils/dateUtils";
import TruckFormModal from "@/components/fleet/TruckFormModal";
import MaintenanceFormModal from "@/components/fleet/MaintenanceFormModal";
import DeleteConfirmationModal from "@/components/common/DeleteConfirmationModal";
import OperationMessage from "@/components/ui/OperationMessage";
import {
  ChevronLeft,
  Truck,
  Edit,
  Trash2,
  Calendar,
  MapPin,
  Fuel,
  Gauge,
  FileText,
  Hash,
  Palette,
  Settings,
  AlertTriangle,
  CheckCircle,
  Wrench,
  Clock,
  Activity,
  BarChart3,
  Package
} from "lucide-react";

export default function VehicleDetailPage({ vehicleId }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Related data
  const [maintenanceRecords, setMaintenanceRecords] = useState([]);
  const [fuelEntries, setFuelEntries] = useState([]);
  const [loadHistory, setLoadHistory] = useState([]);

  // Modals
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [maintenanceModalOpen, setMaintenanceModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Messages
  const [operationMessage, setOperationMessage] = useState(null);

  // Load vehicle data
  const loadVehicleData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getTruckById(vehicleId);

      if (!data) {
        setError("Vehicle not found");
        return;
      }

      setVehicle(data);

      // Load related maintenance records
      const { data: maintenance } = await supabase
        .from('maintenance_records')
        .select('*')
        .eq('truck_id', vehicleId)
        .order('due_date', { ascending: false })
        .limit(5);

      setMaintenanceRecords(maintenance || []);

      // Load related fuel entries
      const { data: fuel } = await supabase
        .from('fuel_entries')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('date', { ascending: false })
        .limit(5);

      setFuelEntries(fuel || []);

      // Load related loads
      const { data: loads } = await supabase
        .from('loads')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('created_at', { ascending: false })
        .limit(5);

      setLoadHistory(loads || []);

    } catch (err) {
      setError("Failed to load vehicle data");
    } finally {
      setLoading(false);
    }
  }, [vehicleId]);

  // Check auth and load data
  useEffect(() => {
    async function init() {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
          router.push('/login');
          return;
        }

        setUser(user);
        await loadVehicleData();
      } catch (err) {
        setError("Failed to initialize");
      }
    }

    init();
  }, [router, loadVehicleData]);

  // Handle edit
  const handleEdit = () => {
    setEditModalOpen(true);
  };

  // Handle edit submit
  const handleEditSubmit = async () => {
    await loadVehicleData();
    setOperationMessage({
      type: 'success',
      text: 'Vehicle updated successfully!'
    });
    return true;
  };

  // Handle maintenance submit
  const handleMaintenanceSubmit = async () => {
    await loadVehicleData();
    setMaintenanceModalOpen(false);
    setOperationMessage({
      type: 'success',
      text: 'Maintenance record added successfully!'
    });
    return true;
  };

  // Handle delete
  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteTruck(vehicleId);

      setOperationMessage({
        type: 'success',
        text: 'Vehicle deleted successfully!'
      });

      setTimeout(() => {
        router.push('/dashboard/fleet/trucks');
      }, 1500);
    } catch (err) {
      setOperationMessage({
        type: 'error',
        text: 'Failed to delete vehicle'
      });
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
    }
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return "N/A";
    try {
      return formatDateForDisplayMMDDYYYY(date);
    } catch {
      return date;
    }
  };

  // Get status styling
  const getStatusStyle = (status) => {
    switch (status) {
      case 'Active':
        return {
          bg: 'bg-green-100 dark:bg-green-900/40',
          text: 'text-green-800 dark:text-green-300',
          icon: CheckCircle,
          iconColor: 'text-green-600 dark:text-green-400'
        };
      case 'In Maintenance':
        return {
          bg: 'bg-yellow-100 dark:bg-yellow-900/40',
          text: 'text-yellow-800 dark:text-yellow-300',
          icon: Wrench,
          iconColor: 'text-yellow-600 dark:text-yellow-400'
        };
      case 'Out of Service':
        return {
          bg: 'bg-red-100 dark:bg-red-900/40',
          text: 'text-red-800 dark:text-red-300',
          icon: AlertTriangle,
          iconColor: 'text-red-600 dark:text-red-400'
        };
      case 'Idle':
        return {
          bg: 'bg-blue-100 dark:bg-blue-900/40',
          text: 'text-blue-800 dark:text-blue-300',
          icon: Clock,
          iconColor: 'text-blue-600 dark:text-blue-400'
        };
      default:
        return {
          bg: 'bg-gray-100 dark:bg-gray-700',
          text: 'text-gray-800 dark:text-gray-300',
          icon: Truck,
          iconColor: 'text-gray-600 dark:text-gray-400'
        };
    }
  };

  // Loading state
  if (loading) {
    return (
      <DashboardLayout activePage="fleet">
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
          <div className="max-w-6xl mx-auto">
            <div className="animate-pulse">
              <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl mb-6"></div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 h-96 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Error state
  if (error || !vehicle) {
    return (
      <DashboardLayout activePage="fleet">
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
          <div className="max-w-6xl mx-auto">
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={32} className="text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {error || "Vehicle not found"}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                The vehicle you're looking for doesn't exist or has been deleted.
              </p>
              <Link
                href="/dashboard/fleet/trucks"
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <ChevronLeft size={18} className="mr-2" />
                Back to Vehicles
              </Link>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const statusStyle = getStatusStyle(vehicle.status);
  const StatusIcon = statusStyle.icon;

  return (
    <DashboardLayout activePage="fleet">
      <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-200">
        <div className="max-w-6xl mx-auto">
          {/* Operation Message */}
          <OperationMessage
            message={operationMessage}
            onDismiss={() => setOperationMessage(null)}
          />

          {/* Header */}
          <div className="mb-6 bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-700 dark:to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="flex items-start mb-4 md:mb-0">
                <Link
                  href="/dashboard/fleet/trucks"
                  className="mr-3 p-2 rounded-full hover:bg-white/20 transition-colors"
                >
                  <ChevronLeft size={20} />
                </Link>
                <div className="flex items-center">
                  <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center mr-4">
                    <Truck size={28} />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold">{vehicle.name}</h1>
                    <p className="text-blue-100">
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                  <StatusIcon size={16} className="mr-1.5" />
                  {vehicle.status}
                </span>
                <button
                  onClick={handleEdit}
                  className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors flex items-center font-medium"
                >
                  <Edit size={18} className="mr-2" />
                  Edit
                </button>
                <button
                  onClick={() => setDeleteModalOpen(true)}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors flex items-center font-medium"
                >
                  <Trash2 size={18} className="mr-2" />
                  Delete
                </button>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Vehicle Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Vehicle Information Card */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-200">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                    <FileText size={18} className="mr-2 text-blue-600 dark:text-blue-400" />
                    Vehicle Information
                  </h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* VIN */}
                    <div className="flex items-start">
                      <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                        <Hash size={18} className="text-gray-600 dark:text-gray-400" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">VIN</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100 font-mono">
                          {vehicle.vin || "Not specified"}
                        </p>
                      </div>
                    </div>

                    {/* License Plate */}
                    <div className="flex items-start">
                      <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                        <FileText size={18} className="text-gray-600 dark:text-gray-400" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">License Plate</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {vehicle.license_plate || "Not specified"}
                        </p>
                      </div>
                    </div>

                    {/* Vehicle Type */}
                    <div className="flex items-start">
                      <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                        <Truck size={18} className="text-gray-600 dark:text-gray-400" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Vehicle Type</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {vehicle.type || "Not specified"}
                        </p>
                      </div>
                    </div>

                    {/* Color */}
                    <div className="flex items-start">
                      <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                        <Palette size={18} className="text-gray-600 dark:text-gray-400" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Color</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {vehicle.color || "Not specified"}
                        </p>
                      </div>
                    </div>

                    {/* Fuel Type */}
                    <div className="flex items-start">
                      <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                        <Fuel size={18} className="text-gray-600 dark:text-gray-400" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Fuel Type</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {vehicle.fuel_type || "Not specified"}
                        </p>
                      </div>
                    </div>

                    {/* Tank Capacity */}
                    <div className="flex items-start">
                      <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                        <Gauge size={18} className="text-gray-600 dark:text-gray-400" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Tank Capacity</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {vehicle.tank_capacity ? `${vehicle.tank_capacity} gal` : "Not specified"}
                        </p>
                      </div>
                    </div>

                    {/* MPG */}
                    <div className="flex items-start">
                      <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                        <BarChart3 size={18} className="text-gray-600 dark:text-gray-400" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Fuel Efficiency</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {vehicle.mpg ? `${vehicle.mpg} MPG` : "Not specified"}
                        </p>
                      </div>
                    </div>

                    {/* Added Date */}
                    <div className="flex items-start">
                      <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                        <Calendar size={18} className="text-gray-600 dark:text-gray-400" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Added On</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {formatDate(vehicle.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {vehicle.notes && (
                    <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Notes</h4>
                      <p className="text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                        {vehicle.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Loads */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-200">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                    <Package size={18} className="mr-2 text-blue-600 dark:text-blue-400" />
                    Recent Loads
                  </h3>
                  <Link
                    href="/dashboard/dispatching"
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                  >
                    View All
                  </Link>
                </div>
                <div className="p-6">
                  {loadHistory.length === 0 ? (
                    <div className="text-center py-8">
                      <Package size={32} className="mx-auto text-gray-400 dark:text-gray-500 mb-2" />
                      <p className="text-gray-500 dark:text-gray-400">No loads assigned to this vehicle yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {loadHistory.map(load => (
                        <div
                          key={load.id}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                        >
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {load.origin} → {load.destination}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {formatDate(load.pickup_date)}
                            </p>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            load.status === 'Completed'
                              ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300'
                              : load.status === 'In Transit'
                              ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300'
                              : 'bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-300'
                          }`}>
                            {load.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-200">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                    <Activity size={18} className="mr-2 text-blue-600 dark:text-blue-400" />
                    Quick Stats
                  </h3>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Total Loads</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{loadHistory.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Fuel Entries</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{fuelEntries.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Maintenance Records</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{maintenanceRecords.length}</span>
                  </div>
                </div>
              </div>

              {/* Upcoming Maintenance */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-200">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                    <Wrench size={18} className="mr-2 text-amber-600 dark:text-amber-400" />
                    Maintenance
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setMaintenanceModalOpen(true)}
                      className="text-sm text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 font-medium"
                    >
                      + Add
                    </button>
                    <span className="text-gray-300 dark:text-gray-600">|</span>
                    <Link
                      href="/dashboard/fleet/maintenance"
                      className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                    >
                      View All
                    </Link>
                  </div>
                </div>
                <div className="p-6">
                  {maintenanceRecords.length === 0 ? (
                    <button
                      onClick={() => setMaintenanceModalOpen(true)}
                      className="w-full text-center py-6 hover:bg-gray-50 dark:hover:bg-gray-700/30 rounded-lg transition-colors cursor-pointer"
                    >
                      <Wrench size={28} className="mx-auto text-gray-400 dark:text-gray-500 mb-2" />
                      <p className="text-gray-500 dark:text-gray-400 text-sm">No maintenance records</p>
                      <p className="text-blue-600 dark:text-blue-400 text-sm mt-1 font-medium">+ Add maintenance record</p>
                    </button>
                  ) : (
                    <div className="space-y-3">
                      {maintenanceRecords.slice(0, 3).map(record => (
                        <Link
                          key={record.id}
                          href="/dashboard/fleet/maintenance"
                          className="block p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                            {record.maintenance_type || record.service_type || record.description || 'Maintenance'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {formatDate(record.due_date || record.scheduled_date || record.date)}
                            {record.status && (
                              <span className={`ml-2 px-1.5 py-0.5 rounded text-xs ${
                                record.status === 'Completed'
                                  ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
                                  : record.status === 'Overdue'
                                  ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
                                  : 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300'
                              }`}>
                                {record.status}
                              </span>
                            )}
                          </p>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Fuel Entries */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-200">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                    <Fuel size={18} className="mr-2 text-green-600 dark:text-green-400" />
                    Recent Fuel
                  </h3>
                  <Link
                    href="/dashboard/fuel"
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                  >
                    View All
                  </Link>
                </div>
                <div className="p-6">
                  {fuelEntries.length === 0 ? (
                    <div className="text-center py-6">
                      <Fuel size={28} className="mx-auto text-gray-400 dark:text-gray-500 mb-2" />
                      <p className="text-gray-500 dark:text-gray-400 text-sm">No fuel entries</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {fuelEntries.slice(0, 3).map(entry => (
                        <div
                          key={entry.id}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                        >
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                              {entry.gallons?.toFixed(2)} gal
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDate(entry.date)}
                            </p>
                          </div>
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            ${entry.total_amount?.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <TruckFormModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        truck={vehicle}
        userId={user?.id}
        onSubmit={handleEditSubmit}
      />

      {/* Delete Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Vehicle"
        message={`Are you sure you want to delete "${vehicle.name}"? This action cannot be undone and will remove all associated records.`}
        isDeleting={isDeleting}
      />

      {/* Maintenance Modal */}
      <MaintenanceFormModal
        isOpen={maintenanceModalOpen}
        onClose={() => setMaintenanceModalOpen(false)}
        record={{ truck_id: vehicleId }}
        userId={user?.id}
        trucks={[vehicle]}
        onSubmit={handleMaintenanceSubmit}
      />
    </DashboardLayout>
  );
}
