'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { FeatureGate } from '@/components/billing/FeatureGate';
import QuickBooksCategoryMappingModal from '@/components/expenses/QuickBooksCategoryMappingModal';
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
  ToggleLeft,
  ToggleRight,
  FileText,
  Receipt,
  Building2
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

  // Fetch connection status and sync records
  const fetchConnectionData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await getAuthToken();

      // Fetch connection status
      const statusRes = await fetch('/api/quickbooks/status', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (statusRes.ok) {
        const data = await statusRes.json();
        setConnection(data.connection || null);
      }

      // Fetch sync records
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

  // Connect to QuickBooks
  const handleConnect = async () => {
    setConnecting(true);
    setError(null);
    try {
      const token = await getAuthToken();
      const res = await fetch('/api/quickbooks/connect', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        setError('Failed to get authorization URL');
      }
    } catch (err) {
      setError('Failed to initiate connection');
    } finally {
      setConnecting(false);
    }
  };

  // Disconnect from QuickBooks
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
    } catch (err) {
      setError('Failed to disconnect from QuickBooks');
    } finally {
      setDisconnecting(false);
    }
  };

  // Toggle auto-sync
  const handleToggleSync = async (field) => {
    if (!connection) return;
    setTogglingSync(field);
    try {
      const newValue = !connection[field];
      const { error: updateError } = await supabase
        .from('quickbooks_connections')
        .update({ [field]: newValue, updated_at: new Date().toISOString() })
        .eq('id', connection.id);

      if (updateError) throw updateError;
      setConnection(prev => ({ ...prev, [field]: newValue }));
      setSuccess(`Auto-sync ${field === 'auto_sync_expenses' ? 'expenses' : 'invoices'} ${newValue ? 'enabled' : 'disabled'}`);
    } catch (err) {
      setError('Failed to update sync setting');
    } finally {
      setTogglingSync(null);
    }
  };

  // Retry a failed sync
  const handleRetrySync = async (record) => {
    setRetrying(record.id);
    setError(null);
    try {
      const token = await getAuthToken();
      const res = await fetch('/api/quickbooks/sync', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: record.sync_type,
          entityId: record.entity_id,
          entityType: record.entity_type
        })
      });

      if (res.ok) {
        setSuccess('Sync retry initiated');
        await fetchConnectionData();
      } else {
        const data = await res.json();
        setError(data.error || 'Retry failed');
      }
    } catch (err) {
      setError('Failed to retry sync');
    } finally {
      setRetrying(null);
    }
  };

  // Clear messages after timeout
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

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"><CheckCircle size={12} /> Connected</span>;
      case 'expired':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"><AlertCircle size={12} /> Token Expired</span>;
      case 'error':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"><XCircle size={12} /> Error</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">{status}</span>;
    }
  };

  const getSyncStatusBadge = (status) => {
    switch (status) {
      case 'success':
        return <span className="text-green-600 dark:text-green-400"><CheckCircle size={14} /></span>;
      case 'failed':
        return <span className="text-red-600 dark:text-red-400"><XCircle size={14} /></span>;
      case 'pending':
        return <span className="text-yellow-600 dark:text-yellow-400"><Clock size={14} /></span>;
      default:
        return <span className="text-gray-400"><Clock size={14} /></span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="animate-spin text-blue-500" size={24} />
        <span className="ml-2 text-gray-500 dark:text-gray-400">Loading QuickBooks settings...</span>
      </div>
    );
  }

  return (
    <FeatureGate feature="quickbooksIntegration" fallbackMessage="QuickBooks integration is available on the Professional plan and above.">
      <div className="space-y-6">
        {/* Status Messages */}
        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
            <XCircle size={16} /> {error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400 text-sm">
            <CheckCircle size={16} /> {success}
          </div>
        )}

        {/* Connection Status Card */}
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <Building2 className="text-green-600 dark:text-green-400" size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">QuickBooks Online</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {connection ? connection.company_name : 'Not connected'}
                </p>
              </div>
            </div>
            {connection && getStatusBadge(connection.status)}
          </div>

          {connection ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Company:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-white">{connection.company_name}</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Connected:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-white">
                    {new Date(connection.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Realm ID:</span>
                  <span className="ml-2 font-mono text-xs text-gray-600 dark:text-gray-300">{connection.realm_id}</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Token Expires:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-white">
                    {connection.token_expires_at
                      ? new Date(connection.token_expires_at).toLocaleString()
                      : 'N/A'}
                  </span>
                </div>
              </div>

              {connection.status === 'expired' && (
                <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-yellow-700 dark:text-yellow-400 text-sm">
                  <AlertCircle size={16} />
                  Token expired. Click reconnect to refresh your connection.
                  <button onClick={handleConnect} className="ml-auto text-yellow-800 dark:text-yellow-300 font-medium underline hover:no-underline">
                    Reconnect
                  </button>
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  onClick={handleConnect}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                >
                  <RefreshCw size={14} /> Reconnect
                </button>
                <button
                  onClick={() => setShowDisconnectConfirm(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                >
                  <Unlink size={14} /> Disconnect
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500 dark:text-gray-400 mb-4 text-sm">
                Connect your QuickBooks Online account to automatically sync expenses and invoices.
              </p>
              <button
                onClick={handleConnect}
                disabled={connecting}
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {connecting ? <RefreshCw size={16} className="animate-spin" /> : <Link2 size={16} />}
                {connecting ? 'Connecting...' : 'Connect QuickBooks'}
              </button>
            </div>
          )}
        </div>

        {/* Disconnect Confirmation */}
        {showDisconnectConfirm && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <p className="text-red-700 dark:text-red-400 font-medium mb-2">Disconnect QuickBooks?</p>
            <p className="text-red-600 dark:text-red-400 text-sm mb-4">
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
        )}

        {/* Auto-Sync Settings */}
        {connection && (
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
              <Zap size={18} className="text-blue-500" /> Auto-Sync Settings
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <Receipt className="text-gray-400" size={18} />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">Auto-sync Expenses</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Automatically push new expenses to QuickBooks</p>
                  </div>
                </div>
                <button
                  onClick={() => handleToggleSync('auto_sync_expenses')}
                  disabled={togglingSync === 'auto_sync_expenses'}
                  className="text-blue-600 dark:text-blue-400"
                >
                  {connection.auto_sync_expenses
                    ? <ToggleRight size={32} className="text-blue-600 dark:text-blue-400" />
                    : <ToggleLeft size={32} className="text-gray-400" />}
                </button>
              </div>

              <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <FileText className="text-gray-400" size={18} />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">Auto-sync Invoices</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Automatically push new invoices to QuickBooks</p>
                  </div>
                </div>
                <button
                  onClick={() => handleToggleSync('auto_sync_invoices')}
                  disabled={togglingSync === 'auto_sync_invoices'}
                  className="text-blue-600 dark:text-blue-400"
                >
                  {connection.auto_sync_invoices
                    ? <ToggleRight size={32} className="text-blue-600 dark:text-blue-400" />
                    : <ToggleLeft size={32} className="text-gray-400" />}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Category Mapping */}
        {connection && (
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Settings size={18} className="text-blue-500" /> Category Mapping
              </h3>
              <button
                onClick={() => setShowMappingModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
              >
                <Settings size={14} /> Configure Mapping
              </button>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Map your Truck Command expense categories to QuickBooks accounts for accurate bookkeeping.
            </p>
          </div>
        )}

        {/* Sync History */}
        {connection && syncRecords.length > 0 && (
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
              <Clock size={18} className="text-blue-500" /> Sync History
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">Status</th>
                    <th className="text-left py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">Type</th>
                    <th className="text-left py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">Entity</th>
                    <th className="text-left py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">Date</th>
                    <th className="text-left py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">Error</th>
                    <th className="text-right py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {syncRecords.map((record) => (
                    <tr key={record.id} className="border-b border-gray-100 dark:border-gray-700/50">
                      <td className="py-2.5 px-3">{getSyncStatusBadge(record.status)}</td>
                      <td className="py-2.5 px-3 text-gray-700 dark:text-gray-300 capitalize">{record.sync_type}</td>
                      <td className="py-2.5 px-3 text-gray-700 dark:text-gray-300 capitalize">{record.entity_type}</td>
                      <td className="py-2.5 px-3 text-gray-500 dark:text-gray-400">
                        {new Date(record.created_at).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-red-500 dark:text-red-400 text-xs max-w-[200px] truncate">
                        {record.error_message || '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {record.status === 'failed' && (
                          <button
                            onClick={() => handleRetrySync(record)}
                            disabled={retrying === record.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors disabled:opacity-50"
                          >
                            {retrying === record.id ? <RefreshCw size={12} className="animate-spin" /> : <RotateCcw size={12} />}
                            Retry
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty state for no sync records */}
        {connection && syncRecords.length === 0 && (
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700 text-center">
            <Clock className="mx-auto text-gray-400 mb-2" size={24} />
            <p className="text-gray-500 dark:text-gray-400 text-sm">No sync records yet. Syncs will appear here as expenses and invoices are pushed to QuickBooks.</p>
          </div>
        )}

        {/* Category Mapping Modal */}
        {showMappingModal && connection && (
          <QuickBooksCategoryMappingModal
            connectionId={connection.id}
            userId={user?.id}
            onClose={() => setShowMappingModal(false)}
          />
        )}
      </div>
    </FeatureGate>
  );
}
