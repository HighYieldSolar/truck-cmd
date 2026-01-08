'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  CheckCircle,
  Clock,
  XCircle,
  Minus,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

/**
 * QuickBooksSyncStatus - Badge showing sync status for an expense
 *
 * Status types:
 * - synced: Green checkmark
 * - pending: Yellow clock
 * - failed: Red X with error tooltip
 * - null/undefined: Gray dash (not synced)
 */
export default function QuickBooksSyncStatus({
  expenseId,
  connectionId,
  size = 'sm',
  showLabel = false,
  onRetry
}) {
  const [syncRecord, setSyncRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTooltip, setShowTooltip] = useState(false);

  // Fetch sync status for this expense
  const fetchSyncStatus = useCallback(async () => {
    if (!expenseId || !connectionId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('quickbooks_sync_records')
        .select('*')
        .eq('connection_id', connectionId)
        .eq('entity_type', 'expense')
        .eq('local_entity_id', expenseId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching sync status:', error);
      }

      setSyncRecord(data || null);
    } catch (err) {
      console.error('Error in fetchSyncStatus:', err);
    } finally {
      setLoading(false);
    }
  }, [expenseId, connectionId]);

  useEffect(() => {
    fetchSyncStatus();
  }, [fetchSyncStatus]);

  // Size classes
  const iconSizes = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-5 w-5'
  };

  const iconSize = iconSizes[size] || iconSizes.sm;

  // Loading state
  if (loading) {
    return (
      <div className="inline-flex items-center">
        <RefreshCw className={`${iconSize} text-gray-400 animate-spin`} />
      </div>
    );
  }

  // Not synced at all
  if (!syncRecord) {
    return (
      <div
        className="inline-flex items-center gap-1 text-gray-400 dark:text-gray-500"
        title="Not synced to QuickBooks"
      >
        <Minus className={iconSize} />
        {showLabel && <span className="text-xs">Not synced</span>}
      </div>
    );
  }

  // Synced successfully
  if (syncRecord.sync_status === 'synced') {
    return (
      <div
        className="inline-flex items-center gap-1 text-green-600 dark:text-green-400"
        title={`Synced to QuickBooks${syncRecord.last_synced_at ? ` on ${new Date(syncRecord.last_synced_at).toLocaleString()}` : ''}`}
      >
        <CheckCircle className={iconSize} />
        {showLabel && <span className="text-xs">Synced</span>}
      </div>
    );
  }

  // Pending sync
  if (syncRecord.sync_status === 'pending') {
    return (
      <div
        className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400"
        title="Pending sync to QuickBooks"
      >
        <Clock className={iconSize} />
        {showLabel && <span className="text-xs">Pending</span>}
      </div>
    );
  }

  // Failed sync - with tooltip
  if (syncRecord.sync_status === 'failed') {
    return (
      <div className="relative inline-flex">
        <button
          className="inline-flex items-center gap-1 text-red-600 dark:text-red-400"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          onClick={(e) => {
            e.stopPropagation();
            if (onRetry) onRetry(expenseId);
          }}
        >
          <XCircle className={iconSize} />
          {showLabel && <span className="text-xs">Failed</span>}
        </button>

        {/* Error Tooltip */}
        {showTooltip && syncRecord.error_message && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50">
            <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 max-w-xs whitespace-normal shadow-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium mb-1">Sync Failed</p>
                  <p className="text-gray-300">{syncRecord.error_message}</p>
                  {onRetry && (
                    <p className="text-blue-400 mt-1">Click to retry</p>
                  )}
                </div>
              </div>
              {/* Tooltip arrow */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
            </div>
          </div>
        )}
      </div>
    );
  }

  // Unknown status
  return (
    <div className="inline-flex items-center gap-1 text-gray-400">
      <Minus className={iconSize} />
      {showLabel && <span className="text-xs">Unknown</span>}
    </div>
  );
}

/**
 * QuickBooksSyncStatusSimple - Simpler version that accepts status directly
 * Use when you already have the sync status from a query
 */
export function QuickBooksSyncStatusSimple({
  status,
  errorMessage,
  lastSyncedAt,
  size = 'sm',
  showLabel = false,
  onRetry
}) {
  const [showTooltip, setShowTooltip] = useState(false);

  const iconSizes = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-5 w-5'
  };

  const iconSize = iconSizes[size] || iconSizes.sm;

  // Not synced
  if (!status) {
    return (
      <div
        className="inline-flex items-center gap-1 text-gray-400 dark:text-gray-500"
        title="Not synced to QuickBooks"
      >
        <Minus className={iconSize} />
        {showLabel && <span className="text-xs">Not synced</span>}
      </div>
    );
  }

  // Synced successfully
  if (status === 'synced') {
    return (
      <div
        className="inline-flex items-center gap-1 text-green-600 dark:text-green-400"
        title={`Synced to QuickBooks${lastSyncedAt ? ` on ${new Date(lastSyncedAt).toLocaleString()}` : ''}`}
      >
        <CheckCircle className={iconSize} />
        {showLabel && <span className="text-xs">Synced</span>}
      </div>
    );
  }

  // Pending sync
  if (status === 'pending') {
    return (
      <div
        className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400"
        title="Pending sync to QuickBooks"
      >
        <Clock className={iconSize} />
        {showLabel && <span className="text-xs">Pending</span>}
      </div>
    );
  }

  // Failed sync
  if (status === 'failed') {
    return (
      <div className="relative inline-flex">
        <button
          className="inline-flex items-center gap-1 text-red-600 dark:text-red-400"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          onClick={(e) => {
            e.stopPropagation();
            if (onRetry) onRetry();
          }}
        >
          <XCircle className={iconSize} />
          {showLabel && <span className="text-xs">Failed</span>}
        </button>

        {showTooltip && errorMessage && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50">
            <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 max-w-xs whitespace-normal shadow-lg">
              <p>{errorMessage}</p>
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}
