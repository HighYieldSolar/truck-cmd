import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Cron job endpoint for automated notification generation
 * This should be called daily (e.g., via Vercel Cron or external scheduler)
 *
 * Handles:
 * - Compliance document expiration notifications
 * - Driver license/medical card expiration notifications
 * - Overdue invoice notifications
 * - IFTA quarterly deadline notifications
 * - Upcoming delivery reminders
 * - Maintenance due reminders
 * - Cleanup of old read notifications
 */
export async function GET(request) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // Allow execution if no secret is set (development) or secret matches
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Use service role key for admin access
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const results = {
      timestamp: new Date().toISOString(),
      compliance: { count: 0, error: null },
      overdueInvoices: { count: 0, error: null },
      iftaDeadlines: { count: 0, error: null },
      upcomingDeliveries: { count: 0, error: null },
      maintenanceDue: { count: 0, error: null },
      cleanup: { count: 0, error: null }
    };

    // 1. Generate compliance notifications (existing RPC function)
    try {
      const { data: complianceCount, error } = await supabaseAdmin.rpc('generate_compliance_notifications');
      if (error) throw error;
      results.compliance.count = complianceCount || 0;
    } catch (err) {
      results.compliance.error = err.message;
      console.error('Compliance notifications error:', err);
    }

    // 2. Check for overdue invoices and create notifications
    try {
      const overdueCount = await generateOverdueInvoiceNotifications(supabaseAdmin);
      results.overdueInvoices.count = overdueCount;
    } catch (err) {
      results.overdueInvoices.error = err.message;
      console.error('Overdue invoices error:', err);
    }

    // 3. Generate IFTA deadline notifications
    try {
      const iftaCount = await generateIFTADeadlineNotifications(supabaseAdmin);
      results.iftaDeadlines.count = iftaCount;
    } catch (err) {
      results.iftaDeadlines.error = err.message;
      console.error('IFTA deadlines error:', err);
    }

    // 4. Generate upcoming delivery reminders
    try {
      const deliveryCount = await generateUpcomingDeliveryNotifications(supabaseAdmin);
      results.upcomingDeliveries.count = deliveryCount;
    } catch (err) {
      results.upcomingDeliveries.error = err.message;
      console.error('Upcoming deliveries error:', err);
    }

    // 5. Generate maintenance due notifications
    try {
      const maintenanceCount = await generateMaintenanceDueNotifications(supabaseAdmin);
      results.maintenanceDue.count = maintenanceCount;
    } catch (err) {
      results.maintenanceDue.error = err.message;
      console.error('Maintenance due error:', err);
    }

    // 6. Cleanup old read notifications
    try {
      const { data: cleanupCount, error } = await supabaseAdmin.rpc('cleanup_old_notifications');
      if (error) throw error;
      results.cleanup.count = cleanupCount || 0;
    } catch (err) {
      results.cleanup.error = err.message;
      console.error('Cleanup error:', err);
    }

    // Calculate total notifications created
    const totalCreated =
      results.compliance.count +
      results.overdueInvoices.count +
      results.iftaDeadlines.count +
      results.upcomingDeliveries.count +
      results.maintenanceDue.count;

    return NextResponse.json({
      success: true,
      totalNotificationsCreated: totalCreated,
      totalCleanedUp: results.cleanup.count,
      details: results
    });

  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * Generate notifications for overdue invoices
 */
