"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { 
  Truck, 
  Users, 
  ArrowUpRight, 
  ArrowDownRight,
  AlertTriangle,
  FileCog,
  Clock,
  Calendar,
  BarChart2,
  Activity,
  Search,
  Filter,
  Plus
} from "lucide-react";
import { getTruckStats } from "@/lib/services/truckService";
import { getDriverStats } from "@/lib/services/driverService";

// StatCard component for displaying statistics
const StatCard = ({ title, value, icon, color, change, changeType, changeText }) => {
  return (
    <div className="bg-white rounded-lg shadow p-5">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`bg-${color}-100 p-2 rounded-md`}>
          {icon}
        </div>
      </div>
      
      {change && (
        <div className="mt-3 flex items-center">
          {changeType === 'increase' ? (
            <ArrowUpRight size={16} className={changeType === 'positive' ? 'text-green-500' : 'text-red-500'} />
          ) : (
            <ArrowDownRight size={16} className={changeType === 'positive' ? 'text-green-500' : 'text-red-500'} />
          )}
          <span className={`text-sm ml-1 ${
            changeType === 'positive' ? 'text-green-600' : 'text-red-600'
          }`}>
            {change} {changeText || ''}
          </span>
        </div>
      )}
    </div>
  );
};

// TruckCard component
const TruckCard = ({ truck, onSelect }) => {
  const statusColors = {
    'Active': 'bg-green-100 text-green-800',
    'In Maintenance': 'bg-yellow-100 text-yellow-800',
    'Out of Service': 'bg-red-100 text-red-800',
    'Idle': 'bg-blue-100 text-blue-800'
  };

  return (
    <div 
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-4 cursor-pointer"
      onClick={() => onSelect(truck)}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-medium text-gray-900">{truck.name}</h3>
        <span className={`px-2 py-1 text-xs rounded-full ${statusColors[truck.status] || 'bg-gray-100 text-gray-800'}`}>
          {truck.status}
        </span>
      </div>
      
      <div className="flex items-center text-gray-500 mb-3">
        <Truck size={16} className="mr-2" />
        <span>{truck.year} {truck.make} {truck.model}</span>
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <p className="text-gray-500">VIN</p>
          <p className="text-black font-medium">{truck.vin ? truck.vin.slice(-6) : 'N/A'}</p>
        </div>
        <div>
          <p className="text-gray-500">License</p>
          <p className="text-black font-medium">{truck.license_plate || 'N/A'}</p>
        </div>
      </div>
    </div>
  );
};

