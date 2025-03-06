// src/lib/services/loadService.js
import { supabase } from "../supabaseClient";

/**
 * Fetch all loads for the current user with optional filters
 * @param {string} userId - The authenticated user's ID
 * @param {Object} filters - Filters to apply to the query
 * @returns {Promise<Array>} - Array of load objects
 */
export async function fetchLoads(userId, filters = {}) {
  try {
    let query = supabase
      .from('loads')
      .select('*')
      .eq('user_id', userId);

    // Apply filters if provided
    if (filters.status && filters.status !== 'All') {
      query = query.eq('status', filters.status);
    }

    if (filters.search) {
      query = query.or(`load_number.ilike.%${filters.search}%,customer.ilike.%${filters.search}%`);
    }

    if (filters.dateRange) {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      switch (filters.dateRange) {
        case 'today':
          query = query.eq('pickup_date', today.toISOString().split('T')[0]);
          break;
        case 'tomorrow':
          query = query.eq('pickup_date', tomorrow.toISOString().split('T')[0]);
          break;
        case 'thisWeek': {
          const endOfWeek = new Date(today);
          endOfWeek.setDate(today.getDate() + (7 - today.getDay()));
          query = query
            .gte('pickup_date', today.toISOString().split('T')[0])
            .lte('pickup_date', endOfWeek.toISOString().split('T')[0]);
          break;
        }
        case 'thisMonth': {
          const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
          query = query
            .gte('pickup_date', today.toISOString().split('T')[0])
            .lte('pickup_date', lastDay.toISOString().split('T')[0]);
          break;
        }
        // Add more date range filters as needed
      }
    }

    // Apply sorting
    if (filters.sortBy) {
      switch (filters.sortBy) {
        case 'pickupDate':
          query = query.order('pickup_date', { ascending: true });
          break;
        case 'deliveryDate':
          query = query.order('delivery_date', { ascending: true });
          break;
        case 'status':
          query = query.order('status', { ascending: true });
          break;
        case 'customer':
          query = query.order('customer', { ascending: true });
          break;
        case 'rate':
          query = query.order('rate', { ascending: false }); // High to Low
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }
    } else {
      // Default sort by creation date, newest first
      query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query;
    
    if (error) throw error;
    
    // Map database format to component-friendly format
    return (data || []).map(load => ({
      id: load.id,
      loadNumber: load.load_number,
      customer: load.customer,
      origin: load.origin,
      destination: load.destination,
      pickupDate: load.pickup_date,
      deliveryDate: load.delivery_date,
      status: load.status,
      driver: load.driver || "",
      rate: load.rate || 0,
      distance: load.distance || 0,
      description: load.description || "",
      notes: load.notes || ""
    }));
  } catch (error) {
    console.error('Error fetching loads:', error);
    return [];
  }
}

/**
 * Get a single load by ID
 * @param {string} id - Load ID
 * @returns {Promise<Object|null>} - Load object or null
 */
export async function getLoadById(id) {
  try {
    const { data, error } = await supabase
      .from('loads')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    
    if (!data) return null;
    
    return {
      id: data.id,
      loadNumber: data.load_number,
      customer: data.customer,
      origin: data.origin,
      destination: data.destination,
      pickupDate: data.pickup_date,
      deliveryDate: data.delivery_date,
      status: data.status,
      driver: data.driver || "",
      rate: data.rate || 0,
      distance: data.distance || 0,
      description: data.description || "",
      notes: data.notes || ""
    };
  } catch (error) {
    console.error('Error fetching load:', error);
    return null;
  }
}

/**
 * Create a new load
 * @param {string} userId - The authenticated user's ID
 * @param {Object} loadData - Load data object
 * @returns {Promise<Object|null>} - Created load object or null
 */
export async function createLoad(userId, loadData) {
  try {
    // Generate a load number if not provided
    const loadNumber = loadData.loadNumber || `L${Math.floor(10000 + Math.random() * 90000)}`;
    
    // Format the data for database
    const dbLoadData = {
      user_id: userId,
      load_number: loadNumber,
      customer: loadData.customer,
      origin: loadData.origin,
      destination: loadData.destination,
      pickup_date: loadData.pickupDate,
      delivery_date: loadData.deliveryDate,
      status: loadData.status || 'Pending',
      driver: loadData.driver || null,
      rate: loadData.rate || 0,
      distance: loadData.distance || 0,
      description: loadData.description || '',
      notes: loadData.notes || ''
    };
    
    const { data, error } = await supabase
      .from('loads')
      .insert([dbLoadData])
      .select();
      
    if (error) throw error;
    
    if (!data || data.length === 0) return null;
    
    // Return the created load in component-friendly format
    return {
      id: data[0].id,
      loadNumber: data[0].load_number,
      customer: data[0].customer,
      origin: data[0].origin,
      destination: data[0].destination,
      pickupDate: data[0].pickup_date,
      deliveryDate: data[0].delivery_date,
      status: data[0].status,
      driver: data[0].driver || "",
      rate: data[0].rate || 0,
      distance: data[0].distance || 0,
      description: data[0].description || "",
      notes: data[0].notes || ""
    };
  } catch (error) {
    console.error('Error creating load:', error);
    return null;
  }
}

/**
 * Update an existing load
 * @param {string} id - Load ID
 * @param {Object} loadData - Updated load data
 * @returns {Promise<Object|null>} - Updated load object or null
 */
export async function updateLoad(id, loadData) {
  try {
    // Format the data for database
    const dbLoadData = {
      customer: loadData.customer,
      origin: loadData.origin,
      destination: loadData.destination,
      pickup_date: loadData.pickupDate,
      delivery_date: loadData.deliveryDate,
      status: loadData.status,
      driver: loadData.driver || null,
      rate: loadData.rate || 0,
      distance: loadData.distance || 0,
      description: loadData.description || '',
      notes: loadData.notes || ''
    };
    
    const { data, error } = await supabase
      .from('loads')
      .update(dbLoadData)
      .eq('id', id)
      .select();
      
    if (error) throw error;
    
    if (!data || data.length === 0) return null;
    
    // Return the updated load in component-friendly format
    return {
      id: data[0].id,
      loadNumber: data[0].load_number,
      customer: data[0].customer,
      origin: data[0].origin,
      destination: data[0].destination,
      pickupDate: data[0].pickup_date,
      deliveryDate: data[0].delivery_date,
      status: data[0].status,
      driver: data[0].driver || "",
      rate: data[0].rate || 0,
      distance: data[0].distance || 0,
      description: data[0].description || "",
      notes: data[0].notes || ""
    };
  } catch (error) {
    console.error('Error updating load:', error);
    return null;
  }
}

/**
 * Delete a load
 * @param {string} id - Load ID
 * @returns {Promise<boolean>} - Success status
 */
export async function deleteLoad(id) {
  try {
    const { error } = await supabase
      .from('loads')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error deleting load:', error);
    return false;
  }
}

/**
 * Assign a driver to a load
 * @param {string} loadId - Load ID
 * @param {string} driverName - Driver name
 * @returns {Promise<Object|null>} - Updated load object or null
 */
export async function assignDriver(loadId, driverName) {
  try {
    const { data, error } = await supabase
      .from('loads')
      .update({
        driver: driverName,
        status: 'Assigned' // Update status if previously unassigned
      })
      .eq('id', loadId)
      .select();
      
    if (error) throw error;
    
    if (!data || data.length === 0) return null;
    
    // Return the updated load in component-friendly format
    return {
      id: data[0].id,
      loadNumber: data[0].load_number,
      customer: data[0].customer,
      origin: data[0].origin,
      destination: data[0].destination,
      pickupDate: data[0].pickup_date,
      deliveryDate: data[0].delivery_date,
      status: data[0].status,
      driver: data[0].driver || "",
      rate: data[0].rate || 0,
      distance: data[0].distance || 0,
      description: data[0].description || "",
      notes: data[0].notes || ""
    };
  } catch (error) {
    console.error('Error assigning driver:', error);
    return null;
  }
}

/**
 * Update load status
 * @param {string} loadId - Load ID
 * @param {string} status - New status
 * @returns {Promise<Object|null>} - Updated load object or null
 */
export async function updateLoadStatus(loadId, status) {
  try {
    const { data, error } = await supabase
      .from('loads')
      .update({ status })
      .eq('id', loadId)
      .select();
      
    if (error) throw error;
    
    if (!data || data.length === 0) return null;
    
    // Return the updated load in component-friendly format
    return {
      id: data[0].id,
      loadNumber: data[0].load_number,
      customer: data[0].customer,
      origin: data[0].origin,
      destination: data[0].destination,
      pickupDate: data[0].pickup_date,
      deliveryDate: data[0].delivery_date,
      status: data[0].status,
      driver: data[0].driver || "",
      rate: data[0].rate || 0,
      distance: data[0].distance || 0,
      description: data[0].description || "",
      notes: data[0].notes || ""
    };
  } catch (error) {
    console.error('Error updating load status:', error);
    return null;
  }
}

/**
 * Get load statistics for dashboard
 * @param {string} userId - The authenticated user's ID
 * @returns {Promise<Object>} - Load statistics
 */
export async function getLoadStats(userId) {
  try {
    // Run several queries in parallel to get statistics
    const [all, pending, assigned, inTransit, completed] = await Promise.all([
      supabase.from('loads').select('id').eq('user_id', userId),
      supabase.from('loads').select('id').eq('user_id', userId).eq('status', 'Pending'),
      supabase.from('loads').select('id').eq('user_id', userId).eq('status', 'Assigned'),
      supabase.from('loads').select('id').eq('user_id', userId).eq('status', 'In Transit'),
      supabase.from('loads').select('id').eq('user_id', userId).eq('status', 'Completed')
    ]);
    
    // Check for errors
    if (all.error || pending.error || assigned.error || inTransit.error || completed.error) {
      throw new Error('Error fetching load statistics');
    }
    
    return {
      total: (all.data || []).length,
      pending: (pending.data || []).length,
      assigned: (assigned.data || []).length,
      inTransit: (inTransit.data || []).length,
      completed: (completed.data || []).length
    };
  } catch (error) {
    console.error('Error getting load stats:', error);
    return {
      total: 0,
      pending: 0,
      assigned: 0, 
      inTransit: 0,
      completed: 0
    };
  }
}