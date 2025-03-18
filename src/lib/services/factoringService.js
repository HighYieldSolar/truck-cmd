// src/lib/services/factoringService.js
import { supabase } from "../supabaseClient";

/**
 * Records a factored load and updates the related load record
 * @param {string} userId - User ID
 * @param {string} loadId - Load ID
 * @param {Object} factoringData - Factoring details
 * @returns {Promise<Object>} - Created factoring record
 */
export async function recordFactoredLoad(userId, loadId, factoringData) {
  try {
    // Start a transaction using Supabase (note: this is a fake transaction since Supabase doesn't support real ones)
    // Step 1: Create the factoring record
    const { amount, factoringCompany, factorDate, referenceNumber, feeAmount, notes } = factoringData;
    
    // Calculate net amount (total minus fees)
    const netAmount = parseFloat(amount) - (parseFloat(feeAmount) || 0);
    
    const { data: factoringRecord, error: factoringError } = await supabase
      .from('factored_loads')
      .insert([{
        user_id: userId,
        load_id: loadId,
        amount: parseFloat(amount),
        factoring_company: factoringCompany,
        factoring_date: factorDate || new Date().toISOString().split('T')[0],
        reference_number: referenceNumber || null,
        fee_amount: parseFloat(feeAmount) || 0,
        net_amount: netAmount,
        status: 'complete',
        notes: notes || null
      }])
      .select()
      .single();
      
    if (factoringError) {
      console.error("Error creating factoring record:", factoringError);
      throw factoringError;
    }
    
    // Step 2: Update the load to mark it as factored
    const { error: updateError } = await supabase
      .from('loads')
      .update({
        factored: true,
        factoring_id: factoringRecord.id,
        status: 'Completed' // Also ensure the load is marked as completed
      })
      .eq('id', loadId);
      
    if (updateError) {
      console.error("Error updating load record:", updateError);
      
      // If updating the load fails, try to roll back by deleting the factoring record
      await supabase
        .from('factored_loads')
        .delete()
        .eq('id', factoringRecord.id);
        
      throw updateError;
    }
    
    // Return the created factoring record with load details
    return factoringRecord;
  } catch (error) {
    console.error("Error in recordFactoredLoad:", error);
    throw error;
  }
}

/**
 * Get factoring statistics for dashboard
 * @param {string} userId - User ID
 * @param {string} period - Time period ('month', 'year', 'all')
 * @returns {Promise<Object>} - Factoring statistics
 */
export async function getFactoringStats(userId, period = 'month') {
  try {
    // Calculate date range based on period
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case 'all':
      default:
        startDate = new Date(0); // Beginning of time
        break;
    }
    
    const startDateStr = startDate.toISOString().split('T')[0];
    
    // Query for factored loads within time period
    const { data, error } = await supabase
      .from('factored_loads')
      .select('amount, net_amount, fee_amount, factoring_date')
      .eq('user_id', userId)
      .gte('factoring_date', startDateStr)
      .order('factoring_date', { ascending: false });
      
    if (error) throw error;
    
    // Calculate statistics
    const stats = {
      count: data?.length || 0,
      totalAmount: 0,
      totalNetAmount: 0,
      totalFees: 0,
      averageFeePercent: 0
    };
    
    if (data && data.length > 0) {
      stats.totalAmount = data.reduce((sum, record) => sum + parseFloat(record.amount || 0), 0);
      stats.totalNetAmount = data.reduce((sum, record) => sum + parseFloat(record.net_amount || 0), 0);
      stats.totalFees = data.reduce((sum, record) => sum + parseFloat(record.fee_amount || 0), 0);
      
      if (stats.totalAmount > 0) {
        stats.averageFeePercent = (stats.totalFees / stats.totalAmount) * 100;
      }
    }
    
    return stats;
  } catch (error) {
    console.error("Error getting factoring stats:", error);
    return {
      count: 0,
      totalAmount: 0,
      totalNetAmount: 0,
      totalFees: 0,
      averageFeePercent: 0
    };
  }
}

/**
 * Subscribe to factoring changes
 * @param {string} userId - User ID
 * @param {Function} callback - Callback function
 * @returns {Function} - Unsubscribe function
 */
export function subscribeToFactoringChanges(userId, callback) {
  const channel = supabase
    .channel(`factoring-${userId}`)
    .on(
      'postgres_changes',
      { 
        event: '*', 
        schema: 'public', 
        table: 'factored_loads',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();
    
  return () => {
    supabase.removeChannel(channel);
  };
}