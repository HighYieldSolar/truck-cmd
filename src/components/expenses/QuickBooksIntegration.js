'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabaseClient';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { FeatureGate } from '@/components/billing/FeatureGate';
import QuickBooksCategoryMappingModal from './QuickBooksCategoryMappingModal';
import QuickBooksBulkSyncModal from './QuickBooksBulkSyncModal';
import {
  RefreshCw,
  Link2,
  Link2Off,
  CheckCircle,
  AlertCircle,
  Clock,
  Settings,
  Upload,
  ChevronDown,
  ChevronUp,
  ExternalLink
} from 'lucide-react';

/**
 * QuickBooksIntegration - Main integration panel for the expenses page
 *
 * Shows connection status, sync stats, and provides quick actions.
 * Gated to Premium+ tier.
 */
export default function QuickBooksIntegration({ onSyncComplete }) {
  const { canAccess } = useFeatureAccess();
  const hasAccess = canAccess('quickbooksIntegration');

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Modal states
  const [mappingModalOpen, setMappingModalOpen] = useState(false);
  const [bulkSyncModalOpen, setBulkSyncModalOpen] = useState(false);

  // Get auth token for API calls
  const getAuthToken = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  }, []);

  // Fetch status
  const fetchStatus = useCallback(async () => {
    try {
      const token = await getAuthToken();
      if (!token) return;

      const response = await fetch('/api/quickbooks/status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      setStatus(data);
    } catch (err) {
      console.error('Error fetching QB status:', err);
    } finally {
      setLoading(false);
    }
  }, [getAuthToken]);

  // Check auth and fetch status
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user && hasAccess) {
        await fetchStatus();
      } else {
        setLoading(false);
      }
    }
    init();
  }, [hasAccess, fetchStatus]);

  // Handle URL params for OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const qbSuccess = params.get('qb_success');
    const qbError = params.get('qb_error');

    if (qbSuccess) {
      setSuccess(qbSuccess);
      fetchStatus();
      // Clean URL
      const url = new URL(window.location.href);
      url.searchParams.delete('qb_success');
      window.history.replaceState({}, '', url.pathname + url.search);
    }

    if (qbError) {
      setError(qbError);
      // Clean URL
      const url = new URL(window.location.href);
      url.searchParams.delete('qb_error');
      window.history.replaceState({}, '', url.pathname + url.search);
    }
  }, [fetchStatus]);

  // Connect to QuickBooks
  const handleConnect = async () => {
    try {
      setConnecting(true);
      setError(null);

      const token = await getAuthToken();
      const response = await fetch('/api/quickbooks/connect', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
        return;
      }

      // Redirect to QuickBooks OAuth
      window.location.href = data.authUrl;
    } catch (err) {
      setError('Failed to initiate connection');
    } finally {
      setConnecting(false);
    }
  };

  // Disconnect from QuickBooks
  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect QuickBooks? Your sync history will be preserved.')) {
      return;
    }

    try {
      setDisconnecting(true);
      setError(null);

      const token = await getAuthToken();
      const response = await fetch('/api/quickbooks/disconnect', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
        return;
      }

      setSuccess('QuickBooks disconnected');
      await fetchStatus();
    } catch (err) {
      setError('Failed to disconnect');
    } finally {
      setDisconnecting(false);
    }
  };

  // Quick sync (recent expenses)
  const handleQuickSync = async () => {
    try {
      setSyncing(true);
      setError(null);

      const token = await getAuthToken();
      const response = await fetch('/api/quickbooks/sync', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'bulk-expenses'
        })
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
        return;
      }

      setSuccess(`Synced ${data.synced} expenses to QuickBooks`);
      await fetchStatus();

      if (onSyncComplete) {
        onSyncComplete();
      }
    } catch (err) {
      setError('Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  // If no access, show upgrade prompt
  if (!hasAccess) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
          <img src="/images/quickbooks-logo.svg" alt="QuickBooks" className="h-5 w-5" />
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
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center gap-3">
          <RefreshCw className="h-5 w-5 text-gray-400 animate-spin" />
          <span className="text-gray-500 dark:text-gray-400">Loading QuickBooks status...</span>
        </div>
      </div>
    );
  }

  const isConnected = status?.connected;
  const connection = status?.connection;
  const syncStats = status?.sync;
  const mappingStatus = status?.mapping;

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div
          className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center gap-3">
            {/* QuickBooks Logo */}
            <div className="h-8 w-8 rounded-lg overflow-hidden flex-shrink-0">
              <Image
                src="/images/eld/QuickBooksLogo.png"
                alt="QuickBooks logo"
                width={32}
                height={32}
                className="w-full h-full"
              />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900 dark:text-gray-100">QuickBooks</span>
                {isConnected ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full">
                    <CheckCircle className="h-3 w-3" />
                    Connected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full">
                    Not Connected
                  </span>
                )}
              </div>
              {isConnected && connection?.companyName && (
                <p className="text-sm text-gray-500 dark:text-gray-400">{connection.companyName}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isConnected && syncStats && (
              <span className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
                {syncStats.totalExpensesSynced || 0} expenses synced
              </span>
            )}
            {expanded ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </div>
        </div>

        {/* Expanded Content */}
        {expanded && (
          <div className="p-4 space-y-4">
            {/* Error/Success Messages */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
                <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">
                  &times;
                </button>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400 text-sm">
                <CheckCircle className="h-4 w-4 flex-shrink-0" />
                {success}
                <button onClick={() => setSuccess(null)} className="ml-auto text-green-500 hover:text-green-700">
                  &times;
                </button>
              </div>
            )}

            {isConnected ? (
              <>
                {/* Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Expenses Synced</p>
                    <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                      {syncStats?.totalExpensesSynced || 0}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Invoices Synced</p>
                    <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                      {syncStats?.totalInvoicesSynced || 0}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Pending</p>
                    <p className="text-xl font-semibold text-amber-600 dark:text-amber-400">
                      {syncStats?.pendingSyncs || 0}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Failed</p>
                    <p className="text-xl font-semibold text-red-600 dark:text-red-400">
                      {syncStats?.failedSyncs || 0}
                    </p>
                  </div>
                </div>

                {/* Category Mapping Status */}
                {mappingStatus && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        Category Mappings
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {mappingStatus.mappedCount} of {mappingStatus.totalCategories} categories mapped
                      </p>
                    </div>
                    <button
                      onClick={() => setMappingModalOpen(true)}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                    >
                      <Settings className="h-4 w-4" />
                      Configure
                    </button>
                  </div>
                )}

                {/* Last Sync */}
                {connection?.lastSyncAt && (
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <Clock className="h-4 w-4" />
                    Last synced: {new Date(connection.lastSyncAt).toLocaleString()}
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleQuickSync}
                    disabled={syncing}
                    className="inline-flex items-center px-4 py-2 bg-[#2CA01C] text-white rounded-lg font-medium hover:bg-[#239016] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {syncing ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    Sync Now
                  </button>

                  <button
                    onClick={() => setBulkSyncModalOpen(true)}
                    className="inline-flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Bulk Sync
                  </button>

                  <button
                    onClick={handleDisconnect}
                    disabled={disconnecting}
                    className="inline-flex items-center px-4 py-2 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700 rounded-lg font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 ml-auto"
                  >
                    {disconnecting ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Link2Off className="h-4 w-4 mr-2" />
                    )}
                    Disconnect
                  </button>
                </div>
              </>
            ) : (
              /* Not Connected State */
              <div className="text-center py-6">
                <div className="mx-auto h-12 w-12 rounded-xl overflow-hidden mb-4">
                  <Image
                    src="/images/eld/QuickBooksLogo.png"
                    alt="QuickBooks logo"
                    width={48}
                    height={48}
                    className="w-full h-full"
                  />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Connect to QuickBooks Online
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  Sync your expenses and invoices directly to QuickBooks. Your trucking expense categories will be automatically mapped to your Chart of Accounts.
                </p>
                <button
                  onClick={handleConnect}
                  disabled={connecting}
                  className="inline-flex items-center px-6 py-3 bg-[#2CA01C] text-white rounded-lg font-medium hover:bg-[#239016] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {connecting ? (
                    <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                  ) : (
                    <Link2 className="h-5 w-5 mr-2" />
                  )}
                  Connect QuickBooks
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <QuickBooksCategoryMappingModal
        isOpen={mappingModalOpen}
        onClose={() => setMappingModalOpen(false)}
        onSave={() => {
          fetchStatus();
          setMappingModalOpen(false);
        }}
      />

      <QuickBooksBulkSyncModal
        isOpen={bulkSyncModalOpen}
        onClose={() => setBulkSyncModalOpen(false)}
        onSyncComplete={() => {
          fetchStatus();
          setBulkSyncModalOpen(false);
          if (onSyncComplete) onSyncComplete();
        }}
      />
    </>
  );
}
