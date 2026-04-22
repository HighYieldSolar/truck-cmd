/**
 * QuickBooks Status Route
 *
 * Get current QuickBooks connection status and sync statistics.
 * Returns connection health, last sync info, and mapping status.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getConnection, verifyConnection } from '@/lib/services/quickbooks/quickbooksConnectionService';
import { getMappingStatus } from '@/lib/services/quickbooks/quickbooksMappingService';
import { getSyncStatus } from '@/lib/services/quickbooks/quickbooksSyncService';
import { hasFeature } from '@/config/tierConfig';

const DEBUG = process.env.NODE_ENV === 'development';
const log = (...args) => DEBUG && console.log('[quickbooks/status]', ...args);

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
  return {
    hasAccess: hasFeature(userPlan, 'quickbooksIntegration'),
    plan: userPlan
  };
}

/**
 * GET /api/quickbooks/status
 *
 * Get QuickBooks connection status and sync statistics.
 * Query params:
 *   - verify: boolean - If true, verify connection with QuickBooks API
 *   - includeHistory: boolean - If true, include recent sync history
 */
export async function GET(request) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const verify = searchParams.get('verify') === 'true';
    const includeHistory = searchParams.get('includeHistory') === 'true';

    // Check QuickBooks access
    const { hasAccess, plan } = await checkQuickBooksAccess(user.id);

    if (!hasAccess) {
      return NextResponse.json({
        connected: false,
        hasAccess: false,
        plan,
        message: 'QuickBooks integration requires Premium or higher plan'
      });
    }

    // Get connection
    const connectionResult = await getConnection(user.id);

    if (connectionResult.error || !connectionResult.data) {
      return NextResponse.json({
        connected: false,
        hasAccess: true,
        plan,
        message: 'QuickBooks not connected'
      });
    }

    const connection = connectionResult.data;

    // Optionally verify connection with QuickBooks API
    let connectionHealth = null;
    if (verify && connection.status === 'active') {
      const verifyResult = await verifyConnection(connection.id);
      connectionHealth = {
        verified: !verifyResult.error,
        verifiedAt: new Date().toISOString(),
        error: verifyResult.error ? verifyResult.errorMessage : null
      };
    }

    // Get mapping status
    let mappingStatus = null;
    try {
      mappingStatus = await getMappingStatus(connection.id);
    } catch (e) {
      log('Error getting mapping status:', e);
    }

    // Get sync statistics
    let syncStatus = null;
    try {
      syncStatus = await getSyncStatus(user.id);
    } catch (e) {
      log('Error getting sync status:', e);
    }

    // Get recent sync history if requested
    let recentHistory = null;
    if (includeHistory) {
      try {
        const { data: history } = await supabaseAdmin
          .from('quickbooks_sync_history')
          .select('*')
          .eq('connection_id', connection.id)
          .order('started_at', { ascending: false })
          .limit(10);

        recentHistory = history || [];
      } catch (e) {
        log('Error getting sync history:', e);
      }
    }

    // Calculate token health
    const now = new Date();
    const tokenExpiresAt = connection.token_expires_at ? new Date(connection.token_expires_at) : null;
    const refreshTokenExpiresAt = connection.refresh_token_expires_at
      ? new Date(connection.refresh_token_expires_at)
      : null;

    // Calculate time until token expires (use decimal hours for precision)
    const accessTokenExpiresInMs = tokenExpiresAt ? tokenExpiresAt - now : null;
    const accessTokenExpiresInHours = accessTokenExpiresInMs !== null
      ? Math.round((accessTokenExpiresInMs / (1000 * 60 * 60)) * 10) / 10  // Round to 1 decimal
      : null;

    // Refresh token expires in ~100 days from last refresh
    // If we don't have refresh_token_expires_at, estimate from created/updated date
    const refreshTokenCreatedAt = connection.updated_at || connection.created_at;
    const estimatedRefreshExpiry = new Date(new Date(refreshTokenCreatedAt).getTime() + 100 * 24 * 60 * 60 * 1000);
    const effectiveRefreshExpiry = refreshTokenExpiresAt || estimatedRefreshExpiry;
    const refreshTokenExpiresInMs = effectiveRefreshExpiry - now;
    const refreshTokenExpiresInDays = Math.floor(refreshTokenExpiresInMs / (1000 * 60 * 60 * 24));

    // Determine health status
    let healthStatus = 'healthy';
    let healthWarning = null;

    if (connection.status === 'token_expired') {
      healthStatus = 'expired';
      healthWarning = 'Connection expired. Please reconnect.';
    } else if (refreshTokenExpiresInDays <= 0) {
      healthStatus = 'expired';
      healthWarning = 'Refresh token expired. Please reconnect.';
    } else if (refreshTokenExpiresInDays <= 7) {
      healthStatus = 'warning';
      healthWarning = `Refresh token expires in ${refreshTokenExpiresInDays} days. Refresh connection soon.`;
    } else if (accessTokenExpiresInHours !== null && accessTokenExpiresInHours < 0) {
      healthStatus = 'needs_refresh';
      healthWarning = 'Access token expired. Will refresh automatically on next sync.';
    }

    // Format response
    const response = {
      connected: connection.status === 'active',
      hasAccess: true,
      plan,
      connection: {
        id: connection.id,
        status: connection.status,
        companyName: connection.company_name,
        realmId: connection.realm_id,
        autoSyncExpenses: connection.auto_sync_expenses,
        lastSyncAt: connection.last_sync_at,
        lastVerifiedAt: connection.last_verified_at,
        createdAt: connection.created_at,
        errorMessage: connection.error_message,
        // Token health info
        tokenHealth: {
          status: healthStatus,
          warning: healthWarning,
          accessTokenExpiresInHours,
          refreshTokenExpiresInDays,
          tokenExpiresAt: tokenExpiresAt?.toISOString(),
          refreshTokenExpiresAt: effectiveRefreshExpiry?.toISOString()
        }
      },
      mapping: mappingStatus ? {
        totalCategories: mappingStatus.totalCategories,
        mappedCount: mappingStatus.mappedCount,
        unmappedCount: mappingStatus.unmappedCount,
        isComplete: mappingStatus.isComplete,
        unmappedCategories: mappingStatus.unmappedCategories
      } : null,
      sync: syncStatus ? {
        totalExpensesSynced: syncStatus.totalExpensesSynced,
        totalInvoicesSynced: syncStatus.totalInvoicesSynced,
        failedSyncs: syncStatus.failedSyncs,
        pendingSyncs: syncStatus.pendingSyncs,
        lastSyncAt: syncStatus.lastSyncAt
      } : null
    };

    if (connectionHealth) {
      response.health = connectionHealth;
    }

    if (recentHistory) {
      response.recentHistory = recentHistory.map(h => ({
        id: h.id,
        syncType: h.sync_type,
        entityTypes: h.entity_types,
        status: h.status,
        recordsSynced: h.records_synced,
        recordsFailed: h.records_failed,
        startedAt: h.started_at,
        completedAt: h.completed_at
      }));
    }

    return NextResponse.json(response);

  } catch (error) {
    log('Error getting status:', error);
    return NextResponse.json(
      { error: 'Failed to get QuickBooks status' },
      { status: 500 }
    );
  }
}
