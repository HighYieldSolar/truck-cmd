// src/app/api/sms/consent/route.js
// API endpoint to save SMS consent and send opt-in confirmation

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAuth } from '@/lib/serverAuth';
import { sendSMS, formatPhoneE164 } from '@/lib/services/smsService';

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/**
 * POST /api/sms/consent
 * Save SMS consent and send opt-in confirmation message
 *
 * Body: {
 *   phone: string,       // Phone number
 *   consent: boolean,     // true = opt in, false = opt out
 * }
 */
export async function POST(request) {
  try {
    const { userId, error: authError } = await verifyAuth(request);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: authError || 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { phone, consent } = body;

    if (!phone) {
      return NextResponse.json(
        { success: false, error: 'Phone number is required' },
        { status: 400 }
      );
    }

    const formattedPhone = formatPhoneE164(phone);
    if (!formattedPhone) {
      return NextResponse.json(
        { success: false, error: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    if (consent) {
      // Opt in: save phone to user profile, remove from opt-out table, send confirmation
      await supabase
        .from('users')
        .update({
          phone: formattedPhone,
          sms_consent: true,
          sms_consent_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      // Remove from opt-out table if previously opted out
      await supabase
        .from('sms_opt_outs')
        .delete()
        .eq('phone_number', formattedPhone);

      // Send opt-in confirmation SMS (required by Twilio/TCPA)
      await sendSMS({
        to: formattedPhone,
        message: 'Truck Command: You have opted in to receive SMS notifications. Msg frequency varies (1-10/mo). Msg&data rates may apply. Reply STOP to unsubscribe. Reply HELP for help.'
      });

      return NextResponse.json({
        success: true,
        message: 'SMS consent saved. Confirmation message sent.'
      });
    } else {
      // Opt out: update user profile, add to opt-out table
      await supabase
        .from('users')
        .update({
          sms_consent: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      await supabase
        .from('sms_opt_outs')
        .upsert(
          { phone_number: formattedPhone, opted_out_at: new Date().toISOString(), reason: 'SETTINGS' },
          { onConflict: 'phone_number' }
        );

      return NextResponse.json({
        success: true,
        message: 'SMS notifications disabled.'
      });
    }
  } catch (error) {
    console.error('SMS consent error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
