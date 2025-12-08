// src/lib/services/expenseMaintenanceIntegration.js

import { supabase } from "../supabaseClient";

/**
 * Sync a completed maintenance record to expenses
 * @param {string} userId - User ID
 * @param {string} maintenanceId - Maintenance record ID
 * @returns {Promise<Object|null>} - The created expense or null if already synced
 */
export async function syncMaintenanceToExpense(userId, maintenanceId) {
  try {
    // Get the maintenance record with vehicle info
    const { data: maintenance, error: maintenanceError } = await supabase
      .from('maintenance_records')
      .select(`
        *,
        trucks:truck_id (id, name, make, model, year, license_plate)
      `)
      .eq('id', maintenanceId)
      .single();

    if (maintenanceError) throw maintenanceError;

    if (!maintenance) {
      throw new Error('Maintenance record not found');
    }

    // Only sync completed maintenance with a cost
    if (maintenance.status !== 'Completed') {
      return { success: false, message: 'Maintenance must be completed before syncing to expenses' };
    }

    if (!maintenance.cost || maintenance.cost <= 0) {
      return { success: false, message: 'Maintenance must have a cost to sync to expenses' };
    }

    // Check if this maintenance is already synced to an expense
    if (maintenance.expense_id) {
      // Get the existing expense to return it
      const { data: existingExpense, error: expenseError } = await supabase
        .from('expenses')
        .select('*')
        .eq('id', maintenance.expense_id)
        .single();

      if (!expenseError && existingExpense) {
        return { success: true, expense: existingExpense, alreadySynced: true };
      }
      // The expense_id exists but expense doesn't - clear and re-sync
    }

    // Build vehicle description
    let vehicleDescription = '';
    if (maintenance.trucks) {
      const truck = maintenance.trucks;
      vehicleDescription = truck.name || `${truck.year || ''} ${truck.make || ''} ${truck.model || ''}`.trim();
      if (truck.license_plate) {
        vehicleDescription += ` (${truck.license_plate})`;
      }
    }

    // Create expense entry
    const expenseData = {
      user_id: userId,
      description: `${maintenance.maintenance_type}${vehicleDescription ? ` - ${vehicleDescription}` : ''}`,
      amount: maintenance.cost,
      date: maintenance.completed_date || maintenance.due_date,
      category: 'Maintenance',
      payment_method: 'Credit Card', // Default, user can update later
      notes: buildMaintenanceNotes(maintenance),
      vehicle_id: maintenance.truck_id || maintenance.vehicle_id,
      deductible: true // Maintenance is typically deductible for business
    };

    // Insert expense
    const { data: expense, error: expenseError } = await supabase
      .from('expenses')
      .insert([expenseData])
      .select()
      .single();

    if (expenseError) throw expenseError;

    if (!expense) {
      throw new Error('Failed to create expense');
    }

    // Update maintenance record with expense_id reference
    const { error: updateError } = await supabase
      .from('maintenance_records')
      .update({ expense_id: expense.id })
      .eq('id', maintenanceId);

    if (updateError) {
      // Rollback: delete the created expense to keep consistency
      await supabase.from('expenses').delete().eq('id', expense.id);
      throw updateError;
    }

    return { success: true, expense, alreadySynced: false };
  } catch (error) {
    console.error('Error syncing maintenance to expense:', error);
    throw error;
  }
}

/**
 * Build notes string from maintenance record details
 */
function buildMaintenanceNotes(maintenance) {
  const parts = [];

  if (maintenance.description) {
    parts.push(maintenance.description);
  }

  if (maintenance.service_provider) {
    parts.push(`Service Provider: ${maintenance.service_provider}`);
  }

  if (maintenance.invoice_number) {
    parts.push(`Invoice #: ${maintenance.invoice_number}`);
  }

  if (maintenance.odometer_at_service) {
    parts.push(`Odometer: ${maintenance.odometer_at_service.toLocaleString()} mi`);
  }

  return parts.join('\n') || null;
}

/**
 * Sync all completed maintenance records that haven't been synced yet
 * @param {string} userId - The authenticated user's ID
 * @returns {Promise<Object>} - Results of the sync operation
 */
