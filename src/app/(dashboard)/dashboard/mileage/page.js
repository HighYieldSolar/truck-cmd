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
        {/* Page header - shown while loading */}
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">State Mileage Tracker</h1>
                <p className="mt-1 text-sm text-gray-500">Record, manage and export your state mileage for IFTA reporting</p>
              </div>
              
              <div className="flex space-x-4 mt-4 md:mt-0">
                <div className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                  <Truck size={16} className="mr-1" />
                  IFTA Compliant
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="py-6 px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center text-blue-600 mb-2">
                  <Truck size={20} className="mr-2" />
                  <h3 className="font-medium">Active Trip Recording</h3>
                </div>
                <p className="text-sm text-gray-500">Add state crossings as you drive to automatically calculate miles by state.</p>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center text-blue-600 mb-2">
                  <MapPin size={20} className="mr-2" />
                  <h3 className="font-medium">State-by-State Tracking</h3>
                </div>
                <p className="text-sm text-gray-500">Automatically calculate miles driven in each state based on your odometer readings.</p>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center text-blue-600 mb-2">
                  <BarChart2 size={20} className="mr-2" />
                  <h3 className="font-medium">IFTA Mileage Reports</h3>
                </div>
                <p className="text-sm text-gray-500">Export your trip data in IFTA-compatible format for easy quarterly filings.</p>
              </div>
            </div>
          </div>
          
          <StateMileageLogger />
        </div>
      </div>
    </Suspense>
  );
}