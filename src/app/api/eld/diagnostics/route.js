/**
 * ELD Diagnostics Route
 *
 * Provides vehicle diagnostics data (fault codes, health alerts).
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getDiagnosticsData } from '@/lib/services/eld/eldDiagnosticsService';
import { hasFeature } from '@/config/tierConfig';

const DEBUG = process.env.NODE_ENV === 'development';
const log = (...args) => DEBUG && console.log('[eld/diagnostics]', ...args);

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
 * Create an authenticated Supabase client with the user's token
 */
function createAuthenticatedClient(accessToken) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    }
  );
}

/**
 * Get the authenticated user from the Authorization header
 */
async function getAuthenticatedUser(request) {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.replace('Bearer ', '');
  const supabase = createAuthenticatedClient(token);

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return null;
  }

  return user;
}

/**
 * GET /api/eld/diagnostics
 *
 * Get vehicle diagnostics data including fault codes and health alerts.
 */
export async function GET(request) {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check subscription for diagnostics access
    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('plan, status')
      .eq('user_id', user.id)
      .single();

    const userPlan = subscription?.plan || 'basic';

    if (!hasFeature(userPlan, 'eldDiagnostics')) {
      return NextResponse.json(
        { error: 'Vehicle diagnostics requires Fleet or higher plan' },
        { status: 403 }
      );
    }

    // Get diagnostics data
    const diagnosticsData = await getDiagnosticsData(user.id);

    if (diagnosticsData.error) {
      log('Error getting diagnostics:', diagnosticsData.errorMessage);
      return NextResponse.json(
        { error: diagnosticsData.errorMessage || 'Failed to get diagnostics data' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      faultCodes: diagnosticsData.faultCodes || [],
      summary: diagnosticsData.summary || {
        totalFaults: 0,
        criticalCount: 0,
        warningCount: 0,
        infoCount: 0,
        vehiclesWithFaults: 0
      },
      lastUpdated: diagnosticsData.lastUpdated || new Date().toISOString()
    });

  } catch (error) {
    log('Error in diagnostics:', error);
    return NextResponse.json(
      { error: 'Failed to get diagnostics data' },
      { status: 500 }
    );
  }
}
