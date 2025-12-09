import { supabase } from "@/lib/supabaseClient";
import { syncMaintenanceToExpense } from "./expenseMaintenanceIntegration";
import { NotificationService, NOTIFICATION_TYPES, URGENCY_LEVELS } from "./notificationService";

/**
 * Fetch all maintenance records for a user
 */
export async function fetchMaintenanceRecords(userId) {
  const { data, error } = await supabase
    .from("maintenance_records")
    .select(`
      *,
      trucks:truck_id (id, name, make, model, year, type)
    `)
    .eq("user_id", userId)
    .order("due_date", { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Fetch a single maintenance record by ID
 */
export async function fetchMaintenanceById(id) {
  const { data, error } = await supabase
    .from("maintenance_records")
    .select(`
      *,
      trucks:truck_id (id, name, make, model, year, type)
    `)
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Create a new maintenance record
 */
export async function createMaintenanceRecord(recordData) {
  const { data, error } = await supabase
    .from("maintenance_records")
    .insert([recordData])
    .select(`
      *,
      trucks:truck_id (id, name, make, model)
    `)
    .single();

  if (error) throw error;

  // Create notification if maintenance is due soon (within 14 days)
  if (data && data.user_id && data.due_date) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dueDate = new Date(data.due_date);
      dueDate.setHours(0, 0, 0, 0);
      const daysUntil = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

      if (daysUntil <= 14) {
        const urgency = daysUntil <= 0 ? URGENCY_LEVELS.HIGH : daysUntil <= 3 ? URGENCY_LEVELS.MEDIUM : URGENCY_LEVELS.NORMAL;
        const truckName = data.trucks?.name || data.trucks?.make || 'Vehicle';

        await NotificationService.createNotification({
          userId: data.user_id,
          title: `Maintenance Scheduled - ${data.maintenance_type}`,
          message: daysUntil <= 0
            ? `${data.maintenance_type} for ${truckName} is overdue! Service was due ${Math.abs(daysUntil)} day${Math.abs(daysUntil) !== 1 ? 's' : ''} ago.`
            : `${data.maintenance_type} for ${truckName} is due in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}. Schedule service soon.`,
          type: NOTIFICATION_TYPES.MAINTENANCE_DUE,
          entityType: 'maintenance',
          entityId: data.id,
          linkTo: `/dashboard/fleet?tab=maintenance`,
          dueDate: data.due_date,
          urgency: urgency
        });
      }
    } catch (notifError) {
      console.error('Failed to create maintenance notification:', notifError);
    }
  }

  return data;
}

/**
 * Update an existing maintenance record
 * Automatically syncs to expenses when status changes to "Completed" with a cost
 */
export async function updateMaintenanceRecord(id, recordData) {
  // First, get the current record to check if status is changing to Completed
  const { data: existingRecord, error: fetchError } = await supabase
    .from("maintenance_records")
    .select(`
      status, expense_id, user_id, maintenance_type,
      trucks:truck_id (id, name, make, model)
    `)
    .eq("id", id)
    .single();

  if (fetchError) throw fetchError;

  const { data, error } = await supabase
    .from("maintenance_records")
    .update({
      ...recordData,
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  // Check if status changed to "Completed" and has cost - sync to expenses
  const isNewlyCompleted = recordData.status === "Completed" && existingRecord.status !== "Completed";
  const hasCost = recordData.cost && parseFloat(recordData.cost) > 0;
  const notAlreadySynced = !existingRecord.expense_id;

  let expenseResult = null;
  if (isNewlyCompleted && hasCost && notAlreadySynced) {
    try {
      expenseResult = await syncMaintenanceToExpense(existingRecord.user_id, id);
    } catch (syncError) {
      console.error('Failed to sync maintenance to expense:', syncError);
      // Don't throw - the update was successful, expense sync is secondary
    }
  }

  // Create notification when status changes to Completed
  if (isNewlyCompleted && existingRecord?.user_id) {
    try {
      const truckName = existingRecord.trucks?.name || existingRecord.trucks?.make || 'Vehicle';
      const costText = recordData.cost ? ` Cost: $${parseFloat(recordData.cost).toLocaleString()}` : '';

      await NotificationService.createNotification({
        userId: existingRecord.user_id,
        title: `Maintenance Completed - ${existingRecord.maintenance_type}`,
        message: `${existingRecord.maintenance_type} for ${truckName} has been completed.${costText}${expenseResult ? ' Expense record created.' : ''}`,
        type: NOTIFICATION_TYPES.MAINTENANCE_DUE,
        entityType: 'maintenance',
        entityId: data.id,
        linkTo: `/dashboard/fleet?tab=maintenance`,
        urgency: URGENCY_LEVELS.LOW
      });
    } catch (notifError) {
      console.error('Failed to create maintenance completion notification:', notifError);
    }
  }

  return expenseResult ? { ...data, expenseSync: expenseResult } : data;
}

/**
 * Delete a maintenance record
 * Also deletes the linked expense if one exists
 */
export async function deleteMaintenanceRecord(id, deleteLinkedExpense = true) {
  // First, check if there's a linked expense
  const { data: record, error: fetchError } = await supabase
    .from("maintenance_records")
    .select("expense_id")
    .eq("id", id)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

  // Delete linked expense if exists and requested
  if (deleteLinkedExpense && record?.expense_id) {
    const { error: expenseError } = await supabase
      .from("expenses")
      .delete()
      .eq("id", record.expense_id);

    if (expenseError) {
      console.error('Failed to delete linked expense:', expenseError);
      // Continue with maintenance deletion even if expense deletion fails
    }
  }

  const { error } = await supabase
    .from("maintenance_records")
    .delete()
    .eq("id", id);

  if (error) throw error;
  return true;
}

/**
 * Complete a maintenance record and optionally sync to expenses
 * @param {string} id - Maintenance record ID
 * @param {Object} completionData - Completion details (cost, date, etc.)
 * @param {boolean} syncToExpense - Whether to sync to expenses (default: true)
 */
export async function completeMaintenanceRecord(id, completionData, syncToExpense = true) {
  // First, get the maintenance record to get user_id and other details
  const { data: existingRecord, error: fetchError } = await supabase
    .from("maintenance_records")
    .select(`
      user_id, maintenance_type,
      trucks:truck_id (id, name, make, model)
    `)
    .eq("id", id)
    .single();

  if (fetchError) throw fetchError;

  // Update the maintenance record
  const { data, error } = await supabase
    .from("maintenance_records")
    .update({
      status: "Completed",
      completed_date: completionData.completed_date || new Date().toISOString().split('T')[0],
      cost: completionData.cost,
      odometer_at_service: completionData.odometer_at_service,
      service_provider: completionData.service_provider,
      invoice_number: completionData.invoice_number,
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  // Sync to expenses if requested and cost is provided
  let expenseResult = null;
  if (syncToExpense && completionData.cost && completionData.cost > 0) {
    try {
      expenseResult = await syncMaintenanceToExpense(existingRecord.user_id, id);
    } catch (syncError) {
      console.error('Failed to sync maintenance to expense:', syncError);
      // Don't throw - the maintenance was completed successfully, expense sync is secondary
    }
  }

  // Create notification for maintenance completion
  if (existingRecord?.user_id) {
    try {
      const truckName = existingRecord.trucks?.name || existingRecord.trucks?.make || 'Vehicle';
      const costText = completionData.cost ? ` Cost: $${parseFloat(completionData.cost).toLocaleString()}` : '';

      await NotificationService.createNotification({
        userId: existingRecord.user_id,
        title: `Maintenance Completed - ${existingRecord.maintenance_type}`,
        message: `${existingRecord.maintenance_type} for ${truckName} has been completed.${costText}${expenseResult ? ' Expense record created.' : ''}`,
        type: NOTIFICATION_TYPES.MAINTENANCE_DUE,
        entityType: 'maintenance',
        entityId: data.id,
        linkTo: `/dashboard/fleet?tab=maintenance`,
        urgency: URGENCY_LEVELS.LOW
      });
    } catch (notifError) {
      console.error('Failed to create maintenance completion notification:', notifError);
    }
  }

  return { ...data, expenseSync: expenseResult };
}

/**
 * Get maintenance stats for a user
 */
export async function getMaintenanceStats(userId) {
  const { data, error } = await supabase
    .from("maintenance_records")
    .select("id, status, due_date")
    .eq("user_id", userId);

  if (error) throw error;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const stats = {
    total: data?.length || 0,
    pending: 0,
    overdue: 0,
    completed: 0,
    upcoming: 0
  };

  data?.forEach(record => {
    if (record.status === "Completed") {
      stats.completed++;
    } else {
      const dueDate = new Date(record.due_date);
      dueDate.setHours(0, 0, 0, 0);

      if (dueDate < today) {
        stats.overdue++;
      } else if (dueDate <= new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)) {
        stats.upcoming++;
        stats.pending++;
      } else {
        stats.pending++;
      }
    }
  });

  return stats;
}

/**
 * Get upcoming maintenance (due within 30 days)
 */
export async function getUpcomingMaintenance(userId, days = 30) {
  const today = new Date();
  const futureDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);

  const { data, error } = await supabase
    .from("maintenance_records")
    .select(`
      *,
      trucks:truck_id (id, name, make, model, year, type)
    `)
    .eq("user_id", userId)
    .neq("status", "Completed")
    .lte("due_date", futureDate.toISOString().split('T')[0])
    .order("due_date", { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Get overdue maintenance
 */
export async function getOverdueMaintenance(userId) {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from("maintenance_records")
    .select(`
      *,
      trucks:truck_id (id, name, make, model, year, type)
    `)
    .eq("user_id", userId)
    .neq("status", "Completed")
    .lt("due_date", today)
    .order("due_date", { ascending: true });

  if (error) throw error;
  return data || [];
}

// Maintenance types for dropdown
export const MAINTENANCE_TYPES = [
  "Oil Change",
  "Tire Rotation",
  "Tire Replacement",
  "Brake Service",
  "Transmission Service",
  "Engine Tune-Up",
  "Coolant Flush",
  "Air Filter Replacement",
  "Fuel Filter Replacement",
  "Battery Replacement",
  "Alternator Repair",
  "Starter Repair",
  "Suspension Repair",
  "Alignment",
  "AC Service",
  "Heater Repair",
  "Electrical Repair",
  "DOT Inspection",
  "Annual Inspection",
  "Preventive Maintenance",
  "Emergency Repair",
  "Other"
];

// Status options
export const MAINTENANCE_STATUSES = [
  "Pending",
  "Scheduled",
  "In Progress",
  "Completed",
  "Cancelled"
];
