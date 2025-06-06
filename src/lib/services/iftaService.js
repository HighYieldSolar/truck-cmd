// src/lib/services/iftaService.js - Updated version with improved error handling
import { supabase } from "../supabaseClient";
import { getQuarterDateRange } from "../utils/dateUtils";

/**
 * IFTA Service - Handles the synchronization between fuel entries and IFTA trip data
 * This service facilitates IFTA reporting by integrating fuel purchase data with trip data
 */

/**
 * Fetch fuel data formatted specifically for IFTA calculations
 * @param {string} userId - User ID
 * @param {string} quarter - Quarter in format "YYYY-QN" (e.g., "2023-Q1")
 * @returns {Promise<Array>} - Fuel data for IFTA reporting
 */
export async function fetchFuelDataForIFTA(userId, quarter) {
  try {
    if (!userId || !quarter) {
      throw new Error("User ID and quarter are required");
    }
    
    console.log(`Fetching fuel data for user ${userId} in quarter ${quarter}`);
    
    // Parse the quarter to get date range
    const [year, qPart] = quarter.split('-Q');
    const quarterNum = parseInt(qPart);
    
    if (isNaN(quarterNum) || quarterNum < 1 || quarterNum > 4) {
      throw new Error("Invalid quarter format. Use YYYY-QN (e.g., 2023-Q1)");
    }
    
    // Calculate quarter date range using utility function
    const { startDate: startDateStr, endDate: endDateStr } = getQuarterDateRange(quarter);
    
    console.log(`Calculated date range: ${startDateStr} to ${endDateStr}`);
    
    // Query fuel entries within the date range - only include Diesel and Gasoline for IFTA
    const { data, error } = await supabase
      .from('fuel_entries')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDateStr)
      .lte('date', endDateStr)
      .in('fuel_type', ['Diesel', 'Gasoline'])
      .order('date', { ascending: true });
    
    if (error) {
      console.error("Supabase error fetching fuel entries:", error);
      throw error;
    }
    
    console.log(`Found ${data?.length || 0} fuel entries for IFTA`);
    
    // Process data for IFTA use - group by jurisdiction (state)
    const fuelByState = {};
    
    (data || []).forEach(entry => {
      if (!entry.state) return;
      
      if (!fuelByState[entry.state]) {
        fuelByState[entry.state] = {
          jurisdiction: entry.state,
          stateName: entry.state_name || entry.state,
          gallons: 0,
          amount: 0,
          entries: []
        };
      }
      
      fuelByState[entry.state].gallons += parseFloat(entry.gallons) || 0;
      fuelByState[entry.state].amount += parseFloat(entry.total_amount) || 0;
      fuelByState[entry.state].entries.push({
        id: entry.id,
        date: entry.date,
        gallons: parseFloat(entry.gallons) || 0,
        amount: parseFloat(entry.total_amount) || 0,
        location: entry.location,
        vehicle: entry.vehicle_id
      });
    });
    
    // Convert to array format
    return Object.values(fuelByState);
  } catch (error) {
    console.error('Error fetching fuel data for IFTA:', error);
    throw new Error(`Failed to fetch fuel data: ${error.message || "Unknown error"}`);
  }
}

/**
 * Synchronize fuel data with IFTA trip records
 * @param {string} userId - User ID
 * @param {string} quarter - Quarter in format "YYYY-QN" (e.g., "2023-Q1")
 * @returns {Promise<Object>} - Synchronization results
 */
