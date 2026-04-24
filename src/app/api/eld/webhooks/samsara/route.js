/**
 * Samsara ELD Webhook Endpoint
 *
 * Receives real-time events from Samsara ELD system:
 * - Vehicle statistics (GPS, odometer, fuel)
 * - Driver duty status changes (HOS)
 * - Vehicle diagnostic trouble codes (DTCs)
 * - Geofence events
 *
 * Samsara Webhooks 2.0 require:
 * - HMAC-SHA256 signature validation
 * - Base64-decoded webhook secret
 * - Timestamp validation (prevents replay attacks)
 * - Quick 200 OK response
 */

import { NextResponse } from 'next/server';
import { validateWebhook } from '@/lib/services/eld/webhooks/webhookSignatureService';
import {
  handleSamsaraVehicleStats,
  handleSamsaraHosUpdate,
  handleSamsaraFaultCode,
  logWebhookEvent
} from '@/lib/services/eld/webhooks/webhookEventHandlers';
import { createClient } from '@supabase/supabase-js';

// Use service role for webhook processing (no user context)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Look up connection from a Samsara webhook payload, returning the connection
 * id, user id, and the per-connection webhook secret stored at registration
 * time. The secret is what `validateWebhook` needs to verify the HMAC-SHA256
 * signature multi-tenantly (one secret per customer, not a single env var).
 */
async function findConnectionFromPayload(payload) {
  try {
    const orgId = payload.orgId || payload.data?.orgId;
    if (orgId) {
      const { data } = await supabase
        .from('eld_connections')
        .select('id, user_id, metadata')
        .eq('provider', 'samsara')
        .eq('external_connection_id', orgId.toString())
        .eq('status', 'active')
        .maybeSingle();

      if (data) {
        return {
          connectionId: data.id,
          userId: data.user_id,
          webhookSecret: data.metadata?.webhook_secret
        };
      }
    }

    const vehicleId = payload.data?.vehicle?.id || payload.vehicle?.id;
    if (vehicleId) {
      const { data: mapping } = await supabase
        .from('eld_entity_mappings')
        .select('connection_id, user_id')
        .eq('external_id', vehicleId.toString())
        .eq('entity_type', 'vehicle')
        .eq('provider', 'samsara')
        .maybeSingle();

      if (mapping) {
        const { data: conn } = await supabase
          .from('eld_connections')
          .select('metadata')
          .eq('id', mapping.connection_id)
          .maybeSingle();
        return {
          connectionId: mapping.connection_id,
          userId: mapping.user_id,
          webhookSecret: conn?.metadata?.webhook_secret
        };
      }
    }

    const driverId = payload.data?.driver?.id || payload.driver?.id;
    if (driverId) {
      const { data: mapping } = await supabase
        .from('eld_entity_mappings')
        .select('connection_id, user_id')
        .eq('external_id', driverId.toString())
        .eq('entity_type', 'driver')
        .eq('provider', 'samsara')
        .maybeSingle();

      if (mapping) {
        const { data: conn } = await supabase
          .from('eld_connections')
          .select('metadata')
          .eq('id', mapping.connection_id)
          .maybeSingle();
        return {
          connectionId: mapping.connection_id,
          userId: mapping.user_id,
          webhookSecret: conn?.metadata?.webhook_secret
        };
      }
    }

    // MULTI-TENANT SAFETY: no "pick any active Samsara connection" fallback.
    // Routing one customer's webhook to another customer's data is a
    // cross-tenant leak. Dev-only fallback mirrors the Motive route.
    if (process.env.NODE_ENV === 'development') {
      const { data: connections } = await supabase
        .from('eld_connections')
        .select('id, user_id, metadata')
        .eq('provider', 'samsara')
        .eq('status', 'active')
        .limit(1);

      if (connections && connections.length > 0) {
        return {
          connectionId: connections[0].id,
          userId: connections[0].user_id,
          webhookSecret: connections[0].metadata?.webhook_secret
        };
      }
    }

    return null;
  } catch (error) {
    console.error('[SamsaraWebhook] Error finding connection:', error.message);
    return null;
  }
}

/**
 * POST /api/eld/webhooks/samsara
 *
 * Handles incoming Samsara webhook events
 */
