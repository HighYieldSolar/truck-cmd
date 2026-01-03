/**
 * ELD GPS Dashboard Route
 *
 * Provides GPS tracking data for the fleet map.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { getGpsDashboard } from '@/lib/services/eld/eldGpsService';
import { hasFeature } from '@/config/tierConfig';

const DEBUG = process.env.NODE_ENV === 'development';
const log = (...args) => DEBUG && console.log('[eld/gps/dashboard]', ...args);

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
 * Get the authenticated user from the session
 */
async function getAuthenticatedUser() {
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get: (name) => cookieStore.get(name)?.value
    }
  });

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

/**
 * GET /api/eld/gps/dashboard
 *
 * Get GPS location data for all vehicles.
 */
export async function GET(request) {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check subscription for GPS access
    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('plan, status')
      .eq('user_id', user.id)
      .single();

    const userPlan = subscription?.plan || 'basic';

    if (!hasFeature(userPlan, 'eldGpsTracking')) {
      return NextResponse.json(
        { error: 'GPS tracking requires Fleet or higher plan' },
        { status: 403 }
      );
    }

    // Get GPS dashboard data
    const dashboardData = await getGpsDashboard(user.id);

    if (dashboardData.error) {
      log('Error getting GPS dashboard:', dashboardData.errorMessage);
      return NextResponse.json(
        { error: dashboardData.errorMessage || 'Failed to get GPS data' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      vehicles: dashboardData.vehicles || [],
      summary: dashboardData.summary || {
        totalVehicles: 0,
        vehiclesMoving: 0,
        vehiclesIdle: 0,
        vehiclesOffline: 0
      },
      lastUpdated: dashboardData.lastUpdated || new Date().toISOString()
    });

  } catch (error) {
    log('Error in GPS dashboard:', error);
    return NextResponse.json(
      { error: 'Failed to get GPS dashboard data' },
      { status: 500 }
    );
  }
}
