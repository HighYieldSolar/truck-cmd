// src/app/api/create-checkout-session/route.js
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request) {
  try {
    // Log incoming request data
    const body = await request.json();
    console.log('Create checkout session request:', body);

    // Check for required fields
    if (!body.userId || !body.plan || !body.billingCycle) {
      return NextResponse.json({
        error: 'Missing required fields',
        details: { received: body }
      }, { status: 400 });
    }

    // Initialize Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    console.log('Stripe initialized with key ending in:', process.env.STRIPE_SECRET_KEY?.slice(-4));

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
      console.log('Error fetching user email:', err);
      // Continue without email
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
      : `${process.env.NEXT_PUBLIC_URL}/dashboard/billing/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${body.returnUrl || process.env.NEXT_PUBLIC_URL}/dashboard/billing?canceled=true`;

    console.log('Success URL:', successUrl);
    console.log('Cancel URL:', cancelUrl);

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
                  ? (billingCycle === 'yearly' ? 1600 : 2000) // $16/mo yearly, $20/mo monthly
                  : plan === 'premium'
                    ? (billingCycle === 'yearly' ? 2800 : 3500) // $28/mo yearly, $35/mo monthly 
                    : (billingCycle === 'yearly' ? 6000 : 7500), // $60/mo yearly, $75/mo monthly
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

    console.log('Session created:', session.id);

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
      console.log('Error updating subscription record:', err);
      // Continue despite error
    }

    // Return success with URL
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json({
      error: error.message,
      stack: error.stack,
      details: JSON.stringify(error, Object.getOwnPropertyNames(error))
    }, { status: 500 });
  }
}