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
  handleMotiveFaultCode,
  logWebhookEvent
} from '@/lib/services/eld/webhooks/webhookEventHandlers';
import { createClient } from '@supabase/supabase-js';

// Use service role for webhook processing (no user context)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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
      console.error('[MotiveWebhook] Signature validation failed:', validation.error);
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
      console.log('[MotiveWebhook] Received test/validation request:', payload);
      return NextResponse.json({
        success: true,
        message: 'Webhook URL validated successfully',
        test: true
      });
    }

    const eventType = payload.event_type || payload.type || payload.action;

    console.log(`[MotiveWebhook] Received event: ${eventType}`);

    // Log the webhook event
    const webhookLog = await logWebhookEvent({
      provider: 'motive',
      eventType,
      rawPayload: payload,
      status: 'processing'
    });

    // Route to appropriate handler based on event type
    let result;
    try {
      switch (eventType) {
        case 'vehicle_location_updated':
        case 'vehicle_location_received':
          result = await handleMotiveLocationUpdated(payload);
          break;

        case 'user_duty_status_updated':
        case 'hos_violation_upserted':
        case 'hos_log_created':
        case 'hos_log_updated':
          result = await handleMotiveHosUpdate(payload);
          break;

        case 'fault_code_opened':
        case 'fault_code_closed':
        case 'vehicle_fault_code':
          result = await handleMotiveFaultCode(payload);
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
          console.log(`[MotiveWebhook] Unhandled event type: ${eventType}`);
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
      console.error(`[MotiveWebhook] Handler error for ${eventType}:`, handlerError);

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
    console.error('[MotiveWebhook] Fatal error:', error);

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
