/**
 * GPS Processing Service for Automated IFTA
 *
 * Processes GPS data from ELD providers to:
 * - Store breadcrumb trails
 * - Detect jurisdiction crossings
 * - Calculate mileage by jurisdiction
 * - Generate IFTA reports
 */

import { supabase } from '@/lib/supabaseClient';
import {
  storeBreadcrumb,
  storeBreadcrumbsBatch,
  processJurisdictionCrossings,
  getQuarterFromDate
} from './jurisdictionService';

/**
 * Process GPS location update from ELD webhook
 * @param {Object} locationData - GPS location data from ELD provider
 * @returns {Promise<Object>} Processing result
 */
export async function processGPSLocation(locationData) {
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
    recordedAt,
    provider,
    externalId
  } = locationData;

  // Validate required fields
  if (!userId || !vehicleId || !latitude || !longitude) {
    throw new Error('Missing required fields: userId, vehicleId, latitude, longitude');
  }

  // Store the breadcrumb (jurisdiction is auto-detected via trigger)
  const breadcrumb = await storeBreadcrumb({
    userId,
    vehicleId,
    driverId,
    eldConnectionId,
    latitude,
    longitude,
    heading,
    speedMph,
    odometer,
    accuracyMeters: locationData.accuracyMeters,
    recordedAt: recordedAt || new Date().toISOString(),
    provider,
    externalId
  });

  // Check if we should process crossings (every N breadcrumbs or on demand)
  const shouldProcessCrossings = await shouldTriggerCrossingDetection(userId, vehicleId);

  let crossingsDetected = 0;
  if (shouldProcessCrossings) {
    crossingsDetected = await processJurisdictionCrossings(userId, vehicleId);
  }

  return {
    breadcrumbId: breadcrumb.id,
    jurisdiction: breadcrumb.jurisdiction,
    crossingsDetected
  };
}

/**
 * Process batch of GPS locations (more efficient for historical data)
 * @param {Array<Object>} locations - Array of GPS location data
 * @returns {Promise<Object>} Processing result
 */
export async function processGPSLocationBatch(locations) {
  if (!locations || locations.length === 0) {
    return { stored: 0, crossingsDetected: 0 };
  }

  // Store all breadcrumbs
  const stored = await storeBreadcrumbsBatch(locations);

  // Group by user/vehicle and process crossings for each
  const vehicleGroups = new Map();
  locations.forEach(loc => {
    const key = `${loc.userId}:${loc.vehicleId}`;
    if (!vehicleGroups.has(key)) {
      vehicleGroups.set(key, { userId: loc.userId, vehicleId: loc.vehicleId });
    }
  });

  let totalCrossings = 0;
  for (const [, vehicle] of vehicleGroups) {
    const crossings = await processJurisdictionCrossings(vehicle.userId, vehicle.vehicleId);
    totalCrossings += crossings;
  }

  return {
    stored,
    crossingsDetected: totalCrossings
  };
}

/**
 * Determine if we should trigger crossing detection
 * (Avoids running expensive queries on every breadcrumb)
 */
