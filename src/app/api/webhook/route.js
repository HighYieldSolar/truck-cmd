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

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event, stripe);
        break;

      case "customer.subscription.trial_will_end":
        await handleTrialWillEnd(event, stripe);
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
 * Helper function to normalize plan names to valid values
 */
function normalizePlanName(rawPlanName) {
  if (!rawPlanName) return 'premium';

  const planName = rawPlanName.toLowerCase().trim();

  // Check if it contains one of the valid plan names
  if (planName.includes('fleet')) return 'fleet';
  if (planName.includes('basic')) return 'basic';
  if (planName.includes('premium')) return 'premium';

  // Default to premium if no match
  return 'premium';
}

/**
 * Helper function to safely convert Unix timestamp to ISO string
 */
function safeTimestampToISO(timestamp) {
  if (!timestamp || typeof timestamp !== 'number') {
    return null;
  }
  try {
    return new Date(timestamp * 1000).toISOString();
  } catch (err) {
    log(`Error converting timestamp ${timestamp}:`, err.message);
    return null;
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

  // Safely get period dates - fall back to item-level dates if subscription-level not available
  const subscriptionItems = subscription.items?.data || [];
  const primaryItem = subscriptionItems[0];

  const currentPeriodEnd = safeTimestampToISO(subscription.current_period_end)
    || safeTimestampToISO(primaryItem?.current_period_end)
    || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // Fallback: 30 days from now

  const currentPeriodStart = safeTimestampToISO(subscription.current_period_start)
    || safeTimestampToISO(primaryItem?.current_period_start)
    || new Date().toISOString(); // Fallback: now

  log(`Subscription update: ${subscriptionId}, Status: ${status}`);

  // Get plan info from the subscription items
  // Note: subscriptionItems and primaryItem already defined above

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
          const rawPlan = product.metadata?.plan_id || product.name;
          planId = normalizePlanName(rawPlan);
        }
      }
    }
  } catch (error) {
    log(`Error getting plan info: ${error.message}`);
    planId = 'premium';
  }

  // Find the user in Supabase - try multiple lookup methods
  let userId = null;

  // Method 1: Check subscription metadata for userId (most reliable for new subscriptions)
  if (subscription.metadata?.userId) {
    userId = subscription.metadata.userId;
    log(`Found userId from subscription metadata: ${userId}`);
  }

  // Method 2: Try users table by stripe_customer_id
  if (!userId) {
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("stripe_customer_id", stripeCustomerId)
      .single();

    if (!userError && userData) {
      userId = userData.id;
      log(`Found userId from users table: ${userId}`);
    }
  }

  // Method 3: Try subscriptions table by stripe_customer_id
  if (!userId) {
    const { data: subData, error: subError } = await supabase
      .from("subscriptions")
      .select("user_id")
      .eq("stripe_customer_id", stripeCustomerId)
      .single();

    if (!subError && subData) {
      userId = subData.user_id;
      log(`Found userId from subscriptions table: ${userId}`);
    }
  }

  // Method 4: Try subscriptions table by stripe_subscription_id
  if (!userId) {
    const { data: subDataById, error: subByIdError } = await supabase
      .from("subscriptions")
      .select("user_id")
      .eq("stripe_subscription_id", subscriptionId)
      .single();

    if (!subByIdError && subDataById) {
      userId = subDataById.user_id;
      log(`Found userId from subscriptions table by subscription ID: ${userId}`);
    }
  }

  if (!userId) {
    log(`User not found for Stripe customer: ${stripeCustomerId}, subscription: ${subscriptionId}`);
    throw new Error(`User not found for Stripe customer: ${stripeCustomerId}`);
  }

  // IMPORTANT: Preserve trial status for users on active trials
  // When a user opens checkout but doesn't complete payment, Stripe creates an 'incomplete' subscription
  // We should NOT overwrite their trial status with 'incomplete' - they should keep their trial
  // Only update to the new status if:
  // 1. The new status is 'active' (payment succeeded)
  // 2. The user is not on a valid trial
  // 3. The new status is a terminal state like 'canceled', 'past_due', etc.

  // Check if user is currently on a valid trial
  const { data: currentSubData } = await supabase
    .from("subscriptions")
    .select("status, trial_ends_at")
    .eq("user_id", userId)
    .single();

  const isOnValidTrial = currentSubData?.status === 'trialing' &&
    currentSubData?.trial_ends_at &&
    new Date(currentSubData.trial_ends_at) > new Date();

  // If user is on a valid trial and the incoming status is 'incomplete', preserve their trial
  // Only update Stripe IDs, not the status
  if (isOnValidTrial && status === 'incomplete') {
    log(`User ${userId} is on valid trial - preserving trial status, only updating Stripe IDs`);

    const { error: updateError } = await supabase
      .from("subscriptions")
      .update({
        stripe_subscription_id: subscriptionId,
        stripe_customer_id: stripeCustomerId,
        updated_at: new Date().toISOString()
      })
      .eq("user_id", userId);

    if (updateError) {
      log(`Error updating subscription: ${updateError.message}`);
      throw updateError;
    }

    log(`Preserved trial status for user ${userId}, updated Stripe IDs only`);
    return; // Exit early - don't overwrite trial
  }

  // Update the subscription in Supabase
  const updateData = {
    status: status,
    stripe_subscription_id: subscriptionId,
    stripe_customer_id: stripeCustomerId,
    current_period_ends_at: currentPeriodEnd,
    current_period_starts_at: currentPeriodStart,
    cancel_at_period_end: subscription.cancel_at_period_end || false,
    updated_at: new Date().toISOString()
  };

  if (planId) updateData.plan = planId;
  if (billingCycle) updateData.billing_cycle = billingCycle;

  if (primaryItem?.price?.unit_amount) {
    updateData.amount = Math.round(primaryItem.price.unit_amount) / 100;
  }

  // Check for scheduled downgrade in metadata and save to database
  if (subscription.metadata?.scheduled_downgrade === 'true') {
    const scheduledPlan = subscription.metadata?.scheduled_plan;
    const scheduledBillingCycle = subscription.metadata?.scheduled_billing_cycle;

    if (scheduledPlan) {
      updateData.scheduled_plan = normalizePlanName(scheduledPlan);
      updateData.scheduled_billing_cycle = scheduledBillingCycle || 'monthly';

      // Calculate scheduled amount based on plan
      const pricing = {
        basic: { monthly: 20, yearly: 192 },
        premium: { monthly: 35, yearly: 336 },
        fleet: { monthly: 75, yearly: 720 }
      };
      const normalizedPlan = normalizePlanName(scheduledPlan);
      updateData.scheduled_amount = pricing[normalizedPlan]?.[scheduledBillingCycle || 'monthly'] || 20;

      log(`Saving scheduled downgrade to database: ${normalizedPlan}/${scheduledBillingCycle}`);
    }
  } else if (!subscription.schedule) {
    // No scheduled downgrade - check if we should clear any existing scheduled changes
    const { data: currentSub } = await supabase
      .from("subscriptions")
      .select("scheduled_plan, scheduled_billing_cycle")
      .eq("user_id", userId)
      .single();

    if (currentSub?.scheduled_plan && !subscription.metadata?.scheduled_downgrade) {
      // Only clear if there's no scheduled_downgrade metadata
      updateData.scheduled_plan = null;
      updateData.scheduled_billing_cycle = null;
      updateData.scheduled_amount = null;
      log(`Clearing scheduled downgrade for user ${userId}`);
    }
  }

  if (status === 'active') {
    updateData.trial_ends_at = null;
    // Clear cancellation fields when subscription becomes active (re-subscribe scenario)
    updateData.canceled_at = null;
  }

  if (subscription.canceled_at) {
    const canceledAtISO = safeTimestampToISO(subscription.canceled_at);
    if (canceledAtISO) {
      updateData.canceled_at = canceledAtISO;
    }
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
  const subscriptionId = subscription.id;

  // Find the user using multiple lookup methods
  let userId = null;

  // Method 1: Check subscription metadata for userId
  if (subscription.metadata?.userId) {
    userId = subscription.metadata.userId;
    log(`Found userId from subscription metadata: ${userId}`);
  }

  // Method 2: Try users table by stripe_customer_id
  if (!userId) {
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("stripe_customer_id", stripeCustomerId)
      .single();

    if (!userError && userData) {
      userId = userData.id;
      log(`Found userId from users table: ${userId}`);
    }
  }

  // Method 3: Try subscriptions table by stripe_customer_id
  if (!userId) {
    const { data: subData, error: subError } = await supabase
      .from("subscriptions")
      .select("user_id")
      .eq("stripe_customer_id", stripeCustomerId)
      .single();

    if (!subError && subData) {
      userId = subData.user_id;
      log(`Found userId from subscriptions table: ${userId}`);
    }
  }

  // Method 4: Try subscriptions table by stripe_subscription_id
  if (!userId) {
    const { data: subDataById, error: subByIdError } = await supabase
      .from("subscriptions")
      .select("user_id")
      .eq("stripe_subscription_id", subscriptionId)
      .single();

    if (!subByIdError && subDataById) {
      userId = subDataById.user_id;
      log(`Found userId from subscriptions table by subscription ID: ${userId}`);
    }
  }

  if (!userId) {
    log(`User not found for Stripe customer: ${stripeCustomerId}, subscription: ${subscriptionId}`);
    throw new Error(`User not found for Stripe customer: ${stripeCustomerId}`);
  }

  // Build cancellation update data
  const cancelData = {
    status: "canceled",
    cancel_at_period_end: false, // Already canceled, not pending
    updated_at: new Date().toISOString(),
    // Clear any scheduled changes since subscription is now canceled
    scheduled_plan: null,
    scheduled_billing_cycle: null,
    scheduled_amount: null
  };

  // Add canceled_at timestamp if available
  if (subscription.canceled_at) {
    const canceledAtISO = safeTimestampToISO(subscription.canceled_at);
    if (canceledAtISO) {
      cancelData.canceled_at = canceledAtISO;
    }
  } else {
    cancelData.canceled_at = new Date().toISOString();
  }

  const { error: updateError } = await supabase
    .from("subscriptions")
    .update(cancelData)
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
    const currentPeriodStart = safeTimestampToISO(subscription.current_period_start) || new Date().toISOString();
    const currentPeriodEnd = safeTimestampToISO(subscription.current_period_end) || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

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
      const rawNewPlan = dbSubscription?.scheduled_plan || stripeSubscription.metadata?.scheduled_plan;
      const newPlan = normalizePlanName(rawNewPlan);
      const newBillingCycle = dbSubscription?.scheduled_billing_cycle || stripeSubscription.metadata?.scheduled_billing_cycle || 'monthly';

      // Always use canonical price IDs from environment variables (not metadata)
      // This ensures we use the correct prices even if duplicate prices were previously stored
      const canonicalPriceIds = {
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

      const canonicalPriceId = canonicalPriceIds[newPlan]?.[newBillingCycle];

      if (canonicalPriceId) {
        const stripeSubItems = stripeSubscription.items?.data || [];
        const subscriptionItemId = stripeSubItems[0]?.id;

        if (subscriptionItemId) {
          await stripe.subscriptions.update(subscriptionId, {
            items: [{
              id: subscriptionItemId,
              price: canonicalPriceId
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
          log(`Applied scheduled downgrade with canonical price: ${canonicalPriceId}`);
        }
      } else {
        log(`Warning: No canonical price ID found for ${newPlan}/${newBillingCycle}`);
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
          current_period_starts_at: safeTimestampToISO(stripeSubscription.current_period_start) || new Date().toISOString(),
          current_period_ends_at: safeTimestampToISO(stripeSubscription.current_period_end) || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
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
    const rawPlan = stripeSubscription.metadata?.plan;
    const plan = normalizePlanName(rawPlan);
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
        current_period_starts_at: safeTimestampToISO(stripeSubscription.current_period_start) || new Date().toISOString(),
        current_period_ends_at: safeTimestampToISO(stripeSubscription.current_period_end) || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
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

  const rawNewPlan = schedule.metadata?.new_plan;
  const newBillingCycle = schedule.metadata?.new_billing_cycle;

  if (!rawNewPlan) {
    return;
  }

  const newPlan = normalizePlanName(rawNewPlan);

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

/**
 * Handle invoice payment failed event - dunning/failed payment recovery
 */
async function handleInvoicePaymentFailed(event, stripe) {
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
  const attemptCount = invoice.attempt_count || 1;
  const nextPaymentAttempt = invoice.next_payment_attempt;

  log(`Payment failed for subscription ${subscriptionId}, attempt ${attemptCount}`);

  // Find the user
  let userId = null;

  const { data: subData, error: subError } = await supabase
    .from("subscriptions")
    .select("user_id")
    .eq("stripe_customer_id", stripeCustomerId)
    .single();

  if (!subError && subData) {
    userId = subData.user_id;
  } else {
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("stripe_customer_id", stripeCustomerId)
      .single();

    if (!userError && userData) {
      userId = userData.id;
    }
  }

  if (!userId) {
    log("Could not find user for failed payment");
    return;
  }

  // Update subscription status to past_due
  const updateData = {
    status: 'past_due',
    payment_failed_at: new Date().toISOString(),
    payment_failure_count: attemptCount,
    updated_at: new Date().toISOString()
  };

  if (nextPaymentAttempt) {
    updateData.next_payment_retry_at = safeTimestampToISO(nextPaymentAttempt);
  }

  const { error: updateError } = await supabase
    .from("subscriptions")
    .update(updateData)
    .eq("user_id", userId);

  if (updateError) {
    log(`Error updating subscription for failed payment: ${updateError.message}`);
    throw updateError;
  }

  // Create a notification for the user
  try {
    await supabase
      .from("notifications")
      .insert({
        user_id: userId,
        type: 'payment_failed',
        title: 'Payment Failed',
        message: `We couldn't process your payment. Please update your payment method to avoid service interruption.`,
        data: {
          attempt_count: attemptCount,
          next_retry: nextPaymentAttempt ? safeTimestampToISO(nextPaymentAttempt) : null,
          invoice_id: invoice.id
        },
        read: false,
        created_at: new Date().toISOString()
      });
  } catch (notifError) {
    log(`Error creating payment failed notification: ${notifError.message}`);
    // Non-critical, continue
  }

  log(`Processed failed payment for user ${userId}, attempt ${attemptCount}`);
}

/**
 * Handle trial will end event - notify user 3 days before trial ends
 */
async function handleTrialWillEnd(event, stripe) {
  const subscription = event.data.object;
  const subscriptionId = subscription.id;
  const stripeCustomerId = subscription.customer;
  const trialEnd = subscription.trial_end;

  log(`Trial ending soon for subscription ${subscriptionId}`);

  // Find the user
  let userId = null;

  // Check metadata first
  if (subscription.metadata?.userId) {
    userId = subscription.metadata.userId;
  }

  if (!userId) {
    const { data: subData, error: subError } = await supabase
      .from("subscriptions")
      .select("user_id")
      .eq("stripe_customer_id", stripeCustomerId)
      .single();

    if (!subError && subData) {
      userId = subData.user_id;
    }
  }

  if (!userId) {
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("stripe_customer_id", stripeCustomerId)
      .single();

    if (!userError && userData) {
      userId = userData.id;
    }
  }

  if (!userId) {
    log("Could not find user for trial ending notification");
    return;
  }

  const trialEndDate = trialEnd ? new Date(trialEnd * 1000) : new Date();
  const formattedDate = trialEndDate.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  // Get plan info for the notification
  const subscriptionItems = subscription.items?.data || [];
  const primaryItem = subscriptionItems[0];
  const priceId = primaryItem?.price?.id;

  let planName = 'your plan';
  if (priceId) {
    const priceIdToPlanMap = {
      [process.env.STRIPE_BASIC_MONTHLY_PRICE_ID]: 'Basic',
      [process.env.STRIPE_BASIC_YEARLY_PRICE_ID]: 'Basic',
      [process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID]: 'Premium',
      [process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID]: 'Premium',
      [process.env.STRIPE_FLEET_MONTHLY_PRICE_ID]: 'Fleet',
      [process.env.STRIPE_FLEET_YEARLY_PRICE_ID]: 'Fleet'
    };
    planName = priceIdToPlanMap[priceId] || 'your plan';
  }

  // Create a notification for the user
  try {
    await supabase
      .from("notifications")
      .insert({
        user_id: userId,
        type: 'trial_ending',
        title: 'Your Trial Ends Soon',
        message: `Your free trial ends on ${formattedDate}. Add a payment method to continue using ${planName} without interruption.`,
        data: {
          trial_end: safeTimestampToISO(trialEnd),
          subscription_id: subscriptionId
        },
        read: false,
        created_at: new Date().toISOString()
      });
  } catch (notifError) {
    log(`Error creating trial ending notification: ${notifError.message}`);
    // Non-critical, continue
  }

  // Update subscription to mark that trial ending notification was sent
  try {
    await supabase
      .from("subscriptions")
      .update({
        trial_ending_notified_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq("user_id", userId);
  } catch (updateError) {
    log(`Error updating trial notification status: ${updateError.message}`);
  }

  log(`Sent trial ending notification to user ${userId}`);
}
