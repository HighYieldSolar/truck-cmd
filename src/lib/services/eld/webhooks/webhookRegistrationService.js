/**
 * ELD Webhook Registration Service
 *
 * Manages webhook subscriptions with ELD providers (Motive and Samsara).
 * Handles creating, updating, and deleting webhook endpoints.
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Base URLs for ELD provider APIs
const MOTIVE_API_BASE = 'https://api.gomotive.com/v1';
const SAMSARA_API_BASE = 'https://api.samsara.com';

// Get webhook endpoint URLs based on environment
function getWebhookEndpoint(provider) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL;
  if (!baseUrl) {
    throw new Error('App URL not configured (NEXT_PUBLIC_APP_URL or VERCEL_URL)');
  }

  const protocol = baseUrl.includes('localhost') ? 'http' : 'https';
  const cleanBase = baseUrl.replace(/^https?:\/\//, '');

  return `${protocol}://${cleanBase}/api/eld/webhooks/${provider}`;
}

/**
 * Motive Webhook Events
 *
 * Available webhook events for Motive:
 */
const MOTIVE_WEBHOOK_EVENTS = [
  'vehicle_location_updated',    // GPS updates
  'user_duty_status_updated',    // HOS status changes
  'hos_violation_upserted',      // HOS violations
  'fault_code_opened',           // New fault codes
  'fault_code_closed',           // Resolved fault codes
  'vehicle_geofence_event',      // Geofence entry/exit
  'driver_created',              // New driver added
  'driver_updated',              // Driver info changed
  'vehicle_created',             // New vehicle added
  'vehicle_updated',             // Vehicle info changed
];

/**
 * Samsara Webhook Events (Webhooks 2.0)
 *
 * Available webhook event types for Samsara:
 */
const SAMSARA_WEBHOOK_EVENTS = {
  // Vehicle Events
  vehicleStats: [
    'VehicleStatsUpdated',       // GPS, odometer, fuel, etc.
  ],
  // Driver Events
  driverDutyStatus: [
    'DriverDutyStatusChanged',   // HOS status changes
  ],
  // Diagnostic Events
  vehicleDtc: [
    'VehicleDtcOn',              // Fault code activated
    'VehicleDtcOff',             // Fault code cleared
  ],
  // Geofence Events
  geofence: [
    'GeofenceEntry',             // Vehicle entered geofence
    'GeofenceExit',              // Vehicle exited geofence
  ],
  // Safety Events
  safetyEvent: [
    'SafetyEventCreated',        // Harsh event detected
  ],
};

// ============================================================
// MOTIVE WEBHOOK MANAGEMENT
// ============================================================

/**
 * Register webhook endpoint with Motive
 *
 * @param {string} accessToken - Motive OAuth access token
 * @param {string[]} events - Event types to subscribe to
 * @returns {Promise<object>} - Webhook registration result
 */
export async function registerMotiveWebhook(accessToken, events = MOTIVE_WEBHOOK_EVENTS) {
  const webhookUrl = getWebhookEndpoint('motive');

  try {
    // First, check for existing webhooks
    const existingWebhooks = await listMotiveWebhooks(accessToken);

    // Find if our endpoint is already registered
    const existingHook = existingWebhooks.find(hook =>
      hook.url === webhookUrl
    );

    if (existingHook) {
      console.log('[MotiveWebhook] Webhook already registered:', existingHook.id);
      // Update events if needed
      return await updateMotiveWebhook(accessToken, existingHook.id, events);
    }

    // Register new webhook
    const response = await fetch(`${MOTIVE_API_BASE}/webhooks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        webhook: {
          url: webhookUrl,
          events: events,
          enabled: true,
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Motive webhook registration failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('[MotiveWebhook] Webhook registered:', data.webhook?.id);

    return {
      success: true,
      provider: 'motive',
      webhookId: data.webhook?.id,
      url: webhookUrl,
      events: events,
      secret: data.webhook?.secret, // Save this for signature validation
    };
  } catch (error) {
    console.error('[MotiveWebhook] Registration error:', error);
    throw error;
  }
}

/**
 * List existing Motive webhooks
 *
 * @param {string} accessToken - Motive OAuth access token
 * @returns {Promise<object[]>} - List of webhooks
 */
export async function listMotiveWebhooks(accessToken) {
  try {
    const response = await fetch(`${MOTIVE_API_BASE}/webhooks`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to list Motive webhooks: ${response.status}`);
    }

    const data = await response.json();
    return data.webhooks || [];
  } catch (error) {
    console.error('[MotiveWebhook] List error:', error);
    return [];
  }
}

