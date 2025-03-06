import { supabase } from "@/lib/supabaseClient";

/**
 * Supabase Authentication Utility
 * 
 * This module provides a comprehensive set of functions for handling authentication
 * and user management with Supabase.
 */

/**
 * Register a new user with email and password
 * @param {string} email - User's email address
 * @param {string} password - User's password
 * @param {object} metadata - Additional user metadata
 * @returns {Promise<{user: object, error: object}>} - Result of the registration attempt
 */
export async function registerUser(email, password, metadata = {}) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Log in user with email and password
 * @param {string} email - User's email address
 * @param {string} password - User's password
 * @returns {Promise<{session: object, user: object, error: object}>} - Result of the login attempt
 */
export async function loginUser(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Log out the current user
 * @returns {Promise<{error: object}>} - Result of the logout attempt
 */
export async function logoutUser() {
  try {
    const { error } = await supabase.auth.signOut();
    return { error };
  } catch (error) {
    return { error };
  }
}

/**
 * Send password reset email
 * @param {string} email - User's email address
 * @param {string} redirectTo - URL to redirect to after password reset
 * @returns {Promise<{data: object, error: object}>} - Result of the password reset request
 */
export async function resetPassword(email, redirectTo = null) {
  try {
    const options = {};
    if (redirectTo) {
      options.redirectTo = redirectTo;
    }

    const { data, error } = await supabase.auth.resetPasswordForEmail(email, options);
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Update user's password (when they have a recovery token)
 * @param {string} newPassword - New password to set
 * @returns {Promise<{data: object, error: object}>} - Result of the password update
 */
export async function updatePassword(newPassword) {
  try {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Get the current authenticated user
 * @returns {Promise<{user: object, error: object}>} - Current user if authenticated
 */
export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  } catch (error) {
    return { user: null, error };
  }
}

/**
 * Get the current session
 * @returns {Promise<{session: object, error: object}>} - Current session if exists
 */
export async function getCurrentSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    return { session, error };
  } catch (error) {
    return { session: null, error };
  }
}

/**
 * Set up auth state change listener
 * @param {function} callback - Function to call when auth state changes
 * @returns {function} - Unsubscribe function
 */
export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange(callback);
}

/**
 * Update user profile data
 * @param {object} data - User profile data to update
 * @returns {Promise<{data: object, error: object}>} - Result of the update
 */
export async function updateUserProfile(data) {
  try {
    const { data: userData, error } = await supabase.auth.updateUser({
      data,
    });

    return { data: userData, error };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Update user email
 * @param {string} newEmail - New email address
 * @returns {Promise<{data: object, error: object}>} - Result of the email update
 */
export async function updateUserEmail(newEmail) {
  try {
    const { data, error } = await supabase.auth.updateUser({
      email: newEmail,
    });

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Sign in with a third-party provider
 * @param {string} provider - The provider to use ('google', 'facebook', 'twitter', etc.)
 * @param {object} options - Additional options for the provider
 * @returns {Promise<{data: object, error: object}>} - Result of the sign-in
 */
export async function signInWithProvider(provider, options = {}) {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options,
    });

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Verify the current session is valid
 * @returns {Promise<boolean>} - Whether the session is valid
 */
export async function isAuthenticated() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  } catch (error) {
    return false;
  }
}

/**
 * Refresh the current session
 * @returns {Promise<{data: object, error: object}>} - Result of the refresh
 */
export async function refreshSession() {
  try {
    const { data, error } = await supabase.auth.refreshSession();
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Upload a user avatar to Supabase Storage
 * @param {string} userId - User ID
 * @param {File} file - File to upload
 * @returns {Promise<{data: object, error: object}>} - Result of the upload
 */
export async function uploadAvatar(userId, file) {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { data, error } = await supabase.storage
      .from('profiles')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Example of using a Supabase table operation
 * Save user profile data to a 'profiles' table
 * @param {string} userId - User ID
 * @param {object} profileData - Profile data to save
 * @returns {Promise<{data: object, error: object}>} - Result of the operation
 */
export async function saveUserProfile(userId, profileData) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .upsert(
        { 
          id: userId, 
          ...profileData,
          updated_at: new Date() 
        },
        { onConflict: 'id' }
      );

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Example of fetching user profile data from a 'profiles' table
 * @param {string} userId - User ID
 * @returns {Promise<{data: object, error: object}>} - Result of the fetch
 */
export async function getUserProfile(userId) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}