// src/lib/supabaseClient.js
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables. Check your .env.local file.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

/**
 * Test the Supabase connection
 * @returns {Promise<{success: boolean, error?: any}>}
 */
export async function testConnection() {
  try {
    // Use a simple query to test the connection
    const { data, error } = await supabase.from('ifta_tax_rates').select('count').limit(1).single();

    if (error) {
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
}

/**
 * Utility function to handle Supabase errors consistently
 * @param {Object} error - The error object from Supabase
 * @param {string} fallbackMessage - Fallback message to display
 * @returns {string} - Formatted error message
 */
export function formatError(error, fallbackMessage = "An unexpected error occurred") {
  if (!error) return fallbackMessage;
  
  // Handle specific Supabase error codes
  if (error.code) {
    switch (error.code) {
      case "PGRST116":
        return "No data found.";
      case "22P02":
        return "Invalid input format.";
      case "23505":
        return "This record already exists.";
      case "42501":
        return "You don't have permission to access this data.";
      case "23503":
        return "This record references data that doesn't exist.";
      default:
        // If we have a message but don't recognize the code, use the message
        return error.message || fallbackMessage;
    }
  }
  
  // If we have a message but no code
  return error.message || fallbackMessage;
}