/**
 * Update Motive webhook events
 *
 * @param {string} accessToken - Motive OAuth access token
 * @param {string} webhookId - Webhook ID to update
 * @param {string[]} events - New event list
 * @returns {Promise<object>} - Updated webhook
 */
export async function updateMotiveWebhook(accessToken, webhookId, events) {
  try {
    const response = await fetch(`${MOTIVE_API_BASE}/webhooks/${webhookId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        webhook: {
          events: events,
          enabled: true,
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to update Motive webhook: ${response.status}`);
    }

    const data = await response.json();
    return {
      success: true,
      provider: 'motive',
      webhookId: webhookId,
      events: events,
      updated: true,
    };
  } catch (error) {
    console.error('[MotiveWebhook] Update error:', error);
    throw error;
  }
}

/**
 * Delete Motive webhook
 *
 * @param {string} accessToken - Motive OAuth access token
 * @param {string} webhookId - Webhook ID to delete
 * @returns {Promise<boolean>} - Success status
 */
export async function deleteMotiveWebhook(accessToken, webhookId) {
  try {
    const response = await fetch(`${MOTIVE_API_BASE}/webhooks/${webhookId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    return response.ok;
  } catch (error) {
    console.error('[MotiveWebhook] Delete error:', error);
    return false;
  }
}

// ============================================================
// SAMSARA WEBHOOK MANAGEMENT (Webhooks 2.0)
// ============================================================

/**
 * Register webhook endpoint with Samsara
 *
 * Samsara Webhooks 2.0 uses separate endpoints for different event types.
 *
 * @param {string} accessToken - Samsara API token
 * @param {string[]} eventTypes - Event type categories to subscribe
 * @returns {Promise<object>} - Webhook registration result
 */
export async function registerSamsaraWebhook(accessToken, eventTypes = ['vehicleStats', 'driverDutyStatus', 'vehicleDtc']) {
  const webhookUrl = getWebhookEndpoint('samsara');
  const results = [];

  try {
    // Check for existing webhooks
    const existingWebhooks = await listSamsaraWebhooks(accessToken);

    // Register webhooks for each event category
    for (const category of eventTypes) {
      const events = SAMSARA_WEBHOOK_EVENTS[category];
      if (!events) continue;

      // Check if webhook for this category already exists
      const existing = existingWebhooks.find(hook =>
        hook.url === webhookUrl &&
        hook.eventTypes?.some(et => events.includes(et))
      );

      if (existing) {
        console.log(`[SamsaraWebhook] ${category} webhook already exists:`, existing.id);
        results.push({
          category,
          webhookId: existing.id,
          existing: true,
        });
        continue;
      }

      // Create new webhook
      const response = await fetch(`${SAMSARA_API_BASE}/webhooks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `TruckCommand-${category}`,
          url: webhookUrl,
          eventTypes: events,
          enabled: true,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[SamsaraWebhook] Failed to register ${category}:`, errorText);
        results.push({
          category,
          error: `Registration failed: ${response.status}`,
        });
        continue;
      }

      const data = await response.json();
      console.log(`[SamsaraWebhook] ${category} webhook registered:`, data.data?.id);

      results.push({
        category,
        webhookId: data.data?.id,
        secret: data.data?.secret, // Base64-encoded secret for signature validation
        success: true,
      });
    }

    return {
      success: results.some(r => r.success || r.existing),
      provider: 'samsara',
      url: webhookUrl,
      webhooks: results,
    };
  } catch (error) {
    console.error('[SamsaraWebhook] Registration error:', error);
    throw error;
  }
}

/**
 * List existing Samsara webhooks
 *
 * @param {string} accessToken - Samsara API token
 * @returns {Promise<object[]>} - List of webhooks
 */
export async function listSamsaraWebhooks(accessToken) {
  try {
    const response = await fetch(`${SAMSARA_API_BASE}/webhooks`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to list Samsara webhooks: ${response.status}`);
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('[SamsaraWebhook] List error:', error);
    return [];
  }
}

/**
 * Update Samsara webhook
 *
 * @param {string} accessToken - Samsara API token
 * @param {string} webhookId - Webhook ID to update
 * @param {object} updates - Fields to update
 * @returns {Promise<object>} - Updated webhook
 */
