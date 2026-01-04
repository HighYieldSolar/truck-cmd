"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabaseClient';
import {
  Map as MapIcon,
  Truck,
  Package,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Navigation,
  MapPin,
  AlertCircle,
  Loader2,
  X,
  Eye,
  EyeOff
} from 'lucide-react';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import Link from 'next/link';

// Dynamically import FleetMap to avoid SSR issues with Mapbox
const FleetMap = dynamic(() => import('@/components/maps/FleetMap'), {
  ssr: false,
  loading: () => (
    <div className="h-80 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
      <Loader2 size={32} className="animate-spin text-blue-500" />
    </div>
  )
});

/**
 * DispatchingMap - Live fleet map for the dispatching page
 * Shows vehicle locations and load routes
 */
export default function DispatchingMap({
  loads = [],
  onVehicleSelect,
  onLoadSelect,
  className = ''
}) {
  const [expanded, setExpanded] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [error, setError] = useState(null);
  const [hasEldConnection, setHasEldConnection] = useState(false);
  const [showRoutes, setShowRoutes] = useState(true);
  const [showVehicles, setShowVehicles] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  const { canAccess } = useFeatureAccess();
  const hasGpsAccess = canAccess('eldGpsTracking');

  // Load vehicle data from ELD GPS
  const loadVehicleData = useCallback(async () => {
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
        throw new Error(data.error || 'Failed to load GPS data');
      }

      const data = await response.json();
      setVehicles(data.vehicles || []);
    } catch (err) {
      console.error('Failed to load GPS data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasGpsAccess) {
      loadVehicleData();
    } else {
      setLoading(false);
    }
  }, [hasGpsAccess, loadVehicleData]);

  // Refresh vehicle locations
  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);

    try {
      const response = await fetch('/api/eld/gps/refresh', { method: 'POST' });
      if (response.ok) {
        await loadVehicleData();
      }
    } catch (err) {
      console.error('Refresh failed:', err);
    } finally {
      setRefreshing(false);
    }
  };

  // Handle vehicle selection
  const handleVehicleClick = (vehicle) => {
    setSelectedVehicle(vehicle);
    onVehicleSelect?.(vehicle);
  };

  // Transform loads for the map (add coordinates)
  const loadsWithCoordinates = useMemo(() => {
    // For now, we'll show loads that have city names
    // In a real implementation, you'd geocode these or store coordinates
    return loads
      .filter(load => load.status !== 'Completed' && load.status !== 'Cancelled')
      .map(load => ({
        id: load.id,
        reference: load.loadNumber,
        status: load.status?.toLowerCase().replace(' ', '_'),
        origin: {
          city: load.origin,
          // These would come from geocoding or stored coordinates
          latitude: null,
          longitude: null
        },
        destination: {
          city: load.destination,
          latitude: null,
          longitude: null
        }
      }));
  }, [loads]);

  // Stats
  const movingCount = vehicles.filter(v => v.isMoving).length;
  const stoppedCount = vehicles.filter(v => !v.isMoving).length;
  const activeLoadsCount = loads.filter(l =>
    l.status === 'In Transit' || l.status === 'Assigned'
  ).length;

  // Collapsed view
  if (!expanded) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}>
        <button
          onClick={() => setExpanded(true)}
          className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <MapIcon size={20} className="text-green-600 dark:text-green-400" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Fleet Map</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {vehicles.length} vehicles | {movingCount} moving | {activeLoadsCount} active loads
              </p>
            </div>
          </div>
          <ChevronDown size={20} className="text-gray-400" />
        </button>
      </div>
    );
  }

  // No GPS access
  if (!hasGpsAccess) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}>
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <MapIcon size={20} className="text-green-600 dark:text-green-400" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Fleet Map</h3>
          </div>
          <button
            onClick={() => setExpanded(false)}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <ChevronUp size={20} className="text-gray-400" />
          </button>
        </div>
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full mx-auto flex items-center justify-center mb-4">
            <Navigation size={32} className="text-gray-400" />
          </div>
          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
            Live Fleet Tracking
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            See your trucks in real-time on the map. Requires Fleet plan or higher.
          </p>
          <Link
            href="/dashboard/upgrade"
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
          >
            Upgrade to Fleet
          </Link>
        </div>
      </div>
    );
  }

  // No ELD connection
  if (!hasEldConnection && !loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}>
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <MapIcon size={20} className="text-green-600 dark:text-green-400" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Fleet Map</h3>
          </div>
          <button
            onClick={() => setExpanded(false)}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <ChevronUp size={20} className="text-gray-400" />
          </button>
        </div>
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full mx-auto flex items-center justify-center mb-4">
            <Truck size={32} className="text-amber-600" />
          </div>
          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
            Connect Your ELD
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Connect your ELD provider to see real-time vehicle locations on the map.
          </p>
          <Link
            href="/dashboard/settings/eld"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Connect ELD
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <MapIcon size={20} className="text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Fleet Map</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Real-time vehicle locations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle buttons */}
            <button
              onClick={() => setShowVehicles(!showVehicles)}
              className={`p-2 rounded-lg transition-colors ${
                showVehicles
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-600'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
              }`}
              title={showVehicles ? 'Hide vehicles' : 'Show vehicles'}
            >
              <Truck size={16} />
            </button>
            <button
              onClick={() => setShowRoutes(!showRoutes)}
              className={`p-2 rounded-lg transition-colors ${
                showRoutes
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
              }`}
              title={showRoutes ? 'Hide load routes' : 'Show load routes'}
            >
              <Package size={16} />
            </button>

            {/* Refresh */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Refresh locations"
            >
              <RefreshCw size={16} className={`text-gray-500 ${refreshing ? 'animate-spin' : ''}`} />
            </button>

            {/* Collapse */}
            <button
              onClick={() => setExpanded(false)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronUp size={16} className="text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-4 px-5 py-3 bg-gray-50 dark:bg-gray-700/30 border-b border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{vehicles.length}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Vehicles</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-green-600">{movingCount}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Moving</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-gray-600 dark:text-gray-300">{stoppedCount}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Stopped</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-blue-600">{activeLoadsCount}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Active Loads</p>
        </div>
      </div>

      {/* Map */}
      <div className="relative">
        {loading ? (
          <div className="h-80 flex items-center justify-center bg-gray-100 dark:bg-gray-700">
            <Loader2 size={32} className="animate-spin text-blue-500" />
          </div>
        ) : error ? (
          <div className="h-80 flex items-center justify-center bg-gray-100 dark:bg-gray-700">
            <div className="text-center">
              <AlertCircle size={32} className="mx-auto text-red-500 mb-2" />
              <p className="text-sm text-gray-600 dark:text-gray-400">{error}</p>
              <button
                onClick={handleRefresh}
                className="mt-2 text-sm text-blue-600 hover:underline"
              >
                Try again
              </button>
            </div>
          </div>
        ) : (
          <FleetMap
            vehicles={showVehicles ? vehicles : []}
            loads={showRoutes ? loadsWithCoordinates : []}
            selectedVehicle={selectedVehicle}
            onVehicleSelect={handleVehicleClick}
            onLoadSelect={onLoadSelect}
            height={320}
            showControls={true}
          />
        )}

        {/* Selected Vehicle Panel */}
        {selectedVehicle && (
          <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-72 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg ${
                  selectedVehicle.isMoving
                    ? 'bg-green-100 dark:bg-green-900/30'
                    : 'bg-gray-100 dark:bg-gray-700'
                }`}>
                  <Truck size={16} className={
                    selectedVehicle.isMoving ? 'text-green-600' : 'text-gray-500'
                  } />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                    {selectedVehicle.vehicleName}
                  </h4>
                  <p className={`text-xs font-medium ${
                    selectedVehicle.isMoving ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {selectedVehicle.isMoving ? 'Moving' : 'Stopped'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedVehicle(null)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <X size={14} className="text-gray-400" />
              </button>
            </div>

            <div className="space-y-2 text-sm">
              {selectedVehicle.location?.address && (
                <div className="flex items-start gap-2 text-gray-600 dark:text-gray-400">
                  <MapPin size={14} className="flex-shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{selectedVehicle.location.address}</span>
                </div>
              )}

              {selectedVehicle.isMoving && selectedVehicle.location?.speedMph && (
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Navigation size={14} />
                  <span>{Math.round(selectedVehicle.location.speedMph)} mph</span>
                </div>
              )}

              {selectedVehicle.driverName && (
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500">Driver</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {selectedVehicle.driverName}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Vehicle List (compact) */}
      {vehicles.length > 0 && (
        <div className="max-h-32 overflow-y-auto border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 p-3">
            {vehicles.map((vehicle) => (
              <button
                key={vehicle.externalVehicleId}
                onClick={() => handleVehicleClick(vehicle)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${
                  selectedVehicle?.externalVehicleId === vehicle.externalVehicleId
                    ? 'bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700'
                    : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  vehicle.isMoving ? 'bg-green-500 animate-pulse' :
                  vehicle.isStale ? 'bg-amber-500' : 'bg-gray-400'
                }`} />
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {vehicle.vehicleName}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
