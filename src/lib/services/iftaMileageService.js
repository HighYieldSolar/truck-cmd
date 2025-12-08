// src/lib/services/iftaMileageService.js - Compatible version
import { supabase } from "../supabaseClient";
import { getQuarterFromDate, validateTripQuarter } from "../utils/dateUtils";

/**
 * Get all state mileage trips that can be imported to IFTA for a specific quarter
 * @param {string} userId - User ID
 * @param {string} quarter - Quarter string (e.g., "2023-Q1")
 * @returns {Promise<Array>} - Array of mileage trips that can be imported
 */
export async function getImportableMileageTrips(userId, quarter) {
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

    // Get mileage trips completed in the quarter date range
    const { data: trips, error: tripsError } = await supabase
      .from('driver_mileage_trips')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .gte('start_date', startDateStr)
      .lte('end_date', endDateStr)
      .order('end_date', { ascending: false });

    if (tripsError) throw tripsError;

    // Get trips that are already imported
    const tripIds = (trips || []).map(trip => trip.id);

    let alreadyImportedTripIds = [];
    if (tripIds.length > 0) {
      const { data: imports, error: importsError } = await supabase
        .from('ifta_trip_records')
        .select('mileage_trip_id')
        .in('mileage_trip_id', tripIds)
        .eq('user_id', userId)
        .eq('quarter', quarter);

      if (importsError) throw importsError;

      alreadyImportedTripIds = (imports || [])
        .map(trip => trip.mileage_trip_id)
        .filter(id => id);
    }

    // Mark trips that are already imported
    const markedTrips = (trips || []).map(trip => ({
      ...trip,
      alreadyImported: alreadyImportedTripIds.includes(trip.id)
    }));

    return markedTrips;
  } catch (error) {
    throw new Error(`Failed to get importable mileage trips: ${error.message || "Unknown error"}`);
  }
}

/**
 * Get state mileage for a specific mileage trip
 * @param {string} tripId - Mileage trip ID
 * @returns {Promise<Array>} - Array of state mileage objects
 */
export async function getStateMileageForTrip(tripId) {
  try {
    if (!tripId) {
      throw new Error("Trip ID is required");
    }

    // Fetch all crossings for this trip
    const { data: crossings, error } = await supabase
      .from('driver_mileage_crossings')
      .select('*')
      .eq('trip_id', tripId)
      .order('timestamp', { ascending: true });

    if (error) throw error;

    // Calculate mileage by state
    let stateMileage = [];

    if (crossings && crossings.length >= 2) {
      for (let i = 0; i < crossings.length - 1; i++) {
        const currentState = crossings[i].state;
        const currentOdometer = crossings[i].odometer;
        const nextOdometer = crossings[i + 1].odometer;
        const milesDriven = nextOdometer - currentOdometer;

        // Skip negative or zero miles (possible data error)
        if (milesDriven <= 0) continue;

        // Add or update state mileage
        const existingEntry = stateMileage.find(entry => entry.state === currentState);
        if (existingEntry) {
          existingEntry.miles += milesDriven;
        } else {
          stateMileage.push({
            state: currentState,
            state_name: crossings[i].state_name || currentState,
            miles: milesDriven
          });
        }
      }
    }

    // Sort by miles (highest first)
    stateMileage = stateMileage.sort((a, b) => b.miles - a.miles);

    return stateMileage;
  } catch (error) {
    throw new Error(`Failed to get state mileage: ${error.message || "Unknown error"}`);
  }
}

/**
 * Get state mileage for a trip, split by quarter based on crossing dates
 * This handles trips that span multiple quarters correctly
 * @param {string} tripId - Mileage trip ID
 * @returns {Promise<Object>} - Object with mileage grouped by quarter then by state
 */
