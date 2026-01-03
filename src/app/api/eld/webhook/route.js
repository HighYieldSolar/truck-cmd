/**
 * ELD Webhook Route
 *
 * Handles webhooks from Terminal (withterminal.com) for real-time data updates.
 * Supports events for sync completion, connection status changes, and data updates.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { updateConnectionStatus } from '@/lib/services/eld/eldConnectionService';
import {
  syncVehicles,
  syncDrivers,
  syncHosLogs,
  syncVehicleLocations,
  syncFaultCodes
} from '@/lib/services/eld/eldSyncService';

const DEBUG = process.env.NODE_ENV === 'development';
const log = (...args) => DEBUG && console.log('[eld/webhook]', ...args);

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
 * Verify Terminal webhook signature
 */
function verifyWebhookSignature(body, signature, secret) {
  if (!secret) {
    log('Warning: TERMINAL_WEBHOOK_SECRET not configured');
    return true; // Allow in development if not configured
  }

  // Terminal uses HMAC-SHA256 for webhook signatures
  const crypto = require('crypto');
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body, 'utf8')
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature || '', 'utf8'),
    Buffer.from(expectedSignature, 'utf8')
  );
}

/**
 * POST /api/eld/webhook
 *
 * Receives webhook events from Terminal API.
 * Event types:
 *   - sync.completed: Data sync finished
 *   - connection.status_changed: Connection status updated
 *   - connection.disconnected: User disconnected from provider
 *   - data.updated: New data available
 */
