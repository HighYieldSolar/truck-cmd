"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  ChevronRight,
  Bell,
  Loader2
} from 'lucide-react';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';

// Violation severity colors
const SEVERITY_CONFIG = {
  critical: {
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    borderColor: 'border-red-200 dark:border-red-800',
    textColor: 'text-red-600 dark:text-red-400',
    iconColor: 'text-red-500'
  },
  warning: {
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    borderColor: 'border-amber-200 dark:border-amber-800',
    textColor: 'text-amber-600 dark:text-amber-400',
    iconColor: 'text-amber-500'
  },
  info: {
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    borderColor: 'border-blue-200 dark:border-blue-800',
    textColor: 'text-blue-600 dark:text-blue-400',
    iconColor: 'text-blue-500'
  }
};

/**
 * HOSComplianceAlerts - Displays HOS violation warnings and alerts
 *
 * @param {function} onAlertClick - Callback when an alert is clicked
 * @param {number} limit - Maximum number of alerts to show
 * @param {boolean} compact - Use compact mode
 */
export default function HOSComplianceAlerts({
  onAlertClick,
  limit = 10,
  compact = false
}) {
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState(null);

  const { canAccess } = useFeatureAccess();
  const hasAccess = canAccess('eldHosTracking');

  useEffect(() => {
    if (hasAccess) {
      loadAlerts();
    } else {
      setLoading(false);
    }
  }, [hasAccess]);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch HOS alerts from the database
      const { data, error: fetchError } = await supabase
        .from('eld_hos_daily_logs')
        .select(`
          id,
          driver_id,
          log_date,
          has_violation,
          violation_types,
          violation_count,
          drivers:driver_id(id, name)
        `)
        .eq('has_violation', true)
        .order('log_date', { ascending: false })
        .limit(limit);

      if (fetchError) throw fetchError;

      // Transform to alert format
      const formattedAlerts = (data || []).flatMap(log => {
        if (!log.violation_types?.length) return [];

        return log.violation_types.map((violation, index) => ({
          id: `${log.id}-${index}`,
          driverId: log.driver_id,
          driverName: log.drivers?.name || 'Unknown Driver',
          date: log.log_date,
          type: violation.type,
          message: getViolationMessage(violation),
          severity: getViolationSeverity(violation.type),
          details: violation
        }));
      });

      setAlerts(formattedAlerts);
    } catch (err) {
      console.error('Failed to load HOS alerts:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getViolationMessage = (violation) => {
    const messages = {
      DRIVE_TIME_EXCEEDED: `Exceeded 11-hour driving limit`,
      SHIFT_TIME_EXCEEDED: `Exceeded 14-hour shift limit`,
      CYCLE_TIME_EXCEEDED: `Exceeded 70-hour cycle limit`,
      BREAK_REQUIRED: `30-minute break required`,
      INSUFFICIENT_REST: `Insufficient rest period`,
      MISSING_LOGS: `Missing log entries`,
      UNIDENTIFIED_DRIVING: `Unidentified driving time detected`
    };
    return messages[violation.type] || violation.type;
  };

  const getViolationSeverity = (type) => {
    const critical = ['DRIVE_TIME_EXCEEDED', 'SHIFT_TIME_EXCEEDED', 'CYCLE_TIME_EXCEEDED'];
    const warning = ['BREAK_REQUIRED', 'INSUFFICIENT_REST'];
    if (critical.includes(type)) return 'critical';
    if (warning.includes(type)) return 'warning';
    return 'info';
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString();
  };

  if (!hasAccess) {
    return null;
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-center py-4">
          <Loader2 size={24} className="animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="text-center py-4">
          <XCircle size={24} className="mx-auto text-red-500 mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!alerts.length) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="text-center py-6">
          <CheckCircle size={32} className="mx-auto text-green-500 mb-3" />
          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
            All Drivers Compliant
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No HOS violations detected
          </p>
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="bg-red-50 dark:bg-red-900/20 px-4 py-3 border-b border-red-200 dark:border-red-800 flex items-center gap-2">
          <Bell size={16} className="text-red-500" />
          <span className="text-sm font-medium text-red-600 dark:text-red-400">
            {alerts.length} HOS Alert{alerts.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-48 overflow-y-auto">
          {alerts.slice(0, 3).map((alert) => {
            const config = SEVERITY_CONFIG[alert.severity];
            return (
              <div
                key={alert.id}
                onClick={() => onAlertClick?.(alert)}
                className="px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle size={14} className={config.iconColor} />
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {alert.driverName}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate ml-5">
                  {alert.message}
                </p>
              </div>
            );
          })}
        </div>
        {alerts.length > 3 && (
          <div className="px-4 py-2 text-center border-t border-gray-200 dark:border-gray-700">
            <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
              View All {alerts.length} Alerts
            </button>
          </div>
        )}
      </div>
    );
  }

  // Full mode
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="bg-red-50 dark:bg-red-900/20 px-5 py-4 border-b border-red-200 dark:border-red-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-lg">
              <AlertTriangle size={20} className="text-red-500" />
            </div>
            <div>
              <h3 className="font-semibold text-red-700 dark:text-red-400">
                HOS Violations & Warnings
              </h3>
              <p className="text-sm text-red-600/80 dark:text-red-400/80">
                {alerts.length} alert{alerts.length !== 1 ? 's' : ''} require attention
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Alert List */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {alerts.map((alert) => {
          const config = SEVERITY_CONFIG[alert.severity];

          return (
            <div
              key={alert.id}
              onClick={() => onAlertClick?.(alert)}
              className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors
                ${config.bgColor} border-l-4 ${config.borderColor}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <AlertTriangle size={18} className={config.iconColor} />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">
                      {alert.driverName}
                    </h4>
                    <p className={`text-sm ${config.textColor}`}>
                      {alert.message}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {formatDate(alert.date)}
                    </p>
                  </div>
                </div>
                <ChevronRight size={20} className="text-gray-400 flex-shrink-0" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
