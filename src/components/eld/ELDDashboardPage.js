"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  Satellite,
  Clock,
  Settings,
  RefreshCw,
  MapPin,
  LayoutGrid
} from 'lucide-react';
import { useELDRealtime } from '@/hooks/useELDRealtime';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { FeatureGate } from '@/components/billing/FeatureGate';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useTranslation } from '@/context/LanguageContext';
import Link from 'next/link';

// Dynamically import heavy components
import dynamic from 'next/dynamic';

const GPSTrackingMap = dynamic(() => import('./GPSTrackingMap'), {
  ssr: false,
  loading: () => <MapLoadingSkeleton />
});

const HOSDashboard = dynamic(() => import('./HOSDashboard'), {
  ssr: false,
  loading: () => <CardLoadingSkeleton />
});

const HOSViolationAlert = dynamic(() => import('./HOSViolationAlert'), {
  ssr: false,
  loading: () => <AlertLoadingSkeleton />
});

const ELDAlertBanner = dynamic(() => import('./ELDAlertBanner'), {
  ssr: false,
  loading: () => null
});

// Loading skeletons
function MapLoadingSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 h-96 animate-pulse">
      <div className="h-full bg-gray-200 dark:bg-gray-700 rounded-xl" />
    </div>
  );
}

function CardLoadingSkeleton({ small = false }) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 animate-pulse ${small ? 'h-24' : 'h-64'}`}>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-3" />
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
    </div>
  );
}

function AlertLoadingSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 animate-pulse">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-3" />
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Header skeleton */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-700 dark:to-blue-600 rounded-xl shadow-lg p-6 mb-6">
        <div className="h-8 bg-white/20 rounded w-48 mb-2"></div>
        <div className="h-4 bg-white/20 rounded w-72"></div>
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
          </div>
        ))}
      </div>

      {/* Content skeleton */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 h-96"></div>
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 h-44"></div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 h-44"></div>
        </div>
      </div>
    </div>
  );
}

/**
 * ELDDashboardPage - Main ELD Dashboard with real-time data
 *
 * Integrates GPS tracking, HOS monitoring, and alerts
 */
export default function ELDDashboardPage() {
  const { t } = useTranslation('common');
  const [user, setUser] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [viewMode, setViewMode] = useState('dashboard'); // dashboard | hos | map
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  const { canAccess } = useFeatureAccess();
  const hasELDAccess = canAccess('eldIntegration');

  // Get user on mount
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = '/login';
        return;
      }
      setUser(user);
      setInitialLoading(false);
    };
    getUser();
  }, []);

  // Real-time ELD data — child components (GPSTrackingMap, HOSDashboard,
  // HOSViolationAlert) subscribe to their own slices. The page reads
  // vehicles/drivers only to detect the "totally empty" onboarding case and
  // collapse three identical empty cards into one welcome card.
  const {
    vehicles,
    drivers,
    hasCriticalFaults,
    loading,
    refresh
  } = useELDRealtime(user?.id);

  const isFullyEmpty = !loading && !vehicles?.length && !drivers?.length;

  const handleDriverSelect = (driver) => {
    setSelectedDriver(driver);
  };

  const handleVehicleSelect = (vehicle) => {
    setSelectedVehicle(vehicle);
  };

  const handleFaultClick = (fault) => {
    // Navigate to vehicle or show fault details
  };

  // Feature gate - show within DashboardLayout
  if (!hasELDAccess) {
    return (
      <DashboardLayout activePage="eld">
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-7xl mx-auto">
            <FeatureGate feature="eldIntegration" fallback="prompt" />
          </div>
        </main>
      </DashboardLayout>
    );
  }

  if (initialLoading) {
    return (
      <DashboardLayout activePage="eld">
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-7xl mx-auto">
            <LoadingSkeleton />
          </div>
        </main>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activePage="eld">
      <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          {/* Header with gradient background */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-700 dark:to-blue-600 rounded-xl shadow-lg p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              {/* Left: Title & Description */}
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Satellite className="h-6 w-6" />
                  ELD Tracking
                </h1>
                <p className="text-blue-100 mt-1">
                  Real-time fleet monitoring and HOS compliance
                </p>
              </div>

              {/* Right: Action Buttons */}
              <div className="flex flex-wrap gap-3">
                {/* Refresh */}
                <button
                  onClick={refresh}
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 bg-blue-500/20 text-white border border-white/30 rounded-lg font-medium hover:bg-blue-500/30 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`h-5 w-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>

                {/* Settings */}
                <Link
                  href="/dashboard/settings/eld"
                  className="inline-flex items-center px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors shadow-sm"
                >
                  <Settings className="h-5 w-5 mr-2" />
                  ELD Settings
                </Link>
              </div>
            </div>
          </div>

          {/* View Mode Tabs — short labels on mobile to prevent two-line wrap. */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-1 mb-6">
            <div className="flex">
              <button
                onClick={() => setViewMode('dashboard')}
                className={`flex-1 flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  viewMode === 'dashboard'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <LayoutGrid size={18} />
                <span className="hidden sm:inline">Dashboard</span>
                <span className="sm:hidden">Overview</span>
              </button>
              <button
                onClick={() => setViewMode('hos')}
                className={`flex-1 flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  viewMode === 'hos'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Clock size={18} />
                <span className="hidden sm:inline">HOS Compliance</span>
                <span className="sm:hidden">HOS</span>
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`flex-1 flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  viewMode === 'map'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <MapPin size={18} />
                <span className="hidden sm:inline">Live Map</span>
                <span className="sm:hidden">Map</span>
              </button>
            </div>
          </div>

          {/* Alert Banner */}
          {hasCriticalFaults && (
            <div className="mb-6">
              <ELDAlertBanner onFaultClick={handleFaultClick} />
            </div>
          )}

          {/* Unified onboarding card — only shows when neither vehicles nor
              drivers are reporting from any ELD provider. Replaces three
              near-identical "No data" cards that used to stack here. */}
          {isFullyEmpty && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden mb-6">
              <div className="bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 p-8 sm:p-12 text-center">
                <div className="inline-flex p-4 bg-blue-100 dark:bg-blue-900/40 rounded-2xl mb-4">
                  <Satellite size={36} className="text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  Get real-time visibility into your fleet
                </h2>
                <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto mb-6">
                  Connect your Motive or Samsara account to see live GPS positions,
                  driver Hours-of-Service status, and DOT violation alerts — all in one place.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link
                    href="/dashboard/settings/eld"
                    className="inline-flex items-center justify-center px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                  >
                    <Settings size={16} className="mr-2" />
                    Connect ELD Provider
                  </Link>
                  <a
                    href="https://www.truckcommand.com/contact"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-5 py-2.5 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 transition-colors"
                  >
                    Need help? Talk to support
                  </a>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-200 dark:divide-gray-700 border-t border-gray-200 dark:border-gray-700">
                <div className="p-4 text-center">
                  <MapPin size={20} className="mx-auto text-blue-500 mb-1" />
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Live GPS tracking</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">See where every truck is right now</p>
                </div>
                <div className="p-4 text-center">
                  <Clock size={20} className="mx-auto text-indigo-500 mb-1" />
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">HOS compliance</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Drive / shift / cycle countdowns per driver</p>
                </div>
                <div className="p-4 text-center">
                  <LayoutGrid size={20} className="mx-auto text-purple-500 mb-1" />
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Fault alerts</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Vehicle diagnostic codes in real time</p>
                </div>
              </div>
            </div>
          )}

          {/* Dashboard View — the top stat strip used to duplicate the counts
              that already appear inside the Fleet GPS and HOS cards (Vehicles
              vs Total Vehicles, Driving vs Moving, etc.), so it's been removed
              to reduce noise. */}
          {!isFullyEmpty && viewMode === 'dashboard' && (
            <div className="space-y-6">
              {/* Two Column Layout */}
              <div className="grid lg:grid-cols-2 gap-6">
                {/* GPS Map */}
                <div className="lg:col-span-1">
                  <GPSTrackingMap onVehicleSelect={handleVehicleSelect} />
                </div>

                {/* HOS & Alerts */}
                <div className="lg:col-span-1 space-y-6">
                  {/* Violation Alerts */}
                  <HOSViolationAlert onDriverClick={handleDriverSelect} />

                  {/* HOS Dashboard (Compact) */}
                  <HOSDashboard onDriverSelect={handleDriverSelect} compact />
                </div>
              </div>
            </div>
          )}

          {/* HOS View */}
          {!isFullyEmpty && viewMode === 'hos' && (
            <div className="space-y-6">
              {/* HOS Alerts */}
              <HOSViolationAlert onDriverClick={handleDriverSelect} />

              {/* Full HOS Dashboard */}
              <HOSDashboard onDriverSelect={handleDriverSelect} />
            </div>
          )}

          {/* Map View */}
          {!isFullyEmpty && viewMode === 'map' && (
            <div className="space-y-6">
              {/* Full Map — pass a taller map height instead of clamping the
                  whole card to 600px (which used to clip the vehicle list on
                  narrow viewports). */}
              <GPSTrackingMap
                onVehicleSelect={handleVehicleSelect}
                mapHeightClass="h-[60vh] min-h-[400px]"
              />
            </div>
          )}
        </div>
      </main>
    </DashboardLayout>
  );
}
