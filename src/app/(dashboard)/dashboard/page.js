"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import Image from "next/image";
import {
  fetchDashboardStats,
  fetchRecentActivity,
  fetchUpcomingDeliveries,
  fetchRecentInvoices
} from "@/lib/services/dashboardService";
import { getFuelStats } from "@/lib/services/fuelService";
import {
  LayoutDashboard, 
  Truck, 
  FileText, 
  Wallet, 
  Users, 
  Package, 
  CheckCircle, 
  Calculator, 
  Bell, 
  Plus, 
  Search, 
  ChevronDown,
  CreditCard,
  Clock,
  AlertCircle,
  BarChart2,
  DollarSign,
  Calendar,
  ChevronRight,
  Fuel,
  LogOut,
  TrendingUp,
  TrendingDown,
  MapPin
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";

// Stat Card Component
const StatCard = ({ title, value, change, positive, icon }) => {
  return (
    <div className="bg-white rounded-lg shadow px-5 py-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">{value}</p>
        </div>
        <div className="rounded-md p-2 bg-opacity-10 bg-gray-100">
          {icon}
        </div>
      </div>
      {change !== null && (
        <div className="mt-3">
          <p className={`text-sm flex items-center ${positive ? 'text-green-600' : 'text-red-600'}`}>
            {positive ? (
              <TrendingUp size={16} className="mr-1" />
            ) : (
              <TrendingDown size={16} className="mr-1" />
            )}
            <span>{change}% from last month</span>
          </p>
        </div>
      )}
    </div>
  );
};

// Info Card Component
const InfoCard = ({ title, value, icon, href }) => (
  <Link href={href} className="block bg-white rounded-lg shadow px-5 py-5 transition hover:shadow-md">
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        <div className="rounded-md p-2 bg-opacity-10 bg-gray-100 mr-4">
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-xl font-semibold text-gray-900 mt-1">{value}</p>
        </div>
      </div>
      <ChevronRight size={18} className="text-gray-400" />
    </div>
  </Link>
);

// Activity Item Component
const ActivityItem = ({ activity }) => (
  <div className="flex items-start py-3 border-b border-gray-100 last:border-0">
    <div className={`p-2 rounded-full mr-4 ${
      activity.status === 'success' ? 'bg-green-100 text-green-600' :
      activity.status === 'error' ? 'bg-red-100 text-red-600' :
      activity.status === 'warning' ? 'bg-yellow-100 text-yellow-600' :
      'bg-gray-100 text-gray-600'
    }`}>
      {activity.type === 'invoice' ? <FileText size={16} /> :
       activity.type === 'expense' ? <DollarSign size={16} /> :
       activity.type === 'load' ? <Truck size={16} /> :
       activity.type === 'fuel' ? <Fuel size={16} /> :
       <Clock size={16} />
      }
    </div>
    <div className="flex-1">
      <div className="flex justify-between items-start">
        <p className="text-sm font-medium text-gray-900">{activity.title}</p>
        <span className="text-xs text-gray-500">{activity.date}</span>
      </div>
      {activity.amount && (
        <p className="text-sm text-gray-600">{activity.amount}</p>
      )}
      {activity.client && (
        <p className="text-sm text-gray-600">Client: {activity.client}</p>
      )}
      {activity.location && (
        <p className="text-sm text-gray-600">Location: {activity.location}</p>
      )}
    </div>
  </div>
);

// Delivery Item Component
const DeliveryItem = ({ delivery }) => (
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

// Quick Link Component
const QuickLink = ({ icon, title, href }) => (
  <Link 
    href={href}
    className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-200 transition-colors"
  >
    <span className="p-2 rounded-full bg-white shadow-sm mb-2">
      {icon}
    </span>
    <span className="text-sm font-medium text-gray-700">{title}</span>
  </Link>
);

// Fuel Summary Component
const FuelSummary = ({ stats = {} }) => {
  const totalGallons = stats.totalGallons || 0;
  const totalAmount = stats.totalAmount || 0;
  const avgPricePerGallon = stats.avgPricePerGallon || 0;
  const uniqueStates = stats.uniqueStates || 0;

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <Fuel size={20} className="text-yellow-600 mr-2" />
          Fuel Tracker
        </h3>
        <Link href="/dashboard/fuel" className="text-sm text-blue-600 hover:text-blue-700">
          View All
        </Link>
      </div>
      <div className="p-5">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="text-sm text-gray-500 mb-1">Total Gallons</div>
            <div className="text-2xl font-semibold">{totalGallons.toFixed(1)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">Total Spent</div>
            <div className="text-2xl font-semibold">${totalAmount.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">Avg Price/Gal</div>
            <div className="text-2xl font-semibold">${avgPricePerGallon.toFixed(3)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">States</div>
            <div className="text-2xl font-semibold">{uniqueStates}</div>
          </div>
        </div>
        <Link
          href="/dashboard/fuel"
          className="block w-full text-center px-4 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition"
        >
          <Plus size={16} className="inline-block mr-2" />
          Add Fuel Purchase
        </Link>
      </div>
    </div>
  );
};

// Empty state component for when there's no data
const EmptyStateMessage = ({ message, icon, buttonText, buttonLink, onButtonClick }) => (
  <div className="text-center py-8">
    <div className="mx-auto mb-4 w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
      {icon}
    </div>
    <h3 className="text-lg font-medium text-gray-900">No data to display</h3>
    <p className="mt-2 text-gray-500">{message}</p>
    {buttonText && (buttonLink || onButtonClick) && (
      buttonLink ? (
        <Link 
          href={buttonLink}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          {buttonText}
        </Link>
      ) : (
        <button
          onClick={onButtonClick}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          {buttonText}
        </button>
      )
    )}
  </div>
);

// Recent Invoices Component
const RecentInvoices = ({ invoices = [] }) => (
  <div className="bg-white rounded-lg shadow overflow-hidden">
    <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center">
      <h3 className="text-lg font-medium text-gray-900">Recent Invoices</h3>
      <Link href="/dashboard/invoices" className="text-sm text-blue-600 hover:text-blue-700">
        View All
      </Link>
    </div>
    <div className="p-5">
      {invoices.length === 0 ? (
        <p className="text-gray-500 py-2 text-center">No recent invoices found.</p>
      ) : (
        <ul className="divide-y divide-gray-200">
          {invoices.map((invoice) => (
            <li key={invoice.id} className="py-3 flex justify-between">
              <div>
                <Link href={`/dashboard/invoices/${invoice.id}`} className="text-sm font-medium text-gray-900 hover:text-blue-600">
                  Invoice #{invoice.number}
                </Link>
                <p className="text-xs text-gray-500">{invoice.customer}</p>
              </div>
              <div className="text-sm font-medium text-green-600">${invoice.amount.toLocaleString()}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  </div>
);

// Main Dashboard Component
export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);
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
    upcomingDeliveries: 0
  });
  
  const [recentActivity, setRecentActivity] = useState([]);
  const [upcomingDeliveries, setUpcomingDeliveries] = useState([]);
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [fuelStats, setFuelStats] = useState({
    totalGallons: 0,
    totalAmount: 0,
    avgPricePerGallon: 0,
    uniqueStates: 0
  });

  useEffect(() => {
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
        
        // Set the user in state for reference
        setUser(user);
        setLoading(false);
        
        // Now load dashboard data
        await loadDashboardData(user.id);
      } catch (error) {
        console.error('Error checking authentication:', error);
        setError('Authentication error. Please try logging in again.');
        setLoading(false);
      }
    }
  
    // Define loadDashboardData inside the useEffect
    async function loadDashboardData(userId) {
      try {
        setDataLoading(true);
        
        // Fetch dashboard data in parallel
        const [dashboardStats, activity, deliveries, invoices, fuel] = await Promise.all([
          fetchDashboardStats(userId),
          fetchRecentActivity(userId),
          fetchUpcomingDeliveries(userId),
          fetchRecentInvoices(userId),
          getFuelStats(userId, 'month')
        ]);
        
        setStats(dashboardStats);
        setRecentActivity(activity);
        setUpcomingDeliveries(deliveries);
        setRecentInvoices(invoices);
        setFuelStats(fuel);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setDataLoading(false);
      }
    }
    
    checkUser();
  }, []); // Empty dependency array is fine now
  
  const loadDashboardData = useCallback(async (userId) => {
    try {
      setDataLoading(true);
      
      // Fetch dashboard data in parallel
      const [dashboardStats, activity, deliveries, invoices, fuel] = await Promise.all([
        fetchDashboardStats(userId),
        fetchRecentActivity(userId),
        fetchUpcomingDeliveries(userId),
        fetchRecentInvoices(userId),
        getFuelStats(userId, 'month')
      ]);
      
      setStats(dashboardStats);
      setRecentActivity(activity);
      setUpcomingDeliveries(deliveries);
      setRecentInvoices(invoices);
      setFuelStats(fuel);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Failed to load dashboard data. Please try again later.');
    } finally {
      setDataLoading(false);
    }
  }, []);

  // Format currency
  const formatCurrency = (value) => {
    return value.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Combine all recent activities including fuel entries
  const combinedActivities = [...recentActivity];
  
  // Add fuel entries to activity feed if available
  if (fuelStats.recentEntries) {
    fuelStats.recentEntries.forEach(entry => {
      combinedActivities.push({
        id: `fuel-${entry.id}`,
        type: 'fuel',
        title: `Fuel purchased at ${entry.location}`,
        amount: `$${parseFloat(entry.total_amount).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`,
        location: `${entry.state_name || entry.state}`,
        date: entry.date,
        status: 'neutral'
      });
    });
  }
  
  // Sort combined activities by date (newest first)
  combinedActivities.sort((a, b) => {
    // For this to work, all activities should have a date field in the same format
    return new Date(b.date) - new Date(a.date);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <DashboardLayout activePage="dashboard">
      <main className="flex-1 overflow-y-auto p-4 bg-gray-100">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Welcome{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name.split(' ')[0]}` : ''}</h1>
              <p className="text-gray-600">Here&apos;s what&apos;s happening with your trucking business today</p>
            </div>
            <div className="mt-4 md:mt-0 flex space-x-3">
              <Link
                href="/dashboard/dispatching/new"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
              >
                <Plus size={16} className="mr-2" />
                New Load
              </Link>
              <Link
                href="/dashboard/invoices/new"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none"
              >
                <FileText size={16} className="mr-2" />
                Create Invoice
              </Link>
            </div>
          </div>

          {/* Show error if present */}
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

{/* Stats Overview */}
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
  {dataLoading ? (
    // Skeleton loaders for stats cards
    Array(3).fill(0).map((_, index) => (
      <div key={index} className="bg-white rounded-lg shadow px-5 py-5 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-3 w-24 bg-gray-200 rounded"></div>
            <div className="h-6 w-32 bg-gray-200 rounded"></div>
          </div>
          <div className="rounded-md p-2 bg-gray-200 h-10 w-10"></div>
        </div>
      </div>
    ))
  ) : (
    <>
      <StatCard
        title="Total Earnings (MTD)"
        value={formatCurrency(stats.earnings)}
        change={stats.earningsChange}
        positive={stats.earningsPositive}
        icon={<DollarSign size={22} className="text-green-600" />}
      />
      <StatCard
        title="Total Expenses (MTD)"
        value={formatCurrency(stats.expenses)}
        change={stats.expensesChange}
        positive={stats.expensesPositive}
        icon={<Wallet size={22} className="text-red-600" />}
      />
      <StatCard
        title="Net Profit"
        value={formatCurrency(stats.profit)}
        change={stats.profitChange}
        positive={stats.profitPositive}
        icon={<BarChart2 size={22} className="text-blue-600" />}
      />
    </>
  )}
</div>

{/* Earnings Breakdown */}
{stats.factoredEarnings > 0 && (
  <div className="bg-white rounded-lg shadow-sm mb-6 p-5">
    <h3 className="text-lg font-medium text-gray-900 mb-4">Earnings Breakdown</h3>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
        <div>
          <p className="text-sm font-medium text-gray-500">Invoice Payments</p>
          <p className="text-xl font-semibold text-gray-900">{formatCurrency(stats.paidInvoices)}</p>
        </div>
        <FileText size={22} className="text-blue-600" />
      </div>
      <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
        <div>
          <p className="text-sm font-medium text-gray-500">Factored Loads</p>
          <p className="text-xl font-semibold text-gray-900">{formatCurrency(stats.factoredEarnings)}</p>
        </div>
        <Truck size={22} className="text-green-600" />
      </div>
    </div>
  </div>
)}
          
          {/* Secondary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {dataLoading ? (
              // Skeleton loaders for info cards
              Array(3).fill(0).map((_, index) => (
                <div key={index} className="bg-white rounded-lg shadow px-5 py-5 animate-pulse">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="rounded-md p-2 bg-gray-200 h-10 w-10 mr-4"></div>
                      <div className="space-y-2">
                        <div className="h-3 w-20 bg-gray-200 rounded"></div>
                        <div className="h-6 w-16 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                    <div className="h-4 w-4 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))
            ) : (
              <>
                <InfoCard
                  title="Active Loads"
                  value={stats.activeLoads}
                  icon={<Truck size={20} className="text-blue-600" />}
                  href="/dashboard/dispatching"
                />
                <InfoCard
                  title="Pending Invoices"
                  value={stats.pendingInvoices}
                  icon={<FileText size={20} className="text-yellow-600" />}
                  href="/dashboard/invoices"
                />
                <InfoCard
                  title="Upcoming Deliveries"
                  value={stats.upcomingDeliveries}
                  icon={<Calendar size={20} className="text-purple-600" />}
                  href="/dashboard/dispatching"
                />
              </>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Activity Feed */}
            <div className="lg:col-span-2 space-y-6">
              {/* Recent Activity */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
                  <div className="text-sm text-gray-500">Last 7 days</div>
                </div>
                <div className="p-6">
                  {dataLoading ? (
                    // Skeleton loader for activity
                    Array(3).fill(0).map((_, index) => (
                      <div key={index} className="flex items-start py-3 border-b border-gray-100 last:border-0 animate-pulse">
                        <div className="rounded-full h-10 w-10 bg-gray-200 mr-4"></div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div className="h-4 w-40 bg-gray-200 rounded"></div>
                            <div className="h-3 w-16 bg-gray-200 rounded"></div>
                          </div>
                          <div className="h-3 w-32 bg-gray-200 rounded mt-2"></div>
                        </div>
                      </div>
                    ))
                  ) : combinedActivities.length === 0 ? (
                    <EmptyStateMessage 
                      message="No recent activity found. Start creating loads or invoices to see your activity here."
                      icon={<Clock size={24} className="text-gray-400" />}
                    />
                  ) : (
                    combinedActivities.slice(0, 5).map((activity, index) => (
                      <ActivityItem key={activity.id || index} activity={activity} />
                    ))
                  )}
                </div>
              </div>
              
              {/* Recent Invoices */}
              <RecentInvoices invoices={recentInvoices} />
            </div>
            
            {/* Right Sidebar - Fuel Summary & Upcoming Deliveries */}
            <div className="space-y-6">
              {/* Fuel Tracker Summary */}
              <FuelSummary stats={fuelStats} />
              
              {/* Upcoming Deliveries */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Upcoming Deliveries</h3>
                  <Link href="/dashboard/dispatching" className="text-sm text-blue-600 hover:text-blue-700">
                    View All
                  </Link>
                </div>
                <div className="p-6">
                  {dataLoading ? (
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
                  ) : upcomingDeliveries.length === 0 ? (
                    <EmptyStateMessage 
                      message="No upcoming deliveries scheduled."
                      icon={<Truck size={24} className="text-gray-400" />}
                      buttonText="Schedule Delivery"
                      buttonLink="/dashboard/dispatching/new"
                    />
                  ) : (
                    upcomingDeliveries.map((delivery, index) => (
                      <DeliveryItem key={delivery.id || index} delivery={delivery} />
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
            </div>
            <div className="p-6 grid grid-cols-2 md:grid-cols-5 gap-4">
              <QuickLink 
                icon={<FileText size={20} className="text-blue-600" />}
                title="Create Invoice"
                href="/dashboard/invoices/new"
              />
              <QuickLink 
                icon={<Truck size={20} className="text-green-600" />}
                title="Add Load"
                href="/dashboard/dispatching/new"
              />
              <QuickLink 
                icon={<Wallet size={20} className="text-red-600" />}
                title="Record Expense"
                href="/dashboard/expenses/new"
              />
              <QuickLink 
                icon={<Fuel size={20} className="text-yellow-600" />}
                title="Add Fuel"
                href="/dashboard/fuel"
              />
              <QuickLink 
                icon={<Calculator size={20} className="text-purple-600" />}
                title="IFTA Calculator"
                href="/dashboard/ifta"
              />
            </div>
          </div>
        </div>
      </main>
    </DashboardLayout>
  );
}