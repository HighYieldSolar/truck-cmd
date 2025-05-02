// src/app/(dashboard)/dashboard/page.js
"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DatabaseSyncStatus from "@/components/common/DatabaseSyncStatus";
import useDatabaseSync from "@/hooks/useDatabaseSync";
import { RefreshCw, Truck, Plus, Clock, Calendar as CalendarIcon } from "lucide-react";

// Import dashboard components
import DashboardHeader from "@/components/dashboard/(dashboard)/DashboardHeader";
import DashboardStats from "@/components/dashboard/(dashboard)/DashboardStats";
import EarningsBreakdown from "@/components/dashboard/(dashboard)/EarningsBreakdown";
import BusinessOverview from "@/components/dashboard/(dashboard)/BusinessOverview";
import ActivityPanel from "@/components/dashboard/(dashboard)/ActivityPanel";
import FuelSummary from "@/components/dashboard/(dashboard)/FuelSummary";
import QuickActions from "@/components/dashboard/(dashboard)/QuickActions";

/**
 * Main Dashboard Page
 * A modular implementation with separate components for better maintainability
 */
export default function Dashboard() {
  // User and authentication state
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Dashboard data state
  const [stats, setStats] = useState({
    earnings: 0,
    earningsChange: null,
    earningsPositive: true,
    expenses: 0,
    expensesChange: null,
    expensesPositive: false,
    profit: 0,
    profitChange: null,
    profitPositive: true,
    activeLoads: 0,
    pendingInvoices: 0,
    upcomingDeliveries: 0,
    paidInvoices: 0,
    factoredEarnings: 0
  });
  
  // Activity data
  const [recentActivity, setRecentActivity] = useState([]);
  const [upcomingDeliveries, setUpcomingDeliveries] = useState([]);
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [fuelStats, setFuelStats] = useState({
    totalGallons: 0,
    totalAmount: 0,
    avgPricePerGallon: 0,
    uniqueStates: 0
  });
  
  // UI state
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState('month');
  
  // Main function to load all dashboard data
  const loadDashboardData = useCallback(async (userId) => {
    if (!userId) return false;
    
    try {
      setDataLoading(true);
      
      // Dynamic imports to load services only when needed
      const { 
        fetchDashboardStats, 
        fetchRecentActivity, 
        fetchUpcomingDeliveries, 
        fetchRecentInvoices 
      } = await import("@/lib/services/dashboardService");
      
      const { getFuelStats } = await import("@/lib/services/fuelService");
      
      // Fetch all dashboard data in parallel for efficiency
      const [dashboardStats, activity, deliveries, invoices, fuel] = await Promise.all([
        fetchDashboardStats(userId, dateRange),
        fetchRecentActivity(userId),
        fetchUpcomingDeliveries(userId),
        fetchRecentInvoices(userId),
        getFuelStats(userId, dateRange)
      ]);
      
      // Update all state at once
      setStats(dashboardStats || {});
      setRecentActivity(activity || []);
      setUpcomingDeliveries(deliveries || []);
      setRecentInvoices(invoices || []);
      setFuelStats(fuel || {});
      
      // Clear any previous errors
      setError(null);
      
      return true;
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data. Please try again later.');
      return false;
    } finally {
      setDataLoading(false);
    }
  }, [dateRange]);

  // Database sync hook for connection management and auto-refresh
  const { 
    lastRefresh,
    isRefreshing,
    isConnected,
    error: syncError,
    autoRefreshEnabled,
    refreshData,
    toggleAutoRefresh,
    setAutoRefreshEnabled
  } = useDatabaseSync({
    autoRefresh: true, 
    refreshInterval: 5 * 60 * 1000, // 5 minutes
    onRefresh: async () => {
      if (user) {
        await loadDashboardData(user.id);
      }
    },
    onConnectionChange: (connected) => {
      if (connected) {
        setError(null); // Clear any existing error
      } else {
        setError('Database connection lost. Some data may not be up to date.');
      }
    }
  });

  // Handle date range change - will trigger data reload
  const handleDateRangeChange = (range) => {
    if (range === dateRange) return; // Avoid unnecessary refreshes
    setDateRange(range);
  };

  // Effect for date range change
  useEffect(() => {
    if (user) {
      loadDashboardData(user.id);
    }
  }, [dateRange, loadDashboardData, user]);

  // Initial authentication and data loading
  useEffect(() => {
    let isMounted = true;
    
    async function checkUser() {
      try {
        setLoading(true);
        
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          throw userError;
        }
        
        if (!user) {
          // Redirect to login if not authenticated
          window.location.href = '/login';
          return;
        }
        
        // Set the user in state if component is still mounted
        if (isMounted) {
          setUser(user);
          setLoading(false);
          
          // Initial data load - but prevent this from being called on every render
          await loadDashboardData(user.id);
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        if (isMounted) {
          setError('Authentication error. Please try logging in again.');
          setLoading(false);
        }
      }
    }
    
    checkUser();
    
    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, [loadDashboardData]);

  // Set up realtime subscriptions for data updates - only once when user is set
  useEffect(() => {
    if (!user) return;
    
    // Setup channels for database changes
    const channels = [];
    
    // Earnings changes channel
    const earningsChannel = supabase
      .channel(`earnings-changes-${user.id}`)
      .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'earnings', filter: `user_id=eq.${user.id}` },
          payload => {
            console.log("Earnings change detected:", payload);
            loadDashboardData(user.id);
          })
      .subscribe();
    channels.push(earningsChannel);
    
    // Load status changes channel
    const loadChannel = supabase
      .channel(`loads-${user.id}`)
      .on('postgres_changes',
          { event: '*', schema: 'public', table: 'loads', filter: `user_id=eq.${user.id}` },
          payload => {
            console.log("Load change detected:", payload);
            // Refresh if it's a completion or factored change
            if (payload.new?.status === 'Completed' || 
                payload.new?.factored !== payload.old?.factored) {
              loadDashboardData(user.id);
            }
          })
      .subscribe();
    channels.push(loadChannel);
    
    // Expenses changes channel - throttle to prevent excessive updates
    let lastExpenseUpdate = 0;
    const expensesChannel = supabase
      .channel(`expenses-${user.id}`)
      .on('postgres_changes',
          { event: '*', schema: 'public', table: 'expenses', filter: `user_id=eq.${user.id}` },
          payload => {
            console.log("Expense change detected:", payload);
            // Throttle to max once per 10 seconds
            const now = Date.now();
            if (now - lastExpenseUpdate > 10000) {
              lastExpenseUpdate = now;
              loadDashboardData(user.id);
            }
          })
      .subscribe();
    channels.push(expensesChannel);
    
    // Invoices changes channel - also throttled
    let lastInvoiceUpdate = 0;
    const invoicesChannel = supabase
      .channel(`invoices-${user.id}`)
      .on('postgres_changes',
          { event: '*', schema: 'public', table: 'invoices', filter: `user_id=eq.${user.id}` },
          payload => {
            console.log("Invoice change detected:", payload);
            // Throttle to max once per 10 seconds
            const now = Date.now();
            if (now - lastInvoiceUpdate > 10000) {
              lastInvoiceUpdate = now;
              loadDashboardData(user.id);
            }
          })
      .subscribe();
    channels.push(invoicesChannel);
    
    // Cleanup all channels on unmount
    return () => {
      channels.forEach(channel => {
        supabase.removeChannel(channel);
      });
    };
  }, [user, loadDashboardData]);
  
  // Manual refresh handler
  const handleRefresh = () => {
    if (user && !dataLoading && !isRefreshing) {
      refreshData();
    }
  };

  // Display loading state while checking auth
  if (loading && !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <DashboardLayout activePage="dashboard">
      <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-100">
        <div className="max-w-7xl mx-auto">
          {/* Header with gradient background */}
          <DashboardHeader 
            user={user}
            onRefresh={handleRefresh}
            isLoading={dataLoading || isRefreshing}
          />

          {/* Database Connection Status */}
          <DatabaseSyncStatus
            isConnected={isConnected}
            isRefreshing={dataLoading || isRefreshing}
            lastRefresh={lastRefresh}
            autoRefreshEnabled={autoRefreshEnabled}
            onToggleAutoRefresh={toggleAutoRefresh}
            onManualRefresh={handleRefresh}
            error={syncError || error}
            className="mb-6"
          />

          {/* Date Range Selector */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="text-sm font-medium text-gray-700">Date Range:</div>
              <div className="flex bg-white rounded-lg shadow-sm border border-gray-200 divide-x">
                <button 
                  onClick={() => handleDateRangeChange('month')}
                  className={`px-3 py-1.5 text-sm ${dateRange === 'month' ? 
                    'bg-blue-50 text-blue-600 font-medium' : 
                    'text-gray-600 hover:bg-gray-50'}`}
                >
                  This Month
                </button>
                <button 
                  onClick={() => handleDateRangeChange('quarter')}
                  className={`px-3 py-1.5 text-sm ${dateRange === 'quarter' ? 
                    'bg-blue-50 text-blue-600 font-medium' : 
                    'text-gray-600 hover:bg-gray-50'}`}
                >
                  This Quarter
                </button>
                <button 
                  onClick={() => handleDateRangeChange('year')}
                  className={`px-3 py-1.5 text-sm ${dateRange === 'year' ? 
                    'bg-blue-50 text-blue-600 font-medium' : 
                    'text-gray-600 hover:bg-gray-50'}`}
                >
                  This Year
                </button>
              </div>
            </div>
          </div>

          {/* Stats Overview */}
          <DashboardStats 
            stats={stats} 
            isLoading={dataLoading} 
          />

          {/* Earnings Breakdown */}
          {(stats.paidInvoices > 0 || stats.factoredEarnings > 0) && (
            <EarningsBreakdown stats={stats} />
          )}

          {/* Secondary Stats */}
          <BusinessOverview 
            stats={stats} 
            isLoading={dataLoading} 
          />

          {/* Main Content Grid with Activity and Sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Activity Feed and Recent Invoices */}
            <ActivityPanel 
              recentActivity={recentActivity}
              recentInvoices={recentInvoices}
              isLoading={dataLoading}
            />
            
            {/* Right Sidebar with Fuel Stats and Deliveries */}
            <div className="space-y-6">
              <FuelSummary stats={fuelStats} />
              <UpcomingDeliveries 
                deliveries={upcomingDeliveries}
                isLoading={dataLoading}
              />
            </div>
          </div>
          
          {/* Quick Actions Grid */}
          <QuickActions />
          
          {/* Admin Tools (conditional) */}
          {(stats.factoredEarnings > 0 || error) && (
            <AdminTools />
          )}
        </div>
      </main>
    </DashboardLayout>
  );
}

