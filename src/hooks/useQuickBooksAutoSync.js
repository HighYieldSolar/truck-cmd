'use client';

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

/**
 * Hook for QuickBooks auto-sync functionality.
 * Checks connection status and triggers sync for individual expenses.
 *
 * The return value of autoSyncExpense includes a `notify` helper describing
 * the outcome so callers can surface toasts/notifications appropriately.
 *
 * Usage:
 *   const { autoSyncExpense } = useQuickBooksAutoSync();
 *
 *   // After creating an expense:
 *   const result = await autoSyncExpense(expenseId);
 *   if (result.notify) {
 *     toast[result.notify.level](result.notify.message);
 *   }
 */
export function useQuickBooksAutoSync() {
  const [syncing, setSyncing] = useState(false);

  const getAuthToken = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token;
  }, []);

  /**
   * Check if auto-sync is enabled for expenses
   * @returns {Promise<{enabled: boolean, connectionId?: string, status?: string}>}
   */
  const checkAutoSyncEnabled = useCallback(async () => {
    try {
      const token = await getAuthToken();
      if (!token) {
        return { enabled: false };
      }

      const response = await fetch('/api/quickbooks/status', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        return { enabled: false };
      }

      const data = await response.json();

      if (!data.connected || data.connection?.status !== 'active') {
        return { enabled: false, status: data.connection?.status };
      }

      return {
        enabled: Boolean(data.connection?.autoSyncExpenses),
        connectionId: data.connection?.id,
        status: data.connection?.status,
      };
    } catch (error) {
      console.error('Error checking auto-sync status:', error);
      return { enabled: false };
    }
  }, [getAuthToken]);

  /**
   * Auto-sync a single expense to QuickBooks.
   *
   * Returns an object with sync status AND a `notify` object describing what
   * the UI should surface to the user. This prevents silent failures.
   */
  const autoSyncExpense = useCallback(
    async (expenseId) => {
      try {
        const { enabled, status } = await checkAutoSyncEnabled();

        if (!enabled) {
          // Silent skip is correct here — user explicitly disabled auto-sync
          // or isn't connected. No notification needed.
          return { synced: false, skipped: true };
        }

        setSyncing(true);

        const token = await getAuthToken();
        if (!token) {
          return {
            synced: false,
            error: 'Authentication required',
            notify: { level: 'error', message: 'Please sign in to sync to QuickBooks.' },
          };
        }

        const response = await fetch('/api/quickbooks/sync', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'single-expense',
            expenseId,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          // Rich error handling — tell the user WHY it failed
          if (data.missingMapping) {
            return {
              synced: false,
              missingMapping: true,
              category: data.category,
              error: data.error,
              notify: {
                level: 'warning',
                message: `Auto-sync skipped: "${data.category}" category is not mapped to a QuickBooks account. Open QuickBooks settings to fix.`,
                action: 'mapping',
              },
            };
          }

          if (response.status === 429) {
            return {
              synced: false,
              error: data.error,
              rateLimited: true,
              notify: {
                level: 'warning',
                message: 'Too many sync requests. Please wait a moment.',
              },
            };
          }

          if (response.status === 409) {
            // Concurrent sync — silent skip
            return { synced: false, concurrent: true, skipped: true };
          }

          return {
            synced: false,
            error: data.error || 'Failed to sync expense',
            notify: {
              level: 'error',
              message: data.error || 'Failed to sync expense to QuickBooks.',
            },
          };
        }

        if (data.alreadySynced) {
          return {
            synced: true,
            alreadySynced: true,
            qbEntityId: data.qbEntityId,
          };
        }

        return {
          synced: true,
          qbEntityId: data.qbEntityId,
          notify: {
            level: 'success',
            message: 'Expense synced to QuickBooks',
          },
        };
      } catch (error) {
        console.error('Auto-sync expense error:', error);
        return {
          synced: false,
          error: error.message || 'Sync failed',
          notify: {
            level: 'error',
            message: 'Unable to reach QuickBooks. Please try again.',
          },
        };
      } finally {
        setSyncing(false);
      }
    },
    [getAuthToken, checkAutoSyncEnabled]
  );

  /**
   * Check if auto-sync is enabled for expenses
   * @returns {Promise<boolean>}
   */
  const isExpenseAutoSyncEnabled = useCallback(async () => {
    const { enabled } = await checkAutoSyncEnabled();
    return enabled;
  }, [checkAutoSyncEnabled]);

  return {
    autoSyncExpense,
    isExpenseAutoSyncEnabled,
    syncing,
  };
}

export default useQuickBooksAutoSync;
