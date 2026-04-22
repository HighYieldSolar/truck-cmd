'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { FeatureGate } from '@/components/billing/FeatureGate';
import QuickBooksCategoryMappingModal from '@/components/expenses/QuickBooksCategoryMappingModal';
import Image from 'next/image';
import Link from 'next/link';
import {
  Link2,
  Unlink,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  XCircle,
  Settings,
  Clock,
  Zap,
  RotateCcw,
  Receipt,
  Building2,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Loader2,
  X,
  Wand2,
  Upload
} from 'lucide-react';

export default function QuickBooksSettings() {
  const [user, setUser] = useState(null);
  const { canAccess } = useFeatureAccess();
  const hasAccess = canAccess('quickbooksIntegration');

  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [connection, setConnection] = useState(null);
  const [syncRecords, setSyncRecords] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const [showMappingModal, setShowMappingModal] = useState(false);
  const [retrying, setRetrying] = useState(null);
  const [togglingSync, setTogglingSync] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    }
    init();
  }, []);

  const getAuthToken = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  }, []);

  const fetchConnectionData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await getAuthToken();

      const statusRes = await fetch('/api/quickbooks/status', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (statusRes.ok) {
        const data = await statusRes.json();
        setConnection(data.connection || null);
      }

      const { data: records } = await supabase
        .from('quickbooks_sync_records')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      setSyncRecords(records || []);
    } catch (err) {
      console.error('Error fetching QB data:', err);
    } finally {
      setLoading(false);
    }
  }, [user, getAuthToken]);

  useEffect(() => {
    if (user) fetchConnectionData();
  }, [user, fetchConnectionData]);

  const handleConnect = async () => {
    setConnecting(true);
    setError(null);
    try {
      const token = await getAuthToken();
      const res = await fetch('/api/quickbooks/connect', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        setError(data.error || 'Failed to get authorization URL');
      }
    } catch (_err) {
      setError('Failed to initiate connection');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    setError(null);
    try {
      const token = await getAuthToken();
      const res = await fetch('/api/quickbooks/disconnect', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setConnection(null);
        setSyncRecords([]);
        setSuccess('QuickBooks disconnected successfully');
        setShowDisconnectConfirm(false);
      } else {
        setError('Failed to disconnect');
      }
    } catch (_err) {
      setError('Failed to disconnect from QuickBooks');
    } finally {
      setDisconnecting(false);
    }
  };

  const handleToggleAutoSync = async () => {
    if (!connection) return;
    setTogglingSync('autoSyncExpenses');
    const newValue = !connection.autoSyncExpenses;
    // Optimistic update for snappier UX
    setConnection(prev => ({ ...prev, autoSyncExpenses: newValue }));
    try {
      const token = await getAuthToken();
      const res = await fetch('/api/quickbooks/settings', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ autoSyncExpenses: newValue }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to update setting');
      }
      setSuccess(`Auto-sync expenses ${newValue ? 'enabled' : 'disabled'}`);
    } catch (err) {
      // Roll back on failure
      setConnection(prev => ({ ...prev, autoSyncExpenses: !newValue }));
      setError(err.message || 'Failed to update sync setting');
    } finally {
      setTogglingSync(null);
    }
  };

  const handleRetrySync = async (record) => {
    // Only expense records are supported (integration is expense-only)
    if (record.entity_type !== 'expense') {
      setError('Only expense sync retries are supported');
      return;
    }
    setRetrying(record.id);
    setError(null);
    try {
      const token = await getAuthToken();
      const res = await fetch('/api/quickbooks/sync', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'single-expense',
          expenseId: record.local_entity_id,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess('Sync retry succeeded');
        await fetchConnectionData();
      } else {
        setError(data.error || 'Retry failed');
      }
    } catch (_err) {
      setError('Failed to retry sync');
    } finally {
      setRetrying(null);
    }
  };

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const getSyncStatusBadge = (status) => {
    switch (status) {
      case 'synced':
      case 'success':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 text-xs font-medium">
            <CheckCircle size={12} /> Synced
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 text-xs font-medium">
            <XCircle size={12} /> Failed
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 text-xs font-medium">
            <Clock size={12} /> Pending
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 text-xs font-medium">
            {status || 'Unknown'}
          </span>
        );
    }
  };

  // Pill-style toggle switch (matches PrivacySettings / AppearanceSettings)
  const ToggleSwitch = ({ enabled, onChange, disabled }) => (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      disabled={disabled}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-60 ${
        enabled ? 'bg-blue-600 dark:bg-blue-500' : 'bg-gray-200 dark:bg-gray-600'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );

  // Features list (like ELD settings) — expenses only for now
  const features = [
    {
      id: 'expenses',
      name: 'Expense Sync',
      description: 'Push expenses directly to QuickBooks as purchases',
      icon: Receipt,
      href: '/dashboard/expenses',
      active: !!connection
    },
    {
      id: 'mapping',
      name: 'Smart Category Mapping',
      description: 'Auto-map your expense categories to QuickBooks accounts',
      icon: Wand2,
      action: () => setShowMappingModal(true),
      active: !!connection
    },
    {
      id: 'bulk',
      name: 'Bulk Sync',
      description: 'Sync multiple expenses to QuickBooks at once',
      icon: Upload,
      href: '/dashboard/expenses',
      active: !!connection
    }
  ];

  // Premium gate for non-premium users
  if (!hasAccess) {
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="bg-gradient-to-r from-[#2CA01C] to-[#1a7a10] p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Building2 size={24} className="text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold text-white">QuickBooks Integration</h2>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/20 text-white text-xs font-semibold rounded-full">
                    <Zap size={10} />
                    Premium Feature
                  </span>
                </div>
                <p className="text-green-100">Sync your expenses to QuickBooks Online</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <FeatureGate feature="quickbooksIntegration" fallback="prompt" />
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="bg-gradient-to-r from-[#2CA01C] to-[#1a7a10] dark:from-[#238516] dark:to-[#156a0d] p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Building2 size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">QuickBooks Integration</h3>
              <p className="text-sm text-green-100">Loading connection status...</p>
            </div>
          </div>
        </div>
        <div className="p-8 flex items-center justify-center">
          <Loader2 size={32} className="animate-spin text-[#2CA01C]" />
        </div>
      </div>
    );
  }

  const isConnected = !!connection;
  const isExpired = connection?.status === 'expired' || connection?.status === 'token_expired';

  return (
    <FeatureGate feature="quickbooksIntegration" fallbackMessage="QuickBooks integration is available on the Professional plan and above.">
      <div className="space-y-6">
        {/* Connection Manager Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Gradient Header */}
          <div className="bg-gradient-to-r from-[#2CA01C] to-[#1a7a10] dark:from-[#238516] dark:to-[#156a0d] p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg flex-shrink-0">
                  <Building2 size={20} className="text-white" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-white">QuickBooks Integration</h3>
                    {isConnected && !isExpired && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/20 text-white text-xs font-semibold rounded-full">
                        <CheckCircle size={10} />
                        Active
                      </span>
                    )}
                    {isExpired && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-400/30 text-white text-xs font-semibold rounded-full">
                        <AlertCircle size={10} />
                        Expired
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-green-100 hidden sm:block">
                    {isConnected
                      ? `Connected to ${connection.company_name || 'QuickBooks Online'}`
                      : 'Connect your QuickBooks account for automated bookkeeping'
                    }
                  </p>
                </div>
              </div>

              {isConnected && !isExpired && (
                <button
                  onClick={handleConnect}
                  className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-sm rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw size={14} />
                  Refresh Connection
                </button>
              )}
            </div>
          </div>

          {/* Messages */}
          {error && (
            <div className="mx-5 mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
              <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-300 flex-1">{error}</p>
              <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
                <X size={14} />
              </button>
            </div>
          )}

          {success && (
            <div className="mx-5 mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-start gap-2">
              <CheckCircle size={16} className="text-green-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-700 dark:text-green-300 flex-1">{success}</p>
              <button onClick={() => setSuccess(null)} className="text-green-500 hover:text-green-700">
                <X size={14} />
              </button>
            </div>
          )}

          {/* Content */}
          <div className="p-5 sm:p-6">
            {isConnected ? (
              <div className="space-y-6">
                {/* Connection Info Card */}
                <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 sm:p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-white dark:bg-gray-800 p-2 flex-shrink-0 border border-gray-200 dark:border-gray-600">
                      <Image
                        src="/images/eld/QuickBooksLogo.png"
                        alt="QuickBooks"
                        width={48}
                        height={48}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                          {connection.company_name || 'QuickBooks Online'}
                        </h4>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${isExpired
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          }`}>
                          {isExpired ? (
                            <><AlertCircle size={10} /> Expired</>
                          ) : (
                            <><CheckCircle size={10} /> Connected</>
                          )}
                        </span>
                      </div>
                      {connection.realm_id && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                          Realm ID: <span className="font-mono text-xs">{connection.realm_id}</span>
                        </p>
                      )}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500 dark:text-gray-400 text-xs">Connected On</p>
                          <p className="text-gray-900 dark:text-gray-100 font-medium">
                            {new Date(connection.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400 text-xs">Token Expires</p>
                          <p className="text-gray-900 dark:text-gray-100 font-medium">
                            {connection.token_expires_at
                              ? new Date(connection.token_expires_at).toLocaleString()
                              : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expired Token Warning */}
                {isExpired && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-red-700 dark:text-red-400 font-medium">
                        Your connection has expired. Reconnect to continue syncing.
                      </p>
                    </div>
                    <button
                      onClick={handleConnect}
                      disabled={connecting}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                    >
                      {connecting ? 'Connecting...' : 'Reconnect'}
                    </button>
                  </div>
                )}

                {/* Advanced Options */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                  >
                    <Settings size={14} />
                    Advanced Options
                    {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>

                  {showAdvanced && (
                    <div className="mt-4 space-y-3">
                      <button
                        onClick={handleConnect}
                        disabled={connecting}
                        className="w-full px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2 text-sm"
                      >
                        <RefreshCw size={14} />
                        Reconnect / Re-authorize
                      </button>
                      {showDisconnectConfirm ? (
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                          <p className="text-red-700 dark:text-red-400 text-sm mb-3">
                            This will stop syncing and remove your QuickBooks connection. Your existing data in Truck Command will not be affected.
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={handleDisconnect}
                              disabled={disconnecting}
                              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
                            >
                              {disconnecting ? 'Disconnecting...' : 'Yes, Disconnect'}
                            </button>
                            <button
                              onClick={() => setShowDisconnectConfirm(false)}
                              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowDisconnectConfirm(true)}
                          className="w-full px-4 py-2.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors flex items-center justify-center gap-2 text-sm"
                        >
                          <Unlink size={14} />
                          Disconnect QuickBooks
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Not Connected State */
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-[#2CA01C]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Image
                      src="/images/eld/QuickBooksLogo.png"
                      alt="QuickBooks"
                      width={36}
                      height={36}
                      className="object-contain"
                    />
                  </div>
                  <h4 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Connect to QuickBooks Online
                  </h4>
                  <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                    Sync your expenses directly to QuickBooks for seamless bookkeeping.
                  </p>
                </div>

                <div className="flex justify-center">
                  <button
                    onClick={handleConnect}
                    disabled={connecting}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#2CA01C] hover:bg-[#238516] text-white font-medium rounded-xl transition-colors disabled:opacity-50 shadow-sm"
                  >
                    {connecting ? (
                      <><RefreshCw size={18} className="animate-spin" /> Connecting...</>
                    ) : (
                      <><Link2 size={18} /> Connect QuickBooks</>
                    )}
                  </button>
                </div>

                {/* Security Note */}
                <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                  <ShieldCheck size={20} className="text-[#2CA01C] flex-shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-medium text-gray-900 dark:text-gray-100 text-sm mb-1">
                      Secure OAuth Connection
                    </h5>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      You'll be redirected to Intuit to authorize access. We never see your QuickBooks login credentials.
                      Your data is encrypted and securely stored.
                    </p>
                  </div>
                </div>

                {/* What You'll Get */}
                <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 sm:p-5">
                  <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                    What You'll Get
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { icon: Receipt, name: 'Expense Sync', desc: 'Push expenses as QuickBooks purchases' },
                      { icon: Wand2, name: 'Auto-Mapping', desc: 'Smart category-to-account mapping' },
                      { icon: Zap, name: 'Auto-Sync', desc: 'Sync automatically on create' },
                      { icon: Upload, name: 'Bulk Sync', desc: 'Sync multiple expenses at once' }
                    ].map((feature) => {
                      const FeatureIcon = feature.icon;
                      return (
                        <div
                          key={feature.name}
                          className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600"
                        >
                          <div className="p-2 bg-[#2CA01C]/10 rounded-lg flex-shrink-0">
                            <FeatureIcon size={16} className="text-[#2CA01C]" />
                          </div>
                          <div className="min-w-0">
                            <h6 className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                              {feature.name}
                            </h6>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              {feature.desc}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Features List (like ELD) */}
        {isConnected && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="bg-gray-50 dark:bg-gray-700/50 px-5 py-4 border-b border-gray-200 dark:border-gray-600">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-gray-700 dark:text-gray-200">QuickBooks Features</h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded-full">
                  <CheckCircle size={10} />
                  Active
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Features available with your QuickBooks connection
              </p>
            </div>

            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {features.map((feature) => {
                const FeatureIcon = feature.icon;
                return (
                  <div key={feature.id} className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                        <div className="p-2 rounded-lg flex-shrink-0 bg-green-100 dark:bg-green-900/30">
                          <FeatureIcon size={18} className="text-green-600 dark:text-green-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-medium text-gray-900 dark:text-gray-100">
                              {feature.name}
                            </h4>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full">
                              <CheckCircle size={10} />
                              Active
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            {feature.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex-shrink-0 pl-11 sm:pl-0">
                        {feature.action ? (
                          <button
                            onClick={feature.action}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded-lg transition-colors"
                          >
                            Configure
                            <ArrowRight size={14} />
                          </button>
                        ) : (
                          <Link
                            href={feature.href}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded-lg transition-colors"
                          >
                            View
                            <ArrowRight size={14} />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Auto-Sync Settings */}
        {isConnected && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="bg-gray-50 dark:bg-gray-700/50 px-5 py-4 border-b border-gray-200 dark:border-gray-600">
              <h3 className="font-medium text-gray-700 dark:text-gray-200 flex items-center gap-2">
                <Zap size={16} className="text-[#2CA01C]" />
                Auto-Sync Settings
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Automatically push new records to QuickBooks when created
              </p>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-200 dark:border-gray-600">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                    <Receipt className="text-orange-600 dark:text-orange-400" size={18} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">Auto-sync Expenses</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Automatically push new expenses to QuickBooks</p>
                  </div>
                </div>
                <ToggleSwitch
                  enabled={!!connection.autoSyncExpenses}
                  onChange={handleToggleAutoSync}
                  disabled={togglingSync === 'autoSyncExpenses'}
                />
              </div>

            </div>
          </div>
        )}

        {/* Sync History */}
        {isConnected && syncRecords.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="bg-gray-50 dark:bg-gray-700/50 px-5 py-4 border-b border-gray-200 dark:border-gray-600">
              <h3 className="font-medium text-gray-700 dark:text-gray-200 flex items-center gap-2">
                <Clock size={16} className="text-[#2CA01C]" />
                Recent Sync History
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {syncRecords.length > 10
                  ? `Showing latest ${syncRecords.length} sync operations — scroll to see more`
                  : `Latest ${syncRecords.length} sync operation${syncRecords.length === 1 ? '' : 's'}`}
              </p>
            </div>

            {/* Scroll container: ~10 rows visible (table row ~52px), then scroll */}
            <div className="overflow-x-auto overflow-y-auto max-h-[520px]">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-700/50 shadow-sm">
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2.5 px-4 text-gray-500 dark:text-gray-400 font-medium text-xs uppercase tracking-wider">Status</th>
                    <th className="text-left py-2.5 px-4 text-gray-500 dark:text-gray-400 font-medium text-xs uppercase tracking-wider">Entity</th>
                    <th className="text-left py-2.5 px-4 text-gray-500 dark:text-gray-400 font-medium text-xs uppercase tracking-wider">QuickBooks ID</th>
                    <th className="text-left py-2.5 px-4 text-gray-500 dark:text-gray-400 font-medium text-xs uppercase tracking-wider">Last Synced</th>
                    <th className="text-left py-2.5 px-4 text-gray-500 dark:text-gray-400 font-medium text-xs uppercase tracking-wider">Error</th>
                    <th className="text-right py-2.5 px-4 text-gray-500 dark:text-gray-400 font-medium text-xs uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                  {syncRecords.map((record) => {
                    const entityLabel = record.qb_entity_type || (record.entity_type ? record.entity_type.charAt(0).toUpperCase() + record.entity_type.slice(1) : '—');
                    const syncedAt = record.last_synced_at || record.updated_at || record.created_at;
                    return (
                      <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                        <td className="py-3 px-4">{getSyncStatusBadge(record.sync_status)}</td>
                        <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{entityLabel}</td>
                        <td className="py-3 px-4 text-gray-500 dark:text-gray-400 font-mono text-xs">
                          {record.qb_entity_id || '—'}
                        </td>
                        <td className="py-3 px-4 text-gray-500 dark:text-gray-400">
                          {syncedAt ? new Date(syncedAt).toLocaleString() : '—'}
                        </td>
                        <td className="py-3 px-4 text-red-500 dark:text-red-400 text-xs max-w-[200px] truncate" title={record.error_message || ''}>
                          {record.error_message || '—'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {record.sync_status === 'failed' && (
                            <button
                              onClick={() => handleRetrySync(record)}
                              disabled={retrying === record.id}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[#2CA01C] bg-green-50 dark:bg-green-900/20 rounded-md hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors disabled:opacity-50"
                            >
                              {retrying === record.id ? <RefreshCw size={12} className="animate-spin" /> : <RotateCcw size={12} />}
                              Retry
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty Sync History */}
        {isConnected && syncRecords.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 text-center">
            <Clock className="mx-auto text-gray-400 mb-2" size={24} />
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No sync records yet. Records will appear here as expenses are pushed to QuickBooks.
            </p>
          </div>
        )}

        {/* Help Section */}
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800 p-5">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg flex-shrink-0">
              <HelpCircle size={20} className="text-[#2CA01C]" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                How QuickBooks Integration Works
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Connect your QuickBooks Online account using secure OAuth authentication.
                Once connected, your expenses are synced automatically or manually to QuickBooks.
                Map your Truck Command categories to QuickBooks accounts for accurate bookkeeping.
              </p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <Link
                  href="/dashboard/support"
                  className="inline-flex items-center text-sm text-[#2CA01C] hover:underline leading-none"
                >
                  Contact Support
                </Link>
                <span className="text-gray-300 dark:text-gray-600 leading-none select-none" aria-hidden="true">|</span>
                <a
                  href="https://quickbooks.intuit.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-[#2CA01C] hover:underline leading-none"
                >
                  QuickBooks Online
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Category Mapping Modal */}
        {showMappingModal && connection && (
          <QuickBooksCategoryMappingModal
            isOpen={showMappingModal}
            onClose={() => setShowMappingModal(false)}
            onSave={() => {
              setShowMappingModal(false);
              fetchConnectionData();
            }}
          />
        )}
      </div>
    </FeatureGate>
  );
}
