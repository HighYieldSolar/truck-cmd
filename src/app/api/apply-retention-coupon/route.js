import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin as supabase } from '@/lib/supabaseAdmin';
import { verifyUserAccess } from '@/lib/serverAuth';

const DEBUG = process.env.NODE_ENV === 'development';
const log = (...args) => DEBUG && console.log('[apply-retention-coupon]', ...args);

// Retention coupon ID - the $5 off for 2 months coupon
const RETENTION_COUPON_ID = 'b6hLazaO';

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
      .select('stripe_subscription_id, status')
      .eq('user_id', userId)
      .single();

    if (subError || !subscription?.stripe_subscription_id) {
      return NextResponse.json({
        success: false,
        error: 'No active subscription found'
      }, { status: 404 });
    }

    // Check if subscription is active
    if (subscription.status !== 'active') {
      return NextResponse.json({
        success: false,
        error: 'Subscription is not active'
      }, { status: 400 });
    }

    // Apply the coupon to the subscription
    try {
      const updatedSubscription = await stripe.subscriptions.update(
        subscription.stripe_subscription_id,
        {
          coupon: RETENTION_COUPON_ID,
          metadata: {
            retention_coupon_applied: 'true',
            retention_coupon_applied_at: new Date().toISOString()
          }
        }
      );

      log('Retention coupon applied to subscription:', updatedSubscription.id);

      // Update Supabase to track that retention was offered
      await supabase
        .from('subscriptions')
        .update({
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      return NextResponse.json({
        success: true,
        message: 'Discount applied successfully! You\'ll save $5 on your next 2 billing cycles.',
        discount: {
          amount: '$5 off',
          duration: '2 months'
        }
      });

    } catch (stripeError) {
      log('Stripe error applying coupon:', stripeError);

      // Handle specific errors
      if (stripeError.code === 'resource_missing') {
        return NextResponse.json({
          success: false,
          error: 'Discount code not found. Please contact support.'
        }, { status: 400 });
      }

      if (stripeError.code === 'coupon_expired') {
        return NextResponse.json({
          success: false,
          error: 'This discount has expired. Please contact support for alternatives.'
        }, { status: 400 });
      }

      return NextResponse.json({
        success: false,
        error: 'Failed to apply discount. Please try again.'
      }, { status: 500 });
    }

  } catch (error) {
    log('Error applying retention coupon:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to apply discount'
    }, { status: 500 });
  }
}
