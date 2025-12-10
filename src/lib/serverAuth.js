// src/lib/serverAuth.js
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Create a Supabase client with service role for server-side operations
 */
function getServiceClient() {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("Missing Supabase server environment variables");
  }
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

/**
 * Verify the authenticated user from request headers
 * This function verifies the JWT token from the Authorization header
 * and returns the authenticated user ID
 *
 * @param {Request} request - The incoming request
 * @returns {Promise<{userId: string|null, error: string|null}>}
 */
export async function verifyAuth(request) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return { userId: null, error: "Missing or invalid authorization header" };
    }

    const token = authHeader.replace("Bearer ", "");

    if (!token) {
      return { userId: null, error: "No token provided" };
    }

    const supabase = getServiceClient();

    // Verify the JWT and get the user
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return { userId: null, error: error?.message || "Invalid token" };
    }

    return { userId: user.id, error: null };
  } catch (err) {
    return { userId: null, error: err.message || "Authentication failed" };
  }
}

/**
 * Verify that the request user matches the provided userId
 * This is the primary function to use in API routes to prevent
 * users from accessing/modifying other users' data
 *
 * @param {Request} request - The incoming request
 * @param {string} requestedUserId - The userId from the request body
 * @returns {Promise<{authorized: boolean, authenticatedUserId: string|null, error: string|null}>}
 */
export async function verifyUserAccess(request, requestedUserId) {
  const { userId: authenticatedUserId, error } = await verifyAuth(request);

  if (error || !authenticatedUserId) {
    return {
      authorized: false,
      authenticatedUserId: null,
      error: error || "Not authenticated"
    };
  }

  // Verify the authenticated user matches the requested userId
  if (authenticatedUserId !== requestedUserId) {
    return {
      authorized: false,
      authenticatedUserId,
      error: "Access denied: userId mismatch"
    };
  }

  return {
    authorized: true,
    authenticatedUserId,
    error: null
  };
}
