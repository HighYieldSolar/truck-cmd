import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const DEBUG = process.env.NODE_ENV === 'development';
const log = (...args) => DEBUG && console.log('[cron/cleanup]', ...args);

/**
 * Cron job for cleaning up old data
 * Runs daily at 3 AM to:
 * - Archive old notifications (>30 days read)
 * - Clean up expired sessions
 * - Remove stale temporary data
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
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    const now = new Date();

    const results = {
      timestamp: now.toISOString(),
      notifications: { archived: 0, deleted: 0 },
      settings: { cleaned: 0 },
      errors: []
    };

    // 1. Delete old read notifications (>60 days old)
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString();

    const { count: deletedNotifications, error: deleteNotifError } = await supabase
      .from('notifications')
      .delete({ count: 'exact' })
      .eq('read', true)
      .lt('created_at', sixtyDaysAgo);

    if (deleteNotifError) {
      results.errors.push({ operation: 'delete_old_notifications', error: deleteNotifError.message });
    } else {
      results.notifications.deleted = deletedNotifications || 0;
    }

    // 2. Archive unread notifications older than 30 days (mark as read)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const { count: archivedNotifications, error: archiveError } = await supabase
      .from('notifications')
      .update({ read: true, archived_at: now.toISOString() }, { count: 'exact' })
      .eq('read', false)
      .lt('created_at', thirtyDaysAgo);

    if (archiveError) {
      results.errors.push({ operation: 'archive_notifications', error: archiveError.message });
    } else {
      results.notifications.archived = archivedNotifications || 0;
    }

    // 3. Clean up old trial reminder flags (>14 days old)
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();

    const { count: cleanedSettings, error: settingsError } = await supabase
      .from('user_settings')
      .delete({ count: 'exact' })
      .like('setting_key', 'trial_reminder_%')
      .lt('updated_at', fourteenDaysAgo);

    if (settingsError) {
      results.errors.push({ operation: 'clean_trial_settings', error: settingsError.message });
    } else {
      results.settings.cleaned = cleanedSettings || 0;
    }

    // 4. Clean up expired password reset tokens (if using custom tokens table)
    // This is optional - Supabase handles its own auth tokens

    // 5. Clean up abandoned draft invoices older than 90 days
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();

    const { count: deletedDrafts, error: draftsError } = await supabase
      .from('invoices')
      .delete({ count: 'exact' })
      .eq('status', 'Draft')
      .lt('created_at', ninetyDaysAgo);

    if (draftsError) {
      results.errors.push({ operation: 'delete_draft_invoices', error: draftsError.message });
    } else {
      results.drafts = { deleted: deletedDrafts || 0 };
    }

    log('Cleanup completed:', results);

    return NextResponse.json({
      success: true,
      results
    });

  } catch (error) {
    log('Cleanup cron error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  return GET(request);
}
