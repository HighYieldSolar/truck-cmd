// src/components/layout/DashboardLayout.js
"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard, Truck, FileText, Wallet, Users, Package, CheckCircle,
  Calculator, Fuel, Settings, LogOut, Search, Menu, X,
  User, MapPin, Home
} from "lucide-react";
import TrialBanner from "@/components/subscriptions/TrialBanner";
import { useSubscription } from "@/context/SubscriptionContext";
import { useTheme } from "@/context/ThemeContext";
import { useSidebar } from "@/context/SidebarContext";
import UserDropdown from "@/components/UserDropdown";
import NotificationIcon from "@/components/notifications/NotificationIcon";
import NotificationDropdown from "@/components/notifications/NotificationDropdown";
import GlobalSearch, { useGlobalSearchShortcut } from "@/components/search/GlobalSearch";

export default function DashboardLayout({ activePage = "dashboard", children, pageTitle }) {
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const notificationsContainerRef = useRef(null);
  const mobileMenuRef = useRef(null);

  const {
    user,
    subscription,
    loading: subscriptionLoading,
    getDaysLeftInTrial,
    isTrialActive,
    isSubscriptionActive
  } = useSubscription();
  
  const { theme } = useTheme();
  const { sidebarConfig } = useSidebar();

  const [notificationsData, setNotificationsData] = useState([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [notificationError, setNotificationError] = useState(null);
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);

  // Keyboard shortcut for global search (Cmd+K / Ctrl+K)
  useGlobalSearchShortcut(() => setGlobalSearchOpen(true));

  // Handle mounting to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Fetch initial notifications summary
  useEffect(() => {
    if (user && user.id) {
      const fetchNotifications = async () => {
        try {
          setNotificationError(null);

          // Always use direct query for reliability (RPC may not exist)
          const { data: directData, error: directError } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(5);

          if (directError) {
            setNotificationError("Failed to load notifications.");
            setNotificationsData([]);
            setUnreadNotificationCount(0);
            return;
          }

          const notifications = directData || [];
          const unreadCount = notifications.filter(n => !n.is_read).length;
          setNotificationsData(notifications);
          setUnreadNotificationCount(unreadCount);
        } catch (e) {
          setNotificationError("An unexpected error occurred.");
          setNotificationsData([]);
          setUnreadNotificationCount(0);
        }
      };
      fetchNotifications();
    } else {
      // Clear notifications if user logs out or is not available
      setNotificationsData([]);
      setUnreadNotificationCount(0);
    }
  }, [user]); // Rerun when user object changes

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
    async function checkUserAuth() {
      try {
        setLoading(true);

        // Get current user
        const { data: { user: authUser }, error } = await supabase.auth.getUser();

        if (error || !authUser) {
          router.push('/login');
          return;
        }
      } catch (error) {
        router.push('/login');
      } finally {
        setLoading(false);
      }
    }

    if (!user) { // Only run if user from context isn't available yet
      checkUserAuth();
    } else {
      setLoading(false); // User already loaded from context
    }
  }, [router, user]);

  // Handle logout
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/login');
    } catch (error) {
      // Logout failed, redirect anyway
      router.push('/login');
    }
  };

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
    setNotificationsOpen(false);
    setGlobalSearchOpen(false);
  }, [pathname]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close notifications dropdown when clicking outside
      if (notificationsOpen && notificationsContainerRef.current && !notificationsContainerRef.current.contains(event.target)) {
        setNotificationsOpen(false);
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
  }, [notificationsOpen, mobileMenuOpen]);

  // Base menu items definition (keyed by ID for lookup)
  const baseMenuItems = {
    dashboard: {
      id: 'dashboard',
      name: 'Dashboard',
      href: '/dashboard',
      icon: <LayoutDashboard size={20} />,
      active: currentActivePage === 'dashboard' && !pageTitle
    },
    dispatching: {
      id: 'dispatching',
      name: 'Load Management',
      href: '/dashboard/dispatching',
      icon: <Truck size={20} />,
      active: currentActivePage === 'dispatching' && !pageTitle,
      protected: true
    },
    mileage: {
      id: 'mileage',
      name: 'State Mileage',
      href: '/dashboard/mileage',
      icon: <MapPin size={20} />,
      active: currentActivePage === 'mileage' && !pageTitle,
      protected: true
    },
    invoices: {
      id: 'invoices',
      name: 'Invoices',
      href: '/dashboard/invoices',
      icon: <FileText size={20} />,
      active: currentActivePage === 'invoices' && !pageTitle,
      protected: true
    },
    expenses: {
      id: 'expenses',
      name: 'Expenses',
      href: '/dashboard/expenses',
      icon: <Wallet size={20} />,
      active: currentActivePage === 'expenses' && !pageTitle,
      protected: true
    },
    customers: {
      id: 'customers',
      name: 'Customers',
      href: '/dashboard/customers',
      icon: <Users size={20} />,
      active: currentActivePage === 'customers' && !pageTitle,
      protected: true
    },
    fleet: {
      id: 'fleet',
      name: 'Fleet',
      href: '/dashboard/fleet',
      icon: <Package size={20} />,
      active: currentActivePage === 'fleet' && !pageTitle,
      protected: true
    },
    compliance: {
      id: 'compliance',
      name: 'Compliance',
      href: '/dashboard/compliance',
      icon: <CheckCircle size={20} />,
      active: currentActivePage === 'compliance' && !pageTitle,
      protected: true
    },
    ifta: {
      id: 'ifta',
      name: 'IFTA Calculator',
      href: '/dashboard/ifta',
      icon: <Calculator size={20} />,
      active: currentActivePage === 'ifta' && !pageTitle,
      protected: true
    },
    fuel: {
      id: 'fuel',
      name: 'Fuel Tracker',
      href: '/dashboard/fuel',
      icon: <Fuel size={20} />,
      active: currentActivePage === 'fuel' && !pageTitle,
      protected: true
    },
  };

  // Generate menu items based on sidebar configuration
  const menuItems = sidebarConfig
    .filter(config => config.visible && baseMenuItems[config.id])
    .map(config => baseMenuItems[config.id]);

  // System menu items - only Settings now
  const systemItems = [
    {
      name: 'Settings',
      href: '/dashboard/settings',
      icon: <Settings size={20} />,
      active: currentActivePage === 'settings' && !pageTitle
    }
  ];

  // Notification interaction handlers
  const handleMarkAllRead = async () => {
    if (!user || !user.id) {
      setNotificationError("User not found. Please try again.");
      return;
    }
    try {
      // Use direct update instead of RPC (RPC has schema mismatch)
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) {
        setNotificationError("Failed to mark all as read.");
      } else {
        setNotificationsData(notificationsData.map(n => ({ ...n, is_read: true })));
        setUnreadNotificationCount(0);
        setNotificationError(null);
      }
    } catch (e) {
      setNotificationError("An unexpected error occurred.");
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!user || !user.id) {
      setNotificationError("User not found. Please try again.");
      return;
    }
    try {
      // Mark as read if not already
      if (!notification.is_read) {
        // Use direct update instead of RPC (RPC has schema mismatch)
        const { error } = await supabase
          .from('notifications')
          .update({ is_read: true, read_at: new Date().toISOString() })
          .eq('id', notification.id)
          .eq('user_id', user.id);

        if (error) {
          setNotificationError("Failed to mark notification as read.");
        } else {
          setNotificationsData(
            notificationsData.map(n =>
              n.id === notification.id ? { ...n, is_read: true } : n
            )
          );
          setUnreadNotificationCount(prevCount => Math.max(0, prevCount - 1));
          setNotificationError(null);
        }
      }

      // Navigate if link_to is present
      if (notification.link_to) {
        router.push(notification.link_to);
      }
      setNotificationsOpen(false);
    } catch (e) {
      setNotificationError("An unexpected error occurred.");
    }
  };

  const handleViewAllNotifications = () => {
    router.push('/dashboard/notifications');
    setNotificationsOpen(false);
  };

  // Determine the displayed title - check both visible menuItems and baseMenuItems for hidden pages
  const displayedTitle = pageTitle
    || menuItems.find(item => item.active)?.name
    || systemItems.find(item => item.active)?.name
    || Object.values(baseMenuItems).find(item => item.active)?.name
    || 'Dashboard';

  if (loading || subscriptionLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className={`dashboard-theme flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 ${theme === 'dark' ? 'dark' : ''}`}>
      {/* Trial Banner */}
      <TrialBanner />

      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <div className="hidden lg:flex lg:flex-col lg:w-64 bg-white dark:bg-gray-800 shadow-md fixed inset-y-0 left-0 h-screen z-20 transition-all duration-300">
          <div className="flex items-center justify-center h-16 px-4 border-b border-gray-100 dark:border-gray-700">
            <Link href="/dashboard" className="flex items-center">
              <Image
                src={theme === 'dark' ? "/images/tc white-logo with name.png" : "/images/tc-name-tp-bg.png"}
                alt="Truck Command Logo"
                width={150}
                height={40}
                className="h-10"
              />
            </Link>
          </div>

          <div className="flex-1 flex flex-col overflow-y-auto py-4 min-h-0">
            {/* Main Navigation */}
            <div className="px-3">
              <h2 className="px-4 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                Main
              </h2>
              <nav className="space-y-1">
                {menuItems.map((item) => {
                  // Determine if this menu item should be disabled
                  const isDisabled = item.protected && !isSubscribed();

                  return (
                    <Link
                      key={item.name}
                      href={isDisabled ? "/dashboard/upgrade" : item.href}
                      className={`group flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-all 
                        ${item.active
                          ? "bg-blue-50 dark:bg-blue-900/20 text-[#007BFF] dark:text-blue-400"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-[#007BFF] dark:hover:text-blue-400"
                        } 
                        ${isDisabled ? "opacity-50" : ""}`}
                    >
                      <div
                        className={`mr-3 flex-shrink-0 ${item.active ? "text-[#007BFF] dark:text-blue-400" : "text-gray-500 dark:text-gray-400 group-hover:text-[#007BFF] dark:group-hover:text-blue-400"}`}
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
              <h2 className="px-4 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                System
              </h2>
              <nav className="space-y-1">
                {systemItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${item.active
                      ? "bg-blue-50 dark:bg-blue-900/20 text-[#007BFF] dark:text-blue-400"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-[#007BFF] dark:hover:text-blue-400"
                      }`}
                  >
                    <div className={`mr-3 flex-shrink-0 ${item.active ? "text-[#007BFF] dark:text-blue-400" : "text-gray-500 dark:text-gray-400 group-hover:text-[#007BFF] dark:group-hover:text-blue-400"
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
              <div className="mt-6 mx-3 rounded-lg overflow-hidden border border-blue-100 dark:border-blue-900 bg-blue-50 dark:bg-blue-900/20">
                <div className="px-4 py-3 bg-blue-500 dark:bg-blue-600 text-white">
                  <div className="font-medium">Truck Command Free Trial</div>
                </div>
                <div className="p-4">
                  {subscriptionStatus === 'expired' ? (
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      <p className="mb-2">Your trial has expired. Upgrade now to continue accessing all features.</p>
                      <Link
                        href="/dashboard/upgrade"
                        className="flex items-center text-sm font-medium text-[#007BFF] hover:text-blue-500"
                      >
                        Upgrade now
                      </Link>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      <p className="mb-2">You have <span className="font-bold">{daysLeft} days</span> left in your trial</p>
                      <div className="w-full bg-blue-100 dark:bg-blue-900 rounded-full h-2 mb-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${Math.max(5, (daysLeft / 7) * 100)}%` }}
                        ></div>
                      </div>
                      <Link
                        href="/dashboard/upgrade"
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

        {/* Mobile Menu Overlay - Only render after mount to prevent hydration issues */}
        {mounted && (
          <div
            className={`fixed inset-0 bg-gray-700 z-40 lg:hidden transition-opacity duration-300 ${mobileMenuOpen ? 'opacity-60' : 'opacity-0 pointer-events-none'}`}
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden={!mobileMenuOpen}
          />
        )}

        {/* Mobile Sidebar - Only render after mount to prevent hydration issues */}
        {mounted && (
          <div
            ref={mobileMenuRef}
            className={`fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-gray-800 shadow-xl transform transition-transform duration-300 ease-in-out lg:hidden overflow-y-auto ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
            style={{ visibility: mobileMenuOpen ? 'visible' : 'hidden' }}
            aria-hidden={!mobileMenuOpen}
          >
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <Link href="/dashboard" className="flex items-center" onClick={() => setMobileMenuOpen(false)}>
              <Image
                src={theme === 'dark' ? "/images/tc white-logo with name.png" : "/images/tc-name-tp-bg.png"}
                alt="Truck Command Logo"
                width={120}
                height={30}
                className="h-8"
              />
            </Link>
            <button
              className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none touch-manipulation"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>

          {/* User Profile Section (Mobile) */}
          {user && (
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold text-lg mr-3">
                {user.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                  {user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</div>
              </div>
            </div>
          )}

          <div className="p-2">
            {/* Mobile Search Bar */}
            <div className="px-2 py-3">
              <button
                className="w-full flex items-center px-3 py-2.5 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none transition-colors"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setGlobalSearchOpen(true);
                }}
              >
                <Search size={18} className="text-gray-400 dark:text-gray-500 mr-2" />
                Search loads, invoices...
              </button>
            </div>

            {/* Main Navigation */}
            <div className="mt-1 pb-2">
              <h2 className="px-4 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                Main
              </h2>
              {menuItems.map((item) => {
                // Determine if this menu item should be disabled
                const isDisabled = item.protected && !isSubscribed();

                return (
                  <Link
                    key={item.name}
                    href={isDisabled ? "/dashboard/upgrade" : item.href}
                    className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all my-0.5 
                      ${item.active
                        ? "bg-blue-50 dark:bg-blue-900/20 text-[#007BFF] dark:text-blue-400"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-[#007BFF] dark:hover:text-blue-400"
                      } 
                      ${isDisabled ? "opacity-50" : ""}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div className={`mr-3 flex-shrink-0 ${item.active ? "text-[#007BFF] dark:text-blue-400" : "text-gray-500 dark:text-gray-400"
                      }`}>
                      {item.icon}
                    </div>
                    {item.name}
                  </Link>
                );
              })}
            </div>

            {/* System Navigation */}
            <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
              <h2 className="px-4 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                System
              </h2>
              {systemItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all my-0.5 ${item.active
                    ? "bg-blue-50 dark:bg-blue-900/20 text-[#007BFF] dark:text-blue-400"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-[#007BFF] dark:hover:text-blue-400"
                    }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className={`mr-3 flex-shrink-0 ${item.active ? "text-[#007BFF] dark:text-blue-400" : "text-gray-500 dark:text-gray-400"}`}>
                    {item.icon}
                  </div>
                  {item.name}
                </Link>
              ))}

              <button
                onClick={handleLogout}
                className="w-full flex items-center px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-red-600 dark:hover:text-red-400 transition-all my-0.5"
              >
                <LogOut size={20} className="mr-3 text-gray-500 dark:text-gray-400" />
                Logout
              </button>
            </div>

            {/* Trial Status (Mobile) */}
            {subscriptionStatus !== 'active' && (
              <div className="mt-6 mx-2 rounded-lg overflow-hidden border border-blue-100 dark:border-blue-900 bg-blue-50 dark:bg-blue-900/20">
                <div className="px-4 py-3 bg-blue-500 dark:bg-blue-600 text-white">
                  <div className="font-medium">Free Trial Status</div>
                </div>
                <div className="p-4">
                  {subscriptionStatus === 'expired' ? (
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      <p className="mb-2">Your trial has expired. Subscribe now to continue using all features.</p>
                      <Link
                        href="/dashboard/upgrade"
                        className="mt-2 w-full py-2 flex justify-center items-center text-sm font-medium bg-[#007BFF] dark:bg-blue-600 text-white rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Upgrade Now
                      </Link>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      <p className="mb-2">You have <span className="font-bold">{daysLeft} days</span> left in your trial</p>
                      <div className="w-full bg-blue-100 dark:bg-blue-900 rounded-full h-2 mb-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${Math.max(5, (daysLeft / 7) * 100)}%` }}
                        ></div>
                      </div>
                      <Link
                        href="/dashboard/upgrade"
                        className="mt-2 w-full py-2 flex justify-center items-center text-sm font-medium bg-[#007BFF] dark:bg-blue-600 text-white rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700"
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
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
          {/* Top Header */}
          <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10 transition-all border-b border-gray-200 dark:border-gray-700">
            <div className="flex h-16 items-center justify-between px-4">
              {/* Left side: Mobile menu button and page title */}
              <div className="flex items-center space-x-3">
                <button
                  className="lg:hidden p-2 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none mobile-menu-button touch-manipulation"
                  onClick={() => setMobileMenuOpen(true)}
                  aria-label="Open menu"
                  aria-expanded={mobileMenuOpen}
                >
                  <Menu size={24} />
                </button>

                <div className="flex flex-col justify-center">
                  <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {displayedTitle}
                  </h1>
                  <div className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
                    <Link href="/dashboard" className="hover:text-[#007BFF] dark:hover:text-blue-400">Home</Link>
                    <span className="mx-1.5">/</span>
                    <span className="text-gray-700 dark:text-gray-300">
                      {displayedTitle}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right side: Search, Notifications, User Dropdown */}
              <div className="flex items-center space-x-3">
                {/* Desktop Search Button */}
                <div className="hidden md:block">
                  <button
                    className="flex items-center px-3 py-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg focus:outline-none transition-colors"
                    onClick={() => setGlobalSearchOpen(true)}
                    aria-label="Search"
                  >
                    <Search size={16} className="mr-2" />
                    <span className="hidden lg:inline">Search...</span>
                    <kbd className="hidden lg:inline ml-3 px-1.5 py-0.5 text-xs bg-gray-200 dark:bg-gray-600 rounded">
                      {typeof navigator !== 'undefined' && navigator.platform?.includes('Mac') ? '⌘' : 'Ctrl'}K
                    </kbd>
                  </button>
                </div>

                {/* Notifications */}
                <div className="relative" ref={notificationsContainerRef}>
                  <NotificationIcon
                    onIconClick={() => setNotificationsOpen(!notificationsOpen)}
                    hasUnread={unreadNotificationCount > 0}
                  />
                  {notificationsOpen && (
                    <NotificationDropdown
                      notifications={notificationsData}
                      unreadCount={unreadNotificationCount}
                      onMarkAllReadClick={handleMarkAllRead}
                      onViewAllClick={handleViewAllNotifications}
                      onNotificationItemClick={handleNotificationClick}
                    />
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
              {menuItems.find(item => item.href.endsWith(currentActivePage))?.protected && !isSubscribed() && !pageTitle ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
                    <LogOut size={24} className="text-red-600 dark:text-red-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Feature Unavailable</h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-6 text-center max-w-md">
                    {subscriptionStatus === 'expired'
                      ? 'Your free trial has ended. Please subscribe to access this feature.'
                      : 'This feature requires an active subscription.'}
                  </p>
                  <Link
                    href="/dashboard/upgrade"
                    className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
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
          <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-auto py-4 px-4 lg:px-6">
            <div className="container mx-auto">
              <div className="flex flex-col sm:flex-row items-center justify-between">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-2 sm:mb-0">
                  &copy; {new Date().getFullYear()} Truck Command LLC. All rights reserved.
                </div>
                <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
                  <Link href="/terms" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                    Terms
                  </Link>
                  <Link href="/privacy" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                    Privacy
                  </Link>
                  <Link href="/cookies" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                    Cookies
                  </Link>
                  <Link href="/acceptable-use" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                    Acceptable Use
                  </Link>
                  <Link href="/contact" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                    Contact
                  </Link>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </div>

      {/* Global Search Modal */}
      <GlobalSearch
        isOpen={globalSearchOpen}
        onClose={() => setGlobalSearchOpen(false)}
      />
    </div>
  );
}