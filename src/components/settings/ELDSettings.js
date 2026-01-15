"use client";

import { useState, useCallback } from 'react';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { FeatureGate } from '@/components/billing/FeatureGate';
import ELDConnectionManager from '@/components/eld/ELDConnectionManager';
import {
  Zap,
  Clock,
  MapPin,
  Wrench,
  FileText,
  Lock,
  CheckCircle,
  ArrowRight,
  HelpCircle
} from 'lucide-react';
import Link from 'next/link';

/**
 * ELDSettings - Settings panel for ELD integration configuration
 * Production-ready component for connecting Motive & Samsara ELD providers
 */
export default function ELDSettings() {
  const { canAccess, currentTier } = useFeatureAccess();
  const hasEldAccess = canAccess('eldIntegration');
  const [connectionData, setConnectionData] = useState(null);

  const handleConnectionChange = useCallback((data) => {
    setConnectionData(data);
  }, []);

  const isConnected = connectionData?.connected;

  // ELD feature list with tier info and links to feature pages
  const features = [
    {
      id: 'ifta',
      name: 'IFTA Mileage Sync',
      description: 'Automatically import jurisdiction mileage for IFTA reporting',
      icon: FileText,
      feature: 'eldIftaSync',
      tier: 'Premium',
      href: '/dashboard/ifta'
    },
    {
      id: 'hos',
      name: 'HOS Tracking',
      description: 'Monitor driver hours of service and compliance',
      icon: Clock,
      feature: 'eldHosTracking',
      tier: 'Premium',
      href: '/dashboard/eld'
    },
    {
      id: 'gps',
      name: 'GPS Tracking',
      description: 'Real-time vehicle location tracking on an interactive map',
      icon: MapPin,
      feature: 'eldGpsTracking',
      tier: 'Fleet',
      href: '/dashboard/dispatching'
    },
    {
      id: 'diagnostics',
      name: 'Vehicle Diagnostics',
      description: 'Monitor fault codes and receive vehicle health alerts',
      icon: Wrench,
      feature: 'eldDiagnostics',
      tier: 'Fleet',
      href: '/dashboard/fleet'
    }
  ];

  if (!hasEldAccess) {
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Zap size={24} className="text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold text-white">ELD Integration</h2>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-400/90 text-blue-900 text-xs font-semibold rounded-full">
                    <Zap size={10} />
                    Premium Feature
                  </span>
                </div>
                <p className="text-blue-100">Automate your fleet data with Motive & Samsara</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <FeatureGate feature="eldIntegration" fallback="prompt" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ELD Connection Manager */}
      <ELDConnectionManager onConnectionChange={handleConnectionChange} />

      {/* Feature Status - Shows what's available */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="bg-gray-50 dark:bg-gray-700/50 px-5 py-4 border-b border-gray-200 dark:border-gray-600">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-gray-700 dark:text-gray-200">ELD Features</h3>
            {isConnected ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded-full">
                <CheckCircle size={10} />
                Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs font-medium rounded-full">
                Connect to Enable
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isConnected
              ? 'Features available with your ELD connection'
              : 'Connect your ELD provider above to enable these features'
            }
          </p>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {features.map((feature) => {
            const FeatureIcon = feature.icon;
            const hasAccess = canAccess(feature.feature);
            const isFeatureActive = isConnected && hasAccess;

            return (
              <div
                key={feature.id}
                className={`p-4 ${!isFeatureActive ? 'opacity-75' : ''}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                    <div className={`p-2 rounded-lg flex-shrink-0 ${
                      isFeatureActive
                        ? 'bg-green-100 dark:bg-green-900/30'
                        : hasAccess
                        ? 'bg-blue-100 dark:bg-blue-900/30'
                        : 'bg-gray-100 dark:bg-gray-700'
                    }`}>
                      <FeatureIcon size={18} className={
                        isFeatureActive
                          ? 'text-green-600 dark:text-green-400'
                          : hasAccess
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-gray-400'
                      } />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">
                          {feature.name}
                        </h4>
                        {!hasAccess && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs rounded-full">
                            <Lock size={10} />
                            {feature.tier}+
                          </span>
                        )}
                        {isFeatureActive && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full">
                            <CheckCircle size={10} />
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        {feature.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex-shrink-0 pl-11 sm:pl-0">
                    {!hasAccess ? (
                      <Link
                        href="/dashboard/upgrade"
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                      >
                        Upgrade
                      </Link>
                    ) : isFeatureActive ? (
                      <Link
                        href={feature.href}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded-lg transition-colors"
                      >
                        View
                        <ArrowRight size={14} />
                      </Link>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs rounded-full">
                        Connect ELD
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-5">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex-shrink-0">
            <HelpCircle size={20} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
              How ELD Integration Works
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Connect your Motive or Samsara ELD using secure OAuth authentication.
              Once connected, your mileage, HOS logs, GPS locations, and vehicle diagnostics
              will automatically sync to TruckCommand. You can manually trigger syncs or let
              the system sync automatically every hour.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/dashboard/support"
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Contact Support
              </Link>
              <span className="text-gray-300 dark:text-gray-600">|</span>
              <a
                href="https://developer.gomotive.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Motive API Docs
              </a>
              <span className="text-gray-300 dark:text-gray-600">|</span>
              <a
                href="https://developers.samsara.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Samsara API Docs
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