export async function getStateMileageByQuarter(tripId) {
  try {
    if (!tripId) {
      throw new Error("Trip ID is required");
    }

    // Fetch all crossings for this trip
    const { data: crossings, error } = await supabase
      .from('driver_mileage_crossings')
      .select('*')
      .eq('trip_id', tripId)
      .order('timestamp', { ascending: true });

    if (error) throw error;

    // Calculate mileage by quarter and state
    // Structure: { "2024-Q4": { "TX": { state, state_name, miles }, ... }, "2025-Q1": { ... } }
    const mileageByQuarter = {};

    if (crossings && crossings.length >= 2) {
      for (let i = 0; i < crossings.length - 1; i++) {
        const currentCrossing = crossings[i];
        const currentState = currentCrossing.state;
        const currentOdometer = currentCrossing.odometer;
        const nextOdometer = crossings[i + 1].odometer;
        const milesDriven = nextOdometer - currentOdometer;

        // Skip negative or zero miles (possible data error)
        if (milesDriven <= 0) continue;

        // Determine the quarter based on the crossing date (when the miles were driven)
        // Use crossing_date if available, otherwise fall back to timestamp
        const crossingDate = currentCrossing.crossing_date ||
          (currentCrossing.timestamp ? currentCrossing.timestamp.split('T')[0] : null);

        if (!crossingDate) continue;

        const quarter = getQuarterFromDate(crossingDate);
        if (!quarter) continue;

        // Initialize quarter if not exists
        if (!mileageByQuarter[quarter]) {
          mileageByQuarter[quarter] = {};
        }

        // Add or update state mileage for this quarter
        if (!mileageByQuarter[quarter][currentState]) {
          mileageByQuarter[quarter][currentState] = {
            state: currentState,
            state_name: currentCrossing.state_name || currentState,
            miles: 0
          };
        }
        mileageByQuarter[quarter][currentState].miles += milesDriven;
      }
    }

    // Convert nested objects to arrays and sort
    const result = {};
    Object.keys(mileageByQuarter).forEach(quarter => {
      result[quarter] = Object.values(mileageByQuarter[quarter])
        .sort((a, b) => b.miles - a.miles);
    });

    return {
      quarters: Object.keys(result).sort(),
      mileageByQuarter: result,
      totalMiles: Object.values(result).flat().reduce((sum, s) => sum + s.miles, 0)
    };
  } catch (error) {
    throw new Error(`Failed to get state mileage by quarter: ${error.message || "Unknown error"}`);
  }
}

/**
 * Import state mileage trip into IFTA records
 * IMPROVED: Now properly handles trips that span multiple quarters by using crossing dates
 * @param {string} userId - User ID
 * @param {string} quarter - Quarter string (e.g., "2023-Q1") - used for validation, actual quarter determined by crossing dates
 * @param {string} tripId - Mileage trip ID to import
 * @returns {Promise<Object>} - Import results
 */
