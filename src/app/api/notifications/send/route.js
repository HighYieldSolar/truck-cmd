import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendNotificationEmail } from '@/lib/services/emailService';
import { sendNotificationSMS } from '@/lib/services/smsService';

/**
 * API route for sending notification via email/SMS
 * Called after a notification is created to deliver via configured channels
 */

// Create admin client for service operations
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

/**
 * Send a single notification via configured channels
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { notificationId, userId } = body;

    if (!notificationId || !userId) {
      return NextResponse.json(
        { error: 'Missing notificationId or userId' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Get the notification
    const { data: notification, error: notifError } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', notificationId)
      .eq('user_id', userId)
      .single();

    if (notifError || !notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    // Get user details (email and phone)
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('email, phone, full_name')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check notification preferences
    const { data: shouldSendEmail } = await supabase.rpc('should_send_notification', {
      p_user_id: userId,
      p_notification_type: notification.notification_type,
      p_channel: 'email'
    });

    const { data: shouldSendSMS } = await supabase.rpc('should_send_notification', {
      p_user_id: userId,
      p_notification_type: notification.notification_type,
      p_channel: 'sms'
    });

    const results = {
      email: { sent: false, error: null },
      sms: { sent: false, error: null }
    };

    // Send email if enabled
    if (shouldSendEmail && user.email) {
      const emailResult = await sendNotificationEmail({
        to: user.email,
        notification: notification
      });
      results.email = {
        sent: emailResult.success,
        error: emailResult.error || null
      };
    }

    // Send SMS if enabled (only for HIGH/CRITICAL by default)
    if (shouldSendSMS && user.phone) {
      const smsResult = await sendNotificationSMS({
        to: user.phone,
        notification: notification
      });
      results.sms = {
        sent: smsResult.success,
        error: smsResult.error || null
      };
    }

    // Update notification with delivery status
    await supabase
      .from('notifications')
      .update({
        email_sent: results.email.sent,
        sms_sent: results.sms.sent,
        delivered_at: (results.email.sent || results.sms.sent) ? new Date().toISOString() : null
      })
      .eq('id', notificationId);

    return NextResponse.json({
      success: true,
      notificationId,
      delivery: results
    });

  } catch (error) {
    console.error('Notification delivery error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * Batch send notifications for multiple users
 * Used by cron job to send pending notifications
 */
export async function PUT(request) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Get notifications created in the last hour that haven't been delivered
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { data: pendingNotifications, error } = await supabase
      .from('notifications')
      .select(`
        id, user_id, title, message, notification_type, urgency, link_to, due_date,
        users!inner (id, email, phone, full_name)
      `)
      .gte('created_at', oneHourAgo)
      .is('delivered_at', null)
      .in('urgency', ['HIGH', 'CRITICAL']) // Only send immediate notifications for high urgency
      .limit(100);

    if (error) {
      throw error;
    }

    if (!pendingNotifications || pendingNotifications.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No pending notifications to deliver',
        count: 0
      });
    }

    const results = {
      total: pendingNotifications.length,
      emailsSent: 0,
      smsSent: 0,
      errors: []
    };

    for (const notification of pendingNotifications) {
      const user = notification.users;

      // Check preferences
      const { data: shouldSendEmail } = await supabase.rpc('should_send_notification', {
        p_user_id: notification.user_id,
        p_notification_type: notification.notification_type,
        p_channel: 'email'
      });

      const { data: shouldSendSMS } = await supabase.rpc('should_send_notification', {
        p_user_id: notification.user_id,
        p_notification_type: notification.notification_type,
        p_channel: 'sms'
      });

      let emailSent = false;
      let smsSent = false;

      // Send email
      if (shouldSendEmail && user.email) {
        const emailResult = await sendNotificationEmail({
          to: user.email,
          notification: notification
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

      // Send SMS
      if (shouldSendSMS && user.phone) {
        const smsResult = await sendNotificationSMS({
          to: user.phone,
          notification: notification
        });
        if (smsResult.success) {
          results.smsSent++;
          smsSent = true;
        } else {
          results.errors.push({
            notificationId: notification.id,
            channel: 'sms',
            error: smsResult.error
          });
        }
      }

      // Update notification
      await supabase
        .from('notifications')
        .update({
          email_sent: emailSent,
          sms_sent: smsSent,
          delivered_at: (emailSent || smsSent) ? new Date().toISOString() : null
        })
        .eq('id', notification.id);
    }

    return NextResponse.json({
      success: true,
      ...results
    });

  } catch (error) {
    console.error('Batch notification delivery error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
