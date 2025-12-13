// src/app/api/resume-subscription/route.js
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin as supabase } from '@/lib/supabaseAdmin';
import { verifyUserAccess } from '@/lib/serverAuth';

const DEBUG = process.env.NODE_ENV === 'development';
const log = (...args) => DEBUG && console.log('[resume-subscription]', ...args);

export async function POST(request) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Missing userId'
      }, { status: 400 });
    }

    // Verify the authenticated user matches the userId
    const { authorized, error: authError } = await verifyUserAccess(request, userId);
    if (!authorized) {
      return NextResponse.json({
        success: false,
        error: authError || 'Unauthorized'
      }, { status: 401 });
    }

    // Initialize Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    // Get subscription data from database
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('stripe_subscription_id, status, paused_at')
      .eq('user_id', userId)
      .single();

    if (subError || !subscription?.stripe_subscription_id) {
      return NextResponse.json({
        success: false,
        error: 'No subscription found'
      }, { status: 404 });
    }

    // Check if subscription is paused
    if (!subscription.paused_at) {
      return NextResponse.json({
        success: false,
        error: 'Subscription is not paused'
      }, { status: 400 });
    }

    // Resume the subscription in Stripe by unsetting pause_collection
    try {
      const updatedSubscription = await stripe.subscriptions.update(
        subscription.stripe_subscription_id,
        {
          pause_collection: '', // Unset to resume
          metadata: {
            paused_at: '',
            pause_months: '',
            resumes_at: '',
            resumed_at: new Date().toISOString(),
            resumed_early: 'true'
          }
        }
      );

      log('Subscription resumed:', updatedSubscription.id);

      // Update Supabase to clear pause status
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          paused_at: null,
          pause_resumes_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (updateError) {
        log('Error updating resume status in database:', updateError);
      }

      return NextResponse.json({
        success: true,
        message: 'Your subscription has been resumed! Billing will continue from your next billing cycle.'
      });

    } catch (stripeError) {
      log('Stripe error resuming subscription:', stripeError);
      return NextResponse.json({
        success: false,
        error: 'Failed to resume subscription. Please try again.'
      }, { status: 500 });
    }

  } catch (error) {
    log('Error resuming subscription:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to resume subscription'
    }, { status: 500 });
  }
}
