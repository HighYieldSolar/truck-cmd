/**
 * ELD GPS Service
 *
 * Provides real-time GPS tracking, vehicle location history, and geofencing.
 * Requires Fleet+ subscription tier.
 */

import { createClient } from '@supabase/supabase-js';
import { getConnection, createProviderForConnection } from './eldConnectionService';
import { getLocalVehicleId } from './eldMappingService';

// Initialize Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

/**
 * Get current locations for all vehicles
 * @param {string} userId - User ID
 * @returns {Promise<object>} - Current vehicle locations
 */
export async function getAllVehicleLocations(userId) {
  try {
    const connectionResult = await getConnection(userId, 'terminal');
    if (connectionResult.error || !connectionResult.data) {
      return { error: true, errorMessage: 'No active ELD connection' };
    }

    const connectionId = connectionResult.data.id;

    // Get latest locations from our database
    const { data: locations, error } = await supabaseAdmin
      .from('eld_vehicle_locations')
      .select(`
        id,
        external_vehicle_id,
        latitude,
        longitude,
        heading,
        speed,
        address,
        recorded_at
      `)
      .eq('connection_id', connectionId)
      .order('recorded_at', { ascending: false });

    if (error) {
      return { error: true, errorMessage: error.message };
    }

    // Get unique latest locations per vehicle
    const latestByVehicle = {};
    for (const loc of (locations || [])) {
      if (!latestByVehicle[loc.external_vehicle_id]) {
        latestByVehicle[loc.external_vehicle_id] = loc;
      }
    }

    // Enhance with local vehicle info
    const enhancedLocations = await Promise.all(
      Object.values(latestByVehicle).map(async (loc) => {
        const localVehicleId = await getLocalVehicleId(connectionId, loc.external_vehicle_id);
        let vehicleInfo = null;

        if (localVehicleId) {
          const { data: vehicle } = await supabaseAdmin
            .from('vehicles')
            .select('id, name, license_plate, make, model, year')
            .eq('id', localVehicleId)
            .single();
          vehicleInfo = vehicle;
        }

        // Calculate how fresh the location is
        const ageMinutes = Math.round((Date.now() - new Date(loc.recorded_at).getTime()) / 60000);
        const isStale = ageMinutes > 30; // Consider stale if older than 30 minutes

        return {
          externalVehicleId: loc.external_vehicle_id,
          localVehicleId,
          vehicleName: vehicleInfo?.name || vehicleInfo?.license_plate || 'Unknown Vehicle',
          vehicleInfo,
          location: {
            lat: loc.latitude,
            lng: loc.longitude,
            heading: loc.heading,
            speed: loc.speed,
            speedMph: loc.speed ? Math.round(loc.speed * 0.621371) : null, // km/h to mph
            address: loc.address
          },
          recordedAt: loc.recorded_at,
          ageMinutes,
          isStale,
          isMoving: loc.speed > 5 // km/h
        };
      })
    );

    // Sort by vehicle name
    enhancedLocations.sort((a, b) => a.vehicleName.localeCompare(b.vehicleName));

    return {
      error: false,
      vehicles: enhancedLocations,
      totalVehicles: enhancedLocations.length,
      movingVehicles: enhancedLocations.filter(v => v.isMoving).length,
      staleLocations: enhancedLocations.filter(v => v.isStale).length,
      lastSyncAt: connectionResult.data.last_sync_at
    };

  } catch (error) {
    return { error: true, errorMessage: error.message };
  }
}

/**
 * Get location history for a specific vehicle
 * @param {string} userId - User ID
 * @param {string} vehicleId - Local vehicle ID
 * @param {string} startTime - Start time (ISO 8601)
 * @param {string} endTime - End time (ISO 8601)
 * @returns {Promise<object>} - Location history
 */