async function shouldTriggerCrossingDetection(userId, vehicleId) {
  // Check how many unprocessed breadcrumbs we have
  const { count, error } = await supabase
    .from('eld_gps_breadcrumbs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('vehicle_id', vehicleId)
    .is('jurisdiction_detected_at', null);

  if (error) {
    console.error('Error checking breadcrumb count:', error);
    return true; // Process on error to be safe
  }

  // Process every 10 breadcrumbs or if there are unprocessed ones
  return (count || 0) >= 10;
}

/**
 * Process all pending crossings for a user
 * @param {string} userId
 * @returns {Promise<Object>}
 */
export async function processPendingCrossings(userId) {
  // Get all vehicles with ELD connections
  const { data: connections, error } = await supabase
    .from('eld_connections')
    .select('vehicle_id')
    .eq('user_id', userId)
    .eq('status', 'active');

  if (error) {
    console.error('Error fetching ELD connections:', error);
    throw error;
  }

  const results = {
    vehiclesProcessed: 0,
    totalCrossings: 0,
    errors: []
  };

  for (const conn of (connections || [])) {
    try {
      const crossings = await processJurisdictionCrossings(userId, conn.vehicle_id);
      results.vehiclesProcessed++;
      results.totalCrossings += crossings;
    } catch (err) {
      results.errors.push({
        vehicleId: conn.vehicle_id,
        error: err.message
      });
    }
  }

  return results;
}

/**
 * Calculate and update IFTA mileage for a vehicle's quarter
 * @param {string} userId
 * @param {string} vehicleId
 * @param {string} quarter - YYYY-QN format
 * @returns {Promise<Object>}
 */
export async function updateVehicleIFTAMileage(userId, vehicleId, quarter) {
  // Get all crossings for this vehicle/quarter
  const { data: crossings, error } = await supabase
    .from('ifta_automated_crossings')
    .select('*')
    .eq('user_id', userId)
    .eq('vehicle_id', vehicleId)
    .eq('quarter', quarter)
    .order('crossing_timestamp', { ascending: true });

  if (error) {
    console.error('Error fetching crossings:', error);
    throw error;
  }

  if (!crossings || crossings.length === 0) {
    return { mileageByJurisdiction: {}, totalMiles: 0 };
  }

  // Calculate mileage between consecutive crossings
  const mileageByJurisdiction = {};
  let totalMiles = 0;

  for (let i = 0; i < crossings.length - 1; i++) {
    const current = crossings[i];
    const next = crossings[i + 1];

    // Jurisdiction is where the vehicle is AFTER the crossing
    const jurisdiction = current.to_jurisdiction;

    // Calculate miles from odometer difference
    if (current.odometer_at_crossing && next.odometer_at_crossing) {
      const miles = parseFloat(next.odometer_at_crossing) - parseFloat(current.odometer_at_crossing);

      if (miles > 0 && miles < 2000) { // Sanity check: max 2000 miles between crossings
        if (!mileageByJurisdiction[jurisdiction]) {
          mileageByJurisdiction[jurisdiction] = 0;
        }
        mileageByJurisdiction[jurisdiction] += miles;
        totalMiles += miles;
      }
    }
  }

  // Update the automated mileage table
  for (const [jurisdiction, miles] of Object.entries(mileageByJurisdiction)) {
    await supabase.rpc('increment_ifta_mileage', {
      p_user_id: userId,
      p_vehicle_id: vehicleId,
      p_quarter: quarter,
      p_jurisdiction: jurisdiction,
      p_miles: 0 // Reset and recalculate
    });

    // Now set the correct value
    await supabase
      .from('ifta_automated_mileage')
      .update({
        total_miles: miles,
        gps_miles: miles,
        last_calculated_at: new Date().toISOString(),
        calculation_method: 'odometer'
      })
      .eq('user_id', userId)
      .eq('vehicle_id', vehicleId)
      .eq('quarter', quarter)
      .eq('jurisdiction', jurisdiction);
  }

  return {
    mileageByJurisdiction,
    totalMiles
  };
}

/**
 * Get automated mileage summary for a quarter
 * @param {string} userId
 * @param {string} quarter
 * @param {string} vehicleId - Optional: filter by vehicle
 * @returns {Promise<Object>}
 */
export async function getAutomatedMileageSummary(userId, quarter, vehicleId = null) {
  let query = supabase
    .from('ifta_automated_mileage')
    .select(`
      id,
      jurisdiction,
      total_miles,
      gps_miles,
      vehicle_id,
      crossing_count,
      entry_count,
      last_calculated_at
    `)
    .eq('user_id', userId)
    .eq('quarter', quarter)
    .gt('total_miles', 0);

  if (vehicleId) {
    query = query.eq('vehicle_id', vehicleId);
  }

  const { data, error } = await query;

  if (error) {
    // Table might not exist yet
    if (error.code === '42P01') {
      return { jurisdictions: [], totalMiles: 0, hasData: false };
    }
    console.error('Error fetching automated mileage summary:', error);
    throw error;
  }

  // Aggregate by jurisdiction
  const jurisdictionTotals = {};
  let totalMiles = 0;

  (data || []).forEach(record => {
    const code = record.jurisdiction;
    const miles = parseFloat(record.total_miles) || 0;

    if (!jurisdictionTotals[code]) {
      jurisdictionTotals[code] = {
        code,
        miles: 0,
        crossings: 0,
        entries: 0
      };
    }

    jurisdictionTotals[code].miles += miles;
    jurisdictionTotals[code].crossings += record.crossing_count || 0;
    jurisdictionTotals[code].entries += record.entry_count || 0;
    totalMiles += miles;
  });

  const jurisdictions = Object.values(jurisdictionTotals)
    .filter(j => j.miles > 0)
    .sort((a, b) => b.miles - a.miles);

  return {
    jurisdictions,
    totalMiles,
    jurisdictionCount: jurisdictions.length,
    hasData: totalMiles > 0,
    quarter
  };
}

/**
 * Get IFTA summary combining automated and manual data
 * @param {string} userId
 * @param {string} quarter
 * @returns {Promise<Object>}
 */
export async function getIFTASummaryWithAutomated(userId, quarter) {
  // Get automated mileage
  const { data: automatedData, error: autoError } = await supabase
    .from('ifta_automated_mileage')
    .select(`
      jurisdiction,
      total_miles,
      vehicle_id,
      vehicles:vehicle_id (unit_number)
    `)
    .eq('user_id', userId)
    .eq('quarter', quarter);

  if (autoError) {
    console.error('Error fetching automated mileage:', autoError);
  }

  // Get manual IFTA records
  const { data: manualData, error: manualError } = await supabase
    .from('ifta_trip_records')
    .select('start_jurisdiction, end_jurisdiction, total_miles')
    .eq('user_id', userId)
    .eq('quarter', quarter)
    .eq('is_imported', false); // Only manual entries

  if (manualError) {
    console.error('Error fetching manual mileage:', manualError);
  }

  // Combine the data
  const combined = {};

  // Add automated mileage
  (automatedData || []).forEach(record => {
    const jurisdiction = record.jurisdiction;
    if (!combined[jurisdiction]) {
      combined[jurisdiction] = {
        jurisdiction,
        automatedMiles: 0,
        manualMiles: 0,
        totalMiles: 0,
        source: 'automated'
      };
    }
    combined[jurisdiction].automatedMiles += parseFloat(record.total_miles) || 0;
    combined[jurisdiction].totalMiles += parseFloat(record.total_miles) || 0;
  });

  // Add manual mileage
  (manualData || []).forEach(record => {
    // For manual records, split miles between start and end jurisdictions
    const miles = parseFloat(record.total_miles) || 0;

    if (record.end_jurisdiction) {
      const jurisdiction = record.end_jurisdiction;
      if (!combined[jurisdiction]) {
        combined[jurisdiction] = {
          jurisdiction,
          automatedMiles: 0,
          manualMiles: 0,
          totalMiles: 0,
          source: 'manual'
        };
      }
      combined[jurisdiction].manualMiles += miles;
      combined[jurisdiction].totalMiles += miles;
      combined[jurisdiction].source = combined[jurisdiction].automatedMiles > 0 ? 'mixed' : 'manual';
    }
  });

  // Calculate totals
  const totalAutomated = Object.values(combined).reduce((sum, j) => sum + j.automatedMiles, 0);
  const totalManual = Object.values(combined).reduce((sum, j) => sum + j.manualMiles, 0);
  const totalMiles = totalAutomated + totalManual;

  return {
    quarter,
    totalMiles,
    totalAutomated,
    totalManual,
    jurisdictions: Object.values(combined).sort((a, b) => b.totalMiles - a.totalMiles),
    hasAutomatedData: totalAutomated > 0
  };
}

/**
 * Import automated mileage to IFTA trip records
 * @param {string} userId
 * @param {string} quarter
 * @param {string} vehicleId - Optional: import only for specific vehicle
 * @returns {Promise<Object>}
 */
export async function importAutomatedToIFTA(userId, quarter, vehicleId = null) {
  // Get automated mileage
  let query = supabase
    .from('ifta_automated_mileage')
    .select('*')
    .eq('user_id', userId)
    .eq('quarter', quarter)
    .eq('is_finalized', false)
    .gt('total_miles', 0);

  if (vehicleId) {
    query = query.eq('vehicle_id', vehicleId);
  }

  const { data: mileageData, error } = await query;

  if (error) {
    console.error('Error fetching automated mileage for import:', error);
    throw error;
  }

  const results = {
    imported: 0,
    errors: []
  };

  for (const record of (mileageData || [])) {
    try {
      // Create IFTA trip record from automated data
      const { error: insertError } = await supabase
        .from('ifta_trip_records')
        .insert({
          user_id: userId,
          quarter,
          vehicle_id: record.vehicle_id,
          end_jurisdiction: record.jurisdiction,
          total_miles: record.total_miles,
          is_imported: true,
          source: 'eld_automated',
          notes: `Automated ELD tracking - ${record.entry_count || 0} GPS entries`
        });

      if (insertError) {
        results.errors.push({
          jurisdiction: record.jurisdiction,
          error: insertError.message
        });
      } else {
        results.imported++;

        // Mark the automated record as finalized
        await supabase
          .from('ifta_automated_mileage')
          .update({
            is_finalized: true,
            finalized_at: new Date().toISOString()
          })
          .eq('id', record.id);
      }
    } catch (err) {
      results.errors.push({
        jurisdiction: record.jurisdiction,
        error: err.message
      });
    }
  }

  return results;
}

/**
 * Get GPS trail summary for debugging/visualization
 * @param {string} userId
 * @param {string} vehicleId
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {Promise<Object>}
 */
export async function getGPSTrailSummary(userId, vehicleId, startDate, endDate) {
  const { data, error } = await supabase
    .from('eld_gps_breadcrumbs')
    .select('latitude, longitude, jurisdiction, recorded_at, speed_mph')
    .eq('user_id', userId)
    .eq('vehicle_id', vehicleId)
    .gte('recorded_at', startDate.toISOString())
    .lte('recorded_at', endDate.toISOString())
    .order('recorded_at', { ascending: true });

  if (error) {
    console.error('Error fetching GPS trail:', error);
    throw error;
  }

  // Calculate summary stats
  const points = data || [];
  const jurisdictions = new Set(points.map(p => p.jurisdiction).filter(Boolean));

  return {
    pointCount: points.length,
    jurisdictionsCrossed: Array.from(jurisdictions),
    startTime: points[0]?.recorded_at,
    endTime: points[points.length - 1]?.recorded_at,
    trail: points.map(p => ({
      lat: parseFloat(p.latitude),
      lng: parseFloat(p.longitude),
      jurisdiction: p.jurisdiction,
      time: p.recorded_at,
      speed: parseFloat(p.speed_mph) || 0
    }))
  };
}

export default {
  processGPSLocation,
  processGPSLocationBatch,
  processPendingCrossings,
  updateVehicleIFTAMileage,
  getAutomatedMileageSummary,
  getIFTASummaryWithAutomated,
  importAutomatedToIFTA,
  getGPSTrailSummary
};