export async function syncFuelDataWithIFTA(userId, quarter) {
  try {
    if (!userId) {
      console.error("syncFuelDataWithIFTA called without userId");
      throw new Error("User ID is required");
    }
    
    if (!quarter) {
      console.error("syncFuelDataWithIFTA called without quarter");
      throw new Error("Quarter is required");
    }
    
    console.log(`Starting IFTA fuel sync for user ${userId}, quarter ${quarter}`);
    
    // Get fuel data for the quarter
    let fuelData;
    try {
      fuelData = await fetchFuelDataForIFTA(userId, quarter);
      console.log(`Fetched fuel data: ${fuelData.length} state entries`);
    } catch (fuelError) {
      console.error("Error in fetchFuelDataForIFTA:", fuelError);
      throw new Error(`Failed to fetch fuel data: ${fuelError.message}`);
    }
    
    // Get existing IFTA trip records for the quarter
    let existingTrips;
    try {
      const { data, error } = await supabase
        .from('ifta_trip_records')
        .select('id, vehicle_id, start_jurisdiction, end_jurisdiction, gallons, fuel_cost')
        .eq('user_id', userId)
        .eq('quarter', quarter);
        
      if (error) {
        console.error("Supabase error fetching trips:", error);
        throw error;
      }
      
      existingTrips = data || [];
      console.log(`Fetched ${existingTrips.length} IFTA trip records`);
    } catch (tripsError) {
      console.error("Error fetching IFTA trips:", tripsError);
      throw new Error(`Failed to fetch IFTA trips: ${tripsError.message}`);
    }
    
    // Calculate total fuel gallons by trip jurisdiction (for comparison)
    const existingFuelByJurisdiction = {};
    
    (existingTrips || []).forEach(trip => {
      if (trip.gallons && trip.gallons > 0) {
        // If trip has start and end in same jurisdiction
        if (trip.start_jurisdiction === trip.end_jurisdiction && trip.start_jurisdiction) {
          if (!existingFuelByJurisdiction[trip.start_jurisdiction]) {
            existingFuelByJurisdiction[trip.start_jurisdiction] = 0;
          }
          existingFuelByJurisdiction[trip.start_jurisdiction] += parseFloat(trip.gallons);
        } 
        // If trip crosses jurisdictions, split fuel between them
        else if (trip.start_jurisdiction && trip.end_jurisdiction) {
          if (!existingFuelByJurisdiction[trip.start_jurisdiction]) {
            existingFuelByJurisdiction[trip.start_jurisdiction] = 0;
          }
          if (!existingFuelByJurisdiction[trip.end_jurisdiction]) {
            existingFuelByJurisdiction[trip.end_jurisdiction] = 0;
          }
          
          // Split the gallons between jurisdictions (simplified approach)
          const gallonsPerJurisdiction = parseFloat(trip.gallons) / 2;
          existingFuelByJurisdiction[trip.start_jurisdiction] += gallonsPerJurisdiction;
          existingFuelByJurisdiction[trip.end_jurisdiction] += gallonsPerJurisdiction;
        }
      }
    });
    
    // Compare the fuel data from purchases with what's recorded in trips
    const discrepancies = {};
    const fuelByState = {};
    
    fuelData.forEach(stateData => {
      const jurisdiction = stateData.jurisdiction;
      fuelByState[jurisdiction] = {
        gallonsFromPurchases: stateData.gallons,
        gallonsFromTrips: existingFuelByJurisdiction[jurisdiction] || 0,
        entries: stateData.entries
      };
      
      // Calculate discrepancy
      const discrepancy = stateData.gallons - (existingFuelByJurisdiction[jurisdiction] || 0);
      
      if (Math.abs(discrepancy) > 0.001) { // Small tolerance for floating point comparison
        discrepancies[jurisdiction] = {
          jurisdiction,
          stateName: stateData.stateName,
          gallonsFromPurchases: stateData.gallons,
          gallonsFromTrips: existingFuelByJurisdiction[jurisdiction] || 0,
          discrepancy
        };
      }
    });
    
    console.log(`Found ${Object.keys(discrepancies).length} jurisdictions with discrepancies`);
    
    return {
      fuelData,
      existingTrips: existingTrips || [],
      fuelByState,
      discrepancies: Object.values(discrepancies),
      hasDiscrepancies: Object.keys(discrepancies).length > 0
    };
  } catch (error) {
    // Enhanced error handling
    console.error('Error syncing fuel data with IFTA:', error);
    
    // Create a detailed error with stack trace
    const detailedError = new Error(`IFTA sync failed: ${error.message || "Unknown error"}`);
    detailedError.originalError = error;
    detailedError.userId = userId;
    detailedError.quarter = quarter;
    
    // Log the detailed error
    console.error('Detailed IFTA sync error:', detailedError);
    
    // Return a default response with error info instead of throwing
    return {
      error: true,
      errorMessage: detailedError.message,
      fuelData: [],
      existingTrips: [],
      fuelByState: {},
      discrepancies: [],
      hasDiscrepancies: false
    };
  }
}

/**
 * Create IFTA fuel-only trips for jurisdictions with purchases but no corresponding trips
 * @param {string} userId - User ID
 * @param {string} quarter - Quarter in format "YYYY-QN" (e.g., "2023-Q1")
 * @param {Array} discrepancies - Discrepancy data from syncFuelDataWithIFTA
 * @returns {Promise<Object>} - Created trips info
 */
