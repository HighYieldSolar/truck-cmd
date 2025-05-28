"use client";

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { MapPin, Truck, BarChart2 } from 'lucide-react';

// Dynamically import the StateMileageLogger component
const StateMileageLogger = dynamic(() => import('@/components/drivers/StateMileageLogger'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  ),
});

export default function DriverMileagePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    }>
      <div className="min-h-screen bg-gray-100">
        {/* Page header with gradient background */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-400 shadow-md">
          <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
              <div>
                <h1 className="text-3xl font-bold text-white">State Mileage Tracker</h1>
                <p className="mt-1 text-blue-100">Record, manage and export your state mileage for IFTA reporting</p>
              </div>

              <div className="flex space-x-4 mt-4 md:mt-0">
                <div className="inline-flex items-center px-4 py-1.5 bg-white text-blue-600 text-sm rounded-lg font-medium shadow-sm">
                  <Truck size={16} className="mr-2" />
                  IFTA Compliant
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="py-8 px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all hover:translate-y-[-2px] duration-200">
                <div className="flex items-center mb-3">
                  <div className="bg-blue-100 p-2.5 rounded-lg mr-3">
                    <Truck size={22} className="text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Active Trip Recording</h3>
                </div>
                <p className="text-sm text-gray-600">Add state crossings as you drive to automatically calculate miles by state.</p>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all hover:translate-y-[-2px] duration-200">
                <div className="flex items-center mb-3">
                  <div className="bg-blue-100 p-2.5 rounded-lg mr-3">
                    <MapPin size={22} className="text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">State-by-State Tracking</h3>
                </div>
                <p className="text-sm text-gray-600">Automatically calculate miles driven in each state based on your odometer readings.</p>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all hover:translate-y-[-2px] duration-200">
                <div className="flex items-center mb-3">
                  <div className="bg-blue-100 p-2.5 rounded-lg mr-3">
                    <BarChart2 size={22} className="text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">IFTA Mileage Reports</h3>
                </div>
                <p className="text-sm text-gray-600">Export your trip data in IFTA-compatible format for easy quarterly filings.</p>
              </div>
            </div>
          </div>

          <StateMileageLogger />
        </div>
      </div>
    </Suspense>
  );
}