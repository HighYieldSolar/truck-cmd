/**
 * ELD Sync Route
 *
 * Manual sync trigger and sync status endpoints.
 * Allows users to manually trigger data sync from their ELD provider.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  syncAll,
  syncVehicles,
  syncDrivers,
  syncIftaMileage,
  syncHosLogs,
  syncVehicleLocations,
  syncFaultCodes,
  getSyncHistory,
  getLatestSyncStatus
} from '@/lib/services/eld/eldSyncService';
import { getConnection } from '@/lib/services/eld/eldConnectionService';
import { hasFeature } from '@/config/tierConfig';

const DEBUG = process.env.NODE_ENV === 'development';
const log = (...args) => DEBUG && console.log('[eld/sync]', ...args);

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
 * Check if user has ELD access and get their plan features
 */
async function checkEldAccess(userId) {
  const { data: subscription } = await supabaseAdmin
    .from('subscriptions')
    .select('plan, status')
    .eq('user_id', userId)
    .single();

  const userPlan = subscription?.plan || 'basic';

  return {
    hasAccess: hasFeature(userPlan, 'eldIntegration'),
    plan: userPlan,
    features: {
      eldIntegration: hasFeature(userPlan, 'eldIntegration'),
      eldIftaSync: hasFeature(userPlan, 'eldIftaSync'),
      eldHosTracking: hasFeature(userPlan, 'eldHosTracking'),
      eldGpsTracking: hasFeature(userPlan, 'eldGpsTracking'),
      eldDiagnostics: hasFeature(userPlan, 'eldDiagnostics')
    }
  };
}

/**
 * GET /api/eld/sync
 *
 * Get sync history and status for user's connections.
 * Query params:
 *   - connectionId: Filter by connection (optional)
 *   - limit: Number of sync records to return (default 10)
 */
