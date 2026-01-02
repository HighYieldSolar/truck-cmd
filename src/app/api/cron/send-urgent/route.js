import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendNotificationEmail } from '@/lib/services/emailService';
import { sendNotificationSMS } from '@/lib/services/smsService';

const DEBUG = process.env.NODE_ENV === 'development';
const log = (...args) => DEBUG && console.log('[cron/send-urgent]', ...args);

/**
 * Cron job endpoint for sending urgent notifications
 * Runs every hour to send HIGH/CRITICAL notifications immediately
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
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      return NextResponse.json(
        { error: 'CRON_SECRET not configured' },
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
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

    const results = {
      timestamp: new Date().toISOString(),
      total: 0,
      emailsSent: 0,
      smsSent: 0,
      errors: []
    };

    // Get undelivered HIGH/CRITICAL notifications from last 2 hours
    const { data: urgentNotifications, error } = await supabase
      .from('notifications')
      .select(`
        id, user_id, title, message, notification_type, urgency, link_to, due_date,
        users!inner (id, email, phone, full_name)
      `)
      .gte('created_at', twoHoursAgo)
      .is('delivered_at', null)
      .in('urgency', ['HIGH', 'CRITICAL'])
      .limit(50);

    if (error) throw error;

    if (!urgentNotifications || urgentNotifications.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No urgent notifications to send',
        results
      });
    }

    results.total = urgentNotifications.length;

    for (const notification of urgentNotifications) {
      const user = notification.users;
      let emailSent = false;
      let smsSent = false;

      // Check email preference - with fallback for missing function
      let shouldSendEmail = true; // Default to sending for urgent
      try {
        const { data: emailPref, error: emailPrefError } = await supabase.rpc('should_send_notification', {
          p_user_id: notification.user_id,
          p_notification_type: notification.notification_type,
          p_channel: 'email'
        });
        if (!emailPrefError) shouldSendEmail = emailPref !== false;
      } catch (e) {
        // Function may not exist - use default (send)
        log('should_send_notification not available, defaulting to send');
      }

      // Send email
      if (shouldSendEmail && user.email) {
        const emailResult = await sendNotificationEmail({
          to: user.email,
          notification
        });
        if (emailResult.success) {
          results.emailsSent++;
          emailSent = true;
        } else {
          results.errors.push({
            notificationId: notification.id,
            channel: 'email',
            error: emailResult.error
          });
        }
      }

      // Check SMS preference (only for CRITICAL)
      if (notification.urgency === 'CRITICAL' && user.phone) {
        let shouldSendSMS = true; // Default to sending for CRITICAL
        try {
          const { data: smsPref, error: smsPrefError } = await supabase.rpc('should_send_notification', {
            p_user_id: notification.user_id,
            p_notification_type: notification.notification_type,
            p_channel: 'sms'
          });
          if (!smsPrefError) shouldSendSMS = smsPref !== false;
        } catch (e) {
          // Function may not exist - use default (send for CRITICAL)
        }

        if (shouldSendSMS) {
          const smsResult = await sendNotificationSMS({
            to: user.phone,
            notification
          });
          if (smsResult.success) {
            results.smsSent++;
            smsSent = true;
          }
        }
      }

      // Update notification delivery status
      if (emailSent || smsSent) {
        await supabase
          .from('notifications')
          .update({
            email_sent: emailSent,
            sms_sent: smsSent,
            delivered_at: new Date().toISOString()
          })
          .eq('id', notification.id);
      }
    }

    return NextResponse.json({
      success: true,
      results
    });

  } catch (error) {
    log('Send urgent cron error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  return GET(request);
}
