"use client";

import Image from 'next/image';
import {
  Zap,
  Clock,
  MapPin,
  FileText,
  Wrench,
  Truck,
  Bell
} from 'lucide-react';

/**
 * ELDConnectionManager - Shows Coming Soon state for ELD integration
 *
 * The ELD integration feature is under development. This component displays
 * a preview of what's coming and the benefits users can expect.
 */
export default function ELDConnectionManager({ onConnectionChange }) {
  // Features that will be available with ELD integration
  const upcomingFeatures = [
    {
      icon: FileText,
      name: 'IFTA Mileage Sync',
      description: 'Auto-import jurisdiction mileage for IFTA reporting'
    },
    {
      icon: Clock,
      name: 'HOS Tracking',
      description: 'Monitor driver hours of service and compliance'
    },
    {
      icon: MapPin,
      name: 'GPS Tracking',
      description: 'Real-time vehicle location on interactive map'
    },
    {
      icon: Wrench,
      name: 'Vehicle Diagnostics',
      description: 'Fault codes and vehicle health monitoring'
    }
  ];

  // Supported ELD providers (coming soon)
  const providers = [
    { name: 'Motive', logo: '/images/eld/motive.webp', color: 'bg-green-500' },
    { name: 'Samsara', logo: '/images/eld/samsara.webp', color: 'bg-blue-500' }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700 p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg flex-shrink-0">
              <Zap size={20} className="text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-white">ELD Integration</h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-400/90 text-amber-900 text-xs font-semibold rounded-full">
                  <Clock size={10} />
                  Coming Soon
                </span>
              </div>
              <p className="text-sm text-blue-100 hidden sm:block">
                Connect your ELD provider for automated data sync
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 sm:p-6">
        {/* Coming Soon Message */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Truck size={28} className="text-amber-600 dark:text-amber-400" />
          </div>
          <h4 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            ELD Integration Coming Soon
          </h4>
          <p className="text-gray-500 dark:text-gray-400 max-w-lg mx-auto">
            We're working hard to bring you seamless ELD integration. Connect your Motive or Samsara
            device to automatically sync mileage, HOS logs, GPS locations, and vehicle diagnostics.
          </p>
        </div>

        {/* Supported Providers Preview */}
        <div className="mb-8">
          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 text-center">
            Supported Providers
          </h5>
          <div className="flex justify-center gap-4">
            {providers.map((provider) => (
              <div
                key={provider.name}
                className="flex flex-col items-center gap-2 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 opacity-75"
              >
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-white dark:bg-gray-800 p-1">
                  <Image
                    src={provider.logo}
                    alt={provider.name}
                    width={48}
                    height={48}
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {provider.name}
                </span>
              </div>
            ))}
            <div className="flex flex-col items-center gap-2 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 opacity-60">
              <div className="w-12 h-12 rounded-lg bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                <span className="text-gray-400 dark:text-gray-500 text-lg">+</span>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                More Soon
              </span>
            </div>
          </div>
        </div>

        {/* Feature Preview */}
        <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 sm:p-5">
          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
            What You'll Get
          </h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {upcomingFeatures.map((feature) => {
              const FeatureIcon = feature.icon;
              return (
                <div
                  key={feature.name}
                  className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600"
                >
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex-shrink-0">
                    <FeatureIcon size={16} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <h6 className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                      {feature.name}
                    </h6>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Notification CTA */}
        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Bell size={14} />
          <span>We'll notify you when ELD integration is available</span>
        </div>
      </div>
    </div>
  );
}
