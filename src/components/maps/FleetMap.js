"use client";

import { useState, useCallback, useMemo } from 'react';
import Map, { Marker, Popup, NavigationControl, FullscreenControl, Source, Layer } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Truck, MapPin, Navigation, Clock, X, Package } from 'lucide-react';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

// Default map center (center of continental US)
const DEFAULT_CENTER = { lat: 39.8283, lng: -98.5795 };
const DEFAULT_ZOOM = 4;

/**
 * FleetMap - Reusable map component for fleet visualization
 *
 * @param {Array} vehicles - Array of vehicle objects with location data
 * @param {Array} loads - Optional array of load objects with origin/destination
 * @param {Object} selectedVehicle - Currently selected vehicle
 * @param {Function} onVehicleSelect - Callback when vehicle is clicked
 * @param {Function} onLoadSelect - Callback when load route is clicked
 * @param {Object} bounds - Optional map bounds {center: {lat, lng}, zoom}
 * @param {string} className - Additional CSS classes
 * @param {number} height - Map height in pixels or CSS value
 * @param {boolean} showControls - Show navigation controls
 * @param {boolean} interactive - Enable map interactions
 * @param {string} mapStyle - Mapbox style URL
 */
export default function FleetMap({
  vehicles = [],
  loads = [],
  selectedVehicle = null,
  onVehicleSelect,
  onLoadSelect,
  bounds,
  className = '',
  height = 400,
  showControls = true,
  interactive = true,
  mapStyle = 'mapbox://styles/mapbox/streets-v12'
}) {
  const [popupInfo, setPopupInfo] = useState(null);
  const [hoveredLoadId, setHoveredLoadId] = useState(null);

  // Calculate initial view state from bounds or vehicles
  const initialViewState = useMemo(() => {
    if (bounds?.center) {
      return {
        longitude: bounds.center.lng,
        latitude: bounds.center.lat,
        zoom: bounds.zoom || DEFAULT_ZOOM
      };
    }

    // Auto-fit to vehicles if any have locations
    const vehiclesWithLocation = vehicles.filter(v => v.location?.latitude && v.location?.longitude);
    if (vehiclesWithLocation.length === 1) {
      const v = vehiclesWithLocation[0];
      return {
        longitude: v.location.longitude,
        latitude: v.location.latitude,
        zoom: 10
      };
    }

    if (vehiclesWithLocation.length > 1) {
      const lats = vehiclesWithLocation.map(v => v.location.latitude);
      const lngs = vehiclesWithLocation.map(v => v.location.longitude);
      return {
        longitude: (Math.min(...lngs) + Math.max(...lngs)) / 2,
        latitude: (Math.min(...lats) + Math.max(...lats)) / 2,
        zoom: 5
      };
    }

    return {
      longitude: DEFAULT_CENTER.lng,
      latitude: DEFAULT_CENTER.lat,
      zoom: DEFAULT_ZOOM
    };
  }, [bounds, vehicles]);

  const handleVehicleClick = useCallback((vehicle, e) => {
    e?.originalEvent?.stopPropagation();
    setPopupInfo(vehicle);
    onVehicleSelect?.(vehicle);
  }, [onVehicleSelect]);

  const handleClosePopup = useCallback(() => {
    setPopupInfo(null);
  }, []);

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

  const getHeadingDirection = (heading) => {
    if (heading === null || heading === undefined) return '';
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(heading / 45) % 8;
    return directions[index];
  };

  // Generate GeoJSON for load routes
  const loadRoutesGeoJSON = useMemo(() => {
    const features = loads
      .filter(load =>
        load.origin?.latitude && load.origin?.longitude &&
        load.destination?.latitude && load.destination?.longitude
      )
      .map(load => ({
        type: 'Feature',
        properties: {
          loadId: load.id,
          status: load.status
        },
        geometry: {
          type: 'LineString',
          coordinates: [
            [load.origin.longitude, load.origin.latitude],
            [load.destination.longitude, load.destination.latitude]
          ]
        }
      }));

    return {
      type: 'FeatureCollection',
      features
    };
  }, [loads]);

  // Show configuration message if no token
  if (!MAPBOX_TOKEN) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg ${className}`}
        style={{ height: typeof height === 'number' ? `${height}px` : height }}
      >
        <div className="text-center p-6">
          <MapPin size={48} className="mx-auto text-gray-400 mb-3" />
          <p className="text-gray-600 dark:text-gray-400 font-medium">Map Configuration Required</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Add NEXT_PUBLIC_MAPBOX_TOKEN to your environment
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative rounded-lg overflow-hidden ${className}`}
      style={{ height: typeof height === 'number' ? `${height}px` : height }}
    >
      <Map
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={initialViewState}
        style={{ width: '100%', height: '100%' }}
        mapStyle={mapStyle}
        interactive={interactive}
        attributionControl={false}
        onClick={handleClosePopup}
      >
        {showControls && (
          <>
            <NavigationControl position="top-right" />
            <FullscreenControl position="top-right" />
          </>
        )}

        {/* Load Routes */}
        {loadRoutesGeoJSON.features.length > 0 && (
          <Source id="load-routes" type="geojson" data={loadRoutesGeoJSON}>
            <Layer
              id="load-routes-line"
              type="line"
              paint={{
                'line-color': ['match', ['get', 'status'],
                  'in_transit', '#22c55e',
                  'dispatched', '#3b82f6',
                  'pending', '#f59e0b',
                  '#6b7280'
                ],
                'line-width': 2,
                'line-dasharray': [2, 2]
              }}
            />
          </Source>
        )}

        {/* Load Origin/Destination Markers */}
        {loads.map(load => {
          if (!load.origin?.latitude || !load.destination?.latitude) return null;

          return (
            <div key={load.id}>
              {/* Origin */}
              <Marker
                longitude={load.origin.longitude}
                latitude={load.origin.latitude}
                anchor="bottom"
              >
                <div
                  className="p-1.5 bg-blue-500 rounded-full shadow-lg cursor-pointer hover:scale-110 transition-transform"
                  onClick={() => onLoadSelect?.(load, 'origin')}
                  title={`Pickup: ${load.origin.city || 'Origin'}`}
                >
                  <Package size={12} className="text-white" />
                </div>
              </Marker>

              {/* Destination */}
              <Marker
                longitude={load.destination.longitude}
                latitude={load.destination.latitude}
                anchor="bottom"
              >
                <div
                  className="p-1.5 bg-green-500 rounded-full shadow-lg cursor-pointer hover:scale-110 transition-transform"
                  onClick={() => onLoadSelect?.(load, 'destination')}
                  title={`Delivery: ${load.destination.city || 'Destination'}`}
                >
                  <MapPin size={12} className="text-white" />
                </div>
              </Marker>
            </div>
          );
        })}

        {/* Vehicle Markers */}
        {vehicles.map((vehicle) => {
          const lat = vehicle.location?.latitude;
          const lng = vehicle.location?.longitude;

          if (!lat || !lng) return null;

          const isSelected = selectedVehicle?.externalVehicleId === vehicle.externalVehicleId ||
                           popupInfo?.externalVehicleId === vehicle.externalVehicleId;

          return (
            <Marker
              key={vehicle.externalVehicleId}
              longitude={lng}
              latitude={lat}
              anchor="center"
              onClick={(e) => handleVehicleClick(vehicle, e)}
            >
              <div
                className={`
                  p-2 rounded-full shadow-lg cursor-pointer transform transition-transform
                  ${isSelected ? 'scale-125 ring-2 ring-white ring-offset-2' : 'hover:scale-110'}
                  ${vehicle.isMoving
                    ? 'bg-green-500 vehicle-marker-moving'
                    : vehicle.isStale
                      ? 'bg-amber-500'
                      : 'bg-gray-500'
                  }
                `}
                title={vehicle.vehicleName}
              >
                <Truck
                  size={16}
                  className="text-white"
                  style={vehicle.location?.heading ? {
                    transform: `rotate(${vehicle.location.heading - 90}deg)`
                  } : {}}
                />
              </div>
            </Marker>
          );
        })}

        {/* Vehicle Popup */}
        {popupInfo && popupInfo.location?.latitude && popupInfo.location?.longitude && (
          <Popup
            longitude={popupInfo.location.longitude}
            latitude={popupInfo.location.latitude}
            anchor="bottom"
            onClose={handleClosePopup}
            closeButton={false}
            className="fleet-map-popup"
            offset={20}
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 min-w-56 shadow-xl">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`
                    p-2 rounded-lg
                    ${popupInfo.isMoving
                      ? 'bg-green-100 dark:bg-green-900/30'
                      : 'bg-gray-100 dark:bg-gray-700'
                    }
                  `}>
                    <Truck size={16} className={popupInfo.isMoving ? 'text-green-600' : 'text-gray-500'} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                      {popupInfo.vehicleName}
                    </h4>
                    <p className={`text-xs font-medium ${popupInfo.isMoving ? 'text-green-600' : 'text-gray-500'}`}>
                      {popupInfo.isMoving ? 'Moving' : 'Stopped'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClosePopup}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                  <X size={14} className="text-gray-400" />
                </button>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <MapPin size={14} className="flex-shrink-0" />
                  <span className="truncate">{popupInfo.location?.address || 'Unknown location'}</span>
                </div>

                {popupInfo.isMoving && (
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Navigation size={14} className="flex-shrink-0" />
                    <span>{formatSpeed(popupInfo.location?.speedMph)}</span>
                    {popupInfo.location?.heading && (
                      <span className="text-xs text-gray-400">
                        ({getHeadingDirection(popupInfo.location.heading)})
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-500">
                  <Clock size={14} className="flex-shrink-0" />
                  <span>Updated {formatAge(popupInfo.ageMinutes)}</span>
                </div>
              </div>

              {popupInfo.driverName && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Driver</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {popupInfo.driverName}
                  </p>
                </div>
              )}

              {popupInfo.currentLoad && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Current Load</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {popupInfo.currentLoad.reference || `Load #${popupInfo.currentLoad.id}`}
                  </p>
                </div>
              )}
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
}
