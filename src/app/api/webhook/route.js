// src/app/api/webhook/route.js
import { headers } from "next/headers";
import Stripe from "stripe";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";

// Enable verbose logging only in development
const DEBUG = process.env.NODE_ENV === 'development';
const log = (...args) => DEBUG && console.log(...args);

export async function POST(req) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get("Stripe-Signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  // Initialize Stripe
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  let event;
  try {
    if (!signature || !webhookSecret) {
      log("Webhook Error: Missing signature or secret");
      return new Response("Webhook Error: Missing signature or secret", { status: 400 });
    }

    // Verify the event
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    log(`Verified webhook event: ${event.type}`);

  } catch (err) {
    log(`Webhook Verification Error:`, err.message);
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

      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(event, stripe);
        break;

      // Note: invoice.paid is deprecated in favor of invoice.payment_succeeded
      // Keep minimal handler for backwards compatibility during transition
      case "invoice.paid":
        log(`Received deprecated invoice.paid event, use invoice.payment_succeeded instead`);
        break;

      case "subscription_schedule.completed":
        await handleSubscriptionScheduleCompleted(event, stripe);
        break;

      case "subscription_schedule.updated":
        log("Subscription schedule updated:", event.data.object.id);
        break;

      default:
        log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }));
  } catch (error) {
    log(`Error processing webhook: ${error.message}`);
    return new Response(`Webhook processing error: ${error.message}`, { status: 500 });
  }
}

/**
 * Handle subscription created or updated events
 */
async function handleSubscriptionUpdate(event) {
  const subscription = event.data.object;
  const subscriptionId = subscription.id;
  const stripeCustomerId = subscription.customer;
  const status = subscription.status;
  const currentPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString();

  log(`Subscription update: ${subscriptionId}, Status: ${status}`);

  // Get plan info from the subscription items
  // Handle subscriptions with no items or multiple items safely
  const subscriptionItems = subscription.items?.data || [];
  const primaryItem = subscriptionItems[0]; // Primary subscription item

  let planId = null;
  let billingCycle = primaryItem?.price?.recurring?.interval === 'year' ? 'yearly' : 'monthly';

  try {
    // Get the product ID from the subscription
    const priceId = primaryItem?.price?.id;

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
        }
      }
    }
  } catch (error) {
    log(`Error getting plan info: ${error.message}`);
    planId = 'premium';
  }

  // Find the user in Supabase
  let { data: userData, error: userError } = await supabase
    .from("users")
    .select("id")
    .eq("stripe_customer_id", stripeCustomerId)
    .single();

  // If not found in users table, try the subscriptions table
  if (userError) {
    const { data: subData, error: subError } = await supabase
      .from("subscriptions")
      .select("user_id")
      .eq("stripe_customer_id", stripeCustomerId)
      .single();

    if (subError) {
      log(`User not found for Stripe customer: ${stripeCustomerId}`);
      throw new Error(`User not found for Stripe customer: ${stripeCustomerId}`);
    }

    userData = { id: subData.user_id };
  }

  const userId = userData.id;

  // Update the subscription in Supabase
  const updateData = {
    status: status,
    stripe_subscription_id: subscriptionId,
    stripe_customer_id: stripeCustomerId,
    current_period_ends_at: currentPeriodEnd,
    current_period_starts_at: new Date(subscription.current_period_start * 1000).toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end || false,
    updated_at: new Date().toISOString()
  };

  if (planId) updateData.plan = planId;
  if (billingCycle) updateData.billing_cycle = billingCycle;

  if (primaryItem?.price?.unit_amount) {
    updateData.amount = Math.round(primaryItem.price.unit_amount) / 100;
  }

  // Check if scheduled change has taken effect
  if (!subscription.schedule) {
    const { data: currentSub } = await supabase
      .from("subscriptions")
      .select("scheduled_plan, scheduled_billing_cycle")
      .eq("user_id", userId)
      .single();

    if (currentSub?.scheduled_plan) {
      updateData.scheduled_plan = null;
      updateData.scheduled_billing_cycle = null;
      updateData.scheduled_amount = null;
    }
  }

  if (status === 'active') {
    updateData.trial_ends_at = null;
  }

  if (subscription.canceled_at) {
    updateData.canceled_at = new Date(subscription.canceled_at * 1000).toISOString();
  }

  const { error: updateError } = await supabase
    .from("subscriptions")
    .update(updateData)
    .eq("user_id", userId);

  if (updateError) {
    log(`Error updating subscription: ${updateError.message}`);
    throw updateError;
  }

  log(`Updated subscription for user ${userId}`);
}

