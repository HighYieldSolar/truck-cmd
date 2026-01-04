/**
 * ELD IFTA Summary Route
 *
 * Provides IFTA mileage summary from ELD data.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getEldMileageSummary } from '@/lib/services/eld/eldIftaService';
import { hasFeature } from '@/config/tierConfig';

const DEBUG = process.env.NODE_ENV === 'development';
const log = (...args) => DEBUG && console.log('[eld/ifta/summary]', ...args);

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
 * GET /api/eld/ifta/summary
 *
 * Get IFTA mileage summary for a quarter.
 * Query params:
 *   - quarter: Quarter in YYYY-Q# format (e.g., "2024-Q1")
 */
export async function GET(request) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check subscription for IFTA sync access
    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('plan, status')
      .eq('user_id', user.id)
      .single();

    const userPlan = subscription?.plan || 'basic';

    if (!hasFeature(userPlan, 'eldIftaSync')) {
      return NextResponse.json(
        { error: 'IFTA sync requires Premium or higher plan' },
        { status: 403 }
      );
    }

    // Get quarter from query params
    const { searchParams } = new URL(request.url);
    const quarter = searchParams.get('quarter');

    if (!quarter) {
      return NextResponse.json(
        { error: 'Quarter parameter is required' },
        { status: 400 }
      );
    }

    // Validate quarter format
    const quarterRegex = /^\d{4}-Q[1-4]$/;
    if (!quarterRegex.test(quarter)) {
      return NextResponse.json(
        { error: 'Invalid quarter format. Use YYYY-Q# (e.g., 2024-Q1)' },
        { status: 400 }
      );
    }

    // Get IFTA summary
    const summaryData = await getEldMileageSummary(user.id, quarter);

    if (summaryData.error) {
      log('Error getting IFTA summary:', summaryData.errorMessage);
      return NextResponse.json(
        { error: summaryData.errorMessage || 'Failed to get IFTA summary' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      quarter,
      eldMileage: summaryData.eldMileage || {
        totalMiles: 0,
        jurisdictionCount: 0,
        jurisdictions: []
      },
      manualMileage: summaryData.manualMileage || {
        totalMiles: 0,
        jurisdictionCount: 0,
        jurisdictions: []
      },
      comparison: summaryData.comparison || {
        hasDifference: false,
        differencePercent: 0
      },
      lastImportedAt: summaryData.lastImportedAt
    });

  } catch (error) {
    log('Error in IFTA summary:', error);
    return NextResponse.json(
      { error: 'Failed to get IFTA summary' },
      { status: 500 }
    );
  }
}
