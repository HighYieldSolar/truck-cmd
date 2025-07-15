// src/lib/services/fuelService.js
import { supabase, formatError } from "../supabaseClient";
import { formatDateLocal, getQuarterDateRange } from "../utils/dateUtils";

/**
 * Fetch all fuel entries for the current user with optional filters
 * @param {string} userId - The authenticated user's ID
 * @param {Object} filters - Filters to apply to the query
 * @returns {Promise<Array>} - Array of fuel entry objects
 */
export async function fetchFuelEntries(userId, filters = {}) {
  try {
    if (!userId) {
      throw new Error("User ID is required");
    }
    
    let query = supabase
      .from('fuel_entries')
      .select('*')
      .eq('user_id', userId);

    // Apply IFTA filter to only include Diesel and Gasoline
    if (filters.iftaOnly) {
      query = query.in('fuel_type', ['Diesel', 'Gasoline']);
    }

    // Apply filters if provided
    if (filters.state && filters.state !== '') {
      query = query.eq('state', filters.state);
    }

    if (filters.search) {
      query = query.or(`location.ilike.%${filters.search}%,vehicle_id.ilike.%${filters.search}%`);
    }

    // Date range filters
    if (filters.dateRange === 'This Quarter') {
      const now = new Date();
      const quarter = Math.ceil((now.getMonth() + 1) / 3);
      const quarterString = `${now.getFullYear()}-Q${quarter}`;
      const { startDate, endDate } = getQuarterDateRange(quarterString);
      
      query = query
        .gte('date', startDate)
        .lte('date', endDate);
    } else if (filters.dateRange === 'Last Quarter') {
      const now = new Date();
      let quarter = Math.ceil((now.getMonth() + 1) / 3) - 1;
      let year = now.getFullYear();
      
      if (quarter < 1) {
        quarter = 4;
        year -= 1;
      }
      
      const quarterString = `${year}-Q${quarter}`;
      const { startDate, endDate } = getQuarterDateRange(quarterString);
      
      query = query
        .gte('date', startDate)
        .lte('date', endDate);
    } else if (filters.dateRange === 'Custom' && filters.startDate && filters.endDate) {
      query = query
        .gte('date', filters.startDate)
        .lte('date', filters.endDate);
    }

    // Apply vehicle filter
    if (filters.vehicleId && filters.vehicleId !== '') {
      query = query.eq('vehicle_id', filters.vehicleId);
    }

    // Apply sorting - default to newest first
    query = query.order('date', { ascending: false });

    const { data, error } = await query;
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error fetching fuel entries:', error);
    throw error;
  }
}

/**
 * Get a fuel entry by ID
 * @param {string} id - Fuel entry ID
 * @returns {Promise<Object|null>} - Fuel entry object or null
 */
export async function getFuelEntryById(id) {
  try {
    const { data, error } = await supabase
      .from('fuel_entries')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error fetching fuel entry:', error);
    return null;
  }
}

/**
 * Create a new fuel entry
 * @param {Object} fuelEntryData - Fuel entry data
 * @returns {Promise<Object|null>} - Created fuel entry or null
 */
export async function createFuelEntry(fuelEntryData) {
  try {
    if (!fuelEntryData.user_id) {
      throw new Error("User ID is required");
    }
    
    console.log("Creating fuel entry with data:", fuelEntryData);
    
    // Create the entry
    const { data, error } = await supabase
      .from('fuel_entries')
      .insert([fuelEntryData])
      .select();
      
    if (error) {
      console.error("Error in createFuelEntry:", error);
      throw error;
    }
    
    console.log("Data from database:", data);
    if (!data || data.length === 0) {
      throw new Error("No data returned from fuel entry creation");
    }
    
    console.log("Fuel entry created successfully:", data[0]);
    return data[0];
  } catch (error) {
    console.error('Error creating fuel entry:', error);
    throw error;
  }
}

/**
 * Update an existing fuel entry
 * @param {string} id - Fuel entry ID
 * @param {Object} fuelEntryData - Updated fuel entry data
 * @returns {Promise<Object|null>} - Updated fuel entry or null
 */
export async function updateFuelEntry(id, fuelEntryData) {
  try {
    const { data, error } = await supabase
      .from('fuel_entries')
      .update(fuelEntryData)
      .eq('id', id)
      .select();
      
    if (error) throw error;
    
    return data?.[0] || null;
  } catch (error) {
    console.error('Error updating fuel entry:', error);
    throw error;
  }
}

