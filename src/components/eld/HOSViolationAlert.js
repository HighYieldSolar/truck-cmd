"use client";

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  AlertTriangle,
  X,
  Clock,
  User,
  ChevronRight,
  Bell,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useRealtimeDriverHOS } from '@/hooks/useELDRealtime';

// Violation severity colors
const SEVERITY_CONFIG = {
  critical: {
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800',
    iconColor: 'text-red-600 dark:text-red-400',
    textColor: 'text-red-800 dark:text-red-200',
    icon: AlertTriangle
  },
  warning: {
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    borderColor: 'border-amber-200 dark:border-amber-800',
    iconColor: 'text-amber-600 dark:text-amber-400',
    textColor: 'text-amber-800 dark:text-amber-200',
    icon: AlertCircle
  },
  info: {
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    iconColor: 'text-blue-600 dark:text-blue-400',
    textColor: 'text-blue-800 dark:text-blue-200',
    icon: Bell
  }
};

/**
 * Format time remaining for display
 */
function formatTimeRemaining(minutes) {
  if (!minutes || minutes <= 0) return 'Expired';
  if (minutes < 60) return `${minutes}m remaining`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m remaining`;
}

/**
 * Get violation severity based on time remaining
 */
function getViolationSeverity(driveTimeRemaining, shiftTimeRemaining) {
  if (driveTimeRemaining <= 0 || shiftTimeRemaining <= 0) return 'critical';
  if (driveTimeRemaining <= 30 || shiftTimeRemaining <= 60) return 'critical';
  if (driveTimeRemaining <= 60 || shiftTimeRemaining <= 120) return 'warning';
  return 'info';
}

/**
 * HOSViolationAlert - Shows HOS violation alerts for drivers
 *
 * @param {function} onDriverClick - Callback when a driver is clicked
 * @param {boolean} showDismissed - Show dismissed violations
 * @param {string} className - Additional CSS classes
 */
export default function HOSViolationAlert({
  onDriverClick,
  showDismissed = false,
  className = ''
}) {
  const [user, setUser] = useState(null);
  const [dismissedAlerts, setDismissedAlerts] = useState(new Set());

  // Get user on mount
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  // Use real-time subscription hook
  const { driversWithViolations, drivers, loading, error } = useRealtimeDriverHOS(user?.id);

  // Build violation alerts from driver data
  const violationAlerts = useMemo(() => {
    if (!drivers?.length) return [];

    const alerts = [];

    drivers.forEach(driver => {
      const driveMinutes = driver.drive_time_remaining_ms
        ? Math.floor(driver.drive_time_remaining_ms / 60000)
        : null;
      const shiftMinutes = driver.shift_time_remaining_ms
        ? Math.floor(driver.shift_time_remaining_ms / 60000)
        : null;

      // Check for existing violation
      if (driver.has_violation) {
        alerts.push({
          id: `${driver.id}-violation`,
          driverId: driver.id,
          driverName: driver.eld_driver_id,
          type: 'violation',
          severity: 'critical',
          title: 'HOS Violation',
          message: 'Driver has an active HOS violation',
          timestamp: driver.updated_at
        });
      }

      // Check drive time approaching limit
      if (driveMinutes !== null && driveMinutes <= 60 && driveMinutes > 0) {
        alerts.push({
          id: `${driver.id}-drive-warning`,
          driverId: driver.id,
          driverName: driver.eld_driver_id,
          type: 'drive_time_warning',
          severity: driveMinutes <= 30 ? 'critical' : 'warning',
          title: 'Drive Time Warning',
          message: formatTimeRemaining(driveMinutes),
          timeRemaining: driveMinutes,
          timestamp: driver.updated_at
        });
      }

      // Check shift time approaching limit
      if (shiftMinutes !== null && shiftMinutes <= 120 && shiftMinutes > 0) {
        alerts.push({
          id: `${driver.id}-shift-warning`,
          driverId: driver.id,
          driverName: driver.eld_driver_id,
          type: 'shift_time_warning',
          severity: shiftMinutes <= 60 ? 'critical' : 'warning',
          title: 'Shift Time Warning',
          message: formatTimeRemaining(shiftMinutes),
          timeRemaining: shiftMinutes,
          timestamp: driver.updated_at
        });
      }

      // Check for expired times
      if (driveMinutes !== null && driveMinutes <= 0) {
        alerts.push({
          id: `${driver.id}-drive-expired`,
          driverId: driver.id,
          driverName: driver.eld_driver_id,
          type: 'drive_time_expired',
          severity: 'critical',
          title: 'Drive Time Expired',
          message: 'Driver has exceeded their drive time limit',
          timestamp: driver.updated_at
        });
      }

      if (shiftMinutes !== null && shiftMinutes <= 0) {
        alerts.push({
          id: `${driver.id}-shift-expired`,
          driverId: driver.id,
          driverName: driver.eld_driver_id,
          type: 'shift_time_expired',
          severity: 'critical',
          title: 'Shift Time Expired',
          message: 'Driver has exceeded their shift time limit',
          timestamp: driver.updated_at
        });
      }
    });

    // Filter dismissed alerts
    if (!showDismissed) {
      return alerts.filter(a => !dismissedAlerts.has(a.id));
    }

    return alerts;
  }, [drivers, dismissedAlerts, showDismissed]);

  // Sort alerts by severity (critical first) then by time
  const sortedAlerts = useMemo(() => {
    return [...violationAlerts].sort((a, b) => {
      const severityOrder = { critical: 0, warning: 1, info: 2 };
      if (severityOrder[a.severity] !== severityOrder[b.severity]) {
        return severityOrder[a.severity] - severityOrder[b.severity];
      }
      return new Date(b.timestamp) - new Date(a.timestamp);
    });
  }, [violationAlerts]);

  const handleDismiss = (alertId) => {
    setDismissedAlerts(prev => new Set([...prev, alertId]));
  };

  const handleDriverClick = (alert) => {
    const driver = drivers?.find(d => d.id === alert.driverId);
    if (driver && onDriverClick) {
      onDriverClick({
        id: driver.id,
        eldDriverId: driver.eld_driver_id,
        name: driver.eld_driver_id,
        status: driver.duty_status?.toUpperCase() || 'OFF_DUTY',
        driveTimeRemaining: driver.drive_time_remaining_ms
          ? Math.floor(driver.drive_time_remaining_ms / 60000)
          : null,
        shiftTimeRemaining: driver.shift_time_remaining_ms
          ? Math.floor(driver.shift_time_remaining_ms / 60000)
          : null,
        cycleTimeRemaining: driver.cycle_time_remaining_ms
          ? Math.floor(driver.cycle_time_remaining_ms / 60000)
          : null,
        hasViolation: driver.has_violation,
        location: driver.location_description
      });
    }
  };

  // No alerts
  if (!loading && !sortedAlerts.length) {
    return (
      <div className={`bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 ${className}`}>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <CheckCircle size={20} className="text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h4 className="font-medium text-green-800 dark:text-green-200">
              All Clear
            </h4>
            <p className="text-sm text-green-600 dark:text-green-400">
              No HOS violations or warnings at this time
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className={`bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 animate-pulse ${className}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          <div className="flex-1">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 ${className}`}>
        <div className="flex items-center gap-3">
          <AlertCircle size={20} className="text-red-600" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Alert count header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <Bell size={16} />
          HOS Alerts
          {sortedAlerts.length > 0 && (
            <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs rounded-full">
              {sortedAlerts.length}
            </span>
          )}
        </h3>
      </div>

      {/* Alert list */}
      <div className="space-y-2">
        {sortedAlerts.map(alert => {
          const config = SEVERITY_CONFIG[alert.severity];
          const Icon = config.icon;

          return (
            <div
              key={alert.id}
              className={`
                ${config.bgColor} ${config.borderColor}
                border rounded-lg p-3 transition-all hover:shadow-md
              `}
            >
              <div className="flex items-start justify-between gap-3">
                <div
                  className="flex items-start gap-3 flex-1 cursor-pointer"
                  onClick={() => handleDriverClick(alert)}
                >
                  <div className={`p-1.5 rounded-lg ${config.bgColor}`}>
                    <Icon size={18} className={config.iconColor} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className={`font-medium text-sm ${config.textColor}`}>
                        {alert.title}
                      </h4>
                      {alert.severity === 'critical' && (
                        <span className="px-1.5 py-0.5 bg-red-500 text-white text-xs rounded font-medium">
                          Critical
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium">{alert.driverName}</span>
                      {' - '}
                      {alert.message}
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-gray-400 flex-shrink-0 mt-1" />
                </div>

                <button
                  onClick={() => handleDismiss(alert.id)}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                  title="Dismiss alert"
                >
                  <X size={14} className="text-gray-400" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
