import { supabase } from "@/lib/supabaseClient";

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
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update an existing maintenance record
 */
export async function updateMaintenanceRecord(id, recordData) {
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
  return data;
}

/**
 * Delete a maintenance record
 */
export async function deleteMaintenanceRecord(id) {
  const { error } = await supabase
    .from("maintenance_records")
    .delete()
    .eq("id", id);

  if (error) throw error;
  return true;
}

/**
 * Complete a maintenance record
 */
export async function completeMaintenanceRecord(id, completionData) {
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
  return data;
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
