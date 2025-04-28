// src/components/layout/DashboardLayout.js
"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { 
  LayoutDashboard, Truck, FileText, Wallet, Users, Package, CheckCircle, 
  Calculator, Fuel, Settings, LogOut, Bell, Search, Menu, X, 
  User, MapPin, Home
} from "lucide-react";
import TrialBanner from "@/components/subscriptions/TrialBanner";
import { useSubscription } from "@/context/SubscriptionContext";
import UserDropdown from "@/components/UserDropdown";

export default function DashboardLayout({activePage = "dashboard", children}) {
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [bannerVisible, setBannerVisible] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const notificationsRef = useRef(null);
  const searchRef = useRef(null);
  const mobileMenuRef = useRef(null);
  
  // Get subscription context
  const { 
    user, 
    subscription, 
    loading: subscriptionLoading, 
    getDaysLeftInTrial,
    isTrialActive,
    isSubscriptionActive
  } = useSubscription();

  // Determine subscription status
  const subscriptionStatus = subscription?.status === 'active' && isSubscriptionActive()
    ? 'active'
    : subscription?.status === 'trial' && isTrialActive()
      ? 'trial'
      : 'expired';

  const daysLeft = getDaysLeftInTrial ? getDaysLeftInTrial() : 0;
  
  // Check if user is subscribed (either active subscription or valid trial)
  const isSubscribed = () => {
    return subscriptionStatus === 'active' || subscriptionStatus === 'trial';
  };

  // Get current active page from pathname
  const getActivePage = () => {
    if (!pathname) return "dashboard";
    
    const path = pathname.split('/');
    // If path is like /dashboard/invoices, return "invoices"
    if (path.length > 2) {
      return path[2];
    }
    // If path is just /dashboard, return "dashboard"
    return "dashboard";
  };

  const currentActivePage = activePage || getActivePage();

  // Check if user is authenticated
  useEffect(() => {
    async function checkUser() {
      try {
        setLoading(true);
        
        // Get current user
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error || !user) {
          router.push('/login');
          return;
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    }
    
    checkUser();
  }, [router]);

  // Handle logout
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
    setNotificationsOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close notifications dropdown when clicking outside
      if (notificationsOpen && notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
      
      // Close search dropdown when clicking outside
      if (searchOpen && searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchOpen(false);
      }
      
      // Close mobile menu when clicking outside
      if (mobileMenuOpen && mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        const menuButton = document.querySelector('.mobile-menu-button');
        if (menuButton && !menuButton.contains(event.target)) {
          setMobileMenuOpen(false);
        }
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [notificationsOpen, searchOpen, mobileMenuOpen]);

  // Menu items definition
  const menuItems = [
    { 
      name: 'Dashboard', 
      href: '/dashboard', 
      icon: <LayoutDashboard size={20} />,
      active: currentActivePage === 'dashboard'
    },
    { 
      name: 'Load Management', 
      href: '/dashboard/dispatching', 
      icon: <Truck size={20} />,
      active: currentActivePage === 'dispatching',
      protected: true
    },
    {
      name: 'State Mileage', 
      href: '/dashboard/mileage', 
      icon: <MapPin size={20} />,
      active: currentActivePage === 'mileage',
      protected: true
    },
    { 
      name: 'Invoices', 
      href: '/dashboard/invoices', 
      icon: <FileText size={20} />,
      active: currentActivePage === 'invoices',
      protected: true
    },
    { 
      name: 'Expenses', 
      href: '/dashboard/expenses', 
      icon: <Wallet size={20} />,
      active: currentActivePage === 'expenses',
      protected: true
    },
    { 
      name: 'Customers', 
      href: '/dashboard/customers', 
      icon: <Users size={20} />,
      active: currentActivePage === 'customers',
      protected: true
    },
    { 
      name: 'Fleet', 
      href: '/dashboard/fleet', 
      icon: <Package size={20} />,
      active: currentActivePage === 'fleet',
      protected: true
    },
    { 
      name: 'Compliance', 
      href: '/dashboard/compliance', 
      icon: <CheckCircle size={20} />,
      active: currentActivePage === 'compliance',
      protected: true
    },
    { 
      name: 'IFTA Calculator', 
      href: '/dashboard/ifta', 
      icon: <Calculator size={20} />,
      active: currentActivePage === 'ifta',
      protected: true
    },
    { 
      name: 'Fuel Tracker', 
      href: '/dashboard/fuel', 
      icon: <Fuel size={20} />,
      active: currentActivePage === 'fuel',
      protected: true
    },
  ];

  // System menu items - only Settings now
  const systemItems = [
    { 
      name: 'Settings', 
      href: '/dashboard/settings', 
      icon: <Settings size={20} />,
      active: currentActivePage === 'settings'
    }
  ];

  // Mock notifications data
  const notifications = [
    {
      id: 1,
      title: 'New invoice payment received',
      description: 'Invoice #1234 has been paid',
      time: '2 hours ago',
      read: false,
    },
    {
      id: 2,
      title: 'Upcoming delivery reminder',
      description: 'You have a delivery scheduled tomorrow',
      time: '1 day ago',
      read: true,
    },
    {
      id: 3,
      title: 'IFTA deadline approaching',
      description: 'Q2 filing deadline is in 5 days',
      time: '2 days ago',
      read: true,
    },
  ];

  if (loading || subscriptionLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (    
    <div className="flex flex-col min-h-screen bg-gray-50">      
      {/* Trial Banner */}      
      <TrialBanner />
      
      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <div className="hidden lg:flex lg:flex-col lg:w-64 bg-white shadow-md fixed inset-y-0 z-20 transition-all duration-300">
          <div className="flex items-center justify-center h-16 px-4 border-b border-gray-100">
            <Link href="/dashboard" className="flex items-center">
              <Image
                src="/images/tc-name-tp-bg.png"
                alt="Truck Command Logo"
                width={150}
                height={40}
                className="h-10"
              />
            </Link>
          </div>

          <div className="flex-1 flex flex-col overflow-y-auto py-4">
            {/* Main Navigation */}
            <div className="px-3">
              <h2 className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Main
              </h2>
              <nav className="space-y-1">
                {menuItems.map((item) => {
                  // Determine if this menu item should be disabled
                  const isDisabled = item.protected && !isSubscribed();
                  
                  return (
                    <Link
                      key={item.name}
                      href={isDisabled ? "/dashboard/billing" : item.href}
                      className={`group flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-all 
                        ${item.active
                          ? "bg-blue-50 text-[#007BFF]"
                          : "text-gray-700 hover:bg-gray-100 hover:text-[#007BFF]"
                        } 
                        ${isDisabled ? "opacity-50" : ""}`}
                    >
                      <div
                        className={`mr-3 flex-shrink-0 ${item.active ? "text-[#007BFF]" : "text-gray-500 group-hover:text-[#007BFF]"}`}
                      >
                        {item.icon}
                      </div>
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
            
            {/* System Navigation */}
            <div className="px-3 mt-6">
              <h2 className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                System
              </h2>
              <nav className="space-y-1">
                {systemItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
                      item.active
                        ? "bg-blue-50 text-[#007BFF]"
                        : "text-gray-700 hover:bg-gray-100 hover:text-[#007BFF]"
                    }`}
                  >
                    <div className={`mr-3 flex-shrink-0 ${
                      item.active ? "text-[#007BFF]" : "text-gray-500 group-hover:text-[#007BFF]"
                    }`}>
                      {item.icon}
                    </div>
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>
            
            {/* Trial Status */}
            {['trial', 'expired'].includes(subscriptionStatus) && (
              <div className="mt-6 mx-3 rounded-lg overflow-hidden border border-blue-100 bg-blue-50">
                <div className="px-4 py-3 bg-blue-500 text-white">
                  <div className="font-medium">Truck Command Free Trial</div>
                </div>
                <div className="p-4">
                  {subscriptionStatus === 'expired' ? (
                    <div className="text-sm text-gray-700">
                      <p className="mb-2">Your trial has expired. Upgrade now to continue accessing all features.</p>
                      <Link 
                        href="/dashboard/billing" 
                        className="flex items-center text-sm font-medium text-[#007BFF] hover:text-blue-500"
                      >
                        Upgrade now 
                      </Link>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-700">
                      <p className="mb-2">You have <span className="font-bold">{daysLeft} days</span> left in your trial</p>
                      <div className="w-full bg-blue-100 rounded-full h-2 mb-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ width: `${Math.max(5, (daysLeft / 7) * 100)}%` }}
                        ></div>
                      </div>
                      <Link 
                        href="/dashboard/billing" 
                        className="flex items-center text-sm font-medium text-[#007BFF] hover:text-blue-500"
                      >
                        View plans 
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 bg-gray-700/60 z-40 lg:hidden" onClick={() => setMobileMenuOpen(false)}></div>
        )}

        {/* Mobile Sidebar */}
        <div
          ref={mobileMenuRef}
          className={`fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:hidden overflow-y-auto ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <Link href="/dashboard" className="flex items-center" onClick={() => setMobileMenuOpen(false)}>
              <Image
                src="/images/tc-name-tp-bg.png"
                alt="Truck Command Logo"
                width={120}
                height={30}
                className="h-8"
              />
            </Link>
            <button
              className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>
          
          {/* User Profile Section (Mobile) */}
          {user && (
            <div className="p-4 border-b border-gray-200 flex items-center">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-lg mr-3">
                {user.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-800 truncate">
                  {user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}
                </div>
                <div className="text-xs text-gray-500 truncate">{user.email}</div>
              </div>
            </div>
          )}
          
          <div className="p-2">
            {/* Mobile Search Bar */}
            <div className="px-2 py-3">
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={18} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            {/* Main Navigation */}
            <div className="mt-1 pb-2">
              <h2 className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Main
              </h2>
              {menuItems.map((item) => {
                // Determine if this menu item should be disabled
                const isDisabled = item.protected && !isSubscribed();
                
                return (
                  <Link
                    key={item.name}
                    href={isDisabled ? "/dashboard/billing" : item.href}
                    className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all my-0.5 
                      ${item.active
                        ? "bg-blue-50 text-[#007BFF]"
                        : "text-gray-700 hover:bg-gray-100 hover:text-[#007BFF]"
                      } 
                      ${isDisabled ? "opacity-50" : ""}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div className={`mr-3 flex-shrink-0 ${
                      item.active ? "text-[#007BFF]" : "text-gray-500"
                    }`}>
                      {item.icon}
                    </div>
                    {item.name}
                  </Link>
                );
              })}
            </div>
            
            {/* System Navigation */}
            <div className="mt-4 pt-3 border-t border-gray-200">
              <h2 className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                System
              </h2>
              {systemItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all my-0.5 ${
                    item.active
                      ? "bg-blue-50 text-[#007BFF]"
                      : "text-gray-700 hover:bg-gray-100 hover:text-[#007BFF]"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className={`mr-3 flex-shrink-0 ${item.active ? "text-[#007BFF]" : "text-gray-500"}`}>
                    {item.icon}
                  </div>
                  {item.name}
                </Link>
              ))}
              
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-4 py-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 hover:text-red-600 transition-all my-0.5"
              >
                <LogOut size={20} className="mr-3 text-gray-500" />
                Logout
              </button>
            </div>
            
            {/* Trial Status (Mobile) */}
            {subscriptionStatus !== 'active' && (
              <div className="mt-6 mx-2 rounded-lg overflow-hidden border border-blue-100 bg-blue-50">
                <div className="px-4 py-3 bg-blue-500 text-white">
                  <div className="font-medium">Free Trial Status</div>
                </div>
                <div className="p-4">
                  {subscriptionStatus === 'expired' ? (
                    <div className="text-sm text-gray-700">
                      <p className="mb-2">Your trial has expired. Subscribe now to continue using all features.</p>
                      <Link 
                        href="/dashboard/billing" 
                        className="mt-2 w-full py-2 flex justify-center items-center text-sm font-medium bg-[#007BFF] text-white rounded-lg hover:bg-blue-600"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Upgrade Now
                      </Link>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-700">
                      <p className="mb-2">You have <span className="font-bold">{daysLeft} days</span> left in your trial</p>
                      <div className="w-full bg-blue-100 rounded-full h-2 mb-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ width: `${Math.max(5, (daysLeft / 7) * 100)}%` }}
                        ></div>
                      </div>
                      <Link 
                        href="/dashboard/billing" 
                        className="mt-2 w-full py-2 flex justify-center items-center text-sm font-medium bg-[#007BFF] text-white rounded-lg hover:bg-blue-600"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        View Plans
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
          {/* Top Header */}
          <header className="bg-white shadow-sm sticky top-0 z-10 transition-all border-b border-gray-200">
            <div className="flex h-16 items-center justify-between px-4">
              {/* Left side: Mobile menu button and page title */}
              <div className="flex items-center space-x-3">
                <button
                  className="lg:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none mobile-menu-button"
                  onClick={() => setMobileMenuOpen(true)}
                  aria-label="Open menu"
                >
                  <Menu size={24} />
                </button>
                
                <div className="flex flex-col justify-center">
                  <h1 className="text-lg font-semibold text-gray-900">
                    {menuItems.find(item => item.active)?.name || 
                     systemItems.find(item => item.active)?.name || 
                     'Dashboard'}
                  </h1>
                  <div className="text-sm text-gray-500 hidden sm:block">
                    <Link href="/dashboard" className="hover:text-[#007BFF]">Home</Link>
                    <span className="mx-1.5">/</span>
                    <span className="text-gray-700">
                      {menuItems.find(item => item.active)?.name || 
                       systemItems.find(item => item.active)?.name || 
                       'Dashboard'}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Right side: Search, Notifications, User Dropdown */}
              <div className="flex items-center space-x-3">
                {/* Desktop Search */}
                <div className="hidden md:block relative" ref={searchRef}>
                  <button
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full focus:outline-none"
                    onClick={() => setSearchOpen(!searchOpen)}
                    aria-label="Search"
                  >
                    <Search size={20} />
                  </button>
                  
                  {/* Search Dropdown */}
                  {searchOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg p-4 border border-gray-200 z-20">
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Search size={18} className="text-gray-400" />
                        </div>
                        <input
                          type="text"
                          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md bg-gray-50 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          placeholder="Search"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          autoFocus
                        />
                      </div>
                      
                      <div className="mt-3">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                          Quick Links
                        </h3>
                        <div className="space-y-1">
                          {[
                            { name: 'Create Invoice', href: '/dashboard/invoices/new', icon: <FileText size={16} /> },
                            { name: 'Add Load', href: '/dashboard/dispatching/new', icon: <Truck size={16} /> },
                            { name: 'Record Expense', href: '/dashboard/expenses/new', icon: <Wallet size={16} /> },
                            { name: 'IFTA Report', href: '/dashboard/ifta', icon: <Calculator size={16} /> }
                          ].map((item, i) => (
                            <Link
                              key={i}
                              href={item.href}
                              className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                              onClick={() => setSearchOpen(false)}
                            >
                              <span className="text-gray-500 mr-3">{item.icon}</span>
                              {item.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Notifications */}
                <div className="relative" ref={notificationsRef}>
                  <button
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full focus:outline-none relative"
                    onClick={() => setNotificationsOpen(!notificationsOpen)}
                    aria-label="Notifications"
                  >
                    <Bell size={20} />
                    {notifications.some(n => !n.read) && (
                      <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 transform translate-x-1/2 -translate-y-1/2"></span>
                    )}
                  </button>
                  
                  {/* Notifications Dropdown */}
                  {notificationsOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg overflow-hidden border border-gray-200 z-20">
                      <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                        <h3 className="text-sm font-semibold text-gray-700">Notifications</h3>
                        <span className="text-xs text-blue-600 hover:text-blue-800 cursor-pointer">
                          Mark all as read
                        </span>
                      </div>
                      
                      <div className="max-h-72 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="py-6 text-center text-gray-500">
                            <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                              <Bell size={24} className="text-gray-400" />
                            </div>
                            <p className="text-sm">No notifications yet</p>
                          </div>
                        ) : (
                          <div>
                            {notifications.map((notification) => (
                              <div 
                                key={notification.id}
                                className={`px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${!notification.read ? 'bg-blue-50' : ''}`}
                              >
                                <div className="flex items-start">
                                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${!notification.read ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                                  <div className="ml-3 flex-1">
                                    <div className="flex justify-between">
                                      <p className={`text-sm font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                                        {notification.title}
                                      </p>
                                      <span className="text-xs text-gray-500">{notification.time}</span>
                                    </div>
                                    <p className="text-xs text-gray-600 mt-0.5">{notification.description}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
                        <Link 
                          href="/dashboard/notifications"
                          className="block text-center text-sm text-blue-600 hover:text-blue-800"
                          onClick={() => setNotificationsOpen(false)}
                        >
                          View all notifications
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* User Menu Dropdown */}
                <UserDropdown />
              </div>
            </div>
          </header>

{/* Page Content */}
          <main className="flex-1 overflow-x-hidden">
            <div className="container mx-auto py-4 px-4 lg:px-6">
              {/* Check if the current page is protected and subscription is expired */}
              {menuItems.find(item => item.active)?.protected && !isSubscribed() ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                    <LogOut size={24} className="text-red-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Feature Unavailable</h2>
                  <p className="text-gray-600 mb-6 text-center max-w-md">
                    {subscriptionStatus === 'expired' 
                      ? 'Your free trial has ended. Please subscribe to access this feature.'
                      : 'This feature requires an active subscription.'}
                  </p>
                  <Link
                    href="/dashboard/billing"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    View Subscription Plans
                  </Link>
                </div>
              ) : (
                children
              )}
            </div>
          </main>
          
          {/* Footer */}
          <footer className="bg-white border-t border-gray-200 mt-auto py-4 px-4 lg:px-6">
            <div className="container mx-auto">
              <div className="flex flex-col sm:flex-row items-center justify-between">
                <div className="text-sm text-gray-500 mb-2 sm:mb-0">
                  &copy; {new Date().getFullYear()} Truck Command. All rights reserved.
                </div>
                <div className="flex space-x-4">
                  <Link href="/privacy" className="text-sm text-gray-500 hover:text-gray-700">
                    Privacy Policy
                  </Link>
                  <Link href="/terms" className="text-sm text-gray-500 hover:text-gray-700">
                    Terms of Service
                  </Link>
                  <Link href="/contact" className="text-sm text-gray-500 hover:text-gray-700">
                    Contact
                  </Link>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}