/**
 * Handle subscription cancellation
 */
async function handleSubscriptionCancellation(event) {
  const subscription = event.data.object;
  const stripeCustomerId = subscription.customer;

  let userId;

  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("id")
    .eq("stripe_customer_id", stripeCustomerId)
    .single();

  if (userError) {
    const { data: subData, error: subError } = await supabase
      .from("subscriptions")
      .select("user_id")
      .eq("stripe_customer_id", stripeCustomerId)
      .single();

    if (subError) {
      log(`User not found for Stripe customer: ${stripeCustomerId}`);
      throw new Error(`User not found for Stripe customer: ${stripeCustomerId}`);
    }

    userId = subData.user_id;
  } else {
    userId = userData.id;
  }

  const { error: updateError } = await supabase
    .from("subscriptions")
    .update({
      status: "canceled",
      updated_at: new Date().toISOString()
    })
    .eq("user_id", userId);

  if (updateError) {
    log(`Error updating subscription: ${updateError.message}`);
    throw updateError;
  }

  log(`Subscription canceled for user ${userId}`);
}

/**
 * Handle checkout completed event
 */
async function handleCheckoutCompleted(event, stripe) {
  const session = event.data.object;

  if (session.mode !== 'subscription') {
    return;
  }

  const stripeCustomerId = session.customer;
  const subscriptionId = session.subscription;
  const userId = session.client_reference_id || session.metadata?.userId;
  const plan = session.metadata?.plan || 'premium';
  const billingCycle = session.metadata?.billingCycle || 'monthly';
  const sessionId = session.id;

  const customerIdString = typeof stripeCustomerId === 'string' ? stripeCustomerId : stripeCustomerId?.id;
  const subscriptionIdString = typeof subscriptionId === 'string' ? subscriptionId : subscriptionId?.id;

  if (!userId) {
    log('No user ID found in session');
    return;
  }

  // Check if already processed
  try {
    const { data: processedSession } = await supabase
      .from('processed_sessions')
      .select('id')
      .eq('idempotency_key', `${userId}_${sessionId}`)
      .single();

    if (processedSession) {
      log(`Session ${sessionId} already processed`);
      return;
    }
  } catch (err) {
    // Continue processing
  }

  await updateUserStripeInfo(userId, customerIdString);

  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionIdString);
    const status = subscription.status;
    const currentPeriodStart = new Date(subscription.current_period_start * 1000).toISOString();
    const currentPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString();

    const calculateAmount = (plan, billingCycle) => {
      const pricing = {
        basic: { monthly: 2000, yearly: 19200 },
        premium: { monthly: 3500, yearly: 33600 },
        fleet: { monthly: 7500, yearly: 72000 }
      };
      return pricing[plan]?.[billingCycle] || pricing.premium[billingCycle] || 3500;
    };

    const { data: existingSubscriptions, error: queryError } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("user_id", userId);

    if (queryError) throw queryError;

    if (existingSubscriptions && existingSubscriptions.length > 0) {
      const { data: latestSub, error: latestError } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("user_id", userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (latestError) throw latestError;

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

      if (subError) throw subError;

      // Clean up duplicates
      if (existingSubscriptions.length > 1) {
        const duplicateIds = existingSubscriptions
          .map(sub => sub.id)
          .filter(id => id !== latestSub.id);

        await supabase
          .from("subscriptions")
          .delete()
          .in('id', duplicateIds);
      }
    } else {
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

      if (insertError) throw insertError;
    }

    log(`Checkout completed for user ${userId}`);

    // Mark session as processed
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
      // Non-critical
    }

  } catch (error) {
    log(`Error retrieving subscription: ${error.message}`);

    // Fallback update
    await supabase
      .from("subscriptions")
      .update({
        status: "active",
        stripe_subscription_id: subscriptionIdString,
        stripe_customer_id: customerIdString,
        plan: plan,
        billing_cycle: billingCycle,
        trial_ends_at: null,
        updated_at: new Date().toISOString()
      })
      .eq("user_id", userId);
  }
}

