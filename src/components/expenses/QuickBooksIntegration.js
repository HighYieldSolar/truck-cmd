'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabaseClient';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { FeatureGate } from '@/components/billing/FeatureGate';
import QuickBooksBulkSyncModal from './QuickBooksBulkSyncModal';
import QuickBooksCategoryMappingModal from './QuickBooksCategoryMappingModal';
import {
  Link2,
  Unlink,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  XCircle,
  Upload,
  Receipt,
  FileText,
  Settings,
  AlertTriangle,
  Zap,
  History,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Clock,
  CheckCircle2,
  XOctagon,
  AlertOctagon,
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldX
} from 'lucide-react';

/**
 * QuickBooksIntegration - QuickBooks Online connection and sync management
 *
 * Features:
 * - OAuth connection to QuickBooks Online
 * - Connection status display
 * - Disconnect functionality with confirmation
 * - Last sync timestamp display
 *
 * Gated to Premium+ tier.
 */
export default function QuickBooksIntegration({ onSyncComplete }) {
  const [user, setUser] = useState(null);
  const { canAccess } = useFeatureAccess();
  const hasAccess = canAccess('quickbooksIntegration');

  // State
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [error, setError] = useState(null);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [showMappingModal, setShowMappingModal] = useState(false);
  const [updatingSettings, setUpdatingSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [syncHistory, setSyncHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [expandedHistoryItem, setExpandedHistoryItem] = useState(null);
  const [refreshingToken, setRefreshingToken] = useState(false);

  // Ref to track last auto-refresh time to prevent loops
  const lastAutoRefreshRef = useRef(0);

  /**
   * Fetch authenticated user on mount
   */
  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    }
    getUser();
  }, []);

  /**
   * Get the auth token for API calls
   */
  const getAuthToken = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  }, []);

  /**
   * Fetch QuickBooks connection status
   */
  const fetchConnectionStatus = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const token = await getAuthToken();
      if (!token) {
        setError('Authentication required');
        return;
      }

      const response = await fetch('/api/quickbooks/status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch status');
      }

      setConnectionStatus(data);
    } catch (err) {
      console.error('Error fetching QB status:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, getAuthToken]);

  /**
   * Initiate QuickBooks OAuth connection
   */
  const handleConnect = async () => {
    try {
      setConnecting(true);
      setError(null);

      const token = await getAuthToken();
      if (!token) {
        setError('Authentication required');
        return;
      }

      const response = await fetch('/api/quickbooks/connect', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initiate connection');
      }

      // Redirect to QuickBooks OAuth
      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        throw new Error('No authorization URL received');
      }
    } catch (err) {
      console.error('Error connecting to QB:', err);
      setError(err.message);
      setConnecting(false);
    }
  };

  /**
   * Disconnect QuickBooks integration
   */
  const handleDisconnect = async () => {
    try {
      setDisconnecting(true);
      setError(null);

      const token = await getAuthToken();
      if (!token) {
        setError('Authentication required');
        return;
      }

      const response = await fetch('/api/quickbooks/disconnect', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ permanent: false })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to disconnect');
      }

      // Refresh status
      setShowDisconnectConfirm(false);
      await fetchConnectionStatus();

      if (onSyncComplete) {
        onSyncComplete();
      }
    } catch (err) {
      console.error('Error disconnecting QB:', err);
      setError(err.message);
    } finally {
      setDisconnecting(false);
    }
  };

  /**
   * Update auto-sync settings
   */
  const handleUpdateAutoSync = async (type, enabled) => {
    try {
      setUpdatingSettings(true);
      setError(null);

      const token = await getAuthToken();
      if (!token) {
        setError('Authentication required');
        return;
      }

      const body = type === 'expenses'
        ? { autoSyncExpenses: enabled }
        : { autoSyncInvoices: enabled };

      const response = await fetch('/api/quickbooks/settings', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update settings');
      }

      // Update local state
      setConnectionStatus(prev => ({
        ...prev,
        connection: {
          ...prev?.connection,
          autoSyncExpenses: data.settings.autoSyncExpenses,
          autoSyncInvoices: data.settings.autoSyncInvoices
        }
      }));
    } catch (err) {
      console.error('Error updating auto-sync:', err);
      setError(err.message);
    } finally {
      setUpdatingSettings(false);
    }
  };

  /**
   * Fetch sync history
   */
  const fetchSyncHistory = useCallback(async () => {
    try {
      setLoadingHistory(true);
      setError(null);

      const token = await getAuthToken();
      if (!token) {
        setError('Authentication required');
        return;
      }

      const response = await fetch('/api/quickbooks/sync?limit=20', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch history');
      }

      setSyncHistory(data.history || []);
    } catch (err) {
      console.error('Error fetching sync history:', err);
      setError(err.message);
    } finally {
      setLoadingHistory(false);
    }
  }, [getAuthToken]);

  /**
   * Retry failed syncs
   */
  const handleRetryFailed = async () => {
    try {
      setRetrying(true);
      setError(null);

      const token = await getAuthToken();
      if (!token) {
        setError('Authentication required');
        return;
      }

      const response = await fetch('/api/quickbooks/sync', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'retry-failed' })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to retry syncs');
      }

      // Refresh status and history after retry
      await fetchConnectionStatus();
      await fetchSyncHistory();

      if (onSyncComplete) {
        onSyncComplete();
      }
    } catch (err) {
      console.error('Error retrying failed syncs:', err);
      setError(err.message);
    } finally {
      setRetrying(false);
    }
  };

  /**
   * Refresh the QuickBooks access token
   */
  const handleRefreshToken = async () => {
    try {
      setRefreshingToken(true);
      setError(null);

      const token = await getAuthToken();
      if (!token) {
        setError('Authentication required');
        return;
      }

      const response = await fetch('/api/quickbooks/refresh', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ verify: true })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to refresh token');
      }

      // Refresh connection status to update health info
      await fetchConnectionStatus();
    } catch (err) {
      console.error('Error refreshing token:', err);
      setError(err.message);
    } finally {
      setRefreshingToken(false);
    }
  };

  // Fetch history when history panel is opened
  useEffect(() => {
    if (showHistory && connectionStatus?.connected) {
      fetchSyncHistory();
    }
  }, [showHistory, connectionStatus?.connected, fetchSyncHistory]);

  // Auto-refresh token in background when it's close to expiring
  // Disabled: Manual refresh is available via the Refresh button
  // Auto-refresh was causing infinite loops due to state updates
  // Users can manually refresh via the Connection Health section

  // Fetch status on mount and when user changes
  useEffect(() => {
    if (user && hasAccess) {
      fetchConnectionStatus();
    } else {
      setLoading(false);
    }
  }, [user, hasAccess, fetchConnectionStatus]);

  // If no access, show upgrade prompt
  if (!hasAccess) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
          <div className="h-5 w-5 rounded overflow-hidden">
            <Image
              src="/images/eld/QuickBooksLogo.png"
              alt="QuickBooks"
              width={20}
              height={20}
              className="w-full h-full object-contain"
            />
          </div>
          <span className="font-medium text-gray-900 dark:text-gray-100">QuickBooks Integration</span>
        </div>
        <div className="p-4">
          <FeatureGate feature="quickbooksIntegration" fallback="prompt" />
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
          <div className="h-5 w-5 rounded overflow-hidden">
            <Image
              src="/images/eld/QuickBooksLogo.png"
              alt="QuickBooks"
              width={20}
              height={20}
              className="w-full h-full object-contain"
            />
          </div>
          <span className="font-medium text-gray-900 dark:text-gray-100">QuickBooks Integration</span>
        </div>
        <div className="p-6 flex items-center justify-center">
          <RefreshCw className="h-6 w-6 text-gray-400 animate-spin" />
        </div>
      </div>
    );
  }

  const isConnected = connectionStatus?.connected;
  const connection = connectionStatus?.connection;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* QuickBooks Logo */}
          <div className="h-8 w-8 rounded-lg overflow-hidden flex-shrink-0 bg-white p-0.5">
            <Image
              src="/images/eld/QuickBooksLogo.png"
              alt="QuickBooks logo"
              width={32}
              height={32}
              className="w-full h-full object-contain"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900 dark:text-gray-100">QuickBooks</span>
            {isConnected ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded-full">
                <CheckCircle className="h-3 w-3" />
                Connected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs font-medium rounded-full">
                <XCircle className="h-3 w-3" />
                Not Connected
              </span>
            )}
          </div>
        </div>

        {/* Refresh Button */}
        <button
          onClick={fetchConnectionStatus}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Refresh status"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5">
        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-xs text-red-600 dark:text-red-500 underline mt-1"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {isConnected ? (
          /* Connected State */
          <div className="space-y-4">
            {/* Company Info */}
            <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Connected Company
                </h5>
                <a
                  href="https://qbo.intuit.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#2CA01C] hover:underline flex items-center gap-1"
                >
                  Open QuickBooks
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-[#2CA01C]/10 rounded-lg flex items-center justify-center">
                    <Image
                      src="/images/eld/QuickBooksLogo.png"
                      alt="QuickBooks"
                      width={24}
                      height={24}
                      className="object-contain"
                    />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {connection?.companyName || 'QuickBooks Company'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Realm ID: {connection?.realmId || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sync Status */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Last Sync</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {connection?.lastSyncAt
                    ? new Date(connection.lastSyncAt).toLocaleString()
                    : 'Never'}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Status</p>
                <div className="flex items-center gap-1.5">
                  {connection?.status === 'active' ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-green-500"></span>
                      <span className="text-sm font-medium text-green-600 dark:text-green-400">Active</span>
                    </>
                  ) : connection?.status === 'token_expired' ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      <span className="text-sm font-medium text-amber-600 dark:text-amber-400">Token Expired</span>
                    </>
                  ) : (
                    <>
                      <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {connection?.status || 'Unknown'}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Sync Statistics */}
            {connectionStatus?.sync && (
              <div className="grid grid-cols-4 gap-2">
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2 text-center">
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">
                    {connectionStatus.sync.totalExpensesSynced || 0}
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-500 flex items-center justify-center gap-1">
                    <Receipt className="h-3 w-3" />
                    Expenses
                  </p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2 text-center">
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {connectionStatus.sync.totalInvoicesSynced || 0}
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-500 flex items-center justify-center gap-1">
                    <FileText className="h-3 w-3" />
                    Invoices
                  </p>
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-2 text-center">
                  <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
                    {connectionStatus.sync.pendingSyncs || 0}
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-500">Pending</p>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-2 text-center">
                  <p className="text-lg font-bold text-red-600 dark:text-red-400">
                    {connectionStatus.sync.failedSyncs || 0}
                  </p>
                  <p className="text-xs text-red-700 dark:text-red-500">Failed</p>
                </div>
              </div>
            )}

            {/* Connection Health Status */}
            {connection?.tokenHealth && (
              <div className={`rounded-xl p-4 border ${
                connection.tokenHealth.status === 'healthy'
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/30'
                  : connection.tokenHealth.status === 'warning'
                    ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/30'
                    : connection.tokenHealth.status === 'needs_refresh'
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/30'
                      : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/30'
              }`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    {/* Health Icon */}
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      connection.tokenHealth.status === 'healthy'
                        ? 'bg-green-100 dark:bg-green-800/30'
                        : connection.tokenHealth.status === 'warning'
                          ? 'bg-amber-100 dark:bg-amber-800/30'
                          : connection.tokenHealth.status === 'needs_refresh'
                            ? 'bg-blue-100 dark:bg-blue-800/30'
                            : 'bg-red-100 dark:bg-red-800/30'
                    }`}>
                      {connection.tokenHealth.status === 'healthy' ? (
                        <ShieldCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
                      ) : connection.tokenHealth.status === 'warning' ? (
                        <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      ) : connection.tokenHealth.status === 'needs_refresh' ? (
                        <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      ) : (
                        <ShieldX className="h-5 w-5 text-red-600 dark:text-red-400" />
                      )}
                    </div>

                    <div>
                      <h5 className={`text-sm font-medium ${
                        connection.tokenHealth.status === 'healthy'
                          ? 'text-green-700 dark:text-green-400'
                          : connection.tokenHealth.status === 'warning'
                            ? 'text-amber-700 dark:text-amber-400'
                            : connection.tokenHealth.status === 'needs_refresh'
                              ? 'text-blue-700 dark:text-blue-400'
                              : 'text-red-700 dark:text-red-400'
                      }`}>
                        Connection Health: {
                          connection.tokenHealth.status === 'healthy' ? 'Healthy' :
                          connection.tokenHealth.status === 'warning' ? 'Warning' :
                          connection.tokenHealth.status === 'needs_refresh' ? 'Needs Refresh' :
                          'Expired'
                        }
                      </h5>

                      {/* Warning Message */}
                      {connection.tokenHealth.warning && (
                        <p className={`text-xs mt-1 ${
                          connection.tokenHealth.status === 'healthy'
                            ? 'text-green-600 dark:text-green-500'
                            : connection.tokenHealth.status === 'warning'
                              ? 'text-amber-600 dark:text-amber-500'
                              : connection.tokenHealth.status === 'needs_refresh'
                                ? 'text-blue-600 dark:text-blue-500'
                                : 'text-red-600 dark:text-red-500'
                        }`}>
                          {connection.tokenHealth.warning}
                        </p>
                      )}

                      {/* Token Expiry Info */}
                      <div className="flex flex-wrap items-center gap-3 mt-2">
                        {connection.tokenHealth.accessTokenExpiresInHours !== null && (
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            Access token: {connection.tokenHealth.accessTokenExpiresInHours > 0
                              ? `${connection.tokenHealth.accessTokenExpiresInHours}h remaining`
                              : 'Expired'}
                          </span>
                        )}
                        {connection.tokenHealth.refreshTokenExpiresInDays !== null && (
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            Refresh token: {connection.tokenHealth.refreshTokenExpiresInDays > 0
                              ? `${connection.tokenHealth.refreshTokenExpiresInDays} days remaining`
                              : 'Expired'}
                          </span>
                        )}
                      </div>

                      {/* Last Verified Timestamp */}
                      {connection.lastVerifiedAt && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Last verified: {new Date(connection.lastVerifiedAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Refresh Button */}
                  <button
                    onClick={handleRefreshToken}
                    disabled={refreshingToken || connection.tokenHealth.status === 'expired'}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex-shrink-0 ${
                      connection.tokenHealth.status === 'expired'
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : connection.tokenHealth.status === 'warning' || connection.tokenHealth.status === 'needs_refresh'
                          ? 'bg-amber-600 hover:bg-amber-700 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                    } disabled:opacity-50`}
                    title={connection.tokenHealth.status === 'expired'
                      ? 'Connection expired - please reconnect'
                      : 'Refresh the QuickBooks connection'}
                  >
                    {refreshingToken ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        Refreshing...
                      </>
                    ) : connection.tokenHealth.status === 'expired' ? (
                      <>
                        <Link2 className="h-3.5 w-3.5" />
                        Reconnect
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-3.5 w-3.5" />
                        Refresh
                      </>
                    )}
                  </button>
                </div>

                {/* Reconnect Prompt for Expired */}
                {connection.tokenHealth.status === 'expired' && (
                  <div className="mt-3 pt-3 border-t border-red-200 dark:border-red-800/30">
                    <button
                      onClick={handleConnect}
                      disabled={connecting}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                    >
                      {connecting ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          Reconnecting...
                        </>
                      ) : (
                        <>
                          <Link2 className="h-4 w-4" />
                          Reconnect to QuickBooks
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Category Mapping Status */}
            {connectionStatus?.mapping && (
              <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Category Mappings
                    </span>
                  </div>
                  <button
                    onClick={() => setShowMappingModal(true)}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Configure
                  </button>
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {connectionStatus.mapping.mappedCount || 0} mapped
                    </span>
                  </div>
                  {connectionStatus.mapping.unmappedCount > 0 && (
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                      <span className="text-xs text-amber-600 dark:text-amber-400">
                        {connectionStatus.mapping.unmappedCount} unmapped
                      </span>
                    </div>
                  )}
                </div>
                {connectionStatus.mapping.unmappedCount > 0 && (
                  <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                    Map all categories to enable accurate expense syncing
                  </p>
                )}
              </div>
            )}

            {/* Auto-Sync Settings */}
            {connection?.status === 'active' && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800/30">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Auto-Sync Settings
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                  Automatically sync new records to QuickBooks when created
                </p>

                <div className="space-y-3">
                  {/* Auto-sync Expenses Toggle */}
                  <label className="flex items-center justify-between cursor-pointer group">
                    <div className="flex items-center gap-2">
                      <Receipt className="h-4 w-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Auto-sync expenses
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={connection?.autoSyncExpenses || false}
                        onChange={(e) => handleUpdateAutoSync('expenses', e.target.checked)}
                        disabled={updatingSettings}
                      />
                      <div className="w-9 h-5 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500 peer-disabled:opacity-50"></div>
                    </div>
                  </label>

                  {/* Auto-sync Invoices Toggle */}
                  <label className="flex items-center justify-between cursor-pointer group">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Auto-sync invoices
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={connection?.autoSyncInvoices || false}
                        onChange={(e) => handleUpdateAutoSync('invoices', e.target.checked)}
                        disabled={updatingSettings}
                      />
                      <div className="w-9 h-5 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500 peer-disabled:opacity-50"></div>
                    </div>
                  </label>
                </div>

                {updatingSettings && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    Updating settings...
                  </div>
                )}
              </div>
            )}

            {/* Sync History Section */}
            {connection?.status === 'active' && (
              <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl overflow-hidden">
                {/* History Header - Clickable to expand */}
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <History className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Sync History
                    </span>
                    {connectionStatus?.sync?.failedSyncs > 0 && (
                      <span className="px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-medium rounded">
                        {connectionStatus.sync.failedSyncs} failed
                      </span>
                    )}
                  </div>
                  {showHistory ? (
                    <ChevronUp className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  )}
                </button>

                {/* Expanded History Panel */}
                {showHistory && (
                  <div className="border-t border-gray-200 dark:border-gray-600">
                    {/* Retry Failed Button */}
                    {connectionStatus?.sync?.failedSyncs > 0 && (
                      <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border-b border-red-100 dark:border-red-900/30">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <AlertOctagon className="h-4 w-4 text-red-500" />
                            <span className="text-sm text-red-700 dark:text-red-400">
                              {connectionStatus.sync.failedSyncs} items failed to sync
                            </span>
                          </div>
                          <button
                            onClick={handleRetryFailed}
                            disabled={retrying}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors"
                          >
                            {retrying ? (
                              <>
                                <RefreshCw className="h-3 w-3 animate-spin" />
                                Retrying...
                              </>
                            ) : (
                              <>
                                <RotateCcw className="h-3 w-3" />
                                Retry Failed
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* History List */}
                    <div className="max-h-64 overflow-y-auto">
                      {loadingHistory ? (
                        <div className="px-4 py-6 flex items-center justify-center">
                          <RefreshCw className="h-5 w-5 text-gray-400 animate-spin" />
                        </div>
                      ) : syncHistory.length === 0 ? (
                        <div className="px-4 py-6 text-center">
                          <Clock className="h-8 w-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            No sync history yet
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            Sync records will appear here after your first sync
                          </p>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-100 dark:divide-gray-600">
                          {syncHistory.map((item) => {
                            const isExpanded = expandedHistoryItem === item.id;
                            const statusIcon = item.status === 'completed' ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : item.status === 'partial' ? (
                              <AlertTriangle className="h-4 w-4 text-amber-500" />
                            ) : item.status === 'failed' ? (
                              <XOctagon className="h-4 w-4 text-red-500" />
                            ) : (
                              <Clock className="h-4 w-4 text-blue-500" />
                            );

                            const statusColor = item.status === 'completed'
                              ? 'text-green-600 dark:text-green-400'
                              : item.status === 'partial'
                                ? 'text-amber-600 dark:text-amber-400'
                                : item.status === 'failed'
                                  ? 'text-red-600 dark:text-red-400'
                                  : 'text-blue-600 dark:text-blue-400';

                            return (
                              <div key={item.id} className="px-4 py-3">
                                <button
                                  onClick={() => setExpandedHistoryItem(isExpanded ? null : item.id)}
                                  className="w-full text-left"
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-start gap-2 min-w-0">
                                      {statusIcon}
                                      <div className="min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className={`text-sm font-medium capitalize ${statusColor}`}>
                                            {item.status || 'Unknown'}
                                          </span>
                                          <span className="text-xs text-gray-400">
                                            {item.sync_type === 'bulk' ? 'Bulk Sync' :
                                             item.sync_type === 'single' ? 'Single Sync' :
                                             item.sync_type === 'auto' ? 'Auto Sync' :
                                             item.sync_type || 'Sync'}
                                          </span>
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                          {item.started_at
                                            ? new Date(item.started_at).toLocaleString()
                                            : 'Unknown time'}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3 flex-shrink-0">
                                      {/* Synced count */}
                                      {item.records_synced > 0 && (
                                        <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                                          {item.records_synced} synced
                                        </span>
                                      )}
                                      {/* Failed count */}
                                      {item.records_failed > 0 && (
                                        <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                                          {item.records_failed} failed
                                        </span>
                                      )}
                                      {isExpanded ? (
                                        <ChevronUp className="h-4 w-4 text-gray-400" />
                                      ) : (
                                        <ChevronDown className="h-4 w-4 text-gray-400" />
                                      )}
                                    </div>
                                  </div>
                                </button>

                                {/* Expanded Details */}
                                {isExpanded && (
                                  <div className="mt-3 pl-6 space-y-2">
                                    {/* Entity types */}
                                    {item.entity_types && (
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-500 dark:text-gray-400">Types:</span>
                                        <div className="flex gap-1">
                                          {(Array.isArray(item.entity_types) ? item.entity_types : [item.entity_types]).map((type, i) => (
                                            <span
                                              key={i}
                                              className="px-2 py-0.5 bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 text-xs rounded capitalize"
                                            >
                                              {type}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* Duration */}
                                    {item.completed_at && item.started_at && (
                                      <div className="text-xs text-gray-500 dark:text-gray-400">
                                        Duration: {Math.round((new Date(item.completed_at) - new Date(item.started_at)) / 1000)}s
                                      </div>
                                    )}

                                    {/* Error message if failed */}
                                    {item.status === 'failed' && item.error_message && (
                                      <div className="p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                        <p className="text-xs text-red-600 dark:text-red-400">
                                          {item.error_message}
                                        </p>
                                      </div>
                                    )}

                                    {/* Detailed results if available */}
                                    {item.results && (
                                      <div className="text-xs text-gray-500 dark:text-gray-400">
                                        <p className="font-medium mb-1">Details:</p>
                                        <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-x-auto text-xs">
                                          {JSON.stringify(item.results, null, 2)}
                                        </pre>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Refresh History Button */}
                    {syncHistory.length > 0 && (
                      <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-600">
                        <button
                          onClick={fetchSyncHistory}
                          disabled={loadingHistory}
                          className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 flex items-center gap-1"
                        >
                          <RefreshCw className={`h-3 w-3 ${loadingHistory ? 'animate-spin' : ''}`} />
                          Refresh
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            {connection?.status === 'active' && (
              <div className="flex gap-2">
                <button
                  onClick={() => setShowMappingModal(true)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium rounded-lg transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  Mappings
                </button>
                <button
                  onClick={() => setShowSyncModal(true)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#2CA01C] hover:bg-[#238516] text-white font-medium rounded-lg transition-colors"
                >
                  <Upload className="h-4 w-4" />
                  Sync Now
                </button>
              </div>
            )}

            {/* Token Expired Warning */}
            {connection?.status === 'token_expired' && (
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    Your QuickBooks connection has expired. Please reconnect to continue syncing.
                  </p>
                  <button
                    onClick={handleConnect}
                    disabled={connecting}
                    className="mt-2 text-sm font-medium text-amber-700 dark:text-amber-400 underline"
                  >
                    {connecting ? 'Reconnecting...' : 'Reconnect Now'}
                  </button>
                </div>
              </div>
            )}

            {/* Error Message from Connection */}
            {connection?.errorMessage && connection?.status !== 'token_expired' && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 dark:text-red-400">
                  {connection.errorMessage}
                </p>
              </div>
            )}

            {/* Disconnect Button */}
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              {showDisconnectConfirm ? (
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Disconnect from QuickBooks?
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowDisconnectConfirm(false)}
                      className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDisconnect}
                      disabled={disconnecting}
                      className="px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {disconnecting ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          Disconnecting...
                        </>
                      ) : (
                        <>
                          <Unlink className="h-3.5 w-3.5" />
                          Disconnect
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowDisconnectConfirm(true)}
                  className="text-sm text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors flex items-center gap-1.5"
                >
                  <Unlink className="h-4 w-4" />
                  Disconnect QuickBooks
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Not Connected State */
          <div className="text-center py-4">
            <div className="w-14 h-14 bg-gradient-to-br from-[#2CA01C]/10 to-[#2CA01C]/20 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Image
                src="/images/eld/QuickBooksLogo.png"
                alt="QuickBooks"
                width={32}
                height={32}
                className="object-contain"
              />
            </div>

            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Connect to QuickBooks
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
              Sync your expenses and invoices directly to QuickBooks Online.
              Save hours on data entry and keep your books accurate.
            </p>

            <button
              onClick={handleConnect}
              disabled={connecting}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2CA01C] hover:bg-[#238516] text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {connecting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Link2 className="h-4 w-4" />
                  Connect to QuickBooks
                </>
              )}
            </button>

            {/* Features Preview */}
            <div className="mt-6 grid grid-cols-2 gap-2 text-left max-w-sm mx-auto">
              {[
                'Automatic expense sync',
                'Invoice sync',
                'Category mapping',
                'Sync history'
              ].map((feature) => (
                <div key={feature} className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <CheckCircle className="h-3.5 w-3.5 text-[#2CA01C]" />
                  {feature}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bulk Sync Modal */}
      <QuickBooksBulkSyncModal
        isOpen={showSyncModal}
        onClose={() => setShowSyncModal(false)}
        onSyncComplete={() => {
          setShowSyncModal(false);
          fetchConnectionStatus();
          if (onSyncComplete) {
            onSyncComplete();
          }
        }}
      />

      {/* Category Mapping Modal */}
      <QuickBooksCategoryMappingModal
        isOpen={showMappingModal}
        onClose={() => setShowMappingModal(false)}
        onSave={() => {
          setShowMappingModal(false);
          fetchConnectionStatus();
        }}
      />
    </div>
  );
}
