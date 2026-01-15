/**
 * Jurisdiction Service for Automated IFTA
 *
 * Handles:
 * - Loading and managing jurisdiction boundaries
 * - Point-in-polygon jurisdiction lookups
 * - Jurisdiction crossing detection
 * - GPS breadcrumb processing
 */

import { supabase } from '@/lib/supabaseClient';

// IFTA participating US states (48 contiguous + DC)
export const US_IFTA_JURISDICTIONS = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'DC', name: 'District of Columbia' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' }
];

// IFTA participating Canadian provinces
export const CANADIAN_IFTA_JURISDICTIONS = [
  { code: 'AB', name: 'Alberta' },
  { code: 'BC', name: 'British Columbia' },
  { code: 'MB', name: 'Manitoba' },
  { code: 'NB', name: 'New Brunswick' },
  { code: 'NL', name: 'Newfoundland and Labrador' },
  { code: 'NS', name: 'Nova Scotia' },
  { code: 'ON', name: 'Ontario' },
  { code: 'PE', name: 'Prince Edward Island' },
  { code: 'QC', name: 'Quebec' },
  { code: 'SK', name: 'Saskatchewan' }
];

// Non-IFTA jurisdictions (for reference)
export const NON_IFTA_JURISDICTIONS = [
  { code: 'AK', name: 'Alaska', country: 'US' },
  { code: 'HI', name: 'Hawaii', country: 'US' },
  { code: 'NT', name: 'Northwest Territories', country: 'CA' },
  { code: 'NU', name: 'Nunavut', country: 'CA' },
  { code: 'YT', name: 'Yukon', country: 'CA' }
];

/**
 * Get all IFTA jurisdictions from database
 */
