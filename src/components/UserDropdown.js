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
  ChevronLeft,
  Globe,
  HelpCircle,
  FileText,
  Info,
  Check,
  ChevronDown
} from "lucide-react";

export default function UserDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [showLearnMoreMenu, setShowLearnMoreMenu] = useState(false);
  const [languageMenuClicked, setLanguageMenuClicked] = useState(false);
  const [learnMoreMenuClicked, setLearnMoreMenuClicked] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const dropdownRef = useRef(null);
  const languageTimeoutRef = useRef(null);
  const learnMoreTimeoutRef = useRef(null);
  const router = useRouter();
  const { user, subscription } = useSubscription();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setShowLanguageMenu(false);
        setShowLearnMoreMenu(false);
        setLanguageMenuClicked(false);
        setLearnMoreMenuClicked(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Load saved language preference
  useEffect(() => {
    const savedLanguage = localStorage.getItem("language") || "en";
    setSelectedLanguage(savedLanguage);
  }, []);

  // Helper functions for menu hover with delay
  const handleLanguageMenuEnter = () => {
    if (languageTimeoutRef.current) {
      clearTimeout(languageTimeoutRef.current);
    }
    if (!languageMenuClicked) {
      setShowLanguageMenu(true);
    }
  };

  const handleLanguageMenuLeave = () => {
    // Don't close if menu was clicked
    if (languageMenuClicked) return;
    
    languageTimeoutRef.current = setTimeout(() => {
      setShowLanguageMenu(false);
    }, 100);
  };

  const handleLearnMoreMenuEnter = () => {
    if (learnMoreTimeoutRef.current) {
      clearTimeout(learnMoreTimeoutRef.current);
    }
    if (!learnMoreMenuClicked) {
      setShowLearnMoreMenu(true);
    }
  };

  const handleLearnMoreMenuLeave = () => {
    // Don't close if menu was clicked
    if (learnMoreMenuClicked) return;
    
    learnMoreTimeoutRef.current = setTimeout(() => {
      setShowLearnMoreMenu(false);
    }, 100);
  };

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
        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-700 dark:text-blue-400 font-semibold">
          {user?.email?.[0]?.toUpperCase() || 'U'}
        </div>
        <ChevronDown size={16} className="text-gray-500 dark:text-gray-400 ml-1" />
      </button>
      
      {isOpen && (
        <>
          <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-md shadow-lg overflow-hidden z-50 border border-gray-200 dark:border-gray-700">
          {/* User info section */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-700 dark:text-gray-200 truncate mb-1">{user.email}</div>
            <div className="flex items-center">
              <div className="text-xs font-medium text-gray-600 dark:text-gray-400 flex-1">{getPlanName()}</div>
              {subscription?.status === 'active' && <Check size={14} className="text-green-600 dark:text-green-400" />}
            </div>
          </div>

          {/* Menu items */}
          <div className="py-1">
            <Link
              href="/dashboard/settings"
              className="flex items-center justify-between px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => setIsOpen(false)}
            >
              <span>Settings</span>
            </Link>

            <button
              className={`w-full flex items-center justify-between px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 ${showLanguageMenu ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
              onMouseEnter={handleLanguageMenuEnter}
              onMouseLeave={handleLanguageMenuLeave}
              onClick={() => {
                if (showLanguageMenu && !languageMenuClicked) {
                  // If menu is open from hover, first click should make it persistent
                  setLanguageMenuClicked(true);
                } else {
                  // Toggle menu
                  setShowLanguageMenu(!showLanguageMenu);
                  setLanguageMenuClicked(!showLanguageMenu);
                }
                // Close other menu
                setShowLearnMoreMenu(false);
                setLearnMoreMenuClicked(false);
              }}
            >
              <div className="flex items-center">
                <span>Language</span>
                <span className="ml-2 px-1.5 py-0.5 text-xs bg-gray-200 dark:bg-gray-600 rounded text-gray-700 dark:text-gray-300">BETA</span>
              </div>
              <ChevronLeft size={16} className="text-gray-400 dark:text-gray-500" />
            </button>

            <Link
              href="/help"
              className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => setIsOpen(false)}
            >
              <span>Get help</span>
            </Link>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 py-1">
            <Link
              href="/dashboard/billing"
              className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => setIsOpen(false)}
            >
              <span>View all plans</span>
            </Link>

            <button
              className={`w-full flex items-center justify-between px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 ${showLearnMoreMenu ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
              onMouseEnter={handleLearnMoreMenuEnter}
              onMouseLeave={handleLearnMoreMenuLeave}
              onClick={() => {
                if (showLearnMoreMenu && !learnMoreMenuClicked) {
                  // If menu is open from hover, first click should make it persistent
                  setLearnMoreMenuClicked(true);
                } else {
                  // Toggle menu
                  setShowLearnMoreMenu(!showLearnMoreMenu);
                  setLearnMoreMenuClicked(!showLearnMoreMenu);
                }
                // Close other menu
                setShowLanguageMenu(false);
                setLanguageMenuClicked(false);
              }}
            >
              <span>Learn more</span>
              <ChevronLeft size={16} className="text-gray-400 dark:text-gray-500" />
            </button>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => {
                setIsOpen(false);
                handleLogout();
              }}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Log out
            </button>
          </div>
        </div>
        
        {/* Language Submenu - Separate floating menu */}
        {showLanguageMenu && (
          <div
            className="absolute right-[256px] top-[120px] w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-[60] border border-gray-200 dark:border-gray-700"
            onMouseEnter={handleLanguageMenuEnter}
            onMouseLeave={handleLanguageMenuLeave}
          >
            <button
              className="w-full flex items-center justify-between px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => {
                setSelectedLanguage("en");
                setShowLanguageMenu(false);
                setLanguageMenuClicked(false);
                localStorage.setItem("language", "en");
              }}
            >
              <span>English</span>
              {selectedLanguage === "en" && <Check size={16} className="text-green-600 dark:text-green-400" />}
            </button>
            <div className="border-t border-gray-200 dark:border-gray-700"></div>
            <button
              className="w-full flex items-center justify-between px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => {
                setSelectedLanguage("es");
                setShowLanguageMenu(false);
                setLanguageMenuClicked(false);
                localStorage.setItem("language", "es");
              }}
            >
              <span>Español</span>
              {selectedLanguage === "es" && <Check size={16} className="text-green-600 dark:text-green-400" />}
            </button>
          </div>
        )}

        {/* Learn More Submenu - Separate floating menu */}
        {showLearnMoreMenu && (
          <div
            className="absolute right-[256px] top-[240px] w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-[60] border border-gray-200 dark:border-gray-700"
            onMouseEnter={handleLearnMoreMenuEnter}
            onMouseLeave={handleLearnMoreMenuLeave}
          >
            <Link
              href="/about"
              className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => {
                setIsOpen(false);
                setShowLearnMoreMenu(false);
                setLearnMoreMenuClicked(false);
              }}
            >
              About Us
            </Link>
            <Link
              href="/feedback"
              className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => {
                setIsOpen(false);
                setShowLearnMoreMenu(false);
                setLearnMoreMenuClicked(false);
              }}
            >
              Feedback
            </Link>
            <div className="border-t border-gray-200 dark:border-gray-700"></div>
            <Link
              href="/terms"
              className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => {
                setIsOpen(false);
                setShowLearnMoreMenu(false);
                setLearnMoreMenuClicked(false);
              }}
            >
              Terms of Service
            </Link>
            <Link
              href="/privacy"
              className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => {
                setIsOpen(false);
                setShowLearnMoreMenu(false);
                setLearnMoreMenuClicked(false);
              }}
            >
              Privacy Policy
            </Link>
          </div>
        )}
        </>
      )}
    </div>
  );
}