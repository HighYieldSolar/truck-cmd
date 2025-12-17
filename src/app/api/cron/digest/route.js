import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendDigestEmail, sendNotificationEmail, sendOnboardingEmail } from '@/lib/services/emailService';
import { sendNotificationSMS } from '@/lib/services/smsService';

const DEBUG = process.env.NODE_ENV === 'development';
const log = (...args) => DEBUG && console.log('[cron/digest]', ...args);

/**
 * Cron job endpoint for sending digest emails, batch notifications, AND onboarding emails
 * Runs daily at 8 AM to:
 * 1. Send daily/weekly digest emails
 * 2. Send pending high-priority notifications
 * 3. Send onboarding email sequence (Day 1, 3, 5, 6 emails based on trial start date)
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

/**
 * Send pending high-priority notifications via email/SMS
 * (Consolidated from /api/notifications/send cron)
 */
async function sendPendingNotifications(supabase) {
  const results = {
    total: 0,
    emailsSent: 0,
    smsSent: 0,
    errors: []
  };

  try {
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
      return results;
    }

    results.total = pendingNotifications.length;

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
  } catch (error) {
    log('Error sending pending notifications:', error);
    results.errors.push({ error: error.message });
  }

  return results;
}

/**
 * Send onboarding emails based on trial start date
 * Day 1: First win email
 * Day 3: Feature highlight
 * Day 5: Social proof
 * Day 6: Trial ending reminder
 */
async function sendOnboardingEmails(supabase) {
  const results = {
    day1: { sent: 0, skipped: 0 },
    day3: { sent: 0, skipped: 0 },
    day5: { sent: 0, skipped: 0 },
    day6: { sent: 0, skipped: 0 },
    errors: []
  };

  try {
    const now = new Date();

    // Get all trial users with their subscription and profile data
    const { data: trialUsers, error } = await supabase
      .from('subscriptions')
      .select(`
        user_id,
        created_at,
        status,
        users!inner (id, email, full_name, operator_type, primary_focus)
      `)
      .eq('status', 'trial')
      .not('users.email', 'is', null);

    if (error) {
      throw error;
    }

    if (!trialUsers || trialUsers.length === 0) {
      log('No trial users to send onboarding emails');
      return results;
    }

    // Define email schedule: { dayNumber: emailType }
    const emailSchedule = {
      1: 'firstWin',
      3: 'featureHighlight',
      5: 'socialProof',
      6: 'trialEnding'
    };

    for (const subscription of trialUsers) {
      const user = subscription.users;
      const trialStartDate = new Date(subscription.created_at);
      const daysSinceStart = Math.floor((now - trialStartDate) / (1000 * 60 * 60 * 24));

      // Check if user should receive an email today
      const emailType = emailSchedule[daysSinceStart];
      if (!emailType) {
        continue; // No email scheduled for this day
      }

      // Check if we already sent this email (using a simple tracking approach)
      // We'll check if user has received an email with this type in notifications table
      const emailTrackingKey = `onboarding_${emailType}_sent`;
      const { data: alreadySent } = await supabase
        .from('user_settings')
        .select('setting_value')
        .eq('user_id', user.id)
        .eq('setting_key', emailTrackingKey)
        .single();

      if (alreadySent) {
        results[`day${daysSinceStart}`].skipped++;
        continue;
      }

      // Send the onboarding email
      const emailResult = await sendOnboardingEmail({
        to: user.email,
        emailType,
        userName: user.full_name?.split(' ')[0], // First name only
        operatorType: user.operator_type,
        primaryFocus: user.primary_focus
      });

      if (emailResult.success) {
        results[`day${daysSinceStart}`].sent++;

        // Mark email as sent
        await supabase
          .from('user_settings')
          .upsert({
            user_id: user.id,
            setting_key: emailTrackingKey,
            setting_value: { sent_at: now.toISOString() }
          }, {
            onConflict: 'user_id,setting_key'
          });

        log(`Sent ${emailType} email to ${user.email}`);
      } else {
        results.errors.push({
          userId: user.id,
          emailType,
          error: emailResult.error
        });
      }
    }
  } catch (error) {
    log('Error sending onboarding emails:', error);
    results.errors.push({ error: error.message });
  }

  return results;
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
      weeklyDigests: { sent: 0, skipped: 0, errors: [] },
      pendingNotifications: { total: 0, emailsSent: 0, smsSent: 0, errors: [] },
      onboardingEmails: { day1: { sent: 0, skipped: 0 }, day3: { sent: 0, skipped: 0 }, day5: { sent: 0, skipped: 0 }, day6: { sent: 0, skipped: 0 }, errors: [] }
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

    // Also send pending high-priority notifications (consolidated from /api/notifications/send)
    const pendingResults = await sendPendingNotifications(supabase);
    results.pendingNotifications = pendingResults;

    // Send onboarding emails to trial users
    const onboardingResults = await sendOnboardingEmails(supabase);
    results.onboardingEmails = onboardingResults;

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
