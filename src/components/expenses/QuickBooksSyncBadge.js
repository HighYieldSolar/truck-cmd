'use client';

import { useState, useRef, useEffect } from 'react';
import {
  CheckCircle,
  Clock,
  XCircle,
  CloudOff,
  Upload,
  RefreshCw,
  ExternalLink,
  AlertTriangle
} from 'lucide-react';

/**
 * QuickBooks Sync Status Badge
 *
 * Displays the sync status of an expense or invoice with QuickBooks.
 * Shows a colored badge with tooltip details and sync action.
 *
 * @param {Object} props
 * @param {Object} props.syncRecord - Sync record from quickbooks_sync_records
 * @param {boolean} props.isConnected - Whether QuickBooks is connected
 * @param {string} props.entityType - 'expense' or 'invoice'
 * @param {string} props.entityId - The local entity ID
 * @param {Function} props.onSync - Callback when sync is triggered
 * @param {boolean} props.syncing - Whether sync is in progress
 * @param {boolean} props.compact - Compact mode for smaller displays
 */
export default function QuickBooksSyncBadge({
  syncRecord,
  isConnected = false,
  entityType = 'expense',
  entityId,
  onSync,
  syncing = false,
  compact = false
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipRef = useRef(null);
  const buttonRef = useRef(null);

  // Close tooltip on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setShowTooltip(false);
      }
    };

    if (showTooltip) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showTooltip]);

  // Don't show badge if not connected
  if (!isConnected) {
    return null;
  }

  // Determine sync status
  const status = syncRecord?.sync_status || 'not_synced';
  const qbEntityId = syncRecord?.qb_entity_id;
  const lastSyncAt = syncRecord?.last_synced_at;
  const errorMessage = syncRecord?.error_message;

  // Status configuration
  const statusConfig = {
    synced: {
      icon: CheckCircle,
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      textColor: 'text-green-600 dark:text-green-400',
      borderColor: 'border-green-200 dark:border-green-800/50',
      label: 'Synced',
      description: 'Synced to QuickBooks'
    },
    pending: {
      icon: Clock,
      bgColor: 'bg-amber-100 dark:bg-amber-900/30',
      textColor: 'text-amber-600 dark:text-amber-400',
      borderColor: 'border-amber-200 dark:border-amber-800/50',
      label: 'Pending',
      description: 'Sync pending'
    },
    failed: {
      icon: XCircle,
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      textColor: 'text-red-600 dark:text-red-400',
      borderColor: 'border-red-200 dark:border-red-800/50',
      label: 'Failed',
      description: 'Sync failed'
    },
    not_synced: {
      icon: CloudOff,
      bgColor: 'bg-gray-100 dark:bg-gray-700',
      textColor: 'text-gray-500 dark:text-gray-400',
      borderColor: 'border-gray-200 dark:border-gray-600',
      label: 'Not synced',
      description: 'Not synced to QuickBooks'
    }
  };

  const config = statusConfig[status] || statusConfig.not_synced;
  const Icon = config.icon;

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleString();
  };

  // Handle sync click
  const handleSyncClick = (e) => {
    e.stopPropagation();
    if (onSync && !syncing) {
      onSync(entityId, entityType);
    }
  };

  // Badge content
  const badgeContent = (
    <button
      ref={buttonRef}
      onClick={(e) => {
        e.stopPropagation();
        setShowTooltip(!showTooltip);
      }}
      className={`
        relative inline-flex items-center gap-1
        ${compact ? 'px-1.5 py-0.5' : 'px-2 py-1'}
        rounded-full text-xs font-medium
        ${config.bgColor} ${config.textColor}
        border ${config.borderColor}
        hover:opacity-80 transition-opacity cursor-pointer
      `}
      title={config.description}
    >
      {syncing ? (
        <RefreshCw className={`${compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} animate-spin`} />
      ) : (
        <Icon className={compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
      )}
      {!compact && <span>{config.label}</span>}
    </button>
  );

  return (
    <div className="relative inline-block">
      {badgeContent}

      {/* Tooltip Popover — opens to the right by default; on small screens
          we constrain width so it can't run off the viewport. */}
      {showTooltip && (
        <div
          ref={tooltipRef}
          className="absolute z-50 mt-2 w-64 max-w-[calc(100vw-1.5rem)] bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden left-0 sm:left-auto sm:right-0"
        >
          {/* Header */}
          <div className={`px-3 py-2 ${config.bgColor} border-b ${config.borderColor}`}>
            <div className="flex items-center gap-2">
              <Icon className={`h-4 w-4 ${config.textColor}`} />
              <span className={`font-medium ${config.textColor}`}>
                {config.description}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="p-3 space-y-2">
            {/* QuickBooks Entity ID */}
            {qbEntityId && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 dark:text-gray-400">QuickBooks ID:</span>
                <span className="font-mono text-gray-700 dark:text-gray-300">
                  {qbEntityId}
                </span>
              </div>
            )}

            {/* Last Sync Time */}
            {lastSyncAt && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 dark:text-gray-400">Last sync:</span>
                <span className="text-gray-700 dark:text-gray-300">
                  {formatDate(lastSyncAt)}
                </span>
              </div>
            )}

            {/* Error Message */}
            {status === 'failed' && errorMessage && (
              <div className="p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs text-red-600 dark:text-red-400">
                <div className="flex items-start gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="pt-2 border-t border-gray-100 dark:border-gray-700 flex gap-2">
              {(status === 'not_synced' || status === 'failed') && onSync && (
                <button
                  onClick={handleSyncClick}
                  disabled={syncing}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#2CA01C] hover:bg-[#238516] disabled:opacity-50 text-white text-xs font-medium rounded transition-colors"
                >
                  {syncing ? (
                    <>
                      <RefreshCw className="h-3 w-3 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-3 w-3" />
                      Sync to QuickBooks
                    </>
                  )}
                </button>
              )}

              {qbEntityId && (
                <a
                  href={`https://app.qbo.intuit.com/app/${entityType === 'expense' ? 'expense' : 'invoice'}?txnId=${qbEntityId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs rounded transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="h-3 w-3" />
                  View in QuickBooks
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
