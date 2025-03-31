// app/api/webhook/route.js
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { supabase } from '@/lib/supabaseClient';

// Initialize Stripe with API key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
  const body = await request.text();
  const signature = headers().get('stripe-signature');

  if (!signature) {
    console.error('No signature found in webhook request');
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event;
  try {
    // Verify webhook signature
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error('Missing webhook secret env variable');
    }

    // Verify the webhook signature
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
  } catch (err) {
    console.error(`Error processing webhook: ${err.message}`);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  try {
    // Handle the event based on its type
    console.log(`Processing webhook event: ${event.type}`);
    
    switch (event.type) {
      case 'billing.alert.triggered':
        await handleBillingAlert(event.data);
        break;
      
      case 'billing_portal.configuration.created':
      case 'billing_portal.configuration.updated':
        await handlePortalConfigChange(event.data);
        break;
        
      case 'billing_portal.session.created':
        await handlePortalSessionCreated(event.data);
        break;
        
      case 'checkout.session.async_payment_failed':
        await handleCheckoutPaymentFailed(event.data);
        break;
        
      case 'checkout.session.async_payment_succeeded':
        await handleCheckoutPaymentSucceeded(event.data);
        break;
        
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data);
        break;
        
      case 'checkout.session.expired':
        await handleCheckoutExpired(event.data);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data);
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error(`Error processing webhook: ${err.message}`);
    return NextResponse.json(
      { error: 'Webhook handler failed', details: err.message },
      { status: 500 }
    );
  }
}

// Event handler implementations
async function handleBillingAlert(data) {
  console.log('Billing alert triggered:', data);
}

async function handlePortalConfigChange(data) {
  console.log('Portal configuration changed:', data);
}

async function handlePortalSessionCreated(data) {
  console.log('Portal session created:', data);
}

async function handleCheckoutPaymentFailed(data) {
  console.log('Checkout payment failed:', data.object);
  
  try {
    const { client_reference_id, metadata } = data.object;
    const userId = client_reference_id || metadata?.userId;
    
    if (userId) {
      // Update subscription status to 'failed'
      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
        
      if (error) {
        console.error('Error updating subscription status to failed:', error);
      }
    }
  } catch (err) {
    console.error('Error handling checkout payment failed:', err);
  }
}

async function handleCheckoutPaymentSucceeded(data) {
  console.log('Checkout payment succeeded:', data.object);
}

async function handleCheckoutCompleted(data) {
  console.log('Checkout completed webhook received:', data.object);
  
  try {
    // Extract customer and subscription info
    const { customer, subscription, client_reference_id, metadata } = data.object;
    console.log('Customer ID:', customer);
    console.log('Subscription ID:', subscription);
    console.log('User ID (from client_reference_id):', client_reference_id);
    console.log('Metadata:', metadata);
    
    const userId = client_reference_id || metadata?.userId;
    const plan = metadata?.plan || 'premium';
    const billingCycle = metadata?.billingCycle || 'monthly';
    
    if (!userId) {
      console.error('No user ID found in checkout session');
      return;
    }
    
    // Fetch subscription details from Stripe to get the current period end
    let periodEnd = null;
    try {
      if (subscription) {
        const subscriptionDetails = await stripe.subscriptions.retrieve(subscription);
        periodEnd = new Date(subscriptionDetails.current_period_end * 1000).toISOString();
        console.log('Current period end:', periodEnd);
      }
    } catch (stripeErr) {
      console.error('Error fetching subscription details from Stripe:', stripeErr);
      // Default to 30 days from now if we can't get the actual period end
      periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    }
    
    // Update subscription in database
    const { data: subData, error } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: userId,
        stripe_customer_id: customer,
        stripe_subscription_id: subscription,
        status: 'active',
        plan: plan,
        billing_cycle: billingCycle,
        trial_ends_at: null,
        current_period_ends_at: periodEnd,
        updated_at: new Date().toISOString()
      });
      
    if (error) {
      console.error('Error updating subscription in database:', error);
      throw error;
    }
    
    console.log('Subscription updated successfully in database');
    
  } catch (err) {
    console.error('Error processing checkout completed webhook:', err);
  }
}

async function handleCheckoutExpired(data) {
  console.log('Checkout expired:', data.object);
  
  try {
    const { client_reference_id, metadata } = data.object;
    const userId = client_reference_id || metadata?.userId;
    
    if (userId) {
      // Update subscription status to note that checkout expired
      await supabase
        .from('subscriptions')
        .update({
          checkout_expired: true,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
    }
  } catch (err) {
    console.error('Error handling checkout expired:', err);
  }
}

async function handleSubscriptionUpdated(data) {
  console.log('Subscription updated webhook received:', data.object);
  
  try {
    const subscription = data.object;
    const customerId = subscription.customer;
    const subscriptionId = subscription.id;
    const status = subscription.status;
    const currentPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString();
    
    // Find the user by Stripe customer ID
    const { data: userData, error: userError } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('stripe_customer_id', customerId)
      .single();
      
    if (userError) {
      console.error('Error finding user by customer ID:', userError);
      return;
    }
    
    if (!userData) {
      console.error('No user found with customer ID:', customerId);
      return;
    }
    
    // Map Stripe subscription status to our app status
    let appStatus = 'active';
    if (status === 'canceled' || status === 'unpaid') {
      appStatus = 'canceled';
    } else if (status === 'past_due') {
      appStatus = 'past_due';
    }
    
    // Update subscription in database
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: appStatus,
        stripe_subscription_status: status,
        current_period_ends_at: currentPeriodEnd,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userData.user_id);
      
    if (error) {
      console.error('Error updating subscription from webhook:', error);
      return;
    }
    
    console.log('Subscription successfully updated from webhook');
    
  } catch (err) {
    console.error('Error handling subscription updated webhook:', err);
  }
}

// This endpoint doesn't support GET requests
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}