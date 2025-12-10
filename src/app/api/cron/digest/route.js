import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendDigestEmail } from '@/lib/services/emailService';

const DEBUG = process.env.NODE_ENV === 'development';
const log = (...args) => DEBUG && console.log('[cron/digest]', ...args);

/**
 * Cron job endpoint for sending digest emails
 * Runs daily at 8 AM to send daily digests
 * Runs weekly on Mondays at 8 AM for weekly digests
 */

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}

export async function GET(request) {
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

    const supabase = getSupabaseAdmin();
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.

    const results = {
      timestamp: today.toISOString(),
      dailyDigests: { sent: 0, skipped: 0, errors: [] },
      weeklyDigests: { sent: 0, skipped: 0, errors: [] }
    };

    // Get all users with their notification preferences
    const { data: userPrefs, error: prefsError } = await supabase
      .from('notification_preferences')
      .select(`
        user_id,
        preferences,
        users!inner (id, email, full_name)
      `);

    if (prefsError) {
      throw prefsError;
    }

    if (!userPrefs || userPrefs.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No users with notification preferences found',
        results
      });
    }

    for (const userPref of userPrefs) {
      const prefs = userPref.preferences || {};
      const user = userPref.users;
      const digestMode = prefs.digest_mode || 'instant';

      // Skip if email is disabled or digest mode is instant
      if (!prefs.email_enabled || digestMode === 'instant') {
        continue;
      }

      // Weekly digest only runs on Mondays
      if (digestMode === 'weekly' && dayOfWeek !== 1) {
        results.weeklyDigests.skipped++;
        continue;
      }

      // Calculate time range for notifications
      const hoursAgo = digestMode === 'weekly' ? 168 : 24; // 7 days or 1 day
      const sinceDate = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();

      // Get unread notifications for this user
      const { data: notifications, error: notifError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_read', false)
        .gte('created_at', sinceDate)
        .is('email_sent', false) // Don't re-send if already sent individually
        .order('created_at', { ascending: false });

      if (notifError) {
        results[digestMode === 'weekly' ? 'weeklyDigests' : 'dailyDigests'].errors.push({
          userId: user.id,
          error: notifError.message
        });
        continue;
      }

      // Skip if no notifications to send
      if (!notifications || notifications.length === 0) {
        results[digestMode === 'weekly' ? 'weeklyDigests' : 'dailyDigests'].skipped++;
        continue;
      }

      // Send digest email
      const emailResult = await sendDigestEmail({
        to: user.email,
        notifications: notifications,
        period: digestMode
      });

      if (emailResult.success) {
        results[digestMode === 'weekly' ? 'weeklyDigests' : 'dailyDigests'].sent++;

        // Mark notifications as email_sent
        const notificationIds = notifications.map(n => n.id);
        await supabase
          .from('notifications')
          .update({
            email_sent: true,
            delivered_at: new Date().toISOString()
          })
          .in('id', notificationIds);
      } else {
        results[digestMode === 'weekly' ? 'weeklyDigests' : 'dailyDigests'].errors.push({
          userId: user.id,
          error: emailResult.error
        });
      }
    }

    return NextResponse.json({
      success: true,
      results
    });

  } catch (error) {
    log('Digest cron error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// Support POST for manual triggering
export async function POST(request) {
  return GET(request);
}
