/**
 * IFTA Jurisdiction Detection Service
 *
 * Detects US states and Canadian provinces from GPS coordinates
 * and tracks jurisdiction crossings for IFTA mileage reporting.
 *
 * Uses simplified state boundaries for efficient real-time detection.
 * For production, consider integrating with a GIS service for accuracy.
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/**
 * Simplified US State bounding boxes for quick jurisdiction detection
 * Format: { minLat, maxLat, minLng, maxLng }
 *
 * Note: These are approximate bounding boxes. For precise detection,
 * integrate with a GIS service or use detailed polygon boundaries.
 */
const US_STATE_BOUNDS = {
  AL: { minLat: 30.22, maxLat: 35.01, minLng: -88.47, maxLng: -84.89, name: 'Alabama' },
  AK: { minLat: 51.21, maxLat: 71.39, minLng: -179.15, maxLng: 179.77, name: 'Alaska' },
  AZ: { minLat: 31.33, maxLat: 37.00, minLng: -114.81, maxLng: -109.04, name: 'Arizona' },
  AR: { minLat: 33.00, maxLat: 36.50, minLng: -94.62, maxLng: -89.64, name: 'Arkansas' },
  CA: { minLat: 32.53, maxLat: 42.01, minLng: -124.41, maxLng: -114.13, name: 'California' },
  CO: { minLat: 36.99, maxLat: 41.00, minLng: -109.05, maxLng: -102.04, name: 'Colorado' },
  CT: { minLat: 40.99, maxLat: 42.05, minLng: -73.73, maxLng: -71.79, name: 'Connecticut' },
  DE: { minLat: 38.45, maxLat: 39.84, minLng: -75.79, maxLng: -75.05, name: 'Delaware' },
  FL: { minLat: 24.52, maxLat: 31.00, minLng: -87.63, maxLng: -80.03, name: 'Florida' },
  GA: { minLat: 30.36, maxLat: 35.00, minLng: -85.61, maxLng: -80.84, name: 'Georgia' },
  HI: { minLat: 18.91, maxLat: 22.24, minLng: -160.25, maxLng: -154.81, name: 'Hawaii' },
  ID: { minLat: 41.99, maxLat: 49.00, minLng: -117.24, maxLng: -111.04, name: 'Idaho' },
  IL: { minLat: 36.97, maxLat: 42.51, minLng: -91.51, maxLng: -87.02, name: 'Illinois' },
  IN: { minLat: 37.77, maxLat: 41.76, minLng: -88.10, maxLng: -84.78, name: 'Indiana' },
  IA: { minLat: 40.38, maxLat: 43.50, minLng: -96.64, maxLng: -90.14, name: 'Iowa' },
  KS: { minLat: 36.99, maxLat: 40.00, minLng: -102.05, maxLng: -94.59, name: 'Kansas' },
  KY: { minLat: 36.50, maxLat: 39.15, minLng: -89.57, maxLng: -81.96, name: 'Kentucky' },
  LA: { minLat: 28.93, maxLat: 33.02, minLng: -94.04, maxLng: -88.82, name: 'Louisiana' },
  ME: { minLat: 43.06, maxLat: 47.46, minLng: -71.08, maxLng: -66.95, name: 'Maine' },
  MD: { minLat: 37.91, maxLat: 39.72, minLng: -79.49, maxLng: -75.05, name: 'Maryland' },
  MA: { minLat: 41.24, maxLat: 42.89, minLng: -73.50, maxLng: -69.93, name: 'Massachusetts' },
  MI: { minLat: 41.70, maxLat: 48.19, minLng: -90.42, maxLng: -82.12, name: 'Michigan' },
  MN: { minLat: 43.50, maxLat: 49.38, minLng: -97.24, maxLng: -89.49, name: 'Minnesota' },
  MS: { minLat: 30.17, maxLat: 35.00, minLng: -91.66, maxLng: -88.10, name: 'Mississippi' },
  MO: { minLat: 35.99, maxLat: 40.61, minLng: -95.77, maxLng: -89.10, name: 'Missouri' },
  MT: { minLat: 44.36, maxLat: 49.00, minLng: -116.05, maxLng: -104.04, name: 'Montana' },
  NE: { minLat: 40.00, maxLat: 43.00, minLng: -104.05, maxLng: -95.31, name: 'Nebraska' },
  NV: { minLat: 35.00, maxLat: 42.00, minLng: -120.01, maxLng: -114.04, name: 'Nevada' },
  NH: { minLat: 42.70, maxLat: 45.31, minLng: -72.56, maxLng: -70.70, name: 'New Hampshire' },
  NJ: { minLat: 38.93, maxLat: 41.36, minLng: -75.56, maxLng: -73.89, name: 'New Jersey' },
  NM: { minLat: 31.33, maxLat: 37.00, minLng: -109.05, maxLng: -103.00, name: 'New Mexico' },
  NY: { minLat: 40.50, maxLat: 45.02, minLng: -79.76, maxLng: -71.86, name: 'New York' },
  NC: { minLat: 33.84, maxLat: 36.59, minLng: -84.32, maxLng: -75.46, name: 'North Carolina' },
  ND: { minLat: 45.94, maxLat: 49.00, minLng: -104.05, maxLng: -96.55, name: 'North Dakota' },
  OH: { minLat: 38.40, maxLat: 42.33, minLng: -84.82, maxLng: -80.52, name: 'Ohio' },
  OK: { minLat: 33.62, maxLat: 37.00, minLng: -103.00, maxLng: -94.43, name: 'Oklahoma' },
  OR: { minLat: 41.99, maxLat: 46.29, minLng: -124.57, maxLng: -116.46, name: 'Oregon' },
  PA: { minLat: 39.72, maxLat: 42.27, minLng: -80.52, maxLng: -74.69, name: 'Pennsylvania' },
  RI: { minLat: 41.15, maxLat: 42.02, minLng: -71.86, maxLng: -71.12, name: 'Rhode Island' },
  SC: { minLat: 32.03, maxLat: 35.22, minLng: -83.35, maxLng: -78.54, name: 'South Carolina' },
  SD: { minLat: 42.48, maxLat: 45.95, minLng: -104.06, maxLng: -96.44, name: 'South Dakota' },
  TN: { minLat: 34.98, maxLat: 36.68, minLng: -90.31, maxLng: -81.65, name: 'Tennessee' },
  TX: { minLat: 25.84, maxLat: 36.50, minLng: -106.65, maxLng: -93.51, name: 'Texas' },
  UT: { minLat: 36.99, maxLat: 42.00, minLng: -114.05, maxLng: -109.04, name: 'Utah' },
  VT: { minLat: 42.73, maxLat: 45.02, minLng: -73.44, maxLng: -71.46, name: 'Vermont' },
  VA: { minLat: 36.54, maxLat: 39.47, minLng: -83.68, maxLng: -75.24, name: 'Virginia' },
  WA: { minLat: 45.54, maxLat: 49.00, minLng: -124.85, maxLng: -116.92, name: 'Washington' },
  WV: { minLat: 37.20, maxLat: 40.64, minLng: -82.64, maxLng: -77.72, name: 'West Virginia' },
  WI: { minLat: 42.49, maxLat: 47.08, minLng: -92.89, maxLng: -86.25, name: 'Wisconsin' },
  WY: { minLat: 40.99, maxLat: 45.01, minLng: -111.05, maxLng: -104.05, name: 'Wyoming' },
  DC: { minLat: 38.79, maxLat: 38.99, minLng: -77.12, maxLng: -76.91, name: 'District of Columbia' }
};

