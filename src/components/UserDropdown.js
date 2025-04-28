// src/components/UserDropdown.js
"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useSubscription } from "@/context/SubscriptionContext";
import { 
  Settings, 
  LogOut, 
  User,
  ChevronRight,
  Globe,
  HelpCircle,
  FileText,
  Info,
  Check,
  ChevronDown
} from "lucide-react";

export default function UserDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const router = useRouter();
  const { user, subscription } = useSubscription();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle logout
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Get user's current plan name
  const getPlanName = () => {
    if (!subscription) return 'Free trial';
    
    const plan = subscription.plan || 'basic';
    
    switch(plan) {
      case 'basic': return 'Basic plan';
      case 'premium': return 'Premium plan';
      case 'fleet': return 'Fleet plan';
      default: return 'Free trial';
    }
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className="flex items-center space-x-1 focus:outline-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-semibold">
          {user?.email?.[0]?.toUpperCase() || 'U'}
        </div>
        <ChevronDown size={16} className="text-gray-500 ml-1" />
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg overflow-hidden z-50 border border-gray-200">
          {/* User info section */}
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="text-sm text-gray-700 truncate mb-1">{user.email}</div>
            <div className="flex items-center">
              <div className="text-xs font-medium text-gray-600 flex-1">{getPlanName()}</div>
              {subscription?.status === 'active' && <Check size={14} className="text-green-600" />}
            </div>
          </div>
          
          {/* Menu items */}
          <div className="py-1">
            <Link
              href="/dashboard/settings"
              className="flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => setIsOpen(false)}
            >
              <span>Settings</span>
            </Link>
            
            <div className="flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
              <div className="flex items-center">
                <span>Language</span>
                <span className="ml-2 px-1.5 py-0.5 text-xs bg-gray-200 rounded text-gray-700">BETA</span>
              </div>
              <ChevronRight size={16} className="text-gray-400" />
            </div>
            
            <Link
              href="/help"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => setIsOpen(false)}
            >
              <span>Get help</span>
            </Link>
          </div>
          
          <div className="border-t border-gray-200 py-1">
            <Link
              href="/dashboard/billing"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => setIsOpen(false)}
            >
              <span>View all plans</span>
            </Link>
            
            <div className="flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
              <span>Learn more</span>
              <ChevronRight size={16} className="text-gray-400" />
            </div>
          </div>
          
          <div className="border-t border-gray-200">
            <button
              onClick={() => {
                setIsOpen(false);
                handleLogout();
              }}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}