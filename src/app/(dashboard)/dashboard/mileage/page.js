"use client";

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { MapPin, Truck, BarChart2, Calculator, Route, FileDown, Clock } from 'lucide-react';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { UpgradePrompt } from '@/components/billing/UpgradePrompt';

// Dynamically import the StateMileageLogger component
const StateMileageLogger = dynamic(() => import('@/components/drivers/StateMileageLogger'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  ),
});

// Note: DashboardLayout is provided by mileage/layout.js - do not duplicate here
export default function DriverMileagePage() {
  // Feature access check
  const { canAccess, currentTier, loading: featureLoading } = useFeatureAccess();
  const hasStateMileageAccess = canAccess('stateMileage');

  // Show loading state
  if (featureLoading) {
    return (
      <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </main>
    );
  }

  // Show upgrade prompt for Basic plan users
  if (!hasStateMileageAccess) {
    return (
      <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6 bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-700 dark:to-blue-600 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2.5 rounded-xl">
                <Route size={28} />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">State Mileage Tracker</h1>
                <p className="text-blue-100 dark:text-blue-200 text-sm md:text-base">
                  Upgrade to Premium to access state mileage tracking
                </p>
              </div>
            </div>
          </div>

          {/* Upgrade Prompt */}
          <UpgradePrompt feature="stateMileage" currentTier={currentTier} />

          {/* Feature Preview */}
          <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              What you'll get with State Mileage Tracker:
            </h3>
            <ul className="space-y-3 text-gray-600 dark:text-gray-300">
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
                  <Truck size={16} className="text-blue-600 dark:text-blue-400" />
                </div>
                <span>Active trip recording with state border crossings</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/40 flex items-center justify-center flex-shrink-0">
                  <MapPin size={16} className="text-green-600 dark:text-green-400" />
                </div>
                <span>Automatic state-by-state mileage calculations</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center flex-shrink-0">
                  <BarChart2 size={16} className="text-purple-600 dark:text-purple-400" />
                </div>
                <span>IFTA-compliant mileage reports</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center flex-shrink-0">
                  <FileDown size={16} className="text-orange-600 dark:text-orange-400" />
                </div>
                <span>Export trip data for quarterly IFTA filings</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center flex-shrink-0">
                  <Clock size={16} className="text-indigo-600 dark:text-indigo-400" />
                </div>
                <span>Trip history with date and odometer tracking</span>
              </li>
            </ul>
          </div>
        </div>
      </main>
    );
  }

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    }>
      <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
        <div className="max-w-7xl mx-auto">

          {/* Header */}
          <div className="mb-6 bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-700 dark:to-blue-600 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="mb-4 md:mb-0">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2.5 rounded-xl">
                    <Route size={28} />
                  </div>
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold">State Mileage Tracker</h1>
                    <p className="text-blue-100 dark:text-blue-200 text-sm md:text-base">
                      Record and export your state mileage for IFTA reporting
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/dashboard/ifta"
                  className="px-4 py-2.5 bg-white/20 backdrop-blur-sm text-white border border-white/30 rounded-xl hover:bg-white/30 transition-all duration-200 flex items-center font-medium"
                >
                  <Calculator size={18} className="mr-2" />
                  IFTA Calculator
                </Link>
                <div className="px-4 py-2.5 bg-white text-blue-600 rounded-xl shadow-md flex items-center font-semibold">
                  <Truck size={18} className="mr-2" />
                  IFTA Compliant
                </div>
              </div>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all hover:translate-y-[-2px] duration-200">
              <div className="flex items-center mb-3">
                <div className="bg-blue-100 dark:bg-blue-900/40 p-2.5 rounded-lg mr-3">
                  <Truck size={22} className="text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Active Trip Recording</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Add state crossings as you drive to automatically calculate miles by state.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all hover:translate-y-[-2px] duration-200">
              <div className="flex items-center mb-3">
                <div className="bg-green-100 dark:bg-green-900/40 p-2.5 rounded-lg mr-3">
                  <MapPin size={22} className="text-green-600 dark:text-green-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">State-by-State Tracking</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Automatically calculate miles driven in each state based on your odometer readings.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all hover:translate-y-[-2px] duration-200">
              <div className="flex items-center mb-3">
                <div className="bg-purple-100 dark:bg-purple-900/40 p-2.5 rounded-lg mr-3">
                  <BarChart2 size={22} className="text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">IFTA Mileage Reports</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Export your trip data in IFTA-compatible format for easy quarterly filings.
              </p>
            </div>
          </div>

          {/* Main Content */}
          <StateMileageLogger />
        </div>
      </main>
    </Suspense>
  );
}
