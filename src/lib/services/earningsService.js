// src/lib/services/earningsService.js
import { supabase } from "../supabaseClient";

/**
 * Records factored earnings for a completed load
 * @param {string} userId - User ID
 * @param {string} loadId - Load ID
 * @param {number} amount - Amount earned
 * @param {string} factoringCompany - Name of factoring company
 * @param {string} loadNumber - Load number for description
 * @returns {Promise<Object>} - Result of the operation
 */
export async function recordFactoredEarnings(userId, loadId, amount, factoringCompany, loadNumber) {
  try {
    const { data, error } = await supabase
      .from('earnings')
      .insert([{
        user_id: userId,
        load_id: loadId,
        amount: amount,
        date: new Date().toISOString().split('T')[0],
        source: 'Factoring',
        description: `Factored earnings for Load #${loadNumber}`,
        factoring_company: factoringCompany
      }])
      .select();
      
    if (error) throw error;
    
    return { success: true, data };
  } catch (error) {
    console.error('Error recording factored earnings:', error);
    return { success: false, error };
  }
}