export async function updateSamsaraWebhook(accessToken, webhookId, updates) {
  try {
    const response = await fetch(`${SAMSARA_API_BASE}/webhooks/${webhookId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error(`Failed to update Samsara webhook: ${response.status}`);
    }

    const data = await response.json();
    return {
      success: true,
      webhook: data.data,
    };
  } catch (error) {
    console.error('[SamsaraWebhook] Update error:', error);
    throw error;
  }
}

/**
 * Delete Samsara webhook
 *
 * @param {string} accessToken - Samsara API token
 * @param {string} webhookId - Webhook ID to delete
 * @returns {Promise<boolean>} - Success status
 */
export async function deleteSamsaraWebhook(accessToken, webhookId) {
  try {
    const response = await fetch(`${SAMSARA_API_BASE}/webhooks/${webhookId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    return response.ok;
  } catch (error) {
    console.error('[SamsaraWebhook] Delete error:', error);
    return false;
  }
}

// ============================================================
// UNIFIED WEBHOOK MANAGEMENT
// ============================================================

/**
 * Register webhooks for an ELD connection
 *
 * Called after OAuth flow completes to set up webhook subscriptions.
 *
 * @param {string} userId - User ID
 * @param {string} provider - 'motive' or 'samsara'
 * @param {string} accessToken - OAuth access token
 * @returns {Promise<object>} - Registration result
 */
export async function registerWebhooksForConnection(userId, provider, accessToken) {
  let result;

  if (provider === 'motive') {
    result = await registerMotiveWebhook(accessToken);
  } else if (provider === 'samsara') {
    result = await registerSamsaraWebhook(accessToken);
  } else {
    throw new Error(`Unsupported provider: ${provider}`);
  }

  // Store webhook configuration in database
  if (result.success) {
    const { error } = await supabase
      .from('eld_connections')
      .update({
        metadata: {
          webhook_registered: true,
          webhook_url: result.url,
          webhook_events: result.events || result.webhooks?.map(w => w.category),
          webhook_registered_at: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('provider', provider);

    if (error) {
      console.error('[WebhookRegistration] Failed to update connection:', error);
    }
  }

  return result;
}

/**
 * Unregister webhooks for an ELD connection
 *
 * Called when user disconnects their ELD provider.
 *
 * @param {string} userId - User ID
 * @param {string} provider - 'motive' or 'samsara'
 * @param {string} accessToken - OAuth access token
 * @returns {Promise<boolean>} - Success status
 */
export async function unregisterWebhooksForConnection(userId, provider, accessToken) {
  try {
    if (provider === 'motive') {
      const webhooks = await listMotiveWebhooks(accessToken);
      const ourWebhook = webhooks.find(w => w.url?.includes('/api/eld/webhooks/motive'));
      if (ourWebhook) {
        await deleteMotiveWebhook(accessToken, ourWebhook.id);
      }
    } else if (provider === 'samsara') {
      const webhooks = await listSamsaraWebhooks(accessToken);
      const ourWebhooks = webhooks.filter(w => w.url?.includes('/api/eld/webhooks/samsara'));
      for (const webhook of ourWebhooks) {
        await deleteSamsaraWebhook(accessToken, webhook.id);
      }
    }

    // Update connection metadata
    await supabase
      .from('eld_connections')
      .update({
        metadata: {
          webhook_registered: false,
          webhook_unregistered_at: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('provider', provider);

    return true;
  } catch (error) {
    console.error('[WebhookRegistration] Unregister error:', error);
    return false;
  }
}

/**
 * Verify webhook endpoint is reachable
 *
 * @param {string} provider - 'motive' or 'samsara'
 * @returns {Promise<boolean>} - Whether endpoint is healthy
 */
export async function verifyWebhookEndpoint(provider) {
  try {
    const url = getWebhookEndpoint(provider);
    const response = await fetch(url, { method: 'GET' });

    if (!response.ok) return false;

    const data = await response.json();
    return data.status === 'ok';
  } catch (error) {
    console.error('[WebhookRegistration] Verify error:', error);
    return false;
  }
}

export default {
  // Motive
  registerMotiveWebhook,
  listMotiveWebhooks,
  updateMotiveWebhook,
  deleteMotiveWebhook,
  MOTIVE_WEBHOOK_EVENTS,

  // Samsara
  registerSamsaraWebhook,
  listSamsaraWebhooks,
  updateSamsaraWebhook,
  deleteSamsaraWebhook,
  SAMSARA_WEBHOOK_EVENTS,

  // Unified
  registerWebhooksForConnection,
  unregisterWebhooksForConnection,
  verifyWebhookEndpoint,
  getWebhookEndpoint,
};
