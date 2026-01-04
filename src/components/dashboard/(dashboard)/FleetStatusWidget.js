"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import {
  Truck,
  MapPin,
  RefreshCw,
  Navigation,
  AlertCircle,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';

/**
 * FleetStatusWidget - Compact fleet status display for dashboard
 * Shows vehicle locations and status summary
 */
export default function FleetStatusWidget({ className = '' }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [error, setError] = useState(null);
  const [hasEldConnection, setHasEldConnection] = useState(false);

  const { canAccess } = useFeatureAccess();
  const hasAccess = canAccess('eldGpsTracking');

  useEffect(() => {
    if (hasAccess) {
      loadFleetData();
    } else {
      setLoading(false);
    }
  }, [hasAccess]);

  const loadFleetData = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if user has an active ELD connection
      const { data: connection } = await supabase
        .from('eld_connections')
        .select('id, provider')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .limit(1)
        .single();

      setHasEldConnection(!!connection);

      if (!connection) {
        setLoading(false);
        return;
      }

      // Fetch GPS dashboard data
      const response = await fetch('/api/eld/gps/dashboard');

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to load fleet data');
      }

      const data = await response.json();
      setVehicles(data.vehicles || []);
    } catch (err) {
      console.error('Failed to load fleet data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);

    try {
      const response = await fetch('/api/eld/gps/refresh', { method: 'POST' });
      if (response.ok) {
        await loadFleetData();
      }
    } catch (err) {
      console.error('Refresh failed:', err);
    } finally {
      setRefreshing(false);
    }
  };

  // Not enough tier access
  if (!hasAccess) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}>
        <div className="bg-gradient-to-r from-green-500 to-teal-500 px-5 py-4 text-white">
          <h3 className="font-semibold flex items-center">
            <Navigation size={18} className="mr-2" />
            Fleet Status
          </h3>
        </div>
        <div className="p-6 text-center">
          <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full mx-auto flex items-center justify-center mb-3">
            <Truck size={24} className="text-gray-400" />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Real-time GPS tracking requires Fleet plan or higher
          </p>
          <Link
            href="/dashboard/upgrade"
            className="inline-flex items-center text-sm text-green-600 dark:text-green-400 hover:underline"
          >
            Upgrade to unlock
            <ArrowRight size={14} className="ml-1" />
          </Link>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}>
        <div className="bg-gradient-to-r from-green-500 to-teal-500 px-5 py-4 text-white">
          <h3 className="font-semibold flex items-center">
            <Navigation size={18} className="mr-2" />
            Fleet Status
          </h3>
        </div>
        <div className="p-6 flex items-center justify-center">
          <Loader2 size={24} className="animate-spin text-green-500" />
        </div>
      </div>
    );
  }

  // No ELD connection
  if (!hasEldConnection) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}>
        <div className="bg-gradient-to-r from-green-500 to-teal-500 px-5 py-4 text-white">
          <h3 className="font-semibold flex items-center">
            <Navigation size={18} className="mr-2" />
            Fleet Status
          </h3>
        </div>
        <div className="p-6 text-center">
          <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full mx-auto flex items-center justify-center mb-3">
            <MapPin size={24} className="text-gray-400" />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Connect your ELD to see real-time vehicle locations
          </p>
          <Link
            href="/dashboard/settings/eld"
            className="inline-flex items-center text-sm text-green-600 dark:text-green-400 hover:underline"
          >
            Connect ELD
            <ArrowRight size={14} className="ml-1" />
          </Link>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}>
        <div className="bg-gradient-to-r from-green-500 to-teal-500 px-5 py-4 text-white flex justify-between items-center">
          <h3 className="font-semibold flex items-center">
            <Navigation size={18} className="mr-2" />
            Fleet Status
          </h3>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-1 hover:bg-white/20 rounded transition-colors"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
        <div className="p-6 text-center">
          <AlertCircle size={24} className="mx-auto text-red-500 mb-2" />
          <p className="text-sm text-gray-600 dark:text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  // Calculate stats
  const movingCount = vehicles.filter(v => v.isMoving).length;
  const stoppedCount = vehicles.filter(v => !v.isMoving).length;
  const staleCount = vehicles.filter(v => v.isStale).length;

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-teal-500 px-5 py-4 text-white flex justify-between items-center">
        <h3 className="font-semibold flex items-center">
          <Navigation size={18} className="mr-2" />
          Fleet Status
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-1 hover:bg-white/20 rounded transition-colors"
            title="Refresh locations"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          </button>
          <Link
            href="/dashboard/settings/eld"
            className="text-sm hover:underline"
          >
            View Map
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600">{movingCount}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Moving</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-600 dark:text-gray-300">{stoppedCount}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Stopped</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-amber-600">{staleCount}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Stale</p>
        </div>
      </div>

      {/* Vehicle List (top 4) */}
      {vehicles.length > 0 ? (
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {vehicles.slice(0, 4).map((vehicle) => (
            <div
              key={vehicle.externalVehicleId}
              className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    vehicle.isMoving ? 'bg-green-500 animate-pulse' :
                    vehicle.isStale ? 'bg-amber-500' : 'bg-gray-400'
                  }`} />
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-[120px]">
                    {vehicle.vehicleName}
                  </span>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {vehicle.isMoving ? `${Math.round(vehicle.location?.speedMph || 0)} mph` : 'Stopped'}
                </span>
              </div>
              {vehicle.location?.address && (
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1 ml-4">
                  {vehicle.location.address}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="p-6 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No vehicles with GPS data
          </p>
        </div>
      )}

      {/* Footer */}
      {vehicles.length > 4 && (
        <div className="px-4 py-3 text-center border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
          <Link
            href="/dashboard/settings/eld"
            className="text-sm text-green-600 dark:text-green-400 hover:underline"
          >
            View all {vehicles.length} vehicles
          </Link>
        </div>
      )}
    </div>
  );
}