/**
 * Upcoming Deliveries Component
 * Shows the upcoming deliveries in a card
 */
function UpcomingDeliveries({ deliveries = [], isLoading = false }) {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
      <div className="bg-purple-500 px-5 py-4 text-white flex justify-between items-center">
        <h3 className="font-semibold flex items-center">
          <CalendarIcon size={18} className="mr-2" />
          Upcoming Deliveries
        </h3>
        <Link href="/dashboard/dispatching" className="text-sm text-white hover:text-purple-100">
          View All
        </Link>
      </div>
      <div className="p-6">
        {isLoading ? (
          // Skeleton loader for upcoming deliveries
          Array(2).fill(0).map((_, index) => (
            <div key={index} className="flex items-start py-3 border-b border-gray-100 last:border-0 animate-pulse">
              <div className="rounded-full h-10 w-10 bg-gray-200 mr-4"></div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div className="h-4 w-32 bg-gray-200 rounded"></div>
                  <div className="h-3 w-16 bg-gray-200 rounded"></div>
                </div>
                <div className="h-3 w-40 bg-gray-200 rounded mt-2"></div>
              </div>
            </div>
          ))
        ) : deliveries.length === 0 ? (
          <div className="text-center py-8">
            <div className="mx-auto mb-4 w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <Truck size={24} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No deliveries scheduled</h3>
            <p className="mt-2 text-gray-500">Schedule your first delivery to see it here</p>
            <Link 
              href="/dashboard/dispatching/new"
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus size={16} className="mr-2" />
              Schedule Delivery
            </Link>
          </div>
        ) : (
          deliveries.map((delivery, index) => (
            <DeliveryItem key={delivery.id || index} delivery={delivery} />
          ))
        )}
      </div>
    </div>
  );
}