export async function createMissingFuelOnlyTrips(userId, quarter, discrepancies) {
  try {
    if (!userId || !quarter || !discrepancies || !Array.isArray(discrepancies)) {
      throw new Error("Missing required parameters");
    }
    
    const createdTrips = [];
    const errors = [];
    
    // Create a fuel-only trip for each jurisdiction with positive discrepancy
    // (meaning there's more fuel purchased than accounted for in trips)
    for (const disc of discrepancies) {
      if (disc.discrepancy <= 0) continue; // Skip if no positive discrepancy
      
      // Parse quarter for date
      const [year, qPart] = quarter.split('-Q');
      const quarterNum = parseInt(qPart);
      const startMonth = (quarterNum - 1) * 3;
      const midQuarterDate = new Date(parseInt(year), startMonth + 1, 15);
      
      // Create a "fuel only" trip record
      const tripData = {
        user_id: userId,
        quarter: quarter,
        start_date: midQuarterDate.toISOString().split('T')[0],
        end_date: midQuarterDate.toISOString().split('T')[0],
        start_jurisdiction: disc.jurisdiction,
        end_jurisdiction: disc.jurisdiction,
        total_miles: 0, // Zero miles since this is just to account for fuel purchases
        gallons: disc.discrepancy,
        fuel_cost: 0, // Can be updated later if needed
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_fuel_only: true, // Add a flag to mark this as a special fuel-only trip
        notes: `Auto-generated to account for ${disc.discrepancy.toFixed(3)} gallons of fuel purchased in ${disc.stateName} (${disc.jurisdiction}) but not associated with trips.`
      };
      
      try {
        const { data, error } = await supabase
          .from('ifta_trip_records')
          .insert([tripData])
          .select();
          
        if (error) throw error;
        
        if (data && data.length > 0) {
          createdTrips.push(data[0]);
        }
      } catch (err) {
        console.error(`Error creating fuel-only trip for ${disc.jurisdiction}:`, err);
        errors.push({
          jurisdiction: disc.jurisdiction,
          error: err.message
        });
      }
    }
    
    return {
      createdTrips,
      errors
    };
  } catch (error) {
    console.error('Error creating missing fuel-only trips:', error);
    throw error;
  }
}

/**
 * Get IFTA summary report data
 * @param {string} userId - User ID
 * @param {string} quarter - Quarter in format "YYYY-QN" (e.g., "2023-Q1")
 * @returns {Promise<Object>} - IFTA summary report data
 */
