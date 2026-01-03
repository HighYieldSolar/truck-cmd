"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  Clock,
  AlertTriangle,
  CheckCircle,
  Pause,
  Coffee,
  Truck,
  User,
  RefreshCw,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { FeatureGate } from '@/components/billing/FeatureGate';

// HOS Status colors and icons
const HOS_STATUS_CONFIG = {
  OFF_DUTY: {
    label: 'Off Duty',
    icon: Coffee,
    bgColor: 'bg-gray-100 dark:bg-gray-700',
    textColor: 'text-gray-600 dark:text-gray-400',
    badgeColor: 'bg-gray-500'
  },
  SLEEPER: {
    label: 'Sleeper Berth',
    icon: Pause,
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    textColor: 'text-purple-600 dark:text-purple-400',
    badgeColor: 'bg-purple-500'
  },
  DRIVING: {
    label: 'Driving',
    icon: Truck,
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    textColor: 'text-green-600 dark:text-green-400',
    badgeColor: 'bg-green-500'
  },
  ON_DUTY: {
    label: 'On Duty',
    icon: Clock,
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    textColor: 'text-blue-600 dark:text-blue-400',
    badgeColor: 'bg-blue-500'
  },
  YARD_MOVES: {
    label: 'Yard Moves',
    icon: Truck,
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    textColor: 'text-amber-600 dark:text-amber-400',
    badgeColor: 'bg-amber-500'
  },
  PERSONAL_CONVEYANCE: {
    label: 'Personal Use',
    icon: User,
    bgColor: 'bg-cyan-100 dark:bg-cyan-900/30',
    textColor: 'text-cyan-600 dark:text-cyan-400',
    badgeColor: 'bg-cyan-500'
  }
};

/**
 * HOSDashboard - Shows HOS compliance status for all drivers
 *
 * @param {function} onDriverSelect - Callback when a driver is clicked
 * @param {boolean} compact - Use compact mode for sidebar widget
 */
export default function HOSDashboard({ onDriverSelect, compact = false }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hosData, setHosData] = useState(null);
  const [error, setError] = useState(null);

  const { canAccess } = useFeatureAccess();
  const hasAccess = canAccess('eldHosTracking');

  useEffect(() => {
    if (hasAccess) {
      loadHosData();
    } else {
      setLoading(false);
    }
  }, [hasAccess]);

  const loadHosData = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) return;

      setUser(user);

      // Call HOS dashboard API
      const response = await fetch('/api/eld/hos/dashboard');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load HOS data');
      }

      setHosData(data);
    } catch (err) {
      console.error('Failed to load HOS data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    await loadHosData();
    setRefreshing(false);
  };

  const formatMinutes = (minutes) => {
    if (!minutes && minutes !== 0) return '--:--';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getTimeWarningClass = (minutes, maxMinutes) => {
    if (!minutes && minutes !== 0) return '';
    const percentage = (minutes / maxMinutes) * 100;
    if (percentage >= 90) return 'text-red-600 dark:text-red-400 font-bold';
    if (percentage >= 75) return 'text-amber-600 dark:text-amber-400';
    return 'text-green-600 dark:text-green-400';
  };

  // Feature gate check
  if (!hasAccess) {
    return (
      <FeatureGate feature="eldHosTracking" fallback="prompt" />
    );
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 size={32} className="animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="text-center py-6">
          <AlertTriangle size={32} className="mx-auto text-red-500 mb-3" />
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
          <button
            onClick={handleRefresh}
            className="mt-3 text-blue-600 dark:text-blue-400 hover:underline"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!hosData?.drivers?.length) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="text-center py-8">
          <Clock size={32} className="mx-auto text-gray-400 mb-3" />
          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">No HOS Data Available</h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Connect your ELD provider to see driver hours of service.
          </p>
        </div>
      </div>
    );
  }

  // Compact mode for sidebar widget
  if (compact) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-3 border-b border-gray-200 dark:border-gray-600 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-blue-600 dark:text-blue-400" />
            <h3 className="font-medium text-gray-700 dark:text-gray-200">HOS Status</h3>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {hosData.drivers.slice(0, 5).map((driver) => {
            const statusConfig = HOS_STATUS_CONFIG[driver.status] || HOS_STATUS_CONFIG.OFF_DUTY;
            const StatusIcon = statusConfig.icon;

            return (
              <div
                key={driver.id}
                onClick={() => onDriverSelect?.(driver)}
                className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${statusConfig.badgeColor}`} />
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-[120px]">
                      {driver.name}
                    </span>
                  </div>
                  <span className={`text-xs ${getTimeWarningClass(driver.driveTimeRemaining, 660)}`}>
                    {formatMinutes(driver.driveTimeRemaining)} drive
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {hosData.drivers.length > 5 && (
          <div className="px-4 py-2 text-center border-t border-gray-200 dark:border-gray-700">
            <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
              View All {hosData.drivers.length} Drivers
            </button>
          </div>
        )}
      </div>
    );
  }

  // Full dashboard mode
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Clock size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">HOS Compliance</h3>
              <p className="text-sm text-blue-100">Driver Hours of Service Status</p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white text-sm transition-colors"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 border-b border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {hosData.summary?.totalDrivers || 0}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Drivers</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {hosData.summary?.driving || 0}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Currently Driving</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {hosData.summary?.onDuty || 0}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">On Duty</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
            {hosData.summary?.violations || 0}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Violations</p>
        </div>
      </div>

      {/* Driver List */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {hosData.drivers.map((driver) => {
          const statusConfig = HOS_STATUS_CONFIG[driver.status] || HOS_STATUS_CONFIG.OFF_DUTY;
          const StatusIcon = statusConfig.icon;

          return (
            <div
              key={driver.id}
              onClick={() => onDriverSelect?.(driver)}
              className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${statusConfig.bgColor}`}>
                    <StatusIcon size={18} className={statusConfig.textColor} />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">
                      {driver.name}
                    </h4>
                    <span className={`text-sm ${statusConfig.textColor}`}>
                      {statusConfig.label}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {driver.hasViolation && (
                    <span className="flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs rounded-full">
                      <AlertTriangle size={12} />
                      Violation
                    </span>
                  )}
                  <ChevronRight size={20} className="text-gray-400" />
                </div>
              </div>

              {/* Time Remaining */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className={`text-lg font-semibold ${getTimeWarningClass(driver.driveTimeRemaining, 660)}`}>
                    {formatMinutes(driver.driveTimeRemaining)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Drive Time Left</p>
                </div>
                <div>
                  <p className={`text-lg font-semibold ${getTimeWarningClass(driver.shiftTimeRemaining, 840)}`}>
                    {formatMinutes(driver.shiftTimeRemaining)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Shift Time Left</p>
                </div>
                <div>
                  <p className={`text-lg font-semibold ${getTimeWarningClass(driver.cycleTimeRemaining, 4200)}`}>
                    {formatMinutes(driver.cycleTimeRemaining)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Cycle Time Left</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Last Updated */}
      {hosData.lastUpdated && (
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 text-center text-xs text-gray-500 dark:text-gray-400">
          Last updated: {new Date(hosData.lastUpdated).toLocaleString()}
        </div>
      )}
    </div>
  );
}
