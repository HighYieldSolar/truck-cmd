"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
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
  Home,
  MapPin
} from "lucide-react";

export default function Navigation({ activePage = "dashboard" }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Menu items definition
  const menuItems = [
    { 
      name: 'Dashboard', 
      href: '/dashboard', 
      icon: <LayoutDashboard size={20} />,
      active: activePage === 'dashboard'
    },
    { 
      name: 'Load Management', 
      href: '/dashboard/dispatching', 
      icon: <Truck size={20} />,
      active: activePage === 'dispatching'
    },
    {
      name: 'State Mileage', 
      href: '/dashboard/mileage', 
      icon: <MapPin size={20} />,
      active: activePage === 'mileage'
    },
    { 
      name: 'Invoices', 
      href: '/dashboard/invoices', 
      icon: <FileText size={20} />,
      active: activePage === 'invoices'
    },
    { 
      name: 'Expenses', 
      href: '/dashboard/expenses', 
      icon: <Wallet size={20} />,
      active: activePage === 'expenses'
    },
    { 
      name: 'Customers', 
      href: '/dashboard/customers', 
      icon: <Users size={20} />,
      active: activePage === 'customers'
    },
    { 
      name: 'Fleet', 
      href: '/dashboard/fleet', 
      icon: <Package size={20} />,
      active: activePage === 'fleet'
    },
    { 
      name: 'Compliance', 
      href: '/dashboard/compliance', 
      icon: <CheckCircle size={20} />,
      active: activePage === 'compliance'
    },
    { 
      name: 'IFTA Calculator', 
      href: '/dashboard/ifta', 
      icon: <Calculator size={20} />,
      active: activePage === 'ifta'
    },
    { 
      name: 'Fuel Tracker', 
      href: '/dashboard/fuel', 
      icon: <Fuel size={20} />,
      active: activePage === 'fuel'
    },
  ];

  // Reference for clicking outside
  const userDropdownRef = useRef(null);
  const mobileMenuRef = useRef(null);

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
        
        setUser(user);
      } catch (error) {
        router.push('/login');
      } finally {
        setLoading(false);
      }
    }
    
    checkUser();
  }, [router]);

  // Handle resize and scroll effects
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    
    // Initial check
    handleResize();
    
    // Set up event listeners
    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll);
    
    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
      
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
  }, [mobileMenuOpen]);

  // Handle logout
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/login');
    } catch (error) {
      // Silent failure - user will see they're still logged in
    }
  };

  return (
    <>
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
            {menuItems.map((item) => (
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
            <Link
              href="/dashboard/settings"
              className={`group flex items-center px-3 py-3 text-sm font-medium rounded-md transition-all ${
                activePage === 'settings'
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-700 hover:bg-gray-100 hover:text-blue-600"
              }`}
            >
              <Settings 
                size={20} 
                className={`mr-3 ${activePage === 'settings' ? 'text-blue-600' : 'text-gray-500 group-hover:text-blue-600'}`} 
              />
              Settings
            </Link>
            
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

      {/* Mobile Menu Background Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        ref={mobileMenuRef}
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out md:hidden ${
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
            className="text-gray-500 hover:text-gray-600 focus:outline-none"
            onClick={() => setMobileMenuOpen(false)}
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="flex-1 pb-4 pt-2 overflow-y-auto">
          <nav className="px-2 py-2">
            <div className="space-y-1">
              {menuItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-3 py-2.5 text-base font-medium rounded-md transition-all ${
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
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <Link
                href="/dashboard/settings"
                className={`flex items-center px-3 py-2.5 text-base font-medium rounded-md transition-all ${
                  activePage === 'settings'
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-700 hover:bg-gray-100 hover:text-blue-600"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Settings 
                  size={20} 
                  className={`mr-3 ${activePage === 'settings' ? 'text-blue-600' : 'text-gray-500'}`} 
                />
                Settings
              </Link>
              
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-3 py-2.5 text-base font-medium text-gray-700 rounded-md hover:bg-gray-100 hover:text-red-600 transition-all"
              >
                <LogOut size={20} className="mr-3 text-gray-500" />
                Logout
              </button>
            </div>
          </nav>
        </div>
      </aside>

      {/* Top Navigation Bar */}
      <header className="z-10 bg-white shadow-sm sticky top-0 md:ml-64">
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
            
            <div className="relative" ref={userDropdownRef}>
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
    </>
  );
}