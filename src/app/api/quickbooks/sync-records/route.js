/**
 * QuickBooks Sync Records Route
 *
 * Get sync records for multiple entities at once.
 * Used to efficiently display sync status in expense/invoice lists.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getConnection } from '@/lib/services/quickbooks/quickbooksConnectionService';
import { hasFeature } from '@/config/tierConfig';

const DEBUG = process.env.NODE_ENV === 'development';
const log = (...args) => DEBUG && console.log('[quickbooks/sync-records]', ...args);

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
 * POST /api/quickbooks/sync-records
 *
 * Get sync records for multiple entities.
 * Body:
 *   - entityType: 'expense' | 'invoice'
 *   - entityIds: string[] - Array of entity IDs to check
 */
export async function POST(request) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check QuickBooks access
    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('plan, status')
      .eq('user_id', user.id)
      .single();

    const userPlan = subscription?.plan || 'basic';
    const hasAccess = hasFeature(userPlan, 'quickbooksIntegration');

    if (!hasAccess) {
      return NextResponse.json({
        connected: false,
        hasAccess: false,
        records: {}
      });
    }

    // Get connection
    const connectionResult = await getConnection(user.id);

    if (connectionResult.error || !connectionResult.data) {
      return NextResponse.json({
        connected: false,
        hasAccess: true,
        records: {}
      });
    }

    const connection = connectionResult.data;

    // Parse request body
    const body = await request.json();
    const { entityType, entityIds } = body;

    if (!entityType || !entityIds || !Array.isArray(entityIds)) {
      return NextResponse.json(
        { error: 'entityType and entityIds array required' },
        { status: 400 }
      );
    }

    if (entityIds.length === 0) {
      return NextResponse.json({
        connected: connection.status === 'active',
        hasAccess: true,
        connectionId: connection.id,
        records: {}
      });
    }

    // Limit to prevent abuse
    const limitedIds = entityIds.slice(0, 100);

    // Fetch sync records
    const { data: syncRecords, error } = await supabaseAdmin
      .from('quickbooks_sync_records')
      .select('*')
      .eq('connection_id', connection.id)
      .eq('entity_type', entityType)
      .in('local_entity_id', limitedIds);

    if (error) {
      log('Error fetching sync records:', error);
      return NextResponse.json(
        { error: 'Failed to fetch sync records' },
        { status: 500 }
      );
    }

    // Convert to a map for easy lookup
    const recordsMap = {};
    for (const record of (syncRecords || [])) {
      recordsMap[record.local_entity_id] = {
        id: record.id,
        sync_status: record.sync_status,
        qb_entity_id: record.qb_entity_id,
        last_synced_at: record.last_synced_at,
        error_message: record.error_message,
        qb_entity_type: record.qb_entity_type
      };
    }

    return NextResponse.json({
      connected: connection.status === 'active',
      hasAccess: true,
      connectionId: connection.id,
      records: recordsMap
    });

  } catch (error) {
    log('Error in sync-records:', error);
    return NextResponse.json(
      { error: 'Failed to get sync records' },
      { status: 500 }
    );
  }
}
