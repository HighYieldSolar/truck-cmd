// Update syncFuelToExpenses function in src/lib/services/expenseFuelIntegration.js

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
      
      if (!expense || expense.length === 0) {
        throw new Error(`Failed to create expense for fuel entry ${entry.id}`);
      }
      
      // Update fuel entry with expense_id reference
      const { error: updateError } = await supabase
        .from('fuel_entries')
        .update({ expense_id: expense[0].id })
        .eq('id', entry.id);
        
      if (updateError) {
        console.error(`Error updating fuel entry ${entry.id} with expense reference:`, updateError);
        // Consider deleting the created expense to keep consistency
        await supabase.from('expenses').delete().eq('id', expense[0].id);
        throw updateError;
      }
      
      return {
        fuelEntry: entry,
        expense: expense[0]
      };
    });
    
    // Wait for all operations to complete
    const results = await Promise.allSettled(expensePromises);
    
    // Count successful operations
    const successful = results.filter(r => r.status === 'fulfilled');
    const failed = results.filter(r => r.status === 'rejected');
    
    if (failed.length > 0) {
      console.warn(`${failed.length} fuel entries failed to sync:`, 
        failed.map(f => f.reason?.message || f.reason));
    }
    
    return { 
      syncedCount: successful.length,
      failedCount: failed.length,
      message: `Successfully synced ${successful.length} fuel entries to expenses${failed.length > 0 ? `, ${failed.length} failed` : ''}`,
      expenses: successful.map(r => r.value.expense),
      failures: failed.map(f => f.reason)
    };
  } catch (error) {
    console.error('Error syncing fuel to expenses:', error);
    throw error;
  }
}

/**
 * Sync a single fuel entry to expenses with duplicate prevention
 * @param {string} userId - User ID
 * @param {string} fuelEntryId - Fuel entry ID
 * @returns {Promise<Object|null>} - The created expense or null if already synced
 */
export async function syncSingleFuelEntryToExpense(userId, fuelEntryId) {
  try {
    // Get the specific fuel entry
    const { data: fuelEntry, error: fuelError } = await supabase
      .from('fuel_entries')
      .select('*')
      .eq('id', fuelEntryId)
      .single();
      
    if (fuelError) throw fuelError;
    
    if (!fuelEntry) {
      throw new Error('Fuel entry not found');
    }
    
    // Check if this fuel entry is already synced to an expense
    if (fuelEntry.expense_id) {
      console.log(`Fuel entry ${fuelEntryId} is already synced to expense ${fuelEntry.expense_id}`);
      
      // Get the existing expense to return it
      const { data: existingExpense, error: expenseError } = await supabase
        .from('expenses')
        .select('*')
        .eq('id', fuelEntry.expense_id)
        .single();
        
      if (expenseError) {
        console.warn(`Linked expense ${fuelEntry.expense_id} not found, may need to recreate`);
        // The expense_id exists but expense doesn't - could clear the expense_id to allow re-sync
      } else {
        return existingExpense; // Return the existing expense
      }
    }
    
    // Create expense entry
    const expenseData = {
      user_id: userId,
      description: `Fuel - ${fuelEntry.location}`,
      amount: fuelEntry.total_amount,
      date: fuelEntry.date,
      category: 'Fuel',
      payment_method: fuelEntry.payment_method || 'Credit Card',
      notes: `Vehicle: ${fuelEntry.vehicle_id}, ${fuelEntry.gallons} gallons at ${fuelEntry.state}`,
      receipt_image: fuelEntry.receipt_image,
      vehicle_id: fuelEntry.vehicle_id,
      deductible: true // Fuel is typically deductible for business
    };
    
    // Insert expense
    const { data: expense, error: expenseError } = await supabase
      .from('expenses')
      .insert([expenseData])
      .select();
      
    if (expenseError) throw expenseError;
    
    if (!expense || expense.length === 0) {
      throw new Error('Failed to create expense');
    }
    
    // Update fuel entry with expense_id reference
    const { error: updateError } = await supabase
      .from('fuel_entries')
      .update({ expense_id: expense[0].id })
      .eq('id', fuelEntryId);
      
    if (updateError) throw updateError;
    
    return expense[0];
  } catch (error) {
    console.error('Error syncing single fuel entry:', error);
    throw error;
  }
}

