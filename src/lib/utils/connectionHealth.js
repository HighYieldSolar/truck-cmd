// src/lib/utils/connectionHealth.js
import { supabase } from '../supabaseClient';

/**
 * A utility for monitoring and managing database connection health
 * This helps detect and resolve database sync issues for the dashboard and other pages
 */

// Track connection status
let connectionStatus = {
  lastChecked: null,
  isConnected: false,
  lastError: null,
  reconnectAttempts: 0,
  pendingOperations: 0,
  lastSuccessfulSync: null,
  tabVisibilityChanges: 0
};

/**
 * Check if the Supabase connection is healthy by performing a simple query
 * @returns {Promise<boolean>} Is the connection healthy
 */
export async function checkConnection() {
  try {
    connectionStatus.lastChecked = new Date();
    connectionStatus.pendingOperations++;
    
    // Simple query to test connection
    const { data, error } = await supabase
      .from('expenses')
      .select('count', { count: 'exact', head: true })
      .limit(1);
    
    connectionStatus.pendingOperations--;
    
    if (error) {
      connectionStatus.isConnected = false;
      connectionStatus.lastError = error;
      return false;
    }

    // Connection is healthy
    connectionStatus.isConnected = true;
    connectionStatus.lastError = null;
    return true;
  } catch (err) {
    connectionStatus.pendingOperations--;
    connectionStatus.isConnected = false;
    connectionStatus.lastError = err;
    return false;
  }
}

/**
 * Attempt to reconnect to the Supabase database
 * @returns {Promise<boolean>} Whether reconnection was successful
 */
export async function reconnect() {
  try {
    connectionStatus.reconnectAttempts++;

    // Refresh the session token
    const { error: refreshError } = await supabase.auth.refreshSession();

    if (refreshError) {
      // Try another approach - get the current session
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        return false;
      }
    }

    // Test the connection after refreshing
    const isConnected = await checkConnection();

    if (isConnected) {
      connectionStatus.lastSuccessfulSync = new Date();
      return true;
    }

    return false;
  } catch (err) {
    return false;
  }
}

/**
 * Register tab visibility change listener
 * Helps detect when app returns to foreground and may need a reconnection
 */
export function setupVisibilityChangeListener() {
  if (typeof document === 'undefined') return; // Skip during SSR
  
  const handleVisibilityChange = () => {
    const isVisible = document.visibilityState === 'visible';
    const wasHidden = document.visibilityState === 'hidden';
    
    connectionStatus.tabVisibilityChanges++;
    
    if (isVisible && wasHidden) {
      // Check if it's been more than 5 minutes since the last successful check
      const now = new Date();
      const lastChecked = connectionStatus.lastSuccessfulSync || new Date(0);
      const timeSinceLastCheck = now - lastChecked;

      if (timeSinceLastCheck > 5 * 60 * 1000) { // 5 minutes
        checkConnection().then(isConnected => {
          if (!isConnected) {
            reconnect();
          }
        });
      }
    }
  };
  
  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  // Return a cleanup function
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}

/**
 * Get current connection status
 * @returns {Object} Current connection status object
 */
export function getConnectionStatus() {
  return { ...connectionStatus };
}

/**
 * Reset connection statistics
 */
export function resetConnectionStats() {
  connectionStatus.reconnectAttempts = 0;
  connectionStatus.tabVisibilityChanges = 0;
}