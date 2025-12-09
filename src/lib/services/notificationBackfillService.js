// src/lib/services/notificationBackfillService.js
import { supabase } from "../supabaseClient";
import { NotificationService, NOTIFICATION_TYPES, URGENCY_LEVELS } from "./notificationService";

/**
 * Calculate days until a date (negative if expired)
 */
function getDaysUntil(dateString) {
  if (!dateString) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = new Date(dateString);
  targetDate.setHours(0, 0, 0, 0);
  return Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));
}

/**
 * Get urgency level based on days until expiry
 */
function getUrgency(days, isInsurance = false) {
  if (days <= 0) return isInsurance ? URGENCY_LEVELS.CRITICAL : URGENCY_LEVELS.HIGH;
  if (days <= 7) return isInsurance ? URGENCY_LEVELS.HIGH : URGENCY_LEVELS.MEDIUM;
  if (days <= 14) return URGENCY_LEVELS.MEDIUM;
  return URGENCY_LEVELS.NORMAL;
}

/**
 * Check if a notification already exists for an entity and document type
 */
async function notificationExists(userId, entityType, entityId, notificationType, dueDate) {
  const { data } = await supabase
    .from('notifications')
    .select('id')
    .eq('user_id', userId)
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .eq('notification_type', notificationType)
    .eq('due_date', dueDate)
    .limit(1);

  return data && data.length > 0;
}

/**
 * Backfill notifications for all vehicles with expiring documents
 */
export async function backfillVehicleNotifications(userId) {
  const results = { created: 0, skipped: 0, errors: [] };

  try {
    const { data: vehicles, error } = await supabase
      .from('vehicles')
      .select('id, name, make, model, user_id, registration_expiry, insurance_expiry, inspection_expiry')
      .eq('user_id', userId);

    if (error) throw error;

    for (const vehicle of vehicles || []) {
      const truckName = vehicle.name || `${vehicle.make} ${vehicle.model}`;

      // Check registration expiry
      if (vehicle.registration_expiry) {
        const days = getDaysUntil(vehicle.registration_expiry);
        if (days !== null && days <= 30) {
          const exists = await notificationExists(
            userId, 'vehicle', vehicle.id,
            NOTIFICATION_TYPES.DOCUMENT_EXPIRY_COMPLIANCE,
            vehicle.registration_expiry
          );

          if (!exists) {
            try {
              await NotificationService.createNotification({
                userId: vehicle.user_id,
                title: `Registration ${days <= 0 ? 'Expired' : 'Expiring'} - ${truckName}`,
                message: days <= 0
                  ? `${truckName}'s registration has expired! Immediate renewal required.`
                  : `${truckName}'s registration expires in ${days} day${days !== 1 ? 's' : ''}. Renewal recommended.`,
                type: NOTIFICATION_TYPES.DOCUMENT_EXPIRY_COMPLIANCE,
                entityType: 'vehicle',
                entityId: vehicle.id,
                linkTo: `/dashboard/fleet?tab=trucks`,
                dueDate: vehicle.registration_expiry,
                urgency: getUrgency(days)
              });
              results.created++;
            } catch (e) {
              results.errors.push(`Vehicle ${truckName} registration: ${e.message}`);
            }
          } else {
            results.skipped++;
          }
        }
      }

      // Check insurance expiry
      if (vehicle.insurance_expiry) {
        const days = getDaysUntil(vehicle.insurance_expiry);
        if (days !== null && days <= 30) {
          const exists = await notificationExists(
            userId, 'vehicle', vehicle.id,
            NOTIFICATION_TYPES.DOCUMENT_EXPIRY_COMPLIANCE,
            vehicle.insurance_expiry
          );

          if (!exists) {
            try {
              await NotificationService.createNotification({
                userId: vehicle.user_id,
                title: `Insurance ${days <= 0 ? 'Expired' : 'Expiring'} - ${truckName}`,
                message: days <= 0
                  ? `${truckName}'s insurance has expired! Vehicle may not be legally operated.`
                  : `${truckName}'s insurance expires in ${days} day${days !== 1 ? 's' : ''}. Renewal required.`,
                type: NOTIFICATION_TYPES.DOCUMENT_EXPIRY_COMPLIANCE,
                entityType: 'vehicle',
                entityId: vehicle.id,
                linkTo: `/dashboard/fleet?tab=trucks`,
                dueDate: vehicle.insurance_expiry,
                urgency: getUrgency(days, true)
              });
              results.created++;
            } catch (e) {
              results.errors.push(`Vehicle ${truckName} insurance: ${e.message}`);
            }
          } else {
            results.skipped++;
          }
        }
      }

      // Check inspection expiry
      if (vehicle.inspection_expiry) {
        const days = getDaysUntil(vehicle.inspection_expiry);
        if (days !== null && days <= 30) {
          const exists = await notificationExists(
            userId, 'vehicle', vehicle.id,
            NOTIFICATION_TYPES.DOCUMENT_EXPIRY_COMPLIANCE,
            vehicle.inspection_expiry
          );

          if (!exists) {
            try {
              await NotificationService.createNotification({
                userId: vehicle.user_id,
                title: `Inspection ${days <= 0 ? 'Expired' : 'Due'} - ${truckName}`,
                message: days <= 0
                  ? `${truckName}'s inspection has expired! Schedule inspection immediately.`
                  : `${truckName}'s inspection expires in ${days} day${days !== 1 ? 's' : ''}. Schedule inspection soon.`,
                type: NOTIFICATION_TYPES.DOCUMENT_EXPIRY_COMPLIANCE,
                entityType: 'vehicle',
                entityId: vehicle.id,
                linkTo: `/dashboard/fleet?tab=trucks`,
                dueDate: vehicle.inspection_expiry,
                urgency: getUrgency(days)
              });
              results.created++;
            } catch (e) {
              results.errors.push(`Vehicle ${truckName} inspection: ${e.message}`);
            }
          } else {
            results.skipped++;
          }
        }
      }
    }
  } catch (error) {
    results.errors.push(`Vehicle fetch error: ${error.message}`);
  }

  return results;
}

