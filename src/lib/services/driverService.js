// src/lib/services/driverService.js
import { supabase } from "../supabaseClient";

/**
 * Fetch all drivers for the current user
 * @param {string} userId - The authenticated user's ID
 * @param {Object} filters - Optional filters
 * @returns {Promise<Array>} - Array of driver objects
 */
export async function fetchDrivers(userId, filters = {}) {
  try {
    let query = supabase
      .from('drivers')
      .select('*')
      .eq('user_id', userId);
    
    // Apply filters if provided
    if (filters.status && filters.status !== 'All') {
      query = query.eq('status', filters.status);
    }
    
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,license_number.ilike.%${filters.search}%,phone.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
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
    console.error('Error fetching drivers:', error);
    throw error;
  }
}

/**
 * Get driver by ID
 * @param {string} id - Driver ID
 * @returns {Promise<Object|null>} - Driver object or null
 */
export async function getDriverById(id) {
  try {
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error fetching driver:', error);
    return null;
  }
}

/**
 * Create a new driver
 * @param {Object} driverData - Driver data
 * @returns {Promise<Object|null>} - Created driver or null
 */
export async function createDriver(driverData) {
  try {
    const { data, error } = await supabase
      .from('drivers')
      .insert([driverData])
      .select();
      
    if (error) throw error;
    
    return data?.[0] || null;
  } catch (error) {
    console.error('Error creating driver:', error);
    throw error;
  }
}

/**
 * Update an existing driver
 * @param {string} id - Driver ID
 * @param {Object} driverData - Updated driver data
 * @returns {Promise<Object|null>} - Updated driver or null
 */
export async function updateDriver(id, driverData) {
  try {
    const { data, error } = await supabase
      .from('drivers')
      .update(driverData)
      .eq('id', id)
      .select();
      
    if (error) throw error;
    
    return data?.[0] || null;
  } catch (error) {
    console.error('Error updating driver:', error);
    throw error;
  }
}

/**
 * Delete a driver
 * @param {string} id - Driver ID
 * @returns {Promise<boolean>} - Success status
 */
export async function deleteDriver(id) {
  try {
    const { error } = await supabase
      .from('drivers')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error deleting driver:', error);
    throw error;
  }
}

/**
 * Upload driver image to Supabase storage
 * @param {string} userId - User ID
 * @param {File} file - Image file
 * @returns {Promise<string|null>} - Public URL of the uploaded image or null
 */
export async function uploadDriverImage(userId, file) {
  try {
    // Create a unique file path
    const filePath = `${userId}/drivers/${Date.now()}_${file.name}`;
    
    // Upload the file
    const { data, error } = await supabase.storage
      .from('drivers')
      .upload(filePath, file);
      
    if (error) throw error;
    
    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('drivers')
      .getPublicUrl(filePath);
      
    return publicUrl;
  } catch (error) {
    console.error('Error uploading driver image:', error);
    return null;
  }
}

/**
 * Check driver's document expiration status
 * @param {Object} driver - Driver object
 * @returns {Object} - Status indicators
 */
export function checkDriverDocumentStatus(driver) {
  const now = new Date();
  const licenseExpiry = new Date(driver.license_expiry);
  const medicalCardExpiry = new Date(driver.medical_card_expiry);
  
  // Days until expiration (negative if expired)
  const licenseExpiryDays = Math.floor((licenseExpiry - now) / (1000 * 60 * 60 * 24));
  const medicalCardExpiryDays = Math.floor((medicalCardExpiry - now) / (1000 * 60 * 60 * 24));
  
  return {
    licenseStatus: licenseExpiryDays < 0 ? 'expired' : 
                  licenseExpiryDays < 30 ? 'warning' : 'valid',
    licenseExpiryDays,
    medicalCardStatus: medicalCardExpiryDays < 0 ? 'expired' : 
                      medicalCardExpiryDays < 30 ? 'warning' : 'valid',
    medicalCardExpiryDays
  };
}

/**
 * Get driver statistics
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Driver statistics
 */
export async function getDriverStats(userId) {
  try {
    const { data, error } = await supabase
      .from('drivers')
      .select('id, status, license_expiry, medical_card_expiry')
      .eq('user_id', userId);
      
    if (error) throw error;
    
    const now = new Date();
    
    // Calculate stats
    const total = data?.length || 0;
    const active = data?.filter(d => d.status === 'Active').length || 0;
    const inactive = data?.filter(d => d.status === 'Inactive').length || 0;
    
    // Check for expiring documents (within 30 days)
    const expiringLicense = data?.filter(d => {
      const expiry = new Date(d.license_expiry);
      const daysUntilExpiry = Math.floor((expiry - now) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry >= 0 && daysUntilExpiry <= 30;
    }).length || 0;
    
    const expiringMedical = data?.filter(d => {
      const expiry = new Date(d.medical_card_expiry);
      const daysUntilExpiry = Math.floor((expiry - now) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry >= 0 && daysUntilExpiry <= 30;
    }).length || 0;
    
    return {
      total,
      active,
      inactive,
      expiringLicense,
      expiringMedical
    };
  } catch (error) {
    console.error('Error getting driver stats:', error);
    return {
      total: 0,
      active: 0,
      inactive: 0,
      expiringLicense: 0,
      expiringMedical: 0
    };
  }
}