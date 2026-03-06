// src/app/api/webhooks/resend/route.js
// Resend webhook handler for bounce, complaint, and delivery events

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/**
 * Verify Resend webhook signature (Svix)
 */
function verifyWebhookSignature(payload, headers) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    console.warn('RESEND_WEBHOOK_SECRET not configured, skipping verification');
    return true; // Allow in development
  }

  const svixId = headers.get('svix-id');
  const svixTimestamp = headers.get('svix-timestamp');
  const svixSignature = headers.get('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    return false;
  }

  // Check timestamp is within 5 minutes
  const now = Math.floor(Date.now() / 1000);
  const ts = parseInt(svixTimestamp, 10);
  if (Math.abs(now - ts) > 300) {
    return false;
  }

  // Verify signature
  const signedContent = `${svixId}.${svixTimestamp}.${payload}`;
  // Svix secret is base64-encoded with "whsec_" prefix
  const secretBytes = Buffer.from(secret.replace('whsec_', ''), 'base64');
  const expectedSignature = crypto
    .createHmac('sha256', secretBytes)
    .update(signedContent)
    .digest('base64');

  // Svix sends multiple signatures separated by spaces, each prefixed with "v1,"
  const signatures = svixSignature.split(' ');
  return signatures.some(sig => {
    const [version, hash] = sig.split(',');
    return version === 'v1' && hash === expectedSignature;
  });
}

export async function POST(request) {
  try {
    const body = await request.text();

    // Verify webhook signature
    if (!verifyWebhookSignature(body, request.headers)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(body);
    const eventType = event.type;

    switch (eventType) {
      case 'email.delivered':
        await handleEmailDelivered(event.data);
        break;

      case 'email.bounced':
        await handleEmailBounced(event.data);
        break;

      case 'email.complained':
        await handleEmailComplained(event.data);
        break;

      default:
        console.log(`Unhandled Resend webhook event: ${eventType}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Resend webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

/**
 * Handle email.delivered — update delivery timestamp on notifications
 */
async function handleEmailDelivered(data) {
  const { to, created_at } = data;
  if (!to || to.length === 0) return;

  const email = Array.isArray(to) ? to[0] : to;

  // Update the most recent undelivered notification for this user
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single();

  if (user) {
    await supabase
      .from('notifications')
      .update({ delivered_at: created_at || new Date().toISOString() })
      .eq('user_id', user.id)
      .is('delivered_at', null)
      .eq('email_sent', true)
      .order('created_at', { ascending: false })
      .limit(1);
  }
}

/**
 * Handle email.bounced — mark user email as undeliverable
 */
async function handleEmailBounced(data) {
  const { to, bounce } = data;
  if (!to || to.length === 0) return;

  const email = Array.isArray(to) ? to[0] : to;
  const bounceType = bounce?.type || 'unknown';

  // Mark user as having undeliverable email
  const { error } = await supabase
    .from('users')
    .update({
      email_undeliverable: true,
      email_bounce_reason: bounceType,
      updated_at: new Date().toISOString()
    })
    .eq('email', email);

  if (error) {
    console.error(`Failed to mark email as undeliverable for ${email}:`, error);
  } else {
    console.log(`Marked ${email} as undeliverable (bounce type: ${bounceType})`);
  }
}

/**
 * Handle email.complained — suppress marketing emails for this user
 */
async function handleEmailComplained(data) {
  const { to } = data;
  if (!to || to.length === 0) return;

  const email = Array.isArray(to) ? to[0] : to;

  // Find user and update their notification preferences to suppress marketing
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single();

  if (user) {
    // Disable marketing emails in notification preferences
    await supabase
      .from('notification_preferences')
      .upsert({
        user_id: user.id,
        marketing_emails: false,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    console.log(`Suppressed marketing emails for ${email} due to complaint`);
  }
}