/**
 * Update user with Stripe customer info
 */
async function updateUserStripeInfo(userId, stripeCustomerId) {
  const { data: subData, error: subError } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .order('created_at', { ascending: false });

  if (subError) {
    log(`Error checking subscription: ${subError.message}`);
    return { error: subError };
  }

  if (subData && subData.length > 0) {
    const latestSubscription = subData[0];

    const { error: updateError } = await supabase
      .from("subscriptions")
      .update({
        stripe_customer_id: stripeCustomerId,
        updated_at: new Date().toISOString()
      })
      .eq("id", latestSubscription.id);

    if (updateError) {
      log(`Error updating subscription: ${updateError.message}`);
      return { error: updateError };
    }

    // Clean up duplicates
    if (subData.length > 1) {
      const duplicateIds = subData.slice(1).map(sub => sub.id);
      await supabase
        .from("subscriptions")
        .delete()
        .in('id', duplicateIds);
    }
  } else {
    const { error: insertError } = await supabase
      .from("subscriptions")
      .insert({
        user_id: userId,
        stripe_customer_id: stripeCustomerId,
        status: 'incomplete',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (insertError) {
      log(`Error creating subscription: ${insertError.message}`);
      return { error: insertError };
    }
  }

  // Update users table
  try {
    await supabase
      .from("users")
      .update({
        stripe_customer_id: stripeCustomerId,
        updated_at: new Date().toISOString()
      })
      .eq("id", userId);
  } catch (error) {
    // Non-critical
  }

  return { error: null };
}

/**
 * Handle invoice payment succeeded event
 */
async function handleInvoicePaymentSucceeded(event, stripe) {
  const invoice = event.data.object;

  if (!invoice.subscription) {
    return;
  }

  const subscriptionId = typeof invoice.subscription === 'string'
    ? invoice.subscription
    : invoice.subscription?.id;
  const stripeCustomerId = typeof invoice.customer === 'string'
    ? invoice.customer
    : invoice.customer?.id;

  try {
    const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);

    let userId;
    let dbSubscription;

    const { data: subData, error: subError } = await supabase
      .from("subscriptions")
      .select("user_id, scheduled_plan, scheduled_billing_cycle, scheduled_amount")
      .eq("stripe_customer_id", stripeCustomerId)
      .single();

    if (!subError && subData) {
      userId = subData.user_id;
      dbSubscription = subData;
    } else {
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("stripe_customer_id", stripeCustomerId)
        .single();

      if (!userError && userData) {
        userId = userData.id;
        const { data: subDataById } = await supabase
          .from("subscriptions")
          .select("scheduled_plan, scheduled_billing_cycle, scheduled_amount")
          .eq("user_id", userId)
          .single();
        dbSubscription = subDataById;
      }
    }

    if (!userId) {
      userId = stripeSubscription.metadata?.userId;
    }

    if (!userId) {
      log("Could not find user for invoice payment");
      return;
    }

    // Check for scheduled downgrade
    const hasScheduledDowngrade = dbSubscription?.scheduled_plan ||
      stripeSubscription.metadata?.scheduled_downgrade === 'true';

    if (hasScheduledDowngrade) {
      const newPlan = dbSubscription?.scheduled_plan || stripeSubscription.metadata?.scheduled_plan;
      const newBillingCycle = dbSubscription?.scheduled_billing_cycle || stripeSubscription.metadata?.scheduled_billing_cycle;
      const scheduledPriceId = stripeSubscription.metadata?.scheduled_price_id;

      if (scheduledPriceId) {
        const stripeSubItems = stripeSubscription.items?.data || [];
        const subscriptionItemId = stripeSubItems[0]?.id;

        if (subscriptionItemId) {
          await stripe.subscriptions.update(subscriptionId, {
            items: [{
              id: subscriptionItemId,
              price: scheduledPriceId
            }],
            proration_behavior: 'none',
            metadata: {
              plan: newPlan,
              billingCycle: newBillingCycle,
              scheduled_downgrade: '',
              scheduled_plan: '',
              scheduled_billing_cycle: '',
              scheduled_price_id: ''
            }
          });
        }
      }

      const { error: updateError } = await supabase
        .from("subscriptions")
        .update({
          status: 'active',
          plan: newPlan,
          billing_cycle: newBillingCycle,
          amount: dbSubscription?.scheduled_amount || (Math.round(invoice.amount_paid) / 100),
          stripe_subscription_id: subscriptionId,
          stripe_customer_id: stripeCustomerId,
          current_period_starts_at: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
          current_period_ends_at: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
          scheduled_plan: null,
          scheduled_billing_cycle: null,
          scheduled_amount: null,
          trial_ends_at: null,
          updated_at: new Date().toISOString()
        })
        .eq("user_id", userId);

      if (updateError) throw updateError;

      log(`Applied scheduled downgrade for user ${userId}`);
      return;
    }

    // Normal payment processing
    const plan = stripeSubscription.metadata?.plan || 'premium';
    const invoiceSubItems = stripeSubscription.items?.data || [];
    const invoicePrimaryItem = invoiceSubItems[0];
    const billingCycle = stripeSubscription.metadata?.billingCycle ||
      (invoicePrimaryItem?.price?.recurring?.interval === 'year' ? 'yearly' : 'monthly');
    const amount = invoice.amount_paid || invoicePrimaryItem?.price?.unit_amount || 0;

    const { error: updateError } = await supabase
      .from("subscriptions")
      .update({
        status: stripeSubscription.status,
        stripe_subscription_id: subscriptionId,
        stripe_customer_id: stripeCustomerId,
        plan: plan,
        billing_cycle: billingCycle,
        amount: Math.round(amount) / 100,
        current_period_starts_at: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
        current_period_ends_at: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
        trial_ends_at: null,
        updated_at: new Date().toISOString()
      })
      .eq("user_id", userId);

    if (updateError) throw updateError;

    log(`Invoice payment succeeded for user ${userId}`);

  } catch (error) {
    log(`Error processing invoice payment: ${error.message}`);
    throw error;
  }
}

/**
 * Handle subscription schedule completed event
 */
async function handleSubscriptionScheduleCompleted(event, stripe) {
  const schedule = event.data.object;
  const subscriptionId = schedule.subscription;
  const stripeCustomerId = schedule.customer;

  const newPlan = schedule.metadata?.new_plan;
  const newBillingCycle = schedule.metadata?.new_billing_cycle;

  if (!newPlan) {
    return;
  }

  let userId;

  const { data: subData, error: subError } = await supabase
    .from("subscriptions")
    .select("user_id, scheduled_plan, scheduled_billing_cycle, scheduled_amount")
    .eq("stripe_subscription_id", subscriptionId)
    .single();

  if (!subError && subData) {
    userId = subData.user_id;
  } else {
    const { data: custData, error: custError } = await supabase
      .from("subscriptions")
      .select("user_id")
      .eq("stripe_customer_id", stripeCustomerId)
      .single();

    if (!custError && custData) {
      userId = custData.user_id;
    }
  }

  if (!userId) {
    log("Could not find user for schedule completion");
    return;
  }

  const pricing = {
    basic: { monthly: 20, yearly: 192 },
    premium: { monthly: 35, yearly: 336 },
    fleet: { monthly: 75, yearly: 720 }
  };

  const amount = pricing[newPlan]?.[newBillingCycle] || subData?.scheduled_amount;

  const { error: updateError } = await supabase
    .from("subscriptions")
    .update({
      plan: newPlan,
      billing_cycle: newBillingCycle,
      amount: amount,
      scheduled_plan: null,
      scheduled_billing_cycle: null,
      scheduled_amount: null,
      updated_at: new Date().toISOString()
    })
    .eq("user_id", userId);

  if (updateError) {
    log(`Error updating subscription: ${updateError.message}`);
    throw updateError;
  }

  log(`Schedule completed for user ${userId}`);
}