export async function getIFTASummary(userId, quarter) {
  try {
    if (!userId) {
      throw new Error("User ID is required");
    }
    
    if (!quarter) {
      throw new Error("Quarter is required");
    }
    
    console.log(`Getting IFTA summary for user ${userId}, quarter ${quarter}`);
    
    // Run the sync to get all the data we need
    let syncResult;
    try {
      syncResult = await syncFuelDataWithIFTA(userId, quarter);
      
      // Check if syncResult contains an error
      if (syncResult.error) {
        console.error("Error in sync result:", syncResult.errorMessage);
        throw new Error(syncResult.errorMessage);
      }
    } catch (syncError) {
      console.error("Error in syncFuelDataWithIFTA:", syncError);
      throw new Error(`Failed to sync IFTA data: ${syncError.message}`);
    }
    
    // Get all trips for the quarter
    let trips;
    try {
      const { data, error } = await supabase
        .from('ifta_trip_records')
        .select('*')
        .eq('user_id', userId)
        .eq('quarter', quarter);
        
      if (error) {
        console.error("Supabase error fetching trips for summary:", error);
        throw error;
      }
      
      trips = data || [];
      console.log(`Found ${trips.length} trips for IFTA summary`);
    } catch (tripError) {
      console.error("Error fetching trips for summary:", tripError);
      throw new Error(`Failed to fetch trips: ${tripError.message}`);
    }
    
    // Calculate miles by jurisdiction
    const milesByJurisdiction = {};
    
    (trips || []).forEach(trip => {
      // Handle same jurisdiction trips
      if (trip.start_jurisdiction === trip.end_jurisdiction && trip.start_jurisdiction) {
        if (!milesByJurisdiction[trip.start_jurisdiction]) {
          milesByJurisdiction[trip.start_jurisdiction] = 0;
        }
        milesByJurisdiction[trip.start_jurisdiction] += parseFloat(trip.total_miles) || 0;
      }
      // Handle multi-jurisdiction trips - split miles
      else if (trip.start_jurisdiction && trip.end_jurisdiction) {
        if (!milesByJurisdiction[trip.start_jurisdiction]) {
          milesByJurisdiction[trip.start_jurisdiction] = 0;
        }
        if (!milesByJurisdiction[trip.end_jurisdiction]) {
          milesByJurisdiction[trip.end_jurisdiction] = 0;
        }
        
        const milesPerJurisdiction = (parseFloat(trip.total_miles) || 0) / 2;
        milesByJurisdiction[trip.start_jurisdiction] += milesPerJurisdiction;
        milesByJurisdiction[trip.end_jurisdiction] += milesPerJurisdiction;
      }
    });
    
    // Calculate total miles
    const totalMiles = Object.values(milesByJurisdiction).reduce((sum, miles) => sum + miles, 0);
    
    // Get total gallons
    const totalGallons = syncResult.fuelData.reduce((sum, state) => sum + state.gallons, 0);
    
    // Calculate average MPG
    const avgMpg = totalMiles > 0 && totalGallons > 0 ? totalMiles / totalGallons : 0;
    
    // Build jurisdiction summary
    const jurisdictionSummary = [];
    
    // Combine all jurisdictions from both miles and fuel
    const allJurisdictions = new Set([
      ...Object.keys(milesByJurisdiction),
      ...syncResult.fuelData.map(state => state.jurisdiction)
    ]);
    
    allJurisdictions.forEach(jurisdiction => {
      const miles = milesByJurisdiction[jurisdiction] || 0;
      const fuelPurchased = (syncResult.fuelByState[jurisdiction]?.gallonsFromPurchases || 0);
      
      // Calculate taxable gallons based on miles and average MPG
      const taxableGallons = avgMpg > 0 ? miles / avgMpg : 0;
      
      // Calculate net taxable gallons
      const netTaxableGallons = taxableGallons - fuelPurchased;
      
      jurisdictionSummary.push({
        jurisdiction,
        stateName: syncResult.fuelData.find(s => s.jurisdiction === jurisdiction)?.stateName || jurisdiction,
        miles,
        taxableGallons,
        fuelPurchased,
        netTaxableGallons
      });
    });
    
    // Sort by jurisdiction
    jurisdictionSummary.sort((a, b) => a.jurisdiction.localeCompare(b.jurisdiction));
    
    return {
      quarter,
      totalMiles,
      totalGallons,
      avgMpg,
      jurisdictionSummary,
      hasDiscrepancies: syncResult.hasDiscrepancies,
      discrepancies: syncResult.discrepancies
    };
  } catch (error) {
    console.error('Error generating IFTA summary:', error);
    
    // Enhanced error handling with default response
    return {
      error: true,
      errorMessage: error.message || "Failed to generate IFTA summary",
      quarter,
      totalMiles: 0,
      totalGallons: 0,
      avgMpg: 0,
      jurisdictionSummary: [],
      hasDiscrepancies: false,
      discrepancies: []
    };
  }
}

/**
 * Save an IFTA report
 * @param {string} userId - User ID
 * @param {Object} reportData - Report data to save
 * @returns {Promise<Object>} - Saved report
 */
export async function saveIFTAReport(userId, reportData) {
  try {
    const quarter = reportData.quarter;
    
    if (!userId || !quarter) {
      throw new Error("User ID and quarter are required");
    }
    
    // Check if a report already exists for this quarter
    const { data: existingReports, error: checkError } = await supabase
      .from('ifta_reports')
      .select('id')
      .eq('user_id', userId)
      .eq('quarter', quarter);
      
    if (checkError) throw checkError;
    
    // Format the data for saving
    const dataToSave = {
      user_id: userId,
      quarter: quarter,
      year: parseInt(quarter.split('-Q')[0]),
      total_miles: reportData.totalMiles || 0,
      total_gallons: reportData.totalGallons || 0,
      total_tax: reportData.totalTax || 0,
      status: reportData.status || 'draft',
      submitted_at: reportData.submitted_at || null,
      jurisdiction_data: reportData.jurisdictionSummary || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    let result;
    
    if (existingReports && existingReports.length > 0) {
      // Update existing report
      const { data, error } = await supabase
        .from('ifta_reports')
        .update({
          ...dataToSave,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingReports[0].id)
        .select();
        
      if (error) throw error;
      result = data?.[0];
    } else {
      // Create new report
      const { data, error } = await supabase
        .from('ifta_reports')
        .insert([dataToSave])
        .select();
        
      if (error) throw error;
      result = data?.[0];
    }
    
    return result;
  } catch (error) {
    console.error('Error saving IFTA report:', error);
    throw error;
  }
}