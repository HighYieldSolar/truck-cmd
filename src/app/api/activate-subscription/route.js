// src/app/api/activate-subscription/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabaseAdmin';
import { verifyUserAccess } from '@/lib/serverAuth';

const DEBUG = process.env.NODE_ENV === 'development';
const log = (...args) => DEBUG && console.log('[activate-subscription]', ...args);

/**
 * Helper function to generate a consistent ID for deduplication
 */
function generateIdempotencyKey(userId, sessionId) {
  return `${userId}_${sessionId}`;
}

/**
 * Checks if a session has already been processed
 */
async function hasProcessedSession(userId, sessionId) {
  // Generate a unique key for this operation
  const idempotencyKey = generateIdempotencyKey(userId, sessionId);

  try {
    // Use a table to track processed sessions
    const { data, error } = await supabase
      .from('processed_sessions')
      .select('id')
      .eq('idempotency_key', idempotencyKey)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "No rows returned"
      log('Error checking for processed session:', error);
      // If there's an error, assume we haven't processed it yet
      return false;
    }

    // If we found a record, this session has already been processed
    return !!data;
  } catch (err) {
    log('Error in hasProcessedSession:', err);
    // If the processed_sessions table doesn't exist yet, assume not processed
    return false;
  }
}

/**
 * Records that a session has been processed to prevent duplicates
 */
async function markSessionAsProcessed(userId, sessionId) {
  // Generate a unique key for this operation
  const idempotencyKey = generateIdempotencyKey(userId, sessionId);

  try {
    const { error } = await supabase
      .from('processed_sessions')
      .insert([{
        idempotency_key: idempotencyKey,
        user_id: userId,
        session_id: sessionId,
        processed_at: new Date().toISOString()
      }]);

    if (error) {
      log('Error marking session as processed:', error);
    }
  } catch (err) {
    // If the table doesn't exist, that's ok for now
    log('Could not mark session as processed:', err);
  }
}

/**
 * Calculate subscription amount based on plan and billing cycle
 */
function calculateAmount(plan, billingCycle) {
  const pricing = {
    basic: { monthly: 2000, yearly: 1600 }, // $20/mo or $16/mo yearly
    premium: { monthly: 3500, yearly: 2800 }, // $35/mo or $28/mo yearly
    fleet: { monthly: 7500, yearly: 6000 } // $75/mo or $60/mo yearly
  };

  return pricing[plan]?.[billingCycle] || pricing.premium[billingCycle] || 3500;
}

