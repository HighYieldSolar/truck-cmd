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
    const insertData = {
      user_id: userId,
      load_id: loadId,
      amount: amount,
      date: new Date().toISOString().split('T')[0],
      source: 'Factoring',
      description: `Factored earnings for Load #${loadNumber}`,
      factoring_company: factoringCompany
    };

    const { data, error } = await supabase
      .from('earnings')
      .insert([insertData])
      .select();

    if (error) {
      // Handle duplicate key error gracefully - earnings already exist for this load
      if (error.code === '23505') {
        return { success: true, alreadyExists: true };
      }
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error };
  }
}