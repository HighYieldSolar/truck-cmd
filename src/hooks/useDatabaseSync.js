// src/hooks/useDatabaseSync.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';

/**
 * Custom hook to manage database synchronization and health
 * Handles automatic reconnection, visibility changes, and data refreshing
 * 
 * @param {Object} options Configuration options
 * @param {boolean} options.autoRefresh Whether to automatically refresh data
 * @param {number} options.refreshInterval Interval between automatic refreshes in ms
 * @param {Function} options.onRefresh Callback function to run on refresh
 * @param {Function} options.onConnectionChange Callback when connection status changes
 * @returns {Object} Database sync state and control functions
 */
export default function useDatabaseSync({
  autoRefresh = true,
  refreshInterval = 5 * 60 * 1000, // 5 minutes default
  onRefresh = null,
  onConnectionChange = null
} = {}) {
  // State to track sync status
  const [lastRefresh, setLastRefresh] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [error, setError] = useState(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(autoRefresh);
  const [connectionStats, setConnectionStats] = useState({
    lastChecked: null,
    reconnectAttempts: 0,
    tabVisibilityChanges: 0
  });
  
  // Keep refs to current callback functions
  const onRefreshRef = useRef(onRefresh);
  const onConnectionChangeRef = useRef(onConnectionChange);
  const refreshIntervalRef = useRef(null);
  const visibilityStateRef = useRef(typeof document !== 'undefined' ? document.visibilityState : 'hidden');
  const refreshingRef = useRef(false); // Track refreshing state in a ref to prevent race conditions
  const lastRefreshTimeRef = useRef(null); // Track last refresh time in a ref
  
  // Update callback refs when they change
  useEffect(() => {
    onRefreshRef.current = onRefresh;
    onConnectionChangeRef.current = onConnectionChange;
  }, [onRefresh, onConnectionChange]);
  
  /**
   * Check if Supabase connection is healthy
   */
  const checkConnection = useCallback(async () => {
    try {
      setConnectionStats(prev => ({
        ...prev,
        lastChecked: new Date()
      }));
      
      // Simple query to test connection
      const { error } = await supabase
        .from('expenses')
        .select('count', { count: 'exact', head: true })
        .limit(1);
      
      const connected = !error;
      
      if (connected !== isConnected) {
        setIsConnected(connected);
        
        if (onConnectionChangeRef.current) {
          onConnectionChangeRef.current(connected);
        }
        
        if (!connected) {
          setError('Database connection lost. Attempting to reconnect...');
        } else {
          setError(null);
        }
      }
      
      return connected;
    } catch (err) {
      setIsConnected(false);
      setError('Database connection error: ' + (err.message || 'Unknown error'));
      return false;
    }
  }, [isConnected]);
  
  /**
   * Attempt to reconnect to Supabase
   */
  const reconnect = useCallback(async () => {
    try {
      setConnectionStats(prev => ({
        ...prev,
        reconnectAttempts: prev.reconnectAttempts + 1
      }));
      
      // Try to refresh the session
      const { error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        // Try to get current session as alternative approach
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          return false;
        }
      }

      // Test the connection after refreshing
      const isConnected = await checkConnection();

      if (isConnected) {
        return true;
      }

      return false;
    } catch (err) {
      return false;
    }
  }, [checkConnection]);
  
  /**
   * Perform a data refresh
   */
  const refreshData = useCallback(async () => {
    // Prevent multiple concurrent refreshes and throttle frequent calls
    if (refreshingRef.current) {
      return false;
    }

    // Throttle refreshes to at most once every 10 seconds
    if (lastRefreshTimeRef.current) {
      const now = new Date();
      const timeSinceLastRefresh = now - lastRefreshTimeRef.current;

      if (timeSinceLastRefresh < 10000) { // 10 seconds
        return false;
      }
    }
    
    try {
      // Update ref immediately to prevent race conditions
      refreshingRef.current = true;
      setIsRefreshing(true);
      
      // First check connection
      const connectionHealthy = await checkConnection();
      
      if (!connectionHealthy) {
        // Try to reconnect
        const reconnected = await reconnect();
        
        if (!reconnected) {
          setError('Unable to connect to database. Please try again later.');
          return false;
        }
      }

      // Connection is healthy, perform refresh callback
      if (onRefreshRef.current) {
        await onRefreshRef.current();
      }

      // Update last refresh time
      const now = new Date();
      lastRefreshTimeRef.current = now;
      setLastRefresh(now);

      return true;
    } catch (err) {
      setError(`Error refreshing data: ${err.message}`);
      return false;
    } finally {
      setIsRefreshing(false);
      // Add a small delay before allowing another refresh
      setTimeout(() => {
        refreshingRef.current = false;
      }, 1000);
    }
  }, [checkConnection, reconnect]);
  
  /**
   * Toggle auto-refresh setting
   */
  const toggleAutoRefresh = useCallback(() => {
    setAutoRefreshEnabled(prev => !prev);
  }, []);
  
  // Set up visibility change listener
  useEffect(() => {
    if (typeof document === 'undefined') return; // Skip during SSR
    
    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === 'visible';
      const wasHidden = visibilityStateRef.current === 'hidden';
      
      visibilityStateRef.current = document.visibilityState;
      
      setConnectionStats(prev => ({
        ...prev,
        tabVisibilityChanges: prev.tabVisibilityChanges + 1
      }));
      
      // If tab was hidden and now became visible, refresh the data
      if (isVisible && wasHidden && autoRefreshEnabled) {
        // Check how long since last refresh
        const now = new Date();
        const lastRefreshTime = lastRefreshTimeRef.current || new Date(0);
        const timeSinceLastRefresh = now - lastRefreshTime;
        
        // If it's been more than 1 minute since last refresh
        if (timeSinceLastRefresh > 60 * 1000) {
          refreshData();
        } else {
          // Otherwise just check connection
          checkConnection();
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [autoRefreshEnabled, refreshData, checkConnection]);
  
  // Set up auto-refresh interval
  useEffect(() => {
    // Clear existing interval
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
    
    // Set up new interval if enabled
    if (autoRefreshEnabled) {
      refreshIntervalRef.current = setInterval(() => {
        // Only refresh if the tab is visible and not already refreshing
        if (typeof document !== 'undefined' && 
            document.visibilityState === 'visible' && 
            !refreshingRef.current) {
          refreshData();
        }
      }, refreshInterval);
    }
    
    // Clean up on unmount or when dependencies change
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [autoRefreshEnabled, refreshInterval, refreshData]);
  
  // Initial connection check
  useEffect(() => {
    // Initial connection check when component mounts
    checkConnection();
    
    // Initial data refresh only once on mount
    const initialRefreshTimeout = setTimeout(() => {
      if (autoRefreshEnabled && !refreshingRef.current) {
        refreshData();
      }
    }, 500); // Small delay to let other effects complete
    
    return () => clearTimeout(initialRefreshTimeout);
  }, []); // Empty dependency array ensures this only runs once on mount
  
  return {
    lastRefresh,
    isRefreshing,
    isConnected,
    error,
    autoRefreshEnabled,
    refreshData,
    toggleAutoRefresh,
    setAutoRefreshEnabled,
    connectionStats
  };
}