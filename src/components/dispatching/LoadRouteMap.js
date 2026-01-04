"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import Map, { Marker, Source, Layer, NavigationControl } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin, Navigation, Loader2, AlertTriangle } from 'lucide-react';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

/**
 * LoadRouteMap - Shows a map with origin and destination markers and route line
 *
 * @param {string} origin - Origin address
 * @param {string} destination - Destination address
 * @param {string} className - Additional CSS classes
 * @param {number} height - Map height in pixels (default 200)
 */
export default function LoadRouteMap({
  origin,
  destination,
  className = '',
  height = 200
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [originCoords, setOriginCoords] = useState(null);
  const [destCoords, setDestCoords] = useState(null);
  const [routeGeoJSON, setRouteGeoJSON] = useState(null);
  const [viewState, setViewState] = useState({
    longitude: -98.5795,
    latitude: 39.8283,
    zoom: 3
  });
  const mapRef = useRef(null);

  // Geocode an address to coordinates
  const geocodeAddress = useCallback(async (address) => {
    if (!address || !MAPBOX_TOKEN) return null;

    try {
      const encodedAddress = encodeURIComponent(address);
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${MAPBOX_TOKEN}&limit=1`
      );

      if (!response.ok) throw new Error('Geocoding failed');

      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;
        return { lng, lat };
      }

      return null;
    } catch (err) {
      console.error('Geocoding error:', err);
      return null;
    }
  }, []);

  // Get driving route between two points
  const getRoute = useCallback(async (start, end) => {
    if (!start || !end || !MAPBOX_TOKEN) return null;

    try {
      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${start.lng},${start.lat};${end.lng},${end.lat}?geometries=geojson&access_token=${MAPBOX_TOKEN}`
      );

      if (!response.ok) throw new Error('Routing failed');

      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        return {
          type: 'Feature',
          properties: {},
          geometry: data.routes[0].geometry
        };
      }

      return null;
    } catch (err) {
      console.error('Routing error:', err);
      return null;
    }
  }, []);

  // Load coordinates and route
  useEffect(() => {
    const loadMapData = async () => {
      if (!origin && !destination) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Geocode both addresses in parallel
        const [originResult, destResult] = await Promise.all([
          origin ? geocodeAddress(origin) : null,
          destination ? geocodeAddress(destination) : null
        ]);

        setOriginCoords(originResult);
        setDestCoords(destResult);

        // If we have both coordinates, get the route
        if (originResult && destResult) {
          const route = await getRoute(originResult, destResult);
          setRouteGeoJSON(route);

          // Fit map to show both points with padding
          const bounds = [
            [Math.min(originResult.lng, destResult.lng), Math.min(originResult.lat, destResult.lat)],
            [Math.max(originResult.lng, destResult.lng), Math.max(originResult.lat, destResult.lat)]
          ];

          // Calculate center and zoom
          const centerLng = (originResult.lng + destResult.lng) / 2;
          const centerLat = (originResult.lat + destResult.lat) / 2;

          // Calculate appropriate zoom based on distance
          const latDiff = Math.abs(originResult.lat - destResult.lat);
          const lngDiff = Math.abs(originResult.lng - destResult.lng);
          const maxDiff = Math.max(latDiff, lngDiff);

          let zoom = 4;
          if (maxDiff < 1) zoom = 9;
          else if (maxDiff < 2) zoom = 7;
          else if (maxDiff < 5) zoom = 5;
          else if (maxDiff < 10) zoom = 4;
          else zoom = 3;

          setViewState({
            longitude: centerLng,
            latitude: centerLat,
            zoom: zoom
          });
        } else if (originResult) {
          setViewState({
            longitude: originResult.lng,
            latitude: originResult.lat,
            zoom: 10
          });
        } else if (destResult) {
          setViewState({
            longitude: destResult.lng,
            latitude: destResult.lat,
            zoom: 10
          });
        }
      } catch (err) {
        console.error('Map data loading error:', err);
        setError('Failed to load map data');
      } finally {
        setLoading(false);
      }
    };

    loadMapData();
  }, [origin, destination, geocodeAddress, getRoute]);

  // No token configured
  if (!MAPBOX_TOKEN) {
    return (
      <div
        className={`bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 flex items-center justify-center ${className}`}
        style={{ height }}
      >
        <div className="text-center p-4">
          <MapPin size={32} className="text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Map not configured</p>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div
        className={`bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-gray-200 dark:border-gray-600 flex items-center justify-center ${className}`}
        style={{ height }}
      >
        <div className="text-center">
          <Loader2 size={32} className="text-blue-500 mx-auto mb-2 animate-spin" />
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading route...</p>
        </div>
      </div>
    );
  }

  // No addresses provided
  if (!origin && !destination) {
    return (
      <div
        className={`bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 flex items-center justify-center ${className}`}
        style={{ height }}
      >
        <div className="text-center p-4">
          <MapPin size={32} className="text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">No route available</p>
        </div>
      </div>
    );
  }

  // Error or no coordinates found
  if (error || (!originCoords && !destCoords)) {
    return (
      <div
        className={`bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg border border-amber-200 dark:border-amber-700 flex items-center justify-center ${className}`}
        style={{ height }}
      >
        <div className="text-center p-4">
          <AlertTriangle size={32} className="text-amber-500 mx-auto mb-2" />
          <p className="text-sm text-amber-700 dark:text-amber-300">
            {error || 'Could not locate addresses'}
          </p>
        </div>
      </div>
    );
  }

  // Route line style
  const routeLineStyle = {
    id: 'route-line',
    type: 'line',
    paint: {
      'line-color': '#3b82f6',
      'line-width': 4,
      'line-opacity': 0.8
    }
  };

  const routeLineDashedStyle = {
    id: 'route-line-dashed',
    type: 'line',
    paint: {
      'line-color': '#ffffff',
      'line-width': 2,
      'line-dasharray': [2, 2],
      'line-opacity': 0.6
    }
  };

  return (
    <div
      className={`rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 ${className}`}
      style={{ height }}
    >
      <Map
        ref={mapRef}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: '100%', height: '100%' }}
        attributionControl={false}
      >
        <NavigationControl position="top-right" showCompass={false} />

        {/* Route Line */}
        {routeGeoJSON && (
          <Source id="route" type="geojson" data={routeGeoJSON}>
            <Layer {...routeLineStyle} />
            <Layer {...routeLineDashedStyle} />
          </Source>
        )}

        {/* Origin Marker */}
        {originCoords && (
          <Marker
            longitude={originCoords.lng}
            latitude={originCoords.lat}
            anchor="bottom"
          >
            <div className="flex flex-col items-center">
              <div className="bg-green-500 text-white p-1.5 rounded-full shadow-lg">
                <MapPin size={16} />
              </div>
              <div className="w-0.5 h-2 bg-green-500"></div>
            </div>
          </Marker>
        )}

        {/* Destination Marker */}
        {destCoords && (
          <Marker
            longitude={destCoords.lng}
            latitude={destCoords.lat}
            anchor="bottom"
          >
            <div className="flex flex-col items-center">
              <div className="bg-red-500 text-white p-1.5 rounded-full shadow-lg">
                <Navigation size={16} />
              </div>
              <div className="w-0.5 h-2 bg-red-500"></div>
            </div>
          </Marker>
        )}
      </Map>
    </div>
  );
}
