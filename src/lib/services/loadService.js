import { supabase } from "@/lib/supabaseClient";

/**
 * Fetch all loads for the current user with optional filters
 * @param {Object} filters - Filters to apply to the query
 * @returns {Promise<{data, error}>} - Supabase query result
 */
export async function fetchLoads(filters = {}) {
  let query = supabase
    .from('loads')
    .select('*, drivers(name)');

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
    const [field, direction] = filters.sortBy.split(':');
    query = query.order(field, { ascending: direction === 'asc' });
  } else {
    // Default sort by pickup date ascending
    query = query.order('pickup_date', { ascending: true });
  }

  return await query;
}

/**
 * Get a single load by ID
 * @param {string} id - Load ID
 * @returns {Promise<{data, error}>} - Supabase query result
 */
export async function getLoadById(id) {
  return await supabase
    .from('loads')
    .select('*, drivers(id, name)')
    .eq('id', id)
    .single();
}

/**
 * Create a new load
 * @param {Object} loadData - Load data
 * @returns {Promise<{data, error}>} - Supabase query result
 */
export async function createLoad(loadData) {
  return await supabase
    .from('loads')
    .insert([loadData])
    .select()
    .single();
}

/**
 * Update an existing load
 * @param {string} id - Load ID
 * @param {Object} loadData - Updated load data
 * @returns {Promise<{data, error}>} - Supabase query result
 */
export async function updateLoad(id, loadData) {
  return await supabase
    .from('loads')
    .update(loadData)
    .eq('id', id)
    .select()
    .single();
}

/**
 * Delete a load
 * @param {string} id - Load ID
 * @returns {Promise<{data, error}>} - Supabase query result
 */
export async function deleteLoad(id) {
  return await supabase
    .from('loads')
    .delete()
    .eq('id', id);
}

/**
 * Assign a driver to a load
 * @param {string} loadId - Load ID
 * @param {string} driverId - Driver ID
 * @returns {Promise<{data, error}>} - Supabase query result
 */
export async function assignDriver(loadId, driverId) {
  return await supabase
    .from('loads')
    .update({ 
      driver_id: driverId,
      status: 'Assigned'
    })
    .eq('id', loadId)
    .select()
    .single();
}

/**
 * Update load status
 * @param {string} loadId - Load ID
 * @param {string} status - New status
 * @returns {Promise<{data, error}>} - Supabase query result
 */
export async function updateLoadStatus(loadId, status) {
  return await supabase
    .from('loads')
    .update({ status })
    .eq('id', loadId)
    .select()
    .single();
}

/**
 * Fetch all drivers for the current user
 * @returns {Promise<{data, error}>} - Supabase query result
 */
export async function fetchDrivers() {
  return await supabase
    .from('drivers')
    .select('*')
    .order('name');
}

/**
 * Create a new driver
 * @param {Object} driverData - Driver data
 * @returns {Promise<{data, error}>} - Supabase query result
 */
export async function createDriver(driverData) {
  return await supabase
    .from('drivers')
    .insert([driverData])
    .select()
    .single();
}

/**
 * Update an existing driver
 * @param {string} id - Driver ID
 * @param {Object} driverData - Updated driver data
 * @returns {Promise<{data, error}>} - Supabase query result
 */
export async function updateDriver(id, driverData) {
  return await supabase
    .from('drivers')
    .update(driverData)
    .eq('id', id)
    .select()
    .single();
}

/**
 * Delete a driver
 * @param {string} id - Driver ID
 * @returns {Promise<{data, error}>} - Supabase query result
 */
export async function deleteDriver(id) {
  return await supabase
    .from('drivers')
    .delete()
    .eq('id', id);
}

/**
 * Get dashboard statistics for loads
 * @returns {Promise<Object>} - Load statistics
 */
export async function getLoadStats() {
  try {
    const [
      { data: allLoads, error: allLoadsError },
      { data: pendingLoads, error: pendingLoadsError },
      { data: inTransitLoads, error: inTransitLoadsError },
      { data: completedLoads, error: completedLoadsError }
    ] = await Promise.all([
      supabase.from('loads').select('id'),
      supabase.from('loads').select('id').eq('status', 'Pending'),
      supabase.from('loads').select('id').eq('status', 'In Transit'),
      supabase.from('loads').select('id').eq('status', 'Completed')
    ]);

    if (allLoadsError || pendingLoadsError || inTransitLoadsError || completedLoadsError) {
      throw new Error('Error fetching load statistics');
    }

    return {
      total: allLoads.length,
      pending: pendingLoads.length,
      inTransit: inTransitLoads.length,
      completed: completedLoads.length
    };
  } catch (error) {
    console.error('Error in getLoadStats:', error);
    return {
      total: 0,
      pending: 0,
      inTransit: 0,
      completed: 0
    };
  }
}