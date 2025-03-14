// src/lib/services/truckService.js
import { supabase } from "../supabaseClient";

/**
 * Fetch all trucks for the current user
 * @param {string} userId - The authenticated user's ID
 * @param {Object} filters - Optional filters
 * @returns {Promise<Array>} - Array of truck objects
 */
export async function fetchTrucks(userId, filters = {}) {
  try {
    let query = supabase
      .from('trucks')
      .select('*')
      .eq('user_id', userId);
    
    // Apply filters if provided
    if (filters.status && filters.status !== 'All') {
      query = query.eq('status', filters.status);
    }
    
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,make.ilike.%${filters.search}%,model.ilike.%${filters.search}%,vin.ilike.%${filters.search}%`);
    }
    
    if (filters.sortBy) {
      const order = filters.sortDirection === 'desc' ? { ascending: false } : { ascending: true };
      query = query.order(filters.sortBy, order);
    } else {
      // Default sort by name
      query = query.order('name', { ascending: true });
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error fetching trucks:', error);
    throw error;
  }
}

/**
 * Get truck by ID
 * @param {string} id - Truck ID
 * @returns {Promise<Object|null>} - Truck object or null
 */
export async function getTruckById(id) {
  try {
    const { data, error } = await supabase
      .from('trucks')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error fetching truck:', error);
    return null;
  }
}

/**
 * Create a new truck
 * @param {Object} truckData - Truck data
 * @returns {Promise<Object|null>} - Created truck or null
 */
export async function createTruck(truckData) {
  try {
    // Generate a UUID for vehicle_id
    const uuid = crypto.randomUUID ? crypto.randomUUID() : 
      ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
      );
    
    // Add vehicle_id to the truck data
    const truckWithVehicleId = {
      ...truckData,
      vehicle_id: uuid
    };
    
    const { data, error } = await supabase
      .from('trucks')
      .insert([truckWithVehicleId])
      .select();
      
    if (error) throw error;
    
    return data?.[0] || null;
  } catch (error) {
    console.error('Error creating truck:', error);
    throw error;
  }
}

/**
 * Update an existing truck
 * @param {string} id - Truck ID
 * @param {Object} truckData - Updated truck data
 * @returns {Promise<Object|null>} - Updated truck or null
 */
export async function updateTruck(id, truckData) {
  try {
    const { data, error } = await supabase
      .from('trucks')
      .update(truckData)
      .eq('id', id)
      .select();
      
    if (error) throw error;
    
    return data?.[0] || null;
  } catch (error) {
    console.error('Error updating truck:', error);
    throw error;
  }
}

/**
 * Delete a truck
 * @param {string} id - Truck ID
 * @returns {Promise<boolean>} - Success status
 */
export async function deleteTruck(id) {
  try {
    const { error } = await supabase
      .from('trucks')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error deleting truck:', error);
    throw error;
  }
}

/**
 * Upload truck image to Supabase storage
 * @param {string} userId - User ID
 * @param {File} file - Image file
 * @returns {Promise<string|null>} - Public URL of the uploaded image or null
 */
export async function uploadTruckImage(userId, file) {
  try {
    // Create a unique file path
    const filePath = `${userId}/trucks/${Date.now()}_${file.name}`;
    
    // Upload the file
    const { data, error } = await supabase.storage
      .from('vehicles')
      .upload(filePath, file);
      
    if (error) throw error;
    
    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('vehicles')
      .getPublicUrl(filePath);
      
    return publicUrl;
  } catch (error) {
    console.error('Error uploading truck image:', error);
    return null;
  }
}

/**
 * Get truck statistics
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Truck statistics
 */
export async function getTruckStats(userId) {
  try {
    const { data, error } = await supabase
      .from('trucks')
      .select('id, status')
      .eq('user_id', userId);
      
    if (error) throw error;
    
    // Calculate stats
    const total = data?.length || 0;
    const active = data?.filter(t => t.status === 'Active').length || 0;
    const maintenance = data?.filter(t => t.status === 'In Maintenance').length || 0;
    const outOfService = data?.filter(t => t.status === 'Out of Service').length || 0;
    
    return {
      total,
      active,
      maintenance,
      outOfService
    };
  } catch (error) {
    console.error('Error getting truck stats:', error);
    return {
      total: 0,
      active: 0,
      maintenance: 0,
      outOfService: 0
    };
  }
}