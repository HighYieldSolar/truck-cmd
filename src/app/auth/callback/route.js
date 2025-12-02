import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const token_hash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type');
  const next = requestUrl.searchParams.get('next') || '/dashboard';

  // Get the origin for redirect (works for both localhost and production)
  const origin = requestUrl.origin;

  // Create Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  // Handle PKCE flow (code exchange)
  if (code) {
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        console.error('Code exchange error:', error);
        return NextResponse.redirect(`${origin}/login?error=auth_error`);
      }
      return NextResponse.redirect(`${origin}${next}`);
    } catch (err) {
      console.error('Code exchange exception:', err);
      return NextResponse.redirect(`${origin}/login?error=auth_error`);
    }
  }

  // Handle token hash flow (magic link / email verification)
  if (token_hash && type) {
    try {
      const { error } = await supabase.auth.verifyOtp({
        token_hash,
        type,
      });
      if (error) {
        console.error('OTP verification error:', error);
        return NextResponse.redirect(`${origin}/login?error=invalid_token`);
      }
      return NextResponse.redirect(`${origin}${next}`);
    } catch (err) {
      console.error('OTP verification exception:', err);
      return NextResponse.redirect(`${origin}/login?error=auth_error`);
    }
  }

  // No valid auth parameters found
  return NextResponse.redirect(`${origin}/login?error=missing_params`);
}
