// src/app/api/sms/opt-out/route.js
// Twilio incoming SMS webhook for STOP/START opt-out management

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/**
 * Validate Twilio request signature
 */
function validateTwilioSignature(request, body) {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) return true; // Skip validation if not configured (development)

  const signature = request.headers.get('x-twilio-signature');
  if (!signature) return false;

  // Build the full URL
  const url = `${process.env.NEXT_PUBLIC_APP_URL || 'https://truckcommand.com'}/api/sms/opt-out`;

  // Sort POST params and append to URL
  const params = new URLSearchParams(body);
  const sortedKeys = [...params.keys()].sort();
  let dataString = url;
  for (const key of sortedKeys) {
    dataString += key + params.get(key);
  }

  const expectedSignature = crypto
    .createHmac('sha1', authToken)
    .update(dataString)
    .digest('base64');

  return signature === expectedSignature;
}

/**
 * Handle incoming SMS from Twilio (STOP/START/HELP)
 */
export async function POST(request) {
  try {
    const body = await request.text();

    // Validate Twilio signature
    if (!validateTwilioSignature(request, body)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    }

    const params = new URLSearchParams(body);
    const from = params.get('From'); // E.164 phone number
    const messageBody = (params.get('Body') || '').trim().toUpperCase();

    if (!from) {
      return new Response(twimlResponse(''), { headers: { 'Content-Type': 'text/xml' } });
    }

    const supabase = getSupabaseAdmin();

    if (messageBody === 'STOP' || messageBody === 'UNSUBSCRIBE' || messageBody === 'CANCEL' || messageBody === 'QUIT') {
      // Opt out — add to opt-out table
      await supabase
        .from('sms_opt_outs')
        .upsert({ phone_number: from, opted_out_at: new Date().toISOString(), reason: messageBody }, { onConflict: 'phone_number' });

      return new Response(
        twimlResponse('You have been unsubscribed from Truck Command SMS notifications. Reply START to re-subscribe.'),
        { headers: { 'Content-Type': 'text/xml' } }
      );
    }

    if (messageBody === 'START' || messageBody === 'SUBSCRIBE' || messageBody === 'YES') {
      // Opt back in — remove from opt-out table
      await supabase
        .from('sms_opt_outs')
        .delete()
        .eq('phone_number', from);

      return new Response(
        twimlResponse('You have been re-subscribed to Truck Command SMS notifications. Reply STOP to unsubscribe.'),
        { headers: { 'Content-Type': 'text/xml' } }
      );
    }

    if (messageBody === 'HELP') {
      return new Response(
        twimlResponse('Truck Command SMS alerts. Reply STOP to unsubscribe, START to re-subscribe. For help visit truckcommand.com or email support@truckcommand.com'),
        { headers: { 'Content-Type': 'text/xml' } }
      );
    }

    // Unknown message — no response needed
    return new Response(twimlResponse(''), { headers: { 'Content-Type': 'text/xml' } });
  } catch (error) {
    console.error('SMS opt-out webhook error:', error);
    return new Response(twimlResponse(''), { headers: { 'Content-Type': 'text/xml' } });
  }
}

/**
 * Generate TwiML response
 */
function twimlResponse(message) {
  if (!message) {
    return '<?xml version="1.0" encoding="UTF-8"?><Response></Response>';
  }
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${message}</Message></Response>`;
}
