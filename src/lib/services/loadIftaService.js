// src/lib/services/loadIftaService.js
import { supabase } from "../supabaseClient";
import { getQuarterFromDate, validateTripQuarter } from "../utils/dateUtils";

/**
 * Service to handle integration between Load Management and IFTA Calculator
 * This service provides utilities to convert load data to IFTA trip records
 */

/**
 * Get all loads that can be imported to IFTA for a specific quarter
 * @param {string} userId - User ID
 * @param {string} quarter - Quarter string (e.g., "2023-Q1")
 * @returns {Promise<Array>} - Array of loads that can be imported
 */
export async function getImportableLoads(userId, quarter) {
  try {
    if (!userId || !quarter) {
      throw new Error("User ID and quarter are required");
    }

    // Parse quarter to get date range
    const [year, q] = quarter.split('-Q');
    const quarterNum = parseInt(q);

    // Calculate quarter start and end dates
    const startMonth = (quarterNum - 1) * 3;
    const startDate = new Date(parseInt(year), startMonth, 1);
    const endDate = new Date(parseInt(year), startMonth + 3, 0);

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // Get loads completed in the quarter
    const { data: loads, error: loadsError } = await supabase
      .from('loads')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'Completed')
      .gte('actual_delivery_date', startDateStr)
      .lte('actual_delivery_date', endDateStr)
      .order('actual_delivery_date', { ascending: false });

    if (loadsError) throw loadsError;

    // Get already imported loads
    const loadIds = (loads || []).map(load => load.id);

    let alreadyImportedLoads = [];
    if (loadIds.length > 0) {
      const { data: imports, error: importsError } = await supabase
        .from('ifta_trip_records')
        .select('load_id')
        .in('load_id', loadIds)
        .eq('user_id', userId)
        .eq('quarter', quarter);

      if (importsError) throw importsError;

      alreadyImportedLoads = (imports || []).map(trip => trip.load_id);
    }

    // Mark loads that are already imported
    const markedLoads = (loads || []).map(load => ({
      ...load,
      alreadyImported: alreadyImportedLoads.includes(load.id)
    }));

    return markedLoads;
  } catch (error) {
    console.error('Error getting importable loads:', error);
    throw new Error(`Failed to get importable loads: ${error.message}`);
  }
}

/**
 * Convert loads to IFTA trip records
 * @param {string} userId - User ID
 * @param {string} quarter - Quarter string (e.g., "2023-Q1")
 * @param {Array} loadIds - Array of load IDs to import
 * @returns {Promise<Array>} - Array of created IFTA trips
 */
export async function convertLoadsToIftaTrips(userId, quarter, loadIds) {
  try {
    if (!userId || !quarter || !loadIds || loadIds.length === 0) {
      throw new Error("User ID, quarter, and load IDs are required");
    }

    // Get the loads to convert
    const { data: loads, error: loadsError } = await supabase
      .from('loads')
      .select('*')
      .eq('user_id', userId)
      .in('id', loadIds);

    if (loadsError) throw loadsError;

    if (!loads || loads.length === 0) {
      throw new Error("No valid loads found to import");
    }

    // Parse states from origin and destination for each load
    const tripRecords = loads.map(load => {
      // Extract state from city, state format (simplified approach)
      const originState = extractState(load.origin);
      const destinationState = extractState(load.destination);

      // Determine the correct quarter based on the load's delivery date
      const loadDate = load.actual_delivery_date || load.delivery_date;
      const correctQuarter = getQuarterFromDate(loadDate);

      // Validate that the load belongs to the requested quarter
      if (!validateTripQuarter(loadDate, quarter)) {
        console.warn(`Load ${load.id} (${loadDate}) belongs to ${correctQuarter}, but importing to ${quarter}`);
      }

      return {
        user_id: userId,
        quarter: correctQuarter, // Use the quarter determined from load date
        start_date: load.actual_delivery_date || load.delivery_date,
        end_date: load.actual_delivery_date || load.delivery_date,
        vehicle_id: load.truck_id || 'unknown',
        driver_id: load.driver || null,
        load_id: load.id,
        start_jurisdiction: originState,
        end_jurisdiction: destinationState,
        total_miles: load.distance || estimateMileage(load.origin, load.destination),
        gallons: 0, // To be filled by user or calculated based on MPG
        fuel_cost: 0, // To be filled by user
        notes: `Imported from Load #${load.load_number}: ${load.origin || ''} to ${load.destination || ''}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_imported: true
      };
    });

    // Insert the trip records
    const { data: createdTrips, error: insertError } = await supabase
      .from('ifta_trip_records')
      .insert(tripRecords)
      .select();

    if (insertError) throw insertError;

    return createdTrips || [];
  } catch (error) {
    console.error('Error converting loads to IFTA trips:', error);
    throw new Error(`Failed to convert loads to IFTA trips: ${error.message}`);
  }
}

/**
 * Extract state code from address string (e.g., "City, State")
 * @param {string} location - Location string
 * @returns {string} - State code
 */
function extractState(location) {
  if (!location) return '';

  // Try to extract state code from formats like "City, ST" or "City, State"
  const statePattern = /,\s*([A-Z]{2})\b/;
  const match = location.match(statePattern);

  if (match && match[1]) {
    return match[1]; // Return the state code
  }

  // If we can't find a state code, return empty string
  return '';
}

/**
 * Estimate mileage between two locations
 * @param {string} origin - Origin location
 * @param {string} destination - Destination location
 * @returns {number} - Estimated mileage
 */
function estimateMileage(origin, destination) {
  // In a real implementation, you would call a maps API
  // For now, we'll just return a random number between 100 and 1000
  return Math.floor(Math.random() * 900) + 100;
}

/**
 * Get statistics about load to IFTA import status
 * @param {string} userId - User ID
 * @param {string} quarter - Quarter string (e.g., "2023-Q1")
 * @returns {Promise<Object>} - Statistics
 */
export async function getLoadToIftaStats(userId, quarter) {
  try {
    const loads = await getImportableLoads(userId, quarter);

    const imported = loads.filter(load => load.alreadyImported).length;
    const available = loads.length - imported;

    return {
      total: loads.length,
      imported,
      available,
      success: true
    };
  } catch (error) {
    console.error('Error getting load to IFTA stats:', error);
    return {
      total: 0,
      imported: 0,
      available: 0,
      success: false,
      error: error.message
    };
  }
}