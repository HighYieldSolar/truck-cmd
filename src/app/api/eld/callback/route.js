/**
 * ELD OAuth Callback Route
 *
 * Handles OAuth callback from ELD providers (Motive, Samsara).
 * Exchanges authorization code for tokens and creates/updates the ELD connection.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { handleOAuthCallback } from '@/lib/services/eld/eldConnectionService';
import { hasFeature } from '@/config/tierConfig';

const DEBUG = process.env.NODE_ENV === 'development';
const log = (...args) => DEBUG && console.log('[eld/callback]', ...args);

// Initialize Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

/**
 * Decode state parameter from OAuth callback
 * State format: base64(JSON.stringify({ userId, provider, reconnect?, connectionId? }))
 */
function decodeState(stateParam) {
  try {
    const decoded = Buffer.from(stateParam, 'base64').toString('utf-8');
    return JSON.parse(decoded);
  } catch (err) {
    log('Error decoding state:', err);
    return null;
  }
}

/**
 * GET /api/eld/callback
 *
 * Receives OAuth callback from ELD providers with authorization code.
 * Query params:
 *   - code: Authorization code from OAuth provider
 *   - state: Encoded state with userId, provider info
 *   - error: OAuth error code (if auth failed)
 *   - error_description: OAuth error description
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    // Get parameters from callback
    const code = searchParams.get('code');
    const stateParam = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // Get the base URL for redirects
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Handle OAuth errors from provider
    if (error) {
      log(`OAuth error from provider: ${error} - ${errorDescription}`);
      return NextResponse.redirect(
        `${baseUrl}/dashboard/settings?tab=eld&error=${encodeURIComponent(errorDescription || error)}`
      );
    }

    // Validate authorization code
    if (!code) {
      log('Missing authorization code');
      return NextResponse.redirect(
        `${baseUrl}/dashboard/settings?tab=eld&error=${encodeURIComponent('No authorization code received')}`
      );
    }

    // Decode and validate state
    if (!stateParam) {
      log('Missing state parameter');
      return NextResponse.redirect(
        `${baseUrl}/dashboard/settings?tab=eld&error=${encodeURIComponent('Invalid callback state')}`
      );
    }

    const state = decodeState(stateParam);
    if (!state || !state.userId || !state.provider) {
      log('Invalid state data:', state);
      return NextResponse.redirect(
        `${baseUrl}/dashboard/settings?tab=eld&error=${encodeURIComponent('Invalid callback state')}`
      );
    }

    const { userId, provider, reconnect, connectionId } = state;
    log(`Processing OAuth callback for ${provider}, user: ${userId}`);

    // Verify user exists
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);

    if (userError || !userData?.user) {
      log(`User not found: ${userId}`);
      return NextResponse.redirect(
        `${baseUrl}/dashboard/settings?tab=eld&error=${encodeURIComponent('User not found')}`
      );
    }

    // Check subscription tier for ELD access
    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('plan, status')
      .eq('user_id', userId)
      .single();

    const userPlan = subscription?.plan || 'basic';
    const hasEldAccess = hasFeature(userPlan, 'eldIntegration');

    if (!hasEldAccess) {
      log(`User ${userId} does not have ELD access (plan: ${userPlan})`);
      return NextResponse.redirect(
        `${baseUrl}/dashboard/settings?tab=eld&error=${encodeURIComponent('ELD integration requires Premium or higher plan')}`
      );
    }

    // Build redirect URI for token exchange
    const redirectUri = `${baseUrl}/api/eld/callback`;

    // Exchange code for tokens and create connection
    const result = await handleOAuthCallback(code, stateParam, redirectUri);

    if (result.error) {
      log(`Error handling OAuth callback: ${result.errorMessage}`);
      return NextResponse.redirect(
        `${baseUrl}/dashboard/settings?tab=eld&error=${encodeURIComponent(result.errorMessage)}`
      );
    }

    // Determine success message
    let successMessage;
    if (reconnect) {
      successMessage = `${getProviderDisplayName(provider)} reconnected successfully`;
    } else if (result.updated) {
      successMessage = `${getProviderDisplayName(provider)} connection updated`;
    } else {
      successMessage = `${getProviderDisplayName(provider)} connected successfully`;
    }

    log(`Connection ${result.updated ? 'updated' : 'created'} for user ${userId}`);

    // Success - redirect to settings
    return NextResponse.redirect(
      `${baseUrl}/dashboard/settings?tab=eld&success=${encodeURIComponent(successMessage)}&provider=${encodeURIComponent(provider)}`
    );

  } catch (error) {
    log('Callback error:', error);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return NextResponse.redirect(
      `${baseUrl}/dashboard/settings?tab=eld&error=${encodeURIComponent('Connection failed. Please try again.')}`
    );
  }
}

/**
 * Get display name for provider
 */
function getProviderDisplayName(provider) {
  const names = {
    motive: 'Motive',
    samsara: 'Samsara',
    keeptruckin: 'Motive'
  };
  return names[provider?.toLowerCase()] || provider;
}
