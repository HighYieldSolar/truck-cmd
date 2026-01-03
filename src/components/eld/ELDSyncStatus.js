"use client";

import { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, AlertCircle, Clock, Loader2 } from 'lucide-react';

/**
 * ELDSyncStatus - Shows current sync status and allows manual sync trigger
 *
 * @param {string} connectionId - ELD connection ID
 * @param {string} lastSyncAt - Last sync timestamp
 * @param {string} status - Connection status ('active' | 'syncing' | 'error')
 * @param {function} onSyncRequested - Callback when sync is requested
 * @param {boolean} compact - Use compact display mode
 */
export default function ELDSyncStatus({
  connectionId,
  lastSyncAt,
  status = 'active',
  onSyncRequested,
  compact = false
}) {
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState(null);
  const [lastSync, setLastSync] = useState(lastSyncAt);

  useEffect(() => {
    setLastSync(lastSyncAt);
  }, [lastSyncAt]);

  const handleSync = async () => {
    if (syncing) return;

    setSyncing(true);
    setSyncError(null);

    try {
      const response = await fetch('/api/eld/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connectionId,
          syncType: 'all'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Sync failed');
      }

      setLastSync(new Date().toISOString());
      onSyncRequested?.();
    } catch (err) {
      console.error('Sync error:', err);
      setSyncError(err.message);
    } finally {
      setSyncing(false);
    }
  };

  const formatLastSync = (timestamp) => {
    if (!timestamp) return 'Never';

    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  const getStatusInfo = () => {
    if (syncing || status === 'syncing') {
      return {
        icon: <Loader2 size={16} className="animate-spin text-blue-500" />,
        text: 'Syncing...',
        className: 'text-blue-600 dark:text-blue-400'
      };
    }

    if (syncError || status === 'error') {
      return {
        icon: <AlertCircle size={16} className="text-red-500" />,
        text: syncError || 'Sync error',
        className: 'text-red-600 dark:text-red-400'
      };
    }

    // Check if sync is stale (more than 2 hours old)
    if (lastSync) {
      const syncAge = (new Date() - new Date(lastSync)) / 3600000;
      if (syncAge > 2) {
        return {
          icon: <Clock size={16} className="text-amber-500" />,
          text: `Last sync: ${formatLastSync(lastSync)}`,
          className: 'text-amber-600 dark:text-amber-400'
        };
      }
    }

    return {
      icon: <CheckCircle size={16} className="text-green-500" />,
      text: lastSync ? `Synced ${formatLastSync(lastSync)}` : 'Connected',
      className: 'text-green-600 dark:text-green-400'
    };
  };

  const statusInfo = getStatusInfo();

  if (compact) {
    return (
      <div className="inline-flex items-center gap-2">
        {statusInfo.icon}
        <span className={`text-xs ${statusInfo.className}`}>{statusInfo.text}</span>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          title="Sync now"
        >
          <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {statusInfo.icon}
          <div>
            <span className={`text-sm font-medium ${statusInfo.className}`}>
              {statusInfo.text}
            </span>
            {lastSync && !syncing && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {new Date(lastSync).toLocaleString()}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={handleSync}
          disabled={syncing}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium
            text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20
            rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
          <span>{syncing ? 'Syncing...' : 'Sync Now'}</span>
        </button>
      </div>

      {syncError && (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400">
          {syncError}
        </p>
      )}
    </div>
  );
}