export async function POST(request) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-terminal-signature') ||
                     request.headers.get('x-webhook-signature');
    const webhookSecret = process.env.TERMINAL_WEBHOOK_SECRET;

    // Verify webhook signature in production
    if (process.env.NODE_ENV === 'production' && webhookSecret) {
      if (!verifyWebhookSignature(body, signature, webhookSecret)) {
        log('Invalid webhook signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const event = JSON.parse(body);
    log(`Received webhook event: ${event.type}`);

    // Route to appropriate handler
    switch (event.type) {
      case 'sync.completed':
        await handleSyncCompleted(event);
        break;

      case 'sync.failed':
        await handleSyncFailed(event);
        break;

      case 'connection.status_changed':
        await handleConnectionStatusChanged(event);
        break;

      case 'connection.disconnected':
        await handleConnectionDisconnected(event);
        break;

      case 'data.vehicles_updated':
        await handleVehiclesUpdated(event);
        break;

      case 'data.drivers_updated':
        await handleDriversUpdated(event);
        break;

      case 'data.hos_updated':
        await handleHosUpdated(event);
        break;

      case 'data.locations_updated':
        await handleLocationsUpdated(event);
        break;

      case 'data.safety_events':
        await handleSafetyEvents(event);
        break;

      default:
        log(`Unhandled webhook event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    log('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle sync.completed event
 */
async function handleSyncCompleted(event) {
  const { connectionId, syncId, dataTypes, recordCounts } = event.data || {};

  log(`Sync completed for connection ${connectionId}, sync ${syncId}`);
  log(`Data types synced: ${dataTypes?.join(', ')}, records: ${JSON.stringify(recordCounts)}`);

  // Find our connection by external ID
  const { data: connection } = await supabaseAdmin
    .from('eld_connections')
    .select('id, user_id')
    .eq('external_connection_id', connectionId)
    .single();

  if (!connection) {
    log(`Connection not found for external ID: ${connectionId}`);
    return;
  }

  // Update sync job status if we have the sync ID
  if (syncId) {
    await supabaseAdmin
      .from('eld_sync_jobs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        records_synced: recordCounts || {}
      })
      .eq('external_sync_id', syncId);
  }

  // Update connection last sync time
  await supabaseAdmin
    .from('eld_connections')
    .update({
      last_sync_at: new Date().toISOString(),
      status: 'active',
      error_message: null
    })
    .eq('id', connection.id);

  // Create success notification
  await createNotification(connection.user_id, {
    type: 'ELD_SYNC_COMPLETED',
    title: 'ELD Sync Complete',
    message: `Successfully synced ${Object.values(recordCounts || {}).reduce((a, b) => a + b, 0)} records from your ELD provider.`,
    data: { syncId, recordCounts }
  });
}

/**
 * Handle sync.failed event
 */
async function handleSyncFailed(event) {
  const { connectionId, syncId, error: errorMessage } = event.data || {};

  log(`Sync failed for connection ${connectionId}: ${errorMessage}`);

  // Find our connection
  const { data: connection } = await supabaseAdmin
    .from('eld_connections')
    .select('id, user_id')
    .eq('external_connection_id', connectionId)
    .single();

  if (!connection) return;

  // Update sync job status
  if (syncId) {
    await supabaseAdmin
      .from('eld_sync_jobs')
      .update({
        status: 'failed',
        error_message: errorMessage,
        completed_at: new Date().toISOString()
      })
      .eq('external_sync_id', syncId);
  }

  // Update connection status
  await updateConnectionStatus(connection.id, 'error', errorMessage);

  // Create error notification
  await createNotification(connection.user_id, {
    type: 'ELD_SYNC_FAILED',
    title: 'ELD Sync Failed',
    message: `Failed to sync data from your ELD provider: ${errorMessage}`,
    urgency: 'HIGH',
    data: { syncId, error: errorMessage }
  });
}

/**
 * Handle connection.status_changed event
 */
async function handleConnectionStatusChanged(event) {
  const { connectionId, status, message } = event.data || {};

  log(`Connection status changed: ${connectionId} -> ${status}`);

  const { data: connection } = await supabaseAdmin
    .from('eld_connections')
    .select('id, user_id')
    .eq('external_connection_id', connectionId)
    .single();

  if (!connection) return;

  // Map Terminal status to our status
  const statusMap = {
    'active': 'active',
    'inactive': 'disconnected',
    'error': 'error',
    'pending': 'pending'
  };

  const ourStatus = statusMap[status] || 'error';
  await updateConnectionStatus(connection.id, ourStatus, message);

  // Notify user of status change if it's an error
  if (ourStatus === 'error') {
    await createNotification(connection.user_id, {
      type: 'ELD_CONNECTION_ERROR',
      title: 'ELD Connection Issue',
      message: message || 'There was an issue with your ELD connection. Please reconnect.',
      urgency: 'HIGH'
    });
  }
}

/**
 * Handle connection.disconnected event
 */
async function handleConnectionDisconnected(event) {
  const { connectionId, reason } = event.data || {};

  log(`Connection disconnected: ${connectionId}, reason: ${reason}`);

  const { data: connection } = await supabaseAdmin
    .from('eld_connections')
    .select('id, user_id, eld_provider_name')
    .eq('external_connection_id', connectionId)
    .single();

  if (!connection) return;

  // Update connection status
  await supabaseAdmin
    .from('eld_connections')
    .update({
      status: 'disconnected',
      connection_token: null,
      error_message: reason,
      updated_at: new Date().toISOString()
    })
    .eq('id', connection.id);

  // Notify user
  await createNotification(connection.user_id, {
    type: 'ELD_DISCONNECTED',
    title: 'ELD Disconnected',
    message: `Your ${connection.eld_provider_name || 'ELD'} connection has been disconnected. ${reason || 'Please reconnect to continue syncing data.'}`,
    urgency: 'MEDIUM',
    linkTo: '/dashboard/settings?tab=eld'
  });
}

/**
 * Handle data.vehicles_updated event
 */
async function handleVehiclesUpdated(event) {
  const { connectionId, vehicles } = event.data || {};

  log(`Vehicles updated for connection ${connectionId}: ${vehicles?.length || 0} vehicles`);

  const { data: connection } = await supabaseAdmin
    .from('eld_connections')
    .select('id, user_id')
    .eq('external_connection_id', connectionId)
    .single();

  if (!connection) return;

  // Trigger a vehicles sync
  await syncVehicles(connection.user_id, connection.id);
}

/**
 * Handle data.drivers_updated event
 */
async function handleDriversUpdated(event) {
  const { connectionId, drivers } = event.data || {};

  log(`Drivers updated for connection ${connectionId}: ${drivers?.length || 0} drivers`);

  const { data: connection } = await supabaseAdmin
    .from('eld_connections')
    .select('id, user_id')
    .eq('external_connection_id', connectionId)
    .single();

  if (!connection) return;

  // Trigger a drivers sync
  await syncDrivers(connection.user_id, connection.id);
}

/**
 * Handle data.hos_updated event
 */
async function handleHosUpdated(event) {
  const { connectionId, driverId, hosStatus } = event.data || {};

  log(`HOS updated for connection ${connectionId}, driver ${driverId}`);

  const { data: connection } = await supabaseAdmin
    .from('eld_connections')
    .select('id, user_id')
    .eq('external_connection_id', connectionId)
    .single();

  if (!connection) return;

  // Sync HOS logs for the last 24 hours
  const endTime = new Date();
  const startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000);

  await syncHosLogs(
    connection.user_id,
    connection.id,
    startTime.toISOString(),
    endTime.toISOString()
  );

  // Check for HOS violations
  if (hosStatus?.violations?.length > 0) {
    for (const violation of hosStatus.violations) {
      await createNotification(connection.user_id, {
        type: 'HOS_VIOLATION_OCCURRED',
        title: 'HOS Violation Detected',
        message: `${violation.type}: ${violation.description}`,
        urgency: 'CRITICAL',
        data: { driverId, violation }
      });
    }
  }
}

/**
 * Handle data.locations_updated event
 */
async function handleLocationsUpdated(event) {
  const { connectionId, locations } = event.data || {};

  log(`Locations updated for connection ${connectionId}: ${locations?.length || 0} locations`);

  const { data: connection } = await supabaseAdmin
    .from('eld_connections')
    .select('id, user_id')
    .eq('external_connection_id', connectionId)
    .single();

  if (!connection) return;

  // Trigger a locations sync
  await syncVehicleLocations(connection.user_id, connection.id);
}

/**
 * Handle data.safety_events (fault codes, violations)
 */
async function handleSafetyEvents(event) {
  const { connectionId, events } = event.data || {};

  log(`Safety events for connection ${connectionId}: ${events?.length || 0} events`);

  const { data: connection } = await supabaseAdmin
    .from('eld_connections')
    .select('id, user_id')
    .eq('external_connection_id', connectionId)
    .single();

  if (!connection) return;

  // Sync fault codes
  await syncFaultCodes(connection.user_id, connection.id);

  // Create notifications for critical fault codes
  for (const safetyEvent of (events || [])) {
    if (safetyEvent.severity === 'critical' || safetyEvent.severity === 'high') {
      await createNotification(connection.user_id, {
        type: 'VEHICLE_FAULT_CODE',
        title: `Vehicle Alert: ${safetyEvent.code}`,
        message: safetyEvent.description || `Fault code ${safetyEvent.code} detected on vehicle`,
        urgency: safetyEvent.severity === 'critical' ? 'CRITICAL' : 'HIGH',
        data: { event: safetyEvent }
      });
    }
  }
}

/**
 * Helper to create notifications
 */
async function createNotification(userId, { type, title, message, urgency = 'MEDIUM', data = {}, linkTo = null }) {
  try {
    await supabaseAdmin.rpc('create_notification', {
      p_user_id: userId,
      p_title: title,
      p_message: message,
      p_notification_type: type,
      p_entity_type: 'eld',
      p_entity_id: null,
      p_link_to: linkTo || '/dashboard/settings?tab=eld',
      p_due_date: null,
      p_urgency: urgency
    });
  } catch (error) {
    log(`Error creating notification: ${error.message}`);
    // Non-critical, don't throw
  }
}
