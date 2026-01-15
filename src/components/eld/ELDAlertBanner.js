"use client";

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  X,
  ChevronRight,
  Truck,
  Wrench,
  RefreshCw
} from 'lucide-react';
import { useRealtimeFaultCodes } from '@/hooks/useELDRealtime';

// Severity configuration
const SEVERITY_CONFIG = {
  critical: {
    bgColor: 'bg-red-600 dark:bg-red-700',
    hoverColor: 'hover:bg-red-700 dark:hover:bg-red-800',
    icon: AlertTriangle,
    textColor: 'text-white',
    badge: 'bg-red-800'
  },
  warning: {
    bgColor: 'bg-amber-500 dark:bg-amber-600',
    hoverColor: 'hover:bg-amber-600 dark:hover:bg-amber-700',
    icon: AlertCircle,
    textColor: 'text-white',
    badge: 'bg-amber-700'
  },
  info: {
    bgColor: 'bg-blue-500 dark:bg-blue-600',
    hoverColor: 'hover:bg-blue-600 dark:hover:bg-blue-700',
    icon: Info,
    textColor: 'text-white',
    badge: 'bg-blue-700'
  }
};

/**
 * ELDAlertBanner - Banner component for vehicle fault code alerts
 *
 * Displays at the top of the dashboard when vehicles have active fault codes.
 * Critical faults are shown immediately; others can be expanded.
 *
 * @param {function} onFaultClick - Callback when a fault is clicked
 * @param {boolean} collapsible - Allow banner to be collapsed
 * @param {string} className - Additional CSS classes
 */
export default function ELDAlertBanner({
  onFaultClick,
  collapsible = true,
  className = ''
}) {
  const [user, setUser] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [dismissedFaults, setDismissedFaults] = useState(new Set());

  // Get user on mount
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  // Use real-time subscription hook
  const {
    faults,
    criticalFaults,
    warningFaults,
    infoFaults,
    hasCritical,
    loading,
    error,
    refresh
  } = useRealtimeFaultCodes(user?.id);

  // Filter out dismissed faults
  const activeFaults = useMemo(() => {
    return faults.filter(f => !dismissedFaults.has(f.id));
  }, [faults, dismissedFaults]);

  const activeCriticalFaults = useMemo(() => {
    return criticalFaults.filter(f => !dismissedFaults.has(f.id));
  }, [criticalFaults, dismissedFaults]);

  const activeWarningFaults = useMemo(() => {
    return warningFaults.filter(f => !dismissedFaults.has(f.id));
  }, [warningFaults, dismissedFaults]);

  const handleDismiss = (faultId, e) => {
    e.stopPropagation();
    setDismissedFaults(prev => new Set([...prev, faultId]));
  };

  const handleFaultClick = (fault) => {
    if (onFaultClick) {
      onFaultClick({
        id: fault.id,
        vehicleId: fault.vehicle_id,
        eldVehicleId: fault.eld_vehicle_id,
        code: fault.code,
        description: fault.description,
        severity: fault.severity,
        source: fault.source,
        firstObservedAt: fault.first_observed_at,
        lastObservedAt: fault.last_observed_at
      });
    }
  };

  // No faults to show
  if (!loading && !activeFaults.length) {
    return null;
  }

  // Loading state - don't show anything
  if (loading) {
    return null;
  }

  // Error state
  if (error) {
    return (
      <div className={`bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-3 ${className}`}>
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
          <AlertCircle size={16} />
          <span className="text-sm">Failed to load fault codes: {error}</span>
        </div>
      </div>
    );
  }

  // Get the most severe fault for banner styling
  const bannerSeverity = activeCriticalFaults.length > 0 ? 'critical' :
    activeWarningFaults.length > 0 ? 'warning' : 'info';
  const config = SEVERITY_CONFIG[bannerSeverity];
  const Icon = config.icon;

  // Collapsed view - just show count
  if (isCollapsed && collapsible) {
    return (
      <button
        onClick={() => setIsCollapsed(false)}
        className={`
          ${config.bgColor} ${config.hoverColor}
          w-full rounded-lg px-4 py-2 transition-colors
          flex items-center justify-between
          ${className}
        `}
      >
        <div className="flex items-center gap-2">
          <Icon size={18} className={config.textColor} />
          <span className={`text-sm font-medium ${config.textColor}`}>
            {activeFaults.length} Vehicle Fault{activeFaults.length !== 1 ? 's' : ''}
            {activeCriticalFaults.length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 bg-white/20 rounded text-xs">
                {activeCriticalFaults.length} Critical
              </span>
            )}
          </span>
        </div>
        <ChevronRight size={18} className={config.textColor} />
      </button>
    );
  }

  return (
    <div className={`${config.bgColor} rounded-lg overflow-hidden ${className}`}>
      {/* Banner Header */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <Icon size={20} className={config.textColor} />
          </div>
          <div>
            <h3 className={`font-semibold ${config.textColor}`}>
              Vehicle Fault Alerts
            </h3>
            <p className={`text-sm ${config.textColor} opacity-90`}>
              {activeFaults.length} active fault{activeFaults.length !== 1 ? 's' : ''} detected
              {activeCriticalFaults.length > 0 && (
                <span className="ml-2 px-1.5 py-0.5 bg-white/20 rounded text-xs">
                  {activeCriticalFaults.length} Critical
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refresh()}
            className={`p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors`}
            title="Refresh"
          >
            <RefreshCw size={16} className={config.textColor} />
          </button>
          {collapsible && (
            <button
              onClick={() => setIsCollapsed(true)}
              className={`p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors`}
              title="Collapse"
            >
              <X size={16} className={config.textColor} />
            </button>
          )}
        </div>
      </div>

      {/* Fault List */}
      <div className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700 max-h-64 overflow-y-auto">
        {activeFaults.map(fault => {
          const faultConfig = SEVERITY_CONFIG[fault.severity] || SEVERITY_CONFIG.info;
          const FaultIcon = faultConfig.icon;

          return (
            <div
              key={fault.id}
              onClick={() => handleFaultClick(fault)}
              className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className={`
                  p-2 rounded-lg
                  ${fault.severity === 'critical' ? 'bg-red-100 dark:bg-red-900/30' :
                    fault.severity === 'warning' ? 'bg-amber-100 dark:bg-amber-900/30' :
                    'bg-blue-100 dark:bg-blue-900/30'}
                `}>
                  <Wrench size={16} className={`
                    ${fault.severity === 'critical' ? 'text-red-600 dark:text-red-400' :
                      fault.severity === 'warning' ? 'text-amber-600 dark:text-amber-400' :
                      'text-blue-600 dark:text-blue-400'}
                  `} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {fault.code}
                    </span>
                    <span className={`
                      px-1.5 py-0.5 text-xs rounded font-medium
                      ${fault.severity === 'critical' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' :
                        fault.severity === 'warning' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' :
                        'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'}
                    `}>
                      {fault.severity}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {fault.description || 'Unknown fault'}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-500">
                    <Truck size={12} />
                    <span>{fault.eld_vehicle_id}</span>
                    {fault.source && (
                      <>
                        <span className="text-gray-300 dark:text-gray-600">|</span>
                        <span>{fault.source}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 ml-3">
                <button
                  onClick={(e) => handleDismiss(fault.id, e)}
                  className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                  title="Dismiss"
                >
                  <X size={14} className="text-gray-400" />
                </button>
                <ChevronRight size={16} className="text-gray-400" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