/**
 * Delete a fuel entry
 * @param {string} id - Fuel entry ID
 * @returns {Promise<boolean>} - Success status
 */
export async function deleteFuelEntry(id) {
  try {
    const { error } = await supabase
      .from('fuel_entries')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error deleting fuel entry:', error);
    throw error;
  }
}

/**
 * Get fuel statistics
 * @param {string} userId - The authenticated user's ID
 * @param {string} period - Time period ('quarter', 'month', 'year', 'all')
 * @returns {Promise<Object>} - Fuel statistics
 */
export async function getFuelStats(userId, period = 'quarter') {
  try {
    if (!userId) return defaultStats();
    
    let query = supabase
      .from('fuel_entries')
      .select('gallons, price_per_gallon, total_amount, state, date')
      .eq('user_id', userId);
    
    // Apply time period filter
    const now = new Date();
    
    if (period === 'quarter') {
      const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
      const quarterEnd = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 + 3, 0);
      
      query = query
        .gte('date', quarterStart.toISOString().split('T')[0])
        .lte('date', quarterEnd.toISOString().split('T')[0]);
    } else if (period === 'month') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      query = query
        .gte('date', monthStart.toISOString().split('T')[0])
        .lte('date', monthEnd.toISOString().split('T')[0]);
    } else if (period === 'lastMonth') {
      const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
      const lastMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
      const lastMonthStart = new Date(lastMonthYear, lastMonth, 1);
      const lastMonthEnd = new Date(lastMonthYear, lastMonth + 1, 0);
      
      query = query
        .gte('date', lastMonthStart.toISOString().split('T')[0])
        .lte('date', lastMonthEnd.toISOString().split('T')[0]);
    } else if (period === 'year') {
      const yearStart = new Date(now.getFullYear(), 0, 1);
      const yearEnd = new Date(now.getFullYear(), 11, 31);
      
      query = query
        .gte('date', yearStart.toISOString().split('T')[0])
        .lte('date', yearEnd.toISOString().split('T')[0]);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Calculate statistics
    const fuelData = data || [];
    
    const totalGallons = fuelData.reduce((sum, entry) => sum + (Math.round(parseFloat(entry.gallons) || 0)), 0);
    const totalAmount = fuelData.reduce((sum, entry) => sum + (parseFloat(entry.total_amount) || 0), 0);
    const avgPricePerGallon = totalGallons > 0 ? totalAmount / totalGallons : 0;
    
    // Count unique states
    const states = fuelData.reduce((stateMap, entry) => {
      if (!stateMap[entry.state]) {
        stateMap[entry.state] = {
          gallons: 0,
          amount: 0,
          purchases: 0
        };
      }
      
      stateMap[entry.state].gallons += Math.round(parseFloat(entry.gallons) || 0);
      stateMap[entry.state].amount += parseFloat(entry.total_amount) || 0;
      stateMap[entry.state].purchases += 1;
      
      return stateMap;
    }, {});
    
    return {
      totalGallons,
      totalAmount,
      avgPricePerGallon,
      uniqueStates: Object.keys(states).length,
      entryCount: fuelData.length,
      byState: states
    };
  } catch (error) {
    console.error('Error getting fuel statistics:', error);
    return defaultStats();
  }
}

/**
 * Default stats object for error cases
 */
function defaultStats() {
  return {
    totalGallons: 0,
    totalAmount: 0,
    avgPricePerGallon: 0,
    uniqueStates: 0,
    entryCount: 0,
    byState: {}
  };
}

/**
 * Upload receipt image to Supabase storage
 * @param {string} userId - User ID
 * @param {File} file - Receipt image file
 * @returns {Promise<string|null>} - Public URL of the uploaded image or null
 */
export async function uploadReceiptImage(userId, file) {
  try {
    // Create a unique file path
    const filePath = `${userId}/fuel_receipts/${Date.now()}_${file.name}`;
    
    // Log for debugging
    console.log("Uploading file to:", filePath);
    
    // Upload the file
    const { data, error } = await supabase.storage
      .from('receipts')  // Make sure this bucket exists in your Supabase project
      .upload(filePath, file);
      
    if (error) {
      console.error("Supabase upload error:", error);
      throw error;
    }
    
     // Get the public URL
    const { data: publicUrlData } = supabase.storage
      .from('receipts')
      .getPublicUrl(filePath);
    const publicUrl = data?.publicUrl;
    
    console.log("File uploaded, public URL:", publicUrl);
    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('Error uploading receipt:', error);
    return null;
  }
}

