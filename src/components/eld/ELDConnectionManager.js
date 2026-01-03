"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  Link2,
  Unlink,
  CheckCircle,
  AlertCircle,
  Truck,
  User,
  RefreshCw,
  Settings,
  ChevronDown,
  ChevronUp,
  Loader2,
  Zap,
  Clock,
  AlertTriangle
} from 'lucide-react';
import ProviderSelectButton from './ProviderSelectButton';
import ELDSyncStatus from './ELDSyncStatus';
import { OperationMessage } from '@/components/ui/OperationMessage';

// ELD Provider info for display
const PROVIDER_INFO = {
  motive: { name: 'Motive (KeepTruckin)', color: 'bg-green-500', shortName: 'Motive' },
  samsara: { name: 'Samsara', color: 'bg-blue-500', shortName: 'Samsara' },
  keeptruckin: { name: 'Motive (KeepTruckin)', color: 'bg-green-500', shortName: 'Motive' },
  geotab: { name: 'Geotab', color: 'bg-purple-500', shortName: 'Geotab' },
  omnitracs: { name: 'Omnitracs', color: 'bg-orange-500', shortName: 'Omnitracs' },
  other: { name: 'Other Provider', color: 'bg-gray-500', shortName: 'Other' }
};

// Status display configuration
const STATUS_CONFIG = {
  active: {
    icon: CheckCircle,
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-100 dark:bg-green-900/30',
    label: 'Connected'
  },
  pending: {
    icon: Clock,
    color: 'text-yellow-600 dark:text-yellow-400',
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    label: 'Pending'
  },
  token_expired: {
    icon: AlertTriangle,
    color: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    label: 'Token Expired'
  },
  error: {
    icon: AlertCircle,
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-100 dark:bg-red-900/30',
    label: 'Error'
  },
  disconnected: {
    icon: AlertCircle,
    color: 'text-gray-600 dark:text-gray-400',
    bg: 'bg-gray-100 dark:bg-gray-700',
    label: 'Disconnected'
  }
};

/**
 * ELDConnectionManager - Manages ELD provider connections
 *
 * @param {function} onConnectionChange - Callback when connection status changes
 */
