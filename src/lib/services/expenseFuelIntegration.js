// Create a new file: src/lib/services/expenseFuelIntegration.js

import { supabase } from "../supabaseClient";

/**
 * Convert fuel entries to expense format and sync them
 * @param {string} userId - The authenticated user's ID
 * @returns {Promise<Object>} - Results of the sync operation
 */
export async function syncFuelToExpenses(userId) {
  try {
    // 1. Get fuel entries that haven't been synced to expenses yet
    const { data: fuelEntries, error: fuelError } = await supabase
      .from('fuel_entries')
      .select('*')
      .eq('user_id', userId)
      .is('expense_id', null); // Only entries not linked to expenses
      
    if (fuelError) throw fuelError;
    
    if (!fuelEntries || fuelEntries.length === 0) {
      return { syncedCount: 0, message: "No new fuel entries to sync" };
    }
    
    // 2. Convert each fuel entry to expense format and insert
    const expensePromises = fuelEntries.map(async (entry) => {
      // Create expense entry
      const expenseData = {
        user_id: userId,
        description: `Fuel - ${entry.location}`,
        amount: entry.total_amount,
        date: entry.date,
        category: 'Fuel',
        payment_method: entry.payment_method || 'Credit Card',
        notes: `Vehicle: ${entry.vehicle_id}, ${entry.gallons} gallons at ${entry.state}`,
        receipt_image: entry.receipt_image,
        vehicle_id: entry.vehicle_id,
        deductible: true // Fuel is typically deductible for business
      };
      
      // Insert expense
      const { data: expense, error: expenseError } = await supabase
        .from('expenses')
        .insert([expenseData])
        .select();
        
      if (expenseError) throw expenseError;
      
      // Update fuel entry with expense_id reference
      await supabase
        .from('fuel_entries')
        .update({ expense_id: expense[0].id })
        .eq('id', entry.id);
        
      return expense[0];
    });
    
    // Wait for all operations to complete
    const results = await Promise.all(expensePromises);
    
    return { 
      syncedCount: results.length,
      message: `Successfully synced ${results.length} fuel entries to expenses`,
      expenses: results
    };
  } catch (error) {
    console.error('Error syncing fuel to expenses:', error);
    throw error;
  }
}