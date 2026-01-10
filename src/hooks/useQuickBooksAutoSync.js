'use client';

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

/**
 * Hook for QuickBooks auto-sync functionality.
 * Checks connection status and triggers sync for individual items.
 *
 * Usage:
 * const { autoSyncExpense, autoSyncInvoice, isAutoSyncEnabled } = useQuickBooksAutoSync();
 *
 * // After creating an expense:
 * const result = await autoSyncExpense(expenseId);
 * if (result.synced) {
 *   toast.success('Expense synced to QuickBooks');
 * }
 */
export function useQuickBooksAutoSync() {
  const [syncing, setSyncing] = useState(false);

  /**
   * Get the auth token for API calls
   */
  const getAuthToken = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  }, []);

  /**
   * Check if auto-sync is enabled for the given type
   * @param {'expenses' | 'invoices'} type - The sync type to check
   * @returns {Promise<{enabled: boolean, connectionId?: string}>}
   */
  const checkAutoSyncEnabled = useCallback(async (type) => {
    try {
      const token = await getAuthToken();
      if (!token) {
        return { enabled: false };
      }

      const response = await fetch('/api/quickbooks/status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        return { enabled: false };
      }

      const data = await response.json();

      if (!data.connected || data.connection?.status !== 'active') {
        return { enabled: false };
      }

      const enabled = type === 'expenses'
        ? data.connection?.autoSyncExpenses
        : data.connection?.autoSyncInvoices;

      return {
        enabled: Boolean(enabled),
        connectionId: data.connection?.id
      };
    } catch (error) {
      console.error('Error checking auto-sync status:', error);
      return { enabled: false };
    }
  }, [getAuthToken]);

  /**
   * Auto-sync a single expense to QuickBooks
   * @param {string} expenseId - The expense ID to sync
   * @returns {Promise<{synced: boolean, error?: string, qbEntityId?: string}>}
   */
  const autoSyncExpense = useCallback(async (expenseId) => {
    try {
      // Check if auto-sync is enabled
      const { enabled } = await checkAutoSyncEnabled('expenses');

      if (!enabled) {
        return { synced: false, skipped: true };
      }

      setSyncing(true);

      const token = await getAuthToken();
      if (!token) {
        return { synced: false, error: 'Authentication required' };
      }

      const response = await fetch('/api/quickbooks/sync', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'single-expense',
          expenseId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          synced: false,
          error: data.error || 'Failed to sync expense'
        };
      }

      return {
        synced: true,
        qbEntityId: data.qbEntityId
      };
    } catch (error) {
      console.error('Auto-sync expense error:', error);
      return {
        synced: false,
        error: error.message || 'Sync failed'
      };
    } finally {
      setSyncing(false);
    }
  }, [getAuthToken, checkAutoSyncEnabled]);

  /**
   * Auto-sync a single invoice to QuickBooks
   * @param {string} invoiceId - The invoice ID to sync
   * @returns {Promise<{synced: boolean, error?: string, qbEntityId?: string}>}
   */
  const autoSyncInvoice = useCallback(async (invoiceId) => {
    try {
      // Check if auto-sync is enabled
      const { enabled } = await checkAutoSyncEnabled('invoices');

      if (!enabled) {
        return { synced: false, skipped: true };
      }

      setSyncing(true);

      const token = await getAuthToken();
      if (!token) {
        return { synced: false, error: 'Authentication required' };
      }

      const response = await fetch('/api/quickbooks/sync', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'single-invoice',
          invoiceId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          synced: false,
          error: data.error || 'Failed to sync invoice'
        };
      }

      return {
        synced: true,
        qbEntityId: data.qbEntityId
      };
    } catch (error) {
      console.error('Auto-sync invoice error:', error);
      return {
        synced: false,
        error: error.message || 'Sync failed'
      };
    } finally {
      setSyncing(false);
    }
  }, [getAuthToken, checkAutoSyncEnabled]);

  /**
   * Check if auto-sync is enabled for expenses
   * @returns {Promise<boolean>}
   */
  const isExpenseAutoSyncEnabled = useCallback(async () => {
    const { enabled } = await checkAutoSyncEnabled('expenses');
    return enabled;
  }, [checkAutoSyncEnabled]);

  /**
   * Check if auto-sync is enabled for invoices
   * @returns {Promise<boolean>}
   */
  const isInvoiceAutoSyncEnabled = useCallback(async () => {
    const { enabled } = await checkAutoSyncEnabled('invoices');
    return enabled;
  }, [checkAutoSyncEnabled]);

  return {
    autoSyncExpense,
    autoSyncInvoice,
    isExpenseAutoSyncEnabled,
    isInvoiceAutoSyncEnabled,
    syncing
  };
}

export default useQuickBooksAutoSync;