export async function POST(request) {
  try {
    // Get data from the request
    const body = await request.json();
    const { userId, sessionId, verificationData } = body;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Missing userId' }, { status: 400 });
    }

    // Verify the authenticated user matches the userId
    const { authorized, error: authError } = await verifyUserAccess(request, userId);
    if (!authorized) {
      return NextResponse.json({
        success: false,
        error: authError || 'Unauthorized'
      }, { status: 401 });
    }

    log(`Checking if subscription for user ${userId} with session ${sessionId} has already been processed`);

    // Check if we've already processed this session for this user
    if (await hasProcessedSession(userId, sessionId)) {
      log(`Session ${sessionId} has already been processed for user ${userId}, skipping`);
      return NextResponse.json({
        success: true,
        message: 'Session already processed',
        alreadyProcessed: true
      });
    }

    log(`Activating subscription for user ${userId} with verification data:`, verificationData);

    // Prepare subscription data with complete information
    const subscriptionData = {
      user_id: userId,
      status: verificationData?.subscriptionStatus || 'active',
      plan: verificationData?.plan || 'premium',
      billing_cycle: verificationData?.billingCycle || 'monthly',
      amount: verificationData?.amount || calculateAmount(verificationData?.plan || 'premium', verificationData?.billingCycle || 'monthly'),
      // Ensure we store only string IDs, not objects
      stripe_customer_id: typeof verificationData?.customerId === 'string'
        ? verificationData.customerId
        : verificationData?.customerId?.id || null,
      stripe_subscription_id: typeof verificationData?.subscriptionId === 'string'
        ? verificationData.subscriptionId
        : verificationData?.subscriptionId?.id || null,
      card_last_four: verificationData?.cardLastFour || null,
      current_period_starts_at: verificationData?.currentPeriodStart || new Date().toISOString(),
      current_period_ends_at: verificationData?.currentPeriodEnd || null,
      trial_ends_at: null, // Clear trial when subscription becomes active
      checkout_session_id: sessionId,
      updated_at: new Date().toISOString()
    };

    log('Prepared subscription data:', {
      ...subscriptionData,
      // Don't log the full objects to avoid clutter
      stripe_customer_id: subscriptionData.stripe_customer_id,
      stripe_subscription_id: subscriptionData.stripe_subscription_id
    });

    // Query to see if user has subscription records
    const { data: existingSubscriptions, error: queryError } = await supabase
      .from('subscriptions')
      .select('id, status')
      .eq('user_id', userId);

    if (queryError) {
      log('Error querying subscriptions:', queryError);
      return NextResponse.json({ success: false, error: queryError.message }, { status: 500 });
    }

    log('Existing subscriptions:', existingSubscriptions);

    let result;

    // If subscription records exist, update them all
    if (existingSubscriptions && existingSubscriptions.length > 0) {
      // Find the latest subscription record by id (assuming UUID v4 has sequential components)
      const latestSubscription = existingSubscriptions.reduce((latest, current) =>
        !latest || current.id > latest.id ? current : latest, null);

      log(`Found ${existingSubscriptions.length} subscription records, updating only the latest one with ID: ${latestSubscription.id}`);

      // Update only the latest subscription record
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update(subscriptionData)
        .eq('id', latestSubscription.id);

      if (updateError) {
        log('Error updating subscription:', updateError);
        return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
      }

      // Now delete any other subscription records for this user to clean up duplicates
      if (existingSubscriptions.length > 1) {
        const otherSubscriptionIds = existingSubscriptions
          .filter(sub => sub.id !== latestSubscription.id)
          .map(sub => sub.id);

        log(`Cleaning up ${otherSubscriptionIds.length} duplicate subscription records`);

        const { error: deleteError } = await supabase
          .from('subscriptions')
          .delete()
          .in('id', otherSubscriptionIds);

        if (deleteError) {
          log('Warning: Could not clean up duplicate subscriptions:', deleteError.message);
          // Not critical, continue with the process
        } else {
          log(`Successfully removed ${otherSubscriptionIds.length} duplicate subscription records`);
        }
      }

      log('Updated subscription record with complete data');
      result = { success: true, message: 'Subscription record updated with complete data' };
    } else {
      // No records found, create a new one with complete data
      subscriptionData.created_at = new Date().toISOString();

      const { error: insertError } = await supabase
        .from('subscriptions')
        .insert([subscriptionData]);

      if (insertError) {
        log('Error creating subscription:', insertError);
        return NextResponse.json({ success: false, error: insertError.message }, { status: 500 });
      }

      log('Created new subscription record with complete data');
      result = { success: true, message: 'New subscription record created with complete data' };
    }

    // Also update the users table with subscription info if column exists
    try {
      const customerIdString = typeof verificationData?.customerId === 'string'
        ? verificationData.customerId
        : verificationData?.customerId?.id || null;

      const { error: userUpdateError } = await supabase
        .from('users')
        .update({
          subscription_tier: verificationData?.plan || 'premium',
          stripe_customer_id: customerIdString,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (userUpdateError) {
        log('Note: Could not update users table:', userUpdateError.message);
        // Not critical, continue
      } else {
        log('Updated users table with subscription info');
      }
    } catch (err) {
      log('Note: Users table update failed:', err.message);
    }

    // Mark this session as processed to prevent duplicate processing
    await markSessionAsProcessed(userId, sessionId);

    return NextResponse.json(result);
  } catch (error) {
    log('Error processing request:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}