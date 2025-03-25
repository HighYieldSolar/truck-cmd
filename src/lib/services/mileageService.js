// src/lib/services/mileageService.js
import { supabase } from "../supabaseClient";

/**
 * Fetch all active mileage trips for the current user
 * @param {string} userId - The authenticated user's ID
 * @returns {Promise<Array>} - Array of active trip objects
 */
export async function fetchActiveTrips(userId) {
  try {
    const { data, error } = await supabase
      .from('driver_mileage_trips')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error fetching active trips:', error);
    throw error;
  }
}

/**
 * Fetch all state crossings for a trip
 * @param {string} tripId - Trip ID
 * @returns {Promise<Array>} - Array of state crossing objects
 */
export async function fetchTripCrossings(tripId) {
  try {
    const { data, error } = await supabase
      .from('driver_mileage_crossings')
      .select('*')
      .eq('trip_id', tripId)
      .order('timestamp', { ascending: true });
      
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error fetching trip crossings:', error);
    throw error;
  }
}

/**
 * Create a new mileage trip
 * @param {object} tripData - Trip data
 * @returns {Promise<object>} - Created trip object
 */
export async function createTrip(tripData) {
  try {
    const { data, error } = await supabase
      .from('driver_mileage_trips')
      .insert([tripData])
      .select();
      
    if (error) throw error;
    
    if (!data || data.length === 0) {
      throw new Error('Failed to create trip.');
    }
    
    return data[0];
  } catch (error) {
    console.error('Error creating trip:', error);
    throw error;
  }
}

/**
 * Add a state crossing to a trip
 * @param {object} crossingData - Crossing data
 * @returns {Promise<object>} - Created crossing object
 */
export async function addStateCrossing(crossingData) {
  try {
    const { data, error } = await supabase
      .from('driver_mileage_crossings')
      .insert([crossingData])
      .select();
      
    if (error) throw error;
    
    if (!data || data.length === 0) {
      throw new Error('Failed to add state crossing.');
    }
    
    return data[0];
  } catch (error) {
    console.error('Error adding state crossing:', error);
    throw error;
  }
}

/**
 * Delete a state crossing
 * @param {string} crossingId - Crossing ID
 * @returns {Promise<boolean>} - Success status
 */
export async function deleteStateCrossing(crossingId) {
  try {
    const { error } = await supabase
      .from('driver_mileage_crossings')
      .delete()
      .eq('id', crossingId);
      
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error deleting state crossing:', error);
    throw error;
  }
}

/**
 * Complete a trip
 * @param {string} tripId - Trip ID
 * @returns {Promise<boolean>} - Success status
 */
export async function completeTrip(tripId) {
  try {
    const { error } = await supabase
      .from('driver_mileage_trips')
      .update({
        status: 'completed',
        end_date: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString()
      })
      .eq('id', tripId);
      
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error completing trip:', error);
    throw error;
  }
}

/**
 * Delete a mileage trip and its associated crossings
 * @param {string} tripId - Trip ID
 * @param {string} userId - User ID (for security verification)
 * @returns {Promise<boolean>} - Success status
 */
export async function deleteTrip(tripId, userId) {
  try {
    // Security check - make sure the trip belongs to this user
    const { data: tripData, error: tripError } = await supabase
      .from('driver_mileage_trips')
      .select('id')
      .eq('id', tripId)
      .eq('user_id', userId)
      .single();
      
    if (tripError || !tripData) {
      throw new Error('Trip not found or you do not have permission to delete it');
    }
    
    // Delete all associated crossings first (handle the foreign key constraint)
    const { error: crossingDeleteError } = await supabase
      .from('driver_mileage_crossings')
      .delete()
      .eq('trip_id', tripId);
      
    if (crossingDeleteError) throw crossingDeleteError;
    
    // Finally, delete the trip
    const { error: tripDeleteError } = await supabase
      .from('driver_mileage_trips')
      .delete()
      .eq('id', tripId)
      .eq('user_id', userId); // Extra security to ensure only the owner can delete
      
    if (tripDeleteError) throw tripDeleteError;
    
    return true;
  } catch (error) {
    console.error('Error deleting trip:', error);
    throw error;
  }
}

/**
 * Calculate mileage by state for a trip
 * @param {Array} crossings - Array of state crossings
 * @returns {Array} - Array of state mileage objects
 */
export function calculateStateMileage(crossings) {
  if (!crossings || crossings.length < 2) {
    return [];
  }
  
  const stateMileage = [];
  
  for (let i = 0; i < crossings.length - 1; i++) {
    const currentState = crossings[i].state;
    const currentOdometer = crossings[i].odometer;
    const nextOdometer = crossings[i + 1].odometer;
    const milesDriven = nextOdometer - currentOdometer;
    
    // Add or update state mileage
    const existingEntry = stateMileage.find(entry => entry.state === currentState);
    if (existingEntry) {
      existingEntry.miles += milesDriven;
    } else {
      stateMileage.push({
        state: currentState,
        state_name: crossings[i].state_name,
        miles: milesDriven
      });
    }
  }
  
  // Sort by miles (highest first)
  return stateMileage.sort((a, b) => b.miles - a.miles);
}

/**
 * Generate IFTA report for a trip
 * @param {string} tripId - Trip ID
 * @returns {Promise<object>} - IFTA report data
 */
export async function generateIFTAReport(tripId) {
  try {
    // First, get the trip details
    const { data: tripData, error: tripError } = await supabase
      .from('driver_mileage_trips')
      .select('*')
      .eq('id', tripId)
      .single();
      
    if (tripError) throw tripError;
    
    if (!tripData) {
      throw new Error('Trip not found.');
    }
    
    // Get all crossings for this trip
    const crossings = await fetchTripCrossings(tripId);
    
    // Calculate state mileage
    const stateMileage = calculateStateMileage(crossings);
    
    // Format the report
    const report = {
      trip: tripData,
      state_mileage: stateMileage,
      total_miles: stateMileage.reduce((total, state) => total + state.miles, 0),
      trip_start: crossings.length > 0 ? crossings[0].timestamp : null,
      trip_end: crossings.length > 0 ? crossings[crossings.length - 1].timestamp : null,
      generated_at: new Date().toISOString()
    };
    
    return report;
  } catch (error) {
    console.error('Error generating IFTA report:', error);
    throw error;
  }
}

/**
 * Export trip data as CSV
 * @param {string} tripId - Trip ID
 * @returns {Promise<string>} - CSV data
 */
export async function exportTripDataAsCSV(tripId) {
  try {
    // Get trip details
    const { data: tripData, error: tripError } = await supabase
      .from('driver_mileage_trips')
      .select('*')
      .eq('id', tripId)
      .single();
      
    if (tripError) throw tripError;
    
    // Get state crossings
    const crossings = await fetchTripCrossings(tripId);
    
    // Calculate state mileage
    const stateMileage = calculateStateMileage(crossings);
    
    // Create CSV rows
    const rows = [
      // Header row
      ['State', 'State Name', 'Miles'].join(','),
      // Data rows
      ...stateMileage.map(state => [
        state.state,
        state.state_name,
        state.miles.toFixed(1)
      ].join(','))
    ];
    
    // Add total row
    rows.push([
      'TOTAL',
      '',
      stateMileage.reduce((total, state) => total + state.miles, 0).toFixed(1)
    ].join(','));
    
    return rows.join('\n');
  } catch (error) {
    console.error('Error exporting trip data:', error);
    throw error;
  }
}