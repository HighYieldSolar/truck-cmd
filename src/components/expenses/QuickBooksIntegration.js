'use client';

import { useState, useEffect, useCallback } from 'react';
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
  Zap
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
