/**
 * QuickBooks Token Refresh Route
 *
 * Manually refresh the QuickBooks access token.
 * Used when token is expiring soon or to verify connection health.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getConnection, refreshTokens, verifyConnection } from '@/lib/services/quickbooks/quickbooksConnectionService';
import { hasFeature } from '@/config/tierConfig';

const DEBUG = process.env.NODE_ENV === 'development';
const log = (...args) => DEBUG && console.log('[quickbooks/refresh]', ...args);

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
 * Get the authenticated user from the Authorization header
 */
async function getAuthenticatedUser(request) {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.replace('Bearer ', '');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    }
  );

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return null;
  }

  return user;
}

/**
 * POST /api/quickbooks/refresh
 *
 * Refresh the QuickBooks access token.
 * Body (optional):
 *   - verify: boolean - If true, verify connection after refresh
 */
export async function POST(request) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check QuickBooks access
    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('plan, status')
      .eq('user_id', user.id)
      .single();

    const userPlan = subscription?.plan || 'basic';
    if (!hasFeature(userPlan, 'quickbooksIntegration')) {
      return NextResponse.json(
        { error: 'QuickBooks integration requires Premium or higher plan' },
        { status: 403 }
      );
    }

    // Get connection
    const connectionResult = await getConnection(user.id);
    if (connectionResult.error || !connectionResult.data) {
      return NextResponse.json(
        { error: 'QuickBooks not connected' },
        { status: 400 }
      );
    }

    const connection = connectionResult.data;

    if (connection.status === 'disconnected') {
      return NextResponse.json(
        { error: 'QuickBooks is disconnected. Please reconnect.' },
        { status: 400 }
      );
    }

    // Parse request body
    let verify = false;
    try {
      const body = await request.json();
      verify = body.verify === true;
    } catch {
      // No body or invalid JSON, use defaults
    }

    log('Refreshing tokens for connection:', connection.id);

    // Refresh tokens
    const refreshResult = await refreshTokens(connection.id);

    if (refreshResult.error) {
      return NextResponse.json(
        {
          error: refreshResult.errorMessage,
          needsReconnect: true
        },
        { status: 400 }
      );
    }

    // Update last_verified_at
    await supabaseAdmin
      .from('quickbooks_connections')
      .update({
        last_verified_at: new Date().toISOString()
      })
      .eq('id', connection.id);

    // Optionally verify connection
    let verifyResult = null;
    if (verify) {
      verifyResult = await verifyConnection(connection.id);
    }

    return NextResponse.json({
      success: true,
      message: 'Token refreshed successfully',
      expiresAt: refreshResult.expiresAt,
      verified: verifyResult ? verifyResult.valid : null
    });

  } catch (error) {
    log('Error refreshing token:', error);
    return NextResponse.json(
      { error: 'Failed to refresh token' },
      { status: 500 }
    );
  }
}
