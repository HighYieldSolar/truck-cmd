// src/lib/supabaseAdmin.js
// Server-side Supabase client with service role key (bypasses RLS)
// ONLY use this in server-side code (API routes, webhooks, etc.)

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable");
}

// Service role key is required for admin operations
// If missing, operations will fail with RLS errors

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey || '', {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
