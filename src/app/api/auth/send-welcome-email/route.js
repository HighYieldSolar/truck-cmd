import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendOnboardingEmail } from '@/lib/services/emailService';

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(request) {
  try {
    const { email, userName, operatorType } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Check if we already sent a welcome email to this user
    const supabase = getSupabaseAdmin();
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (user) {
      const { data: alreadySent } = await supabase
        .from('user_settings')
        .select('setting_value')
        .eq('user_id', user.id)
        .eq('setting_key', 'onboarding_welcome_sent')
        .single();

      if (alreadySent) {
        return NextResponse.json({ success: true, skipped: true });
      }
    }

    const result = await sendOnboardingEmail({
      to: email,
      emailType: 'welcome',
      userName: userName || null,
      operatorType: operatorType || 'owner-operator'
    });

    // Track that we sent the welcome email
    if (result.success && user) {
      await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          setting_key: 'onboarding_welcome_sent',
          setting_value: { sent_at: new Date().toISOString() }
        }, { onConflict: 'user_id,setting_key' });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Welcome email error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