export async function importMileageTripToIFTA(userId, quarter, tripId) {
  try {
    if (!userId || !quarter || !tripId) {
      throw new Error("User ID, quarter, and trip ID are required");
    }

    // Get the mileage trip details
    const { data: trip, error: tripError } = await supabase
      .from('driver_mileage_trips')
      .select('*')
      .eq('id', tripId)
      .eq('user_id', userId)
      .single();

    if (tripError) {
      throw tripError;
    }

    if (!trip) {
      throw new Error("Mileage trip not found");
    }

    // IMPORTANT: Check if this trip has already been imported (in ANY quarter)
    const { count, error: checkError } = await supabase
      .from('ifta_trip_records')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('mileage_trip_id', tripId);

    if (checkError) {
      if (checkError.code === '42P01') {
        throw new Error("IFTA trip records table not found. Please contact support.");
      }
      throw checkError;
    }

    if (count > 0) {
      return {
        success: true,
        importedCount: 0,
        totalMiles: 0,
        states: [],
        quarters: [],
        alreadyImported: true,
        message: "This trip has already been imported to IFTA."
      };
    }

    // Get state mileage BY QUARTER - this properly splits crossings across quarters
    let mileageData;
    try {
      mileageData = await getStateMileageByQuarter(tripId);
    } catch (stateError) {
      throw new Error(`Failed to get state mileage data: ${stateError.message}`);
    }

    if (mileageData.quarters.length === 0 || mileageData.totalMiles === 0) {
      return {
        success: true,
        importedCount: 0,
        totalMiles: 0,
        states: [],
        quarters: [],
        message: "No state mileage data found for this trip."
      };
    }

    // Prepare IFTA records for each quarter and state
    const tripRecords = [];
    const allStates = new Set();

    for (const importQuarter of mileageData.quarters) {
      const stateMileage = mileageData.mileageByQuarter[importQuarter];

      for (const state of stateMileage) {
        allStates.add(state.state);

        tripRecords.push({
          user_id: userId,
          quarter: importQuarter, // Use the quarter determined from crossing dates
          start_date: trip.start_date,
          end_date: trip.end_date || trip.start_date,
          vehicle_id: trip.vehicle_id,
          mileage_trip_id: trip.id,
          start_jurisdiction: state.state,
          end_jurisdiction: state.state,
          total_miles: state.miles,
          gallons: 0,
          fuel_cost: 0,
          notes: `Imported from State Mileage Tracker: ${state.state_name} (${state.miles.toFixed(1)} miles) - ${importQuarter}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_imported: true,
          source: 'mileage_tracker'
        });
      }
    }

    // Insert records
    let insertedData = [];
    if (tripRecords.length > 0) {
      try {
        const { data, error: insertError } = await supabase
          .from('ifta_trip_records')
          .insert(tripRecords)
          .select();

        if (insertError) {
          if (insertError.code === '23505' ||
            (insertError.message && insertError.message.includes('duplicate key value violates unique constraint'))) {
            return {
              success: true,
              importedCount: 0,
              totalMiles: 0,
              alreadyImported: true,
              message: "This trip has already been imported to IFTA."
            };
          }
          throw insertError;
        }

        insertedData = data || [];
      } catch (insertErr) {
        if (insertErr.code === '23505' ||
          (insertErr.message && insertErr.message.includes('duplicate key value violates unique constraint'))) {
          return {
            success: true,
            importedCount: 0,
            totalMiles: 0,
            alreadyImported: true,
            message: "This trip has already been imported to IFTA."
          };
        }
        throw new Error(`Failed to insert IFTA records: ${insertErr.message}`);
      }
    }

    // Build result message
    const quarterInfo = mileageData.quarters.length > 1
      ? `Split across ${mileageData.quarters.join(' and ')}`
      : mileageData.quarters[0];

    return {
      success: true,
      importedCount: tripRecords.length,
      totalMiles: mileageData.totalMiles,
      states: [...allStates],
      quarters: mileageData.quarters,
      createdRecords: insertedData,
      message: mileageData.quarters.length > 1
        ? `Trip spans multiple quarters - miles assigned based on crossing dates (${quarterInfo})`
        : undefined
    };
  } catch (error) {
    if (error.code === '23505' ||
      (error.message && error.message.includes('duplicate key value violates unique constraint'))) {
      return {
        success: true,
        importedCount: 0,
        totalMiles: 0,
        alreadyImported: true,
        message: "This trip has already been imported to IFTA."
      };
    }

    return {
      success: false,
      error: error.message || "An unknown error occurred during import"
    };
  }
}

/**
 * Generate IFTA summary from state mileage data
 * @param {string} userId - User ID
 * @param {string} quarter - Quarter string (e.g., "2023-Q1")
 * @returns {Promise<Object>} - IFTA summary data
 */
export async function generateIFTASummaryFromMileage(userId, quarter) {
  try {
    if (!userId || !quarter) {
      throw new Error("User ID and quarter are required");
    }

    // Get all mileage trips in this quarter
    const mileageTrips = await getImportableMileageTrips(userId, quarter);

    // Get state mileage for all trips
    const allStateMileage = {};

    for (const trip of mileageTrips) {
      const stateMileage = await getStateMileageForTrip(trip.id);

      for (const state of stateMileage) {
        if (!allStateMileage[state.state]) {
          allStateMileage[state.state] = {
            state: state.state,
            state_name: state.state_name,
            miles: 0
          };
        }

        allStateMileage[state.state].miles += state.miles;
      }
    }

    // Convert to array and sort
    const jurisdictionSummary = Object.values(allStateMileage).sort((a, b) => b.miles - a.miles);

    // Get total miles
    const totalMiles = jurisdictionSummary.reduce((sum, state) => sum + state.miles, 0);

    return {
      quarter,
      totalMiles,
      totalGallons: 0, // To be calculated based on fuel data
      avgMpg: 0, // To be calculated based on fuel data
      jurisdictionSummary
    };
  } catch (error) {
    throw new Error(`Failed to generate IFTA summary: ${error.message}`);
  }
}

/**
 * Get statistics about mileage to IFTA import status
 * @param {string} userId - User ID
 * @param {string} quarter - Quarter string (e.g., "2023-Q1")
 * @returns {Promise<Object>} - Statistics
 */
export async function getMileageToIftaStats(userId, quarter) {
  try {
    const trips = await getImportableMileageTrips(userId, quarter);

    const imported = trips.filter(trip => trip.alreadyImported).length;
    const available = trips.length - imported;

    return {
      total: trips.length,
      imported,
      available,
      success: true
    };
  } catch (error) {
    return {
      total: 0,
      imported: 0,
      available: 0,
      success: false,
      error: error.message
    };
  }
}