export async function GET(request) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check ELD access
    const access = await checkEldAccess(user.id);
    if (!access.hasAccess) {
      return NextResponse.json(
        { error: 'ELD integration requires Premium or higher plan' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const connectionId = searchParams.get('connectionId');
    const limit = parseInt(searchParams.get('limit') || '10');

    // If connectionId provided, get that connection's sync history
    if (connectionId) {
      // Verify user owns this connection
      const connectionResult = await getConnection(user.id, 'terminal');
      if (connectionResult.error || !connectionResult.data || connectionResult.data.id !== connectionId) {
        return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
      }

      const historyResult = await getSyncHistory(connectionId, limit);
      const latestStatus = await getLatestSyncStatus(connectionId);

      return NextResponse.json({
        connectionId,
        latestSync: latestStatus,
        history: historyResult.data || []
      });
    }

    // Get sync history for all user's connections
    const { data: connections } = await supabaseAdmin
      .from('eld_connections')
      .select('id, provider, eld_provider_name, status, last_sync_at')
      .eq('user_id', user.id)
      .neq('status', 'disconnected');

    const syncData = [];
    for (const connection of (connections || [])) {
      const latestStatus = await getLatestSyncStatus(connection.id);
      syncData.push({
        connectionId: connection.id,
        provider: connection.provider,
        eldProvider: connection.eld_provider_name,
        status: connection.status,
        lastSyncAt: connection.last_sync_at,
        latestSync: latestStatus
      });
    }

    return NextResponse.json({
      connections: syncData,
      features: access.features
    });

  } catch (error) {
    log('Error getting sync status:', error);
    return NextResponse.json(
      { error: 'Failed to get sync status' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/eld/sync
 *
 * Trigger a manual data sync.
 * Body:
 *   - connectionId: Connection to sync (optional, uses primary if not provided)
 *   - syncType: 'all' | 'vehicles' | 'drivers' | 'ifta' | 'hos' | 'locations' | 'faults'
 *   - options: Sync-specific options (e.g., date ranges)
 */
export async function POST(request) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check ELD access
    const access = await checkEldAccess(user.id);
    if (!access.hasAccess) {
      return NextResponse.json(
        { error: 'ELD integration requires Premium or higher plan' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { connectionId, syncType = 'all', options = {} } = body;

    // Get the connection to sync
    let connection;
    if (connectionId) {
      const { data } = await supabaseAdmin
        .from('eld_connections')
        .select('*')
        .eq('id', connectionId)
        .eq('user_id', user.id)
        .single();
      connection = data;
    } else {
      // Use primary active connection
      const { data } = await supabaseAdmin
        .from('eld_connections')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      connection = data;
    }

    if (!connection) {
      return NextResponse.json(
        { error: 'No active ELD connection found' },
        { status: 404 }
      );
    }

    // Check if connection is active
    if (connection.status !== 'active') {
      return NextResponse.json(
        { error: 'Connection is not active. Please reconnect your ELD provider.' },
        { status: 400 }
      );
    }

    // Rate limit: Check if sync was triggered recently (within 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: recentSync } = await supabaseAdmin
      .from('eld_sync_jobs')
      .select('id, created_at')
      .eq('connection_id', connection.id)
      .eq('sync_type', syncType)
      .eq('status', 'running')
      .gte('created_at', fiveMinutesAgo)
      .single();

    if (recentSync) {
      return NextResponse.json({
        error: 'A sync is already in progress. Please wait a few minutes.',
        syncJobId: recentSync.id
      }, { status: 429 });
    }

    // Trigger the appropriate sync
    let result;
    const now = new Date();

    switch (syncType) {
      case 'all':
        result = await syncAll(user.id, connection.id);
        break;

      case 'vehicles':
        result = await syncVehicles(user.id, connection.id);
        break;

      case 'drivers':
        result = await syncDrivers(user.id, connection.id);
        break;

      case 'ifta':
        if (!access.features.eldIftaSync) {
          return NextResponse.json(
            { error: 'IFTA sync requires Premium or higher plan' },
            { status: 403 }
          );
        }
        // Default to current quarter
        const startMonth = options.startMonth || getQuarterStartMonth(now);
        const endMonth = options.endMonth || getQuarterEndMonth(now);
        result = await syncIftaMileage(user.id, connection.id, startMonth, endMonth);
        break;

      case 'hos':
        if (!access.features.eldHosTracking) {
          return NextResponse.json(
            { error: 'HOS tracking requires Premium or higher plan' },
            { status: 403 }
          );
        }
        // Default to last 7 days
        const hosStart = options.startDate || new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const hosEnd = options.endDate || now.toISOString();
        result = await syncHosLogs(user.id, connection.id, hosStart, hosEnd);
        break;

      case 'locations':
        if (!access.features.eldGpsTracking) {
          return NextResponse.json(
            { error: 'GPS tracking requires Fleet or higher plan' },
            { status: 403 }
          );
        }
        result = await syncVehicleLocations(user.id, connection.id);
        break;

      case 'faults':
        if (!access.features.eldDiagnostics) {
          return NextResponse.json(
            { error: 'Vehicle diagnostics requires Fleet or higher plan' },
            { status: 403 }
          );
        }
        result = await syncFaultCodes(user.id, connection.id);
        break;

      default:
        return NextResponse.json({ error: 'Invalid sync type' }, { status: 400 });
    }

    if (result.error) {
      return NextResponse.json({ error: result.errorMessage }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `${syncType} sync initiated`,
      syncJobId: result.syncJobId,
      recordsSynced: result.recordsSynced || 0
    });

  } catch (error) {
    log('Error triggering sync:', error);
    return NextResponse.json(
      { error: 'Failed to trigger sync' },
      { status: 500 }
    );
  }
}

/**
 * Get quarter start month in YYYY-MM format
 */
function getQuarterStartMonth(date) {
  const quarter = Math.floor(date.getMonth() / 3);
  const startMonth = quarter * 3 + 1;
  return `${date.getFullYear()}-${startMonth.toString().padStart(2, '0')}`;
}

/**
 * Get quarter end month in YYYY-MM format
 */
function getQuarterEndMonth(date) {
  const quarter = Math.floor(date.getMonth() / 3);
  const endMonth = quarter * 3 + 3;
  return `${date.getFullYear()}-${endMonth.toString().padStart(2, '0')}`;
}