export async function POST(request) {
  const startTime = Date.now();

  try {
    const rawBody = await request.text();
    const headers = request.headers;

    // Parse first so we can look up the connection (and its per-connection
    // secret) BEFORE validating the signature. Multi-tenant: each customer's
    // webhooks are signed with their own secret, not one global env var.
    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      console.error('[SamsaraWebhook] Failed to parse body as JSON');
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const eventType = payload.eventType || payload.event_type || payload.type;
    const eventTime = payload.eventTime;

    const connectionInfo = await findConnectionFromPayload(payload);

    if (!connectionInfo) {
      // Real events with no matching connection are rejected — previously we
      // silently accepted and logged them, which allowed unsigned spoofed
      // webhooks to sit in the DB.
      console.warn(`[SamsaraWebhook] No connection found for event: ${eventType}; rejecting.`);
      await logWebhookEvent({
        provider: 'samsara',
        eventType: eventType || 'no_connection',
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

    // Validate the HMAC-SHA256 signature against this connection's secret.
    const validation = validateWebhook('samsara', rawBody, headers, webhookSecret);

    if (!validation.valid) {
      console.error('[SamsaraWebhook] Signature validation failed:', validation.error);
      await logWebhookEvent({
        provider: 'samsara',
        eventType: eventType || 'signature_failed',
        rawPayload: rawBody.substring(0, 1000),
        status: 'rejected',
        error: validation.error,
        connectionId,
        userId
      });

      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 403 }
      );
    }

    // Log the webhook event
    const webhookLog = await logWebhookEvent({
      provider: 'samsara',
      eventType,
      rawPayload: payload,
      status: 'processing'
    });

    // Route to appropriate handler based on event type
    let result;
    try {
      switch (eventType) {
        // Vehicle Statistics Events
        case 'VehicleStatsUpdated':
        case 'VehicleLocationUpdated':
        case 'VehicleStatsTriggered':
          result = connectionId
            ? await handleSamsaraVehicleStats(connectionId, userId, payload)
            : { processed: false, error: 'No connection found' };
          break;

        // HOS/Driver Events
        case 'DriverDutyStatusChanged':
        case 'HosLogCreated':
        case 'HosLogUpdated':
        case 'HosViolationCreated':
        case 'HosClockUpdated':
          result = connectionId
            ? await handleSamsaraHosUpdate(connectionId, userId, payload)
            : { processed: false, error: 'No connection found' };
          break;

        // Fault Code Events
        case 'VehicleDtcUpdated':
        case 'VehicleDtcOn':
        case 'VehicleDtcOff':
        case 'DiagnosticFaultCodeOn':
        case 'DiagnosticFaultCodeOff':
          result = connectionId
            ? await handleSamsaraFaultCode(connectionId, userId, payload)
            : { processed: false, error: 'No connection found' };
          break;

        // Geofence Events
        case 'GeofenceEntry':
        case 'GeofenceExit':
        case 'VehicleEnteredGeofence':
        case 'VehicleExitedGeofence':
          // Log geofence events for future implementation
          result = { processed: true, type: 'geofence', skipped: true };
          break;

        // Safety Events
        case 'SafetyEventCreated':
        case 'HarshEventTriggered':
          // Log safety events for future implementation
          result = { processed: true, type: 'safety', skipped: true };
          break;

        // Asset/Equipment Events
        case 'AssetLocationUpdated':
        case 'TrailerLocationUpdated':
          // Log for trailer tracking (future feature)
          result = { processed: true, type: 'asset', skipped: true };
          break;

        // Entity sync events
        case 'DriverCreated':
        case 'DriverUpdated':
        case 'VehicleCreated':
        case 'VehicleUpdated':
          // Queue for background sync
          result = { processed: true, type: 'entity_sync', queued: true };
          break;

        default:
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
      console.error(`[SamsaraWebhook] Handler error for ${eventType}:`, handlerError);

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
    }

    // Return 200 quickly
    return NextResponse.json({
      success: true,
      event: eventType,
      processingTime: Date.now() - startTime
    });

  } catch (error) {
    console.error('[SamsaraWebhook] Fatal error:', error);

    // Return 500 for parsing/fatal errors (will trigger retry)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/eld/webhooks/samsara
 *
 * Health check endpoint for webhook verification
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    provider: 'samsara',
    timestamp: new Date().toISOString()
  });
}
