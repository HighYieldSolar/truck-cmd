/**
 * QuickBooks OAuth Callback Route
 *
 * Handles OAuth callback from QuickBooks Online.
 * Exchanges authorization code for tokens and creates/updates the QB connection.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { handleOAuthCallback } from '@/lib/services/quickbooks/quickbooksConnectionService';
import { autoMapCategories } from '@/lib/services/quickbooks/quickbooksMappingService';
import { hasFeature } from '@/config/tierConfig';

const DEBUG = process.env.NODE_ENV === 'development';
const log = (...args) => DEBUG && console.log('[quickbooks/callback]', ...args);

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
 * State format: base64(JSON.stringify({ userId, reconnect? }))
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
 * GET /api/quickbooks/callback
 *
 * Receives OAuth callback from QuickBooks with authorization code.
 * Query params:
 *   - code: Authorization code from QuickBooks
 *   - state: Encoded state with userId info
 *   - realmId: QuickBooks company ID
 *   - error: OAuth error code (if auth failed)
 *   - error_description: OAuth error description
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    // Get parameters from callback
    const code = searchParams.get('code');
    const stateParam = searchParams.get('state');
    const realmId = searchParams.get('realmId');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // Get the base URL for redirects
    const baseUrl = process.env.NEXT_PUBLIC_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Redirect to expenses page since that's where QB integration lives
    const redirectBase = `${baseUrl}/dashboard/expenses`;

    // Handle OAuth errors from QuickBooks
    if (error) {
      log(`OAuth error from QuickBooks: ${error} - ${errorDescription}`);
      return NextResponse.redirect(
        `${redirectBase}?qb_error=${encodeURIComponent(errorDescription || error)}`
      );
    }

    // Validate authorization code
    if (!code) {
      log('Missing authorization code');
      return NextResponse.redirect(
        `${redirectBase}?qb_error=${encodeURIComponent('No authorization code received')}`
      );
    }

    // Validate realm ID
    if (!realmId) {
      log('Missing realmId (company ID)');
      return NextResponse.redirect(
        `${redirectBase}?qb_error=${encodeURIComponent('No QuickBooks company selected')}`
      );
    }

    // Decode and validate state
    if (!stateParam) {
      log('Missing state parameter');
      return NextResponse.redirect(
        `${redirectBase}?qb_error=${encodeURIComponent('Invalid callback state')}`
      );
    }

    const state = decodeState(stateParam);
    if (!state || !state.userId) {
      log('Invalid state data:', state);
      return NextResponse.redirect(
        `${redirectBase}?qb_error=${encodeURIComponent('Invalid callback state')}`
      );
    }

    const { userId, reconnect } = state;
    log(`Processing OAuth callback for user: ${userId}, realmId: ${realmId}`);

    // Verify user exists
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);

    if (userError || !userData?.user) {
      log(`User not found: ${userId}`);
      return NextResponse.redirect(
        `${redirectBase}?qb_error=${encodeURIComponent('User not found')}`
      );
    }

    // Check subscription tier for QuickBooks access
    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('plan, status')
      .eq('user_id', userId)
      .single();

    const userPlan = subscription?.plan || 'basic';
    const hasQBAccess = hasFeature(userPlan, 'quickbooksIntegration');

    if (!hasQBAccess) {
      log(`User ${userId} does not have QuickBooks access (plan: ${userPlan})`);
      return NextResponse.redirect(
        `${redirectBase}?qb_error=${encodeURIComponent('QuickBooks integration requires Premium or higher plan')}`
      );
    }

    // Build redirect URI for token exchange
    const redirectUri = `${baseUrl}/api/quickbooks/callback`;

    // Exchange code for tokens and create connection
    const result = await handleOAuthCallback(code, stateParam, realmId, redirectUri);

    if (result.error) {
      log(`Error handling OAuth callback: ${result.errorMessage}`);
      return NextResponse.redirect(
        `${redirectBase}?qb_error=${encodeURIComponent(result.errorMessage)}`
      );
    }

    log(`QuickBooks connection ${result.updated ? 'updated' : 'created'} for user ${userId}`);

    // Auto-map expense categories on first connection
    if (!result.updated && result.connectionId) {
      log('Auto-mapping expense categories...');
      try {
        const mappingResult = await autoMapCategories(result.connectionId, userId);
        if (mappingResult.success) {
          log(`Auto-mapped ${mappingResult.mapped?.length || 0} categories`);
        } else {
          log('Auto-mapping failed:', mappingResult.errorMessage);
        }
      } catch (mapError) {
        log('Error during auto-mapping (non-fatal):', mapError);
        // Don't fail the connection for mapping errors
      }
    }

    // Determine success message
    let successMessage;
    if (reconnect) {
      successMessage = 'QuickBooks reconnected successfully';
    } else if (result.updated) {
      successMessage = 'QuickBooks connection updated';
    } else {
      successMessage = 'QuickBooks connected successfully';
    }

    // Success - redirect to expenses page with success message
    return NextResponse.redirect(
      `${redirectBase}?qb_success=${encodeURIComponent(successMessage)}`
    );

  } catch (error) {
    log('Callback error:', error);
    const baseUrl = process.env.NEXT_PUBLIC_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return NextResponse.redirect(
      `${baseUrl}/dashboard/expenses?qb_error=${encodeURIComponent('Connection failed. Please try again.')}`
    );
  }
}
