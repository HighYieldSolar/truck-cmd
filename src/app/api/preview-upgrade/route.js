// src/app/api/preview-upgrade/route.js
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin as supabase } from '@/lib/supabaseAdmin';

const DEBUG = process.env.NODE_ENV === 'development';
const log = (...args) => DEBUG && console.log('[preview-upgrade]', ...args);

// Valid plans and billing cycles
const VALID_PLANS = ['basic', 'premium', 'fleet'];
const VALID_BILLING_CYCLES = ['monthly', 'yearly'];

export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, newPlan, newBillingCycle } = body;

    // Input validation
    if (!userId || !newPlan) {
      return NextResponse.json({
        error: 'Missing required fields'
      }, { status: 400 });
    }

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

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    // Get user's current subscription from database
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (subError || !subscription?.stripe_subscription_id) {
      return NextResponse.json({
        error: 'No active subscription found'
      }, { status: 404 });
    }

    // Get the current subscription from Stripe
    const stripeSubscription = await stripe.subscriptions.retrieve(
      subscription.stripe_subscription_id,
      { expand: ['default_payment_method', 'customer'] }
    );

    if (!stripeSubscription || stripeSubscription.status === 'canceled') {
      return NextResponse.json({
        error: 'Subscription is not active'
      }, { status: 400 });
    }

    // Get payment method details
    let paymentMethodData = null;
    const pm = stripeSubscription.default_payment_method;

    if (pm && typeof pm === 'object') {
      if (pm.type === 'card' && pm.card) {
        paymentMethodData = {
          type: 'card',
          brand: pm.card.brand,
          last4: pm.card.last4,
          expMonth: pm.card.exp_month,
          expYear: pm.card.exp_year
        };
      } else if (pm.type === 'link') {
        paymentMethodData = {
          type: 'link',
          email: pm.link?.email || stripeSubscription.customer?.email
        };
      }
    } else if (subscription.card_last_four) {
      // Fallback to stored card info
      paymentMethodData = {
        type: 'card',
        brand: 'card',
        last4: subscription.card_last_four
      };
    }

    // Get the subscription item ID
    const subscriptionItemId = stripeSubscription.items.data[0]?.id;
    if (!subscriptionItemId) {
      return NextResponse.json({
        error: 'Could not find subscription item'
      }, { status: 400 });
    }

    // Determine billing cycle
    const billingCycle = newBillingCycle || subscription.billing_cycle || 'monthly';
    const currentBillingCycle = subscription.billing_cycle || 'monthly';

    // Check if user is trying to preview the same plan with same billing cycle
    if (newPlan === subscription.plan && billingCycle === currentBillingCycle) {
      return NextResponse.json({
        error: 'You are already on this plan with this billing cycle'
      }, { status: 400 });
    }

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

    // Pricing in cents
    const pricing = {
      basic: { monthly: 2000, yearly: 19200 },
      premium: { monthly: 3500, yearly: 33600 },
      fleet: { monthly: 7500, yearly: 72000 }
    };

    // Get the configured price ID - fail if not configured
    const priceId = priceIds[newPlan]?.[billingCycle];

    if (!priceId) {
      log(`Missing price ID for ${newPlan}/${billingCycle}`);
      return NextResponse.json({
        error: `Price not configured for ${newPlan} plan with ${billingCycle} billing. Please contact support.`
      }, { status: 500 });
    }

    // Get proration preview using upcoming invoice
    let prorationData = null;
    try {
      const upcomingInvoice = await stripe.invoices.retrieveUpcoming({
        customer: stripeSubscription.customer.id || stripeSubscription.customer,
        subscription: subscription.stripe_subscription_id,
        subscription_items: [{
          id: subscriptionItemId,
          price: priceId
        }],
        subscription_proration_behavior: 'create_prorations'
      });

      // Calculate proration details using our known pricing (more reliable than Stripe's calculated amounts)
      const currentPlanPriceCents = pricing[subscription.plan]?.[subscription.billing_cycle] || 0;
      const newPlanPriceCents = pricing[newPlan][billingCycle];

      // Calculate days remaining in current period (using days for cleaner math)
      const now = Math.floor(Date.now() / 1000);
      const periodEnd = stripeSubscription.current_period_end;
      const periodStart = stripeSubscription.current_period_start;
      const totalDays = Math.round((periodEnd - periodStart) / 86400);
      const daysRemaining = Math.max(0, Math.round((periodEnd - now) / 86400));

      // Calculate credit for unused time on current plan
      // Credit = current plan price × (days remaining / total days)
      // Round to nearest dollar to avoid cents issues (e.g., $191.99 -> $192)
      const rawCreditCents = (currentPlanPriceCents * daysRemaining) / totalDays;
      const creditCents = Math.round(rawCreditCents / 100) * 100; // Round to nearest dollar

      // The charge is the full new plan price (yearly plans charge full year upfront)
      const chargeCents = newPlanPriceCents;

      // Amount due = new plan charge - credit for unused time
      const amountDueCents = Math.max(0, chargeCents - creditCents);

      // Calculate next billing date based on NEW plan's billing cycle
      // When upgrading, the new period starts today
      const nextBillingDate = new Date();
      if (billingCycle === 'yearly') {
        nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
      } else {
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
      }

      // Convert cents to dollars with proper rounding
      prorationData = {
        currentPlan: subscription.plan,
        currentPlanPrice: currentPlanPriceCents / 100,
        newPlan: newPlan,
        newPlanPrice: newPlanPriceCents / 100,
        billingCycle: billingCycle,
        credit: creditCents / 100,
        charge: chargeCents / 100,
        amountDueNow: amountDueCents / 100,
        daysRemaining: daysRemaining,
        totalDays: totalDays,
        nextBillingDate: nextBillingDate.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        })
      };
    } catch (invoiceErr) {
      log('Error getting proration preview:', invoiceErr);
      // Fallback calculation - assume full period remaining for simplicity
      const currentPlanPriceCents = pricing[subscription.plan]?.[subscription.billing_cycle] || 0;
      const newPlanPriceCents = pricing[newPlan][billingCycle];

      // Estimate credit as full current plan price (conservative estimate)
      const creditCents = currentPlanPriceCents;
      const chargeCents = newPlanPriceCents;
      const amountDueCents = Math.max(0, chargeCents - creditCents);

      // Calculate next billing date
      const nextBillingDate = new Date();
      if (billingCycle === 'yearly') {
        nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
      } else {
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
      }

      prorationData = {
        currentPlan: subscription.plan,
        currentPlanPrice: currentPlanPriceCents / 100,
        newPlan: newPlan,
        newPlanPrice: newPlanPriceCents / 100,
        billingCycle: billingCycle,
        credit: creditCents / 100,
        charge: chargeCents / 100,
        amountDueNow: amountDueCents / 100,
        nextBillingDate: nextBillingDate.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        }),
        estimatedOnly: true
      };
    }

    return NextResponse.json({
      success: true,
      proration: prorationData,
      paymentMethod: paymentMethodData,
      customerId: stripeSubscription.customer.id || stripeSubscription.customer,
      // Include cancellation status so UI can show appropriate notice
      isCanceledAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      cancelAt: stripeSubscription.cancel_at ? new Date(stripeSubscription.cancel_at * 1000).toISOString() : null
    });

  } catch (error) {
    log('Error previewing upgrade:', error);
    return NextResponse.json({
      error: error.message || 'Failed to preview upgrade'
    }, { status: 500 });
  }
}