export async function getVehicleLocationHistory(userId, vehicleId, startTime, endTime) {
  try {
    // Verify vehicle ownership
    const { data: vehicle, error: vehicleError } = await supabaseAdmin
      .from('vehicles')
      .select('id, name, license_plate, eld_external_id')
      .eq('id', vehicleId)
      .eq('user_id', userId)
      .single();

    if (vehicleError || !vehicle) {
      return { error: true, errorMessage: 'Vehicle not found' };
    }

    if (!vehicle.eld_external_id) {
      return { error: true, errorMessage: 'Vehicle not linked to ELD' };
    }

    const connectionResult = await getConnection(userId, 'terminal');
    if (connectionResult.error || !connectionResult.data) {
      return { error: true, errorMessage: 'No active ELD connection' };
    }

    const connectionId = connectionResult.data.id;

    // Default time range: last 24 hours
    const end = endTime || new Date().toISOString();
    const start = startTime || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // Get location history from database
    const { data: locations, error } = await supabaseAdmin
      .from('eld_vehicle_locations')
      .select('*')
      .eq('connection_id', connectionId)
      .eq('external_vehicle_id', vehicle.eld_external_id)
      .gte('recorded_at', start)
      .lte('recorded_at', end)
      .order('recorded_at', { ascending: true });

    if (error) {
      return { error: true, errorMessage: error.message };
    }

    // Calculate trip statistics
    let totalDistance = 0;
    let maxSpeed = 0;
    const points = [];

    for (let i = 0; i < (locations || []).length; i++) {
      const loc = locations[i];

      points.push({
        lat: loc.latitude,
        lng: loc.longitude,
        time: loc.recorded_at,
        speed: loc.speed,
        speedMph: loc.speed ? Math.round(loc.speed * 0.621371) : null,
        heading: loc.heading,
        address: loc.address
      });

      if (loc.speed > maxSpeed) {
        maxSpeed = loc.speed;
      }

      // Calculate distance from previous point
      if (i > 0) {
        const prevLoc = locations[i - 1];
        const distance = calculateDistance(
          prevLoc.latitude, prevLoc.longitude,
          loc.latitude, loc.longitude
        );
        totalDistance += distance;
      }
    }

    return {
      error: false,
      vehicle: {
        id: vehicle.id,
        name: vehicle.name || vehicle.license_plate
      },
      timeRange: { start, end },
      points,
      pointCount: points.length,
      statistics: {
        totalDistanceMiles: Math.round(totalDistance * 0.621371 * 10) / 10,
        totalDistanceKm: Math.round(totalDistance * 10) / 10,
        maxSpeedMph: Math.round(maxSpeed * 0.621371),
        maxSpeedKmh: Math.round(maxSpeed),
        avgSpeedMph: points.length > 0
          ? Math.round(points.reduce((sum, p) => sum + (p.speedMph || 0), 0) / points.length)
          : 0
      },
      // Get start and end addresses
      startLocation: points.length > 0 ? points[0] : null,
      endLocation: points.length > 0 ? points[points.length - 1] : null
    };

  } catch (error) {
    return { error: true, errorMessage: error.message };
  }
}

/**
 * Refresh locations from ELD provider (real-time fetch)
 * @param {string} userId - User ID
 * @returns {Promise<object>} - Fresh location data
 */
export async function refreshLocations(userId) {
  try {
    const connectionResult = await getConnection(userId, 'terminal');
    if (connectionResult.error || !connectionResult.data) {
      return { error: true, errorMessage: 'No active ELD connection' };
    }

    const client = await createProviderForConnection(connectionResult.data.id);
    if (!client) {
      return { error: true, errorMessage: 'Failed to create API client' };
    }

    // Fetch latest locations from Terminal API
    const locationsResponse = await client.getLatestVehicleLocations();

    if (!locationsResponse || !locationsResponse.data) {
      return { error: true, errorMessage: 'Failed to get locations from provider' };
    }

    const connectionId = connectionResult.data.id;
    const now = new Date().toISOString();
    let savedCount = 0;

    // Save/update locations in our database
    for (const location of (locationsResponse.data || [])) {
      try {
        const locationData = {
          connection_id: connectionId,
          external_vehicle_id: location.vehicleId,
          latitude: location.latitude,
          longitude: location.longitude,
          heading: location.heading,
          speed: location.speed,
          address: location.address || location.formattedAddress,
          recorded_at: location.time || now,
          metadata: {
            source: 'terminal',
            refreshedAt: now
          }
        };

        await supabaseAdmin
          .from('eld_vehicle_locations')
          .insert([locationData]);

        savedCount++;

        // Also update the vehicle's last known location
        const localVehicleId = await getLocalVehicleId(connectionId, location.vehicleId);
        if (localVehicleId) {
          await supabaseAdmin
            .from('vehicles')
            .update({
              last_known_location: {
                lat: location.latitude,
                lng: location.longitude,
                address: location.address,
                speed: location.speed
              },
              last_location_at: location.time || now,
              updated_at: now
            })
            .eq('id', localVehicleId);
        }
      } catch (err) {
        // Continue with other locations on error
      }
    }

    // Update connection last sync
    await supabaseAdmin
      .from('eld_connections')
      .update({ last_sync_at: now })
      .eq('id', connectionId);

    return {
      success: true,
      locationsUpdated: savedCount,
      refreshedAt: now
    };

  } catch (error) {
    return { error: true, errorMessage: error.message };
  }
}

