/**
 * QuickBooks Mappings Route
 *
 * Manage category-to-account mappings between Truck Command and QuickBooks.
 * Maps TC expense categories (Fuel, Maintenance, etc.) to QB Chart of Accounts.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getConnection } from '@/lib/services/quickbooks/quickbooksConnectionService';
import {
  getMappings,
  upsertMapping,
  deleteMapping,
  autoMapCategories,
  TC_EXPENSE_CATEGORIES
} from '@/lib/services/quickbooks/quickbooksMappingService';
import { hasFeature } from '@/config/tierConfig';

const DEBUG = process.env.NODE_ENV === 'development';
const log = (...args) => DEBUG && console.log('[quickbooks/mappings]', ...args);

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
  return hasFeature(userPlan, 'quickbooksIntegration');
}

/**
 * GET /api/quickbooks/mappings
 *
 * Get current category-to-account mappings.
 */
export async function GET(request) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hasAccess = await checkQuickBooksAccess(user.id);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'QuickBooks integration requires Premium or higher plan' },
        { status: 403 }
      );
    }

    const connectionResult = await getConnection(user.id);
    if (connectionResult.error || !connectionResult.data) {
      return NextResponse.json(
        { error: 'QuickBooks not connected' },
        { status: 400 }
      );
    }

    const mappingsResult = await getMappings(connectionResult.data.id);

    if (mappingsResult.error) {
      return NextResponse.json({ error: mappingsResult.errorMessage }, { status: 500 });
    }

    // Format mappings into a map keyed by TC category
    const mappingsByCategory = {};
    for (const mapping of mappingsResult.data || []) {
      mappingsByCategory[mapping.tc_category] = {
        id: mapping.id,
        qbAccountId: mapping.qb_account_id,
        qbAccountName: mapping.qb_account_name,
        qbAccountType: mapping.qb_account_type,
        updatedAt: mapping.updated_at
      };
    }

    return NextResponse.json({
      categories: TC_EXPENSE_CATEGORIES,
      mappings: mappingsByCategory,
      mappedCount: Object.keys(mappingsByCategory).length,
      unmappedCategories: TC_EXPENSE_CATEGORIES.filter(cat => !mappingsByCategory[cat])
    });

  } catch (error) {
    log('Error getting mappings:', error);
    return NextResponse.json(
      { error: 'Failed to get mappings' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/quickbooks/mappings
 *
 * Create or update mappings.
 * Body:
 *   - action: 'set' | 'auto-map' | 'delete'
 *   - For 'set':
 *     - tcCategory: Truck Command category
 *     - qbAccountId: QuickBooks account ID
 *     - qbAccountName: QuickBooks account name
 *     - qbAccountType: QuickBooks account type
 *   - For 'delete':
 *     - mappingId: Mapping ID to delete
 */
export async function POST(request) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hasAccess = await checkQuickBooksAccess(user.id);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'QuickBooks integration requires Premium or higher plan' },
        { status: 403 }
      );
    }

    const connectionResult = await getConnection(user.id);
    if (connectionResult.error || !connectionResult.data) {
      return NextResponse.json(
        { error: 'QuickBooks not connected' },
        { status: 400 }
      );
    }

    const connection = connectionResult.data;
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'set': {
        const { tcCategory, qbAccountId, qbAccountName, qbAccountType } = body;

        if (!tcCategory || !qbAccountId || !qbAccountName) {
          return NextResponse.json(
            { error: 'tcCategory, qbAccountId, and qbAccountName are required' },
            { status: 400 }
          );
        }

        // Validate TC category
        if (!TC_EXPENSE_CATEGORIES.includes(tcCategory)) {
          return NextResponse.json(
            { error: `Invalid category. Valid categories: ${TC_EXPENSE_CATEGORIES.join(', ')}` },
            { status: 400 }
          );
        }

        log(`Setting mapping: ${tcCategory} -> ${qbAccountName}`);
        const result = await upsertMapping(
          connection.id,
          user.id,
          tcCategory,
          qbAccountId,
          qbAccountName,
          qbAccountType || 'Expense'
        );

        if (result.error) {
          return NextResponse.json({ error: result.errorMessage }, { status: 400 });
        }

        return NextResponse.json({
          success: true,
          message: `Mapped ${tcCategory} to ${qbAccountName}`,
          mapping: result.data
        });
      }

      case 'auto-map': {
        log('Auto-mapping categories to QuickBooks accounts');
        const result = await autoMapCategories(connection.id, user.id);

        if (result.error) {
          return NextResponse.json({ error: result.errorMessage }, { status: 400 });
        }

        return NextResponse.json({
          success: true,
          message: `Auto-mapped ${result.mapped?.length || 0} categories`,
          mapped: result.mapped,
          unmapped: result.unmapped,
          totalQbAccounts: result.totalQbAccounts
        });
      }

      case 'delete': {
        const { mappingId } = body;

        if (!mappingId) {
          return NextResponse.json({ error: 'mappingId required' }, { status: 400 });
        }

        log(`Deleting mapping: ${mappingId}`);
        const result = await deleteMapping(mappingId);

        if (result.error) {
          return NextResponse.json({ error: result.errorMessage }, { status: 400 });
        }

        return NextResponse.json({
          success: true,
          message: 'Mapping deleted'
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Valid actions: set, auto-map, delete' },
          { status: 400 }
        );
    }

  } catch (error) {
    log('Error in mappings:', error);
    return NextResponse.json(
      { error: 'Failed to update mappings' },
      { status: 500 }
    );
  }
}
