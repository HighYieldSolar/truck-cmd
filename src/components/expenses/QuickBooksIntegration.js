'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
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
  Zap,
  Receipt,
  ArrowRight
} from 'lucide-react';

/**
 * QuickBooksIntegration - Collapsible QuickBooks panel for the expenses page
 * Matches the design language of ELDConnectionManager
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

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    }
    getUser();
  }, []);

  const getAuthToken = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  }, []);

  const fetchConnectionStatus = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      const token = await getAuthToken();
      if (!token) return;

      const response = await fetch('/api/quickbooks/status', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch status');
      setConnectionStatus(data);
    } catch (err) {
      console.error('Error fetching QB status:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, getAuthToken]);

  const handleConnect = async () => {
    try {
      setConnecting(true);
      setError(null);
      const token = await getAuthToken();
      if (!token) { setError('Authentication required'); return; }

      const response = await fetch('/api/quickbooks/connect', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to initiate connection');
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

  const handleDisconnect = async () => {
    try {
      setDisconnecting(true);
      setError(null);
      const token = await getAuthToken();
      if (!token) { setError('Authentication required'); return; }

      const response = await fetch('/api/quickbooks/disconnect', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ permanent: false })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to disconnect');

      setShowDisconnectConfirm(false);
      await fetchConnectionStatus();
      if (onSyncComplete) onSyncComplete();
    } catch (err) {
      console.error('Error disconnecting QB:', err);
      setError(err.message);
    } finally {
      setDisconnecting(false);
    }
  };

  useEffect(() => {
    if (user && hasAccess) {
      fetchConnectionStatus();
    } else {
      setLoading(false);
    }
  }, [user, hasAccess, fetchConnectionStatus]);

  // Upgrade prompt for non-premium users
  if (!hasAccess) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
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
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-medium rounded-full">
                <Zap size={10} />
                Premium
              </span>
            </div>
          </div>
          <Link
            href="/dashboard/upgrade"
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#2CA01C] hover:bg-[#238516] text-white text-xs font-medium rounded-lg transition-colors"
          >
            Upgrade
            <ArrowRight size={12} />
          </Link>
        </div>
      </div>
    );
  }

  const isConnected = connectionStatus?.connected;
  const connection = connectionStatus?.connection;
  const hasWarning = connection?.tokenHealth?.status === 'warning' || connection?.tokenHealth?.status === 'needs_refresh';
  const isExpired = connection?.status === 'token_expired' || connection?.tokenHealth?.status === 'expired';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
      {/* Collapsible Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {/* QuickBooks Logo */}
          <div className="h-9 w-9 rounded-lg overflow-hidden flex-shrink-0 bg-white p-1 border border-gray-100 dark:border-gray-600 shadow-sm">
            <Image
              src="/images/eld/QuickBooksLogo.png"
              alt="QuickBooks"
              width={32}
              height={32}
              className="w-full h-full object-contain"
            />
          </div>

          <div className="flex items-center gap-2.5">
            <span className="font-semibold text-gray-900 dark:text-gray-100">QuickBooks</span>

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
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs font-medium rounded-full">
                Not Connected
              </span>
            )}
          </div>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          {/* Quick Sync Button (visible in header when connected & collapsed) */}
          {isConnected && connection?.status === 'active' && !isExpanded && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                setShowSyncModal(true);
              }}
              className="p-2 text-[#2CA01C] hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
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
        <div className="border-t border-gray-200 dark:border-gray-700">
          {/* Error Display */}
          {error && (
            <div className="mx-4 mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-600"
              >
                <XCircle className="h-4 w-4" />
              </button>
            </div>
          )}

          {loading ? (
            <div className="py-8 flex items-center justify-center">
              <RefreshCw className="h-6 w-6 text-[#2CA01C] animate-spin" />
            </div>
          ) : isConnected ? (
            /* ── Connected State ── */
            <div className="p-4 space-y-4">
              {/* Company Info Card */}
              <div className="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#2CA01C]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Image
                      src="/images/eld/QuickBooksLogo.png"
                      alt="QuickBooks"
                      width={24}
                      height={24}
                      className="object-contain"
                    />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
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
                <div className={`p-3 rounded-xl flex items-center gap-3 ${
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
                        ? 'Connection expired. Reconnect to continue syncing.'
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

              {/* Sync Stats */}
              {connectionStatus?.sync && (
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800/50">
                    <p className="text-xl font-bold text-green-600 dark:text-green-400">
                      {connectionStatus.sync.totalExpensesSynced || 0}
                    </p>
                    <p className="text-xs text-green-700 dark:text-green-500 font-medium">Synced</p>
                  </div>
                  <div className="text-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800/50">
                    <p className="text-xl font-bold text-amber-600 dark:text-amber-400">
                      {connectionStatus.sync.pendingSyncs || 0}
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-500 font-medium">Pending</p>
                  </div>
                  <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-800/50">
                    <p className="text-xl font-bold text-red-600 dark:text-red-400">
                      {connectionStatus.sync.failedSyncs || 0}
                    </p>
                    <p className="text-xs text-red-700 dark:text-red-500 font-medium">Failed</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {connection?.status === 'active' && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setShowMappingModal(true)}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium rounded-xl transition-colors text-sm"
                  >
                    <Settings className="h-4 w-4" />
                    Mappings
                  </button>
                  <button
                    onClick={() => setShowSyncModal(true)}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#2CA01C] hover:bg-[#238516] text-white font-medium rounded-xl transition-colors text-sm"
                  >
                    <Upload className="h-4 w-4" />
                    Sync Now
                  </button>
                </div>
              )}

              {/* Quick Links */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                <Link
                  href="/dashboard/settings/quickbooks"
                  className="text-sm text-[#2CA01C] hover:underline flex items-center gap-1"
                >
                  <Settings className="h-3.5 w-3.5" />
                  Full Settings
                </Link>

                {showDisconnectConfirm ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowDisconnectConfirm(false)}
                      className="px-2.5 py-1 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDisconnect}
                      disabled={disconnecting}
                      className="px-2.5 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1"
                    >
                      {disconnecting ? (
                        <><RefreshCw className="h-3 w-3 animate-spin" /> Disconnecting...</>
                      ) : (
                        <><Unlink className="h-3 w-3" /> Disconnect</>
                      )}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowDisconnectConfirm(true)}
                    className="text-sm text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors flex items-center gap-1"
                  >
                    <Unlink className="h-3.5 w-3.5" />
                    Disconnect
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* ── Not Connected State ── */
            <div className="p-5">
              <div className="text-center mb-5">
                <div className="w-14 h-14 bg-[#2CA01C]/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Image
                    src="/images/eld/QuickBooksLogo.png"
                    alt="QuickBooks"
                    width={30}
                    height={30}
                    className="object-contain"
                  />
                </div>

                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  Connect to QuickBooks
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                  Sync your expenses directly to QuickBooks Online for seamless bookkeeping.
                </p>
              </div>

              <div className="flex justify-center mb-5">
                <button
                  onClick={handleConnect}
                  disabled={connecting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2CA01C] hover:bg-[#238516] text-white font-medium rounded-xl transition-colors disabled:opacity-50 shadow-sm"
                >
                  {connecting ? (
                    <><RefreshCw className="h-4 w-4 animate-spin" /> Connecting...</>
                  ) : (
                    <><Link2 className="h-4 w-4" /> Connect QuickBooks</>
                  )}
                </button>
              </div>

              {/* Feature highlights */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: Receipt, label: 'Expense Sync', desc: 'Push to QB automatically' },
                  { icon: Upload, label: 'Bulk Sync', desc: 'Sync multiple at once' },
                  { icon: Zap, label: 'Auto-Sync', desc: 'Sync on create' },
                  { icon: Settings, label: 'Smart Mapping', desc: 'Auto category mapping' }
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="flex items-start gap-2.5 p-2.5 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                      <div className="p-1.5 bg-[#2CA01C]/10 rounded-md flex-shrink-0">
                        <Icon size={14} className="text-[#2CA01C]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-900 dark:text-gray-100">{item.label}</p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">{item.desc}</p>
                      </div>
                    </div>
                  );
                })}
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
          if (onSyncComplete) onSyncComplete();
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
