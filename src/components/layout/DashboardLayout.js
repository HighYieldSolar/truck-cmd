"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Truck, 
  FileText, 
  Wallet, 
  Users, 
  Package, 
  CheckCircle, 
  Calculator, 
  Fuel, 
  Settings,
  LogOut,
  Bell, 
  Search, 
  Menu,
  X,
  ChevronDown,
  User,
  MapPin
} from "lucide-react";
import TrialBanner from "@/components/subscriptions/TrialBanner";
import { useSubscription } from "@/context/SubscriptionContext";

export default function DashboardLayout({ children, activePage = "dashboard" }) {
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  
  // Get subscription context
  const { 
    user, 
    subscription, 
    loading: subscriptionLoading, 
    isTrialActive, 
    isSubscriptionActive
  } = useSubscription();

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
  const mobileMenuRef = useRef(null);
  const userDropdownRef = useRef(null);

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
      active: currentActivePage === 'dispatching'
    },
    {
      name: 'State Mileage', 
      href: '/dashboard/mileage', 
      icon: <MapPin size={18} />,
      active: currentActivePage === 'mileage'
    },
    { 
      name: 'Invoices', 
      href: '/dashboard/invoices', 
      icon: <FileText size={20} />,
      active: currentActivePage === 'invoices'
    },
    { 
      name: 'Expenses', 
      href: '/dashboard/expenses', 
      icon: <Wallet size={20} />,
      active: currentActivePage === 'expenses'
    },
    { 
      name: 'Customers', 
      href: '/dashboard/customers', 
      icon: <Users size={20} />,
      active: currentActivePage === 'customers'
    },
    { 
      name: 'Fleet', 
      href: '/dashboard/fleet', 
      icon: <Package size={20} />,
      active: currentActivePage === 'fleet'
    },
    { 
      name: 'Compliance', 
      href: '/dashboard/compliance', 
      icon: <CheckCircle size={20} />,
      active: currentActivePage === 'compliance'
    },
    { 
      name: 'IFTA Calculator', 
      href: '/dashboard/ifta', 
      icon: <Calculator size={20} />,
      active: currentActivePage === 'ifta'
    },
    { 
      name: 'Fuel Tracker', 
      href: '/dashboard/fuel', 
      icon: <Fuel size={20} />,
      active: currentActivePage === 'fuel'
    },
    { 
      name: 'Settings', 
      href: '/dashboard/settings', 
      icon: <Settings size={20} />,
      active: currentActivePage === 'settings'
    },
    { 
      name: 'Billing', 
      href: '/dashboard/billing', 
      icon: <Wallet size={20} />,
      active: currentActivePage === 'billing'
    },
  ];

  // Check if user is authenticated
  useEffect(() => {
    async function checkUser() {
      try {
        setLoading(true);
        
        // Get current user
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
          throw error;
        }
        
        if (!user) {
          // Redirect to login if not authenticated
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
  }, [pathname]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close user dropdown when clicking outside
      if (userDropdownOpen && userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
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
  }, [userDropdownOpen, mobileMenuOpen]);

  if (loading || subscriptionLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Determine subscription status for the banner
  let subscriptionStatus = 'none';
  if (subscription) {
    if (subscription.status === 'active' && isSubscriptionActive()) {
      subscriptionStatus = 'active';
    } else if (subscription.status === 'trial' && isTrialActive()) {
      subscriptionStatus = 'trial';
    } else if ((subscription.status === 'trial' && !isTrialActive()) || 
               (subscription.status === 'active' && !isSubscriptionActive())) {
      subscriptionStatus = 'expired';
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Trial Banner */}
      {bannerVisible && subscriptionStatus !== 'active' && (
        <TrialBanner 
          trialEndsAt={subscription?.trialEndsAt}
          onClose={() => setBannerVisible(false)}
          subscriptionStatus={subscriptionStatus}
        />
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:w-64 bg-white shadow-md z-10">
          <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200">
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
          
          <div className="flex-1 flex flex-col overflow-y-auto pt-5 pb-4">
            <nav className="mt-2 px-2 space-y-1">
              {menuItems.slice(0, -1).map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-3 py-3 text-sm font-medium rounded-md transition-all ${
                    item.active
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-700 hover:bg-gray-100 hover:text-blue-600"
                  }`}
                >
                  <div className={`mr-3 flex-shrink-0 ${
                    item.active ? "text-blue-600" : "text-gray-500 group-hover:text-blue-600"
                  }`}>
                    {item.icon}
                  </div>
                  {item.name}
                </Link>
              ))}
            </nav>
            
            <div className="mt-auto px-3 py-4 border-t border-gray-200">
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-3 py-3 mt-1 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 hover:text-red-600 transition-all"
              >
                <LogOut size={20} className="mr-3 text-gray-500" />
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu backdrop */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          ></div>
        )}

        {/* Mobile Sidebar */}
        <div
          ref={mobileMenuRef}
          className={`fixed inset-y-0 left-0 z-50 w-72 bg-white transform transition-transform duration-300 ease-in-out md:hidden ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          style={{ height: '100%', overflowY: 'auto' }}
        >
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 sticky top-0 bg-white z-10">
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
              className="text-gray-500 hover:text-gray-600"
              onClick={() => setMobileMenuOpen(false)}
            >
              <X size={24} />
            </button>
          </div>
          
          <div className="flex-1 pb-6">
            <nav className="px-2 py-2">
              {menuItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-3 py-2.5 text-base font-medium rounded-md transition-all my-1 ${
                    item.active
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-700 hover:bg-gray-100 hover:text-blue-600"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className={`mr-3 flex-shrink-0 ${
                    item.active ? "text-blue-600" : "text-gray-500"
                  }`}>
                    {item.icon}
                  </div>
                  {item.name}
                </Link>
              ))}
            </nav>
            
            <div className="mt-4 px-2 pt-4 border-t border-gray-200">
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-3 py-2.5 text-base font-medium text-gray-700 rounded-md hover:bg-gray-100 hover:text-red-600 transition-all"
              >
                <LogOut size={20} className="mr-3 text-gray-500" />
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className={`flex-1 flex flex-col md:ml-64 ${mobileMenuOpen ? 'hidden md:flex' : ''}`}>
          {/* Top Navigation Bar */}
          <header className="z-10 bg-white shadow-sm sticky top-0">
            <div className="px-4 h-16 flex items-center justify-between">
              {/* Left side: Mobile menu button and brand on mobile */}
              <div className="flex items-center">
                <button
                  className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none mobile-menu-button"
                  onClick={() => setMobileMenuOpen(true)}
                  aria-label="Open menu"
                >
                  <Menu size={24} />
                </button>
                <div className="md:hidden ml-2">
                  <span className="font-semibold text-gray-900">
                    {menuItems.find(item => item.active)?.name || 'Dashboard'}
                  </span>
                </div>
              </div>
              
              {/* Center: Search bar */}
              <div className="hidden md:block flex-1 max-w-md mx-4">
                <div className="relative w-full">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Search..."
                  />
                </div>
              </div>
              
              {/* Right side: Notifications and User Dropdown */}
              <div className="flex items-center space-x-4">
                <button className="p-1 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 relative">
                  <Bell size={20} />
                  <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>
                
                <div className="relative user-dropdown" ref={userDropdownRef}>
                  <button 
                    className="flex items-center space-x-2 rounded-full focus:outline-none"
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  >
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-semibold">
                      {user?.email?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="hidden md:flex items-center">
                      <span className="text-sm text-gray-700">
                        {user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'User'}
                      </span>
                      <ChevronDown size={16} className="ml-1 text-gray-500" />
                    </div>
                  </button>
                  
                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 py-2 bg-white rounded-md shadow-lg z-50 border border-gray-200">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                      </div>
                      <Link
                        href="/dashboard/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setUserDropdownOpen(false)}
                      >
                        Your Profile
                      </Link>
                      <Link
                        href="/dashboard/settings"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setUserDropdownOpen(false)}
                      >
                        Settings
                      </Link>
                      <Link
                        href="/dashboard/billing"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setUserDropdownOpen(false)}
                      >
                        Subscription & Billing
                      </Link>
                      <hr className="my-1 border-gray-200" />
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Mobile Search Bar */}
            <div className="md:hidden px-4 pb-3">
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={18} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Search..."
                />
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto bg-white">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}