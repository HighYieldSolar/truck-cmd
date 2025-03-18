// src/lib/utils/syncFactoredLoads.js
import { supabase } from "../supabaseClient";

/**
 * Synchronizes factored loads with the earnings table
 * This utility finds loads that are marked as factored but don't have 
 * corresponding entries in the earnings table and creates them
 * 
 * @param {string} userId - User ID to sync records for
 * @returns {Promise<Object>} Results of the sync operation
 */
export async function syncFactoredLoads(userId) {
  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("No authenticated user found");
    }
    userId = user.id;
  }
  
  console.log(`Starting factored loads sync for user: ${userId}`);
  
  const result = {
    success: false,
    synced: 0,
    failed: 0,
    skipped: 0,
    errors: [],
    details: []
  };
  
  try {
    // Find all loads marked as factored
    const { data: factoredLoads, error: loadsError } = await supabase
      .from('loads')
      .select('*')
      .eq('user_id', userId)
      .eq('factored', true);
    
    if (loadsError) {
      throw loadsError;
    }
    
    if (!factoredLoads || factoredLoads.length === 0) {
      result.success = true;
      result.message = 'No factored loads found for this user';
      return result;
    }
    
    console.log(`Found ${factoredLoads.length} factored loads`);
    
    // Get all existing factoring earnings records for this user
    const { data: existingEarnings, error: earningsError } = await supabase
      .from('earnings')
      .select('load_id')
      .eq('user_id', userId)
      .eq('source', 'Factoring');
    
    if (earningsError) {
      throw earningsError;
    }
    
    // Create a set of load IDs that already have earnings records
    const existingLoadIds = new Set((existingEarnings || []).map(e => e.load_id));
    
    // Filter to loads that need earnings records
    const loadsNeedingEarnings = factoredLoads.filter(load => !existingLoadIds.has(load.id));
    
    console.log(`Found ${loadsNeedingEarnings.length} factored loads without earnings records`);
    result.skipped = factoredLoads.length - loadsNeedingEarnings.length;
    
    // Create earnings records for each load
    for (const load of loadsNeedingEarnings) {
      try {
        const earningsData = {
          user_id: userId,
          load_id: load.id,
          amount: parseFloat(load.factored_amount || load.rate || 0),
          date: load.factored_at ? new Date(load.factored_at).toISOString().split('T')[0] : 
                 load.completed_at ? new Date(load.completed_at).toISOString().split('T')[0] : 
                 new Date().toISOString().split('T')[0],
          source: 'Factoring',
          description: `Factored load #${load.load_number}: ${load.origin || ''} to ${load.destination || ''}`,
          factoring_company: load.factoring_company || null,
          created_at: new Date().toISOString()
        };
        
        const { data, error } = await supabase
          .from('earnings')
          .insert([earningsData])
          .select();
        
        if (error) {
          throw error;
        }
        
        result.synced++;
        result.details.push({
          loadId: load.id,
          loadNumber: load.load_number,
          status: 'synced',
          message: 'Created new earnings record',
          earningId: data?.[0]?.id,
          amount: earningsData.amount
        });
        
        console.log(`Created earnings record for load #${load.load_number}`);
      } catch (error) {
        console.error(`Error syncing load ${load.id}:`, error);
        result.failed++;
        result.errors.push({
          loadId: load.id,
          loadNumber: load.load_number,
          error: error.message
        });
        result.details.push({
          loadId: load.id,
          loadNumber: load.load_number,
          status: 'error',
          message: error.message
        });
      }
    }
    
    result.success = true;
    return result;
  } catch (error) {
    console.error('Error syncing factored loads:', error);
    result.success = false;
    result.error = error.message;
    return result;
  }
}

/**
 * Creates a utility to run the sync from the browser console
 * Call this function once to add the utility to the window object
 */
export function addSyncUtilToWindow() {
  if (typeof window !== 'undefined') {
    window.syncFactoredLoads = async () => {
      try {
        const result = await syncFactoredLoads();
        console.log('Sync complete:', result);
        return result;
      } catch (error) {
        console.error('Error running sync:', error);
        return { success: false, error: error.message };
      }
    };
    
    console.log('Sync utility added to window. Run window.syncFactoredLoads() to sync factored loads with earnings.');
  }
}