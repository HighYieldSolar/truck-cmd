'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';

/**
 * Hook to manage QuickBooks sync status for expense/invoice lists
 *
 * Fetches sync records for a list of entities and provides
 * sync status lookup and sync trigger functionality.
 *
 * @param {string} entityType - 'expense' or 'invoice'
 * @param {string[]} entityIds - Array of entity IDs to check
 * @returns {Object} Sync status management object
 */
export function useQuickBooksSyncStatus(entityType, entityIds = []) {
  const [syncRecords, setSyncRecords] = useState({});
  const [isConnected, setIsConnected] = useState(false);
  const [connectionId, setConnectionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [syncingIds, setSyncingIds] = useState(new Set());

  // Track last fetched IDs to avoid unnecessary refetches
  const lastFetchedRef = useRef(null);

  /**
   * Get auth token
   */
  const getAuthToken = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  }, []);

  /**
   * Fetch sync records for the given entity IDs
   */
  const fetchSyncRecords = useCallback(async (ids) => {
    if (!ids || ids.length === 0) {
      return;
    }

    // Check if we already fetched these IDs
    const idsKey = ids.sort().join(',');
    if (lastFetchedRef.current === idsKey) {
      return;
    }

    try {
      setLoading(true);

      const token = await getAuthToken();
      if (!token) {
        return;
      }

      const response = await fetch('/api/quickbooks/sync-records', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          entityType,
          entityIds: ids
        })
      });

      const data = await response.json();

      if (response.ok) {
        setIsConnected(data.connected);
        setConnectionId(data.connectionId);
        setSyncRecords(prev => ({
          ...prev,
          ...data.records
        }));
        lastFetchedRef.current = idsKey;
      }
    } catch (error) {
      console.error('Error fetching sync records:', error);
    } finally {
      setLoading(false);
    }
  }, [entityType, getAuthToken]);

  /**
   * Sync a single entity to QuickBooks
   */
  const syncEntity = useCallback(async (entityId) => {
    if (!isConnected || syncingIds.has(entityId)) {
      return { success: false, error: 'Not connected or already syncing' };
    }

    try {
      setSyncingIds(prev => new Set([...prev, entityId]));

      const token = await getAuthToken();
      if (!token) {
        return { success: false, error: 'Authentication required' };
      }

      const action = entityType === 'expense' ? 'single-expense' : 'single-invoice';
      const idField = entityType === 'expense' ? 'expenseId' : 'invoiceId';

      const response = await fetch('/api/quickbooks/sync', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action,
          [idField]: entityId
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Update local state with synced status
        setSyncRecords(prev => ({
          ...prev,
          [entityId]: {
            ...prev[entityId],
            sync_status: 'synced',
            qb_entity_id: data.qbEntityId,
            last_synced_at: new Date().toISOString(),
            error_message: null
          }
        }));
        return { success: true, qbEntityId: data.qbEntityId };
      } else {
        // Update local state with failed status
        setSyncRecords(prev => ({
          ...prev,
          [entityId]: {
            ...prev[entityId],
            sync_status: 'failed',
            error_message: data.error || 'Sync failed',
            last_synced_at: new Date().toISOString()
          }
        }));
        return { success: false, error: data.error || 'Sync failed' };
      }
    } catch (error) {
      console.error('Error syncing entity:', error);
      return { success: false, error: error.message };
    } finally {
      setSyncingIds(prev => {
        const next = new Set(prev);
        next.delete(entityId);
        return next;
      });
    }
  }, [isConnected, syncingIds, entityType, getAuthToken]);

  /**
   * Get sync record for a specific entity
   */
  const getSyncRecord = useCallback((entityId) => {
    return syncRecords[entityId] || null;
  }, [syncRecords]);

  /**
   * Check if an entity is currently syncing
   */
  const isSyncing = useCallback((entityId) => {
    return syncingIds.has(entityId);
  }, [syncingIds]);

  // Fetch records when entity IDs change
  useEffect(() => {
    if (entityIds.length > 0) {
      fetchSyncRecords(entityIds);
    }
  }, [entityIds, fetchSyncRecords]);

  return {
    syncRecords,
    isConnected,
    connectionId,
    loading,
    getSyncRecord,
    syncEntity,
    isSyncing,
    refetch: () => {
      lastFetchedRef.current = null;
      fetchSyncRecords(entityIds);
    }
  };
}
