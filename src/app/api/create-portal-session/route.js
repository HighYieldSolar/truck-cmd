// src/app/api/create-portal-session/route.js
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabaseClient';
import { verifyUserAccess } from '@/lib/serverAuth';

const DEBUG = process.env.NODE_ENV === 'development';
const log = (...args) => DEBUG && console.log('[create-portal-session]', ...args);

export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, returnUrl } = body;

    if (!userId) {
      return NextResponse.json({
        error: 'Missing required field: userId'
      }, { status: 400 });
    }

    // Verify the authenticated user matches the userId
    const { authorized, error: authError } = await verifyUserAccess(request, userId);
    if (!authorized) {
      return NextResponse.json({
        error: authError || 'Unauthorized'
      }, { status: 401 });
    }

    // Initialize Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    // Get user's subscription from database to find their Stripe customer ID
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id, stripe_subscription_id')
      .eq('user_id', userId)
      .single();

    if (subError || !subscription) {
      return NextResponse.json({
        error: 'No subscription found for this user'
      }, { status: 404 });
    }

    // If no Stripe customer ID, try to find it from the subscription
    let customerId = subscription.stripe_customer_id;

    if (!customerId && subscription.stripe_subscription_id) {
      // Try to get customer ID from the Stripe subscription
      try {
        const stripeSubscription = await stripe.subscriptions.retrieve(
          subscription.stripe_subscription_id
        );
        customerId = stripeSubscription.customer;

        // Update our database with the customer ID for future use
        await supabase
          .from('subscriptions')
          .update({
            stripe_customer_id: customerId,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);
      } catch (err) {
        log('Error retrieving Stripe subscription:', err);
      }
    }

    if (!customerId) {
      return NextResponse.json({
        error: 'No Stripe customer found. Please contact support.'
      }, { status: 400 });
    }

    // Create a Stripe Billing Portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl || `${process.env.NEXT_PUBLIC_URL}/dashboard/upgrade`,
    });

    return NextResponse.json({
      url: session.url
    });

  } catch (error) {
    log('Error creating portal session:', error);
    return NextResponse.json({
      error: error.message || 'Failed to create billing portal session'
    }, { status: 500 });
  }
}
