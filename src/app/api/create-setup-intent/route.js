// src/app/api/create-setup-intent/route.js
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({
        error: 'Missing userId'
      }, { status: 400 });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    // Get subscription data from database to find Stripe customer ID
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id, stripe_subscription_id')
      .eq('user_id', userId)
      .single();

    if (subError || !subscription?.stripe_customer_id) {
      return NextResponse.json({
        error: 'No active subscription found'
      }, { status: 404 });
    }

    // Get customer email from Stripe
    const customer = await stripe.customers.retrieve(subscription.stripe_customer_id);

    // Create a SetupIntent for updating the payment method
    const setupIntent = await stripe.setupIntents.create({
      customer: subscription.stripe_customer_id,
      payment_method_types: ['card', 'link'],
      usage: 'off_session',
      metadata: {
        user_id: userId,
        subscription_id: subscription.stripe_subscription_id
      }
    });

    return NextResponse.json({
      success: true,
      clientSecret: setupIntent.client_secret,
      customerId: subscription.stripe_customer_id,
      customerEmail: customer.email || null
    });

  } catch (error) {
    console.error('Error creating setup intent:', error);
    return NextResponse.json({
      error: error.message || 'Failed to create setup intent'
    }, { status: 500 });
  }
}
