/**
 * ELD GPS Refresh Route
 *
 * Triggers a refresh of GPS location data from the ELD provider.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { refreshLocations } from '@/lib/services/eld/eldGpsService';
import { hasFeature } from '@/config/tierConfig';

const DEBUG = process.env.NODE_ENV === 'development';
const log = (...args) => DEBUG && console.log('[eld/gps/refresh]', ...args);

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
 * POST /api/eld/gps/refresh
 *
 * Refresh GPS locations for all vehicles.
 */
export async function POST(request) {
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

    // Get active ELD connection
    const { data: connection } = await supabaseAdmin
      .from('eld_connections')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .limit(1)
      .single();

    if (!connection) {
      return NextResponse.json(
        { error: 'No active ELD connection found' },
        { status: 404 }
      );
    }

    // Refresh GPS locations
    const result = await refreshLocations(user.id);

    if (result.error) {
      log('Error refreshing GPS:', result.errorMessage);
      return NextResponse.json(
        { error: result.errorMessage || 'Failed to refresh GPS data' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      vehiclesUpdated: result.vehiclesUpdated || 0,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    log('Error refreshing GPS:', error);
    return NextResponse.json(
      { error: 'Failed to refresh GPS data' },
      { status: 500 }
    );
  }
}
