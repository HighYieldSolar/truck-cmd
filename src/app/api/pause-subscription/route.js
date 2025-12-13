// src/app/api/pause-subscription/route.js
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabaseClient';
import { verifyUserAccess } from '@/lib/serverAuth';

const DEBUG = process.env.NODE_ENV === 'development';
const log = (...args) => DEBUG && console.log('[pause-subscription]', ...args);

// Maximum pause duration in months
const MAX_PAUSE_MONTHS = 3;

export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, pauseMonths = 1 } = body;

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Missing userId'
      }, { status: 400 });
    }

    // Validate pause duration
    if (pauseMonths < 1 || pauseMonths > MAX_PAUSE_MONTHS) {
      return NextResponse.json({
        success: false,
        error: `Pause duration must be between 1 and ${MAX_PAUSE_MONTHS} months`
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
        error: 'No active subscription found'
      }, { status: 404 });
    }

    // Check if already paused
    if (subscription.paused_at) {
      return NextResponse.json({
        success: false,
        error: 'Subscription is already paused'
      }, { status: 400 });
    }

    // Check if subscription is active
    if (subscription.status !== 'active') {
      return NextResponse.json({
        success: false,
        error: 'Only active subscriptions can be paused'
      }, { status: 400 });
    }

    // Calculate resume date
    const resumeDate = new Date();
    resumeDate.setMonth(resumeDate.getMonth() + pauseMonths);
    const resumesAt = Math.floor(resumeDate.getTime() / 1000);

    // Pause the subscription in Stripe
    // Using behavior=void means invoices are voided (no charge) during pause
    // The subscription remains active but billing is paused
    try {
      const updatedSubscription = await stripe.subscriptions.update(
        subscription.stripe_subscription_id,
        {
          pause_collection: {
            behavior: 'void',
            resumes_at: resumesAt
          },
          metadata: {
            paused_at: new Date().toISOString(),
            pause_months: pauseMonths.toString(),
            resumes_at: resumeDate.toISOString()
          }
        }
      );

      log('Subscription paused:', updatedSubscription.id);

      // Update Supabase to track pause status
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          paused_at: new Date().toISOString(),
          pause_resumes_at: resumeDate.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (updateError) {
        log('Error updating pause status in database:', updateError);
      }

      return NextResponse.json({
        success: true,
        message: `Your subscription has been paused for ${pauseMonths} month${pauseMonths > 1 ? 's' : ''}. It will automatically resume on ${resumeDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.`,
        pausedUntil: resumeDate.toISOString(),
        pauseMonths
      });

    } catch (stripeError) {
      log('Stripe error pausing subscription:', stripeError);
      return NextResponse.json({
        success: false,
        error: 'Failed to pause subscription. Please try again.'
      }, { status: 500 });
    }

  } catch (error) {
    log('Error pausing subscription:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to pause subscription'
    }, { status: 500 });
  }
}
