"use client";

import { useState } from 'react';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { FeatureGate } from '@/components/billing/FeatureGate';
import ELDConnectionManager from '@/components/eld/ELDConnectionManager';
import {
  Zap,
  Clock,
  MapPin,
  Wrench,
  FileText,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  Lock
} from 'lucide-react';
import Link from 'next/link';

/**
 * ELDSettings - Settings panel for ELD integration configuration
 */
export default function ELDSettings() {
  const { canAccess, currentTier } = useFeatureAccess();
  const hasEldAccess = canAccess('eldIntegration');
  const hasGpsAccess = canAccess('eldGpsTracking');
  const hasDiagnosticsAccess = canAccess('eldDiagnostics');

  const [expandedSection, setExpandedSection] = useState(null);

  // ELD feature list with tier info
  const features = [
    {
      id: 'ifta',
      name: 'IFTA Mileage Sync',
      description: 'Automatically import jurisdiction mileage for IFTA reporting',
      icon: FileText,
      feature: 'eldIftaSync',
      tier: 'Premium'
    },
    {
      id: 'hos',
      name: 'HOS Tracking',
      description: 'Monitor driver hours of service and compliance',
      icon: Clock,
      feature: 'eldHosTracking',
      tier: 'Premium'
    },
    {
      id: 'gps',
      name: 'GPS Tracking',
      description: 'Real-time vehicle location tracking on an interactive map',
      icon: MapPin,
      feature: 'eldGpsTracking',
      tier: 'Fleet'
    },
    {
      id: 'diagnostics',
      name: 'Vehicle Diagnostics',
      description: 'Monitor fault codes and receive vehicle health alerts',
      icon: Wrench,
      feature: 'eldDiagnostics',
      tier: 'Fleet'
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
                <h2 className="text-xl font-semibold text-white">ELD Integration</h2>
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
      <ELDConnectionManager />

      {/* Feature Status */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="bg-gray-50 dark:bg-gray-700/50 px-5 py-4 border-b border-gray-200 dark:border-gray-600">
          <h3 className="font-medium text-gray-700 dark:text-gray-200">ELD Features</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Features available with your {currentTier} plan
          </p>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {features.map((feature) => {
            const FeatureIcon = feature.icon;
            const hasAccess = canAccess(feature.feature);

            return (
              <div
                key={feature.id}
                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      hasAccess
                        ? 'bg-blue-100 dark:bg-blue-900/30'
                        : 'bg-gray-100 dark:bg-gray-700'
                    }`}>
                      <FeatureIcon size={18} className={
                        hasAccess
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-gray-400'
                      } />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">
                          {feature.name}
                        </h4>
                        {!hasAccess && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs rounded-full">
                            <Lock size={10} />
                            {feature.tier}+
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {feature.description}
                      </p>
                    </div>
                  </div>

                  <div>
                    {hasAccess ? (
                      <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                        <CheckCircle size={18} />
                        <span className="text-sm">Enabled</span>
                      </span>
                    ) : (
                      <Link
                        href="/dashboard/upgrade"
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                      >
                        Upgrade
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sync Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div
          className="bg-gray-50 dark:bg-gray-700/50 px-5 py-4 border-b border-gray-200 dark:border-gray-600 flex items-center justify-between cursor-pointer"
          onClick={() => setExpandedSection(expandedSection === 'sync' ? null : 'sync')}
        >
          <div>
            <h3 className="font-medium text-gray-700 dark:text-gray-200">Sync Settings</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Configure automatic data synchronization
            </p>
          </div>
          {expandedSection === 'sync' ? (
            <ChevronUp size={20} className="text-gray-400" />
          ) : (
            <ChevronDown size={20} className="text-gray-400" />
          )}
        </div>

        {expandedSection === 'sync' && (
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  Automatic Hourly Sync
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Data is automatically synced every hour
                </p>
              </div>
              <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm rounded-full">
                Active
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  Real-time Webhooks
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Receive instant updates for critical events
                </p>
              </div>
              <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm rounded-full">
                Enabled
              </span>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Sync settings are optimized for your plan. Contact support for custom sync intervals.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Data Source Preferences */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div
          className="bg-gray-50 dark:bg-gray-700/50 px-5 py-4 border-b border-gray-200 dark:border-gray-600 flex items-center justify-between cursor-pointer"
          onClick={() => setExpandedSection(expandedSection === 'data' ? null : 'data')}
        >
          <div>
            <h3 className="font-medium text-gray-700 dark:text-gray-200">Data Source Preferences</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Choose primary data sources for IFTA reporting
            </p>
          </div>
          {expandedSection === 'data' ? (
            <ChevronUp size={20} className="text-gray-400" />
          ) : (
            <ChevronDown size={20} className="text-gray-400" />
          )}
        </div>

        {expandedSection === 'data' && (
          <div className="p-5 space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              You can choose your preferred data source when generating IFTA reports:
            </p>

            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <div className="p-1.5 bg-blue-100 dark:bg-blue-900/50 rounded">
                  <Zap size={16} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">ELD Data (Recommended)</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Automatically imported from your connected ELD provider
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700">
                <div className="p-1.5 bg-gray-100 dark:bg-gray-700 rounded">
                  <FileText size={16} className="text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">Manual Entry</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Trips and mileage entered via State Mileage Tracker
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700">
                <div className="p-1.5 bg-gray-100 dark:bg-gray-700 rounded">
                  <CheckCircle size={16} className="text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">Combined</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Merge ELD and manual data for complete coverage
                  </p>
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 pt-2">
              Data source can be selected per report in the IFTA Calculator.
            </p>
          </div>
        )}
      </div>

      {/* Help Section */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-5">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex-shrink-0">
            <Zap size={20} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
              Need Help with ELD Integration?
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Connect your Motive or Samsara ELD device for automatic data synchronization.
              Connection uses secure OAuth and typically takes less than 2 minutes.
            </p>
            <div className="flex flex-wrap gap-2">
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
              <span className="text-gray-300 dark:text-gray-600">|</span>
              <Link
                href="/dashboard/support"
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
