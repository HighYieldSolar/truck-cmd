import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin as supabase } from '@/lib/supabaseAdmin';
import { verifyUserAccess } from '@/lib/serverAuth';

const DEBUG = process.env.NODE_ENV === 'development';
const log = (...args) => DEBUG && console.log('[get-payment-method]', ...args);

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

    // Get subscription data from database to find Stripe customer ID
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id, stripe_subscription_id')
      .eq('user_id', userId)
      .single();

    if (subError || !subscription?.stripe_customer_id) {
      return NextResponse.json({
        success: false,
        error: 'No active subscription found'
      }, { status: 404 });
    }

    try {
      // Get the customer from Stripe
      const customer = await stripe.customers.retrieve(subscription.stripe_customer_id);

      if (!customer.default_source && !customer.invoice_settings?.default_payment_method) {
        return NextResponse.json({
          success: true,
          paymentMethod: null // No payment method on file
        });
      }

      let paymentMethod = null;

      // Try to get the default payment method
      if (customer.invoice_settings?.default_payment_method) {
        try {
          paymentMethod = await stripe.paymentMethods.retrieve(
            customer.invoice_settings.default_payment_method
          );
        } catch (err) {
          log('Error retrieving payment method:', err);
        }
      }

      // If no payment method found, try to get from subscription
      if (!paymentMethod && subscription.stripe_subscription_id) {
        try {
          const stripeSubscription = await stripe.subscriptions.retrieve(
            subscription.stripe_subscription_id
          );

          if (stripeSubscription.default_payment_method) {
            paymentMethod = await stripe.paymentMethods.retrieve(
              stripeSubscription.default_payment_method
            );
          }
        } catch (err) {
          log('Error retrieving subscription payment method:', err);
        }
      }

      // If still no payment method, try getting from customer sources (for older integrations)
      if (!paymentMethod && customer.default_source) {
        try {
          const source = await stripe.customers.retrieveSource(
            subscription.stripe_customer_id,
            customer.default_source
          );

          // Convert source to payment method format for consistency
          if (source.object === 'card') {
            paymentMethod = {
              id: source.id,
              object: 'payment_method',
              type: 'card',
              card: {
                brand: source.brand,
                last4: source.last4,
                exp_month: source.exp_month,
                exp_year: source.exp_year,
                funding: source.funding
              }
            };
          }
        } catch (err) {
          log('Error retrieving source:', err);
        }
      }

      // Format the payment method response
      let formattedPaymentMethod = null;

      if (paymentMethod) {
        if (paymentMethod.type === 'card') {
          formattedPaymentMethod = {
            id: paymentMethod.id,
            type: 'card',
            card: {
              brand: paymentMethod.card?.brand,
              last4: paymentMethod.card?.last4,
              exp_month: paymentMethod.card?.exp_month,
              exp_year: paymentMethod.card?.exp_year,
              funding: paymentMethod.card?.funding
            }
          };
        } else if (paymentMethod.type === 'link') {
          formattedPaymentMethod = {
            id: paymentMethod.id,
            type: 'link',
            email: paymentMethod.link?.email || customer.email
          };
        } else {
          // Generic fallback for other payment types
          formattedPaymentMethod = {
            id: paymentMethod.id,
            type: paymentMethod.type,
            details: paymentMethod[paymentMethod.type] || {}
          };
        }
      }

      return NextResponse.json({
        success: true,
        paymentMethod: formattedPaymentMethod,
        customerEmail: customer.email
      });

    } catch (stripeError) {
      log('Stripe error fetching payment method:', stripeError);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch payment method from Stripe'
      }, { status: 500 });
    }

  } catch (error) {
    log('Error fetching payment method:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch payment method'
    }, { status: 500 });
  }
} 