"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { AlertCircle } from "lucide-react";
import { getTruckStats } from "@/lib/services/truckService";
import { getDriverStats } from "@/lib/services/driverService";
import { getCurrentDateLocal } from "@/lib/utils/dateUtils";

// Import custom components
import FleetManagementHeader from "@/components/fleet/FleetManagementHeader";
import FleetStatsComponent from "@/components/fleet/FleetStatsComponent";
import DocumentAlertsComponent from "@/components/fleet/DocumentAlertsComponent";
import MaintenanceAlertsComponent from "@/components/fleet/MaintenanceAlertsComponent";
import QuickActionsComponent from "@/components/fleet/QuickActionsComponent";
import VehicleListComponent from "@/components/fleet/VehicleListComponent";
import DriverListComponent from "@/components/fleet/DriverListComponent";
import FleetReportsComponent from "@/components/fleet/FleetReportsComponent";

export default function FleetManagementPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
          .select('*, trucks(name)')
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
        setError("Failed to load fleet data. Please try again later.");
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
          <FleetManagementHeader />

          {/* Error message */}
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

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
      </div>
    </DashboardLayout>
  );
}