/**
 * ELD Sync Cron Job
 *
 * Scheduled job that runs hourly to sync ELD data for all active connections.
 * Syncs vehicles, drivers, HOS logs, IFTA mileage, GPS locations, and fault codes.
 *
 * Should be triggered via Vercel Cron or external scheduler.
 * Requires CRON_SECRET header for authentication.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getConnectionsNeedingSync, updateConnectionStatus, updateLastSync } from '@/lib/services/eld/eldConnectionService';
import {
  syncVehicles,
  syncDrivers,
  syncIftaMileage,
  syncHosLogs,
  syncVehicleLocations,
  syncFaultCodes
} from '@/lib/services/eld/eldSyncService';
import { hasFeature } from '@/config/tierConfig';

const DEBUG = process.env.NODE_ENV === 'development';
const log = (...args) => DEBUG && console.log('[cron/eld-sync]', ...args);

// Initialize Supabase admin client
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

/**
 * GET /api/cron/eld-sync
 *
 * Runs scheduled ELD data sync for all active connections.
 * This should be called hourly via Vercel Cron.
 */
export async function GET(request) {
  const startTime = Date.now();

  try {
    // Verify cron secret for security - REQUIRED in production
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // SECURITY: Always require CRON_SECRET - do not allow bypass
    if (!cronSecret) {
      log('CRON_SECRET environment variable is not set');
      return NextResponse.json(
        { error: 'Server configuration error: CRON_SECRET not set' },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    log('Starting ELD sync cron job');

    const results = {
      timestamp: new Date().toISOString(),
      connectionsProcessed: 0,
      syncResults: [],
      errors: []
    };

    // Get all connections that need syncing (last sync > 60 minutes ago or never synced)
    const connectionsResult = await getConnectionsNeedingSync(60);

    if (connectionsResult.error) {
      log('Error getting connections:', connectionsResult.errorMessage);
      return NextResponse.json({
        success: false,
        error: connectionsResult.errorMessage
      }, { status: 500 });
    }

    const connections = connectionsResult.data || [];
    log(`Found ${connections.length} connections needing sync`);

    // Process each connection
    for (const connection of connections) {
      const connectionResult = {
        connectionId: connection.id,
        userId: connection.user_id,
        provider: connection.eld_provider_name,
        syncs: {},
        success: true,
        error: null
      };

      try {
        // Get user's subscription to check feature access
        const { data: subscription } = await supabaseAdmin
          .from('subscriptions')
          .select('plan, status')
          .eq('user_id', connection.user_id)
          .single();

        const userPlan = subscription?.plan || 'basic';

        // Check if user still has ELD access
        if (!hasFeature(userPlan, 'eldIntegration')) {
          log(`User ${connection.user_id} no longer has ELD access`);
          connectionResult.success = false;
          connectionResult.error = 'User subscription does not include ELD access';
          results.syncResults.push(connectionResult);
          continue;
        }

        // Sync vehicles and drivers (basic sync)
        try {
          const vehicleResult = await syncVehicles(connection.user_id, connection.id);
          connectionResult.syncs.vehicles = {
            success: !vehicleResult.error,
            count: vehicleResult.recordsSynced || 0
          };
        } catch (err) {
          connectionResult.syncs.vehicles = { success: false, error: err.message };
        }

        try {
          const driverResult = await syncDrivers(connection.user_id, connection.id);
          connectionResult.syncs.drivers = {
            success: !driverResult.error,
            count: driverResult.recordsSynced || 0
          };
        } catch (err) {
          connectionResult.syncs.drivers = { success: false, error: err.message };
        }

        // Sync HOS logs (last 24 hours) - Premium+
        if (hasFeature(userPlan, 'eldHosTracking')) {
          try {
            const endTime = new Date();
            const startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000);
            const hosResult = await syncHosLogs(
              connection.user_id,
              connection.id,
              startTime.toISOString(),
              endTime.toISOString()
            );
            connectionResult.syncs.hos = {
              success: !hosResult.error,
              count: hosResult.recordsSynced || 0
            };

            // Check for HOS violations and create notifications
            await checkHosViolations(connection.user_id, connection.id);
          } catch (err) {
            connectionResult.syncs.hos = { success: false, error: err.message };
          }
        }

        // Sync IFTA mileage (current quarter) - Premium+
        if (hasFeature(userPlan, 'eldIftaSync')) {
          try {
            const now = new Date();
            const startMonth = getQuarterStartMonth(now);
            const endMonth = getQuarterEndMonth(now);
            const iftaResult = await syncIftaMileage(
              connection.user_id,
              connection.id,
              startMonth,
              endMonth
            );
            connectionResult.syncs.ifta = {
              success: !iftaResult.error,
              count: iftaResult.recordsSynced || 0
            };
          } catch (err) {
            connectionResult.syncs.ifta = { success: false, error: err.message };
          }
        }

        // Sync GPS locations - Fleet+
        if (hasFeature(userPlan, 'eldGpsTracking')) {
          try {
            const locationResult = await syncVehicleLocations(connection.user_id, connection.id);
            connectionResult.syncs.locations = {
              success: !locationResult.error,
              count: locationResult.recordsSynced || 0
            };
          } catch (err) {
            connectionResult.syncs.locations = { success: false, error: err.message };
          }
        }

        // Sync fault codes - Fleet+
        if (hasFeature(userPlan, 'eldDiagnostics')) {
          try {
            const faultResult = await syncFaultCodes(connection.user_id, connection.id);
            connectionResult.syncs.faults = {
              success: !faultResult.error,
              count: faultResult.recordsSynced || 0
            };

            // Check for critical fault codes and create notifications
            await checkCriticalFaults(connection.user_id, connection.id);
          } catch (err) {
            connectionResult.syncs.faults = { success: false, error: err.message };
          }
        }

        // Update last sync timestamp
        await updateLastSync(connection.id);

        // Update connection status to active if all syncs succeeded
        const allSyncsSuccess = Object.values(connectionResult.syncs)
          .every(sync => sync.success !== false);

        if (allSyncsSuccess) {
          await updateConnectionStatus(connection.id, 'active');
        }

      } catch (error) {
        log(`Error syncing connection ${connection.id}:`, error);
        connectionResult.success = false;
        connectionResult.error = error.message;

        // Update connection status to error
        await updateConnectionStatus(connection.id, 'error', error.message);

        results.errors.push({
          connectionId: connection.id,
          error: error.message
        });
      }

      results.syncResults.push(connectionResult);
      results.connectionsProcessed++;
    }

    const duration = Date.now() - startTime;
    log(`ELD sync completed in ${duration}ms, processed ${results.connectionsProcessed} connections`);

    return NextResponse.json({
      success: true,
      duration: `${duration}ms`,
      ...results
    });

  } catch (error) {
    log('Cron job error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

/**
 * Check for HOS violations and create notifications
 */
async function checkHosViolations(userId, connectionId) {
  try {
    // Get recent HOS daily logs with violations
    const { data: dailyLogs } = await supabaseAdmin
      .from('eld_hos_daily_logs')
      .select('*')
      .eq('connection_id', connectionId)
      .eq('has_violation', true)
      .gte('log_date', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

    for (const log of (dailyLogs || [])) {
      // Check if we already notified for this violation today
      const { data: existingNotif } = await supabaseAdmin
        .from('notifications')
        .select('id')
        .eq('user_id', userId)
        .eq('entity_id', log.id)
        .eq('notification_type', 'HOS_VIOLATION_OCCURRED')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .maybeSingle();

      if (!existingNotif && log.violations) {
        // Get driver name
        const { data: mapping } = await supabaseAdmin
          .from('eld_entity_mappings')
          .select('drivers(first_name, last_name)')
          .eq('external_driver_id', log.external_driver_id)
          .eq('connection_id', connectionId)
          .maybeSingle();

        const driverName = mapping?.drivers
          ? `${mapping.drivers.first_name} ${mapping.drivers.last_name}`
          : 'Driver';

        // Create violation notification
        await supabaseAdmin.rpc('create_notification', {
          p_user_id: userId,
          p_title: 'HOS Violation Detected',
          p_message: `${driverName} has an HOS violation on ${log.log_date}. ${Array.isArray(log.violations) ? log.violations.join(', ') : log.violations}`,
          p_notification_type: 'HOS_VIOLATION_OCCURRED',
          p_entity_type: 'hos',
          p_entity_id: log.id,
          p_link_to: '/dashboard/fleet',
          p_due_date: null,
          p_urgency: 'CRITICAL'
        });
      }
    }
  } catch (error) {
    log('Error checking HOS violations:', error);
    // Non-critical, don't throw
  }
}

/**
 * Check for critical fault codes and create notifications
 */
async function checkCriticalFaults(userId, connectionId) {
  try {
    // Get recent unnotified critical/high severity faults
    const { data: faults } = await supabaseAdmin
      .from('eld_fault_codes')
      .select('*')
      .eq('connection_id', connectionId)
      .in('severity', ['critical', 'high'])
      .eq('is_active', true)
      .gte('detected_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    for (const fault of (faults || [])) {
      // Check if we already notified for this fault
      const { data: existingNotif } = await supabaseAdmin
        .from('notifications')
        .select('id')
        .eq('user_id', userId)
        .eq('entity_id', fault.id)
        .eq('notification_type', 'VEHICLE_FAULT_CODE')
        .maybeSingle();

      if (!existingNotif) {
        // Get vehicle name
        const { data: mapping } = await supabaseAdmin
          .from('eld_entity_mappings')
          .select('vehicles(name, license_plate)')
          .eq('external_vehicle_id', fault.external_vehicle_id)
          .eq('connection_id', connectionId)
          .maybeSingle();

        const vehicleName = mapping?.vehicles?.name || mapping?.vehicles?.license_plate || 'Vehicle';

        // Create fault notification
        await supabaseAdmin.rpc('create_notification', {
          p_user_id: userId,
          p_title: `Vehicle Alert: ${fault.fault_code}`,
          p_message: `${vehicleName}: ${fault.description || fault.fault_code}`,
          p_notification_type: 'VEHICLE_FAULT_CODE',
          p_entity_type: 'fault',
          p_entity_id: fault.id,
          p_link_to: '/dashboard/fleet',
          p_due_date: null,
          p_urgency: fault.severity === 'critical' ? 'CRITICAL' : 'HIGH'
        });
      }
    }
  } catch (error) {
    log('Error checking critical faults:', error);
    // Non-critical, don't throw
  }
}

/**
 * Get quarter start month in YYYY-MM format
 */
function getQuarterStartMonth(date) {
  const quarter = Math.floor(date.getMonth() / 3);
  const startMonth = quarter * 3 + 1;
  return `${date.getFullYear()}-${startMonth.toString().padStart(2, '0')}`;
}

/**
 * Get quarter end month in YYYY-MM format
 */
function getQuarterEndMonth(date) {
  const quarter = Math.floor(date.getMonth() / 3);
  const endMonth = quarter * 3 + 3;
  return `${date.getFullYear()}-${endMonth.toString().padStart(2, '0')}`;
}

// Support POST requests as well (for manual triggering)
export async function POST(request) {
  return GET(request);
}
