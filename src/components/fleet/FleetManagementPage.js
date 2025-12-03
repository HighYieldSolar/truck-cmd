"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { AlertCircle } from "lucide-react";
import { getTruckStats } from "@/lib/services/truckService";
import { getDriverStats } from "@/lib/services/driverService";
import { getCurrentDateLocal } from "@/lib/utils/dateUtils";
import { OperationMessage } from "@/components/ui/OperationMessage";

// Import custom components
import FleetManagementHeader from "@/components/fleet/FleetManagementHeader";
import FleetStatsComponent from "@/components/fleet/FleetStatsComponent";
import DocumentAlertsComponent from "@/components/fleet/DocumentAlertsComponent";
import MaintenanceAlertsComponent from "@/components/fleet/MaintenanceAlertsComponent";
import QuickActionsComponent from "@/components/fleet/QuickActionsComponent";
import VehicleListComponent from "@/components/fleet/VehicleListComponent";
import DriverListComponent from "@/components/fleet/DriverListComponent";
import FleetReportsComponent from "@/components/fleet/FleetReportsComponent";

// Loading skeleton component
function LoadingSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Stats skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
          </div>
        ))}
      </div>

      {/* Content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 mb-6">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
            ))}
          </div>
        </div>
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FleetManagementPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
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
    let vehicleChannel = null;
    let driverChannel = null;

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

        // Load all data in parallel
        const [truckStatsData, driverStatsData] = await Promise.all([
          getTruckStats(user.id),
          getDriverStats(user.id)
        ]);

        setTruckStats(truckStatsData);
        setDriverStats(driverStatsData);

        // Load recent trucks
        const { data: trucks, error: trucksError } = await supabase
          .from('vehicles')
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
          .select('*, vehicles:truck_id(id, name)')
          .eq('user_id', user.id)
          .gte('due_date', getCurrentDateLocal())
          .order('due_date', { ascending: true })
          .limit(5);

        if (!maintenanceError) {
          setUpcomingMaintenance(maintenance || []);
        }

        // Load document reminders (expiring soon)
        const now = getCurrentDateLocal();
        const thirtyDaysLater = new Date();
        thirtyDaysLater.setDate(new Date().getDate() + 30);
        const thirtyDaysLaterString = thirtyDaysLater.toISOString().split('T')[0];

        const { data: documents, error: documentsError } = await supabase
          .from('drivers')
          .select('id, name, license_expiry, medical_card_expiry')
          .eq('user_id', user.id)
          .or(`license_expiry.gte.${now},medical_card_expiry.gte.${now}`)
          .or(`license_expiry.lte.${thirtyDaysLaterString},medical_card_expiry.lte.${thirtyDaysLaterString}`);

        if (!documentsError) {
          // Format document reminders
          const reminders = [];

          documents?.forEach(driver => {
            const licenseExpiry = new Date(driver.license_expiry);
            const medicalExpiry = new Date(driver.medical_card_expiry);
            const nowDate = new Date();

            const licenseExpiryDays = Math.floor((licenseExpiry - nowDate) / (1000 * 60 * 60 * 24));
            const medicalExpiryDays = Math.floor((medicalExpiry - nowDate) / (1000 * 60 * 60 * 24));

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

        // Set up real-time subscriptions
        vehicleChannel = supabase
          .channel('fleet-vehicles-changes')
          .on('postgres_changes',
            { event: '*', schema: 'public', table: 'vehicles', filter: `user_id=eq.${user.id}` },
            async () => {
              // Refresh truck stats and list
              const newStats = await getTruckStats(user.id);
              setTruckStats(newStats);

              const { data: trucks } = await supabase
                .from('vehicles')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(4);
              setRecentTrucks(trucks || []);
            }
          )
          .subscribe();

        driverChannel = supabase
          .channel('fleet-drivers-changes')
          .on('postgres_changes',
            { event: '*', schema: 'public', table: 'drivers', filter: `user_id=eq.${user.id}` },
            async () => {
              // Refresh driver stats and list
              const newStats = await getDriverStats(user.id);
              setDriverStats(newStats);

              const { data: drivers } = await supabase
                .from('drivers')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(4);
              setRecentDrivers(drivers || []);
            }
          )
          .subscribe();

      } catch (error) {
        setMessage({ type: 'error', text: "Failed to load fleet data. Please try again later." });
      } finally {
        setLoading(false);
      }
    }

    loadData();

    // Cleanup subscriptions
    return () => {
      if (vehicleChannel) supabase.removeChannel(vehicleChannel);
      if (driverChannel) supabase.removeChannel(driverChannel);
    };
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
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-100 dark:bg-gray-900">
          <div className="max-w-7xl mx-auto">
            {/* Header skeleton */}
            <div className="mb-8 bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-700 dark:to-blue-600 rounded-xl shadow-md p-6">
              <div className="animate-pulse">
                <div className="h-8 bg-white/20 rounded w-64 mb-2"></div>
                <div className="h-4 bg-white/20 rounded w-96"></div>
              </div>
            </div>
            <LoadingSkeleton />
          </div>
        </main>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activePage="fleet">
      <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-100 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <FleetManagementHeader />

          {/* Operation message */}
          <OperationMessage
            message={message}
            onDismiss={() => setMessage(null)}
          />

          {/* Statistics */}
          <FleetStatsComponent
            truckStats={truckStats}
            driverStats={driverStats}
          />

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left sidebar content */}
            <div className="lg:col-span-1">
              {/* Document Expiry Alerts card */}
              <DocumentAlertsComponent
                documentReminders={documentReminders}
                handleDriverSelect={handleDriverSelect}
              />

              {/* Upcoming Maintenance */}
              <MaintenanceAlertsComponent
                upcomingMaintenance={upcomingMaintenance}
              />

              {/* Quick Actions */}
              <QuickActionsComponent />
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {/* Vehicle overview */}
              <VehicleListComponent
                trucks={recentTrucks}
                handleTruckSelect={handleTruckSelect}
              />

              {/* Drivers overview */}
              <DriverListComponent
                drivers={recentDrivers}
                handleDriverSelect={handleDriverSelect}
              />
            </div>
          </div>

          {/* Fleet Reports Section */}
          <FleetReportsComponent />
        </div>
      </main>
    </DashboardLayout>
  );
}
