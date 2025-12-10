// src/app/api/delete-account/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAuth } from '@/lib/serverAuth';
import Stripe from 'stripe';

const DEBUG = process.env.NODE_ENV === 'development';
const log = (...args) => DEBUG && console.log('[delete-account]', ...args);

/**
 * Delete user account and all associated data
 * This is a destructive operation that cannot be undone
 */
export async function POST(request) {
  try {
    // Verify user is authenticated
    const { userId, error: authError } = await verifyAuth(request);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: authError || 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { confirmation, password } = body;

    // Require confirmation phrase
    if (confirmation !== 'delete my account') {
      return NextResponse.json(
        { success: false, error: "Please type 'delete my account' to confirm" },
        { status: 400 }
      );
    }

    // Create admin client for deletion operations
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get user's subscription to cancel Stripe subscription if active
    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('stripe_customer_id, stripe_subscription_id, status')
      .eq('user_id', userId)
      .single();

    // Cancel Stripe subscription if exists
    if (subscription?.stripe_subscription_id) {
      try {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
        await stripe.subscriptions.cancel(subscription.stripe_subscription_id, {
          prorate: true
        });
      } catch (stripeError) {
        log('Error canceling Stripe subscription:', stripeError);
        // Continue with deletion even if Stripe fails
      }
    }

    // Delete user data from all tables (order matters due to foreign keys)
    const tablesToDelete = [
      'notifications',
      'notification_preferences',
      'compliance_items',
      'fuel_entries',
      'expenses',
      'invoices',
      'loads',
      'maintenance_records',
      'drivers',
      'vehicles',
      'customers',
      'ifta_mileage',
      'subscriptions',
      'processed_sessions',
      'users'
    ];

    const deletionErrors = [];

    for (const table of tablesToDelete) {
      try {
        const { error } = await supabaseAdmin
          .from(table)
          .delete()
          .eq('user_id', userId);

        if (error && error.code !== 'PGRST116') {
          // PGRST116 is "no rows found" which is fine
          deletionErrors.push({ table, error: error.message });
        }
      } catch (tableError) {
        // Table might not exist, continue
        deletionErrors.push({ table, error: tableError.message });
      }
    }

    // Delete user from Supabase Auth
    try {
      const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (authDeleteError) {
        return NextResponse.json(
          { success: false, error: `Failed to delete auth user: ${authDeleteError.message}` },
          { status: 500 }
        );
      }
    } catch (authError) {
      return NextResponse.json(
        { success: false, error: `Failed to delete auth user: ${authError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Your account has been permanently deleted',
      deletionErrors: deletionErrors.length > 0 ? deletionErrors : undefined
    });

  } catch (error) {
    log('Account deletion error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete account' },
      { status: 500 }
    );
  }
}
