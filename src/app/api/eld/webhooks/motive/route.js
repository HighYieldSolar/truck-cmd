/**
 * Motive ELD Webhook Endpoint
 *
 * Receives real-time events from Motive (KeepTruckin) ELD system:
 * - Vehicle GPS location updates
 * - Driver duty status changes (HOS)
 * - Vehicle fault codes
 * - Geofence events
 *
 * Motive webhooks require:
 * - Response within 3 seconds
 * - HMAC-SHA1 signature validation
 * - 200 OK response (otherwise retried)
 */

import { NextResponse } from 'next/server';
import { validateWebhook } from '@/lib/services/eld/webhooks/webhookSignatureService';
import {
  handleMotiveLocationUpdated,
  handleMotiveHosUpdate,
  handleMotiveFaultCode
} from '@/lib/services/eld/webhooks/webhookEventHandlers';
import { createClient } from '@supabase/supabase-js';

const DEBUG = process.env.NODE_ENV === 'development';
const log = (...args) => DEBUG && console.log('[MotiveWebhook]', ...args);

// Use service role for webhook processing (no user context)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Look up connection from webhook payload
 * Motive webhooks include company_id or we can match by vehicle/driver
 */
async function findConnectionFromPayload(payload) {
  try {
    // Try to find by company_id if present
    if (payload.company_id) {
      const { data } = await supabase
        .from('eld_connections')
        .select('id, user_id, metadata')
        .eq('provider', 'motive')
        .eq('external_connection_id', payload.company_id.toString())
        .eq('status', 'active')
        .single();

      if (data) {
        return { connectionId: data.id, userId: data.user_id, webhookSecret: data.metadata?.webhook_secret };
      }
    }

    // Try to find by vehicle_id from entity mappings
    if (payload.vehicle_id || payload.vehicle?.id) {
      const vehicleId = (payload.vehicle_id || payload.vehicle?.id).toString();
      const { data: mapping } = await supabase
        .from('eld_entity_mappings')
        .select('connection_id, user_id')
        .eq('external_id', vehicleId)
        .eq('entity_type', 'vehicle')
        .eq('provider', 'motive')
        .single();

      if (mapping) {
        // Get webhook secret from connection metadata
        const { data: conn } = await supabase
          .from('eld_connections')
          .select('metadata')
          .eq('id', mapping.connection_id)
          .single();
        return { connectionId: mapping.connection_id, userId: mapping.user_id, webhookSecret: conn?.metadata?.webhook_secret };
      }
    }

    // Try to find by driver id from entity mappings
    if (payload.driver?.id || payload.id) {
      const driverId = (payload.driver?.id || payload.id).toString();
      const { data: mapping } = await supabase
        .from('eld_entity_mappings')
        .select('connection_id, user_id')
        .eq('external_id', driverId)
        .eq('entity_type', 'driver')
        .eq('provider', 'motive')
        .single();

      if (mapping) {
        // Get webhook secret from connection metadata
        const { data: conn } = await supabase
          .from('eld_connections')
          .select('metadata')
          .eq('id', mapping.connection_id)
          .single();
        return { connectionId: mapping.connection_id, userId: mapping.user_id, webhookSecret: conn?.metadata?.webhook_secret };
      }
    }

    // Fall back to finding any active Motive connection (for initial setup)
    // This allows webhooks to work before entity mappings are created
    const { data: connections } = await supabase
      .from('eld_connections')
      .select('id, user_id, metadata')
      .eq('provider', 'motive')
      .eq('status', 'active')
      .limit(1);

    if (connections && connections.length > 0) {
      log('Using fallback connection lookup');
      return { connectionId: connections[0].id, userId: connections[0].user_id, webhookSecret: connections[0].metadata?.webhook_secret };
    }

    return null;
  } catch (error) {
    log('Error finding connection from payload:', error.message);
    return null;
  }
}

/**
 * Log webhook event for debugging and replay
 */
async function logWebhookEvent({ provider, eventType, rawPayload, status, error, connectionId, userId }) {
  try {
    const { data } = await supabase
      .from('eld_webhook_events')
      .insert({
        user_id: userId || null,
        connection_id: connectionId || null,
        provider: provider,
        event_type: eventType,
        payload: typeof rawPayload === 'string' ? { raw: rawPayload } : rawPayload,
        status: status,
        error_message: error || null,
        created_at: new Date().toISOString()
      })
      .select('id')
      .single();

    return data;
  } catch (err) {
    log('Error logging webhook event:', err.message);
    return null;
  }
}

/**
 * POST /api/eld/webhooks/motive
 *
 * Handles incoming Motive webhook events
 */
