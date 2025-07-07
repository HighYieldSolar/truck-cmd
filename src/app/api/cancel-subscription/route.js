import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request) {
  try {
    const { userId, reason, feedback } = await request.json();

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Missing userId'
      }, { status: 400 });
    }

    // Initialize Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    // Get subscription data from database
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id, stripe_subscription_id, status')
      .eq('user_id', userId)
      .single();

    if (subError || !subscription?.stripe_subscription_id) {
      return NextResponse.json({
        success: false,
        error: 'No active subscription found to cancel'
      }, { status: 404 });
    }

    // Check if subscription is already canceled
    if (subscription.status === 'canceled') {
      return NextResponse.json({
        success: false,
        error: 'Subscription is already canceled'
      }, { status: 400 });
    }

    try {
      // Cancel the subscription in Stripe at the end of the billing period
      const canceledSubscription = await stripe.subscriptions.update(
        subscription.stripe_subscription_id,
        {
          cancel_at_period_end: true,
          metadata: {
            canceled_by: 'user',
            canceled_from: 'settings_page',
            cancellation_reason: reason || 'not_specified',
            cancellation_feedback: feedback || ''
          }
        }
      );

      console.log('Subscription canceled in Stripe:', canceledSubscription.id);

      // Update the subscription status in our database
      // Note: We keep status as 'active' since they have access until period end
      // The cancel_at_period_end flag indicates it's scheduled for cancellation
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          status: 'active', // Keep as active since they still have access
          cancel_at_period_end: true,
          canceled_at: new Date().toISOString(),
          cancellation_reason: reason || null,
          cancellation_feedback: feedback || null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (updateError) {
        console.error('Error updating subscription in database:', updateError);
        // Don't fail the request since Stripe cancellation succeeded
      }

      return NextResponse.json({
        success: true,
        message: 'Subscription canceled successfully. You will retain access until the end of your current billing period.',
        subscription: {
          id: canceledSubscription.id,
          status: canceledSubscription.status,
          cancel_at_period_end: canceledSubscription.cancel_at_period_end,
          current_period_end: canceledSubscription.current_period_end
        }
      });

    } catch (stripeError) {
      console.error('Stripe error canceling subscription:', stripeError);

      // Handle specific Stripe errors
      if (stripeError.type === 'StripeCardError') {
        return NextResponse.json({
          success: false,
          error: 'Payment method error: ' + stripeError.message
        }, { status: 400 });
      } else if (stripeError.type === 'StripeInvalidRequestError') {
        return NextResponse.json({
          success: false,
          error: 'Invalid request: ' + stripeError.message
        }, { status: 400 });
      } else {
        return NextResponse.json({
          success: false,
          error: 'Failed to cancel subscription with Stripe'
        }, { status: 500 });
      }
    }

  } catch (error) {
    console.error('Error canceling subscription:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to cancel subscription'
    }, { status: 500 });
  }
} 