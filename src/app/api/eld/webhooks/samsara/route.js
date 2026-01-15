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
 * POST /api/eld/webhooks/samsara
 *
 * Handles incoming Samsara webhook events
 */
export async function POST(request) {
  const startTime = Date.now();

  try {
    // Get raw body for signature validation
    const rawBody = await request.text();
    const headers = request.headers;

    // Validate webhook signature
    const validation = validateWebhook('samsara', rawBody, headers);

    if (!validation.valid) {
      console.error('[SamsaraWebhook] Signature validation failed:', validation.error);
      await logWebhookEvent({
        provider: 'samsara',
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

    // Samsara webhooks have eventType at the root level
    const eventType = payload.eventType || payload.event_type || payload.type;
    const eventTime = payload.eventTime;

    console.log(`[SamsaraWebhook] Received event: ${eventType} at ${eventTime}`);

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
          result = await handleSamsaraVehicleStats(payload);
          break;

        // HOS/Driver Events
        case 'DriverDutyStatusChanged':
        case 'HosLogCreated':
        case 'HosLogUpdated':
        case 'HosViolationCreated':
        case 'HosClockUpdated':
          result = await handleSamsaraHosUpdate(payload);
          break;

        // Fault Code Events
        case 'VehicleDtcUpdated':
        case 'VehicleDtcOn':
        case 'VehicleDtcOff':
        case 'DiagnosticFaultCodeOn':
        case 'DiagnosticFaultCodeOff':
          result = await handleSamsaraFaultCode(payload);
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
          console.log(`[SamsaraWebhook] Unhandled event type: ${eventType}`);
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
