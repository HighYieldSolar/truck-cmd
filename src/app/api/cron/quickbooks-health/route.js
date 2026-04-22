/**
 * QuickBooks Connection Health Cron
 *
 * Daily job that:
 * 1. Pings active QuickBooks connections to verify they still work
 * 2. Proactively marks expired refresh tokens as token_expired
 * 3. Notifies users whose refresh tokens expire within 14 days
 *
 * Runs daily to catch silent connection failures before users discover them
 * during a sync attempt.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyConnection, updateConnectionStatus } from '@/lib/services/quickbooks/quickbooksConnectionService';

const DEBUG = process.env.NODE_ENV === 'development';
const log = (...args) => DEBUG && console.log('[cron/quickbooks-health]', ...args);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * GET /api/cron/quickbooks-health
 *
 * Verify all active QB connections and alert on upcoming expirations.
 */
export async function GET(request) {
  const startTime = Date.now();

  try {
    // CRON_SECRET enforcement
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      log('CRON_SECRET environment variable is not set');
      return NextResponse.json(
        { error: 'Server configuration error: CRON_SECRET not set' },
        { status: 500 }
      );
    }

    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    log('Starting QuickBooks health check');

    const results = {
      timestamp: new Date().toISOString(),
      connectionsChecked: 0,
      healthy: 0,
      unhealthy: 0,
      expiredRefresh: 0,
      expiringWithin14Days: 0,
      errors: [],
    };

    // Get all active connections
    const { data: connections, error: connError } = await supabaseAdmin
      .from('quickbooks_connections')
      .select('id, user_id, status, refresh_token_expires_at, company_name')
      .eq('status', 'active');

    if (connError) {
      log('Error fetching connections:', connError);
      return NextResponse.json({ success: false, error: connError.message }, { status: 500 });
    }

    const now = Date.now();
    const fourteenDays = 14 * 24 * 60 * 60 * 1000;

    for (const connection of connections || []) {
      results.connectionsChecked++;

      try {
        // 1. Check if refresh token is already expired
        if (connection.refresh_token_expires_at) {
          const refreshExpiry = new Date(connection.refresh_token_expires_at).getTime();

          if (refreshExpiry < now) {
            await updateConnectionStatus(
              connection.id,
              'token_expired',
              'Refresh token expired (100 days). Please reconnect.'
            );
            results.expiredRefresh++;

            // Notify user
            await createQbNotification(
              connection.user_id,
              'QuickBooks Connection Expired',
              'Your QuickBooks connection has expired. Please reconnect to continue syncing.',
              'CRITICAL'
            );
            continue;
          }

          // 2. Warn on imminent expiry
          if (refreshExpiry - now < fourteenDays) {
            results.expiringWithin14Days++;
            const daysLeft = Math.ceil((refreshExpiry - now) / (1000 * 60 * 60 * 24));

            // Only notify once per 7 days to avoid spam
            const { data: existingNotif } = await supabaseAdmin
              .from('notifications')
              .select('id')
              .eq('user_id', connection.user_id)
              .eq('notification_type', 'QUICKBOOKS_EXPIRING')
              .gte('created_at', new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString())
              .maybeSingle();

            if (!existingNotif) {
              await createQbNotification(
                connection.user_id,
                'QuickBooks Connection Expiring Soon',
                `Your QuickBooks connection expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}. Reconnect to avoid interruption.`,
                'HIGH',
                'QUICKBOOKS_EXPIRING'
              );
            }
          }
        }

        // 3. Active health check: try to verify connection with a test API call
        const verifyResult = await verifyConnection(connection.id);

        if (!verifyResult.valid) {
          results.unhealthy++;
          log(`Unhealthy connection ${connection.id}: ${verifyResult.error}`);
        } else {
          results.healthy++;

          // Update last_verified_at if we have that column
          await supabaseAdmin
            .from('quickbooks_connections')
            .update({ last_verified_at: new Date().toISOString() })
            .eq('id', connection.id);
        }
      } catch (error) {
        log(`Error checking connection ${connection.id}:`, error);
        results.errors.push({
          connectionId: connection.id,
          error: error.message,
        });
      }
    }

    const duration = Date.now() - startTime;
    log(`QuickBooks health check completed in ${duration}ms`);

    return NextResponse.json({
      success: true,
      duration: `${duration}ms`,
      ...results,
    });
  } catch (error) {
    log('Cron job error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * Create a notification for the user
 */
async function createQbNotification(userId, title, message, urgency, type = 'QUICKBOOKS_CONNECTION') {
  try {
    await supabaseAdmin.rpc('create_notification', {
      p_user_id: userId,
      p_title: title,
      p_message: message,
      p_notification_type: type,
      p_entity_type: 'quickbooks',
      p_entity_id: null,
      p_link_to: '/dashboard/settings/quickbooks',
      p_due_date: null,
      p_urgency: urgency,
    });
  } catch (error) {
    log('Failed to create notification:', error);
  }
}

export async function POST(request) {
  return GET(request);
}
