// src/app/api/sync-subscription/route.js
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    // Get the subscription record from our database
    const { data: subData, error: subError } = await supabase
      .from('subscriptions')
      .select('stripe_subscription_id, stripe_customer_id')
      .eq('user_id', userId)
      .single();

    let subscription;
    let stripeCustomerId = subData?.stripe_customer_id;
    let stripeSubscriptionId = subData?.stripe_subscription_id;

    // If we have a subscription ID in the database, use it
    if (stripeSubscriptionId) {
      subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
    } else {
      // No subscription ID in database - search Stripe for subscriptions with this userId in metadata
      console.log(`No subscription ID in database for user ${userId}, searching Stripe...`);

      // Search for subscriptions with any status (active, incomplete, etc.)
      // This handles the case where payment just completed and status is transitioning
      const allSubscriptions = await stripe.subscriptions.list({
        limit: 20,
        expand: ['data.customer']
      });

      // Find subscription with matching userId in metadata
      // Prioritize active subscriptions, then any other status
      const matchingSubscriptions = allSubscriptions.data.filter(sub => sub.metadata?.userId === userId);

      if (matchingSubscriptions.length > 0) {
        // Prioritize active subscriptions
        subscription = matchingSubscriptions.find(sub => sub.status === 'active')
          || matchingSubscriptions[0];
        console.log(`Found ${matchingSubscriptions.length} matching subscription(s), using status: ${subscription.status}`);
      }

      if (!subscription) {
        return NextResponse.json({
          error: 'No subscription found in Stripe for this user',
          details: 'Could not find a subscription with matching userId in metadata'
        }, { status: 404 });
      }

      // Found subscription in Stripe - save the IDs
      stripeSubscriptionId = subscription.id;
      stripeCustomerId = typeof subscription.customer === 'string'
        ? subscription.customer
        : subscription.customer?.id;

      console.log(`Found subscription ${stripeSubscriptionId} for user ${userId} in Stripe`);
    }

    // Extract plan info
    const plan = subscription.metadata?.plan || 'premium';
    const billingCycle = subscription.metadata?.billingCycle ||
      (subscription.items.data[0]?.price?.recurring?.interval === 'year' ? 'yearly' : 'monthly');
    const amount = subscription.items.data[0]?.price?.unit_amount || 0;

    // Update our database with the latest from Stripe
    const updateData = {
      status: subscription.status,
      plan: plan,
      billing_cycle: billingCycle,
      amount: Math.round(amount) / 100,
      stripe_subscription_id: stripeSubscriptionId,
      stripe_customer_id: stripeCustomerId,
      current_period_starts_at: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_ends_at: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end || false,
      updated_at: new Date().toISOString()
    };

    // Clear trial if active
    if (subscription.status === 'active') {
      updateData.trial_ends_at = null;
    }

    const { error: updateError } = await supabase
      .from('subscriptions')
      .update(updateData)
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error updating subscription:', updateError);
      return NextResponse.json({
        error: 'Failed to update subscription',
        details: updateError.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      subscription: {
        status: subscription.status,
        plan: plan,
        billingCycle: billingCycle,
        amount: Math.round(amount) / 100,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString()
      }
    });

  } catch (error) {
    console.error('Error syncing subscription:', error);
    return NextResponse.json({
      error: error.message || 'Failed to sync subscription'
    }, { status: 500 });
  }
}
