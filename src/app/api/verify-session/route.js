// src/app/api/verify-session/route.js
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabaseClient';

const DEBUG = process.env.NODE_ENV === 'development';
const log = (...args) => DEBUG && console.log('[verify-session]', ...args);

export async function POST(request) {
  try {
    const { sessionId } = await request.json();
    log('Verifying session:', sessionId);

    if (!sessionId) {
      log('No session ID provided');
      return NextResponse.json({
        valid: false,
        error: 'Missing session ID'
      }, { status: 400 });
    }

    // Initialize Stripe with API key
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    log('Stripe initialized');

    try {
      // Retrieve the checkout session with expanded data
      log('Retrieving checkout session from Stripe');
      const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['subscription', 'customer', 'payment_intent', 'payment_intent.payment_method']
      });

      log('Session retrieved:', {
        id: session.id,
        paymentStatus: session.payment_status,
        customerId: session.customer,
        subscriptionId: session.subscription
      });

      // Check if the session was successful
      if (session.payment_status !== 'paid') {
        log('Payment not completed, status:', session.payment_status);
        return NextResponse.json({
          valid: false,
          error: 'Payment not completed'
        });
      }

      // Extract metadata and important information
      const userId = session.client_reference_id || session.metadata?.userId;
      const plan = session.metadata?.plan || 'premium';
      const billingCycle = session.metadata?.billingCycle || 'monthly';

      // Extract just the IDs from the objects (when expanded, these are full objects)
      const subscriptionId = typeof session.subscription === 'string'
        ? session.subscription
        : session.subscription?.id;
      const customerId = typeof session.customer === 'string'
        ? session.customer
        : session.customer?.id;

      log('Extracted IDs:', { subscriptionId, customerId, userId });

      if (!userId) {
        log('No user ID found in session');
        return NextResponse.json({
          valid: false,
          error: 'No user ID associated with this session'
        });
      }

      // Get subscription details
      let currentPeriodStart = null;
      let currentPeriodEnd = null;
      let subscription = null;
      let cardLastFour = null;

      if (subscriptionId) {
        try {
          log('Retrieving subscription details from Stripe');
          subscription = await stripe.subscriptions.retrieve(subscriptionId);
          currentPeriodStart = new Date(subscription.current_period_start * 1000).toISOString();
          currentPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString();
          log('Current period:', currentPeriodStart, 'to', currentPeriodEnd);
          log('Subscription status:', subscription.status);
        } catch (err) {
          log('Error retrieving subscription:', err.message);
          // Default periods based on billing cycle
          currentPeriodStart = new Date().toISOString();

          if (billingCycle === 'yearly') {
            // For yearly subscriptions, set end date to 1 year from now
            const endDate = new Date();
            endDate.setFullYear(endDate.getFullYear() + 1);
            currentPeriodEnd = endDate.toISOString();
          } else {
            // For monthly subscriptions, set end date to 1 month from now
            const endDate = new Date();
            endDate.setMonth(endDate.getMonth() + 1);
            currentPeriodEnd = endDate.toISOString();
          }

          log('Using default periods based on billing cycle:', billingCycle);
        }
      } else {
        // Default periods based on billing cycle
        currentPeriodStart = new Date().toISOString();

        if (billingCycle === 'yearly') {
          // For yearly subscriptions, set end date to 1 year from now
          const endDate = new Date();
          endDate.setFullYear(endDate.getFullYear() + 1);
          currentPeriodEnd = endDate.toISOString();
        } else {
          // For monthly subscriptions, set end date to 1 month from now
          const endDate = new Date();
          endDate.setMonth(endDate.getMonth() + 1);
          currentPeriodEnd = endDate.toISOString();
        }

        log('No subscription ID, using default periods based on billing cycle:', billingCycle);
      }

      // Get payment method details for card last four
      try {
        if (session.payment_intent && session.payment_intent.payment_method) {
          const paymentMethod = session.payment_intent.payment_method;
          if (paymentMethod.card && paymentMethod.card.last4) {
            cardLastFour = paymentMethod.card.last4;
            log('Found card last four');
          }
        } else if (session.payment_intent) {
          // If payment method wasn't expanded, retrieve it separately
          const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent.id, {
            expand: ['payment_method']
          });

          if (paymentIntent.payment_method && paymentIntent.payment_method.card) {
            cardLastFour = paymentIntent.payment_method.card.last4;
            log('Retrieved card last four separately');
          }
        }
      } catch (err) {
        log('Error retrieving payment method details:', err.message);
        // Continue without card details
      }

      // Calculate pricing based on plan and cycle - Updated to match billing page pricing
      const pricingData = {
        basic: {
          monthly: { price: 20, amount: 2000 },
          yearly: { price: 16, amount: 1600, total: 192 }
        },
        premium: {
          monthly: { price: 35, amount: 3500 },
          yearly: { price: 28, amount: 2800, total: 336 }
        },
        fleet: {
          monthly: { price: 75, amount: 7500 },
          yearly: { price: 60, amount: 6000, total: 720 }
        }
      };

      const planPricing = pricingData[plan] || pricingData.premium;
      const cyclePricing = planPricing[billingCycle] || planPricing.monthly;

      // Return the verification result with complete data
      return NextResponse.json({
        valid: true,
        userId,
        customerId,
        subscriptionId,
        plan,
        billingCycle,
        currentPeriodStart,
        currentPeriodEnd,
        cardLastFour,
        amount: cyclePricing.amount,
        monthlyPrice: cyclePricing.price || planPricing.monthly.price,
        yearlyPrice: billingCycle === 'yearly' ? cyclePricing.price : planPricing.yearly?.price,
        yearlyTotal: cyclePricing.total || planPricing.yearly?.total,
        subscriptionStatus: subscription?.status || 'active'
      });
    } catch (stripeError) {
      log('Stripe error during session verification:', stripeError.message);
      return NextResponse.json({
        valid: false,
        error: stripeError.message || 'Failed to verify with Stripe'
      }, { status: 500 });
    }
  } catch (error) {
    log('Error verifying session:', error.message);
    return NextResponse.json({
      valid: false,
      error: error.message || 'Failed to verify session'
    }, { status: 500 });
  }
}