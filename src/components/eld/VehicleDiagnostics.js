"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle,
  Truck,
  RefreshCw,
  ChevronRight,
  Wrench,
  Clock,
  Loader2,
  XCircle
} from 'lucide-react';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { FeatureGate } from '@/components/billing/FeatureGate';

// Fault severity configuration
const SEVERITY_CONFIG = {
  critical: {
    label: 'Critical',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    textColor: 'text-red-600 dark:text-red-400',
    borderColor: 'border-red-200 dark:border-red-800',
    icon: AlertOctagon,
    iconColor: 'text-red-500'
  },
  warning: {
    label: 'Warning',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    textColor: 'text-amber-600 dark:text-amber-400',
    borderColor: 'border-amber-200 dark:border-amber-800',
    icon: AlertTriangle,
    iconColor: 'text-amber-500'
  },
  info: {
    label: 'Info',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    textColor: 'text-blue-600 dark:text-blue-400',
    borderColor: 'border-blue-200 dark:border-blue-800',
    icon: Wrench,
    iconColor: 'text-blue-500'
  },
  resolved: {
    label: 'Resolved',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    textColor: 'text-green-600 dark:text-green-400',
    borderColor: 'border-green-200 dark:border-green-800',
    icon: CheckCircle,
    iconColor: 'text-green-500'
  }
};

/**
 * VehicleDiagnostics - Shows vehicle fault codes and diagnostics
 * Requires Fleet+ subscription tier
 *
 * @param {string} vehicleId - Optional: filter by specific vehicle
 * @param {function} onFaultClick - Callback when a fault is clicked
 * @param {boolean} compact - Use compact mode
 * @param {number} limit - Maximum faults to display
 */
export default function VehicleDiagnostics({
  vehicleId = null,
  onFaultClick,
  compact = false,
  limit = 20
}) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [faults, setFaults] = useState([]);
  const [summary, setSummary] = useState({ critical: 0, warning: 0, info: 0 });
  const [error, setError] = useState(null);

  const { canAccess } = useFeatureAccess();
  const hasAccess = canAccess('eldDiagnostics');

  useEffect(() => {
    if (hasAccess) {
      loadFaults();
    } else {
      setLoading(false);
    }
  }, [hasAccess, vehicleId]);

  const loadFaults = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch fault codes from database
      let query = supabase
        .from('eld_fault_codes')
        .select(`
          id,
          external_vehicle_id,
          fault_code,
          description,
          severity,
          first_observed_at,
          last_observed_at,
          is_active,
          occurrence_count,
          metadata,
          vehicles:external_vehicle_id(id, name)
        `)
        .eq('is_active', true)
        .order('severity', { ascending: true })
        .order('last_observed_at', { ascending: false })
        .limit(limit);

      if (vehicleId) {
        query = query.eq('external_vehicle_id', vehicleId);
      }

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;

      setFaults(data || []);

      // Calculate summary
      const summaryData = { critical: 0, warning: 0, info: 0 };
      (data || []).forEach(fault => {
        if (fault.severity === 'critical') summaryData.critical++;
        else if (fault.severity === 'warning') summaryData.warning++;
        else summaryData.info++;
      });
      setSummary(summaryData);
    } catch (err) {
      console.error('Failed to load fault codes:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);

    try {
      // Trigger sync of fault codes
      const response = await fetch('/api/eld/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ syncType: 'faults' })
      });

      if (response.ok) {
        await loadFaults();
      }
    } catch (err) {
      console.error('Refresh failed:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Unknown';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffHours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };

  // Feature gate check
  if (!hasAccess) {
    return (
      <FeatureGate feature="eldDiagnostics" fallback="prompt" />
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
          <XCircle size={32} className="mx-auto text-red-500 mb-3" />
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

  if (!faults.length) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="text-center py-8">
          <CheckCircle size={32} className="mx-auto text-green-500 mb-3" />
          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
            All Systems Normal
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No active fault codes detected
          </p>
        </div>
      </div>
    );
  }

  // Compact mode
  if (compact) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-3 border-b border-gray-200 dark:border-gray-600 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Wrench size={16} className="text-amber-600 dark:text-amber-400" />
            <h3 className="font-medium text-gray-700 dark:text-gray-200">Diagnostics</h3>
          </div>
          <div className="flex items-center gap-2">
            {summary.critical > 0 && (
              <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs rounded-full">
                {summary.critical}
              </span>
            )}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-48 overflow-y-auto">
          {faults.slice(0, 4).map((fault) => {
            const config = SEVERITY_CONFIG[fault.severity] || SEVERITY_CONFIG.info;
            const FaultIcon = config.icon;

            return (
              <div
                key={fault.id}
                onClick={() => onFaultClick?.(fault)}
                className="px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <FaultIcon size={14} className={config.iconColor} />
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {fault.fault_code}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate ml-5">
                  {fault.description || 'No description'}
                </p>
              </div>
            );
          })}
        </div>

        {faults.length > 4 && (
          <div className="px-4 py-2 text-center border-t border-gray-200 dark:border-gray-700">
            <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
              View All {faults.length} Faults
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
      <div className="bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-700 dark:to-orange-700 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Wrench size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Vehicle Diagnostics</h3>
              <p className="text-sm text-amber-100">Active fault codes and alerts</p>
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

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
        <div className="text-center">
          <p className="text-2xl font-bold text-red-600">{summary.critical}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Critical</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-amber-600">{summary.warning}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Warnings</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600">{summary.info}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Info</p>
        </div>
      </div>

      {/* Fault List */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {faults.map((fault) => {
          const config = SEVERITY_CONFIG[fault.severity] || SEVERITY_CONFIG.info;
          const FaultIcon = config.icon;

          return (
            <div
              key={fault.id}
              onClick={() => onFaultClick?.(fault)}
              className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors
                ${config.bgColor} border-l-4 ${config.borderColor}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <FaultIcon size={18} className={config.iconColor} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">
                        {fault.fault_code}
                      </h4>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${config.bgColor} ${config.textColor}`}>
                        {config.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {fault.description || 'No description available'}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Truck size={12} />
                        {fault.vehicles?.name || 'Unknown Vehicle'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {formatDate(fault.last_observed_at)}
                      </span>
                      {fault.occurrence_count > 1 && (
                        <span className="text-amber-600">
                          {fault.occurrence_count}x occurrences
                        </span>
                      )}
                    </div>
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
