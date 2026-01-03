"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  MapPin,
  Truck,
  RefreshCw,
  Maximize2,
  Loader2,
  Navigation,
  Clock,
  AlertCircle
} from 'lucide-react';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { FeatureGate } from '@/components/billing/FeatureGate';

/**
 * GPSTrackingMap - Real-time vehicle location tracking
 * Requires Fleet+ subscription tier
 *
 * @param {function} onVehicleSelect - Callback when a vehicle marker is clicked
 * @param {boolean} compact - Use compact mode for widget display
 * @param {string} className - Additional CSS classes
 */
export default function GPSTrackingMap({
  onVehicleSelect,
  compact = false,
  className = ''
}) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [error, setError] = useState(null);
  const [mapBounds, setMapBounds] = useState(null);

  const { canAccess } = useFeatureAccess();
  const hasAccess = canAccess('eldGpsTracking');

  useEffect(() => {
    if (hasAccess) {
      loadVehicleLocations();
    } else {
      setLoading(false);
    }
  }, [hasAccess]);

  const loadVehicleLocations = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch GPS dashboard data
      const response = await fetch('/api/eld/gps/dashboard');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load GPS data');
      }

      setVehicles(data.vehicles || []);
      setMapBounds(data.bounds);
    } catch (err) {
      console.error('Failed to load GPS data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);

    try {
      // Trigger location refresh from ELD provider
      const response = await fetch('/api/eld/gps/refresh', { method: 'POST' });
      if (response.ok) {
        await loadVehicleLocations();
      }
    } catch (err) {
      console.error('Refresh failed:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleVehicleClick = useCallback((vehicle) => {
    setSelectedVehicle(vehicle);
    onVehicleSelect?.(vehicle);
  }, [onVehicleSelect]);

  const formatSpeed = (speedMph) => {
    if (!speedMph && speedMph !== 0) return '--';
    return `${Math.round(speedMph)} mph`;
  };

  const formatAge = (ageMinutes) => {
    if (!ageMinutes && ageMinutes !== 0) return 'Unknown';
    if (ageMinutes < 1) return 'Just now';
    if (ageMinutes < 60) return `${ageMinutes}m ago`;
    const hours = Math.floor(ageMinutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  // Feature gate check
  if (!hasAccess) {
    return (
      <div className={className}>
        <FeatureGate feature="eldGpsTracking" fallback="prompt" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
        <div className="flex items-center justify-center py-12">
          <Loader2 size={32} className="animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
        <div className="text-center py-8">
          <AlertCircle size={32} className="mx-auto text-red-500 mb-3" />
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
          <button
            onClick={handleRefresh}
            className="mt-3 text-blue-600 dark:text-blue-400 hover:underline"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!vehicles.length) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
        <div className="text-center py-8">
          <MapPin size={32} className="mx-auto text-gray-400 mb-3" />
          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
            No Vehicle Locations
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Connect your ELD to see real-time vehicle positions
          </p>
        </div>
      </div>
    );
  }

  // Calculate stats
  const movingCount = vehicles.filter(v => v.isMoving).length;
  const stoppedCount = vehicles.filter(v => !v.isMoving).length;
  const staleCount = vehicles.filter(v => v.isStale).length;

  // Compact mode (sidebar widget)
  if (compact) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}>
        <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-3 border-b border-gray-200 dark:border-gray-600 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-green-600 dark:text-green-400" />
            <h3 className="font-medium text-gray-700 dark:text-gray-200">GPS Tracking</h3>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2 p-3 border-b border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <p className="text-lg font-bold text-green-600">{movingCount}</p>
            <p className="text-xs text-gray-500">Moving</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-gray-600">{stoppedCount}</p>
            <p className="text-xs text-gray-500">Stopped</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-amber-600">{staleCount}</p>
            <p className="text-xs text-gray-500">Stale</p>
          </div>
        </div>

        {/* Vehicle List */}
        <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-48 overflow-y-auto">
          {vehicles.slice(0, 5).map((vehicle) => (
            <div
              key={vehicle.externalVehicleId}
              onClick={() => handleVehicleClick(vehicle)}
              className="px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${vehicle.isMoving ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-[120px]">
                    {vehicle.vehicleName}
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  {vehicle.isMoving ? formatSpeed(vehicle.location?.speedMph) : 'Stopped'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {vehicles.length > 5 && (
          <div className="px-4 py-2 text-center border-t border-gray-200 dark:border-gray-700">
            <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
              View All {vehicles.length} Vehicles
            </button>
          </div>
        )}
      </div>
    );
  }

  // Full map mode
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-teal-600 dark:from-green-700 dark:to-teal-700 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Navigation size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Fleet GPS Tracking</h3>
              <p className="text-sm text-green-100">Real-time vehicle locations</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white text-sm transition-colors"
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-4 p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{vehicles.length}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Total Vehicles</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600">{movingCount}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Moving</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-600">{stoppedCount}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Stopped</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-amber-600">{staleCount}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Stale Signal</p>
        </div>
      </div>

      {/* Map Placeholder - Integrate with actual map library */}
      <div className="relative h-96 bg-gray-100 dark:bg-gray-700">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <MapPin size={48} className="mx-auto text-gray-400 mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              Map view will be rendered here
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              Integrate with Google Maps, Mapbox, or Leaflet
            </p>
          </div>
        </div>

        {/* Vehicle markers overlay - for demo */}
        <div className="absolute inset-4 pointer-events-none">
          {vehicles.slice(0, 6).map((vehicle, index) => {
            // Position markers randomly for demo
            const top = 20 + (index % 3) * 30;
            const left = 15 + Math.floor(index / 3) * 40;

            return (
              <div
                key={vehicle.externalVehicleId}
                className="absolute pointer-events-auto cursor-pointer"
                style={{ top: `${top}%`, left: `${left}%` }}
                onClick={() => handleVehicleClick(vehicle)}
              >
                <div className={`
                  p-2 rounded-full shadow-lg transform hover:scale-110 transition-transform
                  ${vehicle.isMoving
                    ? 'bg-green-500'
                    : vehicle.isStale
                      ? 'bg-amber-500'
                      : 'bg-gray-500'
                  }
                `}>
                  <Truck size={16} className="text-white" />
                </div>
                {selectedVehicle?.externalVehicleId === vehicle.externalVehicleId && (
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl p-3 min-w-48 z-10">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">
                      {vehicle.vehicleName}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {vehicle.location?.address || 'Unknown location'}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs">
                      <span className={vehicle.isMoving ? 'text-green-600' : 'text-gray-500'}>
                        {vehicle.isMoving ? formatSpeed(vehicle.location?.speedMph) : 'Stopped'}
                      </span>
                      <span className="text-gray-400">
                        {formatAge(vehicle.ageMinutes)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Vehicle List */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-64 overflow-y-auto">
        {vehicles.map((vehicle) => (
          <div
            key={vehicle.externalVehicleId}
            onClick={() => handleVehicleClick(vehicle)}
            className={`
              p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors
              ${selectedVehicle?.externalVehicleId === vehicle.externalVehicleId
                ? 'bg-blue-50 dark:bg-blue-900/20'
                : ''
              }
            `}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`
                  p-2 rounded-lg
                  ${vehicle.isMoving
                    ? 'bg-green-100 dark:bg-green-900/30'
                    : vehicle.isStale
                      ? 'bg-amber-100 dark:bg-amber-900/30'
                      : 'bg-gray-100 dark:bg-gray-700'
                  }
                `}>
                  <Truck size={18} className={
                    vehicle.isMoving
                      ? 'text-green-600'
                      : vehicle.isStale
                        ? 'text-amber-600'
                        : 'text-gray-500'
                  } />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">
                    {vehicle.vehicleName}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                    {vehicle.location?.address || 'Unknown location'}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className={`text-sm font-medium ${vehicle.isMoving ? 'text-green-600' : 'text-gray-500'}`}>
                  {vehicle.isMoving ? formatSpeed(vehicle.location?.speedMph) : 'Stopped'}
                </p>
                <p className="text-xs text-gray-400 flex items-center gap-1 justify-end">
                  <Clock size={12} />
                  {formatAge(vehicle.ageMinutes)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
