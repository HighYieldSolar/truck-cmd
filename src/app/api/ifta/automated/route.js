/**
 * Automated IFTA API Route
 *
 * Fetches automated IFTA mileage data from GPS breadcrumbs
 * processed through PostGIS jurisdiction detection.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { hasFeature } from '@/config/tierConfig';

const DEBUG = process.env.NODE_ENV === 'development';
const log = (...args) => DEBUG && console.log('[api/ifta/automated]', ...args);

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
 * Parse quarter string to date range
 */
function getQuarterDateRange(quarter) {
  const [year, q] = quarter.split('-Q');
  const quarterNum = parseInt(q);
  const startMonth = (quarterNum - 1) * 3;

  const startDate = new Date(parseInt(year), startMonth, 1);
  const endDate = new Date(parseInt(year), startMonth + 3, 0, 23, 59, 59, 999);

  return { startDate, endDate };
}

/**
 * GET /api/ifta/automated
 *
 * Get automated IFTA mileage for a quarter.
 * Query params:
 *   - quarter: Quarter in YYYY-Q# format (required)
 *   - vehicleId: Optional vehicle filter
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
        { error: 'Automated IFTA tracking requires Premium or higher plan' },
        { status: 403 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const quarter = searchParams.get('quarter');
    const vehicleId = searchParams.get('vehicleId');

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

    const { startDate, endDate } = getQuarterDateRange(quarter);

    // Build query for automated mileage
    let mileageQuery = supabaseAdmin
      .from('ifta_automated_mileage')
      .select('*')
      .eq('user_id', user.id)
      .eq('quarter', quarter);

    if (vehicleId && vehicleId !== 'all') {
      mileageQuery = mileageQuery.eq('vehicle_id', vehicleId);
    }

    const { data: mileageData, error: mileageError } = await mileageQuery;

    if (mileageError && mileageError.code !== '42P01') {
      // 42P01 = relation does not exist; treat as empty and fall through to
      // the eld_ifta_mileage fallback below.
      throw mileageError;
    }

    // Aggregate mileage by jurisdiction
    const jurisdictionTotals = {};
    let totalMiles = 0;
    let totalCrossings = 0;

    (mileageData || []).forEach(record => {
      const code = record.jurisdiction;
      const miles = parseFloat(record.total_miles) || 0;
      const crossings = record.crossing_count || 0;

      if (!jurisdictionTotals[code]) {
        jurisdictionTotals[code] = {
          code,
          miles: 0,
          crossings: 0
        };
      }

      jurisdictionTotals[code].miles += miles;
      jurisdictionTotals[code].crossings += crossings;
      totalMiles += miles;
      totalCrossings += crossings;
    });

    // Fallback to eld_ifta_mileage (provider-computed, from Motive
    // /v1/ifta/summary) when the PostGIS pipeline has not populated
    // ifta_automated_mileage. Motive already aggregates per (vehicle,
    // jurisdiction) on their side so these numbers are authoritative.
    if (totalMiles === 0) {
      const { data: eldRows } = await supabaseAdmin
        .from('eld_ifta_mileage')
        .select('jurisdiction, miles, eld_vehicle_id')
        .eq('user_id', user.id)
        .eq('quarter', quarter);

      for (const row of (eldRows || [])) {
        const code = row.jurisdiction;
        const miles = parseFloat(row.miles) || 0;
        if (!code || miles <= 0) continue;

        if (!jurisdictionTotals[code]) {
          jurisdictionTotals[code] = { code, miles: 0, crossings: 0 };
        }
        jurisdictionTotals[code].miles += miles;
        totalMiles += miles;
      }
    }

    // Convert to sorted array
    const jurisdictions = Object.values(jurisdictionTotals)
      .filter(j => j.miles > 0)
      .sort((a, b) => b.miles - a.miles);

    // Get breadcrumb count for the quarter
    let breadcrumbQuery = supabaseAdmin
      .from('eld_gps_breadcrumbs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('recorded_at', startDate.toISOString())
      .lte('recorded_at', endDate.toISOString());

    if (vehicleId && vehicleId !== 'all') {
      breadcrumbQuery = breadcrumbQuery.eq('vehicle_id', vehicleId);
    }

    const { count: breadcrumbCount, error: breadcrumbError } = await breadcrumbQuery;

    // Get crossing events count
    let crossingQuery = supabaseAdmin
      .from('ifta_automated_crossings')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('crossing_time', startDate.toISOString())
      .lte('crossing_time', endDate.toISOString());

    if (vehicleId && vehicleId !== 'all') {
      crossingQuery = crossingQuery.eq('vehicle_id', vehicleId);
    }

    const { count: crossingCount } = await crossingQuery;

    // Check ELD connection status
    const { data: eldConnection } = await supabaseAdmin
      .from('eld_connections')
      .select('id, provider, status')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .limit(1)
      .single();

    return NextResponse.json({
      quarter,
      jurisdictions,
      totalMiles,
      jurisdictionCount: jurisdictions.length,
      breadcrumbCount: breadcrumbCount || 0,
      crossingCount: crossingCount || 0,
      hasData: totalMiles > 0 || (breadcrumbCount || 0) > 0,
      eldConnected: !!eldConnection,
      eldProvider: eldConnection?.provider || null,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    log('Error fetching automated IFTA data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch automated IFTA data' },
      { status: 500 }
    );
  }
}
