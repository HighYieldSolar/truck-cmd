/**
 * QuickBooks Connect Route
 *
 * Initiates OAuth flow with QuickBooks Online.
 * Generates authorization URL for user to connect their QB account.
 * Requires Premium+ subscription tier.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthorizationUrl } from '@/lib/services/quickbooks/quickbooksConnectionService';
import { hasFeature } from '@/config/tierConfig';

const DEBUG = process.env.NODE_ENV === 'development';
const log = (...args) => DEBUG && console.log('[quickbooks/connect]', ...args);

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
 * Check if user has QuickBooks access
 */
async function checkQuickBooksAccess(userId) {
  const { data: subscription } = await supabaseAdmin
    .from('subscriptions')
    .select('plan, status')
    .eq('user_id', userId)
    .single();

  const userPlan = subscription?.plan || 'basic';
  return hasFeature(userPlan, 'quickbooksIntegration');
}

/**
 * POST /api/quickbooks/connect
 *
 * Generate OAuth authorization URL for QuickBooks.
 * Body (optional):
 *   - reconnect: boolean - If reconnecting an existing connection
 */
export async function POST(request) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check QuickBooks access
    const hasAccess = await checkQuickBooksAccess(user.id);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'QuickBooks integration requires Premium or higher plan' },
        { status: 403 }
      );
    }

    let body = {};
    try {
      body = await request.json();
    } catch {
      // Empty body is ok
    }

    const { reconnect } = body;

    // Get OAuth authorization URL
    // Use NEXT_PUBLIC_URL for local dev, NEXT_PUBLIC_APP_URL for production
    const baseUrl = process.env.NEXT_PUBLIC_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const redirectUri = `${baseUrl}/api/quickbooks/callback`;

    const result = getAuthorizationUrl(user.id, redirectUri, { reconnect });

    if (result.error) {
      log('Error generating auth URL:', result.errorMessage);
      return NextResponse.json(
        { error: result.errorMessage || 'Failed to generate authorization URL' },
        { status: 500 }
      );
    }

    log('Generated QuickBooks OAuth URL for user:', user.id);

    return NextResponse.json({
      authUrl: result.authUrl,
      provider: 'quickbooks'
    });

  } catch (error) {
    log('Error in connect:', error);
    return NextResponse.json(
      { error: 'Failed to initiate QuickBooks connection' },
      { status: 500 }
    );
  }
}