/**
 * Get vehicles near a location (for geofencing/proximity)
 * @param {string} userId - User ID
 * @param {number} lat - Center latitude
 * @param {number} lng - Center longitude
 * @param {number} radiusMiles - Radius in miles
 * @returns {Promise<object>} - Vehicles within radius
 */
export async function getVehiclesNearLocation(userId, lat, lng, radiusMiles = 50) {
  try {
    const allLocations = await getAllVehicleLocations(userId);

    if (allLocations.error) {
      return allLocations;
    }

    const radiusKm = radiusMiles * 1.60934;

    const nearbyVehicles = allLocations.vehicles
      .map(vehicle => {
        const distance = calculateDistance(
          lat, lng,
          vehicle.location.lat, vehicle.location.lng
        );
        return {
          ...vehicle,
          distanceKm: Math.round(distance * 10) / 10,
          distanceMiles: Math.round(distance * 0.621371 * 10) / 10
        };
      })
      .filter(vehicle => vehicle.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    return {
      error: false,
      center: { lat, lng },
      radiusMiles,
      vehicles: nearbyVehicles,
      vehicleCount: nearbyVehicles.length
    };

  } catch (error) {
    return { error: true, errorMessage: error.message };
  }
}

/**
 * Get GPS tracking dashboard data
 * @param {string} userId - User ID
 * @returns {Promise<object>} - Dashboard summary
 */
export async function getGpsDashboard(userId) {
  try {
    const locations = await getAllVehicleLocations(userId);

    if (locations.error) {
      return locations;
    }

    const vehicles = locations.vehicles || [];

    // Group by state (moving vs stopped)
    const moving = vehicles.filter(v => v.isMoving);
    const stopped = vehicles.filter(v => !v.isMoving);
    const stale = vehicles.filter(v => v.isStale);

    // Group by general region (extract state from address if available)
    const byRegion = {};
    for (const v of vehicles) {
      const region = extractState(v.location.address) || 'Unknown';
      if (!byRegion[region]) {
        byRegion[region] = [];
      }
      byRegion[region].push(v);
    }

    return {
      error: false,
      totalVehicles: vehicles.length,
      movingCount: moving.length,
      stoppedCount: stopped.length,
      staleCount: stale.length,
      movingVehicles: moving.map(v => ({
        id: v.localVehicleId,
        name: v.vehicleName,
        speed: v.location.speedMph,
        location: v.location.address
      })),
      stoppedVehicles: stopped.slice(0, 10).map(v => ({
        id: v.localVehicleId,
        name: v.vehicleName,
        location: v.location.address,
        stoppedFor: v.ageMinutes
      })),
      vehiclesByRegion: Object.entries(byRegion).map(([region, vs]) => ({
        region,
        count: vs.length,
        moving: vs.filter(v => v.isMoving).length
      })).sort((a, b) => b.count - a.count),
      lastUpdated: locations.lastSyncAt,
      // Bounding box for map centering
      bounds: calculateBounds(vehicles.map(v => v.location))
    };

  } catch (error) {
    return { error: true, errorMessage: error.message };
  }
}

/**
 * Calculate distance between two points (Haversine formula)
 * @returns {number} Distance in kilometers
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}

/**
 * Extract state from address string
 */
function extractState(address) {
  if (!address) return null;

  // Common US state abbreviations
  const statePattern = /\b([A-Z]{2})\s*\d{5}/;
  const match = address.match(statePattern);
  if (match) return match[1];

  // Try to find state name
  const states = ['Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
    'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas',
    'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota',
    'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey',
    'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon',
    'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas',
    'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'];

  for (const state of states) {
    if (address.includes(state)) return state;
  }

  return null;
}

/**
 * Calculate bounding box for a set of coordinates
 */
function calculateBounds(locations) {
  if (!locations || locations.length === 0) {
    return null;
  }

  let minLat = Infinity, maxLat = -Infinity;
  let minLng = Infinity, maxLng = -Infinity;

  for (const loc of locations) {
    if (loc.lat < minLat) minLat = loc.lat;
    if (loc.lat > maxLat) maxLat = loc.lat;
    if (loc.lng < minLng) minLng = loc.lng;
    if (loc.lng > maxLng) maxLng = loc.lng;
  }

  return {
    southwest: { lat: minLat, lng: minLng },
    northeast: { lat: maxLat, lng: maxLng },
    center: {
      lat: (minLat + maxLat) / 2,
      lng: (minLng + maxLng) / 2
    }
  };
}

export default {
  getAllVehicleLocations,
  getVehicleLocationHistory,
  refreshLocations,
  getVehiclesNearLocation,
  getGpsDashboard
};
