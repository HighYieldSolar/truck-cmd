// src/components/UserDropdown.js
"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useSubscription } from "@/context/SubscriptionContext";
import { useLanguage, useTranslation, SUPPORTED_LANGUAGES } from "@/context/LanguageContext";
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
  const dropdownRef = useRef(null);
  const languageTimeoutRef = useRef(null);
  const learnMoreTimeoutRef = useRef(null);
  const router = useRouter();
  const { user, userProfile, subscription } = useSubscription();
  const { language: currentLanguage, setLanguage } = useLanguage();
  const { t } = useTranslation('common');

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
      // Logout failed, redirect anyway
      router.push('/login');
    }
  };

  // Get user's current plan name
  const getPlanName = () => {
    if (!subscription) return t('userDropdown.freeTrial');

    const plan = subscription.plan || 'basic';

    switch(plan) {
      case 'basic': return t('userDropdown.basicPlan');
      case 'premium': return t('userDropdown.premiumPlan');
      case 'premium-trial': return 'Premium Trial';
      case 'fleet': return t('userDropdown.fleetPlan');
      default: return t('userDropdown.freeTrial');
    }
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className="flex items-center space-x-1 focus:outline-none group"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label="User menu"
        aria-haspopup="true"
      >
        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-700 dark:text-blue-400 font-semibold ring-2 ring-transparent group-hover:ring-blue-400 dark:group-hover:ring-blue-500 group-hover:bg-blue-200 dark:group-hover:bg-blue-800 transition-all duration-200 ease-in-out overflow-hidden">
          {userProfile?.avatarUrl ? (
            <img
              src={userProfile.avatarUrl}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            user?.email?.[0]?.toUpperCase() || 'U'
          )}
        </div>
        <ChevronDown size={16} className="text-gray-500 dark:text-gray-400 ml-1 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors duration-200" />
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
              className="flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-150 ease-in-out"
              onClick={() => setIsOpen(false)}
            >
              <span>{t('userDropdown.settings')}</span>
            </Link>

            <button
              className={`w-full flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-150 ease-in-out ${showLanguageMenu ? 'bg-blue-50 dark:bg-gray-700 text-blue-600 dark:text-blue-400' : ''}`}
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
                <span>{t('userDropdown.language')}</span>
                <span className="ml-2 px-1.5 py-0.5 text-xs bg-gray-200 dark:bg-gray-600 rounded text-gray-700 dark:text-gray-300">BETA</span>
              </div>
              <ChevronLeft size={16} className="text-gray-400 dark:text-gray-500" />
            </button>

            <Link
              href="/help"
              className="block px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-150 ease-in-out"
              onClick={() => setIsOpen(false)}
            >
              <span>{t('userDropdown.getHelp')}</span>
            </Link>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 py-1">
            <Link
              href="/dashboard/upgrade"
              className="block px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-150 ease-in-out"
              onClick={() => setIsOpen(false)}
            >
              <span>{t('userDropdown.viewAllPlans')}</span>
            </Link>

            <button
              className={`w-full flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-150 ease-in-out ${showLearnMoreMenu ? 'bg-blue-50 dark:bg-gray-700 text-blue-600 dark:text-blue-400' : ''}`}
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
              <span>{t('userDropdown.learnMore')}</span>
              <ChevronLeft size={16} className="text-gray-400 dark:text-gray-500" />
            </button>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => {
                setIsOpen(false);
                handleLogout();
              }}
              className="block w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-all duration-150 ease-in-out"
            >
              {t('userDropdown.logOut')}
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
            {Object.values(SUPPORTED_LANGUAGES).map((lang, index) => (
              <div key={lang.code}>
                {index > 0 && <div className="border-t border-gray-200 dark:border-gray-700"></div>}
                <button
                  className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-150 ease-in-out"
                  onClick={() => {
                    setLanguage(lang.code);
                    setShowLanguageMenu(false);
                    setLanguageMenuClicked(false);
                  }}
                >
                  <span>{lang.nativeName}</span>
                  {currentLanguage === lang.code && <Check size={16} className="text-green-600 dark:text-green-400" />}
                </button>
              </div>
            ))}
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
              className="block px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-150 ease-in-out"
              onClick={() => {
                setIsOpen(false);
                setShowLearnMoreMenu(false);
                setLearnMoreMenuClicked(false);
              }}
            >
              {t('userDropdown.aboutUs')}
            </Link>
            <Link
              href="/feedback"
              className="block px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-150 ease-in-out"
              onClick={() => {
                setIsOpen(false);
                setShowLearnMoreMenu(false);
                setLearnMoreMenuClicked(false);
              }}
            >
              {t('userDropdown.feedback')}
            </Link>
            <div className="border-t border-gray-200 dark:border-gray-700"></div>
            <Link
              href="/terms"
              className="block px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-150 ease-in-out"
              onClick={() => {
                setIsOpen(false);
                setShowLearnMoreMenu(false);
                setLearnMoreMenuClicked(false);
              }}
            >
              {t('userDropdown.termsOfService')}
            </Link>
            <Link
              href="/privacy"
              className="block px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-150 ease-in-out"
              onClick={() => {
                setIsOpen(false);
                setShowLearnMoreMenu(false);
                setLearnMoreMenuClicked(false);
              }}
            >
              {t('userDropdown.privacyPolicy')}
            </Link>
            <Link
              href="/cookies"
              className="block px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-150 ease-in-out"
              onClick={() => {
                setIsOpen(false);
                setShowLearnMoreMenu(false);
                setLearnMoreMenuClicked(false);
              }}
            >
              {t('userDropdown.cookiePolicy')}
            </Link>
            <Link
              href="/acceptable-use"
              className="block px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-150 ease-in-out"
              onClick={() => {
                setIsOpen(false);
                setShowLearnMoreMenu(false);
                setLearnMoreMenuClicked(false);
              }}
            >
              {t('userDropdown.acceptableUse')}
            </Link>
          </div>
        )}
        </>
      )}
    </div>
  );
}