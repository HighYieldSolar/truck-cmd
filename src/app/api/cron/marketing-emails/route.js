import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  sendTrialExpiredEmail,
  sendTrialExpiredDay3Email,
  sendWinbackEmail,
  sendPaymentFailedReminderEmail,
  sendPaymentFailedFinalEmail
} from '@/lib/services/emailService';

const log = (...args) => console.log('[cron/marketing-emails]', ...args);

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/**
 * Get date window for N days ago (midnight to midnight)
 */
function getDayWindow(daysAgo) {
  const target = new Date();
  target.setDate(target.getDate() - daysAgo);
  const start = new Date(target);
  start.setHours(0, 0, 0, 0);
  const end = new Date(target);
  end.setHours(23, 59, 59, 999);
  return { start: start.toISOString(), end: end.toISOString() };
}

/**
 * Check if user can receive marketing emails
 */
async function canSendMarketingEmail(supabase, userId, emailType) {
  // Check if email_undeliverable
  const { data: user } = await supabase
    .from('users')
    .select('email_undeliverable')
    .eq('id', userId)
    .single();

  if (user?.email_undeliverable) return false;

  // Check marketing preference
  const { data: prefs } = await supabase
    .from('notification_preferences')
    .select('marketing_emails')
    .eq('user_id', userId)
    .single();

  if (prefs && prefs.marketing_emails === false) return false;

  // Check if already sent
  const { data: existing } = await supabase
    .from('marketing_emails_sent')
    .select('id')
    .eq('user_id', userId)
    .eq('email_type', emailType)
    .maybeSingle();

  if (existing) return false;

  return true;
}

/**
 * Track a sent marketing email
 */
async function trackSentEmail(supabase, userId, emailType) {
  await supabase.from('marketing_emails_sent').insert({
    user_id: userId,
    email_type: emailType,
    sent_at: new Date().toISOString()
  });
}

/**
 * Marketing email cron job
 * Runs daily — handles multi-day sequences:
 *
 * Trial Expired Sequence:
 *   Day 0: "Your trial ended" (sendTrialExpiredEmail)
 *   Day 3: "Special offer: 20% off" (sendTrialExpiredDay3Email)
 *   Day 7: "Last chance to keep your data" (sendWinbackEmail)
 *
 * Subscription Canceled Sequence:
 *   Day 7: "We miss you" winback (sendWinbackEmail)
 *
 * Payment Failed Sequence (supplements the immediate email from Stripe webhook):
 *   Day 3: Reminder to update payment (sendPaymentFailedReminderEmail)
 *   Day 7: Final notice (sendPaymentFailedFinalEmail)
 */
