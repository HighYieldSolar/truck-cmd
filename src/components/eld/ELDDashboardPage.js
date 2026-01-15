"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  Satellite,
  Clock,
  AlertTriangle,
  Settings,
  RefreshCw,
  MapPin,
  Truck,
  Users,
  LayoutGrid,
  Link as LinkIcon
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

  // Real-time ELD data
  const {
    vehicles,
    vehiclesLoading,
    drivers,
    driversWithViolations,
    driversByStatus,
    driversLoading,
    faults,
    criticalFaults,
    hasCriticalFaults,
    faultsLoading,
    loading,
    error,
    refresh
  } = useELDRealtime(user?.id);

  const handleDriverSelect = (driver) => {
    setSelectedDriver(driver);
  };

  const handleVehicleSelect = (vehicle) => {
    setSelectedVehicle(vehicle);
  };

  const handleFaultClick = (fault) => {
    // Navigate to vehicle or show fault details
    console.log('Fault clicked:', fault);
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

          {/* View Mode Tabs */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-1 mb-6">
            <div className="flex">
              <button
                onClick={() => setViewMode('dashboard')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === 'dashboard'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <LayoutGrid size={18} />
                Dashboard
              </button>
              <button
                onClick={() => setViewMode('hos')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === 'hos'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Clock size={18} />
                HOS Compliance
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === 'map'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <MapPin size={18} />
                Live Map
              </button>
            </div>
          </div>

          {/* Alert Banner */}
          {hasCriticalFaults && (
            <div className="mb-6">
              <ELDAlertBanner onFaultClick={handleFaultClick} />
            </div>
          )}

          {/* Dashboard View */}
          {viewMode === 'dashboard' && (
            <div className="space-y-6">
              {/* Stats Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <Truck size={20} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {vehicles?.length || 0}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Vehicles</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                      <Users size={20} className="text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {drivers?.length || 0}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Drivers</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <Truck size={20} className="text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {driversByStatus?.driving?.length || 0}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Driving</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                      <AlertTriangle size={20} className="text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {driversWithViolations?.length || 0}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Violations</p>
                    </div>
                  </div>
                </div>
              </div>

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
          {viewMode === 'hos' && (
            <div className="space-y-6">
              {/* HOS Alerts */}
              <HOSViolationAlert onDriverClick={handleDriverSelect} />

              {/* Full HOS Dashboard */}
              <HOSDashboard onDriverSelect={handleDriverSelect} />
            </div>
          )}

          {/* Map View */}
          {viewMode === 'map' && (
            <div className="space-y-6">
              {/* Full Map */}
              <GPSTrackingMap
                onVehicleSelect={handleVehicleSelect}
                className="h-[600px]"
              />
            </div>
          )}
        </div>
      </main>
    </DashboardLayout>
  );
}
