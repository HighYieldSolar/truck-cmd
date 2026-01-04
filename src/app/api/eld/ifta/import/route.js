/**
 * ELD IFTA Import Route
 *
 * Imports IFTA mileage data from ELD provider.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { importEldMileageToIfta } from '@/lib/services/eld/eldIftaService';
import { hasFeature } from '@/config/tierConfig';

const DEBUG = process.env.NODE_ENV === 'development';
const log = (...args) => DEBUG && console.log('[eld/ifta/import]', ...args);

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
 * POST /api/eld/ifta/import
 *
 * Import ELD mileage data into IFTA records.
 * Body:
 *   - quarter: Quarter in YYYY-Q# format (e.g., "2024-Q1")
 */
export async function POST(request) {
  try {
    const user = await getAuthenticatedUser();

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

    // Get quarter from body
    const body = await request.json();
    const { quarter } = body;

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

    // Import ELD mileage to IFTA
    const importResult = await importEldMileageToIfta(user.id, quarter);

    if (importResult.error) {
      log('Error importing IFTA mileage:', importResult.errorMessage);
      return NextResponse.json(
        { error: importResult.errorMessage || 'Failed to import IFTA mileage' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      quarter,
      recordsImported: importResult.recordsImported || 0,
      totalMiles: importResult.totalMiles || 0,
      jurisdictions: importResult.jurisdictions || 0,
      importedAt: new Date().toISOString()
    });

  } catch (error) {
    log('Error importing IFTA mileage:', error);
    return NextResponse.json(
      { error: 'Failed to import IFTA mileage' },
      { status: 500 }
    );
  }
}
