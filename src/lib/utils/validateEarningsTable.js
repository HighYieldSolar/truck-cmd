// src/lib/utils/validateEarningsTable.js
import { supabase } from "../supabaseClient";

/**
 * Validates and potentially fixes issues with the earnings table
 * This utility helps identify and fix common issues with the earnings table
 * Run this from the browser console or add it to an admin page
 * @returns {Promise<Object>} Validation result with issues and fix commands
 */
export async function validateEarningsTable() {
  const result = {
    tableExists: false,
    hasPermissions: false,
    issueSummary: [],
    fixCommands: []
  };
  
  try {
    // Check if table exists
    const { data, error } = await supabase
      .from('earnings')
      .select('count(*)')
      .limit(1);
    
    if (error) {
      result.tableExists = false;
      result.issueSummary.push(`Table check failed: ${error.message}`);
      
      // If the error suggests the table doesn't exist
      if (error.message.includes("does not exist")) {
        result.fixCommands.push(`
-- Run this in your Supabase SQL editor to create the earnings table
CREATE TABLE public.earnings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  load_id UUID REFERENCES public.loads(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL,
  date DATE NOT NULL,
  source TEXT NOT NULL,
  description TEXT,
  factoring_company TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
        `);
      }
    } else {
      result.tableExists = true;
    }
    
    // Test permissions by attempting to insert a record
    if (result.tableExists) {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        result.issueSummary.push("Cannot test permissions: No authenticated user");
      } else {
        // Try to insert a test record
        const testRecord = {
          user_id: user.id,
          amount: 0.01,
          date: new Date().toISOString().split('T')[0],
          source: 'Test',
          description: 'Permission test - will be deleted',
          created_at: new Date().toISOString()
        };
        
        const { data: insertData, error: insertError } = await supabase
          .from('earnings')
          .insert([testRecord])
          .select();
        
        if (insertError) {
          result.hasPermissions = false;
          result.issueSummary.push(`Permission check failed: ${insertError.message}`);
          
          // If it's an RLS issue
          if (insertError.message.includes("violates row-level security policy")) {
            result.fixCommands.push(`
-- Run this in your Supabase SQL editor to add RLS policies for the earnings table
ALTER TABLE public.earnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own earnings"
  ON public.earnings FOR SELECT
  USING (auth.uid() = user_id);
  
CREATE POLICY "Users can insert their own earnings"
  ON public.earnings FOR INSERT
  WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY "Users can update their own earnings"
  ON public.earnings FOR UPDATE
  USING (auth.uid() = user_id);
  
CREATE POLICY "Users can delete their own earnings"
  ON public.earnings FOR DELETE
  USING (auth.uid() = user_id);`);
          }
        } else {
          result.hasPermissions = true;

          // Clean up the test record
          if (insertData && insertData.length > 0) {
            await supabase
              .from('earnings')
              .delete()
              .eq('id', insertData[0].id);
          }
        }
      }
    }
    
    return result;
  } catch (error) {
    result.issueSummary.push(`Validation error: ${error.message}`);
    return result;
  }
}