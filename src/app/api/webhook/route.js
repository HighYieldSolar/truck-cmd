// app/api/webhook/route.js
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';

// Initialize Stripe with API key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
  const body = await request.text();
  const signature = headers().get('truck-command-signature');

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

    // Parse the event
    event = JSON.parse(body);

    // For security, you should actually verify the signature
    // Using your own cryptographic verification as in the previous examples
    // This is just a placeholder for actual verification code
    // const isSignatureValid = verifySignature(body, signature, webhookSecret);
    // if (!isSignatureValid) {
    //   throw new Error('Invalid signature');
    // }
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  try {
    // Handle the event based on its type
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
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error(`Error processing webhook: ${err.message}`);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

// Implement your event handlers here
async function handleBillingAlert(data) {
  console.log('Billing alert triggered:', data);
  // TODO: Add your business logic
  // Example: Send notification to admin
}

async function handlePortalConfigChange(data) {
  console.log('Portal configuration changed:', data);
  // TODO: Add your business logic
}

async function handlePortalSessionCreated(data) {
  console.log('Portal session created:', data);
  // TODO: Add your business logic
}

async function handleCheckoutPaymentFailed(data) {
  console.log('Checkout payment failed:', data);
  // TODO: Add your business logic
  // Example: Update order status in database
  // Example: Send email to customer
}

async function handleCheckoutPaymentSucceeded(data) {
  console.log('Checkout payment succeeded:', data);
  // TODO: Add your business logic
}

async function handleCheckoutCompleted(data) {
  console.log('Checkout completed:', data.object);
  
  // Example: Update user subscription status in your database
  // const { customer, subscription } = data.object;
  
  // TODO: Replace this with your actual database update code
  // Example using Supabase:
  // const { data: userData, error } = await supabase
  //   .from('subscriptions')
  //   .upsert({
  //     customer_id: customer,
  //     subscription_id: subscription,
  //     status: 'active',
  //     updated_at: new Date().toISOString()
  //   });
  
  // Example: Send welcome email to new subscribers
  // await sendWelcomeEmail(data.object.customer_details.email);
}

async function handleCheckoutExpired(data) {
  console.log('Checkout expired:', data);
  // TODO: Add your business logic
  // Example: Clean up any pending orders
}

// This endpoint doesn't support GET requests
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}