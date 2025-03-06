"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import Image from "next/image";
import {
  fetchDashboardStats,
  fetchRecentActivity,
  fetchUpcomingDeliveries,
  fetchRecentInvoices
} from "@/lib/services/dashboardService";
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
  LogOut
} from "lucide-react";

// Sidebar component
const Sidebar = ({ activePage = "dashboard" }) => {
  const menuItems = [
    { name: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard size={18} /> },
    { name: 'Dispatching', href: '/dashboard/dispatching', icon: <Truck size={18} /> },
    { name: 'Invoices', href: '/dashboard/invoices', icon: <FileText size={18} /> },
    { name: 'Expenses', href: '/dashboard/expenses', icon: <Wallet size={18} /> },
    { name: 'Customers', href: '/dashboard/customers', icon: <Users size={18} /> },
    { name: 'Fleet', href: '/dashboard/fleet', icon: <Package size={18} /> },
    { name: 'Compliance', href: '/dashboard/compliance', icon: <CheckCircle size={18} /> },
    { name: 'IFTA Calculator', href: '/dashboard/ifta', icon: <Calculator size={18} /> },
    { name: 'Fuel Tracker', href: '/dashboard/fuel', icon: <Fuel size={18} /> },
  ];

  return (
    <div className="hidden md:flex w-64 flex-col bg-white shadow-lg">
      <div className="p-4 border-b">
        <Image 
          src="/images/tc-name-tp-bg.png" 
          alt="Truck Command Logo"
          width={150}
          height={50}
          className="h-10"
        />
      </div>
      
      <nav className="flex-1 px-2 py-4 overflow-y-auto">
        <div className="space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                activePage === item.name.toLowerCase() 
                  ? 'bg-blue-50 text-blue-700' 
                  : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
              }`}
            >
              <span className="mr-3">{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          ))}
        </div>
        
        <div className="pt-4 mt-4 border-t">
          <Link 
            href="/dashboard/settings" 
            className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md hover:text-blue-600 transition-colors"
          >
            <span className="mr-3">⚙️</span>
            <span>Settings</span>
          </Link>
          <button 
            onClick={async () => {
              try {
                await supabase.auth.signOut();
                window.location.href = '/login';
              } catch (error) {
                console.error('Error logging out:', error);
              }
            }}
            className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md hover:text-blue-600 transition-colors"
          >
            <LogOut size={18} className="mr-3" />
            <span>Logout</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

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
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            ) : (
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
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

// Empty state component for when there's no data
const EmptyStateMessage = ({ message, icon, buttonText, buttonLink }) => (
  <div className="text-center py-8">
    <div className="mx-auto mb-4 w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
      {icon}
    </div>
    <h3 className="text-lg font-medium text-gray-900">No data to display</h3>
    <p className="mt-2 text-gray-500">{message}</p>
    {buttonText && buttonLink && (
      <Link 
        href={buttonLink}
        className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
      >
        {buttonText}
      </Link>
    )}
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
    
    checkUser();
  }, []);
  
  async function loadDashboardData(userId) {
    setDataLoading(true);
    try {
      // Fetch dashboard data in parallel
      const [dashboardStats, activity, deliveries] = await Promise.all([
        fetchDashboardStats(userId),
        fetchRecentActivity(userId),
        fetchUpcomingDeliveries(userId),
      ]);
      
      setStats(dashboardStats);
      setRecentActivity(activity);
      setUpcomingDeliveries(deliveries);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Failed to load dashboard data. Please try again later.');
    } finally {
      setDataLoading(false);
    }
  }
  
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = '/login';
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Helper function to format currency
  const formatCurrency = (value) => {
    return value.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar activePage="dashboard" />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between p-4 bg-white shadow-sm">
          <button className="md:hidden p-2 text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          <div className="relative flex-1 max-w-md mx-4">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Search..."
            />
          </div>
          
          <div className="flex items-center">
            <button className="p-2 text-gray-600 hover:text-blue-600 mx-2 relative">
              <Bell size={20} />
              {/* Notification badge would be conditionally shown here */}
            </button>
            
            <div className="h-8 w-px bg-gray-200 mx-2"></div>
            
            <div className="relative">
              <button 
                onClick={handleLogout}
                className="flex items-center text-sm font-medium text-gray-700 hover:text-blue-600"
              >
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold mr-2">
                  {user?.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className="hidden sm:block">{user?.user_metadata?.full_name?.split(' ')[0] || 'User'}</span>
                <ChevronDown size={16} className="ml-1" />
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
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

            {/* Split View: Recent Activity and Upcoming Deliveries */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {/* Recent Activity Feed */}
              <div className="lg:col-span-2 bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
                  <Link href="#" className="text-sm text-blue-600 hover:text-blue-700">
                    View All
                  </Link>
                </div>
                <div className="p-6">
                  {dataLoading ? (
                    // Skeleton loader for activity feed
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
                  ) : recentActivity.length === 0 ? (
                    <EmptyStateMessage 
                      message="Create your first load or invoice to see activity here."
                      icon={<Clock size={24} className="text-gray-400" />}
                    />
                  ) : (
                    recentActivity.map((activity, index) => (
                      <ActivityItem key={activity.id || index} activity={activity} />
                    ))
                  )}
                </div>
              </div>

              {/* Upcoming Deliveries */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <h2 className="text-lg font-medium text-gray-900">Upcoming Deliveries</h2>
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
                          <div className="h-4 w-20 bg-gray-200 rounded mt-2"></div>
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

            {/* Quick Links */}
            <div className="bg-white rounded-lg shadow mb-6">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
              </div>
              <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
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
                  icon={<Calculator size={20} className="text-purple-600" />}
                  title="IFTA Calculation"
                  href="/dashboard/ifta"
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}