async function generateOverdueInvoiceNotifications(supabase) {
  const today = new Date().toISOString().split('T')[0];
  let count = 0;

  // Find all overdue invoices across all users
  const { data: overdueInvoices, error } = await supabase
    .from('invoices')
    .select('id, user_id, invoice_number, customer, total, due_date')
    .in('status', ['Pending', 'Sent'])
    .lt('due_date', today);

  if (error) throw error;
  if (!overdueInvoices || overdueInvoices.length === 0) return 0;

  for (const invoice of overdueInvoices) {
    // Check if notification already exists (within last 7 days)
    const { data: existingNotif } = await supabase
      .from('notifications')
      .select('id')
      .eq('user_id', invoice.user_id)
      .eq('entity_id', invoice.id)
      .eq('notification_type', 'INVOICE_OVERDUE')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .maybeSingle();

    if (!existingNotif) {
      const daysPastDue = Math.floor((new Date() - new Date(invoice.due_date)) / (1000 * 60 * 60 * 24));
      const urgency = daysPastDue > 30 ? 'CRITICAL' : daysPastDue > 7 ? 'HIGH' : 'MEDIUM';

      const { error: insertError } = await supabase.rpc('create_notification', {
        p_user_id: invoice.user_id,
        p_title: `Invoice ${invoice.invoice_number} Overdue`,
        p_message: `Invoice for ${invoice.customer} ($${invoice.total?.toLocaleString() || 0}) is ${daysPastDue} day${daysPastDue > 1 ? 's' : ''} past due.`,
        p_notification_type: 'INVOICE_OVERDUE',
        p_entity_type: 'invoice',
        p_entity_id: invoice.id,
        p_link_to: `/dashboard/invoices/${invoice.id}`,
        p_due_date: invoice.due_date,
        p_urgency: urgency
      });

      if (!insertError) {
        count++;
        // Update invoice status to Overdue
        await supabase
          .from('invoices')
          .update({ status: 'Overdue' })
          .eq('id', invoice.id);
      }
    }
  }

  return count;
}

/**
 * Generate IFTA quarterly deadline notifications
 * IFTA deadlines: Q1 (Apr 30), Q2 (Jul 31), Q3 (Oct 31), Q4 (Jan 31)
 */
async function generateIFTADeadlineNotifications(supabase) {
  const today = new Date();
  let count = 0;

  // Define IFTA deadlines for current and next year
  const year = today.getFullYear();
  const deadlines = [
    { quarter: 'Q1', deadline: new Date(year, 3, 30), description: 'January - March' }, // Apr 30
    { quarter: 'Q2', deadline: new Date(year, 6, 31), description: 'April - June' }, // Jul 31
    { quarter: 'Q3', deadline: new Date(year, 9, 31), description: 'July - September' }, // Oct 31
    { quarter: 'Q4', deadline: new Date(year + 1, 0, 31), description: 'October - December' } // Jan 31 next year
  ];

  // Find the next upcoming deadline
  const upcomingDeadline = deadlines.find(d => d.deadline > today);
  if (!upcomingDeadline) return 0;

  const daysUntil = Math.floor((upcomingDeadline.deadline - today) / (1000 * 60 * 60 * 24));

  // Only notify at 30, 14, 7, 3, and 1 days before deadline
  if (![30, 14, 7, 3, 1].includes(daysUntil)) return 0;

  // Get all users (those who might need IFTA filing)
  const { data: users, error } = await supabase
    .from('users')
    .select('id');

  if (error) throw error;
  if (!users || users.length === 0) return 0;

  const urgency = daysUntil <= 3 ? 'CRITICAL' : daysUntil <= 7 ? 'HIGH' : daysUntil <= 14 ? 'MEDIUM' : 'LOW';

  for (const user of users) {
    // Check if notification already exists for this deadline
    const { data: existingNotif } = await supabase
      .from('notifications')
      .select('id')
      .eq('user_id', user.id)
      .eq('notification_type', 'IFTA_DEADLINE')
      .eq('urgency', urgency)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Within last 24 hours
      .maybeSingle();

    if (!existingNotif) {
      const { error: insertError } = await supabase.rpc('create_notification', {
        p_user_id: user.id,
        p_title: `IFTA ${upcomingDeadline.quarter} Filing Due in ${daysUntil} Day${daysUntil > 1 ? 's' : ''}`,
        p_message: `Your IFTA ${upcomingDeadline.quarter} report (${upcomingDeadline.description}) is due on ${upcomingDeadline.deadline.toLocaleDateString()}. ${daysUntil <= 7 ? 'File now to avoid penalties!' : 'Prepare your fuel receipts and mileage records.'}`,
        p_notification_type: 'IFTA_DEADLINE',
        p_entity_type: 'ifta',
        p_entity_id: `${year}-${upcomingDeadline.quarter}`,
        p_link_to: '/dashboard/ifta',
        p_due_date: upcomingDeadline.deadline.toISOString(),
        p_urgency: urgency
      });

      if (!insertError) count++;
    }
  }

  return count;
}

