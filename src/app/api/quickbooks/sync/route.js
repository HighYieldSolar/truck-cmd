/**
 * QuickBooks Sync Route
 *
 * Trigger sync operations between Truck Command and QuickBooks.
 * Expense-only sync (invoice sync was removed).
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getConnection } from '@/lib/services/quickbooks/quickbooksConnectionService';
import {
  syncExpense,
  bulkSyncExpenses,
  retryFailedSyncs,
  getSyncHistory,
} from '@/lib/services/quickbooks/quickbooksSyncService';
import { hasFeature } from '@/config/tierConfig';
import { enforceQbRateLimit } from '@/lib/services/quickbooks/quickbooksRateLimit';

const DEBUG = process.env.NODE_ENV === 'development';
const log = (...args) => DEBUG && console.log('[quickbooks/sync]', ...args);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

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
          Authorization: `Bearer ${token}`,
        },
      },
    }
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    return null;
  }

  return user;
}

async function checkQuickBooksAccess(userId) {
  const { data: subscription } = await supabaseAdmin
    .from('subscriptions')
    .select('plan, status')
    .eq('user_id', userId)
    .single();

  const userPlan = subscription?.plan || 'basic';
  return hasFeature(userPlan, 'quickbooksIntegration');
}

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
      return NextResponse.json({ error: 'QuickBooks not connected' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const historyResult = await getSyncHistory(connectionResult.data.id, limit);

    return NextResponse.json({
      history: historyResult.data || [],
    });
  } catch (error) {
    log('Error getting sync history:', error);
    return NextResponse.json({ error: 'Failed to get sync history' }, { status: 500 });
  }
}

/**
 * POST /api/quickbooks/sync
 *
 * Trigger sync operation.
 * Body:
 *   - action: 'single-expense' | 'bulk-expenses' | 'retry-failed'
 *   - expenseId: For single expense sync
 *   - expenseIds: For bulk expense sync (optional)
 *   - dateFrom / dateTo: Bulk sync date filters
 *   - category: Filter expenses by category for bulk sync
 */
export async function POST(request) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limit: prevent sync spam per user
    const rateLimitResult = enforceQbRateLimit(user.id, 'sync');
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded. Please slow down.',
          retryAfterSeconds: rateLimitResult.retryAfterSeconds,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimitResult.retryAfterSeconds),
          },
        }
      );
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
      return NextResponse.json({ error: 'QuickBooks not connected' }, { status: 400 });
    }

    const connection = connectionResult.data;

    if (connection.status !== 'active') {
      return NextResponse.json(
        { error: `QuickBooks connection is ${connection.status}. Please reconnect.` },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { action, expenseId, expenseIds, dateFrom, dateTo, category } = body;

    switch (action) {
      case 'single-expense': {
        if (!expenseId) {
          return NextResponse.json({ error: 'expenseId required' }, { status: 400 });
        }

        const { data: expense, error: expError } = await supabaseAdmin
          .from('expenses')
          .select('*')
          .eq('id', expenseId)
          .eq('user_id', user.id)
          .single();

        if (expError || !expense) {
          return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
        }

        log(`Syncing single expense: ${expenseId}`);
        const result = await syncExpense(connection.id, expense);

        if (result.error) {
          const status = result.concurrent ? 409 : 400;
          return NextResponse.json(
            {
              error: result.errorMessage,
              missingMapping: result.missingMapping,
              category: result.category,
            },
            { status }
          );
        }

        return NextResponse.json({
          success: true,
          message: result.alreadySynced ? 'Expense already synced' : 'Expense synced to QuickBooks',
          qbEntityId: result.qbEntityId,
          alreadySynced: result.alreadySynced,
        });
      }

      case 'bulk-expenses': {
        log('Bulk syncing expenses');
        const result = await bulkSyncExpenses(connection.id, user.id, {
          expenseIds,
          startDate: dateFrom,
          endDate: dateTo,
          categories: category ? [category] : undefined,
        });

        if (result.error) {
          return NextResponse.json({ error: result.errorMessage }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          message: `Synced ${result.synced} expenses to QuickBooks`,
          synced: result.synced,
          failed: result.failed,
          total: result.total,
          reachedCap: result.reachedCap,
          errors: result.errors,
        });
      }

      case 'retry-failed': {
        log('Retrying failed syncs');
        const result = await retryFailedSyncs(connection.id);

        return NextResponse.json({
          success: true,
          message: `Retried ${result.retried} failed syncs`,
          retried: result.retried,
          succeeded: result.succeeded,
          stillFailed: result.stillFailed,
        });
      }

      default:
        return NextResponse.json(
          {
            error: 'Invalid action. Valid actions: single-expense, bulk-expenses, retry-failed',
          },
          { status: 400 }
        );
    }
  } catch (error) {
    log('Error in sync:', error);
    return NextResponse.json({ error: 'Sync operation failed' }, { status: 500 });
  }
}
