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

    // MULTI-TENANT SAFETY: Do NOT fall back to "any active Motive connection" in
    // production. That fallback can route one customer's webhook to another
    // customer's data. Only allow the fallback in development for initial setup
    // before entity mappings exist.
    if (process.env.NODE_ENV === 'development') {
      const { data: connections } = await supabase
        .from('eld_connections')
        .select('id, user_id, metadata')
        .eq('provider', 'motive')
        .eq('status', 'active')
        .limit(1);

      if (connections && connections.length > 0) {
        log('Using dev-only fallback connection lookup');
        return {
          connectionId: connections[0].id,
          userId: connections[0].user_id,
          webhookSecret: connections[0].metadata?.webhook_secret
        };
      }
    }

    return null;
  } catch (error) {
    log('Error finding connection from payload:', error.message);
    return null;
  }
}

/**
 * Log webhook event for debugging and replay
 * Note: Table uses raw_payload (not payload), error (not error_message), organization_id (not user_id)
 */
async function logWebhookEvent({ provider, eventType, rawPayload, status, error, connectionId, userId }) {
  try {
    const { data } = await supabase
      .from('eld_webhook_events')
      .insert({
        // Note: table uses organization_id but we store user_id in it for now
        // A proper migration would add user_id column
        organization_id: userId || null,
        provider: provider,
        event_type: eventType,
        raw_payload: typeof rawPayload === 'string' ? { raw: rawPayload } : rawPayload,
        status: status,
        error: error || null,
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
    // Get raw body — we need it both for signature validation and parsing.
    const rawBody = await request.text();
    const headers = request.headers;

    // Parse first so we can (a) short-circuit URL-validation pings before any
    // signature/connection work and (b) use payload fields to look up the
    // per-connection webhook secret we need to validate against.
    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      log('Failed to parse webhook body as JSON');
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    // Motive sends an array payload like ["vehicle_location_updated"] during
    // webhook URL registration/validation. No signature, no connection yet —
    // acknowledge with 200 so Motive marks the webhook as verified.
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

    // Look up the connection BEFORE signature validation: the per-connection
    // secret (stored in eld_connections.metadata.webhook_secret during webhook
    // registration) is what we must validate against for multi-tenant safety.
    const connectionInfo = await findConnectionFromPayload(payload);

    if (!connectionInfo) {
      // Real events with no matching connection are suspicious — could be
      // misconfiguration or spoofing. Log and reject with 403 so Motive stops
      // retrying. (The old behavior of accepting as "pending" meant anyone
      // could post arbitrary unsigned events and have them sit in our DB.)
      log('No connection found for event; rejecting.');
      await logWebhookEvent({
        provider: 'motive',
        eventType,
        rawPayload: payload,
        status: 'rejected',
        error: 'No matching connection'
      });
      return NextResponse.json(
        { error: 'No matching connection' },
        { status: 403 }
      );
    }

    const { connectionId, userId, webhookSecret } = connectionInfo;

    // Validate the HMAC signature against this connection's secret.
    const validation = validateWebhook('motive', rawBody, headers, webhookSecret);

    if (!validation.valid) {
      log('Signature validation failed:', validation.error);
      await logWebhookEvent({
        provider: 'motive',
        eventType: eventType || 'signature_failed',
        rawPayload: rawBody.substring(0, 1000),
        status: 'rejected',
        error: validation.error,
        connectionId,
        userId
      });

      // 403 (not 401) signals terminal rejection to Motive — prevents indefinite retry.
      // Per Motive webhook docs: 403 = signature verification failed, no retry.
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 403 }
      );
    }

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

        case 'user_upserted':
        case 'vehicle_upserted':
          // Motive's "upserted" events use a `trigger` field to distinguish create/update.
          // Queue for background entity sync; the hourly cron picks up changes.
          result = {
            processed: true,
            type: 'entity_sync',
            queued: true,
            trigger: payload.trigger || null
          };
          break;

        // Legacy event names kept for one release as backward-compat aliases.
        // Motive's real event names are `user_upserted` / `vehicle_upserted`.
        case 'driver_created':
        case 'driver_updated':
        case 'vehicle_created':
        case 'vehicle_updated':
          result = { processed: true, type: 'entity_sync', queued: true, legacy: true };
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
            error: handlerError.message,
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
