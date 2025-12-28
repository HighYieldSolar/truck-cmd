// src/app/api/create-subscription-intent/route.js
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const DEBUG = process.env.NODE_ENV === 'development';
const log = (...args) => DEBUG && console.log('[create-subscription-intent]', ...args);

// Helper to check if user is on valid trial
function isValidTrial(subscription) {
  if (!subscription) return false;
  if (subscription.status !== 'trialing') return false;
  if (!subscription.trial_ends_at) return false;

  const now = new Date();
  const trialEnd = new Date(subscription.trial_ends_at);
  return trialEnd > now;
}

// Valid plans and billing cycles
const VALID_PLANS = ['basic', 'premium', 'fleet'];
const VALID_BILLING_CYCLES = ['monthly', 'yearly'];

export async function POST(request) {
  try {
    const body = await request.json();

    // Initialize Stripe early so it's available throughout
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    // Check for required fields
    if (!body.userId || !body.plan || !body.billingCycle) {
      return NextResponse.json({
        error: 'Missing required fields',
        details: { received: body }
      }, { status: 400 });
    }

    const { userId, plan, billingCycle, email, couponCode } = body;

    // Input validation
    if (!VALID_PLANS.includes(plan)) {
      return NextResponse.json({
        error: 'Invalid plan. Must be basic, premium, or fleet.'
      }, { status: 400 });
    }

    if (!VALID_BILLING_CYCLES.includes(billingCycle)) {
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

    // Get user email - prefer the email passed from client (from auth session)
    let userEmail = email;

    // If no email passed, try to get from database
    if (!userEmail) {
      try {
        // First try users table
        const { data: userData, error: userError } = await supabaseAdmin
          .from('users')
          .select('email, full_name')
          .eq('id', userId)
          .single();

        if (!userError && userData?.email) {
          userEmail = userData.email;
        } else {
          // Try auth.users via admin API
          try {
            const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);
            if (authUser?.user?.email) {
              userEmail = authUser.user.email;
            }
          } catch (authErr) {
            // Continue without auth email
          }
        }
      } catch (err) {
        // Continue without email
      }
    }

    // If still no email, try to get from subscriptions table (might have been stored there)
    if (!userEmail) {
      try {
        const { data: subData } = await supabaseAdmin
          .from('subscriptions')
          .select('stripe_customer_id')
          .eq('user_id', userId)
          .single();

        if (subData?.stripe_customer_id) {
          // Get email from Stripe customer
          const customer = await stripe.customers.retrieve(subData.stripe_customer_id);
          if (customer && !customer.deleted && customer.email) {
            userEmail = customer.email;
          }
        }
      } catch (subErr) {
        // Continue
      }
    }

    if (!userEmail) {
      return NextResponse.json({
        error: 'User email not found. Please ensure your profile is complete or try logging in again.'
      }, { status: 400 });
    }

    // Check for existing subscription - include trial info to preserve it
    const { data: existingSub } = await supabaseAdmin
      .from('subscriptions')
      .select('stripe_customer_id, stripe_subscription_id, status, checkout_initiated_at, trial_ends_at, plan')
      .eq('user_id', userId)
      .single();

    // Check if user is on a valid trial (we'll preserve this if they abandon checkout)
    const userOnTrial = isValidTrial(existingSub);

    // Check if user already has an active subscription
    if (existingSub?.status === 'active' && existingSub?.stripe_subscription_id) {
      return NextResponse.json({
        error: 'You already have an active subscription. Please use the upgrade/downgrade options.'
      }, { status: 400 });
    }

    // Race condition prevention: Check if checkout was initiated in last 30 seconds
    if (existingSub?.checkout_initiated_at) {
      const initiatedAt = new Date(existingSub.checkout_initiated_at);
      const now = new Date();
      const secondsAgo = (now - initiatedAt) / 1000;

      if (secondsAgo < 30) {
        // Check if there's already an incomplete subscription in Stripe for this user
        const recentSubs = await stripe.subscriptions.list({
          limit: 5,
          status: 'incomplete'
        });

        const existingIncompleteSub = recentSubs.data.find(
          sub => sub.metadata?.userId === userId
        );

        if (existingIncompleteSub) {
          // Return the existing incomplete subscription's client secret
          const invoice = await stripe.invoices.retrieve(existingIncompleteSub.latest_invoice);
          const paymentIntent = await stripe.paymentIntents.retrieve(invoice.payment_intent);

          return NextResponse.json({
            clientSecret: paymentIntent.client_secret,
            subscriptionId: existingIncompleteSub.id,
            customerId: existingIncompleteSub.customer
          });
        }
      }
    }

    // Mark checkout as initiated to prevent race conditions
    await supabaseAdmin
      .from('subscriptions')
      .upsert({
        user_id: userId,
        checkout_initiated_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    // Get or create Stripe customer
    let customerId = existingSub?.stripe_customer_id;

    if (!customerId) {
      // Check if customer already exists in Stripe by email
      const existingCustomers = await stripe.customers.list({
        email: userEmail,
        limit: 1
      });

      if (existingCustomers.data.length > 0) {
        customerId = existingCustomers.data[0].id;
      } else {
        // Create new customer
        const customer = await stripe.customers.create({
          email: userEmail,
          metadata: {
            userId: userId
          }
        });
        customerId = customer.id;
      }

      // Save customer ID to database
      await supabaseAdmin
        .from('subscriptions')
        .upsert({
          user_id: userId,
          stripe_customer_id: customerId,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
    }

    // Map plan and billing cycle to price IDs
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
    const priceId = priceIds[plan]?.[billingCycle];

    if (!priceId) {
      log(`Missing price ID for ${plan}/${billingCycle}`);
      return NextResponse.json({
        error: `Price not configured for ${plan} plan with ${billingCycle} billing. Please contact support.`
      }, { status: 500 });
    }

    // Validate price ID format
    if (!priceId.startsWith('price_')) {
      log(`Invalid price ID format for ${plan}/${billingCycle}: ${priceId}`);
      return NextResponse.json({
        error: 'Invalid price configuration. Please contact support.',
        code: 'INVALID_PRICE_ID'
      }, { status: 500 });
    }

    // Check for test/live mode mismatch (test keys start with sk_test, live with sk_live)
    const isTestMode = process.env.STRIPE_SECRET_KEY?.startsWith('sk_test');
    const isTestPriceId = priceId.includes('test');
    log(`Mode check: API ${isTestMode ? 'test' : 'live'}, Price ID: ${priceId.substring(0, 20)}...`);

    // Create the subscription with payment_behavior: 'default_incomplete'
    // This creates the subscription but leaves it incomplete until payment is confirmed
    const subscriptionParams = {
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription',
        payment_method_types: ['card', 'link']
      },
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        userId,
        plan,
        billingCycle
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
            try {
              coupon = await stripe.coupons.retrieve(couponCode.trim().toUpperCase());
            } catch (upperErr) {
              // Coupon not found with either case
              return NextResponse.json({
                error: 'Invalid coupon code. Please check the code and try again.',
                code: 'INVALID_COUPON'
              }, { status: 400 });
            }
          } else {
            throw exactErr;
          }
        }

        if (!coupon || !coupon.valid) {
          return NextResponse.json({
            error: 'This coupon has expired or is no longer valid.',
            code: 'EXPIRED_COUPON'
          }, { status: 400 });
        }

        subscriptionParams.coupon = coupon.id;
        appliedCoupon = {
          id: coupon.id,
          name: coupon.name,
          percentOff: coupon.percent_off,
          amountOff: coupon.amount_off ? coupon.amount_off / 100 : null
        };
      } catch (couponError) {
        log('Coupon validation error:', couponCode, couponError.message);
        return NextResponse.json({
          error: 'Unable to validate coupon. Please try again.',
          code: 'COUPON_ERROR'
        }, { status: 400 });
      }
    }

    let subscription;
    try {
      subscription = await stripe.subscriptions.create(subscriptionParams);
    } catch (stripeError) {
      log('Stripe subscription creation failed:', stripeError.message, stripeError.code);
      return NextResponse.json({
        error: `Failed to create subscription: ${stripeError.message}`,
        code: stripeError.code || 'STRIPE_ERROR'
      }, { status: 500 });
    }

    // Get the client secret from the payment intent
    const clientSecret = subscription.latest_invoice?.payment_intent?.client_secret;

    if (!clientSecret) {
      // Log detailed info to help debug live mode issues
      log('No client secret found. Subscription details:', {
        subscriptionId: subscription.id,
        status: subscription.status,
        hasInvoice: !!subscription.latest_invoice,
        invoiceId: subscription.latest_invoice?.id,
        hasPaymentIntent: !!subscription.latest_invoice?.payment_intent,
        paymentIntentId: typeof subscription.latest_invoice?.payment_intent === 'string'
          ? subscription.latest_invoice.payment_intent
          : subscription.latest_invoice?.payment_intent?.id,
        priceId: priceId
      });

      // Try to retrieve the payment intent if it's just an ID string
      if (subscription.latest_invoice?.payment_intent && typeof subscription.latest_invoice.payment_intent === 'string') {
        try {
          const paymentIntent = await stripe.paymentIntents.retrieve(subscription.latest_invoice.payment_intent);
          if (paymentIntent.client_secret) {
            log('Retrieved client secret from payment intent');
            return NextResponse.json({
              clientSecret: paymentIntent.client_secret,
              subscriptionId: subscription.id,
              customerId,
              appliedCoupon,
              amountDue: subscription.latest_invoice?.amount_due ? Math.round(subscription.latest_invoice.amount_due) / 100 : null
            });
          }
        } catch (piError) {
          log('Failed to retrieve payment intent:', piError.message);
        }
      }

      return NextResponse.json({
        error: 'Unable to create payment intent. Please check that Stripe price IDs are correctly configured for this environment.',
        details: process.env.NODE_ENV === 'development' ? {
          subscriptionStatus: subscription.status,
          hasInvoice: !!subscription.latest_invoice,
          priceId
        } : undefined
      }, { status: 500 });
    }

    // IMPORTANT: Preserve trial status if user is on a valid trial
    // We only store the Stripe subscription ID for reference
    // The status will be updated to 'active' by the webhook when payment succeeds
    // This prevents breaking the user's trial if they visit checkout but don't complete payment

    if (userOnTrial) {
      // User is on trial - ONLY update Stripe IDs, keep trial status intact
      // The webhook will update status to 'active' when payment succeeds
      log('User is on trial - preserving trial status while storing Stripe subscription ID');
      await supabaseAdmin
        .from('subscriptions')
        .update({
          stripe_customer_id: customerId,
          stripe_subscription_id: subscription.id,
          checkout_initiated_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
    } else {
      // User is NOT on trial - update with incomplete status as normal
      await supabaseAdmin
        .from('subscriptions')
        .upsert({
          user_id: userId,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscription.id,
          plan: plan,
          billing_cycle: billingCycle,
          status: 'incomplete',
          amount: Math.round(pricing[plan][billingCycle]) / 100,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
    }

    return NextResponse.json({
      clientSecret,
      subscriptionId: subscription.id,
      customerId,
      appliedCoupon,
      amountDue: subscription.latest_invoice?.amount_due ? Math.round(subscription.latest_invoice.amount_due) / 100 : null
    });

  } catch (error) {
    log('Error creating subscription intent:', error);
    return NextResponse.json({
      error: error.message || 'An error occurred while creating subscription'
    }, { status: 500 });
  }
}