/**
 * Generate notifications for upcoming deliveries (24 hours before)
 */
async function generateUpcomingDeliveryNotifications(supabase) {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const tomorrowDate = tomorrow.toISOString().split('T')[0];
  let count = 0;

  // Find loads with delivery date tomorrow that are in transit
  const { data: upcomingDeliveries, error } = await supabase
    .from('loads')
    .select('id, user_id, load_number, customer, origin, destination, delivery_date, driver')
    .eq('delivery_date', tomorrowDate)
    .in('status', ['In Transit', 'Assigned']);

  if (error) throw error;
  if (!upcomingDeliveries || upcomingDeliveries.length === 0) return 0;

  for (const load of upcomingDeliveries) {
    // Check if notification already exists
    const { data: existingNotif } = await supabase
      .from('notifications')
      .select('id')
      .eq('user_id', load.user_id)
      .eq('entity_id', load.id)
      .eq('notification_type', 'DELIVERY_UPCOMING')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .maybeSingle();

    if (!existingNotif) {
      const { error: insertError } = await supabase.rpc('create_notification', {
        p_user_id: load.user_id,
        p_title: `Delivery Tomorrow - Load ${load.load_number}`,
        p_message: `Load ${load.load_number} for ${load.customer} is scheduled for delivery tomorrow to ${load.destination}.${load.driver ? ` Driver: ${load.driver}` : ''}`,
        p_notification_type: 'DELIVERY_UPCOMING',
        p_entity_type: 'load',
        p_entity_id: load.id,
        p_link_to: '/dashboard/dispatching',
        p_due_date: load.delivery_date,
        p_urgency: 'MEDIUM'
      });

      if (!insertError) count++;
    }
  }

  return count;
}

/**
 * Generate notifications for maintenance due
 */
async function generateMaintenanceDueNotifications(supabase) {
  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  let count = 0;

  // Find maintenance records due within the next 7 days
  const { data: maintenanceRecords, error } = await supabase
    .from('maintenance_records')
    .select(`
      id, user_id, maintenance_type, description, due_date, status,
      vehicles (id, name, license_plate)
    `)
    .eq('status', 'Pending')
    .gte('due_date', today.toISOString().split('T')[0])
    .lte('due_date', nextWeek.toISOString().split('T')[0]);

  if (error) throw error;
  if (!maintenanceRecords || maintenanceRecords.length === 0) return 0;

  for (const record of maintenanceRecords) {
    const daysUntil = Math.floor((new Date(record.due_date) - today) / (1000 * 60 * 60 * 24));

    // Only notify at 7, 3, 1, and 0 days
    if (![7, 3, 1, 0].includes(daysUntil)) continue;

    // Check if notification already exists
    const { data: existingNotif } = await supabase
      .from('notifications')
      .select('id')
      .eq('user_id', record.user_id)
      .eq('entity_id', record.id)
      .eq('notification_type', 'MAINTENANCE_DUE')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .maybeSingle();

    if (!existingNotif) {
      const urgency = daysUntil === 0 ? 'CRITICAL' : daysUntil === 1 ? 'HIGH' : daysUntil <= 3 ? 'MEDIUM' : 'LOW';
      const vehicleName = record.vehicles?.name || record.vehicles?.license_plate || 'Vehicle';

      const { error: insertError } = await supabase.rpc('create_notification', {
        p_user_id: record.user_id,
        p_title: daysUntil === 0
          ? `Maintenance Due Today - ${vehicleName}`
          : `Maintenance Due in ${daysUntil} Day${daysUntil > 1 ? 's' : ''} - ${vehicleName}`,
        p_message: `${record.maintenance_type} for ${vehicleName} is ${daysUntil === 0 ? 'due today' : `due on ${new Date(record.due_date).toLocaleDateString()}`}. ${record.description || ''}`,
        p_notification_type: 'MAINTENANCE_DUE',
        p_entity_type: 'maintenance',
        p_entity_id: record.id,
        p_link_to: '/dashboard/fleet',
        p_due_date: record.due_date,
        p_urgency: urgency
      });

      if (!insertError) count++;
    }
  }

  return count;
}

// Support POST requests as well (for manual triggering)
export async function POST(request) {
  return GET(request);
}
