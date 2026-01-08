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
        autoSyncInvoices: connection.auto_sync_invoices,
        lastSyncAt: connection.last_sync_at,
        createdAt: connection.created_at,
        errorMessage: connection.error_message
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
