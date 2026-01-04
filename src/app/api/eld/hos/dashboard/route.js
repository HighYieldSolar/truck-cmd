/**
 * ELD HOS Dashboard Route
 *
 * Provides HOS (Hours of Service) data for the driver dashboard.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getHosDashboard } from '@/lib/services/eld/eldHosService';
import { hasFeature } from '@/config/tierConfig';

const DEBUG = process.env.NODE_ENV === 'development';
const log = (...args) => DEBUG && console.log('[eld/hos/dashboard]', ...args);

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
 * GET /api/eld/hos/dashboard
 *
 * Get HOS compliance data for all drivers.
 */
export async function GET(request) {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check subscription for ELD HOS access
    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('plan, status')
      .eq('user_id', user.id)
      .single();

    const userPlan = subscription?.plan || 'basic';

    if (!hasFeature(userPlan, 'eldHosTracking')) {
      return NextResponse.json(
        { error: 'HOS tracking requires Premium or higher plan' },
        { status: 403 }
      );
    }

    // Get HOS dashboard data
    const dashboardData = await getHosDashboard(user.id);

    if (dashboardData.error) {
      log('Error getting HOS dashboard:', dashboardData.errorMessage);
      return NextResponse.json(
        { error: dashboardData.errorMessage || 'Failed to get HOS data' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      drivers: dashboardData.drivers || [],
      summary: dashboardData.summary || {
        totalDrivers: 0,
        driversOnDuty: 0,
        driversOffDuty: 0,
        driversDriving: 0,
        driversInViolation: 0
      },
      lastUpdated: dashboardData.lastUpdated || new Date().toISOString()
    });

  } catch (error) {
    log('Error in HOS dashboard:', error);
    return NextResponse.json(
      { error: 'Failed to get HOS dashboard data' },
      { status: 500 }
    );
  }
}