/**
 * Get the expense linked to a fuel entry
 * @param {string} fuelEntryId - Fuel entry ID
 * @returns {Promise<Object|null>} - The linked expense or null
 */
export async function getLinkedExpense(fuelEntryId) {
  try {
    // First get the fuel entry to find its expense_id
    const { data: fuelEntry, error: fuelError } = await supabase
      .from('fuel_entries')
      .select('expense_id')
      .eq('id', fuelEntryId)
      .single();
      
    if (fuelError) throw fuelError;
    
    if (!fuelEntry || !fuelEntry.expense_id) return null;
    
    // Get the expense details
    const { data: expense, error: expenseError } = await supabase
      .from('expenses')
      .select('*')
      .eq('id', fuelEntry.expense_id)
      .single();
      
    if (expenseError) throw expenseError;
    
    return expense;
  } catch (error) {
    console.error('Error getting linked expense:', error);
    return null;
  }
}

/**
 * Update an expense linked to a fuel entry
 * @param {string} fuelEntryId - Fuel entry ID
 * @returns {Promise<boolean>} - Success status
 */
export async function updateLinkedExpense(fuelEntryId) {
  try {
    // First get the fuel entry with its expense_id
    const { data: fuelEntry, error: fuelError } = await supabase
      .from('fuel_entries')
      .select('*')
      .eq('id', fuelEntryId)
      .single();
      
    if (fuelError) throw fuelError;
    
    if (!fuelEntry || !fuelEntry.expense_id) {
      return { success: false, message: "No linked expense found" };
    }
    
    // Update the linked expense
    const { error: updateError } = await supabase
      .from('expenses')
      .update({
        description: `Fuel - ${fuelEntry.location}`,
        amount: fuelEntry.total_amount,
        date: fuelEntry.date,
        payment_method: fuelEntry.payment_method || 'Credit Card',
        notes: `Vehicle: ${fuelEntry.vehicle_id}, ${fuelEntry.gallons} gallons at ${fuelEntry.state}`,
        receipt_image: fuelEntry.receipt_image,
        vehicle_id: fuelEntry.vehicle_id
      })
      .eq('id', fuelEntry.expense_id);
      
    if (updateError) throw updateError;
    
    return { success: true, message: "Linked expense updated successfully" };
  } catch (error) {
    console.error('Error updating linked expense:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Remove the link between a fuel entry and its expense
 * @param {string} fuelEntryId - Fuel entry ID
 * @param {boolean} deleteExpense - Whether to delete the expense or just unlink
 * @returns {Promise<boolean>} - Success status
 */
export async function unlinkExpense(fuelEntryId, deleteExpense = false) {
  try {
    // First get the fuel entry to find its expense_id
    const { data: fuelEntry, error: fuelError } = await supabase
      .from('fuel_entries')
      .select('expense_id')
      .eq('id', fuelEntryId)
      .single();
      
    if (fuelError) throw fuelError;
    
    if (!fuelEntry || !fuelEntry.expense_id) {
      return { success: false, message: "No linked expense found" };
    }
    
    // Delete the expense if requested
    if (deleteExpense) {
      const { error: deleteError } = await supabase
        .from('expenses')
        .delete()
        .eq('id', fuelEntry.expense_id);
        
      if (deleteError) throw deleteError;
    }
    
    // Update the fuel entry to remove the expense_id
    const { error: updateError } = await supabase
      .from('fuel_entries')
      .update({ expense_id: null })
      .eq('id', fuelEntryId);
      
    if (updateError) throw updateError;
    
    return { 
      success: true, 
      message: deleteExpense 
        ? "Expense deleted and unlinked successfully" 
        : "Expense unlinked successfully" 
    };
  } catch (error) {
    console.error('Error unlinking expense:', error);
    return { success: false, message: error.message };
  }
}