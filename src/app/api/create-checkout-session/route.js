import { NextResponse } from 'next/server';
import stripe from '@/lib/stripe';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request) {
  try {
    const { userId, plan, billingCycle, returnUrl } = await request.json();
    
    if (!userId || !plan || !billingCycle) {
      return NextResponse.json({ 
        error: 'Missing required parameters' 
      }, { status: 400 });
    }

    // Get user from supabase
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
    
    if (userError || !userData?.user) {
      return NextResponse.json({ 
        error: 'User not found' 
      }, { status: 404 });
    }

    const email = userData.user.email;

    // Define the plan details
    const plans = {
      basic: {
        name: "Basic Plan",
        monthlyPrice: 19,
        yearlyPrice: 16,
        features: "Basic features for owner-operators with 1 truck"
      },
      premium: {
        name: "Premium Plan",
        monthlyPrice: 39,
        yearlyPrice: 33,
        features: "Advanced features for owner-operators with 1-2 trucks"
      },
      fleet: {
        name: "Fleet Plan",
        monthlyPrice: 69,
        yearlyPrice: 55,
        features: "Full features for small fleets with 3-8 trucks"
      }
    };

    const selectedPlan = plans[plan];
    if (!selectedPlan) {
      return NextResponse.json({ 
        error: 'Invalid plan selected' 
      }, { status: 400 });
    }

    // Calculate amount based on billing cycle
    const unitAmount = billingCycle === 'yearly' 
      ? selectedPlan.yearlyPrice * 100 // Convert to cents
      : selectedPlan.monthlyPrice * 100;
    
    // Calculate quantity (months) based on billing cycle
    const quantity = billingCycle === 'yearly' ? 12 : 1;

    // Find or create a Stripe customer
    let customerId;
    
    // Check if user already has a Stripe customer ID
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single();
    
    if (subscription?.stripe_customer_id) {
      customerId = subscription.stripe_customer_id;
    } else {
      // Create a new customer in Stripe
      const customer = await stripe.customers.create({
        email,
        metadata: {
          userId
        }
      });
      customerId = customer.id;
      
      // Save the Stripe customer ID to the user's subscription record
      await supabase
        .from('subscriptions')
        .upsert({
          user_id: userId,
          stripe_customer_id: customerId,
          updated_at: new Date().toISOString()
        });
    }

    // Create a checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: selectedPlan.name,
              description: `${billingCycle === 'yearly' ? 'Annual' : 'Monthly'} subscription to ${selectedPlan.name}`,
            },
            unit_amount: unitAmount,
            recurring: {
              interval: billingCycle === 'yearly' ? 'year' : 'month',
              interval_count: 1,
            },
          },
          quantity: quantity,
        },
      ],
      mode: 'subscription',
      success_url: `${returnUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${returnUrl}?canceled=true`,
      metadata: {
        userId,
        plan,
        billingCycle
      },
    });

    return NextResponse.json({ url: session.url });
    
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to create checkout session' 
    }, { status: 500 });
  }
}