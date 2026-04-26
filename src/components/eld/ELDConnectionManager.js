"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Image from 'next/image';
import {
  Zap,
  Clock,
  MapPin,
  FileText,
  Wrench,
  Truck,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Settings,
  Unplug,
  Link2,
  ExternalLink,
  Loader2,
  ShieldCheck,
  Activity,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

/**
 * ELDConnectionManager - Production-ready ELD connection management
 *
 * Handles:
 * - OAuth connection flow for Motive/Samsara
 * - Connection status display
 * - Manual sync triggering
 * - Disconnect functionality
 */
export default function ELDConnectionManager({ onConnectionChange }) {
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [connectionData, setConnectionData] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  // Supported providers
  const providers = [
    {
      id: 'motive',
      name: 'Motive',
      logo: '/images/eld/motive.webp',
      description: 'Connect to Motive (KeepTruckin) ELD',
      color: 'from-green-500 to-green-600'
    },
    {
      id: 'samsara',
      name: 'Samsara',
      logo: '/images/eld/samsara.webp',
      description: 'Connect to Samsara Fleet',
      color: 'from-blue-500 to-blue-600'
    }
  ];

  // Load connection status
  const loadConnectionStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/eld/connections', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 403) {
          // User doesn't have access - this is handled by parent component
          return;
        }
        throw new Error(data.error || 'Failed to load connection status');
      }

      setConnectionData(data);
      onConnectionChange?.(data);
    } catch (err) {
      console.error('Error loading connection status:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [onConnectionChange]);

  useEffect(() => {
    loadConnectionStatus();
  }, [loadConnectionStatus]);

  // Initiate OAuth connection
  const initiateConnection = async (providerId) => {
    try {
      setConnecting(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Please log in to connect your ELD');
        return;
      }

      const response = await fetch('/api/eld/connections', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'initiate-oauth',
          provider: providerId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initiate connection');
      }

      // Redirect to OAuth provider
      window.location.href = data.authUrl;
    } catch (err) {
      console.error('Error initiating connection:', err);
      setError(err.message);
      setConnecting(false);
    }
  };

  // Trigger manual sync
  const triggerSync = async () => {
    if (!connectionData?.primaryConnection) return;

    try {
      setSyncing(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/eld/sync', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          connectionId: connectionData.primaryConnection.id,
          fullSync: false
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Sync failed');
      }

      setSuccess('Sync completed successfully!');
      setTimeout(() => setSuccess(null), 5000);

      // Reload status
      await loadConnectionStatus();
    } catch (err) {
      console.error('Error syncing:', err);
      setError(err.message);
    } finally {
      setSyncing(false);
    }
  };

  // Disconnect ELD
  const disconnectEld = async (permanent = false) => {
    if (!connectionData?.primaryConnection) return;

    const confirmMsg = permanent
      ? 'Are you sure you want to permanently delete this ELD connection? All synced data will be removed.'
      : 'Are you sure you want to disconnect this ELD? You can reconnect later.';

    if (!window.confirm(confirmMsg)) return;

    try {
      setDisconnecting(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/eld/connections', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          connectionId: connectionData.primaryConnection.id,
          permanent
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to disconnect');
      }

      setSuccess(permanent ? 'Connection deleted' : 'Disconnected successfully');
      setTimeout(() => setSuccess(null), 5000);

      // Reload status
      await loadConnectionStatus();
    } catch (err) {
      console.error('Error disconnecting:', err);
      setError(err.message);
    } finally {
      setDisconnecting(false);
    }
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const badges = {
      active: { color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle, text: 'Connected' },
      error: { color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: AlertCircle, text: 'Error' },
      expired: { color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: Clock, text: 'Expired' },
      disconnected: { color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400', icon: Unplug, text: 'Disconnected' }
    };
    return badges[status] || badges.disconnected;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Loading state
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Zap size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">ELD Integration</h3>
              <p className="text-sm text-blue-100">Loading connection status...</p>
            </div>
          </div>
        </div>
        <div className="p-8 flex items-center justify-center">
          <Loader2 size={32} className="animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  const isConnected = connectionData?.connected && connectionData?.primaryConnection;
  const connection = connectionData?.primaryConnection;
  const status = getStatusBadge(connection?.status || 'disconnected');
  const StatusIcon = status.icon;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700 p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="p-2 bg-white/20 rounded-lg flex-shrink-0">
              <Zap size={20} className="text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <h3 className="text-lg font-semibold text-white truncate">ELD Integration</h3>
                {isConnected && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-400/90 text-green-900 text-xs font-semibold rounded-full whitespace-nowrap">
                    <CheckCircle size={10} />
                    Active
                  </span>
                )}
              </div>
              <p className="text-sm text-blue-100 hidden sm:block truncate">
                {isConnected
                  ? `Connected to ${connection.provider_name || connection.provider}`
                  : 'Connect your ELD provider for automated data sync'
                }
              </p>
            </div>
          </div>

          {isConnected && (
            <div className="flex items-center gap-2 flex-shrink-0 self-start sm:self-auto">
              <button
                onClick={triggerSync}
                disabled={syncing}
                className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-sm rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
                {syncing ? 'Syncing...' : 'Sync Now'}
              </button>
            </div>
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
          /* Connected State */
          <div className="space-y-6">
            {/* Connection Info Card */}
            <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 sm:p-5">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-white dark:bg-gray-800 p-2 flex-shrink-0 border border-gray-200 dark:border-gray-600">
                  <Image
                    src={providers.find(p => p.id === connection.provider)?.logo || '/images/eld/motive.webp'}
                    alt={connection.provider}
                    width={48}
                    height={48}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {connection.provider_name || connection.provider}
                    </h4>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 ${status.color} text-xs font-medium rounded-full whitespace-nowrap`}>
                      <StatusIcon size={10} />
                      {status.text}
                    </span>
                  </div>
                  {connection.company_name && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 break-words">
                      {connection.company_name}
                    </p>
                  )}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-xs">Last Synced</p>
                      <p className="text-gray-900 dark:text-gray-100 font-medium">
                        {formatDate(connection.last_sync_at)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-xs">Connected On</p>
                      <p className="text-gray-900 dark:text-gray-100 font-medium">
                        {formatDate(connection.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sync Stats */}
            {connection.sync_stats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
                  <Truck size={18} className="mx-auto text-blue-600 dark:text-blue-400 mb-1" />
                  <p className="text-lg font-bold text-blue-900 dark:text-blue-100">{connection.sync_stats.vehicles || 0}</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">Vehicles</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
                  <Activity size={18} className="mx-auto text-green-600 dark:text-green-400 mb-1" />
                  <p className="text-lg font-bold text-green-900 dark:text-green-100">{connection.sync_stats.drivers || 0}</p>
                  <p className="text-xs text-green-600 dark:text-green-400">Drivers</p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 text-center">
                  <MapPin size={18} className="mx-auto text-purple-600 dark:text-purple-400 mb-1" />
                  <p className="text-lg font-bold text-purple-900 dark:text-purple-100">{connection.sync_stats.locations || 0}</p>
                  <p className="text-xs text-purple-600 dark:text-purple-400">GPS Updates</p>
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 text-center">
                  <Clock size={18} className="mx-auto text-amber-600 dark:text-amber-400 mb-1" />
                  <p className="text-lg font-bold text-amber-900 dark:text-amber-100">{connection.sync_stats.hos_logs || 0}</p>
                  <p className="text-xs text-amber-600 dark:text-amber-400">HOS Logs</p>
                </div>
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
                    onClick={() => initiateConnection(connection.provider)}
                    disabled={connecting}
                    className="w-full px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <RefreshCw size={14} />
                    Reconnect / Re-authorize
                  </button>
                  <button
                    onClick={() => disconnectEld(false)}
                    disabled={disconnecting}
                    className="w-full px-4 py-2.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <Unplug size={14} />
                    {disconnecting ? 'Disconnecting...' : 'Disconnect (Keep Data)'}
                  </button>
                  <button
                    onClick={() => disconnectEld(true)}
                    disabled={disconnecting}
                    className="w-full px-4 py-2.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <X size={14} />
                    Delete Connection Permanently
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Not Connected State */
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Link2 size={28} className="text-blue-600 dark:text-blue-400" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Connect Your ELD
              </h4>
              <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                Connect your ELD provider to automatically sync mileage, HOS logs, GPS locations, and vehicle diagnostics.
              </p>
            </div>

            {/* Provider Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {providers.map((provider) => (
                <button
                  key={provider.id}
                  onClick={() => initiateConnection(provider.id)}
                  disabled={connecting}
                  className="relative p-5 bg-gray-50 dark:bg-gray-700/50 rounded-xl border-2 border-gray-200 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-500 transition-all group disabled:opacity-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-white dark:bg-gray-800 p-2 flex-shrink-0 border border-gray-200 dark:border-gray-600">
                      <Image
                        src={provider.logo}
                        alt={provider.name}
                        width={48}
                        height={48}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="text-left">
                      <h5 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {provider.name}
                      </h5>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {provider.description}
                      </p>
                    </div>
                  </div>
                  {connecting && (
                    <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 rounded-xl flex items-center justify-center">
                      <Loader2 size={24} className="animate-spin text-blue-500" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Security Note */}
            <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <ShieldCheck size={20} className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <h5 className="font-medium text-gray-900 dark:text-gray-100 text-sm mb-1">
                  Secure OAuth Connection
                </h5>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  You'll be redirected to your ELD provider to authorize access. We never see your ELD login credentials.
                  Your data is encrypted and securely stored.
                </p>
              </div>
            </div>

            {/* Features Preview */}
            <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 sm:p-5">
              <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                What You'll Get
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { icon: FileText, name: 'IFTA Mileage Sync', desc: 'Auto-import jurisdiction mileage' },
                  { icon: Clock, name: 'HOS Tracking', desc: 'Monitor driver hours and compliance' },
                  { icon: MapPin, name: 'GPS Tracking', desc: 'Real-time vehicle locations' },
                  { icon: Wrench, name: 'Diagnostics', desc: 'Fault codes and vehicle health' }
                ].map((feature) => {
                  const FeatureIcon = feature.icon;
                  return (
                    <div
                      key={feature.name}
                      className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600"
                    >
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex-shrink-0">
                        <FeatureIcon size={16} className="text-blue-600 dark:text-blue-400" />
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
  );
}