/**
 * Canadian Province bounding boxes
 */
const CA_PROVINCE_BOUNDS = {
  AB: { minLat: 49.00, maxLat: 60.00, minLng: -120.00, maxLng: -110.00, name: 'Alberta' },
  BC: { minLat: 48.31, maxLat: 60.00, minLng: -139.05, maxLng: -114.05, name: 'British Columbia' },
  MB: { minLat: 49.00, maxLat: 60.00, minLng: -102.00, maxLng: -89.00, name: 'Manitoba' },
  NB: { minLat: 44.60, maxLat: 48.07, minLng: -69.06, maxLng: -63.77, name: 'New Brunswick' },
  NL: { minLat: 46.62, maxLat: 60.38, minLng: -67.81, maxLng: -52.62, name: 'Newfoundland and Labrador' },
  NS: { minLat: 43.42, maxLat: 47.03, minLng: -66.32, maxLng: -59.68, name: 'Nova Scotia' },
  NT: { minLat: 60.00, maxLat: 78.77, minLng: -136.45, maxLng: -102.00, name: 'Northwest Territories' },
  NU: { minLat: 51.66, maxLat: 83.11, minLng: -120.68, maxLng: -61.24, name: 'Nunavut' },
  ON: { minLat: 41.68, maxLat: 56.86, minLng: -95.16, maxLng: -74.34, name: 'Ontario' },
  PE: { minLat: 45.95, maxLat: 47.06, minLng: -64.42, maxLng: -62.02, name: 'Prince Edward Island' },
  QC: { minLat: 45.01, maxLat: 62.59, minLng: -79.76, maxLng: -57.10, name: 'Quebec' },
  SK: { minLat: 49.00, maxLat: 60.00, minLng: -110.00, maxLng: -101.36, name: 'Saskatchewan' },
  YT: { minLat: 60.00, maxLat: 69.65, minLng: -141.00, maxLng: -124.00, name: 'Yukon' }
};