/**
 * Backfill notifications for all drivers with expiring documents
 */
export async function backfillDriverNotifications(userId) {
  const results = { created: 0, skipped: 0, errors: [] };

  try {
    const { data: drivers, error } = await supabase
      .from('drivers')
      .select('id, name, user_id, license_expiry, medical_card_expiry')
      .eq('user_id', userId);

    if (error) throw error;

    for (const driver of drivers || []) {
      // Check license expiry
      if (driver.license_expiry) {
        const days = getDaysUntil(driver.license_expiry);
        if (days !== null && days <= 30) {
          const exists = await notificationExists(
            userId, 'driver', driver.id,
            NOTIFICATION_TYPES.DOCUMENT_EXPIRY_DRIVER_LICENSE,
            driver.license_expiry
          );

          if (!exists) {
            try {
              await NotificationService.createNotification({
                userId: driver.user_id,
                title: `Driver License ${days <= 0 ? 'Expired' : 'Expiring'} - ${driver.name}`,
                message: days <= 0
                  ? `${driver.name}'s CDL has expired! Driver cannot legally operate.`
                  : `${driver.name}'s CDL expires in ${days} day${days !== 1 ? 's' : ''}. Renewal required.`,
                type: NOTIFICATION_TYPES.DOCUMENT_EXPIRY_DRIVER_LICENSE,
                entityType: 'driver',
                entityId: driver.id,
                linkTo: `/dashboard/fleet?tab=drivers`,
                dueDate: driver.license_expiry,
                urgency: getUrgency(days, true) // License is critical like insurance
              });
              results.created++;
            } catch (e) {
              results.errors.push(`Driver ${driver.name} license: ${e.message}`);
            }
          } else {
            results.skipped++;
          }
        }
      }

      // Check medical card expiry
      if (driver.medical_card_expiry) {
        const days = getDaysUntil(driver.medical_card_expiry);
        if (days !== null && days <= 30) {
          const exists = await notificationExists(
            userId, 'driver', driver.id,
            NOTIFICATION_TYPES.DOCUMENT_EXPIRY_DRIVER_MEDICAL,
            driver.medical_card_expiry
          );

          if (!exists) {
            try {
              await NotificationService.createNotification({
                userId: driver.user_id,
                title: `Medical Card ${days <= 0 ? 'Expired' : 'Expiring'} - ${driver.name}`,
                message: days <= 0
                  ? `${driver.name}'s medical card has expired! Driver cannot legally operate.`
                  : `${driver.name}'s medical card expires in ${days} day${days !== 1 ? 's' : ''}. Renewal required.`,
                type: NOTIFICATION_TYPES.DOCUMENT_EXPIRY_DRIVER_MEDICAL,
                entityType: 'driver',
                entityId: driver.id,
                linkTo: `/dashboard/fleet?tab=drivers`,
                dueDate: driver.medical_card_expiry,
                urgency: getUrgency(days, true) // Medical card is critical
              });
              results.created++;
            } catch (e) {
              results.errors.push(`Driver ${driver.name} medical: ${e.message}`);
            }
          } else {
            results.skipped++;
          }
        }
      }
    }
  } catch (error) {
    results.errors.push(`Driver fetch error: ${error.message}`);
  }

  return results;
}

/**
 * Backfill notifications for all compliance items expiring
 */
