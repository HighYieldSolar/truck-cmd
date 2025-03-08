"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import Image from "next/image";
import { 
  Menu, X, Search, Bell, ChevronDown, User,
  LayoutDashboard, Truck, FileText, Wallet, 
  Users, Package, CheckCircle, Calculator, 
  Fuel, Settings, LogOut
} from "lucide-react";

const Sidebar = ({ activePage, isMobileSidebarOpen, closeMobileSidebar }) => {
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
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-64 flex-col bg-white shadow-lg h-screen fixed left-0 top-0 z-20">
        <div className="p-4 border-b">
          <Link href="/dashboard">
            <Image 
              src="/images/tc-name-tp-bg.png" 
              alt="Truck Command Logo"
              width={150}
              height={50}
              className="h-10"
            />
          </Link>
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
              <Settings size={18} className="mr-3" />
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
      
      {/* Mobile Sidebar */}
      {isMobileSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div 
            className="fixed inset-0 bg-black bg-opacity-50" 
            onClick={closeMobileSidebar}
          ></div>
          
          <div className="fixed top-0 left-0 bottom-0 w-72 bg-white z-50 overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <Link href="/dashboard">
                <Image 
                  src="/images/tc-name-tp-bg.png" 
                  alt="Truck Command Logo"
                  width={120}
                  height={40}
                  className="h-8"
                />
              </Link>
              <button 
                onClick={closeMobileSidebar}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <X size={20} className="text-gray-600" />
              </button>
            </div>
            
            <nav className="px-2 py-4">
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
                    onClick={closeMobileSidebar}
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
                  onClick={closeMobileSidebar}
                >
                  <Settings size={18} className="mr-3" />
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
        </div>
      )}
    </>
  );
};

const Navbar = ({ openMobileSidebar }) => {
  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  useEffect(() => {
    async function getUserProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUser(user);
        }
      } catch (error) {
        console.error('Error getting user profile:', error);
      }
    }
    
    getUserProfile();
  }, []);
  
  return (
    <header className="flex items-center justify-between p-4 bg-white shadow-sm">
      <div className="flex items-center">
        <button 
          className="md:hidden p-2 mr-2 text-gray-600 hover:bg-gray-100 rounded-full"
          onClick={openMobileSidebar}
        >
          <Menu size={20} />
        </button>
        
        <div className="relative max-w-md mx-2 hidden md:block">
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
      
      <div className="flex items-center">
        <button className="p-2 text-gray-600 hover:text-blue-600 mx-2 relative">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
            2
          </span>
        </button>
        
        <div className="h-8 w-px bg-gray-200 mx-2"></div>
        
        <div className="relative">
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center text-sm font-medium text-gray-700 hover:text-blue-600"
          >
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold mr-2">
              {user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <span className="hidden sm:block">{user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'User'}</span>
            <ChevronDown size={16} className="ml-1" />
          </button>
          
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
              <Link 
                href="/dashboard/profile" 
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => setDropdownOpen(false)}
              >
                Profile
              </Link>
              <Link 
                href="/dashboard/settings" 
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => setDropdownOpen(false)}
              >
                Settings
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
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default function DashboardLayout({ activePage, children }) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  const openMobileSidebar = () => setIsMobileSidebarOpen(true);
  const closeMobileSidebar = () => setIsMobileSidebarOpen(false);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMobileSidebarOpen && !event.target.closest('.sidebar')) {
        closeMobileSidebar();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileSidebarOpen]);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar 
        activePage={activePage} 
        isMobileSidebarOpen={isMobileSidebarOpen}
        closeMobileSidebar={closeMobileSidebar}
      />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col md:ml-64">
        {/* Navigation Bar */}
        <Navbar openMobileSidebar={openMobileSidebar} />
        
        {/* Page Content */}
        {children}
      </div>
    </div>
  );
}