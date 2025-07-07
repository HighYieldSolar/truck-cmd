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
      // Map Stripe price IDs to plan names
      const priceIdToPlanMap = {
        [process.env.STRIPE_BASIC_MONTHLY_PRICE_ID]: 'basic',
        [process.env.STRIPE_BASIC_YEARLY_PRICE_ID]: 'basic',
        [process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID]: 'premium',
        [process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID]: 'premium',
        [process.env.STRIPE_FLEET_MONTHLY_PRICE_ID]: 'fleet',
        [process.env.STRIPE_FLEET_YEARLY_PRICE_ID]: 'fleet'
      };

      planId = priceIdToPlanMap[priceId];

      if (!planId) {
        // If not found in mapping, try to retrieve from Stripe
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
        const price = await stripe.prices.retrieve(priceId, {
          expand: ['product']
        });

        // Get plan name from product metadata or name
        const product = price.product;
        if (product && typeof product !== 'string') {
          planId = product.metadata?.plan_id || product.name?.toLowerCase()?.replace(/\s+(plan|subscription)/gi, '').trim() || 'premium';
          console.log(`Mapped to plan from product: ${planId}`);
        }
      } else {
        console.log(`Mapped to plan from price ID: ${planId}`);
      }
    }
  } catch (error) {
    console.error(`Error getting plan info: ${error.message}`);
    // Default to premium plan if we can't determine it
    planId = 'premium';
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
    current_period_starts_at: new Date(subscription.current_period_start * 1000).toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end || false,
    updated_at: new Date().toISOString()
  };

  // Add plan and billing cycle if we have them
  if (planId) updateData.plan = planId;
  if (billingCycle) updateData.billing_cycle = billingCycle;

  // Add amount if available
  if (subscription.items.data[0]?.price?.unit_amount) {
    updateData.amount = subscription.items.data[0].price.unit_amount / 100; // Convert from cents to dollars
  }

  // Clear trial_ends_at if subscription is active (no longer in trial)
  if (status === 'active') {
    updateData.trial_ends_at = null;
  }

  // If subscription is canceled, set canceled_at
  if (subscription.canceled_at) {
    updateData.canceled_at = new Date(subscription.canceled_at * 1000).toISOString();
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
  const sessionId = session.id;

  // Extract string IDs from objects (Stripe sometimes returns full objects)
  const customerIdString = typeof stripeCustomerId === 'string' ? stripeCustomerId : stripeCustomerId?.id;
  const subscriptionIdString = typeof subscriptionId === 'string' ? subscriptionId : subscriptionId?.id;

  console.log(`Checkout completed for user ${userId}, customer ${customerIdString}, subscription ${subscriptionIdString}`);

  // If we don't have a userId, we need to handle that case
  if (!userId) {
    console.log('No user ID found in session, cannot update subscription');
    return;
  }

  // Check if this session has already been processed by the success page
  try {
    const { data: processedSession, error: processedError } = await supabase
      .from('processed_sessions')
      .select('id')
      .eq('idempotency_key', `${userId}_${sessionId}`)
      .single();

    if (processedSession) {
      console.log(`Session ${sessionId} already processed by success page, skipping webhook processing`);
      return;
    }

    if (processedError && processedError.code !== 'PGRST116') {
      console.error('Error checking processed sessions:', processedError);
      // Continue processing in case of error
    }
  } catch (err) {
    console.log('Could not check processed sessions table, continuing with webhook processing');
  }

  // Update the user's Stripe customer ID
  await updateUserStripeInfo(userId, customerIdString);

  // Now retrieve the subscription from Stripe to get its current status
  try {
    console.log(`Retrieving subscription ${subscriptionIdString} from Stripe`);
    const subscription = await stripe.subscriptions.retrieve(subscriptionIdString);
    const status = subscription.status;
    const currentPeriodStart = new Date(subscription.current_period_start * 1000).toISOString();
    const currentPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString();

    console.log(`Subscription status from Stripe: ${status}`);

    // Calculate amount based on plan and billing cycle
    const calculateAmount = (plan, billingCycle) => {
      const pricing = {
        basic: { monthly: 2000, yearly: 1600 },
        premium: { monthly: 3500, yearly: 2800 },
        fleet: { monthly: 7500, yearly: 6000 }
      };
      return pricing[plan]?.[billingCycle] || pricing.premium[billingCycle] || 3500;
    };

    // Update subscription with complete information
    const { data: existingSubscriptions, error: queryError } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("user_id", userId);

    if (queryError) {
      console.error(`Error querying subscriptions: ${queryError.message}`);
      throw queryError;
    }

    if (existingSubscriptions && existingSubscriptions.length > 0) {
      // Find the latest subscription to update
      const { data: latestSub, error: latestError } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("user_id", userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (latestError) {
        console.error(`Error finding latest subscription: ${latestError.message}`);
        throw latestError;
      }

      // Update only the latest subscription
      const { error: subError } = await supabase
        .from("subscriptions")
        .update({
          status: status,
          stripe_subscription_id: subscriptionIdString,
          stripe_customer_id: customerIdString,
          plan: plan,
          billing_cycle: billingCycle,
          amount: calculateAmount(plan, billingCycle),
          current_period_starts_at: currentPeriodStart,
          current_period_ends_at: currentPeriodEnd,
          trial_ends_at: null,
          updated_at: new Date().toISOString()
        })
        .eq("id", latestSub.id);

      if (subError) {
        console.error(`Error updating subscription in database: ${subError.message}`);
        throw subError;
      }

      // Clean up any duplicates if needed
      if (existingSubscriptions.length > 1) {
        const duplicateIds = existingSubscriptions
          .map(sub => sub.id)
          .filter(id => id !== latestSub.id);

        console.log(`Cleaning up ${duplicateIds.length} duplicate subscription records`);

        const { error: deleteError } = await supabase
          .from("subscriptions")
          .delete()
          .in('id', duplicateIds);

        if (deleteError) {
          console.warn('Warning: Could not clean up duplicate subscriptions:', deleteError.message);
        } else {
          console.log(`Successfully removed ${duplicateIds.length} duplicate subscription records`);
        }
      }
    } else {
      // No existing subscriptions, create a new one
      const { error: insertError } = await supabase
        .from("subscriptions")
        .insert({
          user_id: userId,
          status: status,
          stripe_subscription_id: subscriptionIdString,
          stripe_customer_id: customerIdString,
          plan: plan,
          billing_cycle: billingCycle,
          amount: calculateAmount(plan, billingCycle),
          current_period_starts_at: currentPeriodStart,
          current_period_ends_at: currentPeriodEnd,
          trial_ends_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (insertError) {
        console.error(`Error creating subscription in database: ${insertError.message}`);
        throw insertError;
      }
    }

    console.log(`✅ Successfully updated subscription status to ${status} for user ${userId} via webhook`);

    // Mark this session as processed to prevent duplicate processing
    try {
      await supabase
        .from('processed_sessions')
        .insert([{
          idempotency_key: `${userId}_${sessionId}`,
          user_id: userId,
          session_id: sessionId,
          processed_at: new Date().toISOString()
        }]);
    } catch (err) {
      console.log('Could not mark session as processed:', err);
    }

  } catch (error) {
    console.error(`Error retrieving subscription from Stripe: ${error.message}`);

    // If we can't get the subscription from Stripe, still try to update our database
    // with the information we have from the checkout session
    const { error: updateError } = await supabase
      .from("subscriptions")
      .update({
        status: "active", // Default to active if we can't get status from Stripe
        stripe_subscription_id: subscriptionIdString,
        stripe_customer_id: customerIdString,
        plan: plan,
        billing_cycle: billingCycle,
        trial_ends_at: null,
        updated_at: new Date().toISOString()
      })
      .eq("user_id", userId);

    if (updateError) {
      console.error(`Error updating subscription in database: ${updateError.message}`);
    } else {
      console.log(`✅ Successfully updated subscription status to active for user ${userId} (webhook fallback)`);
    }
  }
}

/**
 * Update user with Stripe customer info
 */
async function updateUserStripeInfo(userId, stripeCustomerId) {
  console.log(`Updating user ${userId} with Stripe customer ID ${stripeCustomerId}`);

  // First check if the user has subscription records
  const { data: subData, error: subError } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .order('created_at', { ascending: false });

  if (subError) {
    console.error(`Error checking for subscription: ${subError.message}`);
    return { error: subError };
  }

  // If we found any subscriptions, update the most recent one with the customer ID
  if (subData && subData.length > 0) {
    const latestSubscription = subData[0]; // Get the most recent subscription

    const { error: updateError } = await supabase
      .from("subscriptions")
      .update({
        stripe_customer_id: stripeCustomerId,
        updated_at: new Date().toISOString()
      })
      .eq("id", latestSubscription.id);

    if (updateError) {
      console.error(`Error updating subscription with customer ID: ${updateError.message}`);
      return { error: updateError };
    }

    // Clean up any duplicate subscriptions if they exist
    if (subData.length > 1) {
      const duplicateIds = subData.slice(1).map(sub => sub.id);
      console.log(`Cleaning up ${duplicateIds.length} older subscription records`);

      const { error: deleteError } = await supabase
        .from("subscriptions")
        .delete()
        .in('id', duplicateIds);

      if (deleteError) {
        console.warn('Warning: Could not clean up older subscriptions:', deleteError.message);
      } else {
        console.log(`Successfully removed ${duplicateIds.length} older subscription records`);
      }
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