export async function backfillComplianceNotifications(userId) {
  const results = { created: 0, skipped: 0, errors: [] };

  try {
    const { data: items, error } = await supabase
      .from('compliance_items')
      .select('id, title, entity_name, user_id, expiration_date')
      .eq('user_id', userId)
      .not('expiration_date', 'is', null);

    if (error) throw error;

    for (const item of items || []) {
      const days = getDaysUntil(item.expiration_date);
      if (days !== null && days <= 30) {
        const exists = await notificationExists(
          userId, 'compliance', item.id,
          NOTIFICATION_TYPES.DOCUMENT_EXPIRY_COMPLIANCE,
          item.expiration_date
        );

        if (!exists) {
          try {
            await NotificationService.createNotification({
              userId: item.user_id,
              title: `${item.title} ${days <= 0 ? 'Expired' : 'Expiring'}`,
              message: days <= 0
                ? `${item.title} for ${item.entity_name || 'your business'} has expired! Immediate action required.`
                : `${item.title} for ${item.entity_name || 'your business'} expires in ${days} day${days !== 1 ? 's' : ''}. Renewal recommended.`,
              type: NOTIFICATION_TYPES.DOCUMENT_EXPIRY_COMPLIANCE,
              entityType: 'compliance',
              entityId: item.id,
              linkTo: `/dashboard/compliance`,
              dueDate: item.expiration_date,
              urgency: getUrgency(days)
            });
            results.created++;
          } catch (e) {
            results.errors.push(`Compliance ${item.title}: ${e.message}`);
          }
        } else {
          results.skipped++;
        }
      }
    }
  } catch (error) {
    results.errors.push(`Compliance fetch error: ${error.message}`);
  }

  return results;
}

/**
 * Backfill notifications for all maintenance records due soon
 */
export async function backfillMaintenanceNotifications(userId) {
  const results = { created: 0, skipped: 0, errors: [] };

  try {
    const { data: records, error } = await supabase
      .from('maintenance_records')
      .select(`
        id, maintenance_type, user_id, due_date, status,
        trucks:truck_id (id, name, make, model)
      `)
      .eq('user_id', userId)
      .neq('status', 'Completed')
      .not('due_date', 'is', null);

    if (error) throw error;

    for (const record of records || []) {
      const days = getDaysUntil(record.due_date);
      // Maintenance uses 14-day window
      if (days !== null && days <= 14) {
        const exists = await notificationExists(
          userId, 'maintenance', record.id,
          NOTIFICATION_TYPES.MAINTENANCE_DUE,
          record.due_date
        );

        if (!exists) {
          try {
            const truckName = record.trucks?.name || record.trucks?.make || 'Vehicle';
            await NotificationService.createNotification({
              userId: record.user_id,
              title: `Maintenance ${days <= 0 ? 'Overdue' : 'Due'} - ${record.maintenance_type}`,
              message: days <= 0
                ? `${record.maintenance_type} for ${truckName} is overdue by ${Math.abs(days)} day${Math.abs(days) !== 1 ? 's' : ''}! Schedule service immediately.`
                : `${record.maintenance_type} for ${truckName} is due in ${days} day${days !== 1 ? 's' : ''}. Schedule service soon.`,
              type: NOTIFICATION_TYPES.MAINTENANCE_DUE,
              entityType: 'maintenance',
              entityId: record.id,
              linkTo: `/dashboard/fleet?tab=maintenance`,
              dueDate: record.due_date,
              urgency: days <= 0 ? URGENCY_LEVELS.HIGH : days <= 3 ? URGENCY_LEVELS.MEDIUM : URGENCY_LEVELS.NORMAL
            });
            results.created++;
          } catch (e) {
            results.errors.push(`Maintenance ${record.maintenance_type}: ${e.message}`);
          }
        } else {
          results.skipped++;
        }
      }
    }
  } catch (error) {
    results.errors.push(`Maintenance fetch error: ${error.message}`);
  }

  return results;
}

/**
 * Run full backfill for all notification types
 */
export async function runFullBackfill(userId) {
  console.log('Starting notification backfill for user:', userId);

  const results = {
    vehicles: await backfillVehicleNotifications(userId),
    drivers: await backfillDriverNotifications(userId),
    compliance: await backfillComplianceNotifications(userId),
    maintenance: await backfillMaintenanceNotifications(userId),
    summary: {
      totalCreated: 0,
      totalSkipped: 0,
      totalErrors: 0
    }
  };

  // Calculate summary
  results.summary.totalCreated =
    results.vehicles.created +
    results.drivers.created +
    results.compliance.created +
    results.maintenance.created;

  results.summary.totalSkipped =
    results.vehicles.skipped +
    results.drivers.skipped +
    results.compliance.skipped +
    results.maintenance.skipped;

  results.summary.totalErrors =
    results.vehicles.errors.length +
    results.drivers.errors.length +
    results.compliance.errors.length +
    results.maintenance.errors.length;

  console.log('Backfill complete:', results.summary);

  return results;
}

export default {
  backfillVehicleNotifications,
  backfillDriverNotifications,
  backfillComplianceNotifications,
  backfillMaintenanceNotifications,
  runFullBackfill
};
