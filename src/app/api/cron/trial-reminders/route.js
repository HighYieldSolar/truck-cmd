import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendOnboardingEmail } from '@/lib/services/emailService';

const DEBUG = process.env.NODE_ENV === 'development';
const log = (...args) => DEBUG && console.log('[cron/trial-reminders]', ...args);

/**
 * Cron job for trial ending reminders
 * Runs daily at 2 PM to send reminders to users whose trials are ending soon
 * Sends reminders at: 3 days, 1 day, and day of expiration
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
      reminders: { sent: 0, skipped: 0, errors: [] }
    };

    // Get all trial users
    const { data: trialUsers, error } = await supabase
      .from('subscriptions')
      .select(`
        user_id,
        trial_ends_at,
        status,
        users!inner (id, email, full_name, operator_type)
      `)
      .eq('status', 'trialing')
      .not('trial_ends_at', 'is', null)
      .not('users.email', 'is', null);

    if (error) throw error;

    if (!trialUsers || trialUsers.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No trial users to remind',
        results
      });
    }

    for (const subscription of trialUsers) {
      const user = subscription.users;
      const trialEndsAt = new Date(subscription.trial_ends_at);
      const daysUntilEnd = Math.ceil((trialEndsAt - now) / (1000 * 60 * 60 * 24));

      // Only send reminders at specific days
      if (![3, 1, 0].includes(daysUntilEnd)) {
        continue;
      }

      // Check if we already sent a reminder today
      const reminderKey = `trial_reminder_${daysUntilEnd}_sent`;
      const { data: alreadySent } = await supabase
        .from('user_settings')
        .select('setting_value')
        .eq('user_id', user.id)
        .eq('setting_key', reminderKey)
        .single();

      // Check if reminder was sent within the last 20 hours (avoid duplicates)
      if (alreadySent?.setting_value?.sent_at) {
        const sentAt = new Date(alreadySent.setting_value.sent_at);
        if (now - sentAt < 20 * 60 * 60 * 1000) {
          results.reminders.skipped++;
          continue;
        }
      }

      // Determine which email to send
      const emailType = daysUntilEnd === 0 ? 'trialEnding' : 'trialEnding';
      const subject = daysUntilEnd === 0
        ? 'Your Truck Command trial ends today!'
        : daysUntilEnd === 1
          ? 'Your trial ends tomorrow - don\'t lose your data!'
          : 'Your trial ends in 3 days - upgrade now';

      const emailResult = await sendTrialReminderEmail({
        to: user.email,
        userName: user.full_name?.split(' ')[0],
        daysLeft: daysUntilEnd,
        trialEndsAt: trialEndsAt
      });

      if (emailResult.success) {
        results.reminders.sent++;

        // Mark as sent
        await supabase
          .from('user_settings')
          .upsert({
            user_id: user.id,
            setting_key: reminderKey,
            setting_value: { sent_at: now.toISOString() }
          }, {
            onConflict: 'user_id,setting_key'
          });
      } else {
        results.reminders.errors.push({
          userId: user.id,
          daysLeft: daysUntilEnd,
          error: emailResult.error
        });
      }
    }

    return NextResponse.json({
      success: true,
      results
    });

  } catch (error) {
    log('Trial reminders cron error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * Send trial reminder email
 */
async function sendTrialReminderEmail({ to, userName, daysLeft, trialEndsAt }) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const FROM_EMAIL = process.env.EMAIL_FROM || 'Truck Command <notifications@truckcommand.com>';
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://truckcommand.com';

  if (!RESEND_API_KEY) {
    return { success: false, error: 'Email service not configured' };
  }

  const urgencyText = daysLeft === 0 ? 'TODAY' : daysLeft === 1 ? 'TOMORROW' : `in ${daysLeft} days`;
  const urgencyColor = daysLeft === 0 ? '#dc2626' : daysLeft === 1 ? '#ea580c' : '#ca8a04';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

          <tr>
            <td style="padding: 24px 40px; background-color: ${urgencyColor}; border-radius: 16px 16px 0 0; text-align: center;">
              <p style="margin: 0; color: #ffffff; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
                ⏰ Trial Ends ${urgencyText}
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding: 40px;">
              <h1 style="margin: 0 0 20px; color: #111827; font-size: 24px;">
                Hey ${userName || 'there'},
              </h1>
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                ${daysLeft === 0
                  ? 'Your Truck Command trial ends today. Upgrade now to keep all your data and continue using the platform.'
                  : daysLeft === 1
                    ? 'Your free trial ends tomorrow! Don\'t lose access to your loads, invoices, and IFTA data.'
                    : 'Your trial is ending soon. Upgrade now to lock in your rate and keep everything you\'ve set up.'
                }
              </p>

              <div style="background-color: #ecfdf5; border-radius: 12px; padding: 24px; margin: 24px 0;">
                <h3 style="margin: 0 0 16px; color: #065f46; font-size: 16px;">When you upgrade, you keep:</h3>
                <ul style="margin: 0; padding-left: 20px; color: #047857; line-height: 1.8;">
                  <li>All your loads and mileage data</li>
                  <li>Your invoices and customer info</li>
                  <li>Expense records and receipts</li>
                  <li>IFTA calculations and reports</li>
                </ul>
              </div>

              <div style="background-color: #eff6ff; border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center;">
                <p style="margin: 0 0 8px; color: #1e40af; font-size: 14px;">Plans start at just</p>
                <p style="margin: 0; color: #1e40af; font-size: 36px; font-weight: 700;">$20<span style="font-size: 16px; font-weight: 400;">/month</span></p>
              </div>

              <table role="presentation" style="width: 100%;">
                <tr>
                  <td align="center">
                    <a href="${APP_URL}/dashboard/upgrade" style="display: inline-block; padding: 16px 48px; background-color: #2563eb; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 8px;">
                      Upgrade Now →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 32px 0 0; color: #6b7280; font-size: 14px; text-align: center;">
                Questions? Just reply to this email.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding: 24px 40px; background-color: #f9fafb; border-radius: 0 0 16px 16px; text-align: center;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                Truck Command | Making trucking simple
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to],
        subject: daysLeft === 0
          ? '⏰ Your Truck Command trial ends TODAY'
          : daysLeft === 1
            ? '⚠️ Your trial ends tomorrow - don\'t lose your data!'
            : '📅 Your trial ends in 3 days - upgrade now',
        html
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function POST(request) {
  return GET(request);
}