export default function ELDConnectionManager({ onConnectionChange }) {
  const [user, setUser] = useState(null);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [expandedConnection, setExpandedConnection] = useState(null);
  const [disconnecting, setDisconnecting] = useState(null);
  const [autoMatching, setAutoMatching] = useState(null);
  const [reconnecting, setReconnecting] = useState(null);

  // Load user and connections
  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    try {
      setLoading(true);

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) return;

      setUser(user);

      // Fetch connections from API
      const response = await fetch('/api/eld/connections');
      const data = await response.json();

      if (response.ok) {
        setConnections(data.connections || []);
      }
    } catch (err) {
      console.error('Failed to load connections:', err);
      setMessage({ type: 'error', text: 'Failed to load ELD connections' });
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async (connectionId) => {
    if (disconnecting) return;

    setDisconnecting(connectionId);

    try {
      const response = await fetch('/api/eld/connections', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionId })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to disconnect');
      }

      setConnections(prev => prev.filter(c => c.id !== connectionId));
      setMessage({ type: 'success', text: 'ELD provider disconnected successfully' });
      onConnectionChange?.();
    } catch (err) {
      console.error('Disconnect error:', err);
      setMessage({ type: 'error', text: err.message || 'Failed to disconnect' });
    } finally {
      setDisconnecting(null);
    }
  };

  const handleReconnect = async (connection) => {
    if (reconnecting) return;

    setReconnecting(connection.id);

    try {
      // Initiate OAuth flow for reconnection
      const response = await fetch('/api/eld/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'initiate-oauth',
          provider: connection.provider,
          reconnect: true,
          connectionId: connection.id
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initiate reconnection');
      }

      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (err) {
      console.error('Reconnect error:', err);
      setMessage({ type: 'error', text: err.message || 'Failed to reconnect' });
    } finally {
      setReconnecting(null);
    }
  };

  const handleAutoMatch = async (connectionId) => {
    if (autoMatching) return;

    setAutoMatching(connectionId);

    try {
      const response = await fetch('/api/eld/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'auto-match',
          connectionId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Auto-match failed');
      }

      const totalMatched = (data.vehicleMatches?.length || 0) + (data.driverMatches?.length || 0);
      setMessage({
        type: 'success',
        text: `Auto-matched ${totalMatched} items (${data.vehicleMatches?.length || 0} vehicles, ${data.driverMatches?.length || 0} drivers)`
      });

      // Reload to show updated mappings
      loadConnections();
    } catch (err) {
      console.error('Auto-match error:', err);
      setMessage({ type: 'error', text: err.message || 'Auto-match failed' });
    } finally {
      setAutoMatching(null);
    }
  };

  const handleConnectionSuccess = ({ provider, message: msg }) => {
    setMessage({ type: 'info', text: msg || `Connecting to ${provider}...` });
  };

  const handleConnectionError = (error) => {
    setMessage({ type: 'error', text: error });
  };

  const getProviderInfo = (provider) => {
    const key = provider?.toLowerCase() || 'other';
    return PROVIDER_INFO[key] || PROVIDER_INFO.other;
  };

  const getStatusConfig = (status) => {
    return STATUS_CONFIG[status] || STATUS_CONFIG.error;
  };

  // Get list of already connected provider IDs
  const connectedProviders = connections.map(c => c.provider?.toLowerCase()).filter(Boolean);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-4"></div>
          <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700 p-5 rounded-t-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Zap size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">ELD Integration</h3>
              <p className="text-sm text-blue-100">Connect your ELD provider for automated data sync</p>
            </div>
          </div>
          <ProviderSelectButton
            onSuccess={handleConnectionSuccess}
            onError={handleConnectionError}
            existingProviders={connectedProviders}
            variant="secondary"
            className="bg-white/20 hover:bg-white/30 text-white border-white/30"
          >
            <span>{connections.length > 0 ? 'Add Provider' : 'Connect ELD'}</span>
          </ProviderSelectButton>
        </div>
      </div>

      {/* Messages */}
      <OperationMessage message={message} onDismiss={() => setMessage(null)} />

      {/* Content */}
      <div className="p-5">
        {connections.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Link2 size={24} className="text-gray-400" />
            </div>
            <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No ELD Provider Connected
            </h4>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
              Connect your ELD device to automatically sync mileage, HOS logs, GPS locations,
              and vehicle diagnostics.
            </p>
            <div className="flex flex-wrap justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">Samsara</span>
              <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">Motive</span>
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">More coming soon</span>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {connections.map((connection) => {
              const providerInfo = getProviderInfo(connection.provider);
              const statusConfig = getStatusConfig(connection.status);
              const StatusIcon = statusConfig.icon;
              const isExpanded = expandedConnection === connection.id;
              const needsReconnect = ['token_expired', 'error', 'disconnected'].includes(connection.status);

              return (
                <div
                  key={connection.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                >
                  {/* Connection Header */}
                  <div
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    onClick={() => setExpandedConnection(isExpanded ? null : connection.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${providerInfo.color} rounded-lg flex items-center justify-center`}>
                        <span className="text-white font-bold text-sm">
                          {providerInfo.shortName.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">
                          {providerInfo.name}
                        </h4>
                        <div className="flex items-center gap-2 text-sm">
                          <span className={`flex items-center gap-1 ${statusConfig.color}`}>
                            <StatusIcon size={14} />
                            {statusConfig.label}
                          </span>
                          {connection.company_name && (
                            <span className="text-gray-400">
                              · {connection.company_name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {needsReconnect && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReconnect(connection);
                          }}
                          disabled={reconnecting === connection.id}
                          className="px-3 py-1.5 text-sm font-medium bg-blue-600 hover:bg-blue-700
                            text-white rounded-lg transition-colors disabled:opacity-50"
                        >
                          {reconnecting === connection.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            'Reconnect'
                          )}
                        </button>
                      )}
                      {!needsReconnect && (
                        <ELDSyncStatus
                          connectionId={connection.id}
                          lastSyncAt={connection.last_sync_at}
                          status={connection.status}
                          compact
                        />
                      )}
                      {isExpanded ? (
                        <ChevronUp size={20} className="text-gray-400" />
                      ) : (
                        <ChevronDown size={20} className="text-gray-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 p-4">
                      {/* Stats */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center">
                          <Truck size={20} className="mx-auto mb-1 text-blue-500" />
                          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {connection.mapped_vehicles || 0}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Vehicles Mapped</p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center">
                          <User size={20} className="mx-auto mb-1 text-green-500" />
                          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {connection.mapped_drivers || 0}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Drivers Mapped</p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center">
                          <RefreshCw size={20} className="mx-auto mb-1 text-purple-500" />
                          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {connection.sync_count || 0}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Total Syncs</p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center">
                          <CheckCircle size={20} className="mx-auto mb-1 text-amber-500" />
                          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {connection.successful_syncs || 0}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Successful</p>
                        </div>
                      </div>

                      {/* Error Message */}
                      {connection.error_message && (
                        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                          <p className="text-sm text-red-700 dark:text-red-400">
                            <AlertCircle size={14} className="inline mr-1" />
                            {connection.error_message}
                          </p>
                        </div>
                      )}

                      {/* Sync Status (full view) */}
                      {connection.status === 'active' && (
                        <ELDSyncStatus
                          connectionId={connection.id}
                          lastSyncAt={connection.last_sync_at}
                          status={connection.status}
                          onSyncRequested={loadConnections}
                        />
                      )}

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button
                          onClick={() => handleAutoMatch(connection.id)}
                          disabled={autoMatching === connection.id || connection.status !== 'active'}
                          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium
                            text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20
                            rounded-lg transition-colors disabled:opacity-50"
                        >
                          {autoMatching === connection.id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Settings size={16} />
                          )}
                          Auto-Match Vehicles & Drivers
                        </button>

                        <button
                          onClick={() => handleDisconnect(connection.id)}
                          disabled={disconnecting === connection.id}
                          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium
                            text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20
                            rounded-lg transition-colors disabled:opacity-50 ml-auto"
                        >
                          {disconnecting === connection.id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Unlink size={16} />
                          )}
                          Disconnect
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