/**
 * Delivery Item Component
 * Individual delivery in the upcoming deliveries list
 */
function DeliveryItem({ delivery }) {
  return (
    <div className="flex items-start py-3 border-b border-gray-100 last:border-0">
      <div className="p-2 rounded-full bg-blue-100 text-blue-600 mr-4">
        <Truck size={16} />
      </div>
      <div className="flex-1">
        <div className="flex justify-between">
          <p className="text-sm font-medium text-gray-900">{delivery.client}</p>
          <span className="text-xs text-gray-500">{delivery.date}</span>
        </div>
        <p className="text-sm text-gray-600">Destination: {delivery.destination}</p>
        <div className="mt-1">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            delivery.status === 'In Transit' ? 'bg-green-100 text-green-800' :
            delivery.status === 'Assigned' ? 'bg-blue-100 text-blue-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            {delivery.status}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Admin Tools Component
 * Shows admin links when relevant (factoring, errors)
 */
function AdminTools() {
  return (
    <div className="text-center mb-6">
      <Link 
        href="/dashboard/admin/fix-earnings"
        className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
      >
        <RefreshCw size={14} className="mr-1" />
        Fix Earnings Records
      </Link>
      <p className="text-xs text-gray-500 mt-1">
        Use this utility to fix any issues with earnings records from factored loads
      </p>
    </div>
  );
}