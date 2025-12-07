import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request) {
  try {
    const { userId } = await request.json();

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
      .select('stripe_subscription_id, status, cancel_at_period_end')
      .eq('user_id', userId)
      .single();

    if (subError || !subscription?.stripe_subscription_id) {
      return NextResponse.json({
        success: false,
        error: 'No subscription found'
      }, { status: 404 });
    }

    // Check if subscription is actually pending cancellation
    if (!subscription.cancel_at_period_end) {
      return NextResponse.json({
        success: false,
        error: 'Subscription is not pending cancellation'
      }, { status: 400 });
    }

    try {
      // Reactivate the subscription in Stripe by removing the cancellation
      const reactivatedSubscription = await stripe.subscriptions.update(
        subscription.stripe_subscription_id,
        {
          cancel_at_period_end: false,
          metadata: {
            reactivated_at: new Date().toISOString(),
            reactivated_by: 'user'
          }
        }
      );

      // Update the subscription in our database
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          cancel_at_period_end: false,
          canceled_at: null,
          cancellation_reason: null,
          cancellation_feedback: null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (updateError) {
        console.error('Error updating subscription in database:', updateError);
        // Don't fail since Stripe update succeeded
      }

      return NextResponse.json({
        success: true,
        message: 'Your subscription has been reactivated! You will continue to be billed normally.',
        subscription: {
          id: reactivatedSubscription.id,
          status: reactivatedSubscription.status,
          cancel_at_period_end: reactivatedSubscription.cancel_at_period_end,
          current_period_end: reactivatedSubscription.current_period_end
        }
      });

    } catch (stripeError) {
      console.error('Stripe error reactivating subscription:', stripeError);
      return NextResponse.json({
        success: false,
        error: 'Failed to reactivate subscription with Stripe'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error reactivating subscription:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to reactivate subscription'
    }, { status: 500 });
  }
}