// DriverCard component
const DriverCard = ({ driver, onSelect }) => {
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
      return { text: `Expires in ${daysUntilExpiry} days`, class: 'bg-yellow-100 text-yellow-800' };
    } else {
      return { text: 'Valid', class: 'bg-green-100 text-green-800' };
    }
  };

  const licenseStatus = getLicenseStatus();

  return (
    <div 
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-4 cursor-pointer"
      onClick={() => onSelect(driver)}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-medium text-gray-900">{driver.name}</h3>
        <span className={`px-2 py-1 text-xs rounded-full ${statusColors[driver.status] || 'bg-gray-100 text-gray-800'}`}>
          {driver.status}
        </span>
      </div>
      
      <div className="flex items-center text-gray-500 mb-3">
        <Users size={16} className="mr-2" />
        <span>{driver.position || 'Driver'}</span>
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <p className="text-gray-500">License #</p>
          <p className="text-black font-medium">{driver.license_number || 'N/A'}</p>
        </div>
        <div>
          <p className="text-gray-500">License Status</p>
          {licenseStatus && (
            <span className={`px-1.5 py-0.5 text-xs rounded-full ${licenseStatus.class}`}>
              {licenseStatus.text}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// Main component
export default function FleetManagementPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [truckStats, setTruckStats] = useState({
    total: 0,
    active: 0,
    maintenance: 0,
    outOfService: 0
  });
  
  const [driverStats, setDriverStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    expiringLicense: 0,
    expiringMedical: 0
  });
  
  const [recentTrucks, setRecentTrucks] = useState([]);
  const [recentDrivers, setRecentDrivers] = useState([]);
  const [upcomingMaintenance, setUpcomingMaintenance] = useState([]);
  const [documentReminders, setDocumentReminders] = useState([]);

  // Get user and load initial data
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) throw userError;
        
        if (!user) {
          window.location.href = '/login';
          return;
        }
        
        setUser(user);
        
        // Load truck stats
        const truckStatsData = await getTruckStats(user.id);
        setTruckStats(truckStatsData);
        
        // Load driver stats
        const driverStatsData = await getDriverStats(user.id);
        setDriverStats(driverStatsData);
        
        // Load recent trucks
        const { data: trucks, error: trucksError } = await supabase
          .from('vehicles')  // Use your actual table name
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(4);
        
        if (trucksError) throw trucksError;
        setRecentTrucks(trucks || []);
        
        // Load recent drivers
        const { data: drivers, error: driversError } = await supabase
          .from('drivers')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(4);
        
        if (driversError) throw driversError;
        setRecentDrivers(drivers || []);
        
        // Load upcoming maintenance
        const { data: maintenance, error: maintenanceError } = await supabase
          .from('maintenance_records')
          .select('*, trucks(name)')
          .eq('user_id', user.id)
          .gte('due_date', new Date().toISOString().split('T')[0])
          .order('due_date', { ascending: true })
          .limit(5);
        
        if (!maintenanceError) {
          setUpcomingMaintenance(maintenance || []);
        }
        
        // Load document reminders (expiring soon)
        const now = new Date();
        const thirtyDaysLater = new Date();
        thirtyDaysLater.setDate(now.getDate() + 30);
        
        const { data: documents, error: documentsError } = await supabase
          .from('drivers')
          .select('id, name, license_expiry, medical_card_expiry')
          .eq('user_id', user.id)
          .or(`license_expiry.gte.${now.toISOString().split('T')[0]},medical_card_expiry.gte.${now.toISOString().split('T')[0]}`)
          .or(`license_expiry.lte.${thirtyDaysLater.toISOString().split('T')[0]},medical_card_expiry.lte.${thirtyDaysLater.toISOString().split('T')[0]}`);
        
        if (!documentsError) {
          // Format document reminders
          const reminders = [];
          
          documents?.forEach(driver => {
            const licenseExpiry = new Date(driver.license_expiry);
            const medicalExpiry = new Date(driver.medical_card_expiry);
            const now = new Date();
            
            const licenseExpiryDays = Math.floor((licenseExpiry - now) / (1000 * 60 * 60 * 24));
            const medicalExpiryDays = Math.floor((medicalExpiry - now) / (1000 * 60 * 60 * 24));
            
            if (licenseExpiryDays >= 0 && licenseExpiryDays <= 30) {
              reminders.push({
                id: `license-${driver.id}`,
                driver: driver.name,
                driverId: driver.id,
                type: 'License',
                expiryDate: driver.license_expiry,
                daysRemaining: licenseExpiryDays
              });
            }
            
            if (medicalExpiryDays >= 0 && medicalExpiryDays <= 30) {
              reminders.push({
                id: `medical-${driver.id}`,
                driver: driver.name,
                driverId: driver.id,
                type: 'Medical Card',
                expiryDate: driver.medical_card_expiry,
                daysRemaining: medicalExpiryDays
              });
            }
          });
          
          // Sort by days remaining (ascending)
          reminders.sort((a, b) => a.daysRemaining - b.daysRemaining);
          
          setDocumentReminders(reminders);
        }
      } catch (error) {
        console.error('Error loading fleet data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, []);

  const handleTruckSelect = (truck) => {
    window.location.href = `/dashboard/fleet/trucks/${truck.id}`;
  };

  const handleDriverSelect = (driver) => {
    window.location.href = `/dashboard/fleet/drivers/${driver.id}`;
  };

  if (loading) {
    return (
      <DashboardLayout activePage="fleet">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activePage="fleet">
      <div className="p-4 sm:p-6 lg:p-8 bg-gray-100">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Fleet Management</h1>
              <p className="text-gray-600">Manage your vehicles and drivers</p>
            </div>
            <div className="mt-4 sm:mt-0 flex flex-wrap gap-3">
              <Link
                href="/dashboard/fleet/trucks"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
              >
                <Plus size={16} className="mr-2" />
                Add Truck
              </Link>
              <Link
                href="/dashboard/fleet/drivers"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none"
              >
                <Plus size={16} className="mr-2" />
                Add Driver
              </Link>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-6 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={`pb-3 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Overview
              </button>
              <Link
                href="/dashboard/fleet/trucks"
                className="pb-3 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700 hover:border-gray-300"
              >
                Trucks
              </Link>
              <Link
                href="/dashboard/fleet/drivers"
                className="pb-3 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700 hover:border-gray-300"
              >
                Drivers
              </Link>
              <Link
                href="/dashboard/fleet/maintenance"
                className="pb-3 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700 hover:border-gray-300"
              >
                Maintenance
              </Link>
            </nav>
          </div>

          {/* Overview Tab Content */}
          {activeTab === 'overview' && (
            <div>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard
                  title="Total Vehicles"
                  value={truckStats.total}
                  icon={<Truck size={20} className="text-blue-500" />}
                  color="blue"
                />
                <StatCard
                  title="Active Vehicles"
                  value={truckStats.active}
                  icon={<Activity size={20} className="text-green-500" />}
                  color="green"
                  change={truckStats.active > 0 ? `${Math.round((truckStats.active / truckStats.total) * 100)}%` : "0%"}
                  changeType="positive"
                  changeText="utilization rate"
                />
                <StatCard
                  title="Vehicles In Maintenance"
                  value={truckStats.maintenance}
                  icon={<FileCog size={20} className="text-yellow-500" />}
                  color="yellow"
                />
                <StatCard
                  title="Total Drivers"
                  value={driverStats.total}
                  icon={<Users size={20} className="text-purple-500" />}
                  color="purple"
                />
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Recent Trucks */}
                  <div className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                      <h3 className="text-lg font-medium text-gray-900">Recent Vehicles</h3>
                      <Link href="/dashboard/fleet/trucks" className="text-sm text-blue-600 hover:text-blue-500">
                        View All
                      </Link>
                    </div>
                    {recentTrucks.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
                        {recentTrucks.map((truck) => (
                          <TruckCard key={truck.id} truck={truck} onSelect={handleTruckSelect} />
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 text-center">
                        <p className="text-gray-500 mb-4">No vehicles found</p>
                        <Link
                          href="/dashboard/fleet/trucks"
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                        >
                          <Plus size={16} className="mr-2" />
                          Add Your First Vehicle
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* Recent Drivers */}
                  <div className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                      <h3 className="text-lg font-medium text-gray-900">Recent Drivers</h3>
                      <Link href="/dashboard/fleet/drivers" className="text-sm text-blue-600 hover:text-blue-500">
                        View All
                      </Link>
                    </div>
                    {recentDrivers.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
                        {recentDrivers.map((driver) => (
                          <DriverCard key={driver.id} driver={driver} onSelect={handleDriverSelect} />
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 text-center">
                        <p className="text-gray-500 mb-4">No drivers found</p>
                        <Link
                          href="/dashboard/fleet/drivers"
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200"
                        >
                          <Plus size={16} className="mr-2" />
                          Add Your First Driver
                        </Link>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Upcoming Maintenance */}
                  <div className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h3 className="text-lg font-medium text-gray-900">Upcoming Maintenance</h3>
                    </div>
                    <div className="p-6">
                      {upcomingMaintenance.length > 0 ? (
                        <div className="space-y-4">
                          {upcomingMaintenance.map((item) => (
                            <div key={item.id} className="flex items-start space-x-3">
                              <div className="bg-yellow-100 p-2 rounded-full">
                                <FileCog size={16} className="text-yellow-600" />
                              </div>
                              <div className="flex-1">
                                <div className="flex justify-between">
                                  <p className="text-sm font-medium text-gray-900">{item.maintenance_type}</p>
                                  <p className="text-xs text-gray-500">{new Date(item.due_date).toLocaleDateString()}</p>
                                </div>
                                <p className="text-sm text-gray-500">{item.trucks?.name || 'Unknown Vehicle'}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-gray-500">No upcoming maintenance</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Document Reminders */}
                  <div className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h3 className="text-lg font-medium text-gray-900">Document Reminders</h3>
                    </div>
                    <div className="p-6">
                      {documentReminders.length > 0 ? (
                        <div className="space-y-4">
                          {documentReminders.map((item) => (
                            <div key={item.id} className="flex items-start space-x-3">
                              <div className="bg-red-100 p-2 rounded-full">
                                <AlertTriangle size={16} className="text-red-600" />
                              </div>
                              <div className="flex-1">
                                <div className="flex justify-between">
                                  <p className="text-sm font-medium text-gray-900">{item.type} Expiring</p>
                                  <p className="text-xs text-gray-500">{item.daysRemaining} days left</p>
                                </div>
                                <p className="text-sm text-gray-500">{item.driver}</p>
                                <p className="text-xs text-gray-400">Expires: {new Date(item.expiryDate).toLocaleDateString()}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-gray-500">No document reminders</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
                    </div>
                    <div className="p-6 grid grid-cols-2 gap-4">
                      <Link
                        href="/dashboard/fleet/maintenance/schedule"
                        className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-200 transition-colors"
                      >
                        <Calendar size={20} className="text-blue-600 mb-2" />
                        <span className="text-sm font-medium text-gray-700">Schedule Maintenance</span>
                      </Link>
                      <Link
                        href="/dashboard/fleet/documents"
                        className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-200 transition-colors"
                      >
                        <FileCog size={20} className="text-blue-600 mb-2" />
                        <span className="text-sm font-medium text-gray-700">Manage Documents</span>
                      </Link>
                      <Link
                        href="/dashboard/fleet/trucks/reports"
                        className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-200 transition-colors"
                      >
                        <BarChart2 size={20} className="text-blue-600 mb-2" />
                        <span className="text-sm font-medium text-gray-700">Vehicle Reports</span>
                      </Link>
                      <Link
                        href="/dashboard/fleet/drivers/reports"
                        className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-200 transition-colors"
                      >
                        <Users size={20} className="text-blue-600 mb-2" />
                        <span className="text-sm font-medium text-gray-700">Driver Reports</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}