/**
 * Get jurisdiction (state/province code) from GPS coordinates
 *
 * @param {number} latitude - GPS latitude
 * @param {number} longitude - GPS longitude
 * @returns {string|null} - Two-letter state/province code or null
 */
export function getJurisdictionFromCoordinates(latitude, longitude) {
  if (!latitude || !longitude) return null;

  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);

  // Check US states first (more common for IFTA)
  for (const [code, bounds] of Object.entries(US_STATE_BOUNDS)) {
    if (lat >= bounds.minLat && lat <= bounds.maxLat &&
        lng >= bounds.minLng && lng <= bounds.maxLng) {
      return code;
    }
  }

  // Check Canadian provinces
  for (const [code, bounds] of Object.entries(CA_PROVINCE_BOUNDS)) {
    if (lat >= bounds.minLat && lat <= bounds.maxLat &&
        lng >= bounds.minLng && lng <= bounds.maxLng) {
      return code;
    }
  }

  return null;
}

/**
 * Get full jurisdiction name from code
 *
 * @param {string} code - Two-letter jurisdiction code
 * @returns {string|null} - Full jurisdiction name
 */
export function getJurisdictionName(code) {
  if (!code) return null;
  const upperCode = code.toUpperCase();
  return US_STATE_BOUNDS[upperCode]?.name ||
         CA_PROVINCE_BOUNDS[upperCode]?.name ||
         null;
}

/**
 * Check if jurisdiction is a Canadian province
 *
 * @param {string} code - Two-letter jurisdiction code
 * @returns {boolean}
 */
export function isCanadianProvince(code) {
  if (!code) return false;
  return code.toUpperCase() in CA_PROVINCE_BOUNDS;
}

/**
 * Calculate distance between two GPS points using Haversine formula
 *
 * @param {number} lat1 - Start latitude
 * @param {number} lng1 - Start longitude
 * @param {number} lat2 - End latitude
 * @param {number} lng2 - End longitude
 * @returns {number} - Distance in miles
 */