export async function syncAllMaintenanceToExpenses(userId) {
  try {
    // Get completed maintenance records that haven't been synced to expenses yet
    const { data: maintenanceRecords, error: maintenanceError } = await supabase
      .from('maintenance_records')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'Completed')
      .is('expense_id', null)
      .gt('cost', 0); // Only records with cost

    if (maintenanceError) throw maintenanceError;

    if (!maintenanceRecords || maintenanceRecords.length === 0) {
      return { syncedCount: 0, message: "No completed maintenance records to sync" };
    }

    // Sync each maintenance record
    const results = await Promise.allSettled(
      maintenanceRecords.map(record => syncMaintenanceToExpense(userId, record.id))
    );

    // Count successful operations
    const successful = results.filter(r => r.status === 'fulfilled' && r.value?.success);
    const failed = results.filter(r => r.status === 'rejected' || !r.value?.success);

    return {
      syncedCount: successful.length,
      failedCount: failed.length,
      message: `Successfully synced ${successful.length} maintenance records to expenses${failed.length > 0 ? `, ${failed.length} failed` : ''}`,
      expenses: successful.map(r => r.value?.expense).filter(Boolean)
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Get the expense linked to a maintenance record
 * @param {string} maintenanceId - Maintenance record ID
 * @returns {Promise<Object|null>} - The linked expense or null
 */
export async function getLinkedMaintenanceExpense(maintenanceId) {
  try {
    // First get the maintenance record to find its expense_id
    const { data: maintenance, error: maintenanceError } = await supabase
      .from('maintenance_records')
      .select('expense_id')
      .eq('id', maintenanceId)
      .single();

    if (maintenanceError) throw maintenanceError;

    if (!maintenance || !maintenance.expense_id) return null;

    // Get the expense details
    const { data: expense, error: expenseError } = await supabase
      .from('expenses')
      .select('*')
      .eq('id', maintenance.expense_id)
      .single();

    if (expenseError) throw expenseError;

    return expense;
  } catch (error) {
    return null;
  }
}

/**
 * Update an expense linked to a maintenance record
 * @param {string} maintenanceId - Maintenance record ID
 * @returns {Promise<Object>} - Success status
 */
export async function updateLinkedMaintenanceExpense(maintenanceId) {
  try {
    // Get the maintenance record with its expense_id
    const { data: maintenance, error: maintenanceError } = await supabase
      .from('maintenance_records')
      .select(`
        *,
        trucks:truck_id (id, name, make, model, year, license_plate)
      `)
      .eq('id', maintenanceId)
      .single();

    if (maintenanceError) throw maintenanceError;

    if (!maintenance || !maintenance.expense_id) {
      return { success: false, message: "No linked expense found" };
    }

    // Build vehicle description
    let vehicleDescription = '';
    if (maintenance.trucks) {
      const truck = maintenance.trucks;
      vehicleDescription = truck.name || `${truck.year || ''} ${truck.make || ''} ${truck.model || ''}`.trim();
      if (truck.license_plate) {
        vehicleDescription += ` (${truck.license_plate})`;
      }
    }

    // Update the linked expense
    const { error: updateError } = await supabase
      .from('expenses')
      .update({
        description: `${maintenance.maintenance_type}${vehicleDescription ? ` - ${vehicleDescription}` : ''}`,
        amount: maintenance.cost,
        date: maintenance.completed_date || maintenance.due_date,
        notes: buildMaintenanceNotes(maintenance),
        vehicle_id: maintenance.truck_id || maintenance.vehicle_id
      })
      .eq('id', maintenance.expense_id);

    if (updateError) throw updateError;

    return { success: true, message: "Linked expense updated successfully" };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

/**
 * Remove the link between a maintenance record and its expense
 * @param {string} maintenanceId - Maintenance record ID
 * @param {boolean} deleteExpense - Whether to delete the expense or just unlink
 * @returns {Promise<Object>} - Success status
 */
export async function unlinkMaintenanceExpense(maintenanceId, deleteExpense = false) {
  try {
    // First get the maintenance record to find its expense_id
    const { data: maintenance, error: maintenanceError } = await supabase
      .from('maintenance_records')
      .select('expense_id')
      .eq('id', maintenanceId)
      .single();

    if (maintenanceError) throw maintenanceError;

    if (!maintenance || !maintenance.expense_id) {
      return { success: false, message: "No linked expense found" };
    }

    // Delete the expense if requested
    if (deleteExpense) {
      const { error: deleteError } = await supabase
        .from('expenses')
        .delete()
        .eq('id', maintenance.expense_id);

      if (deleteError) throw deleteError;
    }

    // Update the maintenance record to remove the expense_id
    const { error: updateError } = await supabase
      .from('maintenance_records')
      .update({ expense_id: null })
      .eq('id', maintenanceId);

    if (updateError) throw updateError;

    return {
      success: true,
      message: deleteExpense
        ? "Expense deleted and unlinked successfully"
        : "Expense unlinked successfully"
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
}