/**
 * Get vehicles with fuel records
 * @param {string} userId - The authenticated user's ID
 * @returns {Promise<Array>} - Array of vehicle IDs
 */
export async function getVehiclesWithFuelRecords(userId) {
  try {
    if (!userId) return [];
    
    const { data, error } = await supabase
      .from('fuel_entries')
      .select('vehicle_id')
      .eq('user_id', userId)
      .order('vehicle_id', { ascending: true });
    
    if (error) throw error;
    
    // Get unique vehicle IDs
    const vehicles = [...new Set(data.map(entry => entry.vehicle_id))];
    
    return vehicles;
  } catch (error) {
    console.error('Error getting vehicles with fuel records:', error);
    return [];
  }
}

/**
 * Export fuel data for IFTA reporting
 * @param {string} userId - User ID
 * @param {Object} filters - Filters to apply
 * @returns {Promise<Array>} - Array of formatted fuel data for IFTA
 */
export async function exportFuelDataForIFTA(userId, filters = {}) {
  try {
    // Get fuel entries with the specified filters
    const fuelEntries = await fetchFuelEntries(userId, filters);
    
    // Group by state
    const byState = fuelEntries.reduce((acc, entry) => {
      if (!acc[entry.state]) {
        acc[entry.state] = {
          state: entry.state,
          state_name: entry.state_name,
          gallons: 0,
          amount: 0,
          purchases: 0
        };
      }
      
      acc[entry.state].gallons += Math.round(parseFloat(entry.gallons) || 0);
      acc[entry.state].amount += parseFloat(entry.total_amount) || 0;
      acc[entry.state].purchases += 1;
      
      return acc;
    }, {});
    
    // Convert to array and calculate average price per gallon
    const iftaData = Object.values(byState).map(state => ({
      ...state,
      average_price: state.gallons > 0 ? (state.amount / state.gallons) : 0
    }));
    
    return iftaData;
  } catch (error) {
    console.error('Error exporting IFTA data:', error);
    throw error;
  }
}

/**
 * Get all US states for the filter dropdown
 * @returns {Array} Array of state objects with code and name
 */
export function getUSStates() {
  return [
    { code: "AL", name: "Alabama" },
    { code: "AK", name: "Alaska" },
    { code: "AZ", name: "Arizona" },
    { code: "AR", name: "Arkansas" },
    { code: "CA", name: "California" },
    { code: "CO", name: "Colorado" },
    { code: "CT", name: "Connecticut" },
    { code: "DE", name: "Delaware" },
    { code: "FL", name: "Florida" },
    { code: "GA", name: "Georgia" },
    { code: "HI", name: "Hawaii" },
    { code: "ID", name: "Idaho" },
    { code: "IL", name: "Illinois" },
    { code: "IN", name: "Indiana" },
    { code: "IA", name: "Iowa" },
    { code: "KS", name: "Kansas" },
    { code: "KY", name: "Kentucky" },
    { code: "LA", name: "Louisiana" },
    { code: "ME", name: "Maine" },
    { code: "MD", name: "Maryland" },
    { code: "MA", name: "Massachusetts" },
    { code: "MI", name: "Michigan" },
    { code: "MN", name: "Minnesota" },
    { code: "MS", name: "Mississippi" },
    { code: "MO", name: "Missouri" },
    { code: "MT", name: "Montana" },
    { code: "NE", name: "Nebraska" },
    { code: "NV", name: "Nevada" },
    { code: "NH", name: "New Hampshire" },
    { code: "NJ", name: "New Jersey" },
    { code: "NM", name: "New Mexico" },
    { code: "NY", name: "New York" },
    { code: "NC", name: "North Carolina" },
    { code: "ND", name: "North Dakota" },
    { code: "OH", name: "Ohio" },
    { code: "OK", name: "Oklahoma" },
    { code: "OR", name: "Oregon" },
    { code: "PA", name: "Pennsylvania" },
    { code: "RI", name: "Rhode Island" },
    { code: "SC", name: "South Carolina" },
    { code: "SD", name: "South Dakota" },
    { code: "TN", name: "Tennessee" },
    { code: "TX", name: "Texas" },
    { code: "UT", name: "Utah" },
    { code: "VT", name: "Vermont" },
    { code: "VA", name: "Virginia" },
    { code: "WA", name: "Washington" },
    { code: "WV", name: "West Virginia" },
    { code: "WI", name: "Wisconsin" },
    { code: "WY", name: "Wyoming" }
  ];
}