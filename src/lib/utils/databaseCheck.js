// src/lib/utils/databaseCheck.js
import { supabase } from "../supabaseClient";

/**
 * Utility to check if the required database tables exist
 * This helps troubleshoot issues with missing tables
 * @returns {Promise<Object>} - Results of database checks
 */
export async function runDatabaseDiagnostics() {
  try {
    console.log("Running database diagnostics...");
    const issues = [];
    const tables = [
      'ifta_trip_records',
      'loads',
      'fuel_entries'
    ];
    
    // Check for each required table
    const tableChecks = await Promise.all(
      tables.map(async (tableName) => {
        try {
          const { count, error } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true });
            
          if (error) {
            if (error.code === '42P01') { // PostgreSQL code for relation does not exist
              issues.push(`Table "${tableName}" does not exist in the database.`);
              return { table: tableName, exists: false, error: error.message };
            } else {
              issues.push(`Error checking table "${tableName}": ${error.message}`);
              return { table: tableName, exists: false, error: error.message };
            }
          }
          
          return { table: tableName, exists: true, count };
        } catch (err) {
          issues.push(`Error checking table "${tableName}": ${err.message}`);
          return { table: tableName, exists: false, error: err.message };
        }
      })
    );
    
    // Check schema for IFTA trip records
    let iftaSchemaValid = false;
    if (tableChecks.find(t => t.table === 'ifta_trip_records' && t.exists)) {
      try {
        // Try a more detailed query to check if the schema supports load_id
        const { data, error } = await supabase
          .from('ifta_trip_records')
          .select('load_id')
          .limit(1);
          
        iftaSchemaValid = !error;
        
        if (error) {
          issues.push(`The ifta_trip_records table exists but is missing the load_id column needed for integration.`);
        }
      } catch (err) {
        issues.push(`Error checking ifta_trip_records schema: ${err.message}`);
      }
    }
    
    // Create a detailed diagnostic result
    const result = {
      success: issues.length === 0,
      issues,
      tables: tableChecks,
      iftaSchemaValid
    };
    
    console.log("Database diagnostic results:", result);
    return result;
  } catch (error) {
    console.error("Error running database diagnostics:", error);
    return {
      success: false,
      issues: [error.message || "Unknown error during database diagnostics"],
      tables: [],
      iftaSchemaValid: false
    };
  }
}

/**
 * Create necessary database tables if they don't exist
 * This is useful for fresh installations
 * @returns {Promise<Object>} - Results of table creation
 */
export async function setupRequiredTables() {
  try {
    const results = {
      success: true,
      created: [],
      errors: []
    };
    
    // Check if ifta_trip_records table exists
    const { count: iftaCount, error: iftaError } = await supabase
      .from('ifta_trip_records')
      .select('*', { count: 'exact', head: true });
      
    if (iftaError && iftaError.code === '42P01') {
      // Create the ifta_trip_records table
      const { error: createError } = await supabase.rpc('create_ifta_trip_records_table');
      
      if (createError) {
        results.success = false;
        results.errors.push({
          table: 'ifta_trip_records',
          error: createError.message
        });
      } else {
        results.created.push('ifta_trip_records');
      }
    }
    
    // Add similar checks for other required tables
    
    return results;
  } catch (error) {
    console.error("Error setting up required tables:", error);
    return {
      success: false,
      created: [],
      errors: [{ general: error.message || "Unknown error during table setup" }]
    };
  }
}