export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
    }

    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    const results = {
      trial_expired_day0: 0, trial_expired_day3: 0, trial_expired_day7: 0,
      cancel_winback: 0,
      payment_reminder_day3: 0, payment_final_day7: 0,
      skipped: 0, errors: 0
    };

    // ── Trial Expired: Day 0 ──
    const day0Window = getDayWindow(0);
    const { data: day0Trials } = await supabase
      .from('subscriptions')
      .select('user_id, users!inner(email, full_name)')
      .eq('status', 'expired')
      .gte('trial_end', day0Window.start)
      .lte('trial_end', day0Window.end);

    for (const sub of (day0Trials || [])) {
      if (!await canSendMarketingEmail(supabase, sub.user_id, 'trial_expired_day0')) { results.skipped++; continue; }
      const r = await sendTrialExpiredEmail({ to: sub.users.email, userName: sub.users.full_name });
      if (r.success) { await trackSentEmail(supabase, sub.user_id, 'trial_expired_day0'); results.trial_expired_day0++; }
      else results.errors++;
    }

    // ── Trial Expired: Day 3 ──
    const day3Window = getDayWindow(3);
    const { data: day3Trials } = await supabase
      .from('subscriptions')
      .select('user_id, users!inner(email, full_name)')
      .eq('status', 'expired')
      .gte('trial_end', day3Window.start)
      .lte('trial_end', day3Window.end);

    for (const sub of (day3Trials || [])) {
      if (!await canSendMarketingEmail(supabase, sub.user_id, 'trial_expired_day3')) { results.skipped++; continue; }
      const r = await sendTrialExpiredDay3Email({ to: sub.users.email, userName: sub.users.full_name });
      if (r.success) { await trackSentEmail(supabase, sub.user_id, 'trial_expired_day3'); results.trial_expired_day3++; }
      else results.errors++;
    }

    // ── Trial Expired: Day 7 (Winback) ──
    const day7Window = getDayWindow(7);
    const { data: day7Trials } = await supabase
      .from('subscriptions')
      .select('user_id, users!inner(email, full_name)')
      .eq('status', 'expired')
      .gte('trial_end', day7Window.start)
      .lte('trial_end', day7Window.end);

    for (const sub of (day7Trials || [])) {
      if (!await canSendMarketingEmail(supabase, sub.user_id, 'trial_expired_day7')) { results.skipped++; continue; }
      const r = await sendWinbackEmail({ to: sub.users.email, userName: sub.users.full_name, reason: 'trial_expired' });
      if (r.success) { await trackSentEmail(supabase, sub.user_id, 'trial_expired_day7'); results.trial_expired_day7++; }
      else results.errors++;
    }

    // ── Subscription Canceled: Day 7 Winback ──
    const { data: canceledSubs } = await supabase
      .from('subscriptions')
      .select('user_id, users!inner(email, full_name)')
      .eq('status', 'canceled')
      .gte('canceled_at', day7Window.start)
      .lte('canceled_at', day7Window.end);

    for (const sub of (canceledSubs || [])) {
      if (!await canSendMarketingEmail(supabase, sub.user_id, 'cancel_winback')) { results.skipped++; continue; }
      const r = await sendWinbackEmail({ to: sub.users.email, userName: sub.users.full_name, reason: 'subscription_canceled' });
      if (r.success) { await trackSentEmail(supabase, sub.user_id, 'cancel_winback'); results.cancel_winback++; }
      else results.errors++;
    }

    // ── Payment Failed: Day 3 Reminder ──
    const { data: pastDue3 } = await supabase
      .from('subscriptions')
      .select('user_id, users!inner(email, full_name)')
      .eq('status', 'past_due')
      .gte('payment_failed_at', day3Window.start)
      .lte('payment_failed_at', day3Window.end);

    for (const sub of (pastDue3 || [])) {
      if (!await canSendMarketingEmail(supabase, sub.user_id, 'payment_failed_day3')) { results.skipped++; continue; }
      const r = await sendPaymentFailedReminderEmail({ to: sub.users.email, userName: sub.users.full_name });
      if (r.success) { await trackSentEmail(supabase, sub.user_id, 'payment_failed_day3'); results.payment_reminder_day3++; }
      else results.errors++;
    }

    // ── Payment Failed: Day 7 Final Notice ──
    const { data: pastDue7 } = await supabase
      .from('subscriptions')
      .select('user_id, users!inner(email, full_name)')
      .eq('status', 'past_due')
      .gte('payment_failed_at', day7Window.start)
      .lte('payment_failed_at', day7Window.end);

    for (const sub of (pastDue7 || [])) {
      if (!await canSendMarketingEmail(supabase, sub.user_id, 'payment_failed_day7')) { results.skipped++; continue; }
      const r = await sendPaymentFailedFinalEmail({ to: sub.users.email, userName: sub.users.full_name });
      if (r.success) { await trackSentEmail(supabase, sub.user_id, 'payment_failed_day7'); results.payment_final_day7++; }
      else results.errors++;
    }

    log('Marketing emails results:', results);
    return NextResponse.json({ success: true, results });
  } catch (error) {
    log('Marketing email cron error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