export async function getJurisdictions() {
  const { data, error } = await supabase
    .from('ifta_jurisdictions')
    .select('code, name, country, is_ifta_member, tax_rate, tax_rate_effective_date')
    .eq('is_ifta_member', true)
    .order('country', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching jurisdictions:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get jurisdiction for a GPS coordinate using PostGIS
 * @param {number} latitude - GPS latitude
 * @param {number} longitude - GPS longitude
 * @returns {Promise<{code: string, name: string, country: string} | null>}
 */
export async function getJurisdictionForCoordinate(latitude, longitude) {
  const { data, error } = await supabase
    .rpc('get_jurisdiction_for_point', {
      p_latitude: latitude,
      p_longitude: longitude
    });

  if (error) {
    console.error('Error getting jurisdiction for point:', error);
    return null;
  }

  if (!data) return null;

  // Get full jurisdiction details
  const { data: jurisdiction } = await supabase
    .from('ifta_jurisdictions')
    .select('code, name, country')
    .eq('code', data)
    .single();

  return jurisdiction;
}

/**
 * Batch lookup jurisdictions for multiple coordinates
 * More efficient than individual lookups
 * @param {Array<{latitude: number, longitude: number}>} coordinates
 * @returns {Promise<Array<string>>} Array of jurisdiction codes
 */
export async function getJurisdictionsForCoordinates(coordinates) {
  if (!coordinates || coordinates.length === 0) return [];

  // For small batches, use individual lookups
  if (coordinates.length <= 10) {
    const results = await Promise.all(
      coordinates.map(async (coord) => {
        const { data } = await supabase.rpc('get_jurisdiction_for_point', {
          p_latitude: coord.latitude,
          p_longitude: coord.longitude
        });
        return data;
      })
    );
    return results;
  }

  // For larger batches, use a single query with UNNEST
  const { data, error } = await supabase.rpc('get_jurisdictions_for_points', {
    p_latitudes: coordinates.map(c => c.latitude),
    p_longitudes: coordinates.map(c => c.longitude)
  });

  if (error) {
    console.error('Error batch looking up jurisdictions:', error);
    // Fallback to individual lookups
    return Promise.all(
      coordinates.map(async (coord) => {
        const result = await getJurisdictionForCoordinate(coord.latitude, coord.longitude);
        return result?.code || null;
      })
    );
  }

  return data || [];
}

/**
 * Store a GPS breadcrumb from ELD data
 * @param {Object} breadcrumbData
 * @returns {Promise<Object>} The created breadcrumb record
 */
export async function storeBreadcrumb(breadcrumbData) {
  const {
    userId,
    vehicleId,
    driverId,
    eldConnectionId,
    latitude,
    longitude,
    heading,
    speedMph,
    odometer,
    accuracyMeters,
    recordedAt,
    provider,
    externalId
  } = breadcrumbData;

  const { data, error } = await supabase
    .from('eld_gps_breadcrumbs')
    .insert({
      user_id: userId,
      vehicle_id: vehicleId,
      driver_id: driverId,
      eld_connection_id: eldConnectionId,
      latitude,
      longitude,
      heading,
      speed_mph: speedMph,
      odometer,
      accuracy_meters: accuracyMeters,
      recorded_at: recordedAt,
      provider,
      external_id: externalId
    })
    .select()
    .single();

  if (error) {
    console.error('Error storing breadcrumb:', error);
    throw error;
  }

  return data;
}

/**
 * Store multiple GPS breadcrumbs in batch
 * @param {Array<Object>} breadcrumbs
 * @returns {Promise<number>} Number of breadcrumbs stored
 */
export async function storeBreadcrumbsBatch(breadcrumbs) {
  if (!breadcrumbs || breadcrumbs.length === 0) return 0;

  const records = breadcrumbs.map(b => ({
    user_id: b.userId,
    vehicle_id: b.vehicleId,
    driver_id: b.driverId,
    eld_connection_id: b.eldConnectionId,
    latitude: b.latitude,
    longitude: b.longitude,
    heading: b.heading,
    speed_mph: b.speedMph,
    odometer: b.odometer,
    accuracy_meters: b.accuracyMeters,
    recorded_at: b.recordedAt,
    provider: b.provider,
    external_id: b.externalId
  }));

  const { data, error } = await supabase
    .from('eld_gps_breadcrumbs')
    .insert(records)
    .select('id');

  if (error) {
    console.error('Error storing breadcrumbs batch:', error);
    throw error;
  }

  return data?.length || 0;
}

/**
 * Process breadcrumbs to detect jurisdiction crossings
 * @param {string} userId
 * @param {string} vehicleId
 * @param {Date} startTime - Optional start time filter
 * @param {Date} endTime - Optional end time filter
 * @returns {Promise<number>} Number of crossings detected
 */
export async function processJurisdictionCrossings(userId, vehicleId, startTime = null, endTime = null) {
  const { data, error } = await supabase.rpc('process_jurisdiction_crossings', {
    p_user_id: userId,
    p_vehicle_id: vehicleId,
    p_start_time: startTime?.toISOString() || null,
    p_end_time: endTime?.toISOString() || null
  });

  if (error) {
    console.error('Error processing jurisdiction crossings:', error);
    throw error;
  }

  return data || 0;
}

/**
 * Get unprocessed crossings for a user
 * @param {string} userId
 * @param {string} quarter - Optional quarter filter (YYYY-QN)
 * @returns {Promise<Array>}
 */
export async function getUnprocessedCrossings(userId, quarter = null) {
  let query = supabase
    .from('ifta_automated_crossings')
    .select(`
      *,
      vehicles:vehicle_id (unit_number, make, model),
      drivers:driver_id (first_name, last_name)
    `)
    .eq('user_id', userId)
    .eq('is_processed', false)
    .order('crossing_timestamp', { ascending: true });

  if (quarter) {
    query = query.eq('quarter', quarter);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching unprocessed crossings:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get crossings for a vehicle in a quarter
 * @param {string} userId
 * @param {string} vehicleId
 * @param {string} quarter - YYYY-QN format
 * @returns {Promise<Array>}
 */
export async function getVehicleCrossings(userId, vehicleId, quarter) {
  const { data, error } = await supabase
    .from('ifta_automated_crossings')
    .select('*')
    .eq('user_id', userId)
    .eq('vehicle_id', vehicleId)
    .eq('quarter', quarter)
    .order('crossing_timestamp', { ascending: true });

  if (error) {
    console.error('Error fetching vehicle crossings:', error);
    throw error;
  }

  return data || [];
}

/**
 * Mark crossings as processed and link to IFTA trip record
 * @param {Array<string>} crossingIds
 * @param {string} iftaTripId
 * @returns {Promise<number>} Number of crossings updated
 */
export async function markCrossingsProcessed(crossingIds, iftaTripId = null) {
  const { data, error } = await supabase
    .from('ifta_automated_crossings')
    .update({
      is_processed: true,
      processed_at: new Date().toISOString(),
      ifta_trip_id: iftaTripId
    })
    .in('id', crossingIds)
    .select('id');

  if (error) {
    console.error('Error marking crossings processed:', error);
    throw error;
  }

  return data?.length || 0;
}

/**
 * Get automated IFTA mileage summary for a quarter
 * @param {string} userId
 * @param {string} quarter - YYYY-QN format
 * @param {string} vehicleId - Optional vehicle filter
 * @returns {Promise<Object>}
 */
export async function getAutomatedMileageSummary(userId, quarter, vehicleId = null) {
  let query = supabase
    .from('ifta_automated_mileage')
    .select(`
      *,
      vehicles:vehicle_id (id, unit_number, make, model)
    `)
    .eq('user_id', userId)
    .eq('quarter', quarter);

  if (vehicleId) {
    query = query.eq('vehicle_id', vehicleId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching automated mileage:', error);
    throw error;
  }

  // Aggregate by jurisdiction
  const byJurisdiction = {};
  let totalMiles = 0;

  (data || []).forEach(record => {
    if (!byJurisdiction[record.jurisdiction]) {
      byJurisdiction[record.jurisdiction] = {
        jurisdiction: record.jurisdiction,
        miles: 0,
        vehicles: []
      };
    }
    byJurisdiction[record.jurisdiction].miles += parseFloat(record.total_miles) || 0;
    byJurisdiction[record.jurisdiction].vehicles.push({
      vehicleId: record.vehicle_id,
      unitNumber: record.vehicles?.unit_number,
      miles: parseFloat(record.total_miles) || 0
    });
    totalMiles += parseFloat(record.total_miles) || 0;
  });

  return {
    quarter,
    totalMiles,
    jurisdictions: Object.values(byJurisdiction).sort((a, b) => b.miles - a.miles),
    rawData: data
  };
}

/**
 * Calculate IFTA mileage from crossings for a quarter
 * @param {string} userId
 * @param {string} vehicleId
 * @param {string} quarter
 * @returns {Promise<Object>}
 */
export async function calculateMileageFromCrossings(userId, vehicleId, quarter) {
  const { data, error } = await supabase.rpc('calculate_automated_ifta_mileage', {
    p_user_id: userId,
    p_vehicle_id: vehicleId,
    p_quarter: quarter
  });

  if (error) {
    console.error('Error calculating mileage from crossings:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get recent GPS breadcrumbs for a vehicle
 * @param {string} userId
 * @param {string} vehicleId
 * @param {number} limit
 * @returns {Promise<Array>}
 */
export async function getRecentBreadcrumbs(userId, vehicleId, limit = 100) {
  const { data, error } = await supabase
    .from('eld_gps_breadcrumbs')
    .select('*')
    .eq('user_id', userId)
    .eq('vehicle_id', vehicleId)
    .order('recorded_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching recent breadcrumbs:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get GPS trail for a vehicle within a time range
 * @param {string} userId
 * @param {string} vehicleId
 * @param {Date} startTime
 * @param {Date} endTime
 * @returns {Promise<Array>}
 */
export async function getGpsTrail(userId, vehicleId, startTime, endTime) {
  const { data, error } = await supabase
    .from('eld_gps_breadcrumbs')
    .select('latitude, longitude, jurisdiction, recorded_at, speed_mph, odometer')
    .eq('user_id', userId)
    .eq('vehicle_id', vehicleId)
    .gte('recorded_at', startTime.toISOString())
    .lte('recorded_at', endTime.toISOString())
    .order('recorded_at', { ascending: true });

  if (error) {
    console.error('Error fetching GPS trail:', error);
    throw error;
  }

  return data || [];
}

/**
 * Calculate current quarter string
 * @param {Date} date
 * @returns {string} YYYY-QN format
 */
export function getQuarterFromDate(date = new Date()) {
  const year = date.getFullYear();
  const quarter = Math.ceil((date.getMonth() + 1) / 3);
  return `${year}-Q${quarter}`;
}

/**
 * Parse quarter string to date range
 * @param {string} quarter - YYYY-QN format
 * @returns {{start: Date, end: Date}}
 */
export function getQuarterDateRange(quarter) {
  const [year, q] = quarter.split('-Q');
  const quarterNum = parseInt(q);
  const startMonth = (quarterNum - 1) * 3;

  const start = new Date(parseInt(year), startMonth, 1);
  const end = new Date(parseInt(year), startMonth + 3, 0, 23, 59, 59, 999);

  return { start, end };
}

export default {
  getJurisdictions,
  getJurisdictionForCoordinate,
  getJurisdictionsForCoordinates,
  storeBreadcrumb,
  storeBreadcrumbsBatch,
  processJurisdictionCrossings,
  getUnprocessedCrossings,
  getVehicleCrossings,
  markCrossingsProcessed,
  getAutomatedMileageSummary,
  calculateMileageFromCrossings,
  getRecentBreadcrumbs,
  getGpsTrail,
  getQuarterFromDate,
  getQuarterDateRange,
  US_IFTA_JURISDICTIONS,
  CANADIAN_IFTA_JURISDICTIONS,
  NON_IFTA_JURISDICTIONS
};