export async function POST(request) {
  const startTime = Date.now();

  try {
    // Get raw body for signature validation
    const rawBody = await request.text();
    const headers = request.headers;

    // Validate webhook signature
    const validation = validateWebhook('motive', rawBody, headers);

    if (!validation.valid) {
      log('Signature validation failed:', validation.error);
      await logWebhookEvent({
        provider: 'motive',
        eventType: 'signature_failed',
        rawPayload: rawBody.substring(0, 1000),
        status: 'rejected',
        error: validation.error
      });

      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Parse the payload
    const payload = JSON.parse(rawBody);

    // Handle Motive test/validation requests
    // Motive sends '[vehicle_location_updated]' or similar array during URL validation
    if (Array.isArray(payload)) {
      log('Received test/validation request:', payload);
      return NextResponse.json({
        success: true,
        message: 'Webhook URL validated successfully',
        test: true
      });
    }

    const eventType = payload.event_type || payload.type || payload.action;

    log(`Received event: ${eventType}`);

    // Look up connection from payload to get connectionId and userId
    const connectionInfo = await findConnectionFromPayload(payload);

    if (!connectionInfo) {
      log('No connection found for webhook payload, storing for later processing');
      // Still log the event even if we can't find a connection
      await logWebhookEvent({
        provider: 'motive',
        eventType,
        rawPayload: payload,
        status: 'pending',
        error: 'No matching connection found'
      });

      // Return 200 to acknowledge receipt (can be reprocessed later)
      return NextResponse.json({
        success: true,
        event: eventType,
        pending: true,
        message: 'Event stored for later processing'
      });
    }

    const { connectionId, userId } = connectionInfo;

    // Log the webhook event with connection info
    const webhookLog = await logWebhookEvent({
      provider: 'motive',
      eventType,
      rawPayload: payload,
      status: 'processing',
      connectionId,
      userId
    });

    // Route to appropriate handler based on event type
    let result;
    try {
      switch (eventType) {
        case 'vehicle_location_updated':
        case 'vehicle_location_received':
          result = await handleMotiveLocationUpdated(connectionId, userId, payload);
          break;

        case 'user_duty_status_updated':
        case 'hos_violation_upserted':
        case 'hos_log_created':
        case 'hos_log_updated':
          result = await handleMotiveHosUpdate(connectionId, userId, payload);
          break;

        case 'fault_code_opened':
        case 'fault_code_closed':
        case 'vehicle_fault_code':
          result = await handleMotiveFaultCode(connectionId, userId, payload, eventType);
          break;

        case 'vehicle_geofence_event':
        case 'geofence_entry':
        case 'geofence_exit':
          // Log geofence events for future implementation
          result = { processed: true, type: 'geofence', skipped: true };
          break;

        case 'driver_created':
        case 'driver_updated':
        case 'vehicle_created':
        case 'vehicle_updated':
          // Entity sync events - queue for background sync
          result = { processed: true, type: 'entity_sync', queued: true };
          break;

        default:
          log(`Unhandled event type: ${eventType}`);
          result = { processed: false, reason: 'unhandled_event_type' };
      }

      // Update webhook log with success
      if (webhookLog?.id) {
        await supabase
          .from('eld_webhook_events')
          .update({
            status: 'processed',
            processing_time_ms: Date.now() - startTime,
            result: result
          })
          .eq('id', webhookLog.id);
      }

    } catch (handlerError) {
      log(`Handler error for ${eventType}:`, handlerError);

      // Update webhook log with error
      if (webhookLog?.id) {
        await supabase
          .from('eld_webhook_events')
          .update({
            status: 'error',
            error_message: handlerError.message,
            processing_time_ms: Date.now() - startTime
          })
          .eq('id', webhookLog.id);
      }

      // Still return 200 to prevent retries for processing errors
      // The event is logged and can be reprocessed manually
    }

    // Return 200 quickly (Motive requires response within 3 seconds)
    return NextResponse.json({
      success: true,
      event: eventType,
      processingTime: Date.now() - startTime
    });

  } catch (error) {
    log('Fatal error:', error);

    // Return 500 for parsing/fatal errors (will trigger retry)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * HEAD /api/eld/webhooks/motive
 *
 * HEAD request for webhook URL verification
 */
export async function HEAD() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'X-Webhook-Status': 'active'
    }
  });
}

/**
 * GET /api/eld/webhooks/motive
 *
 * Health check endpoint for webhook verification
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    provider: 'motive',
    timestamp: new Date().toISOString()
  });
}

/**
 * OPTIONS /api/eld/webhooks/motive
 *
 * CORS preflight for webhook verification
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-KT-Webhook-Signature'
    }
  });
}
