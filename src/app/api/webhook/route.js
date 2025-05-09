// src/app/api/webhook/route.js
import { headers } from "next/headers";
import Stripe from "stripe";
import { supabase } from "@/lib/supabaseClient";

export async function POST(req) {
  const body = await req.text();
  const signature = headers().get("Stripe-Signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  // Initialize Stripe
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  
  console.log("Webhook received, verifying signature...");
  
  let event;
  try {
    if (!signature || !webhookSecret) {
      console.error("Missing signature or webhook secret");
      return new Response("Webhook Error: Missing signature or secret", { status: 400 });
    }

    // Verify the event
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    console.log(`✅ Verified webhook event: ${event.type}`);
    
  } catch (err) {
    console.error(`❌ Webhook Verification Error:`, err);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // Process the event based on type
  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionUpdate(event);
        break;
        
      case "customer.subscription.deleted":
        await handleSubscriptionCancellation(event);
        break;
        
      case "checkout.session.completed":
        await handleCheckoutCompleted(event, stripe);
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
    
    return new Response(JSON.stringify({ received: true }));
  } catch (error) {
    console.error(`Error processing webhook: ${error.message}`);
    return new Response(`Webhook processing error: ${error.message}`, { status: 500 });
  }
}

/**
 * Handle subscription created or updated events
 */
async function handleSubscriptionUpdate(event) {
  console.log("Processing subscription update...");
  
  const subscription = event.data.object;
  const subscriptionId = subscription.id;
  const stripeCustomerId = subscription.customer;
  const status = subscription.status;
  const currentPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString();
  
  console.log(`Subscription: ${subscriptionId}, Customer: ${stripeCustomerId}, Status: ${status}`);
  
  // Get plan info from the subscription items
  let planId = null;
  let billingCycle = subscription.items.data[0]?.price?.recurring?.interval === 'year' ? 'yearly' : 'monthly';
  
  try {
    // Get the product ID from the subscription
    const priceId = subscription.items.data[0]?.price?.id;
    
    if (priceId) {
      // You might need to map Stripe price IDs to your plan names
      // For demonstration, let's retrieve the product from Stripe
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      const price = await stripe.prices.retrieve(priceId, {
        expand: ['product']
      });
      
      // Get plan name from product metadata or name
      const product = price.product;
      if (product && typeof product !== 'string') {
        planId = product.metadata?.plan_id || product.name?.toLowerCase()?.replace(/\s+/g, '_') || 'default_plan';
        console.log(`Mapped to plan: ${planId}`);
      }
    }
  } catch (error) {
    console.error(`Error getting plan info: ${error.message}`);
    // Default to a plan if we can't determine it
    planId = 'default_plan';
  }
  
  // Find the user in Supabase
  console.log(`Looking up user with Stripe customer ID: ${stripeCustomerId}`);
  
  // First try to find the user in the users table
  let { data: userData, error: userError } = await supabase
    .from("users")
    .select("id")
    .eq("stripe_customer_id", stripeCustomerId)
    .single();
  
  // If not found in users table, try the subscriptions table
  if (userError) {
    console.log(`User not found in users table, checking subscriptions table...`);
    const { data: subData, error: subError } = await supabase
      .from("subscriptions")
      .select("user_id")
      .eq("stripe_customer_id", stripeCustomerId)
      .single();
    
    if (subError) {
      console.error(`Could not find user for Stripe customer: ${stripeCustomerId}`);
      console.error(subError);
      throw new Error(`User not found for Stripe customer: ${stripeCustomerId}`);
    }
    
    userData = { id: subData.user_id };
  }
  
  const userId = userData.id;
  console.log(`Found user: ${userId}`);
  
  // Update the subscription in Supabase
  console.log(`Updating subscription for user ${userId} with status ${status}`);
  
  const updateData = {
    status: status,
    stripe_subscription_id: subscriptionId,
    stripe_customer_id: stripeCustomerId,
    current_period_ends_at: currentPeriodEnd,
    updated_at: new Date().toISOString()
  };
  
  // Add plan and billing cycle if we have them
  if (planId) updateData.plan = planId;
  if (billingCycle) updateData.billing_cycle = billingCycle;
  
  // Clear trial_ends_at if subscription is active (no longer in trial)
  if (status === 'active') {
    updateData.trial_ends_at = null;
  }
  
  const { error: updateError } = await supabase
    .from("subscriptions")
    .update(updateData)
    .eq("user_id", userId);
  
  if (updateError) {
    console.error(`Error updating subscription in database: ${updateError.message}`);
    throw updateError;
  }
  
  console.log(`✅ Successfully updated subscription for user ${userId}`);
}

/**
 * Handle subscription cancellation
 */
async function handleSubscriptionCancellation(event) {
  console.log("Processing subscription cancellation...");
  
  const subscription = event.data.object;
  const subscriptionId = subscription.id;
  const stripeCustomerId = subscription.customer;
  
  // Find the user in Supabase
  console.log(`Looking up user with Stripe customer ID: ${stripeCustomerId}`);
  
  let userId;
  
  // First try to find in users table
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("id")
    .eq("stripe_customer_id", stripeCustomerId)
    .single();
  
  if (userError) {
    // If not found, try the subscriptions table
    const { data: subData, error: subError } = await supabase
      .from("subscriptions")
      .select("user_id")
      .eq("stripe_customer_id", stripeCustomerId)
      .single();
    
    if (subError) {
      console.error(`Could not find user for Stripe customer: ${stripeCustomerId}`);
      console.error(subError);
      throw new Error(`User not found for Stripe customer: ${stripeCustomerId}`);
    }
    
    userId = subData.user_id;
  } else {
    userId = userData.id;
  }
  
  console.log(`Found user: ${userId}`);
  
  // Update the subscription to canceled status
  console.log(`Updating subscription for user ${userId} to canceled`);
  
  const { error: updateError } = await supabase
    .from("subscriptions")
    .update({
      status: "canceled",
      updated_at: new Date().toISOString()
    })
    .eq("user_id", userId);
  
  if (updateError) {
    console.error(`Error updating subscription in database: ${updateError.message}`);
    throw updateError;
  }
  
  console.log(`✅ Successfully marked subscription as canceled for user ${userId}`);
}

/**
 * Handle checkout completed event
 */
async function handleCheckoutCompleted(event, stripe) {
  console.log("Processing checkout completed...");
  
  const session = event.data.object;
  
  // Skip if not a subscription checkout
  if (session.mode !== 'subscription') {
    console.log('Not a subscription checkout, skipping');
    return;
  }
  
  const stripeCustomerId = session.customer;
  const subscriptionId = session.subscription; // Get the subscription ID directly from the session
  const userId = session.client_reference_id || session.metadata?.userId;
  const plan = session.metadata?.plan || 'premium';
  const billingCycle = session.metadata?.billingCycle || 'monthly';
  
  console.log(`Checkout completed for user ${userId}, customer ${stripeCustomerId}, subscription ${subscriptionId}`);
  
  // If we don't have a userId, we need to handle that case
  if (!userId) {
    console.log('No user ID found in session, cannot update subscription');
    return;
  }
  
  // Update the user's Stripe customer ID
  await updateUserStripeInfo(userId, stripeCustomerId);
  
  // Now retrieve the subscription from Stripe to get its current status
  try {
    console.log(`Retrieving subscription ${subscriptionId} from Stripe`);
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const status = subscription.status;
    const currentPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString();
    
    console.log(`Subscription status from Stripe: ${status}`);
    
    // IMPORTANT: Directly update the subscription to active status
    const { error: subError } = await supabase
      .from("subscriptions")
      .update({
        status: status, // Use the actual status from Stripe (should be "active")
        stripe_subscription_id: subscriptionId,
        stripe_customer_id: stripeCustomerId,
        plan: plan,
        billing_cycle: billingCycle,
        current_period_ends_at: currentPeriodEnd,
        trial_ends_at: null, // Clear trial end date when activating subscription
        updated_at: new Date().toISOString()
      })
      .eq("user_id", userId);
      
    if (subError) {
      console.error(`Error updating subscription in database: ${subError.message}`);
      throw subError;
    }
    
    console.log(`✅ Successfully updated subscription status to ${status} for user ${userId}`);
    
  } catch (error) {
    console.error(`Error retrieving subscription from Stripe: ${error.message}`);
    
    // If we can't get the subscription from Stripe, still try to update our database
    // with the information we have from the checkout session
    const { error: updateError } = await supabase
      .from("subscriptions")
      .update({
        status: "active", // Default to active if we can't get status from Stripe
        stripe_subscription_id: subscriptionId,
        stripe_customer_id: stripeCustomerId,
        plan: plan,
        billing_cycle: billingCycle,
        trial_ends_at: null,
        updated_at: new Date().toISOString()
      })
      .eq("user_id", userId);
      
    if (updateError) {
      console.error(`Error updating subscription in database: ${updateError.message}`);
    } else {
      console.log(`✅ Successfully updated subscription status to active for user ${userId} (fallback)`);
    }
  }
}

/**
 * Update user with Stripe customer info
 */
async function updateUserStripeInfo(userId, stripeCustomerId) {
  console.log(`Updating user ${userId} with Stripe customer ID ${stripeCustomerId}`);
  
  // First check if the user has a subscription record
  const { data: subData, error: subError } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .single();
  
  if (subError && subError.code !== 'PGRST116') { // PGRST116 = not found
    console.error(`Error checking for subscription: ${subError.message}`);
    return { error: subError };
  }
  
  // If we found a subscription, update it with the customer ID
  if (subData) {
    const { error: updateError } = await supabase
      .from("subscriptions")
      .update({
        stripe_customer_id: stripeCustomerId,
        updated_at: new Date().toISOString()
      })
      .eq("user_id", userId);
      
    if (updateError) {
      console.error(`Error updating subscription with customer ID: ${updateError.message}`);
      return { error: updateError };
    }
  } else {
    // Otherwise create a new subscription record
    const { error: insertError } = await supabase
      .from("subscriptions")
      .insert({
        user_id: userId,
        stripe_customer_id: stripeCustomerId,
        status: 'incomplete', // Will be updated by subscription events
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
    if (insertError) {
      console.error(`Error creating subscription record: ${insertError.message}`);
      return { error: insertError };
    }
  }
  
  // Also update the users table if you store stripe_customer_id there
  try {
    const { error: userUpdateError } = await supabase
      .from("users")
      .update({ 
        stripe_customer_id: stripeCustomerId,
        updated_at: new Date().toISOString() 
      })
      .eq("id", userId);
      
    if (userUpdateError) {
      console.log(`Note: Could not update users table: ${userUpdateError.message}`);
      // Not critical, as we already updated the subscriptions table
    }
  } catch (error) {
    console.log('Note: Users table might not have these columns, skipping update there');
  }
  
  console.log(`✅ Successfully updated Stripe customer info for user ${userId}`);
  return { error: null };
}