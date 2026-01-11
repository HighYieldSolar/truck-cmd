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
  Settings,
  ChevronDown,
  ChevronUp,
  Clock,
  Zap
} from 'lucide-react';

/**
 * QuickBooksIntegration - Simplified, collapsible QuickBooks connection panel
 */
export default function QuickBooksIntegration({ onSyncComplete }) {
  const [user, setUser] = useState(null);
  const { canAccess } = useFeatureAccess();
  const hasAccess = canAccess('quickbooksIntegration');

  // UI State
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [error, setError] = useState(null);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [showMappingModal, setShowMappingModal] = useState(false);

  // Fetch user on mount
  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    }
    getUser();
  }, []);

  // Get auth token
  const getAuthToken = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  }, []);

  // Fetch connection status
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
        headers: { 'Authorization': `Bearer ${token}` }
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

  // Connect to QuickBooks
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

  // Disconnect from QuickBooks
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

  // Fetch status on mount
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
        <div className="px-4 py-3 flex items-center gap-2">
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
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <FeatureGate feature="quickbooksIntegration" fallback="prompt" />
        </div>
      </div>
    );
  }

  const isConnected = connectionStatus?.connected;
  const connection = connectionStatus?.connection;
  const hasWarning = connection?.tokenHealth?.status === 'warning' || connection?.tokenHealth?.status === 'needs_refresh';
  const isExpired = connection?.status === 'token_expired' || connection?.tokenHealth?.status === 'expired';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Collapsible Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {/* QuickBooks Logo */}
          <div className="h-8 w-8 rounded-lg overflow-hidden flex-shrink-0 bg-white p-0.5 border border-gray-100 dark:border-gray-600">
            <Image
              src="/images/eld/QuickBooksLogo.png"
              alt="QuickBooks"
              width={32}
              height={32}
              className="w-full h-full object-contain"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900 dark:text-gray-100">QuickBooks</span>

            {/* Status Badge */}
            {loading ? (
              <RefreshCw className="h-4 w-4 text-gray-400 animate-spin" />
            ) : isConnected ? (
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${
                isExpired
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                  : hasWarning
                    ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                    : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
              }`}>
                {isExpired ? (
                  <><AlertCircle className="h-3 w-3" /> Expired</>
                ) : hasWarning ? (
                  <><AlertCircle className="h-3 w-3" /> Needs Attention</>
                ) : (
                  <><CheckCircle className="h-3 w-3" /> Connected</>
                )}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs font-medium rounded-full">
                <XCircle className="h-3 w-3" />
                Not Connected
              </span>
            )}
          </div>
        </div>

        {/* Expand/Collapse Icon */}
        <div className="flex items-center gap-2">
          {/* Quick Sync Button (visible in header when connected) */}
          {isConnected && connection?.status === 'active' && !isExpanded && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                setShowSyncModal(true);
              }}
              className="p-1.5 text-[#2CA01C] hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
              title="Sync Now"
            >
              <Upload className="h-4 w-4" />
            </div>
          )}

          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700">
          {/* Error Display */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
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

          {loading ? (
            <div className="py-8 flex items-center justify-center">
              <RefreshCw className="h-6 w-6 text-gray-400 animate-spin" />
            </div>
          ) : isConnected ? (
            /* Connected State */
            <div className="mt-4 space-y-4">
              {/* Company Info Card */}
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                <div className="flex items-center gap-3">
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
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Last sync: {connection?.lastSyncAt
                        ? new Date(connection.lastSyncAt).toLocaleDateString()
                        : 'Never'}
                    </p>
                  </div>
                </div>
                <a
                  href="https://qbo.intuit.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-gray-400 hover:text-[#2CA01C] hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                  title="Open QuickBooks"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>

              {/* Warning Banner */}
              {(isExpired || hasWarning) && (
                <div className={`p-3 rounded-lg flex items-center gap-3 ${
                  isExpired
                    ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                    : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
                }`}>
                  <AlertCircle className={`h-5 w-5 flex-shrink-0 ${
                    isExpired ? 'text-red-500' : 'text-amber-500'
                  }`} />
                  <div className="flex-1">
                    <p className={`text-sm ${
                      isExpired ? 'text-red-700 dark:text-red-400' : 'text-amber-700 dark:text-amber-400'
                    }`}>
                      {isExpired
                        ? 'Your connection has expired. Please reconnect to continue syncing.'
                        : connection?.tokenHealth?.warning || 'Your connection needs attention.'}
                    </p>
                  </div>
                  <button
                    onClick={handleConnect}
                    disabled={connecting}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                      isExpired
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-amber-600 hover:bg-amber-700 text-white'
                    }`}
                  >
                    {connecting ? 'Connecting...' : 'Reconnect'}
                  </button>
                </div>
              )}

              {/* Sync Stats (Simple) */}
              {connectionStatus?.sync && (
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-lg font-bold text-green-600 dark:text-green-400">
                      {(connectionStatus.sync.totalExpensesSynced || 0) + (connectionStatus.sync.totalInvoicesSynced || 0)}
                    </p>
                    <p className="text-xs text-green-700 dark:text-green-500">Synced</p>
                  </div>
                  <div className="text-center p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                    <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
                      {connectionStatus.sync.pendingSyncs || 0}
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-500">Pending</p>
                  </div>
                  <div className="text-center p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <p className="text-lg font-bold text-red-600 dark:text-red-400">
                      {connectionStatus.sync.failedSyncs || 0}
                    </p>
                    <p className="text-xs text-red-700 dark:text-red-500">Failed</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {connection?.status === 'active' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowMappingModal(true)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium rounded-lg transition-colors text-sm"
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </button>
                  <button
                    onClick={() => setShowSyncModal(true)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#2CA01C] hover:bg-[#238516] text-white font-medium rounded-lg transition-colors text-sm"
                  >
                    <Upload className="h-4 w-4" />
                    Sync Now
                  </button>
                </div>
              )}

              {/* Disconnect Link */}
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
                          <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Disconnecting...</>
                        ) : (
                          <><Unlink className="h-3.5 w-3.5" /> Disconnect</>
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
            <div className="mt-4 text-center py-4">
              <div className="w-12 h-12 bg-[#2CA01C]/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Image
                  src="/images/eld/QuickBooksLogo.png"
                  alt="QuickBooks"
                  width={28}
                  height={28}
                  className="object-contain"
                />
              </div>

              <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">
                Connect to QuickBooks
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-xs mx-auto">
                Sync your expenses and invoices directly to QuickBooks Online.
              </p>

              <button
                onClick={handleConnect}
                disabled={connecting}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2CA01C] hover:bg-[#238516] text-white font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {connecting ? (
                  <><RefreshCw className="h-4 w-4 animate-spin" /> Connecting...</>
                ) : (
                  <><Link2 className="h-4 w-4" /> Connect QuickBooks</>
                )}
              </button>

              {/* Simple Feature List */}
              <div className="mt-4 flex justify-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <Zap className="h-3 w-3 text-[#2CA01C]" /> Auto-sync
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-[#2CA01C]" /> Easy mapping
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
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
