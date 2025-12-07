// src/app/api/update-subscription/route.js
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabaseClient';

// Valid plans and billing cycles
const VALID_PLANS = ['basic', 'premium', 'fleet'];
const VALID_BILLING_CYCLES = ['monthly', 'yearly'];

export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, newPlan, newBillingCycle, couponCode } = body;

    // Validate required fields
    if (!userId || !newPlan) {
      return NextResponse.json({
        error: 'Missing required fields: userId and newPlan are required'
      }, { status: 400 });
    }

    // Input validation
    if (!VALID_PLANS.includes(newPlan)) {
      return NextResponse.json({
        error: 'Invalid plan. Must be basic, premium, or fleet.'
      }, { status: 400 });
    }

    if (newBillingCycle && !VALID_BILLING_CYCLES.includes(newBillingCycle)) {
      return NextResponse.json({
        error: 'Invalid billing cycle. Must be monthly or yearly.'
      }, { status: 400 });
    }

    // Validate userId format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      return NextResponse.json({
        error: 'Invalid user ID format.'
      }, { status: 400 });
    }

    // Initialize Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    // Get user's current subscription from database
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (subError || !subscription) {
      return NextResponse.json({
        error: 'No active subscription found'
      }, { status: 404 });
    }

    // Ensure user has an active Stripe subscription
    if (!subscription.stripe_subscription_id) {
      return NextResponse.json({
        error: 'No Stripe subscription ID found. Please contact support.'
      }, { status: 400 });
    }

    // Get the current subscription from Stripe
    const stripeSubscription = await stripe.subscriptions.retrieve(
      subscription.stripe_subscription_id
    );

    if (!stripeSubscription || stripeSubscription.status === 'canceled') {
      return NextResponse.json({
        error: 'Subscription is not active. Please create a new subscription.'
      }, { status: 400 });
    }

    // Get the current subscription item ID
    const subscriptionItemId = stripeSubscription.items.data[0]?.id;
    if (!subscriptionItemId) {
      return NextResponse.json({
        error: 'Could not find subscription item'
      }, { status: 400 });
    }

    // Determine billing cycle (use new one if provided, otherwise keep current)
    const billingCycle = newBillingCycle || subscription.billing_cycle || 'monthly';

    // Map plan and billing cycle to Stripe price IDs
    const priceIds = {
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

    // Check if we have actual price IDs or need to use price_data
    const newPriceId = priceIds[newPlan]?.[billingCycle];
    const useTestPriceData = !newPriceId;

    // Pricing in cents (monthly equivalent for comparison)
    const pricing = {
      basic: { monthly: 2000, yearly: 19200 },
      premium: { monthly: 3500, yearly: 33600 },
      fleet: { monthly: 7500, yearly: 72000 }
    };

    // Monthly equivalent prices for comparison (yearly plans have 20% discount)
    const monthlyEquivalent = {
      basic: { monthly: 2000, yearly: 1600 },    // $20/mo vs $16/mo
      premium: { monthly: 3500, yearly: 2800 },  // $35/mo vs $28/mo
      fleet: { monthly: 7500, yearly: 6000 }     // $75/mo vs $60/mo
    };

    // Determine if this is an upgrade or downgrade using VALUE-BASED comparison
    const planOrder = ['basic', 'premium', 'fleet'];
    const oldPlanIndex = planOrder.indexOf(subscription.plan);
    const newPlanIndex = planOrder.indexOf(newPlan);
    const currentBillingCycle = subscription.billing_cycle || 'monthly';

    // Calculate current and new monthly costs for accurate comparison
    const currentMonthlyValue = pricing[subscription.plan]?.[currentBillingCycle] || 0;
    const newMonthlyValue = pricing[newPlan]?.[billingCycle] || 0;

    // Calculate remaining value in current subscription for proration
    const now = Math.floor(Date.now() / 1000);
    const periodEnd = stripeSubscription.current_period_end;
    const periodStart = stripeSubscription.current_period_start;
    const totalPeriodDays = Math.ceil((periodEnd - periodStart) / 86400);
    const daysRemaining = Math.max(0, Math.ceil((periodEnd - now) / 86400));
    const percentRemaining = daysRemaining / totalPeriodDays;

    // Determine change type using comprehensive logic:
    // 1. Higher plan tier = always upgrade (immediate)
    // 2. Lower plan tier = always downgrade (at period end)
    // 3. Same plan, monthly→yearly = upgrade (immediate, better value)
    // 4. Same plan, yearly→monthly = downgrade (at period end)
    // 5. Cross-scenario (e.g., Premium Monthly → Basic Yearly):
    //    - If new total cost > remaining current value = immediate upgrade
    //    - Otherwise = downgrade at period end
    let changeType;
    let crossScenarioDetails = null;

    if (newPlan === subscription.plan && billingCycle === currentBillingCycle) {
      // Same plan, same billing cycle - no change needed
      return NextResponse.json({
        error: 'You are already on this plan with this billing cycle'
      }, { status: 400 });
    }

    if (newPlanIndex > oldPlanIndex) {
      // Moving to higher tier = always upgrade
      changeType = 'upgrade';
    } else if (newPlanIndex < oldPlanIndex) {
      // Moving to lower tier - check if billing cycle change makes it complex
      if (currentBillingCycle === 'monthly' && billingCycle === 'yearly') {
        // Cross-scenario: Plan downgrade but switching to yearly (e.g., Premium Monthly → Basic Yearly)
        // Calculate if the yearly price exceeds remaining value in current subscription
        const remainingCurrentValue = currentMonthlyValue * percentRemaining;
        const newYearlyPrice = pricing[newPlan].yearly;

        crossScenarioDetails = {
          type: 'plan_downgrade_cycle_upgrade',
          remainingValue: remainingCurrentValue / 100,
          newPrice: newYearlyPrice / 100,
          requiresPayment: newYearlyPrice > remainingCurrentValue
        };

        // If new yearly price > remaining value, treat as upgrade (immediate with charge)
        // Otherwise, schedule for period end
        changeType = newYearlyPrice > remainingCurrentValue ? 'upgrade' : 'downgrade';
      } else {
        // Standard downgrade (same or monthly cycle)
        changeType = 'downgrade';
      }
    } else {
      // Same plan, different billing cycle
      changeType = billingCycle === 'yearly' ? 'upgrade' : 'downgrade';
    }

    let updatedSubscription;
    let priceIdToUse = newPriceId;

    // If we don't have a price ID, create one
    if (!priceIdToUse) {
      // For test mode without actual price IDs, we need to create a new price
      const products = await stripe.products.list({ limit: 100 });
      let product = products.data.find(p =>
        p.name.toLowerCase().includes(newPlan) && p.active
      );

      if (!product) {
        // Create the product if it doesn't exist
        product = await stripe.products.create({
          name: `${newPlan.charAt(0).toUpperCase() + newPlan.slice(1)} Plan`,
          description: `Truck Command ${newPlan.charAt(0).toUpperCase() + newPlan.slice(1)} subscription`,
          metadata: { plan_id: newPlan }
        });
      }

      // Create a new price for this product
      const newPrice = await stripe.prices.create({
        product: product.id,
        unit_amount: pricing[newPlan][billingCycle],
        currency: 'usd',
        recurring: {
          interval: billingCycle === 'yearly' ? 'year' : 'month'
        },
        metadata: { plan: newPlan, billing_cycle: billingCycle }
      });

      priceIdToUse = newPrice.id;
    }

    // Check if subscription was previously set to cancel at period end
    const wasCanceled = stripeSubscription.cancel_at_period_end;

    if (changeType === 'downgrade') {
      // For DOWNGRADES: Do NOT update Stripe subscription items immediately
      // Only store the scheduled change in Supabase - the actual Stripe update
      // happens when the subscription renews via the invoice.paid webhook
      // This ensures no immediate charge - the new price only takes effect at renewal

      // Get the current subscription (no changes made to Stripe)
      updatedSubscription = stripeSubscription;

      // If subscription was set to cancel at period end, clear that in Stripe
      if (wasCanceled) {
        updatedSubscription = await stripe.subscriptions.update(
          subscription.stripe_subscription_id,
          {
            cancel_at_period_end: false,
            metadata: {
              ...stripeSubscription.metadata,
              scheduled_downgrade: 'true',
              scheduled_plan: newPlan,
              scheduled_billing_cycle: billingCycle,
              scheduled_price_id: priceIdToUse
            }
          }
        );
      } else {
        // Just update the metadata to track the scheduled change
        updatedSubscription = await stripe.subscriptions.update(
          subscription.stripe_subscription_id,
          {
            metadata: {
              ...stripeSubscription.metadata,
              scheduled_downgrade: 'true',
              scheduled_plan: newPlan,
              scheduled_billing_cycle: billingCycle,
              scheduled_price_id: priceIdToUse
            }
          }
        );
      }

      // Store the scheduled downgrade info in Supabase
      // User retains access to current features until the billing period ends
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          scheduled_plan: newPlan,
          scheduled_billing_cycle: billingCycle,
          scheduled_amount: Math.round(pricing[newPlan][billingCycle]) / 100, // Store scheduled amount in dollars
          cancel_at_period_end: false, // Clear cancellation
          canceled_at: null, // Clear canceled timestamp
          updated_at: new Date().toISOString()
          // NOTE: We do NOT update the 'plan' field here - user keeps current plan
        })
        .eq('user_id', userId);

      if (updateError) {
        console.error('Error storing scheduled downgrade:', updateError);
      }

    } else {
      // For UPGRADES: Apply immediately with proration
      const updateParams = {
        items: [{
          id: subscriptionItemId,
          price: priceIdToUse
        }],
        proration_behavior: 'create_prorations', // Charge the difference immediately
        cancel_at_period_end: false, // Clear any pending cancellation
        metadata: {
          plan: newPlan,
          billingCycle: billingCycle
        }
      };

      // Apply coupon if provided
      let appliedCoupon = null;
      if (couponCode) {
        try {
          // Try exact match first, then uppercase
          let coupon;
          try {
            coupon = await stripe.coupons.retrieve(couponCode.trim());
          } catch (exactErr) {
            if (exactErr.code === 'resource_missing') {
              coupon = await stripe.coupons.retrieve(couponCode.trim().toUpperCase());
            } else {
              throw exactErr;
            }
          }

          if (coupon && coupon.valid) {
            updateParams.coupon = coupon.id;
            appliedCoupon = {
              id: coupon.id,
              name: coupon.name,
              percentOff: coupon.percent_off,
              amountOff: coupon.amount_off ? coupon.amount_off / 100 : null,
              duration: coupon.duration
            };
          }
        } catch (couponError) {
          console.log('Coupon not found or invalid:', couponCode);
          // Continue without coupon - don't fail the upgrade
        }
      }

      updatedSubscription = await stripe.subscriptions.update(
        subscription.stripe_subscription_id,
        updateParams
      );

      // For upgrades, update the database immediately so user gets access right away
      // Also clear cancellation flags if they were set
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          plan: newPlan,
          billing_cycle: billingCycle,
          amount: Math.round(pricing[newPlan][billingCycle]) / 100, // Store in dollars
          scheduled_plan: null, // Clear any scheduled changes
          scheduled_billing_cycle: null,
          cancel_at_period_end: false, // Clear cancellation
          canceled_at: null, // Clear canceled timestamp
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (updateError) {
        console.error('Error updating subscription in database:', updateError);
      }
    }

    // Log if we cleared a cancellation
    if (wasCanceled) {
      console.log(`Cleared pending cancellation for user ${userId} during ${changeType}`);
    }

    const currentPeriodEnd = new Date(updatedSubscription.current_period_end * 1000);

    // Build the response message
    let message;
    const cancellationCleared = wasCanceled ? ' Your pending cancellation has been removed.' : '';
    const isBillingCycleChange = newPlan === subscription.plan && billingCycle !== currentBillingCycle;

    if (changeType === 'upgrade') {
      if (isBillingCycleChange) {
        message = `Your billing has been switched to ${billingCycle}! You're now saving 20% with annual billing.${cancellationCleared}`;
      } else {
        message = `Your plan has been upgraded to ${newPlan.charAt(0).toUpperCase() + newPlan.slice(1)}! You now have access to all new features.${cancellationCleared}`;
      }
    } else if (changeType === 'downgrade') {
      if (isBillingCycleChange) {
        message = `Your billing will switch to ${billingCycle} on ${currentPeriodEnd.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.${cancellationCleared}`;
      } else {
        message = `Your plan will change to ${newPlan.charAt(0).toUpperCase() + newPlan.slice(1)} on ${currentPeriodEnd.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}. You'll keep your current features until then.${cancellationCleared}`;
      }
    } else {
      message = `Your subscription has been updated.${cancellationCleared}`;
    }

    return NextResponse.json({
      success: true,
      changeType,
      cancellationCleared: wasCanceled,
      crossScenario: crossScenarioDetails,
      subscription: {
        plan: changeType === 'downgrade' ? subscription.plan : newPlan, // Return current plan for downgrades
        scheduledPlan: changeType === 'downgrade' ? newPlan : null,
        scheduledBillingCycle: changeType === 'downgrade' ? billingCycle : null,
        billingCycle: changeType === 'downgrade' ? currentBillingCycle : billingCycle,
        status: updatedSubscription.status,
        currentPeriodEnd: currentPeriodEnd.toISOString(),
        daysRemaining: daysRemaining
      },
      message
    });

  } catch (error) {
    console.error('Error updating subscription:', error);
    return NextResponse.json({
      error: error.message || 'Failed to update subscription'
    }, { status: 500 });
  }
}