export function calculateDistanceMiles(lat1, lng1, lat2, lng2) {
  const R = 3958.8; // Earth's radius in miles
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Detect jurisdiction crossing between two GPS points
 *
 * @param {object} prevLocation - Previous location { latitude, longitude, jurisdiction? }
 * @param {object} currLocation - Current location { latitude, longitude }
 * @returns {object|null} - Crossing details or null if no crossing
 */
export function detectJurisdictionCrossing(prevLocation, currLocation) {
  if (!prevLocation || !currLocation) return null;

  const prevJurisdiction = prevLocation.jurisdiction ||
    getJurisdictionFromCoordinates(prevLocation.latitude, prevLocation.longitude);
  const currJurisdiction =
    getJurisdictionFromCoordinates(currLocation.latitude, currLocation.longitude);

  if (!prevJurisdiction || !currJurisdiction) return null;
  if (prevJurisdiction === currJurisdiction) return null;

  // Calculate approximate crossing point (midpoint for simplicity)
  const crossingLat = (parseFloat(prevLocation.latitude) + parseFloat(currLocation.latitude)) / 2;
  const crossingLng = (parseFloat(prevLocation.longitude) + parseFloat(currLocation.longitude)) / 2;

  return {
    fromJurisdiction: prevJurisdiction,
    toJurisdiction: currJurisdiction,
    crossingPoint: {
      latitude: crossingLat,
      longitude: crossingLng
    },
    distanceMiles: calculateDistanceMiles(
      prevLocation.latitude,
      prevLocation.longitude,
      currLocation.latitude,
      currLocation.longitude
    )
  };
}

/**
 * Process GPS breadcrumbs to calculate jurisdiction mileage
 *
 * @param {Array} breadcrumbs - Array of GPS points with { latitude, longitude, timestamp }
 * @returns {object} - Mileage by jurisdiction { TX: 150.5, OK: 75.2 }
 */
export function calculateJurisdictionMileage(breadcrumbs) {
  if (!breadcrumbs || breadcrumbs.length < 2) {
    return {};
  }

  const mileageByJurisdiction = {};

  // Sort breadcrumbs by timestamp
  const sortedBreadcrumbs = [...breadcrumbs].sort((a, b) =>
    new Date(a.timestamp) - new Date(b.timestamp)
  );

  for (let i = 1; i < sortedBreadcrumbs.length; i++) {
    const prev = sortedBreadcrumbs[i - 1];
    const curr = sortedBreadcrumbs[i];

    const distance = calculateDistanceMiles(
      prev.latitude, prev.longitude,
      curr.latitude, curr.longitude
    );

    // Skip unrealistic distances (GPS glitches)
    if (distance > 200) continue; // Max ~200 miles between points

    // Check for jurisdiction crossing
    const prevJurisdiction = getJurisdictionFromCoordinates(prev.latitude, prev.longitude);
    const currJurisdiction = getJurisdictionFromCoordinates(curr.latitude, curr.longitude);

    if (prevJurisdiction === currJurisdiction && prevJurisdiction) {
      // All distance in same jurisdiction
      mileageByJurisdiction[prevJurisdiction] =
        (mileageByJurisdiction[prevJurisdiction] || 0) + distance;
    } else if (prevJurisdiction && currJurisdiction) {
      // Split distance at crossing (simple 50/50 split)
      const halfDistance = distance / 2;
      mileageByJurisdiction[prevJurisdiction] =
        (mileageByJurisdiction[prevJurisdiction] || 0) + halfDistance;
      mileageByJurisdiction[currJurisdiction] =
        (mileageByJurisdiction[currJurisdiction] || 0) + halfDistance;
    } else if (prevJurisdiction) {
      mileageByJurisdiction[prevJurisdiction] =
        (mileageByJurisdiction[prevJurisdiction] || 0) + distance;
    } else if (currJurisdiction) {
      mileageByJurisdiction[currJurisdiction] =
        (mileageByJurisdiction[currJurisdiction] || 0) + distance;
    }
  }

  // Round to 1 decimal place
  for (const jurisdiction in mileageByJurisdiction) {
    mileageByJurisdiction[jurisdiction] =
      Math.round(mileageByJurisdiction[jurisdiction] * 10) / 10;
  }

  return mileageByJurisdiction;
}

/**
 * Update IFTA mileage record for a vehicle
 *
 * @param {string} orgId - Organization ID
 * @param {string} vehicleId - Vehicle ID (internal or ELD provider ID)
 * @param {string} jurisdiction - State/province code
 * @param {number} miles - Miles to add
 * @param {string} quarter - IFTA quarter (e.g., '2026-Q1')
 * @returns {Promise<object>} - Updated record
 */
export async function updateIFTAMileage(orgId, vehicleId, jurisdiction, miles, quarter) {
  if (!orgId || !vehicleId || !jurisdiction || !miles || !quarter) {
    throw new Error('Missing required parameters for IFTA mileage update');
  }

  // Get current quarter if not specified
  const currentQuarter = quarter || getCurrentIFTAQuarter();

  // Check for existing record
  const { data: existing, error: fetchError } = await supabase
    .from('ifta_mileage')
    .select('*')
    .eq('organization_id', orgId)
    .eq('vehicle_id', vehicleId)
    .eq('jurisdiction', jurisdiction)
    .eq('quarter', currentQuarter)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') {
    throw fetchError;
  }

  if (existing) {
    // Update existing record
    const { data, error } = await supabase
      .from('ifta_mileage')
      .update({
        miles: existing.miles + miles,
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } else {
    // Create new record
    const { data, error } = await supabase
      .from('ifta_mileage')
      .insert({
        organization_id: orgId,
        vehicle_id: vehicleId,
        jurisdiction,
        quarter: currentQuarter,
        miles,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

/**
 * Get current IFTA quarter string
 *
 * @returns {string} - Quarter string (e.g., '2026-Q1')
 */
export function getCurrentIFTAQuarter() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  let quarter;
  if (month <= 3) quarter = 'Q1';
  else if (month <= 6) quarter = 'Q2';
  else if (month <= 9) quarter = 'Q3';
  else quarter = 'Q4';

  return `${year}-${quarter}`;
}

/**
 * Get IFTA quarter for a specific date
 *
 * @param {Date|string} date - Date to get quarter for
 * @returns {string} - Quarter string (e.g., '2026-Q1')
 */
export function getIFTAQuarterForDate(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = d.getMonth() + 1;

  let quarter;
  if (month <= 3) quarter = 'Q1';
  else if (month <= 6) quarter = 'Q2';
  else if (month <= 9) quarter = 'Q3';
  else quarter = 'Q4';

  return `${year}-${quarter}`;
}

/**
 * Store GPS breadcrumb for a vehicle
 *
 * @param {string} orgId - Organization ID
 * @param {string} eldVehicleId - ELD provider vehicle ID
 * @param {object} location - GPS location data
 * @returns {Promise<object>} - Stored breadcrumb
 */
export async function storeGPSBreadcrumb(orgId, eldVehicleId, location) {
  const jurisdiction = getJurisdictionFromCoordinates(location.latitude, location.longitude);

  const { data, error } = await supabase
    .from('gps_breadcrumbs')
    .insert({
      organization_id: orgId,
      eld_vehicle_id: eldVehicleId,
      latitude: location.latitude,
      longitude: location.longitude,
      jurisdiction,
      speed_mph: location.speedMph,
      heading: location.heading,
      odometer_miles: location.odometerMiles,
      recorded_at: location.recordedAt || new Date().toISOString(),
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get recent GPS breadcrumbs for a vehicle
 *
 * @param {string} orgId - Organization ID
 * @param {string} eldVehicleId - ELD provider vehicle ID
 * @param {number} limit - Max breadcrumbs to return
 * @returns {Promise<Array>} - Recent breadcrumbs
 */
export async function getRecentBreadcrumbs(orgId, eldVehicleId, limit = 100) {
  const { data, error } = await supabase
    .from('gps_breadcrumbs')
    .select('*')
    .eq('organization_id', orgId)
    .eq('eld_vehicle_id', eldVehicleId)
    .order('recorded_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

/**
 * Get last known location for a vehicle
 *
 * @param {string} orgId - Organization ID
 * @param {string} eldVehicleId - ELD provider vehicle ID
 * @returns {Promise<object|null>} - Last location or null
 */
export async function getLastKnownLocation(orgId, eldVehicleId) {
  const { data, error } = await supabase
    .from('gps_breadcrumbs')
    .select('*')
    .eq('organization_id', orgId)
    .eq('eld_vehicle_id', eldVehicleId)
    .order('recorded_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
}

export default {
  getJurisdictionFromCoordinates,
  getJurisdictionName,
  isCanadianProvince,
  calculateDistanceMiles,
  detectJurisdictionCrossing,
  calculateJurisdictionMileage,
  updateIFTAMileage,
  getCurrentIFTAQuarter,
  getIFTAQuarterForDate,
  storeGPSBreadcrumb,
  getRecentBreadcrumbs,
  getLastKnownLocation,
  US_STATE_BOUNDS,
  CA_PROVINCE_BOUNDS
};
