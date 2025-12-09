// src/app/api/notifications/backfill/route.js
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Helper functions
function getDaysUntil(dateString) {
  if (!dateString) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = new Date(dateString);
  targetDate.setHours(0, 0, 0, 0);
  return Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));
}

function getUrgency(days, isCritical = false) {
  if (days <= 0) return isCritical ? 'CRITICAL' : 'HIGH';
  if (days <= 7) return isCritical ? 'HIGH' : 'MEDIUM';
  if (days <= 14) return 'MEDIUM';
  return 'NORMAL';
}

async function createNotificationIfNotExists(supabase, notification) {
  // Check if similar notification already exists
  const { data: existing } = await supabase
    .from('notifications')
    .select('id')
    .eq('user_id', notification.user_id)
    .eq('entity_type', notification.entity_type)
    .eq('entity_id', notification.entity_id)
    .eq('notification_type', notification.notification_type)
    .limit(1);

  if (existing && existing.length > 0) {
    return { created: false, reason: 'exists' };
  }

  const { error } = await supabase
    .from('notifications')
    .insert([{
      ...notification,
      is_read: false,
      created_at: new Date().toISOString()
    }]);

  if (error) {
    return { created: false, reason: error.message };
  }

  return { created: true };
}

export async function POST(request) {
  try {
    // Get the user from the request body or auth
    const body = await request.json();
    const userId = body.userId;

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const results = {
      vehicles: { created: 0, skipped: 0, errors: [] },
      drivers: { created: 0, skipped: 0, errors: [] },
      compliance: { created: 0, skipped: 0, errors: [] },
      maintenance: { created: 0, skipped: 0, errors: [] }
    };

    // 1. Backfill Vehicle Notifications
    const { data: vehicles } = await supabaseAdmin
      .from('vehicles')
      .select('id, name, make, model, user_id, registration_expiry, insurance_expiry, inspection_expiry')
      .eq('user_id', userId);

    for (const vehicle of vehicles || []) {
      const truckName = vehicle.name || `${vehicle.make} ${vehicle.model}`;

      // Registration
      if (vehicle.registration_expiry) {
        const days = getDaysUntil(vehicle.registration_expiry);
        if (days !== null && days <= 30) {
          const result = await createNotificationIfNotExists(supabaseAdmin, {
            user_id: userId,
            title: `Registration ${days <= 0 ? 'Expired' : 'Expiring'} - ${truckName}`,
            message: days <= 0
              ? `${truckName}'s registration has expired! Immediate renewal required.`
              : `${truckName}'s registration expires in ${days} day${days !== 1 ? 's' : ''}.`,
            notification_type: 'DOCUMENT_EXPIRY_COMPLIANCE',
            entity_type: 'vehicle',
            entity_id: vehicle.id,
            link_to: '/dashboard/fleet?tab=trucks',
            due_date: vehicle.registration_expiry,
            urgency: getUrgency(days)
          });
          result.created ? results.vehicles.created++ : results.vehicles.skipped++;
        }
      }

      // Insurance
      if (vehicle.insurance_expiry) {
        const days = getDaysUntil(vehicle.insurance_expiry);
        if (days !== null && days <= 30) {
          const result = await createNotificationIfNotExists(supabaseAdmin, {
            user_id: userId,
            title: `Insurance ${days <= 0 ? 'Expired' : 'Expiring'} - ${truckName}`,
            message: days <= 0
              ? `${truckName}'s insurance has expired! Vehicle cannot be legally operated.`
              : `${truckName}'s insurance expires in ${days} day${days !== 1 ? 's' : ''}.`,
            notification_type: 'DOCUMENT_EXPIRY_COMPLIANCE',
            entity_type: 'vehicle',
            entity_id: vehicle.id,
            link_to: '/dashboard/fleet?tab=trucks',
            due_date: vehicle.insurance_expiry,
            urgency: getUrgency(days, true)
          });
          result.created ? results.vehicles.created++ : results.vehicles.skipped++;
        }
      }

      // Inspection
      if (vehicle.inspection_expiry) {
        const days = getDaysUntil(vehicle.inspection_expiry);
        if (days !== null && days <= 30) {
          const result = await createNotificationIfNotExists(supabaseAdmin, {
            user_id: userId,
            title: `Inspection ${days <= 0 ? 'Expired' : 'Due'} - ${truckName}`,
            message: days <= 0
              ? `${truckName}'s inspection has expired! Schedule immediately.`
              : `${truckName}'s inspection expires in ${days} day${days !== 1 ? 's' : ''}.`,
            notification_type: 'DOCUMENT_EXPIRY_COMPLIANCE',
            entity_type: 'vehicle',
            entity_id: vehicle.id,
            link_to: '/dashboard/fleet?tab=trucks',
            due_date: vehicle.inspection_expiry,
            urgency: getUrgency(days)
          });
          result.created ? results.vehicles.created++ : results.vehicles.skipped++;
        }
      }
    }

    // 2. Backfill Driver Notifications
    const { data: drivers } = await supabaseAdmin
      .from('drivers')
      .select('id, name, user_id, license_expiry, medical_card_expiry')
      .eq('user_id', userId);

    for (const driver of drivers || []) {
      // License
      if (driver.license_expiry) {
        const days = getDaysUntil(driver.license_expiry);
        if (days !== null && days <= 30) {
          const result = await createNotificationIfNotExists(supabaseAdmin, {
            user_id: userId,
            title: `CDL ${days <= 0 ? 'Expired' : 'Expiring'} - ${driver.name}`,
            message: days <= 0
              ? `${driver.name}'s CDL has expired! Driver cannot legally operate.`
              : `${driver.name}'s CDL expires in ${days} day${days !== 1 ? 's' : ''}.`,
            notification_type: 'DOCUMENT_EXPIRY_DRIVER_LICENSE',
            entity_type: 'driver',
            entity_id: driver.id,
            link_to: '/dashboard/fleet?tab=drivers',
            due_date: driver.license_expiry,
            urgency: getUrgency(days, true)
          });
          result.created ? results.drivers.created++ : results.drivers.skipped++;
        }
      }

      // Medical Card
      if (driver.medical_card_expiry) {
        const days = getDaysUntil(driver.medical_card_expiry);
        if (days !== null && days <= 30) {
          const result = await createNotificationIfNotExists(supabaseAdmin, {
            user_id: userId,
            title: `Medical Card ${days <= 0 ? 'Expired' : 'Expiring'} - ${driver.name}`,
            message: days <= 0
              ? `${driver.name}'s medical card has expired! Driver cannot legally operate.`
              : `${driver.name}'s medical card expires in ${days} day${days !== 1 ? 's' : ''}.`,
            notification_type: 'DOCUMENT_EXPIRY_DRIVER_MEDICAL',
            entity_type: 'driver',
            entity_id: driver.id,
            link_to: '/dashboard/fleet?tab=drivers',
            due_date: driver.medical_card_expiry,
            urgency: getUrgency(days, true)
          });
          result.created ? results.drivers.created++ : results.drivers.skipped++;
        }
      }
    }

    // 3. Backfill Compliance Notifications
    const { data: compliance } = await supabaseAdmin
      .from('compliance_items')
      .select('id, title, entity_name, user_id, expiration_date')
      .eq('user_id', userId)
      .not('expiration_date', 'is', null);

    for (const item of compliance || []) {
      const days = getDaysUntil(item.expiration_date);
      if (days !== null && days <= 30) {
        const result = await createNotificationIfNotExists(supabaseAdmin, {
          user_id: userId,
          title: `${item.title} ${days <= 0 ? 'Expired' : 'Expiring'}`,
          message: days <= 0
            ? `${item.title} for ${item.entity_name || 'your business'} has expired!`
            : `${item.title} for ${item.entity_name || 'your business'} expires in ${days} day${days !== 1 ? 's' : ''}.`,
          notification_type: 'DOCUMENT_EXPIRY_COMPLIANCE',
          entity_type: 'compliance',
          entity_id: item.id,
          link_to: '/dashboard/compliance',
          due_date: item.expiration_date,
          urgency: getUrgency(days)
        });
        result.created ? results.compliance.created++ : results.compliance.skipped++;
      }
    }

    // 4. Backfill Maintenance Notifications
    const { data: maintenance } = await supabaseAdmin
      .from('maintenance_records')
      .select(`
        id, maintenance_type, user_id, due_date, status,
        trucks:truck_id (id, name, make, model)
      `)
      .eq('user_id', userId)
      .neq('status', 'Completed')
      .not('due_date', 'is', null);

    for (const record of maintenance || []) {
      const days = getDaysUntil(record.due_date);
      if (days !== null && days <= 14) {
        const truckName = record.trucks?.name || record.trucks?.make || 'Vehicle';
        const result = await createNotificationIfNotExists(supabaseAdmin, {
          user_id: userId,
          title: `Maintenance ${days <= 0 ? 'Overdue' : 'Due'} - ${record.maintenance_type}`,
          message: days <= 0
            ? `${record.maintenance_type} for ${truckName} is overdue by ${Math.abs(days)} day${Math.abs(days) !== 1 ? 's' : ''}!`
            : `${record.maintenance_type} for ${truckName} is due in ${days} day${days !== 1 ? 's' : ''}.`,
          notification_type: 'MAINTENANCE_DUE',
          entity_type: 'maintenance',
          entity_id: record.id,
          link_to: '/dashboard/fleet?tab=maintenance',
          due_date: record.due_date,
          urgency: days <= 0 ? 'HIGH' : days <= 3 ? 'MEDIUM' : 'NORMAL'
        });
        result.created ? results.maintenance.created++ : results.maintenance.skipped++;
      }
    }

    // Calculate totals
    const summary = {
      totalCreated: results.vehicles.created + results.drivers.created + results.compliance.created + results.maintenance.created,
      totalSkipped: results.vehicles.skipped + results.drivers.skipped + results.compliance.skipped + results.maintenance.skipped,
      breakdown: results
    };

    return NextResponse.json({
      success: true,
      message: `Backfill complete: ${summary.totalCreated} notifications created, ${summary.totalSkipped} skipped (already exist)`,
      ...summary
    });

  } catch (error) {
    console.error('Notification backfill error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
