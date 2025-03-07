// src/lib/supabaseRealtime.js
import { supabase } from "./supabaseClient";

/**
 * Subscribe to realtime changes for a specific table
 * @param {string} table - Table name to subscribe to
 * @param {function} callback - Function to call when data changes
 * @param {string} event - Event type to subscribe to (INSERT, UPDATE, DELETE, *) 
 * @param {Object} filter - Optional filter object
 * @returns {function} - Unsubscribe function
 */
export function subscribeToTable(table, callback, event = '*', filter = {}) {
  // Create the channel
  const channel = supabase
    .channel(`changes-to-${table}`)
    .on(
      'postgres_changes',
      {
        event,
        schema: 'public',
        table,
        ...filter
      },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();
  
  // Return a function to unsubscribe
  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribe to expense changes for the current user
 * @param {string} userId - User ID to filter by
 * @param {function} callback - Function to call when expenses change
 * @returns {function} - Unsubscribe function
 */
export function subscribeToUserExpenses(userId, callback) {
  return subscribeToTable(
    'expenses',
    callback,
    '*',
    { filter: `user_id=eq.${userId}` }
  );
}

/**
 * Listen for expense INSERTS
 * @param {string} userId - User ID to filter by
 * @param {function} callback - Function to call when a new expense is added
 * @returns {function} - Unsubscribe function
 */
export function listenForNewExpenses(userId, callback) {
  return subscribeToTable(
    'expenses',
    callback,
    'INSERT',
    { filter: `user_id=eq.${userId}` }
  );
}

/**
 * Listen for expense UPDATES
 * @param {string} userId - User ID to filter by
 * @param {function} callback - Function to call when an expense is updated
 * @returns {function} - Unsubscribe function
 */
export function listenForExpenseUpdates(userId, callback) {
  return subscribeToTable(
    'expenses',
    callback,
    'UPDATE',
    { filter: `user_id=eq.${userId}` }
  );
}

/**
 * Listen for expense DELETES
 * @param {string} userId - User ID to filter by
 * @param {function} callback - Function to call when an expense is deleted
 * @returns {function} - Unsubscribe function
 */
export function listenForExpenseDeletes(userId, callback) {
  return subscribeToTable(
    'expenses',
    callback,
    'DELETE',
    { filter: `user_id=eq.${userId}` }
  );
}