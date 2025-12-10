// src/app/api/update-payment-method/route.js
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabaseClient';
import { verifyUserAccess } from '@/lib/serverAuth';

const DEBUG = process.env.NODE_ENV === 'development';
const log = (...args) => DEBUG && console.log('[update-payment-method]', ...args);

export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, paymentMethodId } = body;

    if (!userId || !paymentMethodId) {
      return NextResponse.json({
        error: 'Missing required fields'
      }, { status: 400 });
    }

    // Verify the authenticated user matches the userId
    const { authorized, error: authError } = await verifyUserAccess(request, userId);
    if (!authorized) {
      return NextResponse.json({
        error: authError || 'Unauthorized'
      }, { status: 401 });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    // Get subscription data from database
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

    // Attach the payment method to the customer (if not already attached)
    try {
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: subscription.stripe_customer_id
      });
    } catch (attachError) {
      // Payment method might already be attached, that's okay
      if (attachError.code !== 'resource_already_exists') {
        log('Error attaching payment method:', attachError);
      }
    }

    // Set as default payment method for the customer
    await stripe.customers.update(subscription.stripe_customer_id, {
      invoice_settings: {
        default_payment_method: paymentMethodId
      }
    });

    // Also update the subscription's default payment method
    if (subscription.stripe_subscription_id) {
      await stripe.subscriptions.update(subscription.stripe_subscription_id, {
        default_payment_method: paymentMethodId
      });
    }

    // Get the updated payment method details
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

    // Update card_last_four in database if it's a card
    if (paymentMethod.type === 'card' && paymentMethod.card?.last4) {
      await supabase
        .from('subscriptions')
        .update({
          card_last_four: paymentMethod.card.last4,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
    }

    // Format response
    let formattedPaymentMethod = null;

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
        email: paymentMethod.link?.email
      };
    }

    return NextResponse.json({
      success: true,
      paymentMethod: formattedPaymentMethod,
      message: 'Payment method updated successfully'
    });

  } catch (error) {
    log('Error updating payment method:', error);
    return NextResponse.json({
      error: error.message || 'Failed to update payment method'
    }, { status: 500 });
  }
}
