import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import stripe from '@/lib/stripe';
import { supabase } from '@/lib/supabaseClient';

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request) {
  const body = await request.text();
  const headersList = headers();
  const signature = headersList.get('stripe-signature');
  
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      endpointSecret
    );
  } catch (err) {
    console.error(`⚠️ Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
  
  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      
      if (session.mode === 'subscription') {
        const { userId, plan, billingCycle } = session.metadata;
        const subscriptionId = session.subscription;
        const customerId = session.customer;
        
        // Retrieve the subscription from Stripe to get more details
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        
        // Calculate expiration date based on billing cycle
        const now = new Date();
        const currentPeriodEnd = new Date(subscription.current_period_end * 1000);
        
        // Update the user's subscription in the database
        const { error } = await supabase
          .from('subscriptions')
          .upsert({
            user_id: userId,
            plan,
            status: 'active',
            billing_cycle: billingCycle,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            current_period_starts_at: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_ends_at: currentPeriodEnd.toISOString(),
            updated_at: now.toISOString()
          });
          
        if (error) {
          console.error('Error updating subscription in database:', error);
        }
      }
      break;
    }
    
    case 'invoice.payment_succeeded': {
      const invoice = event.data.object;
      
      // Only process subscription invoices
      if (invoice.subscription) {
        // Get the subscription from Stripe
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
        
        // Get the customer ID
        const customerId = invoice.customer;
        
        // Find the user by Stripe customer ID
        const { data: subscriptionData, error } = await supabase
          .from('subscriptions')
          .select('user_id, plan, billing_cycle')
          .eq('stripe_customer_id', customerId)
          .single();
          
        if (error) {
          console.error('Error finding user subscription:', error);
          break;
        }
        
        // Update the subscription period dates
        await supabase
          .from('subscriptions')
          .update({
            status: 'active',
            current_period_starts_at: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_ends_at: new Date(subscription.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('stripe_customer_id', customerId);
      }
      break;
    }
    
    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      
      // Get the customer ID
      const customerId = invoice.customer;
      
      // Find the user by Stripe customer ID
      const { data: subscriptionData, error } = await supabase
        .from('subscriptions')
        .select('user_id')
        .eq('stripe_customer_id', customerId)
        .single();
        
      if (error) {
        console.error('Error finding user subscription:', error);
        break;
      }
      
      // Update the subscription status
      await supabase
        .from('subscriptions')
        .update({
          status: 'past_due',
          updated_at: new Date().toISOString()
        })
        .eq('stripe_customer_id', customerId);
      
      break;
    }
    
    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      
      // Get the customer ID
      const customerId = subscription.customer;
      
      // Update the subscription status in the database
      await supabase
        .from('subscriptions')
        .update({
          status: 'canceled',
          updated_at: new Date().toISOString()
        })
        .eq('stripe_customer_id', customerId)
        .eq('stripe_subscription_id', subscription.id);
      
      break;
    }
    
    default:
      // Unexpected event type
      console.log(`Unhandled event type ${event.type}`);
  }
  
  return NextResponse.json({ received: true });
}