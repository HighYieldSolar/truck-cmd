// src/utils/databaseCheck.js
import { supabase } from "@/lib/supabaseClient";

/**
 * Utility to check if required database tables exist
 * This helps diagnose issues with missing tables
 */

/**
 * Check if essential IFTA-related tables exist in the database
 * @param {boolean} verbose - Whether to log detailed information
 * @returns {Promise<{success: boolean, missingTables: string[], error: any}>}
 */
export async function checkIFTATables(verbose = false) {
  const requiredTables = [
    'fuel_entries',
    'ifta_trip_records',
    'ifta_reports',
    'ifta_tax_rates'
  ];
  
  const results = {
    success: true,
    missingTables: [],
    error: null
  };
  
  try {
    if (verbose) console.log('Checking IFTA-related database tables...');
    
    // Use a simple query to fetch just one row from each table
    // If the table doesn't exist, it will return a specific error
    for (const table of requiredTables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('id')
          .limit(1);
        
        if (error) {
          if (error.code === '42P01') { // PostgreSQL code for "relation does not exist"
            if (verbose) console.error(`Table '${table}' doesn't exist`);
            results.missingTables.push(table);
            results.success = false;
          } else {
            if (verbose) console.warn(`Other error accessing table '${table}':`, error);
          }
        } else {
          if (verbose) console.log(`Table '${table}' exists`);
        }
      } catch (err) {
        if (verbose) console.error(`Error checking table '${table}':`, err);
        results.missingTables.push(table);
        results.success = false;
      }
    }
    
    if (!results.success) {
      results.error = `Missing tables: ${results.missingTables.join(', ')}`;
    }
    
    return results;
  } catch (error) {
    console.error('Error checking database tables:', error);
    return {
      success: false,
      missingTables: [],
      error: error.message || "Unknown error checking database tables"
    };
  }
}

/**
 * Verify if Supabase connection is working properly
 * @returns {Promise<{success: boolean, error: any}>}
 */
export async function checkSupabaseConnection() {
  try {
    // Simple test query to check connection
    const { data, error } = await supabase.from('fuel_entries').select('count').limit(1);
    
    if (error) {
      console.error('Supabase connection check failed:', error);
      return { 
        success: false, 
        error: error.message || "Unknown error checking Supabase connection" 
      };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error connecting to Supabase:', error);
    return { 
      success: false, 
      error: error.message || "Unknown error checking Supabase connection" 
    };
  }
}

/**
 * Run diagnostics on the database setup
 * @returns {Promise<{success: boolean, issues: string[]}>}
 */
export async function runDatabaseDiagnostics() {
  const issues = [];
  
  // Check Supabase connection
  const connectionCheck = await checkSupabaseConnection();
  if (!connectionCheck.success) {
    issues.push(`Supabase connection problem: ${connectionCheck.error}`);
  }
  
  // Check IFTA tables
  const tablesCheck = await checkIFTATables(true);
  if (!tablesCheck.success) {
    issues.push(`IFTA tables problem: ${tablesCheck.error}`);
  }
  
  return {
    success: issues.length === 0,
    issues
  };
}