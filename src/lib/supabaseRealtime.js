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
 * Subscribe to invoice changes for the current user
 * @param {string} userId - User ID to filter by
 * @param {function} callback - Function to call when invoices change
 * @returns {function} - Unsubscribe function
 */
export function subscribeToInvoices(userId, callback) {
  return subscribeToTable(
    'invoices',
    callback,
    '*',
    { filter: `user_id=eq.${userId}` }
  );
}

/**
 * Subscribe to expense changes for the current user
 * @param {string} userId - User ID to filter by
 * @param {function} callback - Function to call when expenses change
 * @returns {function} - Unsubscribe function
 */
export function subscribeToExpenses(userId, callback) {
  return subscribeToTable(
    'expenses',
    callback,
    '*',
    { filter: `user_id=eq.${userId}` }
  );
}

/**
 * Subscribe to payment changes for a specific invoice
 * @param {string} invoiceId - Invoice ID to filter by
 * @param {function} callback - Function to call when payments change
 * @returns {function} - Unsubscribe function
 */
export function subscribeToInvoicePayments(invoiceId, callback) {
  return subscribeToTable(
    'payments',
    callback,
    '*',
    { filter: `invoice_id=eq.${invoiceId}` }
  );
}

/**
 * Subscribe to multiple tables with the same callback
 * @param {Array<Object>} subscriptions - Array of subscription configs
 * @param {function} callback - Function to call when any table changes
 * @returns {function} - Unsubscribe function for all subscriptions
 */
export function subscribeToMultipleTables(subscriptions, callback) {
  const unsubscribeFunctions = subscriptions.map(sub => {
    return subscribeToTable(
      sub.table,
      callback,
      sub.event || '*',
      sub.filter || {}
    );
  });
  
  // Return a function that unsubscribes from all
  return () => {
    unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
  };
}

/**
 * Set up a subscription for a specific record
 * @param {string} table - Table name
 * @param {string} id - Record ID
 * @param {function} callback - Callback function
 * @returns {function} - Unsubscribe function
 */
export function subscribeToRecord(table, id, callback) {
  return subscribeToTable(
    table,
    callback,
    '*',
    { filter: `id=eq.${id}` }
  );
}

/**
 * Create a dashboard subscription bundle (invoices, expenses, customers)
 * @param {string} userId - User ID
 * @param {function} callback - Callback for any changes
 * @returns {function} - Unsubscribe function
 */
export function subscribeToDashboard(userId, callback) {
  return subscribeToMultipleTables([
    { table: 'invoices', filter: { filter: `user_id=eq.${userId}` } },
    { table: 'expenses', filter: { filter: `user_id=eq.${userId}` } },
    { table: 'customers', filter: { filter: `user_id=eq.${userId}` } },
  ], callback);
}