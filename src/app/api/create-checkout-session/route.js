// src/app/api/create-checkout-session/route.js
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request) {
  try {
    const body = await request.json();

    // Check for required fields
    if (!body.userId || !body.plan || !body.billingCycle) {
      return NextResponse.json({
        error: 'Missing required fields',
        details: { received: body }
      }, { status: 400 });
    }

    // Initialize Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    // Get user email for checkout
    let userEmail;
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('email')
        .eq('id', body.userId)
        .single();

      if (!userError && userData?.email) {
        userEmail = userData.email;
      } else {
        // Fallback - get email from auth.users 
        const { data: authUser } = await supabase.auth.admin.getUserById(body.userId);
        if (authUser?.user?.email) {
          userEmail = authUser.user.email;
        }
      }
    } catch (err) {
      // Continue without email - non-critical
    }

    // Map plan and billing cycle to price IDs
    // Replace these with your actual Stripe price IDs
    const priceIds = {
      basic: {
        monthly: process.env.STRIPE_BASIC_MONTHLY_PRICE_ID,
        yearly: process.env.STRIPE_BASIC_YEARLY_PRICE_ID
      },
      premium: {
        monthly: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID,
        yearly: process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID
      },
      fleet: {
        monthly: process.env.STRIPE_FLEET_MONTHLY_PRICE_ID,
        yearly: process.env.STRIPE_FLEET_YEARLY_PRICE_ID
      }
    };

    const { userId, plan, billingCycle } = body;

    // Determine if we should use test price data or real price IDs
    const useTestPriceData = !priceIds[plan]?.[billingCycle];

    // Set up success and cancel URLs
    const successUrl = body.returnUrl
      ? `${body.returnUrl}?session_id={CHECKOUT_SESSION_ID}`
      : `${process.env.NEXT_PUBLIC_URL}/dashboard/upgrade/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${body.returnUrl || process.env.NEXT_PUBLIC_URL}/dashboard/upgrade?canceled=true`;

    // Create the checkout session
    const session = await stripe.checkout.sessions.create({
      customer_email: userEmail, // Add this if available
      client_reference_id: userId,
      payment_method_types: ['card'],
      line_items: [
        useTestPriceData ?
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan (${billingCycle})`,
                description: `Subscription to the ${plan} plan, billed ${billingCycle}`,
              },
              unit_amount:
                plan === 'basic'
                  ? (billingCycle === 'yearly' ? 19200 : 2000) // $192/year or $20/month
                  : plan === 'premium'
                    ? (billingCycle === 'yearly' ? 33600 : 3500) // $336/year or $35/month
                    : (billingCycle === 'yearly' ? 72000 : 7500), // $720/year or $75/month
              recurring: {
                interval: billingCycle === 'yearly' ? 'year' : 'month',
              },
            },
            quantity: 1,
          } :
          {
            price: priceIds[plan][billingCycle],
            quantity: 1,
          }
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId,
        plan,
        billingCycle
      }
    });

    // Update the subscription record to indicate checkout was initiated
    try {
      await supabase
        .from('subscriptions')
        .upsert({
          user_id: userId,
          plan: plan,
          billing_cycle: billingCycle,
          checkout_session_id: session.id,
          checkout_initiated_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
    } catch (err) {
      // Continue despite error - non-critical
    }

    // Return success with URL
    return NextResponse.json({ url: session.url });
  } catch (error) {
    return NextResponse.json({
      error: error.message || 'An error occurred while creating checkout session'
    }, { status: 500 });
  }
}