// src/lib/services/customerService.js
import { supabase } from "../supabaseClient";

/**
 * Fetch all customers for the current user
 * @param {string} userId - The authenticated user's ID
 * @returns {Promise<Array>} - Array of customer objects
 */
export async function fetchCustomers(userId) {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('user_id', userId)
      .order('company_name', { ascending: true });
      
    if (error) throw error;
    
    // Return the data, or an empty array if no data
    return data || [];
  } catch (error) {
    return [];
  }
}

/**
 * Create a new customer
 * @param {string} userId - The authenticated user's ID
 * @param {Object} customerData - Customer data object
 * @returns {Promise<Object|null>} - Created customer object or null
 */
export async function createCustomer(userId, customerData) {
  try {
    // Format data for the database
    const dbData = {
      user_id: userId,
      company_name: customerData.company_name,
      contact_name: customerData.contact_name || '',
      email: customerData.email || '',
      phone: customerData.phone || '',
      address: customerData.address || '',
      city: customerData.city || '',
      state: customerData.state || '',
      zip: customerData.zip || '',
      customer_type: customerData.customer_type || 'Shipper',
      status: customerData.status || 'Active',
      notes: customerData.notes || '',
      created_at: new Date()
    };
    
    const { data, error } = await supabase
      .from('customers')
      .insert([dbData])
      .select();
      
    if (error) throw error;
    
    if (!data || data.length === 0) return null;
    
    // Return the created customer
    return data[0];
  } catch (error) {
    return null;
  }
}

/**
 * Update an existing customer
 * @param {string} id - Customer ID
 * @param {Object} customerData - Updated customer data
 * @returns {Promise<Object|null>} - Updated customer object or null
 */
export async function updateCustomer(id, customerData) {
  try {
    // Format data for the database
    const dbData = {
      company_name: customerData.company_name,
      contact_name: customerData.contact_name || '',
      email: customerData.email || '',
      phone: customerData.phone || '',
      address: customerData.address || '',
      city: customerData.city || '',
      state: customerData.state || '',
      zip: customerData.zip || '',
      customer_type: customerData.customer_type || 'Shipper',
      status: customerData.status || 'Active',
      notes: customerData.notes || '',
      updated_at: new Date()
    };
    
    const { data, error } = await supabase
      .from('customers')
      .update(dbData)
      .eq('id', id)
      .select();
      
    if (error) throw error;
    
    if (!data || data.length === 0) return null;
    
    // Return the updated customer
    return data[0];
  } catch (error) {
    return null;
  }
}

/**
 * Delete a customer
 * @param {string} id - Customer ID
 * @returns {Promise<boolean>} - Success status
 */
export async function deleteCustomer(id) {
  try {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get customer statistics
 * @param {string} userId - The authenticated user's ID
 * @returns {Promise<Object>} - Customer statistics
 */
export async function getCustomerStats(userId) {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('id, status, customer_type')
      .eq('user_id', userId);
      
    if (error) throw error;
    
    // Calculate stats
    const total = data?.length || 0;
    const active = data?.filter(c => c.status === 'Active').length || 0;
    const inactive = data?.filter(c => c.status === 'Inactive').length || 0;
    const shippers = data?.filter(c => c.customer_type === 'Shipper').length || 0;
    const consignees = data?.filter(c => c.customer_type === 'Consignee').length || 0;
    const brokers = data?.filter(c => c.customer_type === 'Broker').length || 0;
    
    return {
      total,
      active,
      inactive,
      shippers,
      consignees,
      brokers
    };
  } catch (error) {
    return {
      total: 0,
      active: 0,
      inactive: 0,
      shippers: 0,
      consignees: 0,
      brokers: 0
    };
  }
}

/**
 * Search customers
 * @param {string} userId - The authenticated user's ID
 * @param {string} query - Search query
 * @returns {Promise<Array>} - Array of matching customer objects
 */
export async function searchCustomers(userId, query) {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('user_id', userId)
      .or(`company_name.ilike.%${query}%,contact_name.ilike.%${query}%,email.ilike.%${query}%`)
      .order('company_name', { ascending: true });
      
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    return [];
  }
}